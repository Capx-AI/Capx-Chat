import { RegeneratePromptArgs } from "../types/regenerate";

export function regeneratePromptObj(
  assistantMessage: string,
  creditsUsed: number,
  aiCost: number,
  conversationId: string,
  tokensConsumed: number
) {
  const editPromptObj: RegeneratePromptArgs = {
    p_assistant_message: assistantMessage,
    p_credits_used: creditsUsed,
    p_ai_cost: aiCost,
    p_conversation_id: conversationId,
    p_tokens_consumed: tokensConsumed
  };
  return editPromptObj;
}
