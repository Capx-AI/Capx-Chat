import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "../../../init/dbSchema";
import { ChatConfig, ChatProviderConfig, RequestData, UserCreditsData } from "../types/chat";
import { validateUser } from "./overview";
import { BadRequestException, ForbiddenException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import OpenAI from "openai";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import Anthropic from "@anthropic-ai/sdk";
import { MessageCreateParamsBase } from "@anthropic-ai/sdk/resources/messages";
import { GenerateContentResult, GoogleGenerativeAI, StartChatParams } from "@google/generative-ai";
import BigNumber from "bignumber.js";

export async function validateRequest(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    data: RequestData
) {
    const isValidUser = await validateUser(supabaseClient, userId);
    const secrets = await (
        await import("../../../init/secretManager")
    ).fetchSecret();
    const CHAT_CONFIG = <ChatConfig>secrets.CHAT_CONFIG;
    const providers = CHAT_CONFIG.PROVIDERS;
    validateInputs(data, providers);
    const isValidChatId = await validateChatId(
        userId,
        data,
        supabaseClient
    );

    const chatIdData = isValidChatId.chatIdData;
    const model = isValidChatId.model;
    const provider = isValidChatId.provider;
    const previousHistory = isValidChatId.previousHistory;
    const userCreditsData = isValidUser.creditsData;
    const isValidAIRequest = await validateAIRequest(
        data.text,
        provider,
        model,
        userCreditsData,
        previousHistory,
        CHAT_CONFIG,
    );
    const title = chatIdData
        ? chatIdData.title
        : data.text.length > 280
            ? data.text.substring(0, 280)
            : data.text;

    return {
        userId: userId,
        userCreditsData: isValidUser.creditsData,
        generatedText: isValidAIRequest.generatedText,
        creditsUtilised: isValidAIRequest.creditsUtilised,
        provider: isValidAIRequest.provider,
        model: isValidAIRequest.model,
        chatIdData: chatIdData,
        aiCost: isValidAIRequest.aiCost,
        previousHistory: previousHistory,
        title: title,
        tokensConsumed: isValidAIRequest.tokensConsumed
    }
}

export function validateInputs(
    data: RequestData,
    providers: ChatProviderConfig[]
) {
    if (!data.text) {
        throw new BadRequestException(
            "Text is missing in the request.",
            "Text is missing in the request."
        );
    }
    if (!data.chat_id) {
        if (!data.provider)
            throw new BadRequestException(
                "Provider is missing in the request.",
                "Provider is missing in the request."
            );

        if (!data.model)
            throw new BadRequestException(
                "Model is missing in the request.",
                "Model is missing in the request."
            );

        // Check if the provider and model exist in the selected plan
        const isModelAllowed = providers.some(
            (entry) =>
                entry.name === data.provider && entry.models.some(model => model.model === data.model)
        );

        // If the model is not allowed, throw an error asking the user to upgrade
        if (!isModelAllowed) {
            throw new ForbiddenException(
                `The ${data.provider} provider or ${data.model} model doesn't exist.`,
                `The ${data.provider} provider or ${data.model} model doesn't exist.`
            );
        }
    }

    return {
        text: data.text,
        provider: data.provider,
        model: data.model
    };
}

export async function validateChatId(
    userId: string,
    chatRequestData: RequestData,
    supabaseClient: SupabaseClient<Database>,
) {
    if (!chatRequestData.chat_id) {
        return {
            chatId: null,
            chatIdData: null,
            previousHistory: [],
            provider: chatRequestData.provider,
            model: chatRequestData.model
        };
    }

    const { data, error } = await supabaseClient
        .from("chats")
        .select()
        .eq("chat_id", chatRequestData.chat_id)
        .eq("user_id", userId)
        .eq("is_deleted", false);

    if (error) {
        throw new BadRequestException(
            "Chat is invalid (or) already deleted.",
            `ERROR: Chat ID: ${chatRequestData.chat_id} is invalid. ${JSON.stringify(error, null, 2)}`
        );
    }

    if (data.length === 0) {
        throw new BadRequestException(
            "Chat is invalid (or) already deleted.",
            `ERROR: Chat ID: ${chatRequestData.chat_id} is invalid.`
        );
    }

    const chatIdData = data[0];
    return {
        chatId: chatIdData.chat_id,
        previousHistory: chatIdData.previous_conversation,
        chatIdData: chatIdData,
        provider: chatIdData.provider,
        model: chatIdData.model
    };
}

export async function validateAIRequest(
    text: string,
    provider: string,
    model: string,
    userCreditsData: UserCreditsData,
    previousHistory: Json | never[],
    ChatConfig: ChatConfig,
    regenerateRequest = false
) {
    const selectedProvider = ChatConfig.PROVIDERS.find(p => p.name === provider);
    if (!selectedProvider) {
        throw new BadRequestException(
            "Invalid provider selected",
            `Provider ${provider} is not configured`
        );
    }
    const providerKey = selectedProvider.key;
    const providerId = selectedProvider.id;
    const providerUrl = selectedProvider.url;

    const modelData = selectedProvider.models.find(m => m.model === model);
    if (!modelData) {
        throw new BadRequestException(
            "Invalid model selected",
            `Model ${model} is not configured for provider ${provider}`
        );
    }
    const minimumCredits = modelData.min_credits;

    validateCredits(userCreditsData, minimumCredits);

    try {
        return await processRequest(
            providerId,
            providerKey,
            providerUrl,
            text,
            previousHistory,
            model,
            ChatConfig,
            regenerateRequest,
            provider
        );
    } catch (error: any) {
        throw new BadRequestException(
            "AI Request failed",
            `AI Request failed: ${error.message}`
        );
    }
}

export async function validateCredits(
    userCreditsData: UserCreditsData,
    minimumCredits: number
) {
    if (userCreditsData.credits < minimumCredits) {
        throw new ForbiddenException(
            "Insufficient credits",
            "Insufficient credits to process the request"
        );
    }
}

async function processRequest(
    AIAgent: "OPENAI" | "ANTHROPIC" | "AIML" | "TOGETHER" | "VERTEX",
    providerKey: string,
    providerUrl: string,
    text: string,
    previousHistory: Json | never[],
    model: string,
    ChatConfig: ChatConfig,
    regenerateRequest: boolean,
    provider: string
) {
    let generatedText: string;
    let tokensConsumed: number;
    let AICost: number;

    const options = await constructOptions(
        AIAgent,
        text,
        previousHistory,
        ChatConfig,
        regenerateRequest,
        model
    );

    switch (AIAgent) {
        case "OPENAI":
        case "TOGETHER":
        case "AIML": {
            const openai = new OpenAI({
                apiKey: providerKey,
                baseURL: providerUrl
            });
            const response = <OpenAI.Chat.Completions.ChatCompletion>(
                await openai.chat.completions.create(
                    options as ChatCompletionCreateParamsBase
                )
            );
            ({ generatedText, tokensConsumed, AICost } = handleOpenAIResponse(
                response,
                model,
                AIAgent === "AIML"
            ));
            break;
        }
        case "ANTHROPIC": {
            const anthropic = new Anthropic({ apiKey: providerKey });
            const response = <Anthropic.Messages.Message>(
                await anthropic.messages.create(options as MessageCreateParamsBase)
            );
            ({ generatedText, tokensConsumed, AICost } = handleAnthropicResponse(
                response,
                model
            ));
            break;
        }
        case "VERTEX": {
            const genAI = new GoogleGenerativeAI(providerKey);
            const vertexModel = genAI.getGenerativeModel({
                model: model
            });
            const chat = vertexModel.startChat(options as StartChatParams);
            const response = await chat.sendMessage(text);

            ({ generatedText, tokensConsumed, AICost } = handleVertexResponse(
                response,
                model
            ));

            break;
        }
        default:
            throw new Error(`Unsupported AI agent: ${AIAgent}`);
    }

    return calculateAndReturnResults(
        AICost,
        generatedText,
        tokensConsumed,
        model,
        ChatConfig,
        provider
    );
}

// Function to construct API options based on the agent type
async function constructOptions(
    AIAgent: string,
    text: string,
    previousHistory: Json | never[],
    ChatConfig: ChatConfig,
    regenerateRequest: boolean,
    model: string
) {
    const constructor = await import("../constructors/chat");

    if (AIAgent === "ANTHROPIC") {
        return constructor.constructAnthropicOptions(
            text,
            previousHistory,
            ChatConfig,
            model
        );
    } else if (AIAgent === "VERTEX") {
        return constructor.constructVertexOptions(previousHistory, ChatConfig);
    }
    return constructor.constructOpenAIOptions(
        text,
        previousHistory,
        ChatConfig,
        regenerateRequest,
        model
    );
}

// Handling responses for OpenAI/AIML
function handleOpenAIResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
    model: string,
    isAIML = false
) {
    const AICost = calculateAICost(
        response.usage!.prompt_tokens,
        response.usage!.completion_tokens,
        model,
        isAIML
    );
    const generatedText = <string>response.choices[0].message.content;
    const tokensConsumed =
        response.usage!.prompt_tokens + response.usage!.completion_tokens;
    return { AICost, generatedText, tokensConsumed };
}

