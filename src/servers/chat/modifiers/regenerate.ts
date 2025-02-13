import { Database } from "../../../init/dbSchema";
import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { SupabaseClient } from "@supabase/supabase-js";
import { RegeneratePromptArgs } from "../types/regenerate";

export async function regeneratePrompt(
  supabaseClient: SupabaseClient<Database>,
  regeneratePromptObj: RegeneratePromptArgs
) {
  const { error } = await supabaseClient.rpc(
    "regenerate_assistant_message",
    regeneratePromptObj
  );
  if (error) {
    throw new BadRequestException(
      "Please retry in sometime.",
      `Error editing prompt: ${JSON.stringify(error, null, 2)}`
    );
  }
  return;
}
