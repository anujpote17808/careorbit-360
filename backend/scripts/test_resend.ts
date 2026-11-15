import { sendMedicationReminder } from "../src/services/email.service.js";

async function testEmail() {
  console.log("=== TESTING RESEND EMAIL SERVICE ===");
  try {
    const res = await sendMedicationReminder({
      recipient: "anujpote17808@gmail.com",
      medicationName: "Lisinopril",
      dosage: "10mg",
      scheduledTime: "08:00 AM",
      reminderType: "due",
    });
    console.log("✅ Email sent successfully! Result:", res);
  } catch (err: any) {
    console.log("❌ Email send result:", err.message, "status:", err.statusCode);
  }
}

testEmail();
