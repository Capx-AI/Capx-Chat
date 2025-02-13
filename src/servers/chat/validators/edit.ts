import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { EditChatTitleRequestData } from "../types/edit";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";

export async function validateRequest(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: EditChatTitleRequestData
) {
  await (
    await import("./overview")
  ).validateUser(supabaseClient, userId);

  validateInput(data.title);

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

function validateInput(title: string) {
  if (!title) {
    throw new BadRequestException(
      "Title is required",
      "ERROR: Title is required"
    );
  }
  if (title.length > 280) {
    throw new BadRequestException(
      "Title is too long, max characters allowed is 280.",
      "ERROR: Title is too long"
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
