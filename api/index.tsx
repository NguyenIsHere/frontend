// const API_BASE_URL = 'http://192.168.1.6:5000/api'

import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { router } from 'expo-router'

// 1. CẤU HÌNH AXIOS INSTANCE
//================================================================================
const API_URL = 'https://be-qldv.onrender.com/api' // Production URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 seconds timeout
  validateStatus: status => status >= 200 && status < 500,
  withCredentials: true, // Important for handling cookies if your API uses sessions
})

// 2. QUẢN LÝ TOKEN
//================================================================================

const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem('accessToken', token)
}

const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('accessToken')
}

const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem('accessToken')
}

// Interceptor để tự động đính kèm token vào mỗi request
api.interceptors.request.use(
  async config => {
    const token = await getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Interceptor để xử lý các lỗi response
api.interceptors.response.use(
  response => {
    // Log successful responses for debugging
    console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.code === 'ECONNABORTED') {
      throw new Error('Máy chủ phản hồi chậm. Có thể đang khởi động, vui lòng thử lại sau.');
    }

    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      await removeToken();
      // Điều hướng về trang login
      router.replace('/(auth)');
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }

    throw error;
  }
);

// 3. ĐỊNH NGHĨA CÁC API
//================================================================================

//------------------------------------------------
// AUTH API
//------------------------------------------------
export const authApi = {
  /**
   * Đăng nhập
   * @param credentials - email và password
   */
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials)
    if (response.data.data.token) {
      await setToken(response.data.data.token)
    }
    return response.data
  },

  /**
   * Đăng ký tài khoản mới.
   * Dùng FormData vì có thể chứa file avatar.
   * @param formData - FormData object chứa thông tin đăng ký
   */
  register: (formData: FormData) => {
    return api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Lấy thông tin hồ sơ của user đang đăng nhập
   */
  getProfile: () => {
    return api.get('/auth')
  },

  /**
   * Cập nhật hồ sơ
   * @param formData - FormData object chứa thông tin cần cập nhật
   */
  updateProfile: (formData: FormData) => {
    return api.put('/auth', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Đăng xuất
   */
  logout: () => {
    removeToken()
  }
}

//------------------------------------------------
// CHAPTER API
//------------------------------------------------
export const chapterApi = {
  /**
   * Lấy danh sách chi đoàn theo trang và bộ lọc
   * @param params - { page, limit, search, status }
   */
  getChapters: (params?: any) => {
    return api.get('/chapters', { params })
  },

  /**
   * Lấy thông tin chi tiết một chi đoàn
   * @param id - ID của chi đoàn
   */
  getChapterById: (id: string) => {
    return api.get(`/chapters/${id}`)
  },

  /**
   * Tạo một chi đoàn mới
   * @param chapterData - Dữ liệu chi đoàn
   */
  createChapter: (chapterData: any) => {
    return api.post('/chapters', chapterData)
  },

  /**
   * Cập nhật thông tin chi đoàn
   * @param id - ID của chi đoàn
   * @param chapterData - Dữ liệu cần cập nhật
   */
  updateChapter: (id: string, chapterData: any) => {
    return api.put(`/chapters/${id}`, chapterData)
  }
}

//------------------------------------------------
// ACCOUNT API
//------------------------------------------------
export const accountApi = {
  /**
   * Lấy danh sách tài khoản có phân trang và bộ lọc.
   * @param params - Đối tượng chứa các query params như: { page, limit, search, status, role }
   *
   */
  getAccounts: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: 'actived' | 'locked' | 'pending'
    role?: 'admin' | 'manager' | 'member'
  }) => {
    return api.get('/accounts', { params })
  },

  /**
   * Lấy thông tin chi tiết của một tài khoản bằng ID.
   * @param id - ID của tài khoản cần lấy
   *
   */
  getAccountById: (id: string) => {
    return api.get(`/accounts/${id}`)
  },

  /**
   * Tạo một tài khoản mới (thường dùng cho admin).
   * @param formData - Đối tượng FormData chứa thông tin tài khoản và file avatar.
   *
   */
  createAccount: (formData: FormData) => {
    return api.post('/accounts', formData, {
      // Axios sẽ tự động set Content-Type là multipart/form-data khi bạn truyền FormData
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Cập nhật tài khoản bằng ID.
   * @param id - ID của tài khoản cần cập nhật
   * @param data - Đối tượng FormData (nếu có avatar) hoặc object (nếu chỉ cập nhật text)
   */
  updateAccount: (id: string, data: any) => {
    const isFormData = data instanceof FormData
    return api.put(`/accounts/${id}`, data, {
      headers: {
        // Chỉ set header này nếu là FormData, nếu không axios sẽ tự đặt là application/json
        ...(isFormData && { 'Content-Type': 'multipart/form-data' })
      }
    })
  }
}

//------------------------------------------------
// DOCUMENT API
//------------------------------------------------
export const documentApi = {
  /**
   * Lấy danh sách tài liệu có phân trang và bộ lọc.
   * @param params - Đối tượng chứa các query params như: { page, limit, search, scope }
   *
   */
  getDocuments: (params?: {
    page?: number
    limit?: number
    search?: string
    scope?: 'chapter' | 'private'
  }) => {
    return api.get('/documents', { params })
  },

  /**
   * Lấy thông tin chi tiết của một tài liệu bằng ID.
   * @param id - ID của tài liệu
   */
  getDocumentById: (id: string) => {
    return api.get(`/documents/${id}`)
  },

  /**
   * Tạo một tài liệu mới.
   * @param formData - Đối tượng FormData chứa thông tin và file PDF.
   *
   */
  createDocument: (formData: FormData) => {
    return api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Cập nhật thông tin tài liệu bằng ID.
   * @param id - ID của tài liệu
   * @param formData - FormData chứa thông tin và file PDF mới (nếu có).
   */
  updateDocument: (id: string, formData: FormData) => {
    return api.put(`/documents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Xóa một tài liệu bằng ID.
   * @param id - ID của tài liệu
   */
  deleteDocument: (id: string) => {
    return api.delete(`/documents/${id}`)
  }
}

//------------------------------------------------
// EVENT API
//------------------------------------------------
export const eventApi = {
  /**
   * Lấy danh sách sự kiện có phân trang và bộ lọc
   * @param params - Đối tượng chứa các query params như: { page, limit, search, scope }
   */
  getEvents: (params?: {
    page?: number
    limit?: number
    search?: string
    scope?: 'chapter' | 'private'
    status?: string
  }) => {
    return api.get('/events', { params })
  },

  /**
   * Lấy thông tin chi tiết của một sự kiện bằng ID
   * @param id - ID của sự kiện
   */
  getEventById: (id: string) => {
    return api.get(`/events/${id}`)
  },

  /**
   * Tạo một sự kiện mới
   * @param formData - FormData chứa thông tin và hình ảnh của sự kiện
   */
  createEvent: (formData: FormData) => {
    return api.post('/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Cập nhật thông tin sự kiện bằng ID
   * @param id - ID của sự kiện
   * @param formData - FormData chứa thông tin và hình ảnh mới (nếu có)
   */
  updateEvent: (id: string, formData: FormData) => {
    return api.put(`/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Xóa một sự kiện bằng ID
   * @param id - ID của sự kiện
   */
  deleteEvent: (id: string) => {
    return api.delete(`/events/${id}`)
  }
}
