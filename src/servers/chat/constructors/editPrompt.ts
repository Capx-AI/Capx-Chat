import { EditPromptArgs } from "../types/editPrompt";

export function editPromptObj(
  assistantMessage: string,
  creditsUsed: number,
  userMessage: string,
  aiCost: number,
  conversationId: string,
  tokensConsumed: number
) {
  const editPromptObj: EditPromptArgs = {
    p_assistant_message: assistantMessage,
    p_credits_used: creditsUsed,
    p_user_message: userMessage,
    p_ai_cost: aiCost,
    p_conversation_id: conversationId,
    p_tokens_consumed: tokensConsumed
  };
  return editPromptObj;
}
