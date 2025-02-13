import { Database } from "../../../init/dbSchema";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  BadRequestException,
  ForbiddenException
} from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { EditPromptRequestData } from "../types/editPrompt";
import { fetchSecret } from "../../../init/secretManager";
import {
  ChatConfig,
  ChatProviderConfig
} from "../types/chat";

export async function validateRequest(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: EditPromptRequestData
) {
  const isValidUser = await (
    await import("./overview")
  ).validateUser(supabaseClient, userId);

  const secrets = await fetchSecret();
  const CHAT_CONFIG = <ChatConfig>secrets.CHAT_CONFIG;

  const isValidChat = await validateChatId(
    userId,
    data.chat_id,
    data.conversation_id,
    supabaseClient,
    CHAT_CONFIG.PROVIDERS
  );

  const isValidPreviousHistory = await validatePreviousHistory(
    data.chat_id,
    isValidChat.conversationId,
    supabaseClient
  );

  const isValidAIRequest = await (
    await import("./chat")
  ).validateAIRequest(
    data.text,
    isValidChat.provider,
    isValidChat.model,
    isValidUser.creditsData,
    isValidPreviousHistory.previousHistory,
    CHAT_CONFIG
  );

  return {
    userId: userId,
    chatId: isValidChat.chatId,
    editedConversationId: isValidChat.conversationId,
    supabaseClient: supabaseClient,
    aiRequestData: isValidAIRequest,
    creditsData: isValidUser.creditsData,
    tokensConsumed: isValidAIRequest.tokensConsumed
  };
}

async function validateChatId(
  userId: string,
  chatId: string,
  conversationId: string,
  supabase: SupabaseClient<Database>,
  providers: ChatProviderConfig[]
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
    conversation_id,
    created_at,
    chat_id,
    chats(user_id, chat_id, title, is_deleted, model, provider)
  `
    )
    .eq("chat_id", chatId)
    .eq("chats.user_id", userId)
    .eq("chats.is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new BadRequestException(
      "Please try again in sometime.",
      `ERROR: Error fetching messages ${error}`
    );
  }

  if (!data) {
    throw new BadRequestException(
      "Chat is invalid (or) already deleted.",
      "ERROR: Chat not found"
    );
  }
  if (data.length === 0) {
    throw new BadRequestException(
      "Chat is invalid (or) already deleted.",
      "ERROR: Chat not found"
    );
  }
  const chatIdData = data[0];
  if (!chatIdData.chats) {
    throw new BadRequestException(
      "Chat is invalid (or) already deleted.",
      "ERROR: Chat not found"
    );
  }
  const isModelAllowed = providers.some(
    (entry) =>
        entry.name === chatIdData.chats!.provider && entry.models.some(model => model.model === chatIdData.chats!.model)
  );

  // If the model is not allowed, throw an error asking the user to upgrade
  if (!isModelAllowed) {
    throw new ForbiddenException(
      `The ${chatIdData.chats!.provider} provider or ${chatIdData.chats!.model} model doesn't exist.`,
      `The ${chatIdData.chats!.provider} provider or ${chatIdData.chats!.model} model doesn't exist.`
  );
  }
  // Validate if the user has become free user.

  if (chatIdData.conversation_id !== conversationId) {
    throw new BadRequestException(
      "Recent conversationId mismatch.",
      `ERROR: Conversation ID mismatch. Provided: ${conversationId}, Found: ${chatIdData.conversation_id}`
    );
  }

  return {
    chatId: chatIdData.chats.chat_id,
    provider: chatIdData.chats.provider,
    model: chatIdData.chats.model,
    conversationId: chatIdData.conversation_id
  };
}

export async function validatePreviousHistory(
  chatId: string,
  excludedConversationId: string,
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase.rpc(
    "fetch_previous_messages_for_edit",
    {
      p_chat_id: chatId,
      p_excluded_conversation_id: excludedConversationId
    }
  );

  if (error) {
    throw new Error("Error fetching previous messages");
  }
  if (!data) {
    throw new Error("No data found for previous messages");
  }

  // Flatten the array of conversation messages into a single array of messages
  const previousHistory = data.reduce(
    (acc, item) => {
      // Assuming each item.p_messages is already in the desired format
      return acc.concat(item.p_messages as { role: string; message: string }[]);
    },
    [] as { role: string; message: string }[]
  );

  return {
    previousHistory: previousHistory
  };
}
