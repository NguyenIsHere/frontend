import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'

// 1. Import API
import { accountApi } from '../../../../api'

// Kiểu dữ liệu cho state của form
// Giúp quản lý các giá trị người dùng nhập vào
type FormData = {
  fullname: string
  phone: string
  email: string
  cardCode: string
  position: string
  hometown: string
  address: string
  ethnicity: string
  religion: string
  eduLevel: string
  joinedAt?: string // Ngày tham gia, có thể là chuỗi ISO hoặc undefined
  // Các trường khác có thể thêm vào đây nếu cần
}

// --- COMPONENT INPUT CÓ THỂ CHỈNH SỬA ---
// Thay thế cho InfoRow, giúp code JSX gọn hơn
const EditableRow = ({
  label,
  value,
  onChangeText,
  placeholder,
  ...props
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  [key: string]: any
}) => (
  <View className='mb-4'>
    <Text className='text-sm text-gray-500 mb-1 font-medium'>{label}</Text>
    <TextInput
      className='px-3 pb-4 pt-2 rounded-lg bg-white text-base text-gray-800 border border-gray-200'
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || `Nhập ${label.toLowerCase()}`}
      placeholderTextColor='#9CA3AF' // Thêm màu cho placeholder để rõ ràng hơn
      {...props}
    />
  </View>
)

const formatDate = (isoDate?: string) => {
  if (!isoDate) return 'Chưa cập nhật'
  const date = new Date(isoDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// --- COMPONENT CHÍNH ---
export default function EditMemberScreen () {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  // 2. Thêm state cho form và trạng thái lưu
  const [formData, setFormData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false) // State khi nhấn nút lưu
  const [error, setError] = useState<string | null>(null)

  // 3. useEffect để lấy dữ liệu ban đầu và điền vào form
  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy ID của đoàn viên.')
      setIsLoading(false)
      return
    }

    const fetchAccountDetail = async () => {
      try {
        const response = await accountApi.getAccountById(id)
        if (response.data.success) {
          // Lấy dữ liệu và điền vào state của form
          const account = response.data.data
          setFormData({
            fullname: account.fullname || '',
            phone: account.phone || '',
            email: account.email || '',
            cardCode: account.cardCode || '',
            position: account.position || '',
            hometown: account.hometown || '',
            address: account.address || '',
            ethnicity: account.ethnicity || '',
            religion: account.religion || '',
            eduLevel: account.eduLevel || '',
            joinedAt: formatDate(account.joinedAt) || ''
          })
        } else {
          throw new Error(response.data.message)
        }
      } catch (e: any) {
        setError(e.message || 'Không thể tải thông tin chi tiết.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountDetail()
  }, [id])

  // Hàm cập nhật state của form một cách linh hoạt
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => (prev ? { ...prev, [field]: value } : null))
  }

  // 4. Hàm xử lý khi nhấn nút "Lưu thay đổi"
  const handleSaveChanges = async () => {
    if (!formData || !id) return

    setIsSaving(true)
    try {
      // Gọi API updateAccount, truyền id và dữ liệu form
      await accountApi.updateAccount(id, formData)

      Alert.alert('Thành công', 'Đã cập nhật thông tin đoàn viên.', [
        { text: 'OK', onPress: () => router.back() } // Quay lại trang trước sau khi lưu
      ])
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu thay đổi.')
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  // --- RENDER GIAO DIỆN ---

  if (isLoading) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-100'>
        <ActivityIndicator size='large' color='#3E4FF5' />
      </View>
    )
  }

  if (error || !formData) {
    // ... (Giao diện báo lỗi giữ nguyên)
    return (
      <SafeAreaView className='flex-1 bg-gray-100'>
        <View className='bg-blue-600 p-4 flex-row items-center'>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={24} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-xl font-bold ml-4'>Lỗi</Text>
        </View>
        <View className='flex-1 justify-center items-center'>
          <Text className='text-red-500 text-lg'>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-100'>
      <View className='bg-blue-600 p-4 flex-row items-center'>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='white' />
        </TouchableOpacity>
        <Text className='text-white text-xl font-bold ml-4'>
          Chỉnh sửa thông tin
        </Text>
      </View>

      <ScrollView className='flex-1' keyboardShouldPersistTaps='handled'>
        <View className='p-4'>
          {/* 5. Thay thế InfoRow bằng EditableRow và kết nối với state */}
          <EditableRow
            label='Họ và tên'
            value={formData.fullname}
            onChangeText={text => handleInputChange('fullname', text)}
          />
          <EditableRow
            label='Email'
            value={formData.email}
            onChangeText={text => handleInputChange('email', text)}
            keyboardType='email-address'
          />
          <EditableRow
            label='Số điện thoại'
            value={formData.phone}
            onChangeText={text => handleInputChange('phone', text)}
            keyboardType='phone-pad'
          />
          <EditableRow
            label='Số thẻ đoàn'
            value={formData.cardCode}
            onChangeText={text => handleInputChange('cardCode', text)}
          />
          <EditableRow
            label='Chức vụ'
            value={formData.position}
            onChangeText={text => handleInputChange('position', text)}
          />
          <EditableRow
            label='Địa chỉ'
            value={formData.address}
            onChangeText={text => handleInputChange('address', text)}
          />
          <EditableRow
            label='Quê quán'
            value={formData.hometown}
            onChangeText={text => handleInputChange('hometown', text)}
          />
          <EditableRow
            label='Dân tộc'
            value={formData.ethnicity}
            onChangeText={text => handleInputChange('ethnicity', text)}
          />
          <EditableRow
            label='Tôn giáo'
            value={formData.religion}
            onChangeText={text => handleInputChange('religion', text)}
          />
          <EditableRow
            label='Trình độ học vấn'
            value={formData.eduLevel}
            onChangeText={text => handleInputChange('eduLevel', text)}
          />
          <EditableRow
            label='Ngày vào đoàn'
            value={formData.joinedAt || ''}
            onChangeText={text => handleInputChange('joinedAt', text)}
            placeholder='DD/MM/YYYY'
          />

          {/* Nút Lưu thay đổi */}
          <TouchableOpacity
            className={`p-4 rounded-lg flex-row justify-center items-center mt-4 ${
              isSaving ? 'bg-blue-300' : 'bg-blue-600'
            }`}
            onPress={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color='white' />
            ) : (
              <>
                <Ionicons name='save-outline' size={22} color='white' />
                <Text className='text-white font-bold ml-2 text-base'>
                  Lưu thay đổi
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
