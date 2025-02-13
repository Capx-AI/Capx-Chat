import { ChatUpdate } from "../types/edit";

export function updateChatTitle(title: string) {
  const updateChatObj: ChatUpdate = {
    title: title
  };
  return updateChatObj;
}
