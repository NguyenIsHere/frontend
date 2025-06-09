// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { router } from 'expo-router';

// const API_URL = 'https://be-qldv.onrender.com/api'; // Production URL

// // 1. AXIOS INSTANCE
// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//     Accept: 'application/json',
//   },
//   timeout: 30000,
//   validateStatus: status => status >= 200 && status < 500,
//   withCredentials: true,
// });

// // 2. TOKEN MANAGEMENT
// const setToken = async (token: string): Promise<void> => {
//   await AsyncStorage.setItem('accessToken', token);
// };

// const getToken = async (): Promise<string | null> => {
//   return await AsyncStorage.getItem('accessToken');
// };

// const removeToken = async (): Promise<void> => {
//   await AsyncStorage.removeItem('accessToken');
// };

// // 3. REQUEST INTERCEPTOR - attach token
// api.interceptors.request.use(
//   async (config) => {
//     const token = await getToken();
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // 4. RESPONSE INTERCEPTOR - handle errors and logging
// api.interceptors.response.use(
//   (response) => {
//     console.log(
//       `API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`,
//       {
//         status: response.status,
//         data: response.data,
//       }
//     );
//     return response;
//   },
//   async (error) => {
//     if (error.response?.status === 401) {
//       await removeToken();
//       router.replace('/(auth)');
//       throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//     }
// <<<<<<< HEAD
//     return response.data
//   },

//   /**
//    * Đăng ký tài khoản mới.
//    * Dùng FormData vì có thể chứa file avatar.
//    * @param formData - FormData object chứa thông tin đăng ký
//    */
//   register: (formData: FormData) => {
//     return api.post('/auth/register', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     })
//   },

//   /**
//    * Lấy thông tin hồ sơ của user đang đăng nhập
//    */
//   getProfile: () => {
//     return api.get('/auth')
//   },

//   /**
//    * Cập nhật hồ sơ
//    * @param formData - FormData object chứa thông tin cần cập nhật
//    */
//   updateProfile: (formData: FormData) => {
//     return api.put('/auth', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     })
//   },

//   /**
//    * Đăng xuất
//    */
//   logout: () => {
//     removeToken()
//   },

//   getChaptersForRegister: () => {
//     return api.get('/auth/chapters')
//   },
// }

// //------------------------------------------------
// // CHAPTER API
// //------------------------------------------------
// export const chapterApi = {
//   /**
//    * Lấy danh sách chi đoàn theo trang và bộ lọc
//    * @param params - { page, limit, search, status }
//    */
//   getChapters: (params?: any) => {
//     return api.get('/chapters', { params })
//   },

//   /**
//    * Lấy thông tin chi tiết một chi đoàn
//    * @param id - ID của chi đoàn
//    */
//   getChapterById: (id: string) => {
//     return api.get(`/chapters/${id}`)
//   },

//   /**
//    * Tạo một chi đoàn mới
//    * @param chapterData - Dữ liệu chi đoàn
//    */
//   createChapter: (chapterData: any) => {
//     return api.post('/chapters', chapterData)
//   },

//   /**
//    * Cập nhật thông tin chi đoàn
//    * @param id - ID của chi đoàn
//    * @param chapterData - Dữ liệu cần cập nhật
//    */
//   updateChapter: (id: string, chapterData: any) => {
//     return api.put(`/chapters/${id}`, chapterData)
//   },

  

// }

// //------------------------------------------------
// // ACCOUNT API
// //------------------------------------------------
// export const accountApi = {
//   /**
//    * Lấy danh sách tài khoản có phân trang và bộ lọc.
//    * @param params - Đối tượng chứa các query params như: { page, limit, search, status, role }
//    *
//    */
//   getAccounts: (params?: {
//     page?: number
//     limit?: number
//     search?: string
//     status?: 'actived' | 'locked' | 'pending'
//     role?: 'admin' | 'manager' | 'member'
// =======
//     if (error.code === 'ECONNABORTED') {
//       throw new Error('Máy chủ phản hồi chậm. Có thể đang khởi động, vui lòng thử lại sau.');
//     }
//     console.error('API Error:', {
//       url: error.config?.url,
//       method: error.config?.method,
//       status: error.response?.status,
//       data: error.response?.data,
//     });
//     return Promise.reject(error);
//   }
// );

// // 5. EVENT API
// const eventApi = {
//   getEvents: (params: {
//     page?: number;
//     limit?: number;
//     search?: string;
//     scope?: 'chapter' | 'private';
//     status?: string | string[];
//     chapterId?: string;
// >>>>>>> 705c788f33589d69c13cb35915251c8c77f92e7a
//   }) => {
//     const finalParams = { ...params };
//     if (Array.isArray(finalParams.status)) {
//       finalParams.status = finalParams.status.join(',');
//     }
//     return api.get('/events', { params: finalParams });
//   },

//   getEventById: (id: string) => api.get(`/events/${id}`),

//   createEvent: (formData: FormData) =>
//     api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

