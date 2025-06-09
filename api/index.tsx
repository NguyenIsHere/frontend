import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

const API_URL = 'https://be-qldv.onrender.com/api'; // Production URL

// 1. AXIOS INSTANCE
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
  validateStatus: status => status >= 200 && status < 500,
  withCredentials: true,
});

// 2. TOKEN MANAGEMENT
const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem('accessToken', token);
};

const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('accessToken');
};

const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem('accessToken');
};

// 3. REQUEST INTERCEPTOR - attach token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. RESPONSE INTERCEPTOR - handle errors and logging
api.interceptors.response.use(
  (response) => {
    console.log(
      `API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`,
      {
        status: response.status,
        data: response.data,
      }
    );
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      router.replace('/(auth)');
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Máy chủ phản hồi chậm. Có thể đang khởi động, vui lòng thử lại sau.');
    }
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// 5. EVENT API
const eventApi = {
  getEvents: (params: {
    page?: number;
    limit?: number;
    search?: string;
    scope?: 'chapter' | 'private';
    status?: string | string[];
    chapterId?: string;
  }) => {
    const finalParams = { ...params };
    if (Array.isArray(finalParams.status)) {
      finalParams.status = finalParams.status.join(',');
    }
    return api.get('/events', { params: finalParams });
  },

  getEventById: (id: string) => api.get(`/events/${id}`),

  createEvent: (formData: FormData) =>
    api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  updateEvent: (id: string, data: any) => {
    const isFormData = data instanceof FormData;
    return api.put(`/events/${id}`, data, {
      headers: {
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }),
      },
    });
  },

  deleteEvent: (id: string) => api.delete(`/events/${id}`),

  startEvent: (id: string) => eventApi.updateEvent(id, { status: 'doing' }),

  endEvent: (id: string) => eventApi.updateEvent(id, { status: 'completed' }),

  cancelEvent: (id: string) => eventApi.updateEvent(id, { status: 'canceled' }),

  registerEvent: (eventId: string) => api.post('/registrations', { eventId }),

  unregisterEvent: (eventId: string) => api.delete(`/registrations/${eventId}`),

  getEventRegistrations: () => api.get('/registrations/me'),

  checkIn: (participantId: string, eventId: string) =>
    api.patch(`/registrations/${participantId}`, {
      eventId,
      status: 'checked-in',
    }),

  getEventParticipants: (eventId: string) => api.get('/registrations', { params: { eventId } }),

  getMyEvents: (params: { page: number; limit: number; sort: string }) =>
    api.get('/events/me', { params }),

  getLikes: (eventId: string) => api.get('/favorites', { params: { eventId } }),

  likeEvent: (eventId: string) => api.post('/favorites', { eventId }),

  unlikeEvent: (favoriteId: string) => api.delete(`/favorites/${favoriteId}`),

  checkLikeStatus: async (eventId: string) => {
    try {
      const response = await api.get('/favorites', { params: { eventId } });
      const dataList = response.data?.data;
      return dataList && dataList.length > 0
        ? { isLiked: true, favoriteId: dataList[0]?._id }
        : { isLiked: false, favoriteId: null };
    } catch {
      return { isLiked: false, favoriteId: null };
    }
  },

  getComments: (eventId: string) => api.get('/comments', { params: { eventId } }),

  addComment: async (eventId: string, text: string) => {
    if (!text || !text.trim()) throw new Error('Comment text cannot be empty');

    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const payload = {
      eventId,
      comment: text.trim(),
      text: text.trim(),
    };

    const response = await api.post('/comments', payload, { headers });
    return { data: response.data, status: response.status };
  },

  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),

  likeComment: (commentId: string) => api.post(`/comments/${commentId}/like`),

  unlikeComment: (likeId: string) => api.delete(`/comments/likes/${likeId}`),
};

export default eventApi;


