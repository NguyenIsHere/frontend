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

// Import các hàm API và thư viện cần thiết
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getProfile, login } from '../../api' // Giả sử file api/index.ts nằm trong thư mục 'api'

const LoginScreen = () => {
  const router = useRouter() // Hook để điều hướng

  // State cho các input
  const [keyAuth, setKeyAuth] = useState('') // Sẽ được dùng làm email
  const [password, setPassword] = useState('')

  // State cho UI
  const [isVisibilePassword, setIsVisibilePassword] = useState(false)
  const [isRememberPassword, setIsRememberPassword] = useState(false)

  // State cho việc gọi API
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hàm xử lý logic đăng nhập
  const handleLogin = async () => {
    // 1. Kiểm tra input
    if (!keyAuth || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ email và mật khẩu.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 2. Gọi API đăng nhập để lấy token
      const loginResponse = await login({ email: keyAuth, password })
      const token = loginResponse.data.token //

      if (!token) {
        throw new Error('Không nhận được token từ server.')
      }

      // 3. Lưu token vào AsyncStorage
      await AsyncStorage.setItem('@user_token', token)

      // 4. Gọi API getProfile để lấy thông tin chi tiết của người dùng (bao gồm role)
      // Interceptor của axios sẽ tự động đính kèm token vừa lưu
      const profileResponse = await getProfile()
      const userRole = profileResponse.data.role //

      // 5. Điều hướng dựa trên vai trò (role) của người dùng
      if (userRole === 'admin') {
        router.replace('/(app)/admin/accounts')
      } else if (userRole === 'manager') {
        router.replace('/(app)/leader/members')
      }
    } catch (err: any) {
      // 6. Xử lý lỗi
      const errorMessage =
        err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.'
      setError(errorMessage)
      Alert.alert('Đăng nhập thất bại', errorMessage)
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
            value={keyAuth}
            onChangeText={setKeyAuth}
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

// Tách style ra để dễ quản lý và tái sử dụng
const styles = StyleSheet.create({
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
