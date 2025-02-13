import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";
import { ContinueChatArgs, StartChatArgs } from "../types/chat";
import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";

export async function startChat(
  supabase: SupabaseClient<Database>,
  startChatArgs: StartChatArgs
) {
  const { data, error } = await supabase.rpc("start_chat", startChatArgs);
  if (error) {
    throw new BadRequestException(
      "Please try again in sometime.",
      `ERROR : ${JSON.stringify(error, null, 2)}`
    );
  }
  return {
    insertedChatId: data[0].inserted_chat_id,
    insertedConversationId: data[0].inserted_conversation_id
  };
}

export async function continueChat(
  supabase: SupabaseClient<Database>,
  continueChatArgs: ContinueChatArgs
) {
  const { data, error } = await supabase.rpc(
    "continue_chat",
    continueChatArgs
  );

  if (error) {
    throw new BadRequestException(
      "Please try again in sometime.",
      `ERROR : ${JSON.stringify(error, null, 2)}`
    );
  }
  return {
    insertedConversationId: data[0].inserted_conversation_id
  };
}

export async function updateCredits(
  supabase: SupabaseClient<Database>,
  userId: string,
  userObj: Database["public"]["Tables"]["user_chat_credits"]["Update"]
) {
  const { error } = await supabase
    .from("user_chat_credits")
    .update(userObj)
    .eq("user_id", userId);
  if (error) {
    throw new BadRequestException(
      "Please try again in sometime.",
      `ERROR : ${JSON.stringify(error, null, 2)}`
    );
  }
  return;
}
