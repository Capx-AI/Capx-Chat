import { Database } from "../../../init/dbSchema";
import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { SupabaseClient } from "@supabase/supabase-js";
import { EditPromptArgs } from "../types/editPrompt";

export async function editPrompt(
  supabaseClient: SupabaseClient<Database>,
  editPromptObj: EditPromptArgs
) {
  const { data, error } = await supabaseClient.rpc(
    "edit_chat",
    editPromptObj
  );
  if (error) {
    throw new BadRequestException(
      "Please retry in sometime.",
      `Error editing prompt: ${JSON.stringify(error, null, 2)}`
    );
  }
  return {
    newConversationId: data[0].new_conversation_id
  };
}
