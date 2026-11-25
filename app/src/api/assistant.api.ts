import { api } from './axios';

export interface AssistantReply {
  answer: string;
  topic: string;
}

export const assistantApi = {
  ask: (question: string) =>
    api.post<AssistantReply>('/assistant/ask', { question }),
};
