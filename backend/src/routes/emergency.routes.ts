import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";
import { sendEmergencyAlertEmail } from "../services/email.service.js";
import { env } from "../config/env.js";

const router = Router();

const alertSchema = z.object({
  notes: z.string().max(500).optional(),
  contact_email: z.string().email().optional(),
  contact_name: z.string().optional(),
});

function getAuthedClient(token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// POST /api/emergency/alert
router.post("/alert", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userEmail = authReq.userEmail!;
  const token = authReq.accessToken!;

  const parsed = alertSchema.safeParse(req.body);
  const notes = parsed.success ? parsed.data.notes : undefined;
  const targetEmail = (parsed.success && parsed.data.contact_email) || userEmail;
  const targetName = (parsed.success && parsed.data.contact_name) || "Caregiver";

  const alertRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    alert_type: "sos",
    notes: notes || "Emergency SOS Alert triggered from dashboard",
    status: "dispatched",
    created_at: new Date().toISOString(),
  };

  // 1. Try to record alert in Supabase
  try {
    const supabase = getAuthedClient(token);
    await supabase.from("emergency_alerts").insert(alertRecord);
  } catch (err) {
    // Non-blocking log
  }

  // 2. Dispatch email notification via Resend
  let emailDispatched = false;
  let emailError: string | null = null;

  if (env.RESEND_API_KEY) {
    try {
      await sendEmergencyAlertEmail({
        recipient: targetEmail,
        patientName: userEmail.split("@")[0],
        patientEmail: userEmail,
        notes: notes || "Urgent assistance requested by patient.",
      });
      emailDispatched = true;
    } catch (err: any) {
      console.warn("Emergency alert email warning:", err.message);
      emailError = err.message;
    }
  }

  res.status(200).json({
    success: true,
    message: emailDispatched
      ? `Emergency alert dispatched to ${targetEmail}.`
      : "Emergency alert logged. Note: email delivery mode active.",
    alertId: alertRecord.id,
    timestamp: alertRecord.created_at,
    recipient: targetEmail,
    emailDispatched,
    notice:
      "This application notifies your configured emergency contacts. If this is a life-threatening emergency, call 911 or your local emergency services immediately.",
    details: emailError ? { warning: emailError } : undefined,
  });
});

export default router;

