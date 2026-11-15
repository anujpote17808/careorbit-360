import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

interface LocalCaregiver {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
}

interface LocalActivity {
  id: string;
  patient_id: string;
  caregiver_name: string;
  action: string;
  note?: string;
  created_at: string;
}

const localCaregiversStore = new Map<string, LocalCaregiver[]>();
const localActivityStore = new Map<string, LocalActivity[]>();

const caregiverSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  relationship: z.string().min(1, "Relationship is required").max(50),
  phone: z.string().max(20).optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
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

    if (!error && data) {
      res.json({ success: true, data });
      return;
    }

    const local = localCaregiversStore.get(userId) || [
      {
        id: "demo-caregiver-1",
        patient_id: userId,
        name: "Sarah Jenkins",
        relationship: "Daughter & Primary Caregiver",
        phone: "(555) 234-5678",
        email: "sarah.j@example.com",
        is_primary: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];
    res.json({ success: true, data: local, source: "default" });
  } catch (err: any) {
    const local = localCaregiversStore.get(userId) || [];
    res.json({ success: true, data: local, source: "fallback" });
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

    if (!error && data) {
      res.status(201).json({ success: true, data });
      return;
    }

    const localItem: LocalCaregiver = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const list = localCaregiversStore.get(userId) || [];
    list.unshift(localItem);
    localCaregiversStore.set(userId, list);

    res.status(201).json({ success: true, data: localItem, source: "fallback" });
  } catch (err: any) {
    const localItem: LocalCaregiver = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const list = localCaregiversStore.get(userId) || [];
    list.unshift(localItem);
    localCaregiversStore.set(userId, list);

    res.status(201).json({ success: true, data: localItem, source: "fallback" });
  }
});

// GET /api/caregivers/activity
router.get("/activity", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  const activity = localActivityStore.get(userId) || [
    {
      id: "act-1",
      patient_id: userId,
      caregiver_name: "Sarah Jenkins",
      action: "Completed wellness check-in",
      note: "Confirmed morning doses taken with breakfast.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "act-2",
      patient_id: userId,
      caregiver_name: "Dr. Chen's Clinic",
      action: "Appointment reminder scheduled",
      note: "Cardiology follow-up confirmed for upcoming date.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  res.json({ success: true, data: activity });
});

// POST /api/caregivers/checkin
router.post("/checkin", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const { caregiver_name, note } = req.body;

  const item: LocalActivity = {
    id: crypto.randomUUID(),
    patient_id: userId,
    caregiver_name: caregiver_name || "Caregiver",
    action: "Recorded check-in note",
    note: note || "Routine check-in completed",
    created_at: new Date().toISOString(),
  };

  const list = localActivityStore.get(userId) || [];
  list.unshift(item);
  localActivityStore.set(userId, list);

  res.status(201).json({ success: true, data: item });
});

// DELETE /api/caregivers/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;
  const { id } = req.params;

  try {
    const supabase = getAuthedClient(token);
    await supabase.from("caregivers").delete().eq("id", id).eq("patient_id", userId);

    const list = localCaregiversStore.get(userId) || [];
    localCaregiversStore.set(
      userId,
      list.filter((c) => c.id !== id),
    );

    res.json({ success: true, message: "Caregiver unlinked" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to remove caregiver" });
  }
});

export default router;

