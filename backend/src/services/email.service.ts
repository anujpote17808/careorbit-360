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
