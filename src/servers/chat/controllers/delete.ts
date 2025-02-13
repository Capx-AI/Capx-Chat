import { DeleteChatRequestData } from "../types/delete";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";

export async function deleteChat(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: DeleteChatRequestData
) {
  const isValidRequest = await (
    await import("../validators/delete")
  ).validateRequest(supabaseClient, userId, data);

  const chatId = isValidRequest.chatId;
  const chatIdObj = (await import("../constructors/delete")).deleteChat();

  await (
    await import("../modifiers/edit")
  ).updateChat(supabaseClient, chatId, chatIdObj);

  return {
    success: true,
    message: "Chat successfully deleted.",
    chatId: chatId
  };
}
