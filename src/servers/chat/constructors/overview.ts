export function formatChatHistory(
  chatHistory: {
    chat_id: string;
    title: string;
    model: string;
    provider: string;
    updated_at: string;
  }[]
) {
  if (chatHistory.length === 0) {
    return {
      todaysChats: [],
      previousDayChats: [],
      otherChats: []
    };
  }
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sortedHistory = chatHistory.sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  const todaysChats = sortedHistory.filter((chat) => {
    const updatedAt = new Date(chat.updated_at);
    return (
      updatedAt.getDate() === today.getDate() &&
      updatedAt.getMonth() === today.getMonth() &&
      updatedAt.getFullYear() === today.getFullYear()
    );
  });

  const previousDayChats = sortedHistory.filter((chat) => {
    const updatedAt = new Date(chat.updated_at);
    return (
      updatedAt.getDate() === yesterday.getDate() &&
      updatedAt.getMonth() === yesterday.getMonth() &&
      updatedAt.getFullYear() === yesterday.getFullYear()
    );
  });

  const otherChats = sortedHistory.filter(
    (chat) => !todaysChats.includes(chat) && !previousDayChats.includes(chat)
  );
  return {
    todaysChats,
    previousDayChats,
    otherChats
  };
}
