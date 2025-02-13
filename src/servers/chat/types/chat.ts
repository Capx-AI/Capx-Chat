import { Database, Tables } from "../../../init/dbSchema";

/**
 * Represents the data for a chat request.
 */
export interface ChatRequestData {
  tgInitData: string;
  chat_id: string | null;
  provider: string;
  model: string;
  text: string;
}

export interface RequestData {
  chat_id: string | null;
  provider: string;
  model: string;
  text: string;
}

export type UserCreditsData = Tables<"user_chat_credits">;

/**
 * Represents the chat type.
 */
export type Chat = Tables<"chats">;
export type Messages = Tables<"messages">;

export type StartChatArgs =
  Database["public"]["Functions"]["start_chat"]["Args"];

export type ContinueChatArgs =
  Database["public"]["Functions"]["continue_chat"]["Args"];


export interface UserChatData {
  credits: number;
  earnings: number;
  free_requests: number;
  key: string;
  last_request_timestamp: number;
  total_requests: number;
  daily_first_request_timestamp: number; // utilise this to reset free_requests
  total_chats: number;
  is_premium?: boolean;
  plan?: "BASIC" | "PRO" | "PRO_PLUS";
  daily_earnings?: number;
  pop_required?: boolean;
  pop_session_id?: string;
  proof_timestamp?: number;
}


export interface ChatConfig {
  TEMPERATURE: number;
  MAX_TOKENS: number;
  TOKENIZER: {
    URL: string;
    KEY: string;
  };
  PROVIDERS: ChatProviderConfig[];
  COST_FACTOR: number | 1000;
}

export interface ChatProviderConfig {
  name: string;
  icon: string;
  id: "OPENAI" | "ANTHROPIC" | "AIML" | "TOGETHER" | "VERTEX";
  key: string;
  url: string;
  models: AiModelConfig[];
}

export interface AiModelConfig {
  name: string;
  provider: string;
  model: string;
  min_credits: number;
}