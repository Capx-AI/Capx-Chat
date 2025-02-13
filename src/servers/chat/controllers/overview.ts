import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";

export async function overview(
  supabaseClient: SupabaseClient<Database>,
  userId: string
) {
  // Validate Incoming Request.
  const isValidRequest = await (
    await import("../validators/overview")
  ).validateRequest(supabaseClient, userId);
  const credits = isValidRequest.credits;
  const providers = isValidRequest.providers;

  return {
    success: true,
    message: "User overview data retrieved successfully",
    chatHistory: isValidRequest.chatHistory,
    userCredits: credits,
    providers: providers,
    userId: userId
  };
}