//   updateEvent: (id: string, data: any) => {
//     const isFormData = data instanceof FormData;
//     return api.put(`/events/${id}`, data, {
//       headers: {
//         ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }),
//       },
//     });
//   },

//   deleteEvent: (id: string) => api.delete(`/events/${id}`),

//   startEvent: (id: string) => eventApi.updateEvent(id, { status: 'doing' }),

//   endEvent: (id: string) => eventApi.updateEvent(id, { status: 'completed' }),

//   cancelEvent: (id: string) => eventApi.updateEvent(id, { status: 'canceled' }),

//   registerEvent: (eventId: string) => api.post('/registrations', { eventId }),

//   unregisterEvent: (eventId: string) => api.delete(`/registrations/${eventId}`),

//   getEventRegistrations: () => api.get('/registrations/me'),

//   checkIn: (participantId: string, eventId: string) =>
//     api.patch(`/registrations/${participantId}`, {
//       eventId,
//       status: 'checked-in',
//     }),

//   getEventParticipants: (eventId: string) => api.get('/registrations', { params: { eventId } }),

//   getMyEvents: (params: { page: number; limit: number; sort: string }) =>
//     api.get('/events/me', { params }),

//   getLikes: (eventId: string) => api.get('/favorites', { params: { eventId } }),

//   likeEvent: (eventId: string) => api.post('/favorites', { eventId }),

//   unlikeEvent: (favoriteId: string) => api.delete(`/favorites/${favoriteId}`),

//   checkLikeStatus: async (eventId: string) => {
//     try {
//       const response = await api.get('/favorites', { params: { eventId } });
//       const dataList = response.data?.data;
//       return dataList && dataList.length > 0
//         ? { isLiked: true, favoriteId: dataList[0]?._id }
//         : { isLiked: false, favoriteId: null };
//     } catch {
//       return { isLiked: false, favoriteId: null };
//     }
//   },

//   getComments: (eventId: string) => api.get('/comments', { params: { eventId } }),

//   addComment: async (eventId: string, text: string) => {
//     if (!text || !text.trim()) throw new Error('Comment text cannot be empty');

//     const token = await getToken();
//     const headers = {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     };

//     const payload = {
//       eventId,
//       comment: text.trim(),
//       text: text.trim(),
//     };

//     const response = await api.post('/comments', payload, { headers });
//     return { data: response.data, status: response.status };
//   },

//   deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),

//   likeComment: (commentId: string) => api.post(`/comments/${commentId}/like`),

//   unlikeComment: (likeId: string) => api.delete(`/comments/likes/${likeId}`),
// };

// export default eventApi;


// <<<<<<< HEAD
//   /**
//    * Xóa một tài liệu bằng ID.
//    * @param id - ID của tài liệu
//    */
//   deleteDocument: (id: string) => {
//     return api.delete(`/documents/${id}`)
//   }
// }

// export const messageApi = {
//  getContactList: ()=>{
//   return api.get(`/messages/contacts`)
//  },
//  createMessage: ({ recipientId, text }:{recipientId:any, text:any}) => {
//     return api.post(`/messages`, { recipientId, text });
//   },
// getMessages: (id:any)=>{
//   return api.get(`/messages/${id}`)
// }
//  }
// =======
// >>>>>>> 705c788f33589d69c13cb35915251c8c77f92e7a

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse } from 'axios';
import { router } from 'expo-router';

// Types
type ApiResponse<T = any> = {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

type EventStatus = 'pending' | 'doing' | 'completed' | 'canceled';
type AccountStatus = 'actived' | 'locked' | 'pending';
type UserRole = 'admin' | 'manager' | 'member';

// Constants
const API_URL = 'https://be-qldv.onrender.com/api';
const TIMEOUT = 30000;

// Axios Instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: TIMEOUT,
  validateStatus: (status) => status >= 200 && status < 500,
  withCredentials: true,
});

// Token Management
const tokenService = {
  setToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem('accessToken', token);
  },
  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('accessToken');
  },
  removeToken: async (): Promise<void> => {
    await AsyncStorage.removeItem('accessToken');
  },
};

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await tokenService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    console.log(
      `API [${response.config.method?.toUpperCase()}] ${response.config.url}:`,
      {
        status: response.status,
        data: response.data,
      }
    );
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await tokenService.removeToken();
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

