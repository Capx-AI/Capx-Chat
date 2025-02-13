import { EditPromptRequestData } from "../types/editPrompt";
import { Database } from "../../../init/dbSchema";
import { SupabaseClient } from "@supabase/supabase-js";

export async function editPrompt(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  data: EditPromptRequestData
) {
  const isValidRequest = await (
    await import("../validators/editPrompt")
  ).validateRequest(supabaseClient, userId, data);

  const chatId = isValidRequest.chatId;
  const editedConversationId = isValidRequest.editedConversationId;
  const aiRequestData = isValidRequest.aiRequestData;
  const userChatData = isValidRequest.creditsData;
  const tokensConsumed = isValidRequest.tokensConsumed;

  // Update the user's doc.
  const userObj = (await import("../constructors/chat")).updateUserObj(
    aiRequestData.creditsUtilised,
    userChatData,
  );

  (await import("../modifiers/chat")).updateCredits(
    supabaseClient,
    userId,
    userObj
  );

  const editPromptObj = (
    await import("../constructors/editPrompt")
  ).editPromptObj(
    aiRequestData.generatedText,
    aiRequestData.creditsUtilised,
    data.text,
    aiRequestData.aiCost,
    editedConversationId,
    tokensConsumed
  );

  const { newConversationId } = await (
    await import("../modifiers/editPrompt")
  ).editPrompt(supabaseClient, editPromptObj);
  const conversationId = newConversationId;

  return {
    success: true,
    message: "Success",
    chatId: chatId,
    generatedText: aiRequestData.generatedText,
    creditsUtilised: aiRequestData.creditsUtilised,
    provider: aiRequestData.provider,
    model: aiRequestData.model,
    newConversationId: conversationId,
    editedConversationId: editedConversationId,
  };
}
