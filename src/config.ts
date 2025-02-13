import envHandler from "./init/env";

export const SUPABASE_URL: string = envHandler("SUPABASE_URL");
export const SUPABASE_KEY: string = envHandler("SUPABASE_KEY");
