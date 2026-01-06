import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getLeaderboard = async (limit: number = 10) => {
  const response = await api.get(`/leaderboard?limit=${limit}`);
  return response.data;
};

export const getPlayerStats = async (username: string) => {
  const response = await api.get(`/player/${username}/stats`);
  return response.data;
};

export const getGameHistory = async (username: string) => {
  const response = await api.get(`/player/${username}/history`);
  return response.data;
};

export const getGameStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};