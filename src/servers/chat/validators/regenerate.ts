import { Database } from "../../../init/dbSchema";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  BadRequestException,
  ForbiddenException
} from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { ChatConfig } from "../types/chat";
import { RegeneratePromptRequestData } from "../types/regenerate";
import { fetchSecret } from "../../../init/secretManager";

export async function validateRequest(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: RegeneratePromptRequestData
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
    CHAT_CONFIG
  );

  const isValidPreviousHistory = await (
    await import("./editPrompt")
  ).validatePreviousHistory(
    isValidChat.chatId,
    isValidChat.conversationId,
    supabaseClient
  );

  const isValidAIRequest = await (
    await import("./chat")
  ).validateAIRequest(
    `${isValidChat.lastUserMessage.message}`,
    isValidChat.provider,
    isValidChat.model,
    isValidUser.creditsData,
    isValidPreviousHistory.previousHistory,
    CHAT_CONFIG,
    true
  );

  return {
    userId: userId,
    chatId: isValidChat.chatId,
    conversationId: isValidChat.conversationId,
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
  chatConfig: ChatConfig
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
    conversation_id,
    chat_id,
    created_at,
    messages (message, created_at, sender_role), 
    chats (user_id, chat_id, is_deleted, model, provider)
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
  if (!chatIdData.messages) {
    throw new BadRequestException(
      "Chat is invalid (or) already deleted.",
      "ERROR: Chat not found"
    );
  }
  // Check if the provider and model exist in the selected plan
  const isModelAllowed = chatConfig.PROVIDERS.some(
    (entry) =>
      entry.name === chatIdData.chats!.provider &&
      entry.models.some(model => model.model === chatIdData.chats!.model)
  );

  // If the model is not allowed, throw an error asking the user to upgrade
  if (!isModelAllowed) {
    throw new ForbiddenException(
      `The ${chatIdData.chats!.provider} provider or ${chatIdData.chats!.model} model doesn't exist.`,
      `The ${chatIdData.chats!.provider} provider or ${chatIdData.chats!.model} model doesn't exist.`
    );
  }
  if (chatIdData.conversation_id !== conversationId) {
    throw new BadRequestException(
      "Recent conversationId mismatch.",
      `ERROR: Conversation ID mismatch. Provided: ${conversationId}, Found: ${chatIdData.conversation_id}`
    );
  }
  if (chatIdData.messages.length > 2) {
    throw new BadRequestException(
      "User has reached regenerate limit.",
      "ERROR: User has regenerated."
    );
  }

  return {
    chatId: chatIdData.chats.chat_id,
    provider: chatIdData.chats.provider,
    model: chatIdData.chats.model,
    conversationId: chatIdData.conversation_id,
    lastUserMessage: chatIdData.messages.find(
      (msg) => msg.sender_role === "user"
    )!
  };
}
