import { Database } from "../../../init/dbSchema";

export interface EditChatTitleRequestData {
  chat_id: string;
  title: string;
}
export type ChatUpdate = Database["public"]["Tables"]["chats"]["Update"];