// Handling responses for Anthropic
function handleAnthropicResponse(
    response: Anthropic.Messages.Message,
    model: string
) {
    const AICost = calculateAICost(
        response.usage.input_tokens,
        response.usage.output_tokens,
        model
    );
    const generatedText = response.content[0].text;
    const tokensConsumed =
        response.usage.input_tokens + response.usage.output_tokens;
    return { AICost, generatedText, tokensConsumed };
}

// Handling responses for Anthropic
function handleVertexResponse(genResult: GenerateContentResult, model: string) {
    const AICost = calculateAICost(
        <number>genResult.response.usageMetadata?.promptTokenCount,
        <number>genResult.response.usageMetadata?.candidatesTokenCount,
        model
    );
    const generatedText = genResult.response.text();
    const tokensConsumed =
        <number>genResult.response.usageMetadata?.promptTokenCount +
        <number>genResult.response.usageMetadata?.candidatesTokenCount;
    return { AICost, generatedText, tokensConsumed };
}
// Function to calculate and return final result
function calculateAndReturnResults(
    AICost: number,
    generatedText: string,
    tokensConsumed: number,
    model: string,
    chatConfig: ChatConfig,
    provider: string
) {
    const markupCost = new BigNumber(AICost).multipliedBy(1.05).toNumber();
    const creditsUtilised = new BigNumber(markupCost)
        .multipliedBy(chatConfig.COST_FACTOR)
        .toNumber();

    return {
        aiCost: AICost,
        generatedText,
        creditsUtilised,
        model,
        tokensConsumed,
        provider
    };
}

