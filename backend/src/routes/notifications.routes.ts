import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

const notificationSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  message: z.string().trim().min(1, "Message is required").max(500),
  type: z.enum(["medication", "appointment", "emergency", "caregiver", "system"]).default("system"),
});

function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// GET /api/notifications
router.get("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.code === "PGRST205" ? "Please apply supabase/schema.sql in Supabase SQL editor" : undefined,
      });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load notifications" });
  }
});

// POST /api/notifications — Creates a notification for the user
router.post("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Validation failed" });
    return;
  }

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: parsed.data.title,
        message: parsed.data.message,
        type: parsed.data.type,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to create notification" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to mark notification as read" });
  }
});

// POST /api/notifications/mark-all-read
router.post("/mark-all-read", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to update notifications" });
  }
});

export default router;
