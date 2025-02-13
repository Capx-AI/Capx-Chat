import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import { Database, Json } from "../../../init/dbSchema";
import { ChatConfig, ContinueChatArgs, StartChatArgs, UserCreditsData } from "../types/chat";
import { MessageCreateParamsBase } from "@anthropic-ai/sdk/resources/messages";
import { StartChatParams } from "@google/generative-ai";
import BigNumber from "bignumber.js";

export function constructOpenAIOptions(
    text: string,
    previousHistory: Json | never[],
    ChatConfig: ChatConfig,
    regenerateRequest: boolean,
    model: string
) {
    const formattedPreviousHistory = constructOpenAIHistory(
        previousHistory,
        text
    );

    const options: ChatCompletionCreateParamsBase = {
        messages: formattedPreviousHistory,
        model: model,
        temperature: ChatConfig.TEMPERATURE,
        n: 1
    };

    if (
        model === "o1-mini" ||
        model === "o1-preview" ||
        model === "gpt-4o-mini" ||
        model === "gpt-4o"
    ) {
        options.max_completion_tokens = ChatConfig.MAX_TOKENS;
    } else {
        options.max_tokens = ChatConfig.MAX_TOKENS;
    }
    if (
        model !== "gemini-1.5-flash" &&
        model !== "gpt-4o-mini" &&
        model !== "o1-mini" &&
        model !== "o1-preview"
    ) {
        options.frequency_penalty = regenerateRequest ? 2 : 0;
    }
    if (model === "o1-mini" || model === "o1-preview") {
        options.temperature = 1;
    }

    return options;
}

export function constructOpenAIHistory(
    previousHistory: Json | never[],
    text: string
) {
    const formattedPreviousHistory = Array.isArray(previousHistory)
        ? previousHistory.map((item: any) => {
            return {
                role: item.role,
                content: item.message
            };
        })
        : [];

    formattedPreviousHistory.push({
        role: "user",
        content: text
    });

    return formattedPreviousHistory;
}

export function constructAnthropicOptions(
    text: string,
    previousHistory: Json | never[],
    ChatConfig: ChatConfig,
    model: string
) {
    const formattedPreviousHistory = constructOpenAIHistory(
        previousHistory,
        text
    );
    const options: MessageCreateParamsBase = {
        messages: formattedPreviousHistory,
        model: model,
        temperature: ChatConfig.TEMPERATURE,
        max_tokens: ChatConfig.MAX_TOKENS
    };
    return options;
}

export function constructVertexOptions(
    previousHistory: Json | never[],
    ChatConfig: ChatConfig
) {
    const formattedPreviousHistory = constructVertexHistory(previousHistory);
    const options: StartChatParams = {
        history: formattedPreviousHistory,
        generationConfig: {
            temperature: ChatConfig.TEMPERATURE,
            maxOutputTokens: ChatConfig.MAX_TOKENS
        }
    };
    return options;
}

export function constructVertexHistory(previousHistory: Json | never[]) {
    const formattedPreviousHistory = Array.isArray(previousHistory)
        ? previousHistory.map((item: any) => {
            return {
                role: item.role === "assistant" ? "model" : item.role,
                parts: [{ text: item.message }]
            };
        })
        : [];

    return formattedPreviousHistory;
}

export function updateUserObj(
    creditsUsed: number,
    userCreditsData: UserCreditsData,
) {
    const userObj: Database["public"]["Tables"]["user_chat_credits"]["Update"] = {
        credits: Number(
            new BigNumber(userCreditsData.credits).minus(creditsUsed).toString()),
    };
    return userObj;
}
export function startChatObj(
  userId: string,
  assistantMessage: string,
  chatTitle: string,
  creditsUsed: number,
  userMessage: string,
  model: string,
  provider: string,
  aiCost: number,
  tokensConsumed: number
): StartChatArgs {
  const args: StartChatArgs = {
    p_assistant_message: assistantMessage,
    p_title: chatTitle,
    p_credits_used: creditsUsed,
    p_user_message: userMessage,
    p_model: model,
    p_provider: provider,
    p_user_id: userId,
    p_ai_cost: aiCost,
    p_tokens_consumed: tokensConsumed
  };
  return args;
}

export function continueChatObj(
  chatId: string,
  assistantMessage: string,
  creditsUsed: number,
  userMessage: string,
  aiCost: number,
  tokensConsumed: number
): ContinueChatArgs {
  const args: ContinueChatArgs = {
    p_assistant_message: assistantMessage,
    p_credits_used: creditsUsed,
    p_user_message: userMessage,
    p_chat_id: chatId,
    p_ai_cost: aiCost,
    p_tokens_consumed: tokensConsumed
  };
  return args;
}