import { createClient } from "@supabase/supabase-js";
import { env } from "../src/config/env.js";

const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function check() {
  const tables = [
    "medications",
    "medication_dose_logs",
    "doses",
    "profiles",
    "appointments",
    "notifications",
    "caregiver_invitations",
    "caregiver_access",
    "reminder_logs"
  ];

  console.log("=== CHECKING PRODUCTION SUPABASE TABLES ===");
  for (const t of tables) {
    const res = await client.from(t).select("*").limit(1);
    if (res.error) {
      console.log(`❌ Table [${t}]: NOT FOUND or ERROR - Code: ${res.error.code} | Status: ${res.status} | Message: ${res.error.message}`);
    } else {
      console.log(`✅ Table [${t}]: EXISTS in Supabase | Sample count: ${res.data?.length ?? 0}`);
    }
  }
}

check();
