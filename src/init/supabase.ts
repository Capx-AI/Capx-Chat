import { createClient } from "@supabase/supabase-js";
import { Database } from "./dbSchema";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

export function createSupabaseClient() {
  const supabaseUrl = SUPABASE_URL;
  const supabaseKey = SUPABASE_KEY;
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  return supabase;
}
