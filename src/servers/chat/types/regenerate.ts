import { Database } from "../../../init/dbSchema";

export interface RegeneratePromptRequestData {
  chat_id: string;
  conversation_id: string;
}

export type RegeneratePromptArgs =
  Database["public"]["Functions"]["regenerate_assistant_message"]["Args"];
