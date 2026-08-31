/**
 * Axios instance that automatically attaches the current Firebase ID token
 * or local dev session token to every outgoing request.
 */
import axios from 'axios';
import { API_URL } from '../config';
import { getAuth } from 'firebase/auth';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  try {
    const auth = getAuth();
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }
  } catch (e) {
    // Firebase auth not initialized or not active
  }

  // Fallback to local dev session token
  const devToken = localStorage.getItem('neighborlink_token');
  if (devToken) {
    config.headers.Authorization = `Bearer ${devToken}`;
  }

  return config;
});

export default api;
