import { api } from './axios';

export interface ChatMessage {
  id: string;
  treeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export const chatApi = {
  getMessages: (treeId: string) => api.get<ChatMessage[]>(`/trees/${treeId}/chat`),
  sendMessage: (treeId: string, text: string) =>
    api.post<ChatMessage>(`/trees/${treeId}/chat`, { text }),
};
