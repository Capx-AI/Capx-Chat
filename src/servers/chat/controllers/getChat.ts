import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";

export async function getChat(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  chatId: string,
  lastMessageTimestamp: string | null
) {
  const isValidRequest = await (
    await import("../validators/getChat")
  ).validateRequest(supabaseClient, userId, chatId, lastMessageTimestamp);
  const provider = isValidRequest.provider;
  const model = isValidRequest.model;
  const messages = isValidRequest.messages;
  const nextTimestamp = isValidRequest.nextTimestamp;

  return {
    success: true,
    message: "Successfully retrieved chat history",
    chatId: chatId,
    provider: provider,
    model: model,
    messages: messages,
    nextTimestamp: nextTimestamp
  };
}
