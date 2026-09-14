export interface ClientContext {
  chatId: string;
  telegramUsername: string | null;
  isRegistered: boolean;
  clientId: number | null;
  nickname: string | null;
  clientNumber: string | null;
  totalVisits: number;
  trustLevel: string;
  isBanned: boolean;
  favoriteGirls: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  toolName?: string;
  toolUseId?: string;
}