// API Endpoints
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/login', credentials);
    if (response.data.data?.token) {
      await tokenService.setToken(response.data.data.token);
    }
    return response.data;
  },

  register: (formData: FormData) => {
    return api.post<ApiResponse>('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getProfile: () => api.get<ApiResponse>('/auth'),

  updateProfile: (formData: FormData) => {
    return api.put<ApiResponse>('/auth', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  logout: () => tokenService.removeToken(),

  getChaptersForRegister: () => api.get<ApiResponse>('/auth/chapters'),
};

export const chapterApi = {
  getChapters: (params?: PaginationParams & { 
    search?: string; 
    status?: string 
  }) => api.get<ApiResponse>('/chapters', { params }),

  getChapterById: (id: string) => api.get<ApiResponse>(`/chapters/${id}`),

  createChapter: (chapterData: any) => api.post<ApiResponse>('/chapters', chapterData),

  updateChapter: (id: string, chapterData: any) => 
    api.put<ApiResponse>(`/chapters/${id}`, chapterData),
};

export const eventApi = {
  getEvents: (params: PaginationParams & {
    scope?: 'chapter' | 'private';
    status?: EventStatus | EventStatus[];
    chapterId?: string;
  }) => {
    const finalParams = { ...params };
    if (Array.isArray(finalParams.status)) {
      finalParams.status = finalParams.status.join(',') as any;
    }
    return api.get<ApiResponse>('/events', { params: finalParams });
  },

  getEventById: (id: string) => api.get<ApiResponse>(`/events/${id}`),

  createEvent: (formData: FormData) => 
    api.post<ApiResponse>('/events', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    }),

  updateEvent: (id: string, data: FormData | object) => {
    const isFormData = data instanceof FormData;
    return api.put<ApiResponse>(`/events/${id}`, data, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });
  },

  deleteEvent: (id: string) => api.delete<ApiResponse>(`/events/${id}`),

  startEvent: (id: string) => eventApi.updateEvent(id, { status: 'doing' }),

  endEvent: (id: string) => eventApi.updateEvent(id, { status: 'completed' }),

  cancelEvent: (id: string) => eventApi.updateEvent(id, { status: 'canceled' }),

  registerEvent: (eventId: string) => api.post<ApiResponse>('/registrations', { eventId }),

  unregisterEvent: (eventId: string) => api.delete<ApiResponse>(`/registrations/${eventId}`),

  getEventRegistrations: () => api.get<ApiResponse>('/registrations/me'),

  checkIn: (participantId: string, eventId: string) =>
    api.patch<ApiResponse>(`/registrations/${participantId}`, {
      eventId,
      status: 'checked-in',
    }),

  getEventParticipants: (eventId: string) => 
    api.get<ApiResponse>('/registrations', { params: { eventId } }),

  getMyEvents: (params: PaginationParams) => 
    api.get<ApiResponse>('/events/me', { params }),

  // Like/Unlike functionality
  getLikes: (eventId: string) => 
    api.get<ApiResponse>('/favorites', { params: { eventId } }),

  likeEvent: (eventId: string) => 
    api.post<ApiResponse>('/favorites', { eventId }),

  unlikeEvent: (favoriteId: string) => 
    api.delete<ApiResponse>(`/favorites/${favoriteId}`),

  checkLikeStatus: async (eventId: string) => {
    try {
      const response = await eventApi.getLikes(eventId);
      const dataList = response.data?.data;
      return {
        isLiked: !!dataList && dataList.length > 0,
        favoriteId: dataList?.[0]?._id || null
      };
    } catch {
      return { isLiked: false, favoriteId: null };
    }
  },

  // Comments functionality
  getComments: (eventId: string) => 
    api.get<ApiResponse>('/comments', { params: { eventId } }),

  addComment: (eventId: string, text: string) => {
    if (!text?.trim()) throw new Error('Comment text cannot be empty');
    return api.post<ApiResponse>('/comments', { 
      eventId, 
      text: text.trim() 
    });
  },

  deleteComment: (commentId: string) => 
    api.delete<ApiResponse>(`/comments/${commentId}`),

  likeComment: (commentId: string) => 
    api.post<ApiResponse>(`/comments/${commentId}/like`),

  unlikeComment: (likeId: string) => 
    api.delete<ApiResponse>(`/comments/likes/${likeId}`),
};

export const accountApi = {
  getAccounts: (params?: PaginationParams & {
    status?: AccountStatus | AccountStatus[];
    role?: UserRole;
  }) => {
    const finalParams = { ...params };
    if (Array.isArray(finalParams.status)) {
      finalParams.status = finalParams.status.join(',') as any;
    }
    return api.get<ApiResponse>('/accounts', { params: finalParams });
  },
};

export const documentApi = {
  getDocuments: (params?: PaginationParams & {
    scope?: 'chapter' | 'private';
    search?: string;
  }) => api.get<ApiResponse>('/documents', { params }),

  getDocumentById: (id: string) => 
    api.get<ApiResponse>(`/documents/${id}`),

  createDocument: (formData: FormData) => 
    api.post<ApiResponse>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  updateDocument: (id: string, formData: FormData) => 
    api.put<ApiResponse>(`/documents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  deleteDocument: (id: string) => 
    api.delete<ApiResponse>(`/documents/${id}`),
};

export const messageApi = {
  getContactList: () => api.get<ApiResponse>('/messages/contacts'),
  
  createMessage: (payload: { recipientId: any; text: any}) => 
    api.post<ApiResponse>('/messages', payload),
    
  getMessages: (id: any) => api.get<ApiResponse>(`/messages/${id}`),
};