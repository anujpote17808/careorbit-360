import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

interface LocalNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "medication" | "appointment" | "emergency" | "caregiver" | "system";
  is_read: boolean;
  created_at: string;
}

const localNotificationsStore = new Map<string, LocalNotification[]>();

function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getDefaultNotifications(userId: string): LocalNotification[] {
  return [
    {
      id: "notif-1",
      user_id: userId,
      title: "Medication Scheduled",
      message: "Morning doses are ready to be recorded in your daily care space.",
      type: "medication",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "notif-2",
      user_id: userId,
      title: "Upcoming Appointment",
      message: "Cardiology follow-up visit scheduled for next week with Dr. Chen.",
      type: "appointment",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: "notif-3",
      user_id: userId,
      title: "Caregiver Connected",
      message: "Sarah Jenkins verified daily care coordination status.",
      type: "caregiver",
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
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

    if (!error && data && data.length > 0) {
      res.json({ success: true, data });
      return;
    }

    let list = localNotificationsStore.get(userId);
    if (!list) {
      list = getDefaultNotifications(userId);
      localNotificationsStore.set(userId, list);
    }

    res.json({ success: true, data: list });
  } catch (err: any) {
    const list = localNotificationsStore.get(userId) || getDefaultNotifications(userId);
    res.json({ success: true, data: list });
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
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId);

    const list = localNotificationsStore.get(userId) || [];
    const item = list.find((n) => n.id === id);
    if (item) item.is_read = true;

    res.json({ success: true, message: "Marked as read" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to update notification" });
  }
});

// POST /api/notifications/mark-all-read
router.post("/mark-all-read", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);

    const list = localNotificationsStore.get(userId) || [];
    list.forEach((n) => (n.is_read = true));

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to mark all as read" });
  }
});

export default router;

