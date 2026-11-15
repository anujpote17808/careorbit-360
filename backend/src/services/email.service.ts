import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export class EmailDeliveryError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "EmailDeliveryError";
    this.statusCode = statusCode;
  }
}

export type MedicationReminderInput = {
  recipient: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  reminderType: "upcoming" | "due" | "followup";
};

export type MedicationReminderResult = {
  id: string;
  status: string;
  delivered: boolean;
};

const reminderLabels: Record<MedicationReminderInput["reminderType"], string> = {
  upcoming: "Medication coming up",
  due: "Medication scheduled now",
  followup: "Medication reminder",
};

export async function sendMedicationReminder(
  input: MedicationReminderInput,
): Promise<MedicationReminderResult> {
  if (!resend) {
    throw new EmailDeliveryError(
      "Email service is not configured (missing RESEND_API_KEY).",
      503,
    );
  }

  const subject = reminderLabels[input.reminderType] || "Medication reminder";

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [input.recipient],
    subject: `${subject} — CareOrbit 360`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#24483e;">
        <h1 style="color:#267e69;">CareOrbit 360</h1>
        <h2>${escapeHtml(subject)}</h2>
        <p>This is a reminder based on the medication schedule entered in your CareOrbit account.</p>
        <div style="background:#f0f7f3;padding:20px;border-radius:14px;margin:20px 0;">
          <p><strong>Medication:</strong> ${escapeHtml(input.medicationName)}</p>
          <p><strong>Dosage:</strong> ${escapeHtml(input.dosage)}</p>
          <p><strong>Scheduled time:</strong> ${escapeHtml(input.scheduledTime)}</p>
        </div>
        <p>Please check your care plan and record the dose in CareOrbit 360 if appropriate.</p>
        <p style="font-size:12px;color:#71877e;">This is an organizational reminder, not medical advice. Follow the instructions provided by your healthcare professional.</p>
      </div>
    `,
  });

  if (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 502;
    throw new EmailDeliveryError(
      `Email delivery failed: ${error.message}`,
      statusCode,
    );
  }

  if (!data?.id) {
    throw new EmailDeliveryError(
      "Email service did not return a confirmation ID.",
      502,
    );
  }

  // Check actual delivery status from Resend
  let status = "accepted";
  let delivered = false;

  try {
    const details = await resend.emails.get(data.id);
    if (details.data?.last_event) {
      status = details.data.last_event;
      delivered = status === "delivered";
    }
  } catch {
    // If fetching details fails, retain accepted status
  }

  return {
    id: data.id,
    status,
    delivered,
  };
}

export type EmergencyAlertInput = {
  recipient: string;
  patientName: string;
  patientEmail: string;
  notes?: string;
};

export async function sendEmergencyAlertEmail(
  input: EmergencyAlertInput,
): Promise<{ id: string; status: string }> {
  if (!resend) {
    throw new EmailDeliveryError(
      "Email service is not configured (missing RESEND_API_KEY).",
      503,
    );
  }

  const subject = `URGENT: Emergency SOS Alert for ${input.patientName} — CareOrbit 360`;

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [input.recipient],
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#24483e;border:2px solid #e53e3e;border-radius:16px;">
        <div style="background:#fed7d7;padding:16px;border-radius:12px;margin-bottom:20px;text-align:center;">
          <h1 style="color:#c53030;margin:0;font-size:24px;">EMERGENCY SOS ALERT</h1>
          <p style="color:#742a2a;margin:8px 0 0;font-weight:bold;">An emergency notification was initiated in CareOrbit 360</p>
        </div>
        <p>This message was triggered by <strong>${escapeHtml(input.patientName)}</strong> (${escapeHtml(input.patientEmail)}) requesting urgent family or caregiver attention.</p>
        <div style="background:#f7fafc;padding:16px;border-radius:12px;margin:16px 0;border:1px solid #e2e8f0;">
          <p style="margin:4px 0;"><strong>Time of Alert:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin:4px 0;"><strong>Status:</strong> Active Emergency SOS</p>
          ${input.notes ? `<p style="margin:4px 0;"><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>` : ""}
        </div>
        <p style="color:#4a5568;font-size:14px;">Please check on this patient immediately or reach out via phone. If this is a life-threatening medical emergency, call 911 or your local emergency response service right away.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
        <p style="font-size:11px;color:#a0aec0;text-align:center;">CareOrbit 360 • Connected Senior Healthcare Coordination</p>
      </div>
    `,
  });

  if (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 502;
    throw new EmailDeliveryError(
      `Emergency email delivery failed: ${error.message}`,
      statusCode,
    );
  }

  return {
    id: data?.id || "",
    status: "sent",
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });
}
