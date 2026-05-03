import { api } from './axios';

export interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  wateringCount: number;
  points: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  myRank: LeaderboardUser | null;
}

export const leaderboardApi = {
  getLeaderboard: (period: 'alltime' | 'monthly') =>
    api.get<LeaderboardResponse>('/users/leaderboard', { params: { period } }),
};
