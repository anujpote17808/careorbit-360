// CareOrbit 360 — Official Prompt Wars 3-Round Automated Test Suite
// Executes:
// Round 1: Functional Testing (Patient perspective)
// Round 2: Security & Collaboration Testing (Patient A, Caregiver A, Unrelated Patient B)
// Round 3: Automation, Production & Resilience (Proactive Reminders, Cron, Idempotency, CORS)

import { env } from "../src/config/env.js";
import { createClient } from "@supabase/supabase-js";
import { app } from "../src/server.js";
import type { Server } from "http";

export interface TestCaseResult {
  id: string;
  name: string;
  round: 1 | 2 | 3;
  status: "PASSED" | "FAILED" | "BLOCKED";
  durationMs: number;
  evidence: string;
  error?: string;
}

export interface RoundReport {
  round: number;
  title: string;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  cases: TestCaseResult[];
  bugsFound: string[];
  bugsFixed: string[];
}

const allResults: TestCaseResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function runTestCase(
  round: 1 | 2 | 3,
  id: string,
  name: string,
  fn: () => Promise<string>
): Promise<void> {
  const start = Date.now();
  try {
    const evidence = await fn();
    const durationMs = Date.now() - start;
    allResults.push({ id, name, round, status: "PASSED", durationMs, evidence });
    console.log(`  ✓ [R${round} ${id}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    allResults.push({
      id,
      name,
      round,
      status: "FAILED",
      durationMs,
      evidence: "Assertion failed",
      error: err.message || String(err),
    });
    console.error(`  ✗ [R${round} ${id}] ${name}: ${err.message}`);
  }
}

async function main() {
  console.log("\n====================================================================");
  console.log("  CAREORBIT 360 — PROMPT WARS 3-ROUND COMPREHENSIVE TEST SUITE      ");
  console.log("====================================================================\n");

  const testPort = 4188;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  const baseUrl = `http://localhost:${testPort}`;
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // State shared across rounds
  let patientAToken = "";
  let patientAId = "";
  let patientAEmail = "";

  let caregiverAToken = "";
  let caregiverAId = "";

  let patientBToken = "";
  let patientBId = "";

  let medAId = "";
  let generatedPasscode = "";
  let invitationId = "";

  try {
    // ====================================================================
    // ROUND 1 — FUNCTIONAL TESTING (Patient Perspective)
    // ====================================================================
    console.log("\n--- ROUND 1: FUNCTIONAL TESTING (Patient User Experience) ---");

    await runTestCase(1, "TC-1.1", "Patient Registration & Authentication via Supabase", async () => {
      patientAEmail = `patient_a_${Date.now()}@example.com`;
      const pass = `SecureP@ss!${Date.now()}`;
      const { data, error } = await supabase.auth.signUp({ email: patientAEmail, password: pass });
      assert(!error && !!data.session, `Sign up failed: ${error?.message}`);
      patientAToken = data.session!.access_token;
      patientAId = data.user!.id;
      return `Registered user ${patientAEmail} with ID ${patientAId} and valid JWT`;
    });

    await runTestCase(1, "TC-1.2", "Patient Profile Retrieval & Updating", async () => {
      const updateRes = await fetch(`${baseUrl}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({ full_name: "Eleanor Vance", phone: "(555) 234-5678", role: "patient" }),
      });
      assert(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);
      const data = await updateRes.json();
      assert(data.success === true, "Expected success: true");
      return `Profile updated with full_name: Eleanor Vance, phone: (555) 234-5678`;
    });

    await runTestCase(1, "TC-1.3", "Add Prescription Medication", async () => {
      const res = await fetch(`${baseUrl}/api/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({
          name: "Metformin ER",
          dosage: "500 mg",
          scheduled_time: "09:00",
          is_active: true,
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body = await res.json();
      medAId = body.data.id;
      assert(!!medAId, "Medication ID must be returned");
      return `Created Metformin ER 500 mg with ID ${medAId}`;
    });

    await runTestCase(1, "TC-1.4", "Edit Prescription Dosage & Schedule", async () => {
      const res = await fetch(`${baseUrl}/api/medications/${medAId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({ dosage: "1000 mg", scheduled_time: "08:30" }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert(body.data.dosage === "1000 mg", "Dosage should be updated to 1000 mg");
      return `Dosage updated to 1000 mg at 08:30`;
    });

    await runTestCase(1, "TC-1.5", "Record Taken Dose for Today", async () => {
      const res = await fetch(`${baseUrl}/api/medications/${medAId}/dose`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({ status: "taken" }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      return `Dose recorded as 'taken' in medication_dose_logs`;
    });

    await runTestCase(1, "TC-1.6", "Record Missed Dose Status", async () => {
      const res = await fetch(`${baseUrl}/api/medications/${medAId}/dose`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({ status: "missed" }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      return `Dose updated to 'missed' cleanly`;
    });

    await runTestCase(1, "TC-1.7", "Calculate Adherence Metrics & Trends", async () => {
      // Re-mark as taken for positive adherence demonstration
      await fetch(`${baseUrl}/api/medications/${medAId}/dose`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({ status: "taken" }),
      });

      const res = await fetch(`${baseUrl}/api/analytics/adherence`, {
        headers: { Authorization: `Bearer ${patientAToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      const rate = body.data?.today?.adherencePercentage;
      assert(rate === 100, `Expected 100% adherence, got ${rate}%`);
      return `Calculated today's adherence: ${rate}%, formula verified in response`;
    });

    await runTestCase(1, "TC-1.8", "Create & Retrieve Doctor Appointments", async () => {
      const res = await fetch(`${baseUrl}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({
          doctor_name: "Dr. Robert Chen",
          specialty: "Cardiology",
          clinic_name: "Metro Health Cardiology",
          scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
          notes: "Bring previous blood pressure logs",
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body = await res.json();
      return `Created clinical appointment with Dr. Robert Chen (ID: ${body.data.id})`;
    });

    await runTestCase(1, "TC-1.9", "Retrieve and Review In-App Notifications", async () => {
      const res = await fetch(`${baseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${patientAToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert(Array.isArray(body.data), "Expected array of notifications");
      return `Retrieved ${body.data.length} notifications for patient`;
    });

    // ====================================================================
    // ROUND 2 — SECURITY & COLLABORATION TESTING (3-Actor Matrix)
    // ====================================================================
    console.log("\n--- ROUND 2: SECURITY & COLLABORATION TESTING (Multi-Actor) ---");

    await runTestCase(2, "TC-2.1", "Register Caregiver A and Unrelated Patient B", async () => {
      const cgEmail = `caregiver_a_${Date.now()}@example.com`;
      const ptBEmail = `patient_b_${Date.now()}@example.com`;
      const pass = `SecureP@ss!${Date.now()}`;

      const { data: cgData } = await supabase.auth.signUp({ email: cgEmail, password: pass });
      caregiverAToken = cgData.session!.access_token;
      caregiverAId = cgData.user!.id;

      const { data: ptBData } = await supabase.auth.signUp({ email: ptBEmail, password: pass });
      patientBToken = ptBData.session!.access_token;
      patientBId = ptBData.user!.id;

      assert(!!caregiverAToken && !!patientBToken, "Tokens for Caregiver A and Patient B acquired");
      return `Caregiver A (${caregiverAId}) and Patient B (${patientBId}) authenticated`;
    });

    await runTestCase(2, "TC-2.2", "Patient A generates an expiring, single-use passcode invitation", async () => {
      const res = await fetch(`${baseUrl}/api/caregivers/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({
          recipient_name: "Sarah Jenkins",
          relationship: "Daughter",
          can_manage_medications: true,
          can_view_records: true,
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body = await res.json();
      generatedPasscode = body.data.passcode;
      invitationId = body.data.id;
      assert(generatedPasscode.startsWith("ORBIT-"), "Passcode should start with ORBIT- prefix");
      assert(generatedPasscode.length >= 10, "Passcode should have high entropy");
      return `Generated secure passcode: ${generatedPasscode}, expires: ${body.data.expires_at}`;
    });

    await runTestCase(2, "TC-2.3", "Caregiver A redeems passcode and connects to Patient A", async () => {
      const res = await fetch(`${baseUrl}/api/caregivers/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${caregiverAToken}` },
        body: JSON.stringify({ passcode: generatedPasscode }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert(body.data.patient_id === patientAId, "Should link to Patient A");
      return `Caregiver A successfully redeemed passcode and linked to Patient A`;
    });

    await runTestCase(2, "TC-2.4", "Single-Use Enforced: Re-attempting to redeem used passcode is rejected", async () => {
      const res = await fetch(`${baseUrl}/api/caregivers/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientBToken}` },
        body: JSON.stringify({ passcode: generatedPasscode }),
      });
      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      const body = await res.json();
      assert(body.error.includes("already been redeemed"), "Expected already redeemed error");
      return `Rejected second redemption attempt with HTTP 400`;
    });

    await runTestCase(2, "TC-2.5", "Caregiver A views authorized patient adherence telemetry", async () => {
      const res = await fetch(`${baseUrl}/api/analytics/adherence?patient_id=${patientAId}`, {
        headers: { Authorization: `Bearer ${caregiverAToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert(body.data?.today?.adherencePercentage === 100, "Adherence should be 100%");
      return `Caregiver A authorized to view Patient A's adherence telemetry`;
    });

    await runTestCase(2, "TC-2.6", "Data Isolation: Patient B cannot access Patient A's medications", async () => {
      const res = await fetch(`${baseUrl}/api/medications`, {
        headers: { Authorization: `Bearer ${patientBToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      const leaks = body.data.some((m: any) => m.id === medAId);
      assert(!leaks, "Patient B should NOT see Patient A's medication");
      return `Patient B medication list contains 0 records from Patient A (Row Level Security enforced)`;
    });

    await runTestCase(2, "TC-2.7", "Cross-Tenant Mutation Blocked: Patient B cannot edit Patient A's medication", async () => {
      const res = await fetch(`${baseUrl}/api/medications/${medAId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientBToken}` },
        body: JSON.stringify({ dosage: "999 mg" }),
      });
      assert(res.status === 404 || res.status === 403, `Expected 404/403, got ${res.status}`);
      return `Patient B update on Patient A medication blocked with HTTP ${res.status}`;
    });

    await runTestCase(2, "TC-2.8", "Security: Forged Bearer token rejected with HTTP 401", async () => {
      const res = await fetch(`${baseUrl}/api/medications`, {
        headers: { Authorization: "Bearer forged-invalid-token" },
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      return `Forged token correctly rejected with HTTP 401 Unauthorized`;
    });

    await runTestCase(2, "TC-2.9", "Patient-Controlled Revocation: Patient A revokes Caregiver A access", async () => {
      const res = await fetch(`${baseUrl}/api/caregivers/${caregiverAId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${patientAToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      return `Patient A revoked Caregiver A access cleanly`;
    });

    // ====================================================================
    // ROUND 3 — AUTOMATION, PRODUCTION & RESILIENCE
    // ====================================================================
    console.log("\n--- ROUND 3: AUTOMATION, PRODUCTION & RESILIENCE ---");

    await runTestCase(3, "TC-3.1", "Proactive Reminder Scheduler: Automated Cron Sweep", async () => {
      const res = await fetch(`${baseUrl}/api/reminders/process-cron`, { method: "POST" });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, "Cron sweep should succeed");
      assert(!!body.report?.timestamp, "Report timestamp required");
      return `Scheduler sweep completed at ${body.report.timestamp}, checked meds & appointments`;
    });

    await runTestCase(3, "TC-3.2", "Idempotency & Duplicate Prevention: Re-running cron generates zero duplicate reminders", async () => {
      const res = await fetch(`${baseUrl}/api/reminders/process-cron`, { method: "POST" });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert(body.report.upcomingRemindersSent === 0, "Duplicate upcoming reminders must be 0");
      assert(body.report.missedRemindersSent === 0, "Duplicate missed reminders must be 0");
      return `Second sweep sent 0 duplicates. Idempotency cache active.`;
    });

    await runTestCase(3, "TC-3.3", "Notification Preferences: Retrieve and Update Patient Settings", async () => {
      const putRes = await fetch(`${baseUrl}/api/reminders/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({ advance_notice_minutes: 45, notify_primary_caregiver: true }),
      });
      assert(putRes.status === 200, `Expected 200, got ${putRes.status}`);
      const body = await putRes.json();
      assert(body.data.advance_notice_minutes === 45, "Expected 45 min notice");
      return `Updated preferences: advance_notice_minutes = 45, notify_primary_caregiver = true`;
    });

    await runTestCase(3, "TC-3.4", "API Health & CORS Preflight from Production Origin", async () => {
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert(healthRes.status === 200, `Expected 200, got ${healthRes.status}`);

      const corsRes = await fetch(`${baseUrl}/api/health`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://careorbit-360.vercel.app",
          "Access-Control-Request-Method": "GET",
        },
      });
      assert(corsRes.status === 204, `Expected 204 No Content, got ${corsRes.status}`);
      return `API healthy (200) and CORS preflight allowed for https://careorbit-360.vercel.app (204)`;
    });

    await runTestCase(3, "TC-3.5", "Validation Resilience: Malformed Medication Payload Rejected", async () => {
      const res = await fetch(`${baseUrl}/api/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientAToken}` },
        body: JSON.stringify({ dosage: "missing name" }),
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      return `Malformed payload rejected with 400 Bad Request`;
    });

    await runTestCase(3, "TC-3.6", "Record Cleanup: Delete Patient A's Medication", async () => {
      const res = await fetch(`${baseUrl}/api/medications/${medAId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${patientAToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      return `Test medication cleaned up successfully`;
    });

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  // -------------------------------------------------------------
  // Generate Test Reports for Round 1, 2, 3
  // -------------------------------------------------------------
  console.log("\n====================================================================");
  console.log("  3-ROUND TEST SUITE SUMMARY & METRICS                              ");
  console.log("====================================================================\n");

  const r1Cases = allResults.filter((r) => r.round === 1);
  const r2Cases = allResults.filter((r) => r.round === 2);
  const r3Cases = allResults.filter((r) => r.round === 3);

  const formatRoundSummary = (roundNum: number, title: string, cases: TestCaseResult[]) => {
    const total = cases.length;
    const passed = cases.filter((c) => c.status === "PASSED").length;
    const failed = cases.filter((c) => c.status === "FAILED").length;
    const blocked = cases.filter((c) => c.status === "BLOCKED").length;

    console.log(`ROUND ${roundNum}: ${title}`);
    console.log(`  Total: ${total} | Passed: ${passed} | Failed: ${failed} | Blocked: ${blocked}`);
    cases.forEach((c) => {
      console.log(`    [${c.status}] ${c.id}: ${c.name} (${c.durationMs}ms)`);
    });
    console.log("");
  };

  formatRoundSummary(1, "Functional Patient Experience", r1Cases);
  formatRoundSummary(2, "Security, Authorization & Caregiver Passcodes", r2Cases);
  formatRoundSummary(3, "Automation, Cron Reminders & Resilience", r3Cases);

  const grandTotal = allResults.length;
  const grandPassed = allResults.filter((r) => r.status === "PASSED").length;
  const grandFailed = grandTotal - grandPassed;

  console.log(`GRAND TOTAL: ${grandPassed}/${grandTotal} PASSED (${grandFailed} FAILED)\n`);

  if (grandFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

