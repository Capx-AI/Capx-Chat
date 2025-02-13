import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";

export async function validateRequest(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  chatId: string,
  lastMessageTimestamp: string | null
) {
  const isValidInputs = validateInput(chatId, lastMessageTimestamp);

  const isValidMessages = await validateMessages(
    chatId,
    userId,
    isValidInputs.lastMessageTimestamp,
    supabaseClient
  );

  return {
    chatId: isValidMessages.chatId,
    provider: isValidMessages.provider,
    model: isValidMessages.model,
    messages: isValidMessages.messages,
    nextTimestamp: isValidMessages.nextTimestamp
  };
}

function validateInput(chatId: string, lastMessageTimestamp: string | null) {
  if (!chatId) {
    throw new BadRequestException(
      "Invalid Chat ID",
      "ERROR: User has not selected a chat"
    );
  }
  if (!lastMessageTimestamp) {
    return {
      chatId: chatId,
      lastMessageTimestamp: new Date().toISOString()
    };
  }
  if (isNaN(Date.parse(lastMessageTimestamp))) {
    throw new BadRequestException(
      "Invalid Timestamp",
      "ERROR: Invalid timestamp provided."
    );
  }
  return {
    chatId: chatId,
    lastMessageTimestamp: lastMessageTimestamp
  };
}

async function validateMessages(
  chatId: string,
  userId: string,
  lastCreatedAt: string,
  supabase: SupabaseClient<Database>,
  limit = 5
) {
  const { data, error } = await supabase.rpc("fetch_conversation_messages", {
    p_chat_id: chatId,
    p_user_id: userId,
    p_before_timestamp: lastCreatedAt,
    p_message_limit: limit + 1
  });

  if (error) {
    throw new BadRequestException(
      "Please try again in sometime.",
      `ERROR: ${JSON.stringify(error)}`
    );
  }

  if (data.length === 0) {
    throw new BadRequestException(
      "Chat is invalid (or) already deleted.",
      `ERROR: Chat ID: ${chatId} is invalid.`
    );
  }

  let nextTimestamp = null;
  if (data.length > limit) {
    nextTimestamp = data[limit - 1].conversation_created_at;
    data.pop();
  }

  return {
    messages: data,
    nextTimestamp: nextTimestamp,
    provider: data[0].provider,
    model: data[0].model,
    chatId: chatId
  };
}