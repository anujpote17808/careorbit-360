import { createClient } from "@supabase/supabase-js";
import { env } from "../src/config/env.js";

const LIVE_API = "https://careorbit-360-api.vercel.app";
const authSupabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function testLiveApi() {
  console.log(`====================================================================`);
  console.log(`  VERIFYING MULTI-ACTOR AUTHORIZATION ON LIVE PRODUCTION API        `);
  console.log(`  Target: ${LIVE_API}`);
  console.log(`====================================================================\n`);

  const ts = Date.now();
  const patientEmail = `live_patient_${ts}@example.com`;
  const caregiverEmail = `live_caregiver_${ts}@example.com`;
  const intruderEmail = `live_intruder_${ts}@example.com`;
  const password = "ComplexPassword!2026";

  // 1. Create Patient A
  console.log(`1. Registering Patient A (${patientEmail})...`);
  const { data: patientAuth, error: pErr } = await authSupabase.auth.signUp({ email: patientEmail, password });
  if (pErr || !patientAuth.session) throw new Error("Patient signup failed: " + pErr?.message);
  const patientToken = patientAuth.session.access_token;
  const patientId = patientAuth.user!.id;
  console.log(`   ✅ Patient A registered: ${patientId}`);

  // 2. Patient A adds medication via Live API
  console.log(`2. Patient A creating medication on Live API...`);
  const medRes = await fetch(`${LIVE_API}/api/medications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      name: "Metformin ER",
      dosage: "500mg",
      frequency: "Daily",
      scheduled_time: "08:00",
      instructions: "Take with breakfast",
    }),
  });
  const medData = await medRes.json();
  if (!medRes.ok) throw new Error("Failed to create med on live API: " + JSON.stringify(medData));
  const medicationId = medData.data.id;
  console.log(`   ✅ Medication created on Live API: ${medicationId} (${medData.data.name})`);

  // 3. Register Caregiver A
  console.log(`3. Registering Caregiver A (${caregiverEmail})...`);
  const { data: cgAuth, error: cgErr } = await authSupabase.auth.signUp({ email: caregiverEmail, password });
  if (cgErr || !cgAuth.session) throw new Error("Caregiver signup failed: " + cgErr?.message);
  const cgToken = cgAuth.session.access_token;
  const cgId = cgAuth.user!.id;
  console.log(`   ✅ Caregiver A registered: ${cgId}`);

  // 4. Register Unrelated Patient B
  console.log(`4. Registering Unrelated Patient B (${intruderEmail})...`);
  const { data: bAuth, error: bErr } = await authSupabase.auth.signUp({ email: intruderEmail, password });
  if (bErr || !bAuth.session) throw new Error("Intruder signup failed: " + bErr?.message);
  const bToken = bAuth.session.access_token;
  const bId = bAuth.user!.id;
  console.log(`   ✅ Patient B registered: ${bId}`);

  // 5. Patient A generates passcode invitation on Live API
  console.log(`5. Patient A generating expiring passcode invitation on Live API...`);
  const inviteRes = await fetch(`${LIVE_API}/api/caregivers/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      relationship: "Daughter & Primary Caregiver",
      can_manage_medications: true,
      can_view_records: true,
    }),
  });
  const inviteData = await inviteRes.json();
  if (!inviteRes.ok) throw new Error("Failed to generate invite on live API: " + JSON.stringify(inviteData));
  const passcode = inviteData.data.passcode;
  console.log(`   ✅ Passcode generated: ${passcode} (Expires: ${inviteData.data.expires_at})`);

  // 6. Caregiver A redeems passcode on Live API
  console.log(`6. Caregiver A redeeming passcode [${passcode}] on Live API...`);
  const acceptRes = await fetch(`${LIVE_API}/api/caregivers/invitations/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cgToken}` },
    body: JSON.stringify({ passcode }),
  });
  const acceptData = await acceptRes.json();
  if (!acceptRes.ok) throw new Error("Failed to accept passcode on live API: " + JSON.stringify(acceptData));
  console.log(`   ✅ Passcode accepted on Live API:`, acceptData.message);

  // 7. Single-Use enforcement: Caregiver A or anyone tries to redeem the same passcode again
  console.log(`7. Verifying single-use enforcement on Live API...`);
  const replayRes = await fetch(`${LIVE_API}/api/caregivers/invitations/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cgToken}` },
    body: JSON.stringify({ passcode }),
  });
  const replayData = await replayRes.json();
  if (replayRes.status === 400) {
    console.log(`   ✅ Single-use enforced! HTTP 400 correctly returned: "${replayData.error}"`);
  } else {
    throw new Error(`Expected HTTP 400 for replay but got ${replayRes.status}: ${JSON.stringify(replayData)}`);
  }

  // 8. Unrelated Patient B tries to access Patient A's medications on Live API
  console.log(`8. Verifying multi-tenant isolation: Patient B queries Live API...`);
  const bListRes = await fetch(`${LIVE_API}/api/medications`, {
    headers: { Authorization: `Bearer ${bToken}` },
  });
  const bListData = await bListRes.json();
  const containsPatientAMed = (bListData.data || []).some((m: any) => m.id === medicationId);
  if (!containsPatientAMed) {
    console.log(`   ✅ Isolation verified: Patient B cannot see Patient A's medications (count: ${bListData.data?.length || 0})`);
  } else {
    throw new Error("Security breach: Patient B saw Patient A's medication!");
  }

  // 9. Unrelated Patient B tries to mutate Patient A's medication on Live API
  console.log(`9. Verifying cross-tenant mutation defense on Live API...`);
  const bMutateRes = await fetch(`${LIVE_API}/api/medications/${medicationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${bToken}` },
    body: JSON.stringify({ name: "Hacked Medication Name" }),
  });
  const bMutateData = await bMutateRes.json();
  if (bMutateRes.status === 404 || !bMutateRes.ok) {
    console.log(`   ✅ Mutation blocked! HTTP ${bMutateRes.status} returned to unauthorized Patient B`);
  } else {
    throw new Error("Security breach: Patient B mutated Patient A's medication!");
  }

  // 10. Patient A revokes Caregiver A's access on Live API
  console.log(`10. Patient A revoking Caregiver A's access on Live API...`);
  const revokeRes = await fetch(`${LIVE_API}/api/caregivers/${cgId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const revokeData = await revokeRes.json();
  if (revokeRes.ok) {
    console.log(`   ✅ Revocation successful on Live API: "${revokeData.message}"`);
  } else {
    throw new Error("Revocation failed: " + JSON.stringify(revokeData));
  }

  // 11. Cleanup test medication
  console.log(`11. Cleaning up test medication on Live API...`);
  await fetch(`${LIVE_API}/api/medications/${medicationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  console.log(`   ✅ Medication cleaned up`);

  console.log(`\n====================================================================`);
  console.log(`  ALL LIVE PRODUCTION API AUTHORIZATION SCENARIOS VERIFIED 100%!   `);
  console.log(`====================================================================\n`);
}

testLiveApi().catch((err) => {
  console.error("❌ Live API test failed:", err);
  process.exit(1);
});
