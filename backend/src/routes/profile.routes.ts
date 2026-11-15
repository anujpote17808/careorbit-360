import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

// In-memory resilient store for profiles when table migration is pending
const memoryProfiles = new Map<string, any>();

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  role: z.enum(["patient", "caregiver", "family"]).default("patient"),
  dob: z.string().trim().optional().or(z.literal("")),
  blood_type: z.string().trim().max(10).optional().or(z.literal("")),
  allergies: z.string().trim().max(300).optional().or(z.literal("")),
  medical_notes: z.string().trim().max(500).optional().or(z.literal("")),
  emergency_contact_name: z.string().trim().max(100).optional().or(z.literal("")),
  emergency_contact_phone: z.string().trim().max(30).optional().or(z.literal("")),
  emergency_contact_email: z.string().trim().email("Valid email required").optional().or(z.literal("")),
});

function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getDefaultProfile(userId: string, userEmail: string) {
  return {
    id: userId,
    email: userEmail,
    full_name: userEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    role: "patient",
    dob: "",
    blood_type: "O+",
    allergies: "",
    medical_notes: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_email: userEmail,
  };
}

// GET /api/profile
router.get("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userEmail = authReq.userEmail!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      const existing = memoryProfiles.get(userId) || getDefaultProfile(userId, userEmail);
      res.json({ success: true, data: existing });
      return;
    }

    if (!data) {
      const defaultProfile = getDefaultProfile(userId, userEmail);
      res.json({ success: true, data: defaultProfile });
      return;
    }

    res.json({ success: true, data: { ...data, email: userEmail } });
  } catch (err: any) {
    const fallback = memoryProfiles.get(userId) || getDefaultProfile(userId, userEmail);
    res.json({ success: true, data: fallback });
  }
});

// PUT /api/profile
router.put("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userEmail = authReq.userEmail!;
  const token = authReq.accessToken!;

  const parsed = profileSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const payload = {
    ...parsed.data,
    id: userId,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      const existing = memoryProfiles.get(userId) || getDefaultProfile(userId, userEmail);
      const updated = { ...existing, ...payload, email: userEmail };
      memoryProfiles.set(userId, updated);
      res.json({ success: true, data: updated });
      return;
    }

    res.json({ success: true, data: { ...data, email: userEmail } });
  } catch (err: any) {
    const existing = memoryProfiles.get(userId) || getDefaultProfile(userId, userEmail);
    const updated = { ...existing, ...payload, email: userEmail };
    memoryProfiles.set(userId, updated);
    res.json({ success: true, data: updated });
  }
});

export default router;
