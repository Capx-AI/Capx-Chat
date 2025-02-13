import { Database } from "../../../init/dbSchema";
import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { ChatUpdate } from "../types/edit";
import { SupabaseClient } from "@supabase/supabase-js";

export async function updateChat(
  supabase: SupabaseClient<Database>,
  chatId: string,
  chatUpdateObj: ChatUpdate
) {
  const { data, error } = await supabase
    .from("chats")
    .update(chatUpdateObj)
    .eq("chat_id", chatId);

  if (error) {
    throw new BadRequestException(
      "Please try again in sometime.",
      `ERROR : Updating title ${JSON.stringify(error, null, 2)} `
    );
  }
  return data;
}
