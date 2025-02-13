import { ChatUpdate } from "../types/edit";

export function deleteChat() {
  const updateChatObj: ChatUpdate = {
    is_deleted: true
  };
  return updateChatObj;
}
