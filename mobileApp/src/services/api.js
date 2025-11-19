import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../firebase.config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${API_CONFIG.BASE_URL}/api/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Save new tokens
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Service Methods
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  // Verify Firebase token
  verifyFirebaseToken: async (idToken) => {
    const response = await api.post('/api/auth/verify-firebase-token', { idToken });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

export const eventsAPI = {
  // Get all events
  getAll: async (params = {}) => {
    const response = await api.get('/api/events', { params });
    return response.data;
  },

  // Get single event
  getById: async (id) => {
    const response = await api.get(`/api/events/${id}`);
    return response.data;
  },

  // Create event (organizer only)
  create: async (eventData) => {
    const response = await api.post('/api/events', eventData);
    return response.data;
  },

  // Update event (organizer only)
  update: async (id, eventData) => {
    const response = await api.put(`/api/events/${id}`, eventData);
    return response.data;
  },

  // Delete event (organizer only)
  delete: async (id) => {
    const response = await api.delete(`/api/events/${id}`);
    return response.data;
  },
};

export const announcementsAPI = {
  // Get all announcements
  getAll: async (params = {}) => {
    const response = await api.get('/api/announcements', { params });
    return response.data;
  },

  // Get single announcement
  getById: async (id) => {
    const response = await api.get(`/api/announcements/${id}`);
    return response.data;
  },

  // Create announcement (organizer only)
  create: async (announcementData) => {
    const response = await api.post('/api/announcements', announcementData);
    return response.data;
  },
};

export const communityAPI = {
  // Get all community posts
  getAll: async (params = {}) => {
    const response = await api.get('/api/community_posts', { params });
    return response.data;
  },

  // Get single post
  getById: async (id) => {
    const response = await api.get(`/api/community_posts/${id}`);
    return response.data;
  },

  // Create post
  create: async (postData) => {
    const response = await api.post('/api/community_posts', postData);
    return response.data;
  },

  // Update post
  update: async (id, postData) => {
    const response = await api.put(`/api/community_posts/${id}`, postData);
    return response.data;
  },

  // Delete post
  delete: async (id) => {
    const response = await api.delete(`/api/community_posts/${id}`);
    return response.data;
  },
};

export const usersAPI = {
  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },
};

export default api;
