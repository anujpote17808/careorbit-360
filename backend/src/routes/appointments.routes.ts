import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

const appointmentSchema = z.object({
  doctor_name: z.string().trim().min(1, "Doctor name is required").max(100),
  specialty: z.string().trim().max(100).optional(),
  clinic_name: z.string().trim().min(1, "Clinic/hospital name is required").max(120),
  scheduled_at: z.string().datetime("Valid ISO scheduled date and time required"),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
});

// Helper to get authenticated Supabase client enforcing RLS
function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// GET /api/appointments
router.get("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: true });

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
    res.status(500).json({ success: false, error: err.message || "Failed to load appointments" });
  }
});

// POST /api/appointments
router.post("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const payload = {
    user_id: userId,
    doctor_name: parsed.data.doctor_name,
    specialty: parsed.data.specialty || "General Medicine",
    clinic_name: parsed.data.clinic_name,
    scheduled_at: parsed.data.scheduled_at,
    notes: parsed.data.notes || "",
    status: parsed.data.status,
  };

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("appointments")
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
    res.status(500).json({ success: false, error: err.message || "Failed to save appointment" });
  }
});

// PUT /api/appointments/:id
router.put("/:id", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  const parsed = appointmentSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Validation failed" });
    return;
  }

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("appointments")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    if (!data) {
      res.status(404).json({ success: false, error: "Appointment not found" });
      return;
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Could not update appointment" });
  }
});

// DELETE /api/appointments/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  try {
    const supabase = getAuthedClient(token);
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.json({ success: true, message: "Appointment deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Could not delete appointment" });
  }
});

export default router;
