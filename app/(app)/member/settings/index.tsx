import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

// 1. Import authApi đã tạo
import { authApi } from '../../../../api' // Cập nhật đường dẫn này nếu cần

const Settings = () => {
  const router = useRouter()

  // 2. Tạo hàm xử lý đăng xuất
  const handleLogout = () => {
    // Hiển thị hộp thoại xác nhận trước khi đăng xuất
    Alert.alert(
      'Xác nhận Đăng xuất', // Tiêu đề
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?', // Nội dung
      [
        {
          text: 'Hủy',
          style: 'cancel' // Nút hủy
        },
        {
          text: 'Đăng xuất',
          style: 'destructive', // Nút đăng xuất (màu đỏ trên iOS)
          onPress: async () => {
            try {
              // Gọi hàm logout từ API để xóa token
              await authApi.logout()

              // Điều hướng người dùng về màn hình đăng nhập
              // Dùng replace để người dùng không thể "back" lại màn hình cũ
              router.replace('/(auth)')
            } catch (error) {
              console.error('Lỗi khi đăng xuất:', error)
              Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi đăng xuất.')
            }
          }
        }
      ]
    )
  }

  return (
    // 3. Cập nhật giao diện
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <View style={styles.content}>
        {/* Nút Đăng xuất */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name='log-out-outline' size={24} color='#EF4444' />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// 4. Thêm StyleSheet để làm đẹp
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6' // Màu nền giống các màn hình khác
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827'
  },
  content: {
    padding: 20
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2' // Màu viền đỏ nhạt
  },
  logoutButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444' // Màu chữ đỏ
  }
})

export default Settings
