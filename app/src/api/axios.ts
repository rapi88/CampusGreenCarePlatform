// Axios instance with JWT interceptors
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { extractError } from '../utils/error';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete (config.headers as any)['Content-Type'];
    delete (config.headers as any)['content-type'];
  }

  return config;
});

// Handle 401 → logout (store cleared separately in auth flow)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    
    // Automatically show toast for all errors except 401 if it's handled gracefully elsewhere, but let's show for all
    const errorMessage = extractError(error);
    Toast.show({
      type: 'error',
      text1: 'Hata',
      text2: errorMessage,
      position: 'top',
    });

    return Promise.reject(error);
  }
);
