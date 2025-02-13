import { SupabaseUser} from "..";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../init/dbSchema";

declare global {
  namespace Express {
    interface Request {
      user: SupabaseUser;
      supabaseClient: SupabaseClient<Database>;
      userSupabaseClient: SupabaseClient<Database>;
    }
  }
}
