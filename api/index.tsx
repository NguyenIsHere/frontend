// const API_BASE_URL = 'http://192.168.1.6:5000/api'

import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

// 1. CẤU HÌNH AXIOS INSTANCE
//================================================================================
const API_URL = 'https://be-qldv.onrender.com/api' // Sử dụng port 5000 như đã thống nhất

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
   * Lấy danh sách tài khoản theo trang và bộ lọc
   * @param params - { page, limit, search, status, role }
   */
  getAccounts: (params?: any) => {
    return api.get('/accounts', { params })
  },

  /**
   * Lấy thông tin chi tiết một tài khoản
   * @param id - ID của tài khoản
   */
  getAccountById: (id: string) => {
    return api.get(`/accounts/${id}`)
  },

  /**
   * Tạo tài khoản mới (thường dùng bởi admin)
   * @param formData - FormData object chứa thông tin tài khoản
   */
  createAccount: (formData: FormData) => {
    return api.post('/accounts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Cập nhật tài khoản bằng ID
   * @param id - ID của tài khoản
   * @param formData - FormData object chứa thông tin cần cập nhật
   */
  updateAccount: (id: string, formData: FormData) => {
    return api.put(`/accounts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
