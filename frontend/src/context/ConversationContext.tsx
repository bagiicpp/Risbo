import { createContext } from "react";

export interface ConversationMeta {
  _id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationContextType {
  conversations: ConversationMeta[];
  loading: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  fetchConversations: () => Promise<ConversationMeta[] | null>;
  addProvisionalConversation: (id: string, title: string) => void;
  swapProvisionalId: (oldId: string, newId: string) => void;
  generatingTitleId: string | null;
  setGeneratingTitleId: (id: string | null) => void;
}

export const ConversationContext = createContext<
  ConversationContextType | undefined
>(undefined);
