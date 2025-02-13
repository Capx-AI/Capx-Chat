import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";
import { DeleteChatRequestData } from "../types/delete";

export async function validateRequest(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: DeleteChatRequestData
) {
  await (
    await import("./overview")
  ).validateUser(supabaseClient, userId);

  validateInput(data.chat_id);

  const isValidChat = await validateChatId(
    userId,
    data.chat_id,
    supabaseClient
  );

  return {
    userId: userId,
    chatId: isValidChat.chatId,
    supabaseClient: supabaseClient
  };
}

function validateInput(chatId: string) {
  if (!chatId) {
    throw new BadRequestException(
      "chat_id is required",
      "ERROR: chatId is required"
    );
  }
}

async function validateChatId(
  userId: string,
  chatId: string,
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase
    .from("chats")
    .select("chat_id")
    .eq("user_id", userId)
    .eq("chat_id", chatId)
    .eq("is_deleted", false);

  if (error) {
    throw new BadRequestException(
      "Please try again in sometime.",
      `ERROR : Fetching chat ${error}: `
    );
  }

  if (!data || data.length === 0) {
    throw new BadRequestException(
      "Chat is invalid (or) already deleted.",
      "ERROR: Chat is invalid (or) already deleted."
    );
  }

  return {
    chatId: chatId
  };
}
