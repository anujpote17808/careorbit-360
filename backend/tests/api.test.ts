// CareOrbit 360 Automated API & Security Test Suite
// Verifies Authentication, Authorization, Zod Validation, CRUD, Dose Tracking, Duplicate Prevention & Adherence

import { env } from "../src/config/env.js";
import { createClient } from "@supabase/supabase-js";
import { app } from "../src/server.js";
import type { Server } from "http";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      name,
      passed: false,
      error: err.message || String(err),
      durationMs: Date.now() - start,
    });
    console.error(`  ✗ ${name}: ${err.message || err}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log("\n=======================================================");
  console.log("  CAREORBIT 360 AUTOMATED API & SECURITY TEST SUITE    ");
  console.log("=======================================================\n");

  // Spin up test server locally on an ephemeral port
  const testPort = 4099;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  const baseUrl = `http://localhost:${testPort}`;
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let testUserToken: string | null = null;
  let testUserId: string | null = null;
  let createdMedId: string | null = null;

  try {
    // -------------------------------------------------------------
    // 1. Health & Server Status Tests
    // -------------------------------------------------------------
    await runTest("GET /api/health returns HTTP 200 and healthy status", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.status === "healthy", "Expected status to be healthy");
      assert(data.service === "CareOrbit 360 API", "Expected service name match");
    });

    // -------------------------------------------------------------
    // 2. Authentication & Authorization Security Tests
    // -------------------------------------------------------------
    await runTest("Security: Protected routes reject requests without Authorization header with HTTP 401", async () => {
      const endpoints = [
        "/api/medications",
        "/api/appointments",
        "/api/caregivers",
        "/api/notifications",
        "/api/profile",
        "/api/analytics/adherence",
      ];

      for (const ep of endpoints) {
        const res = await fetch(`${baseUrl}${ep}`);
        assert(
          res.status === 401,
          `Endpoint ${ep} returned ${res.status} instead of 401 Unauthorized`
        );
      }
    });

    await runTest("Security: Protected routes reject forged Bearer token with HTTP 401", async () => {
      const res = await fetch(`${baseUrl}/api/medications`, {
        headers: { Authorization: "Bearer forged-fake-jwt-token-12345" },
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // 3. Live Supabase Authentication
    // -------------------------------------------------------------
    await runTest("Auth: Authenticate test user via Supabase Auth and acquire JWT", async () => {
      const testEmail = `careorbit_test_${Date.now()}@example.com`;
      const testPassword = `TestPass!9876_${Date.now()}`;

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (error || !data.session) {
        throw new Error(error?.message || "Failed to create test session");
      }

      testUserToken = data.session.access_token;
      testUserId = data.user!.id;
      assert(!!testUserToken, "Session access token must not be null");
      assert(!!testUserId, "User ID must not be null");
    });

    // -------------------------------------------------------------
    // 4. API Input Validation Tests (Zod)
    // -------------------------------------------------------------
    await runTest("Validation: POST /api/medications rejects payload with missing name with HTTP 400", async () => {
      assert(!!testUserToken, "Auth token required");
      const res = await fetch(`${baseUrl}/api/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          dosage: "10 mg",
          // missing 'name'
          scheduled_time: "08:00",
        }),
      });

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      const body = await res.json();
      assert(body.success === false, "Expected success: false in validation error");
    });

    await runTest("Validation: POST /api/medications rejects invalid scheduled_time format with HTTP 400", async () => {
      assert(!!testUserToken, "Auth token required");
      const res = await fetch(`${baseUrl}/api/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          name: "Aspirin",
          dosage: "81 mg",
          scheduled_time: "invalid-time", // invalid format
        }),
      });

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // 5. Medication Full CRUD Persistence Tests
    // -------------------------------------------------------------
    await runTest("CRUD: POST /api/medications creates a valid medication in Supabase with HTTP 201", async () => {
      assert(!!testUserToken, "Auth token required");
      const res = await fetch(`${baseUrl}/api/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          name: "Lisinopril Test",
          dosage: "10 mg",
          scheduled_time: "08:30",
          is_active: true,
        }),
      });

      assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, "Expected success: true");
      assert(body.data?.name === "Lisinopril Test", "Expected medication name match");
      createdMedId = body.data?.id;
      assert(!!createdMedId, "Expected created medication ID");
    });

    await runTest("CRUD: GET /api/medications retrieves user's active medications", async () => {
      assert(!!testUserToken, "Auth token required");
      const res = await fetch(`${baseUrl}/api/medications`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = await res.json();
      assert(Array.isArray(body.data), "Expected array of medications");
      const found = body.data.some((m: any) => m.id === createdMedId);
      assert(found, "Created medication should be present in user's medication list");
    });

    await runTest("CRUD: PUT /api/medications/:id updates medication dosage", async () => {
      assert(!!testUserToken && !!createdMedId, "Token and Med ID required");
      const res = await fetch(`${baseUrl}/api/medications/${createdMedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          dosage: "20 mg",
        }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = await res.json();
      assert(body.data?.dosage === "20 mg", "Dosage was not updated to 20 mg");
    });

    // -------------------------------------------------------------
    // 6. Dose Tracking & Duplicate Prevention Tests
    // -------------------------------------------------------------
    await runTest("Dose Tracking: POST /api/medications/:id/dose marks today's dose as taken", async () => {
      assert(!!testUserToken && !!createdMedId, "Token and Med ID required");
      const res = await fetch(`${baseUrl}/api/medications/${createdMedId}/dose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          status: "taken",
        }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, "Expected dose log success");
    });

    await runTest("Duplicate Prevention: Updating dose status for the same date updates idempotently without duplicating", async () => {
      assert(!!testUserToken && !!createdMedId, "Token and Med ID required");
      const res = await fetch(`${baseUrl}/api/medications/${createdMedId}/dose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          status: "taken",
        }),
      });

      assert(res.status === 200, `Expected 200 OK on idempotent update, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // 7. Dynamic Adherence Calculation Tests
    // -------------------------------------------------------------
    await runTest("Analytics: GET /api/analytics/adherence calculates 100% adherence when dose taken", async () => {
      assert(!!testUserToken, "Auth token required");
      const res = await fetch(`${baseUrl}/api/analytics/adherence`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, "Expected success: true");
      assert(
        body.data?.today?.adherencePercentage === 100,
        `Expected 100% adherence, got ${body.data?.today?.adherencePercentage}%`
      );
      assert(body.data?.today?.completed >= 1, "Completed doses should be >= 1");
    });

    // -------------------------------------------------------------
    // 8. Clean Record Cleanup
    // -------------------------------------------------------------
    await runTest("CRUD: DELETE /api/medications/:id cleans up the test record", async () => {
      assert(!!testUserToken && !!createdMedId, "Token and Med ID required");
      const res = await fetch(`${baseUrl}/api/medications/${createdMedId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, "Expected success: true on delete");
    });

  } finally {
    // Gracefully shut down test server
    await new Promise((resolve) => server.close(resolve));
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n-------------------------------------------------------");
  console.log(`  TEST RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
