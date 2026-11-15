import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

const medicationSchema = z.object({
  name: z.string().trim().min(1, "Medication name is required").max(100),
  dosage: z.string().trim().min(1, "Dosage is required").max(50),
  scheduled_time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Scheduled time must be HH:MM format (24-hour)"),
  frequency: z.string().trim().max(100).optional(),
  instructions: z.string().trim().max(500).optional(),
  is_active: z.boolean().default(true),
});

const doseSchema = z.object({
  status: z.enum(["taken", "missed"]),
  scheduled_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// GET /api/medications — Lists all active medications for authenticated user + today's dose status
router.get("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    const today = getLocalDateString();

    const { data: meds, error: medsError } = await supabase
      .from("medications")
      .select("id, name, dosage, scheduled_time, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("scheduled_time");

    if (medsError) {
      res.status(500).json({ success: false, error: medsError.message, code: medsError.code });
      return;
    }

    const { data: logs, error: logsError } = await supabase
      .from("medication_dose_logs")
      .select("medication_id, status")
      .eq("user_id", userId)
      .eq("scheduled_date", today);

    if (logsError) {
      res.status(500).json({ success: false, error: logsError.message, code: logsError.code });
      return;
    }

    const logMap = new Map<string, "taken" | "missed">();
    (logs || []).forEach((l) => {
      if (l.status === "taken" || l.status === "missed") {
        logMap.set(l.medication_id, l.status);
      }
    });

    const data = (meds || []).map((m) => ({
      ...m,
      doseStatus: logMap.get(m.id) ?? null,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to retrieve medications" });
  }
});

// POST /api/medications — Adds a new medication
router.post("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  const parsed = medicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("medications")
      .insert({
        user_id: userId,
        name: parsed.data.name,
        dosage: parsed.data.dosage,
        scheduled_time: parsed.data.scheduled_time,
        is_active: parsed.data.is_active,
      })
      .select("id, name, dosage, scheduled_time, is_active")
      .single();

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to create medication" });
  }
});

// PUT /api/medications/:id — Updates an existing medication
router.put("/:id", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  const parsed = medicationSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Validation failed" });
    return;
  }

  const updates: Record<string, any> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.dosage !== undefined) updates.dosage = parsed.data.dosage;
  if (parsed.data.scheduled_time !== undefined) updates.scheduled_time = parsed.data.scheduled_time;
  if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;

  try {
    const supabase = getAuthedClient(token);
    const { data, error } = await supabase
      .from("medications")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, name, dosage, scheduled_time, is_active")
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    if (!data) {
      res.status(404).json({ success: false, error: "Medication not found" });
      return;
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to update medication" });
  }
});

// DELETE /api/medications/:id — Deactivates or removes a medication
router.delete("/:id", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  try {
    const supabase = getAuthedClient(token);
    const { error } = await supabase
      .from("medications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.json({ success: true, message: "Medication deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to delete medication" });
  }
});

// POST /api/medications/:id/dose — Records today's dose status (taken/missed)
router.post("/:id/dose", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  const parsed = doseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Status must be 'taken' or 'missed'" });
    return;
  }

  const scheduledDate = parsed.data.scheduled_date || getLocalDateString();

  try {
    const supabase = getAuthedClient(token);

    // Verify medication ownership first
    const { data: med, error: medErr } = await supabase
      .from("medications")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (medErr || !med) {
      res.status(404).json({ success: false, error: "Medication not found" });
      return;
    }

    const { data, error } = await supabase
      .from("medication_dose_logs")
      .upsert(
        {
          medication_id: id,
          user_id: userId,
          scheduled_date: scheduledDate,
          status: parsed.data.status,
          recorded_at: new Date().toISOString(),
        },
        { onConflict: "medication_id,scheduled_date" },
      )
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
      return;
    }

    res.json({ success: true, data, message: `Dose marked as ${parsed.data.status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to record dose" });
  }
});

export default router;
