import { Database } from "../../../init/dbSchema";

export interface EditPromptRequestData {
  chat_id: string;
  conversation_id: string;
  text: string;
}

export type EditPromptArgs =
  Database["public"]["Functions"]["edit_chat"]["Args"];
