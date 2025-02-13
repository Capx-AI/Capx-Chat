import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../init/dbSchema";
import { RequestData } from "../types/chat";

export async function chat(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    data: RequestData
) {
    const isValidRequest = await (
        await import("../validators/chat")
    ).validateRequest(supabaseClient, userId, data);

    const chatIdData = isValidRequest.chatIdData;
    const provider = isValidRequest.provider;
    const model = isValidRequest.model;
    const creditsUtilised = isValidRequest.creditsUtilised;
    const aiCost = isValidRequest.aiCost;
    const generatedText = isValidRequest.generatedText;
    const title = isValidRequest.title;
    const userCreditsData = isValidRequest.userCreditsData;
    const tokensConsumed = isValidRequest.tokensConsumed;

    let chatId = data.chat_id;
    const userObj = (
        await import("../constructors/chat")
    ).updateUserObj(
        creditsUtilised,
        userCreditsData
    );

    (await import("../modifiers/chat")).updateCredits(supabaseClient, userId, userObj);

    let conversationId: string;
    if (!chatIdData) {
        const startChatObj = (await import("../constructors/chat")).startChatObj(
            userId,
            generatedText,
            title,
            creditsUtilised,
            data.text,
            model,
            provider,
            aiCost,
            tokensConsumed
        );
        const { insertedChatId, insertedConversationId } = await (
            await import("../modifiers/chat")
        ).startChat(supabaseClient, startChatObj);
        chatId = insertedChatId;
        conversationId = insertedConversationId;
    } else {
        // Continue Chat Request
        const continueChatObj = (
            await import("../constructors/chat")
        ).continueChatObj(
            data.chat_id!,
            generatedText,
            creditsUtilised,
            data.text,
            aiCost,
            tokensConsumed
        );
        const { insertedConversationId } = await (
            await import("../modifiers/chat")
        ).continueChat(supabaseClient, continueChatObj);
        conversationId = insertedConversationId;
    }

    return {
        success: true,
        message: "Success",
        chatId: chatId,
        conversationId: conversationId,
        generatedText: generatedText,
        creditsUtilised: creditsUtilised,
        provider: provider,
        model: model,
        title: title
    };
}