import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/require-auth.js";

import {
  sendMedicationReminder,
  EmailDeliveryError,
} from "../services/email.service.js";
import { processProactiveReminders } from "../services/scheduler.service.js";
import { env } from "../config/env.js";

const router = Router();

const reminderSchema = z
  .object({
    medicationId: z.string().uuid("A valid medication ID is required."),
    reminderType: z
      .enum(["upcoming", "due", "followup"])
      .default("due"),
  })
  .strict();

router.post("/send", requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Verify authenticated user context.
    if (!authReq.userId || !authReq.userEmail || !authReq.accessToken) {
      res.status(401).json({
        success: false,
        error: "Authentication required. Please sign in again.",
      });
      return;
    }

    // 2. Validate request body.
    const parsed = reminderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid reminder request.",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // 3. Ensure backend service configuration.
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      res.status(503).json({
        success: false,
        error: "Database service is not configured.",
      });
      return;
    }

    if (!env.RESEND_API_KEY) {
      res.status(503).json({
        success: false,
        error: "Email service is not configured.",
      });
      return;
    }

    // 4. Create an authenticated Supabase client using the verified user's token.
    // Row Level Security (RLS) is strictly enforced.
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authReq.accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 5. Query medication strictly verifying ownership (user_id = authReq.userId).
    const { data: medication, error: medicationError } = await supabase
      .from("medications")
      .select("id, name, dosage, scheduled_time")
      .eq("id", parsed.data.medicationId)
      .eq("user_id", authReq.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (medicationError) {
      console.error(
        "Medication lookup failed:",
        medicationError.message,
      );

      res.status(500).json({
        success: false,
        error: "Could not retrieve medication details.",
      });
      return;
    }

    if (!medication) {
      res.status(404).json({
        success: false,
        error: "Active medication not found or access denied.",
      });
      return;
    }

    // 6. Send reminder using verified account email (never client-provided recipient).
    try {
      const emailResult = await sendMedicationReminder({
        recipient: authReq.userEmail,
        medicationName: medication.name,
        dosage: medication.dosage,
        scheduledTime: medication.scheduled_time,
        reminderType: parsed.data.reminderType,
      });

      console.log("Medication reminder processed:", {
        medicationId: medication.id,
        userId: authReq.userId,
        emailId: emailResult.id,
        status: emailResult.status,
        delivered: emailResult.delivered,
      });

      res.status(200).json({
        success: true,
        message: emailResult.delivered
          ? `Medication reminder delivered to ${authReq.userEmail}.`
          : `Medication reminder accepted by email provider (${emailResult.status}).`,
        data: {
          emailId: emailResult.id,
          status: emailResult.status,
          delivered: emailResult.delivered,
          recipient: authReq.userEmail,
        },
      });
    } catch (emailErr) {
      if (emailErr instanceof EmailDeliveryError) {
        console.error("Email service error:", emailErr.message);
        res.status(emailErr.statusCode).json({
          success: false,
          error: emailErr.message,
        });
        return;
      }
      throw emailErr;
    }
  } catch (error) {
    console.error("Reminder route error:", error);
    next(error);
  }
});

// ====================================================================
// AUTOMATED PROACTIVE REMINDER CRON RUNNER
// ====================================================================
router.all("/process-cron", async (_req, res) => {
  try {
    const report = await processProactiveReminders();
    res.json({
      success: true,
      message: "Proactive reminder scheduler executed successfully",
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process proactive reminders",
    });
  }
});

// ====================================================================
// PATIENT NOTIFICATION PREFERENCES
// ====================================================================
const memoryPreferences = new Map<string, any>();

router.get("/preferences", requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  const prefs = memoryPreferences.get(userId) || {
    upcoming_dose_email: true,
    missed_dose_email: true,
    notify_primary_caregiver: true,
    appointment_reminders: true,
    advance_notice_minutes: 30,
  };

  res.json({ success: true, data: prefs });
});

router.put("/preferences", requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  const existing = memoryPreferences.get(userId) || {
    upcoming_dose_email: true,
    missed_dose_email: true,
    notify_primary_caregiver: true,
    appointment_reminders: true,
    advance_notice_minutes: 30,
  };

  const updated = { ...existing, ...req.body };
  memoryPreferences.set(userId, updated);

  res.json({ success: true, message: "Notification preferences updated", data: updated });
});

export default router;
