import { Feather, Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

// 1. Import API và các hook cần thiết
import { authApi, documentApi } from '../../../../api'
// Giả sử bạn có hook này để lấy thông tin user
// import { useAuth } from '../../../../hooks/useAuth';

// --- 2. Hằng số và Options (khớp với BE) ---
interface DropdownOption {
  label: string
  value: 'chapter' | 'private' // Khớp với enum của BE
}

// Sửa: Chỉ có 2 scope hợp lệ theo document.model.js
const SCOPE_OPTIONS_FORM: DropdownOption[] = [
  { label: 'Chi đoàn', value: 'chapter' },
  { label: 'Riêng tư', value: 'private' }
]

// --- Component CustomDropdown (Giữ nguyên) ---
// ... (Component CustomDropdown không thay đổi, bạn có thể giữ nguyên)
const CustomDropdown: React.FC<any> = ({
  options,
  placeholder,
  onSelect,
  selectedValue,
  isOpen,
  onToggle,
  containerClassName,
  disabled
}) => {
  // ...
  const displayLabel =
    options.find((opt: DropdownOption) => opt.value === selectedValue)?.label ||
    placeholder
  return (
    <View className={containerClassName} style={{ zIndex: isOpen ? 1000 : 10 }}>
      <TouchableOpacity
        onPress={!disabled ? onToggle : undefined}
        className={`flex-row items-center justify-between p-3 border ${
          disabled ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-300'
        } rounded-lg shadow-sm h-[50px]`}
        disabled={disabled}
      >
        <Text
          className={`${
            disabled ? 'text-gray-500' : 'text-gray-700'
          } text-base`}
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
      {!disabled && isOpen && (
        <View
          className={`border border-gray-200 rounded-lg mt-1 absolute top-full left-0 right-0 bg-white max-h-48 shadow-lg`}
          style={{ zIndex: 1010 }}
        >
          <ScrollView nestedScrollEnabled={true}>
            {options.map((option: DropdownOption) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onSelect(option.value)
                  onToggle()
                }}
                className='p-3 border-b border-gray-100'
              >
                <Text className='text-gray-700 text-base'>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

// --- Component chính ---
export default function AddDocumentScreen () {
  const router = useRouter()
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)

  const [docCode, setDocCode] = useState('') // Thêm: Số hiệu văn bản
  const [name, setName] = useState('')
  const [issuedAt, setIssuedAt] = useState<Date | undefined>(undefined)
  const [issuer, setIssuer] = useState('')
  const [scope, setScope] = useState<'chapter' | 'private' | ''>('')
  const [description, setDescription] = useState('')

  // State cho file và UI
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null
  )
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false)
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 3. Dùng useEffect để gọi getProfile khi màn hình được tải
  useEffect(() => {
    const fetchUserChapter = async () => {
      try {
        const response = await authApi.getProfile()
        const userProfile = response.data.data
        if (userProfile && userProfile.chapterId) {
          setChapterId(userProfile.chapterId)
        } else {
          // Xử lý trường hợp user không thuộc chi đoàn nào (nếu có)
          Alert.alert('Lỗi', 'Không tìm thấy thông tin chi đoàn của bạn.')
          router.back()
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error)
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng.')
        router.back()
      } finally {
        setIsProfileLoading(false)
      }
    }
    fetchUserChapter()
  }, [])

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      })
      if (!result.canceled) {
        setFile(result.assets[0])
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể chọn tệp. Vui lòng thử lại.')
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (
      !docCode.trim() ||
      !name.trim() ||
      !issuedAt ||
      !issuer.trim() ||
      !scope
    ) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường có dấu *')
      return
    }
    if (!file) {
      Alert.alert('Lỗi', 'Vui lòng chọn một tệp PDF để đính kèm.')
      return
    }
    // Kiểm tra lại lần nữa để chắc chắn đã lấy được chapterId
    if (!chapterId) {
      Alert.alert(
        'Lỗi',
        'Không thể xác định chi đoàn của bạn. Vui lòng thử lại.'
      )
      return
    }

    setIsSubmitting(true)

    // Tạo đối tượng FormData để gửi file
    const formData = new FormData()

    // Thêm các trường dữ liệu text
    formData.append('docCode', docCode.trim())
    formData.append('name', name.trim())
    formData.append('issuedAt', issuedAt.toISOString())
    formData.append('issuer', issuer.trim())
    formData.append('scope', scope)
    formData.append('description', description.trim())
    formData.append('chapterId', chapterId) // Lấy chapterId từ user đăng nhập

    // Thêm file vào FormData
    // Cần tạo một object có cấu trúc giống file để gửi đi
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/pdf'
    } as any)

    try {
      // Gọi API tạo document
      await documentApi.createDocument(formData)

      Alert.alert('Thành công', 'Đã tạo tài liệu mới thành công.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('Thất bại', e.response?.data?.message || 'Đã có lỗi xảy ra.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. Thêm màn hình loading trong khi chờ lấy profile
  if (isProfileLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F3F4F6'
        }}
      >
        <ActivityIndicator size='large' color='#3E4FF5' />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>
          Đang tải thông tin...
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace('/(app)/leader/documents')
            }
          >
            <Ionicons name='arrow-back' size={28} color='white' />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Tạo Tài liệu Mới</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps='handled'
      >
        {/* Thêm: Số hiệu văn bản */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Số hiệu văn bản <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder='Ví dụ: 123/QĐ-ĐTN'
            value={docCode}
            onChangeText={setDocCode}
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Tên tài liệu */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Tên tài liệu <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder='Nhập tên tài liệu'
            value={name}
            onChangeText={setName}
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Ngày ban hành */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Ngày ban hành <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setDatePickerVisibility(true)}
            style={styles.datePickerButton}
          >
            <Text
              style={[
                styles.datePickerText,
                !issuedAt && styles.datePickerPlaceholder
              ]}
            >
              {issuedAt
                ? issuedAt.toLocaleDateString('vi-VN')
                : 'Chọn ngày ban hành'}
            </Text>
            <Ionicons name='calendar-outline' size={20} color='#6B7280' />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode='date'
            onConfirm={date => {
              setIssuedAt(date)
              setDatePickerVisibility(false)
            }}
            onCancel={() => setDatePickerVisibility(false)}
            locale='vi-VN'
            confirmTextIOS='Xác nhận'
            cancelTextIOS='Hủy'
          />
        </View>

        {/* Nơi ban hành */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Nơi ban hành <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder='Nhập nơi ban hành'
            value={issuer}
            onChangeText={setIssuer}
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Phạm vi */}
        <View
          style={[styles.inputGroup, { zIndex: scopeDropdownOpen ? 20 : 1 }]}
        >
          <Text style={styles.label}>
            Phạm vi <Text style={styles.required}>*</Text>
          </Text>
          <CustomDropdown
            options={SCOPE_OPTIONS_FORM}
            placeholder='Chọn phạm vi'
            selectedValue={scope}
            onSelect={(value: 'chapter' | 'private' | '') => setScope(value)}
            isOpen={scopeDropdownOpen}
            onToggle={() => setScopeDropdownOpen(!scopeDropdownOpen)}
          />
        </View>

        {/* Tệp tài liệu */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Tệp tài liệu (PDF) <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.fileInputContainer}>
            <Text
              style={[
                styles.input,
                styles.fileInputDisplay,
                !file && styles.fileInputPlaceholder
              ]}
              numberOfLines={1}
            >
              {file?.name || 'Chưa có tệp nào được chọn'}
            </Text>
            <TouchableOpacity
              style={styles.fileBrowseButton}
              onPress={handleSelectFile}
            >
              <Ionicons name='attach-outline' size={24} color='#3E4FF5' />
              <Text style={styles.fileBrowseButtonText}>Chọn PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mô tả thêm */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Mô tả thêm <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder='Nhập mô tả chi tiết'
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical='top'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Nút Lưu */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color='white' />
          ) : (
            <>
              <Ionicons
                name='save-outline'
                size={22}
                color='white'
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitButtonText}>Lưu Tài liệu</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  headerContainer: {
    backgroundColor: '#3E4FF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerRightPlaceholder: { width: 28 + 2 * 8 },
  scrollView: { flex: 1 },
  scrollViewContent: { padding: 20, paddingBottom: 40 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    height: 50
  },
  textArea: { height: 120, paddingTop: 12 },
  datePickerButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  datePickerText: { fontSize: 16, color: '#1F2937' },
  datePickerPlaceholder: { color: '#9CA3AF' },
  fileInputContainer: { flexDirection: 'row', alignItems: 'center' },
  fileInputDisplay: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#F9FAFB',
    lineHeight: 24,
    paddingTop: 12
  },
  fileInputPlaceholder: { fontStyle: 'italic' },
  fileBrowseButton: {
    height: 50,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#D1D5DB',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row'
  },
  fileBrowseButtonText: {
    color: '#3E4FF5',
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500'
  },
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  submitButtonDisabled: { backgroundColor: '#A3E6B4' },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: '600' }
})
