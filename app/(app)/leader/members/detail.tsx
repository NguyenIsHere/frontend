import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

// 1. Import API và các hàm cần thiết
import { accountApi } from '../../../../api' // Cập nhật đường dẫn nếu cần

// Kiểu dữ liệu cho tài khoản trả về từ API
type Account = any // Bạn có thể định nghĩa type này chi tiết hơn

// 2. Hàm tiện ích để định dạng
const formatDate = (isoDate?: string) => {
  if (!isoDate) return 'Chưa cập nhật'
  const date = new Date(isoDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const formatGender = (gender?: 'male' | 'female') => {
  if (gender === 'male') return 'Nam'
  if (gender === 'female') return 'Nữ'
  return 'Chưa cập nhật'
}

const formatRole = (role?: 'admin' | 'manager' | 'member') => {
  if (role === 'admin') return 'Quản trị viên'
  if (role === 'manager') return 'Cán bộ chi đoàn'
  if (role === 'member') return 'Đoàn viên'
  return 'Không xác định'
}

// --- COMPONENT HIỂN THỊ MỘT DÒNG THÔNG TIN ---
// Giúp code JSX gọn hơn
const InfoRow = ({
  label,
  value
}: {
  label: string
  value?: string | null
}) => (
  <View className='mb-4'>
    <Text className='text-sm text-gray-500 mb-1'>{label}</Text>
    <Text className='p-3 rounded-lg bg-white text-base text-gray-800 border border-gray-200'>
      {value || 'Chưa cập nhật'}
    </Text>
  </View>
)

// --- COMPONENT CHÍNH ---
export default function MemberDetail () {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  // 3. Thêm State để quản lý dữ liệu, loading và lỗi
  const [account, setAccount] = useState<Account | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 4. Dùng useEffect để gọi API
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
          setAccount(response.data.data)
        } else {
          throw new Error(response.data.message)
        }
      } catch (e: any) {
        setError(e.message || 'Không thể tải thông tin chi tiết.')
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountDetail()
  }, [id])

  // --- RENDER GIAO DIỆN ---

  if (isLoading) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-100'>
        <ActivityIndicator size='large' color='#3E4FF5' />
      </View>
    )
  }

  if (error || !account) {
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

  // 5. Ánh xạ dữ liệu từ state 'account' vào giao diện
  return (
    <SafeAreaView className='flex-1 bg-gray-100'>
      {/* Header */}
      <View className='bg-blue-600 p-4 flex-row items-center'>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='white' />
        </TouchableOpacity>
        <Text className='text-white text-xl font-bold ml-4'>
          {account.fullname}
        </Text>
      </View>

      <ScrollView className='flex-1'>
        <View className='items-center mt-6'>
          <Image
            source={
              account.avatar?.url
                ? { uri: account.avatar.url }
                : require('../../../../assets/images/avatar-placeholder.png')
            }
            className='w-24 h-24 rounded-full'
          />
          <Text className='text-2xl font-bold mt-3'>{account.fullname}</Text>
          <Text className='text-base text-gray-500'>
            {account.chapterId?.name || 'Chưa thuộc chi đoàn'}
          </Text>
        </View>

        <View className='p-4 mt-4'>
          <InfoRow label='Quyền tài khoản' value={formatRole(account.role)} />
          <InfoRow label='Số thẻ đoàn' value={account.cardCode} />
          <InfoRow label='Chức vụ' value={account.position} />
          <InfoRow label='Giới tính' value={formatGender(account.gender)} />
          <InfoRow label='Ngày sinh' value={formatDate(account.birthday)} />
          <InfoRow label='Số điện thoại' value={account.phone} />
          <InfoRow label='Email' value={account.email} />
          <InfoRow label='Quê quán' value={account.hometown} />
          <InfoRow label='Địa chỉ' value={account.address} />
          <InfoRow label='Dân tộc' value={account.ethnicity} />
          <InfoRow label='Tôn giáo' value={account.religion} />
          <InfoRow label='Trình độ học vấn' value={account.eduLevel} />
          <InfoRow label='Ngày vào đoàn' value={formatDate(account.joinedAt)} />
        </View>

        <View className='flex-row justify-between p-4'>
          <TouchableOpacity className='bg-red-600 p-3 rounded-lg flex-1 mr-2 flex-row justify-center items-center'>
            <Ionicons name='trash-outline' size={24} color='white' />
            <Text className='text-white font-bold ml-2'>Xóa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className='bg-blue-600 p-3 rounded-lg flex-1 ml-2 flex-row justify-center items-center'
            onPress={() =>
              router.push({
                pathname: '/(app)/leader/members/edit', // Hoặc màn hình chỉnh sửa
                params: { id: account._id } // Chỉ cần truyền ID là đủ
              })
            }
          >
            <Ionicons name='pencil-outline' size={24} color='white' />
            <Text className='text-white font-bold ml-2'>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
