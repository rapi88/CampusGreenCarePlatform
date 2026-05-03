import { api } from './axios';

export interface WeeklyAward {
  photoUrl: string | null;
  text: string | null;
  userId: string | null;
}

export const awardApi = {
  getWeeklyAward: () => api.get<WeeklyAward>('/award/weekly'),
  updateWeeklyAward: (data: WeeklyAward) => api.put<{ message: string; award: WeeklyAward }>('/award/weekly', data),
};
