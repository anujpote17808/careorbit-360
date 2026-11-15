import type { Request, Response, NextFunction } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export type AuthenticatedRequest = Request & {
  userId?: string;
  userEmail?: string;
  accessToken?: string;
};

// Singleton auth verification client
let authClient: SupabaseClient | null = null;

function getAuthClient(): SupabaseClient {
  if (!authClient) {
    authClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "X-Client-Info": "careorbit-360-backend-auth",
        },
      },
    });
  }
  return authClient;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Read authorization header.
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Authentication required. Please sign in.",
      });
      return;
    }

    // 2. Extract access token.
    const token = authorization.slice(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Missing authentication token.",
      });
      return;
    }

    // 3. Verify Supabase configuration.
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error(
        "AUTH CONFIGURATION ERROR: Supabase URL or client key is missing.",
      );

      res.status(503).json({
        success: false,
        error: "Authentication service is not configured.",
      });
      return;
    }

    // 4. Verify token with Supabase Auth.
    const supabase = getAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    // 5. Handle verification errors safely.
    if (error) {
      console.error("SUPABASE TOKEN VERIFICATION FAILED:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      // Token format or signature error, expired token, or unauthorized
      const isClientAuthError =
        error.status === 400 ||
        error.status === 401 ||
        error.status === 403 ||
        error.name === "AuthSessionMissingError" ||
        error.name === "AuthApiError";

      if (isClientAuthError) {
        res.status(401).json({
          success: false,
          error: "Your session is invalid or expired. Please sign in again.",
        });
        return;
      }

      res.status(503).json({
        success: false,
        error: "Unable to verify your session with the authentication service. Please try again.",
      });
      return;
    }

    if (!user) {
      console.error("SUPABASE AUTH ERROR: Token verification returned no user.");

      res.status(401).json({
        success: false,
        error: "No authenticated user was found. Please sign in again.",
      });
      return;
    }

    // 6. Validate authenticated account details.
    if (!user.id || !user.email) {
      console.error("SUPABASE AUTH ERROR: Authenticated user details are incomplete.");

      res.status(401).json({
        success: false,
        error: "Authenticated account details are incomplete.",
      });
      return;
    }

    // 7. Attach verified identity to request.
    req.userId = user.id;
    req.userEmail = user.email;
    req.accessToken = token;

    // Diagnostic logging without sensitive data
    console.log("AUTH SUCCESS:", {
      userId: user.id,
      emailDomain: user.email.includes("@") ? user.email.split("@")[1] : "unknown",
    });

    // 8. Continue to route.
    next();
  } catch (error) {
    console.error(
      "AUTHENTICATION MIDDLEWARE ERROR:",
      error instanceof Error ? error.message : "Unknown error",
    );

    res.status(503).json({
      success: false,
      error: "Unable to verify your session. Please try again.",
    });
  }
}
