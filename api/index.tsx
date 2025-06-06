import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { Platform } from 'react-native'

// --- 1. CẤU HÌNH AXIOS ---

const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api' // URL cho máy ảo Android
    : 'http://localhost:5000/api' // URL cho máy ảo iOS hoặc môi trường khác

// Tạo một instance của axios với cấu hình cơ sở
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000 // Timeout 10 giây
})

// Thiết lập Interceptor để tự động đính kèm token vào mỗi request
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('@user_token')
    if (token) {
      // Đính kèm token vào header Authorization theo chuẩn Bearer
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// --- 2. ĐỊNH NGHĨA TYPESCRIPT (KHỚP VỚI MODEL) ---

// Các kiểu dữ liệu enum để tái sử dụng
export type AccountStatus = 'active' | 'banned' | 'waiting'
export type AccountRole = 'admin' | 'manager' | 'member'
export type Gender = 'Nam' | 'Nữ'
export type MemberPosition =
  | 'Bí thư'
  | 'Phó Bí thư'
  | 'Ủy viên BCH'
  | 'Đoàn viên'

// Interface cho Chapter (dùng trong populate)
export interface Chapter {
  _id: string
  name: string
  // Thêm các trường khác của Chapter nếu cần
}

// Interface cho Member model
export interface Member {
  _id: string
  status: AccountStatus
  chapterId: Chapter | string // Có thể là object đã populate hoặc chỉ là ID
  position: MemberPosition
  cardId: string
  joinedAt: string // Dùng kiểu string để dễ xử lý
  address: string
  hometown: string
  ethnicity: string
  religion: string
  eduLevel: string
}

// Interface cho Account model
export interface Account {
  _id: string
  status: AccountStatus
  email: string
  phone: string
  avatar?: string
  fullname: string
  birthday: string
  gender: Gender
  role: AccountRole
  infoMember?: Member | string // Có thể là object đã populate hoặc chỉ là ID
  managerOf?: Chapter | string // Có thể là object đã populate hoặc chỉ là ID
}

// Interface cho Response khi đăng nhập thành công
export interface LoginResponse {
  message: string
  data: {
    token: string
    // Backend hiện tại chỉ trả về token, nhưng một thiết kế tốt nên trả về cả user
    // user: Account;
  }
}

// Interface cho Response khi lấy danh sách Member (có phân trang)
export interface MembersApiResponse {
  members: Account[] // API trả về danh sách các Account đã populate infoMember
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

// --- 3. CÁC HÀM GỌI API CHO AUTH ---

/**
 * Đăng nhập tài khoản.
 * @param credentials - email và password.
 */
export const login = async (credentials: {
  email: string
  password: string
}): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

/**
 * Đăng ký tài khoản mới.
 * @param formData - Dữ liệu dạng FormData, bao gồm cả file avatar (nếu có).
 */
export const register = async (
  formData: FormData
): Promise<{ data: Account }> => {
  const response = await api.post('/auth/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data' // Bắt buộc ghi đè header cho FormData
    }
  })
  return response.data
}

/**
 * Đăng xuất.
 */
export const logout = async (): Promise<void> => {
  await api.delete('/auth/logout')
}

/**
 * Lấy thông tin hồ sơ của người dùng đang đăng nhập.
 */
export const getProfile = async (): Promise<{ data: Account }> => {
  const response = await api.get('/auth')
  return response.data
}

/**
 * Cập nhật thông tin hồ sơ.
 * @param formData - Dữ liệu dạng FormData, bao gồm cả file avatar mới (nếu có).
 */
export const updateProfile = async (
  formData: FormData
): Promise<{ data: Account }> => {
  const response = await api.put('/auth', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// --- 4. CÁC HÀM GỌI API CHO MEMBER ---

/**
 * Lấy danh sách đoàn viên (có phân trang, lọc, tìm kiếm).
 */
export const getMembers = async (params: {
  page?: number
  limit?: number
  position?: MemberPosition | 'all'
  status?: AccountStatus | 'all'
  search?: string
}): Promise<MembersApiResponse> => {
  const response = await api.get('/members', { params })
  return response.data
}

/**
 * Lấy thông tin chi tiết của một đoàn viên bằng ID.
 * @param memberId - ID của Member.
 */
export const getMemberById = async (
  memberId: string
): Promise<{ data: { account: Account; member: Member } }> => {
  const response = await api.get(`/members/${memberId}`)
  return response.data
}

/**
 * Cập nhật thông tin của một đoàn viên bằng ID.
 * @param memberId - ID của Member.
 * @param data - Dữ liệu cần cập nhật.
 */
export const updateMemberById = async (
  memberId: string,
  data: Partial<Member>
): Promise<{ data: Member }> => {
  const response = await api.put(`/members/${memberId}`, data)
  return response.data
}

/**
 * Thay đổi trạng thái của một đoàn viên (active, banned,...).
 * @param memberId - ID của Member.
 * @param status - Trạng thái mới.
 */
export const changeMemberStatus = async (
  memberId: string,
  status: AccountStatus
): Promise<any> => {
  const response = await api.patch(`/members/${memberId}`, { status })
  return response.data
}
