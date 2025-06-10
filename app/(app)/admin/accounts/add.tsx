import { Feather } from '@expo/vector-icons'
import DateTimePicker, {
  DateTimePickerEvent
} from '@react-native-community/datetimepicker'
import * as DocumentPicker from 'expo-document-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'

// Giả định các API này được định nghĩa ở nơi khác
import { accountApi, chapterApi } from '../../../../api'

// --- 1. Type Definitions (Định nghĩa kiểu) ---

// Tùy chọn cho Dropdown
interface DropdownOption {
  label: string
  value: string
}

// Dữ liệu chapter
interface Chapter {
  _id: string
  name: string
}

// Dữ liệu file avatar được chọn
interface AvatarFile {
  uri: string
  name: string
  type: string
}

// Trạng thái của form
interface FormDataState {
  fullname: string
  email: string
  phone: string
  password: string
  role: string
  gender: string
  chapterId: string
  cardCode: string
  position: string
  hometown: string
  ethnicity: string
  religion: string
  eduLevel: string
}

// Dữ liệu tài khoản nhận về từ API
interface AccountData {
  fullname?: string
  email?: string
  phone?: string
  role?: string
  gender?: string
  chapterId?: { _id: string }
  cardCode?: string
  position?: string
  hometown?: string
  ethnicity?: string
  religion?: string
  eduLevel?: string
  birthday?: string
  joinedAt?: string
  avatar?: { url: string }
}

// Props cho CustomDropdown
type CustomDropdownProps = {
  options: DropdownOption[]
  placeholder: string
  onSelect: (value: string) => void
  selectedValue: string
  disabled?: boolean
}

// Props cho FormInput
type FormInputProps = React.ComponentProps<typeof TextInput> & {
  label: string
  required?: boolean
}

// Props cho FormDatePicker
type FormDatePickerProps = {
  label: string
  value?: Date
  onPress: () => void
  required?: boolean
}

// --- 2. Components (Thành phần giao diện) ---

/**
 * SỬA LỖI: Component Dropdown tùy chỉnh sử dụng Modal.
 * Component này giờ sẽ tự quản lý trạng thái đóng/mở và render danh sách
 * trên một Modal để đảm bảo nó luôn hiển thị trên cùng, không bị che khuất.
 */
const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  placeholder,
  onSelect,
  selectedValue,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  // SỬA LỖI 1: Thay đổi kiểu của ref từ `TouchableOpacity` thành `View`.
  // `TouchableOpacity` sẽ chuyển tiếp ref đến một `View` bên trong, và phương thức `measure`
  // có sẵn trên `View`. Điều này giải quyết lỗi `ts(2749)`.
  const buttonRef = useRef<View>(null)

  const displayLabel =
    options.find(opt => opt.value === selectedValue)?.label || placeholder

  const handleToggle = () => {
    if (disabled) return

    if (isOpen) {
      setIsOpen(false)
    } else {
      // Đo vị trí của nút để định vị Modal
      // SỬA LỖI 2: Thêm kiểu dữ liệu (number) cho các tham số của hàm `measure`.
      // Điều này giải quyết các lỗi `ts(7006)` về `implicitly has an 'any' type`.
      // Các tham số `_x` và `_y` không được sử dụng nên có dấu gạch dưới.
      buttonRef.current?.measure(
        (
          _x: number,
          _y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          setPosition({ top: pageY + height + 4, left: pageX, width })
          setIsOpen(true)
        }
      )
    }
  }

  const handleSelectOption = (value: string) => {
    onSelect(value)
    setIsOpen(false)
  }

  return (
    <View>
      <TouchableOpacity
        ref={buttonRef}
        onPress={handleToggle}
        style={[
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled
        ]}
        disabled={disabled}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            !selectedValue && styles.placeholderText,
            disabled && styles.disabledText
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={disabled ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent={true}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdownListContainer,
              { top: position.top, left: position.left, width: position.width }
            ]}
          >
            <ScrollView nestedScrollEnabled>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={`${option.value}-${index}`}
                  onPress={() => handleSelectOption(option.value)}
                  style={[
                    styles.dropdownItem,
                    index === options.length - 1 && styles.lastDropdownItem
                  ]}
                >
                  <Text style={styles.dropdownItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  required = false,
  ...props
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput style={styles.input} placeholderTextColor='#9CA3AF' {...props} />
  </View>
)

const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onPress,
  required = false
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TouchableOpacity onPress={onPress} style={styles.datePickerButton}>
      <Text
        style={[styles.dropdownButtonText, !value && styles.placeholderText]}
      >
        {value
          ? value.toLocaleDateString('vi-VN')
          : `Chọn ${label.toLowerCase()}`}
      </Text>
    </TouchableOpacity>
  </View>
)

