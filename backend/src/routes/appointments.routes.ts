import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

// In-memory fallback store in case table hasn't been migrated in Supabase yet
interface LocalAppointment {
  id: string;
  user_id: string;
  doctor_name: string;
  specialty?: string;
  clinic_name: string;
  scheduled_at: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

const localAppointmentsStore = new Map<string, LocalAppointment[]>();

const appointmentSchema = z.object({
  doctor_name: z.string().min(1, "Doctor name is required").max(100),
  specialty: z.string().max(100).optional(),
  clinic_name: z.string().min(1, "Clinic/hospital name is required").max(120),
  scheduled_at: z.string().datetime("Valid ISO scheduled date and time required"),
  notes: z.string().max(500).optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
});

// Helper to get authenticated client
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

    if (!error && data) {
      res.json({ success: true, data });
      return;
    }

    // Fallback if table doesn't exist yet
    const local = localAppointmentsStore.get(userId) || [];
    res.json({ success: true, data: local, source: "fallback" });
  } catch (err: any) {
    const local = localAppointmentsStore.get(userId) || [];
    res.json({ success: true, data: local, source: "fallback" });
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

    if (!error && data) {
      res.status(201).json({ success: true, data });
      return;
    }

    // Fallback
    const localItem: LocalAppointment = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const list = localAppointmentsStore.get(userId) || [];
    list.push(localItem);
    localAppointmentsStore.set(userId, list);

    res.status(201).json({ success: true, data: localItem, source: "fallback" });
  } catch (err: any) {
    const localItem: LocalAppointment = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const list = localAppointmentsStore.get(userId) || [];
    list.push(localItem);
    localAppointmentsStore.set(userId, list);

    res.status(201).json({ success: true, data: localItem, source: "fallback" });
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

    if (!error && data) {
      res.json({ success: true, data });
      return;
    }

    // Fallback
    const list = localAppointmentsStore.get(userId) || [];
    const index = list.findIndex((a) => a.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...parsed.data };
      localAppointmentsStore.set(userId, list);
      res.json({ success: true, data: list[index] });
      return;
    }

    res.status(404).json({ success: false, error: "Appointment not found" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Could not update appointment" });
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

    if (!error) {
      res.json({ success: true, message: "Appointment deleted" });
      return;
    }

    // Fallback
    const list = localAppointmentsStore.get(userId) || [];
    localAppointmentsStore.set(
      userId,
      list.filter((a) => a.id !== id),
    );
    res.json({ success: true, message: "Appointment deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Could not delete appointment" });
  }
});

export default router;

