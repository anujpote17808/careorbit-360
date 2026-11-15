import { sendMedicationReminder } from "../src/services/email.service.js";

async function testUnverifiedEmail() {
  console.log("=== TESTING RESEND WITH UNVERIFIED RECIPIENT ===");
  try {
    const res = await sendMedicationReminder({
      recipient: "elderly.patient@example.com",
      medicationName: "Metformin",
      dosage: "500mg",
      scheduledTime: "12:00 PM",
      reminderType: "due",
    });
    console.log("Result:", res);
  } catch (err: any) {
    console.log("Expected limitation:", err.message, "status:", err.statusCode);
  }
}

testUnverifiedEmail();
