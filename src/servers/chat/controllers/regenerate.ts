import { RegeneratePromptRequestData } from "../types/regenerate";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";

export async function regenerate(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: RegeneratePromptRequestData
) {
  const isValidRequest = await (
    await import("../validators/regenerate")
  ).validateRequest(supabaseClient, userId, data);

  const chatId = isValidRequest.chatId;
  const conversationId = isValidRequest.conversationId;
  const edenRequestData = isValidRequest.aiRequestData;
  const userChatData = isValidRequest.creditsData;
  const tokensConsumed = isValidRequest.tokensConsumed;

  // Update the user's doc.
  const userObj = (await import("../constructors/chat")).updateUserObj(
    edenRequestData.creditsUtilised,
    userChatData
  );

  (await import("../modifiers/chat")).updateCredits(
    supabaseClient,
    userId,
    userObj
  );

  const regeneratePromptObj = (
    await import("../constructors/regenerate")
  ).regeneratePromptObj(
    edenRequestData.generatedText,
    edenRequestData.creditsUtilised,
    edenRequestData.aiCost,
    conversationId,
    tokensConsumed
  );

  await (
    await import("../modifiers/regenerate")
  ).regeneratePrompt(supabaseClient, regeneratePromptObj);

  return {
    success: true,
    message: "Success",
    chatId: chatId,
    conversationId: conversationId,
    generatedText: edenRequestData.generatedText,
    creditsUtilised: edenRequestData.creditsUtilised,
    provider: edenRequestData.provider,
    model: edenRequestData.model,
  };
}
