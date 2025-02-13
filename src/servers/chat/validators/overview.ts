import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";
import { BadRequestException } from "../../../middlewares/errorHandler/errors/HttpExceptions";
import { ChatConfig, ChatProviderConfig, UserCreditsData } from "../types/chat";

export async function validateRequest(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
) {
    const isValidUser = await validateUser(supabaseClient, userId);
    const secrets = await (
        await import("../../../init/secretManager")
    ).fetchSecret();
    const CHAT_CONFIG = <ChatConfig>secrets.CHAT_CONFIG;
    const providers = CHAT_CONFIG.PROVIDERS;
    const isValidChatHistory = await validateChatHistory(
        userId,
        supabaseClient,
        providers
    );
    
    return {
        userId: userId,
        credits: isValidUser.creditsData.credits,
        chatHistory: isValidChatHistory.chatHistory,
        providers: providers.map((provider) => ({
            name: provider.name,
            icon: provider.icon,
            models: provider.models
        })),
    }
}

export async function validateUser(
    supabaseClient: SupabaseClient<Database>,
    userId: string
) {
    const { data, error } = await supabaseClient
        .from("users")
        .select(`user_id,user_chat_credits: user_chat_credits (*)`)
        .eq("user_id", userId);

    if (error) {
        throw new BadRequestException(
            "Please try again in sometime.",
            `ERROR: Fetching User Data: ${JSON.stringify(error, null, 2)}`
        );
    }
    console.log("User", data);
    if (!data || data.length === 0) {
        throw new BadRequestException(
            "User Not Found",
            `ERROR: User with ID: ${userId} not found`
        );
    }

    const creditsData: UserCreditsData = <UserCreditsData>(
        (<unknown>data[0].user_chat_credits)
    );

    return {
        creditsData: creditsData,
    };
}

async function validateChatHistory(
    userId: string,
    supabaseClient: SupabaseClient<Database>,
    providers: ChatProviderConfig[]
) {
    const { data, error } = await supabaseClient
        .from("chats")
        .select("chat_id,title,model,provider,updated_at")
        .eq("user_id", userId)
        .eq("is_deleted", false);

    if (error) {
        throw new BadRequestException(
            "Please try again in sometime",
            `ERROR: Fetching chat history. ${JSON.stringify(error)}`
        );
    }

    const models = providers.flatMap((provider) => provider.models);

    const formattedData = data.map((chat) => {
        const model = models.find((m) => m.model === chat.model);
        const modelName = model ? model.name : chat.model;
        return { ...chat, model_name: modelName };
    });

    const { otherChats, previousDayChats, todaysChats } = (
        await import("../constructors/overview")
    ).formatChatHistory(formattedData);

    return {
        chatHistory: {
            today_chats: todaysChats,
            previous_day_chats: previousDayChats,
            other_chats: otherChats
        }
    };
}
