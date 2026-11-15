import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

const caregiverSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  relationship: z.string().trim().min(1, "Relationship is required").max(50),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Valid email required").optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
});

const checkinSchema = z.object({
  caregiver_name: z.string().trim().min(1, "Caregiver name is required").max(100),
  note: z.string().trim().min(1, "Note is required").max(500),
});

function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// GET /api/caregivers
router.get("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("caregivers")
      .select("*")
      .eq("patient_id", userId)
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
    res.status(500).json({ success: false, error: err.message || "Failed to load caregivers" });
  }
});

// POST /api/caregivers
router.post("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  const parsed = caregiverSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const payload = {
    patient_id: userId,
    name: parsed.data.name,
    relationship: parsed.data.relationship,
    phone: parsed.data.phone || "",
    email: parsed.data.email || "",
    is_primary: parsed.data.is_primary,
  };

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("caregivers")
      .insert(payload)
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.code === "PGRST205" ? "Please apply supabase/schema.sql in Supabase SQL editor" : undefined,
      });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to save caregiver" });
  }
});

// DELETE /api/caregivers/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  try {
    const supabase = getAuthedClient(token);
    const { error } = await supabase
      .from("caregivers")
      .delete()
      .eq("id", id)
      .eq("patient_id", userId);

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.json({ success: true, message: "Caregiver removed" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to remove caregiver" });
  }
});

// GET /api/caregivers/activity
router.get("/activity", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("caregiver_activities")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

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
    res.status(500).json({ success: false, error: err.message || "Failed to load activity" });
  }
});

// POST /api/caregivers/checkin
router.post("/checkin", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Validation failed" });
    return;
  }

  const payload = {
    patient_id: userId,
    caregiver_name: parsed.data.caregiver_name,
    action: "Caregiver Visit & Check-in",
    note: parsed.data.note,
  };

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("caregiver_activities")
      .insert(payload)
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.code === "PGRST205" ? "Please apply supabase/schema.sql in Supabase SQL editor" : undefined,
      });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to record checkin" });
  }
});

export default router;
