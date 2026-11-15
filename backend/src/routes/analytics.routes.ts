import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { env } from "../config/env.js";

const router = Router();

function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// GET /api/analytics/adherence
router.get("/adherence", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const token = authReq.accessToken!;

  try {
    const supabase = getAuthedClient(token);

    // 1. Fetch user's active medications
    const { data: meds, error: medsError } = await supabase
      .from("medications")
      .select("id, name, scheduled_time, is_active")
      .eq("user_id", userId)
      .eq("is_active", true);

    const totalScheduledMeds = meds?.length || 0;

    // 2. Fetch dose logs for the last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const todayStr = formatDate(today);
    const startDateStr = formatDate(sevenDaysAgo);

    const { data: doseLogs } = await supabase
      .from("medication_dose_logs")
      .select("id, medication_id, status, scheduled_date")
      .eq("user_id", userId)
      .gte("scheduled_date", startDateStr)
      .lte("scheduled_date", todayStr);

    const logs = doseLogs || [];

    // Calculate today's metrics
    const todayLogs = logs.filter((l) => l.scheduled_date === todayStr);
    const completedToday = todayLogs.filter((l) => l.status === "taken").length;
    const missedToday = todayLogs.filter((l) => l.status === "missed").length;
    const remainingToday = Math.max(0, totalScheduledMeds - completedToday - missedToday);

    const adherenceRateToday =
      totalScheduledMeds > 0
        ? Math.round((completedToday / totalScheduledMeds) * 100)
        : 100;

    // Calculate 7-day trend
    const weeklyTrend: Array<{
      date: string;
      day: string;
      taken: number;
      missed: number;
      total: number;
      rate: number;
    }> = [];

    let total7DayTaken = 0;
    let total7DayMissed = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = formatDate(d);
      const dayName = DAYS[d.getDay()];

      const dayLogs = logs.filter((l) => l.scheduled_date === dateKey);
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const missed = dayLogs.filter((l) => l.status === "missed").length;
      const total = totalScheduledMeds > 0 ? totalScheduledMeds : taken + missed;

      total7DayTaken += taken;
      total7DayMissed += missed;

      const rate = total > 0 ? Math.round((taken / total) * 100) : 100;

      weeklyTrend.push({
        date: dateKey,
        day: dayName,
        taken,
        missed,
        total,
        rate,
      });
    }

    const total7DayRecorded = total7DayTaken + total7DayMissed;
    const overall7DayRate =
      total7DayRecorded > 0
        ? Math.round((total7DayTaken / total7DayRecorded) * 100)
        : adherenceRateToday;

    res.json({
      success: true,
      data: {
        today: {
          total: totalScheduledMeds,
          completed: completedToday,
          missed: missedToday,
          remaining: remainingToday,
          adherencePercentage: adherenceRateToday,
        },
        sevenDay: {
          overallRate: overall7DayRate,
          totalTaken: total7DayTaken,
          totalMissed: total7DayMissed,
          trend: weeklyTrend,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Could not calculate adherence analytics",
    });
  }
});

export default router;

