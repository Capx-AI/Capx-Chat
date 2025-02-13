/* eslint-disable new-cap */
import express, { Request, Response } from "express";
import { validateJWT } from "../../middlewares/auth";
import { RequestData } from "./types/chat";
import { EditChatTitleRequestData } from "./types/edit";
import { EditPromptRequestData } from "./types/editPrompt";
import "express-async-errors";
import { overview } from "./controllers/overview";
import { RegeneratePromptRequestData } from "./types/regenerate";

const router = express.Router();

router.get("/overview", validateJWT, async (req: Request, res: Response) => {
  console.log("tg-overview");
  const userId = req.user.id;
  const supabaseClient = req.supabaseClient;

  const result = await overview(supabaseClient, userId);

  return res.status(200).send({
    result: {
      success: result.success,
      message: result.message,
      chat_history: result.chatHistory,
      user_credits: result.userCredits,
      providers: result.providers
    }
  });
});

router.get("/", validateJWT, async (req: Request, res: Response) => {
  console.log("GET-chat");

  const userId = req.user.id;
  const supabaseClient = req.supabaseClient;
  const chatId = <string>req.query.chat_id;
  const timestamp = <string | null>req.query.timestamp || null;
  const result = await (
    await import("./controllers/getChat")
  ).getChat(supabaseClient, userId, chatId, timestamp);

  return res.status(200).send({
    result: {
      success: result.success,
      message: result.message,
      chat_id: result.chatId,
      provider: result.provider,
      model: result.model,
      previous_history: result.messages,
      next_timestamp: result.nextTimestamp
    }
  });
});

router.post("/", validateJWT, async (req: Request, res: Response) => {
  console.log("POST-chat");
  const userId = req.user.id;
  const supabaseClient = req.supabaseClient;
  const data = <RequestData>req.body.data;
  const result = await (await import("./controllers/chat")).chat(
    supabaseClient,
    userId,
    data
  );
  return res.status(200).send({
    result: {
      success: result.success,
      message: result.message,
      chat_id: result.chatId,
      conversation_id: result.conversationId,
      generated_text: result.generatedText,
      credits_utilised: result.creditsUtilised,
      provider: result.provider,
      model: result.model,
      title: result.title
    }
  });
});

router.post("/regenerate", validateJWT, async (req: Request, res: Response) => {
  console.log("regenerate");
  const userId = req.user.id;
  const supabaseClient = req.supabaseClient;
  const data = <RegeneratePromptRequestData>req.body.data;
  const result = await (
    await import("./controllers/regenerate")
  ).regenerate(supabaseClient, userId, data);
  return res.status(200).send({
    result: {
      success: result.success,
      message: result.message,
      chat_id: result.chatId,
      conversationId: result.conversationId,
      generated_text: result.generatedText,
      credits_utilised: result.creditsUtilised,
      provider: result.provider,
      model: result.model
    }
  });
});

router.post("/delete", validateJWT, async (req: Request, res: Response) => {
  console.log("delete");
  const userId = req.user.id;
  const supabaseClient = req.supabaseClient;
  const data = req.body.data;

  const result = await (
    await import("./controllers/delete")
  ).deleteChat(supabaseClient, userId, data);
  return res.status(200).send({
    result: {
      success: result.success,
      message: result.message,
      chat_id: result.chatId
    }
  });
});

router.post("/edit", validateJWT, async (req: Request, res: Response) => {
  console.log("edit");
  const userId = req.user.id;
  const supabaseClient = req.supabaseClient;
  const data = <EditChatTitleRequestData>req.body.data;

  const result = await (
    await import("./controllers/edit")
  ).edit(supabaseClient, userId, data);
  return res.status(200).send({
    result: {
      success: result.success,
      message: result.message,
      chat_id: result.chatId,
      title: result.title
    }
  });
});

router.post("/editPrompt", validateJWT, async (req: Request, res: Response) => {
  console.log("tg-editPrompt");
  const userId = req.user.id;
  const supabaseClient = req.supabaseClient;
  const data = <EditPromptRequestData>req.body.data;

  const result = await (
    await import("./controllers/editPrompt")
  ).editPrompt(supabaseClient, userId, data);
  return res.status(200).send({
    result: {
      success: result.success,
      message: result.message,
      chat_id: result.chatId,
      generated_text: result.generatedText,
      credits_utilised: result.creditsUtilised,
      provider: result.provider,
      model: result.model,
      new_conversation_id: result.newConversationId,
      edited_conversation_id: result.editedConversationId
    }
  });
});

export default router;
