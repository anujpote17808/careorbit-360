import { createClient } from "@supabase/supabase-js";
import { env } from "../src/config/env.js";

async function verifyAnonRls() {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data, error } = await client.from("medications").select("id, name, user_id");
  console.log("Anon query to medications:", { error, dataCount: data?.length, data });
}

verifyAnonRls();
