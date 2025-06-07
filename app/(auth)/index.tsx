// LoginScreen.tsx (phiên bản đã chỉnh sửa)

import Feather from '@expo/vector-icons/Feather'
import Fontisto from '@expo/vector-icons/Fontisto'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'

// Thay đổi import để khớp với cấu trúc api/index.tsx
import { authApi } from '../../api'

const LoginScreen = () => {
  const router = useRouter()

  const [email, setEmail] = useState('') // Đổi tên cho rõ ràng
  const [password, setPassword] = useState('')
  const [isVisibilePassword, setIsVisibilePassword] = useState(false)
  const [isRememberPassword, setIsRememberPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Tối ưu hóa hàm handleLogin
   */
  const handleLogin = async () => {
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ email và mật khẩu.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Chỉ cần gọi API login. Hàm này đã tự động lưu token.
      const response = await authApi.login({
        email: trimmedEmail,
        password: trimmedPassword
      })

      // 2. Lấy thông tin account trực tiếp từ response login để tránh gọi getProfile()
      // Dựa vào BE, response trả về { success, message, data: { token, account } }
      const account = response.data?.account

      if (!account || !account.role) {
        throw new Error('Không nhận được thông tin tài khoản từ server.')
      }

      // 3. Điều hướng dựa trên vai trò (role)
      // Các đường dẫn này cần khớp với cấu trúc file trong thư mục (app) của bạn
      if (account.role === 'admin') {
        router.replace('/(app)/admin/accounts') // Ví dụ: chuyển đến tab admin
      } else if (account.role === 'manager') {
        router.replace('/(app)/leader/members') // Ví dụ: chuyển đến tab manager
      }
    } catch (err: any) {
      // 4. Xử lý lỗi
      const errorMessage =
        err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.'
      setError(errorMessage)
      // Alert.alert('Đăng nhập thất bại', errorMessage); // Có thể bỏ Alert nếu đã hiển thị lỗi dưới nút bấm
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: '#3E4FF5', flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
    >
      <Image
        source={require('../../assets/images/banner.png')}
        style={styles.bannerImage}
      />

      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
        />
        <Text style={styles.logoText}>
          Hệ thống hỗ trợ {'\n'}nghiệp vụ công tác đoàn
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Đăng nhập</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Feather
            name='mail'
            size={24}
            color='#3E4FF5'
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder='Nhập email của bạn'
            value={email}
            onChangeText={setEmail} // Cập nhật state email
            keyboardType='email-address'
            autoCapitalize='none'
            editable={!loading}
          />
        </View>

        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.inputContainer}>
          <Feather
            name='lock'
            size={24}
            color='#3E4FF5'
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            secureTextEntry={!isVisibilePassword}
            placeholder='Nhập mật khẩu của bạn'
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setIsVisibilePassword(!isVisibilePassword)}
          >
            <Feather
              name={isVisibilePassword ? 'eye-off' : 'eye'}
              size={24}
              color='#3E4FF5'
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          <View style={styles.rememberContainer}>
            <TouchableOpacity
              onPress={() => setIsRememberPassword(!isRememberPassword)}
            >
              <Fontisto
                name={
                  isRememberPassword ? 'checkbox-active' : 'checkbox-passive'
                }
                size={16}
                color='black'
              />
            </TouchableOpacity>
            <Text style={styles.optionsText}>Nhớ mật khẩu</Text>
          </View>
          <Link href={'/(auth)/recoveryPassword'} style={styles.optionsText}>
            Quên mật khẩu ?
          </Link>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: loading ? '#A9B0E8' : '#4955CE' }
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color='white' />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.registerText}>
          Bạn chưa có tài khoản ?{' '}
          <Link href={'/(auth)/register'} style={styles.registerLink}>
            Đăng ký ngay
          </Link>
        </Text>
      </View>
    </ScrollView>
  )
}

// ... (phần styles giữ nguyên)
const styles = StyleSheet.create({
  // ... Giao diện không đổi
  bannerImage: {
    width: 'auto',
    height: 180
  },
  logoContainer: {
    top: -46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    left: 10
  },
  logoImage: {
    resizeMode: 'contain',
    height: 90,
    width: 90
  },
  logoText: {
    flex: 7,
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginHorizontal: 10,
    marginBottom: 20
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    fontSize: 30
  },
  label: {
    color: '#3E4FF5',
    marginBottom: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    borderColor: '#3E4FF5',
    marginBottom: 15,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2
        }
      : {
          elevation: 3
        })
  },
  inputIcon: {
    marginLeft: 10
  },
  eyeIcon: {
    padding: 10
  },
  textInput: {
    marginLeft: 10,
    flex: 1,
    height: '100%'
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10
  },
  rememberContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    alignItems: 'center'
  },
  optionsText: {
    color: '#3E4FF5'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10
  },
  loginButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 10,
    marginTop: 10
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  registerText: {
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold'
  },
  registerLink: {
    color: '#3E4FF5'
  }
})

export default LoginScreen
