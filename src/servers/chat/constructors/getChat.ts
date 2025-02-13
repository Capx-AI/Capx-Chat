import { Messages } from "../types/chat";

export function constructPreviousHistory(messages: Messages[]) {
  const groupedByTimestamp: any = {};
  if (messages.length === 0) {
    return groupedByTimestamp;
  }

  messages.forEach((message) => {
    const timestampKey = `${message.created_at}`;

    if (!groupedByTimestamp[timestampKey]) {
      groupedByTimestamp[timestampKey] = [];
    }

    groupedByTimestamp[timestampKey].push({
      role: message.sender_role,
      message: message.message
    });
  });

  return groupedByTimestamp;
}
