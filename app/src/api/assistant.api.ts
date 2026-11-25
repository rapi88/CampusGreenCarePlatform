import { api } from './axios';

export interface AssistantReply {
  answer: string;
  topic: string;
  trees?: AssistantTreeRecommendation[];
}

export interface AssistantTreeRecommendation {
  id: string;
  name: string;
  species: string;
  location: string;
  distanceMeters?: number;
  volunteerCount?: number;
  maxVolunteers?: number;
}

export const assistantApi = {
  ask: (
    question: string,
    location?: { latitude: number; longitude: number },
  ) => api.post<AssistantReply>('/assistant/ask', { question, ...location }),
};