function calculateAICost(
    inputToken: number,
    outputToken: number,
    model: string,
    AIMLRequest = false
) {
    let inputCostPerMillion;
    let outputCostPerMillion;
    switch (model) {
        case "gpt-4o":
            inputCostPerMillion = 2.5;
            outputCostPerMillion = 10;
            break;
        case "o1-mini":
            inputCostPerMillion = 3;
            outputCostPerMillion = 12;
            break;
        case "o1-preview":
            inputCostPerMillion = 15;
            outputCostPerMillion = 60;
            break;
        case "gpt-4o-mini":
            inputCostPerMillion = 0.15;
            outputCostPerMillion = 0.6;
            break;
        case "claude-3-haiku-20240307":
            inputCostPerMillion = 0.25;
            outputCostPerMillion = 1.25;
            break;
        case "claude-3-5-sonnet-20240620":
            inputCostPerMillion = 3;
            outputCostPerMillion = 15;
            break;
        case "meta-llama/Llama-3.2-3B-Instruct-Turbo":
            inputCostPerMillion = 0.06;
            outputCostPerMillion = 0.06;
            break;
        case "meta-llama/Meta-Llama-3-8B-Instruct-Turbo":
            inputCostPerMillion = 0.18;
            outputCostPerMillion = 0.18;
            break;

        case "gemini-1.5-flash":
            inputCostPerMillion = 0.075;
            outputCostPerMillion = 0.3;
            break;
        default:
            throw new BadRequestException("Invalid Model", `Invalid Model: ${model}`);
    }

    if (AIMLRequest) {
        // Add 30% to inputCostPerMillion & outputCostPerMillion if it is AIMLRequest
        inputCostPerMillion = new BigNumber(inputCostPerMillion).multipliedBy(1.3);
        outputCostPerMillion = new BigNumber(outputCostPerMillion).multipliedBy(
            1.3
        );
    }

    const inputCost: BigNumber = new BigNumber(inputCostPerMillion)
        .multipliedBy(inputToken)
        .dividedBy(Math.pow(10, 6));
    const outputCost: BigNumber = new BigNumber(outputCostPerMillion)
        .multipliedBy(outputToken)
        .dividedBy(Math.pow(10, 6));
    return Number(inputCost.plus(outputCost).toNumber().toFixed(8));
}