// --- 3. Constants (Hằng số) ---
const GENDER_OPTIONS: DropdownOption[] = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' }
]
const ROLE_OPTIONS: DropdownOption[] = [
  { label: 'Đoàn viên', value: 'member' },
  { label: 'Quản lý Chi đoàn', value: 'manager' },
  { label: 'Quản trị viên', value: 'admin' }
]
const POSITION_OPTIONS: DropdownOption[] = [
  { label: 'Đoàn viên', value: 'member' },
  { label: 'Bí thư', value: 'secretary' },
  { label: 'Phó Bí thư', value: 'deputy_secretary' },
  { label: 'Ủy viên BCH', value: 'executive_member' }
]

// --- 4. Main Screen Component ---
export default function AddEditAccountScreen () {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEditMode = !!id

  const [formData, setFormData] = useState<FormDataState>({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    gender: '',
    chapterId: '',
    cardCode: '',
    position: '',
    hometown: '',
    ethnicity: '',
    religion: '',
    eduLevel: ''
  })

  const [birthday, setBirthday] = useState<Date | undefined>()
  const [joinedAt, setJoinedAt] = useState<Date | undefined>()
  const [avatar, setAvatar] = useState<AvatarFile | null>(null)
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(
    null
  )

  const [chapters, setChapters] = useState<DropdownOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState<
    'birthday' | 'joinedAt' | null
  >(null)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const chapterRes = await chapterApi.getChapters({ limit: 1000 })
        if (chapterRes.data.success) {
          setChapters(
            chapterRes.data.data.map((c: Chapter) => ({
              label: c.name,
              value: c._id
            }))
          )
        }

        if (isEditMode && id) {
          const accountRes = await accountApi.getAccountById(id)
          const account: AccountData = accountRes.data.data
          setFormData({
            fullname: account.fullname || '',
            email: account.email || '',
            phone: account.phone || '',
            password: '',
            role: account.role || '',
            gender: account.gender || '',
            chapterId: account.chapterId?._id || '',
            cardCode: account.cardCode || '',
            position: account.position || '',
            hometown: account.hometown || '',
            ethnicity: account.ethnicity || '',
            religion: account.religion || '',
            eduLevel: account.eduLevel || ''
          })
          if (account.birthday) setBirthday(new Date(account.birthday))
          if (account.joinedAt) setJoinedAt(new Date(account.joinedAt))
          if (account.avatar?.url) setExistingAvatarUrl(account.avatar.url)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
        Alert.alert('Lỗi', 'Không thể tải dữ liệu cần thiết.')
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [id, isEditMode])

  const handleInputChange = (field: keyof FormDataState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' })
      if (!result.canceled) {
        const asset = result.assets[0]
        setAvatar({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'image/jpeg'
        })
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Lỗi', 'Không thể chọn ảnh.')
    }
  }

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    const currentDate =
      selectedDate || (showDatePicker === 'birthday' ? birthday : joinedAt)
    setShowDatePicker(null)
    if (event.type === 'set' && currentDate) {
      if (showDatePicker === 'birthday') {
        setBirthday(currentDate)
      } else if (showDatePicker === 'joinedAt') {
        setJoinedAt(currentDate)
      }
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const data = new FormData()

    Object.keys(formData).forEach(key => {
      const formKey = key as keyof FormDataState
      if (isEditMode && formKey === 'email') {
        return // Không gửi email khi chỉnh sửa
      }
      if (formData[formKey]) {
        data.append(key, formData[formKey])
      }
    })

    if (birthday) data.append('birthday', birthday.toISOString().split('T')[0])
    if (formData.role === 'member' && joinedAt) {
      data.append('joinedAt', joinedAt.toISOString().split('T')[0])
    }
    if (avatar) {
      data.append('avatar', {
        uri: avatar.uri,
        name: avatar.name,
        type: avatar.type
      } as any)
    }

    try {
      if (isEditMode && id) {
        await accountApi.updateAccount(id, data)
        Alert.alert('Thành công', 'Đã cập nhật tài khoản.')
      } else {
        await accountApi.createAccount(data)
        Alert.alert('Thành công', 'Đã tạo tài khoản mới.')
      }
      router.back()
    } catch (e: any) {
      console.error('Submit error:', e.response?.data)
      Alert.alert('Lỗi', e.response?.data?.message || 'Thao tác thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#3E4FF5' />
      </View>
    )
  }

  const renderRoleSpecificFields = () => {
    if (formData.role !== 'manager' && formData.role !== 'member') return null

    return (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Chi đoàn <Text style={styles.required}>*</Text>
          </Text>
          <CustomDropdown
            placeholder='Chọn chi đoàn'
            options={chapters}
            selectedValue={formData.chapterId}
            onSelect={v => handleInputChange('chapterId', v)}
          />
        </View>

        {formData.role === 'member' && (
          <>
            <FormInput
              label='Số thẻ Đoàn'
              required
              value={formData.cardCode}
              onChangeText={v => handleInputChange('cardCode', v)}
            />
            <FormDatePicker
              label='Ngày vào Đoàn'
              required
              value={joinedAt}
              onPress={() => setShowDatePicker('joinedAt')}
            />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Chức vụ <Text style={styles.required}>*</Text>
              </Text>
              <CustomDropdown
                placeholder='Chọn chức vụ'
                options={POSITION_OPTIONS}
                selectedValue={formData.position}
                onSelect={v => handleInputChange('position', v)}
              />
            </View>
            <FormInput
              label='Quê quán'
              required
              value={formData.hometown}
              onChangeText={v => handleInputChange('hometown', v)}
            />
            <FormInput
              label='Dân tộc'
              required
              value={formData.ethnicity}
              onChangeText={v => handleInputChange('ethnicity', v)}
            />
            <FormInput
              label='Tôn giáo'
              required
              value={formData.religion}
              onChangeText={v => handleInputChange('religion', v)}
            />
            <FormInput
              label='Trình độ học vấn'
              required
              value={formData.eduLevel}
              onChangeText={v => handleInputChange('eduLevel', v)}
            />
          </>
        )}
      </>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name='arrow-left' size={24} color='white' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Chỉnh sửa Tài khoản' : 'Tạo Tài khoản'}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.backButton}
        >
          {isSubmitting ? (
            <ActivityIndicator color='white' size='small' />
          ) : (
            <Feather name='check' size={24} color='white' />
          )}
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity
            onPress={handleSelectImage}
            style={styles.avatarPicker}
          >
            <Image
              source={
                avatar?.uri
                  ? { uri: avatar.uri }
                  : existingAvatarUrl
                  ? { uri: existingAvatarUrl }
                  : require('../../../../assets/images/avatar-placeholder.png')
              }
              style={styles.avatar}
            />
            <View style={styles.cameraIconContainer}>
              <Feather name='camera' size={16} color='white' />
            </View>
          </TouchableOpacity>

          <FormInput
            label='Họ và tên'
            required
            value={formData.fullname}
            onChangeText={(v: string) => handleInputChange('fullname', v)}
          />
          <FormInput
            label='Email'
            required
            value={formData.email}
            onChangeText={(v: string) => handleInputChange('email', v)}
            keyboardType='email-address'
            autoCapitalize='none'
            editable={!isEditMode}
            style={!isEditMode ? styles.input : styles.inputDisabled}
          />
          <FormInput
            label='Mật khẩu'
            required={!isEditMode}
            placeholder={
              isEditMode ? 'Để trống nếu không muốn đổi' : 'Nhập mật khẩu'
            }
            value={formData.password}
            onChangeText={(v: string) => handleInputChange('password', v)}
            secureTextEntry
            autoCapitalize='none'
          />
          <FormInput
            label='Số điện thoại'
            required
            value={formData.phone}
            onChangeText={(v: string) => handleInputChange('phone', v)}
            keyboardType='phone-pad'
          />
          <FormDatePicker
            label='Ngày sinh'
            required
            value={birthday}
            onPress={() => setShowDatePicker('birthday')}
          />
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Giới tính <Text style={styles.required}>*</Text>
            </Text>
            <CustomDropdown
              placeholder='Chọn giới tính'
              options={GENDER_OPTIONS}
              selectedValue={formData.gender}
              onSelect={v => handleInputChange('gender', v)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Vai trò <Text style={styles.required}>*</Text>
            </Text>
            <CustomDropdown
              placeholder='Chọn vai trò'
              options={ROLE_OPTIONS}
              selectedValue={formData.role}
              onSelect={(v: string) => handleInputChange('role', v)}
            />
          </View>

          {renderRoleSpecificFields()}
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={
            (showDatePicker === 'birthday' ? birthday : joinedAt) || new Date()
          }
          mode='date'
          display='spinner'
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  )
}

// --- 5. Stylesheet ---
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB'
  },
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3E4FF5'
  },
  backButton: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
  required: { color: '#EF4444' },
  input: {
    height: 50,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937'
  },
  datePickerButton: {
    height: 50,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 16,
    justifyContent: 'center'
  },
  inputDisabled: {
    height: 50,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#6B7280'
  },
  avatarPicker: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative'
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: 'white'
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: '35%',
    backgroundColor: '#3E4FF5',
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: 'white'
  },
  // --- Dropdown styles ---
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50
  },
  dropdownButtonDisabled: { backgroundColor: '#F3F4F6' },
  dropdownButtonText: {
    color: '#1F2937',
    fontSize: 16,
    flex: 1
  },
  placeholderText: { color: '#9CA3AF' },
  disabledText: { color: '#9CA3AF' },
  // Lớp nền cho Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)' // Nền hơi mờ
  },
  // Container cho danh sách trong Modal
  dropdownListContainer: {
    position: 'absolute', // Được định vị bởi state
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200, // Giới hạn chiều cao
    elevation: 5, // Shadow cho Android
    shadowColor: '#000', // Shadow cho iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  lastDropdownItem: { borderBottomWidth: 0 },
  dropdownItemText: { fontSize: 16, color: '#374151' }
})
