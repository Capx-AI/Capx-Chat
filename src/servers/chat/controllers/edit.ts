import { EditChatTitleRequestData } from "../types/edit";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";

export async function edit(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: EditChatTitleRequestData
) {
  const isValidRequest = await (
    await import("../validators/edit")
  ).validateRequest(supabaseClient, userId, data);

  const chatId = isValidRequest.chatId;
  const chatTitle = data.title;

  const chatIdObj = (await import("../constructors/edit")).updateChatTitle(
    chatTitle
  );

  await (
    await import("../modifiers/edit")
  ).updateChat(supabaseClient, chatId, chatIdObj);

  return {
    success: true,
    message: "Chat Title Updated Successfully.",
    title: chatTitle,
    chatId: chatId
  };
}
