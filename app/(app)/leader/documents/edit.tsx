import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

// 1. Import API
import { documentApi } from '../../../../api'

// --- 2. Hằng số và Component phụ (khớp với BE) ---
interface DropdownOption {
  label: string
  value: 'chapter' | 'private'
}
const SCOPE_OPTIONS_FORM: DropdownOption[] = [
  { label: 'Chi đoàn', value: 'chapter' },
  { label: 'Riêng tư', value: 'private' }
]

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
  const displayLabel =
    options.find((opt: DropdownOption) => opt.value === selectedValue)?.label ||
    placeholder
  return (
    <View className={containerClassName} style={{ zIndex: isOpen ? 1000 : 10 }}>
      {/* Nội dung component không đổi */}
    </View>
  )
}

// --- Component chính ---
export default function EditDocumentScreen () {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  // 3. State để quản lý form, loading và file
  const [formData, setFormData] = useState({
    docCode: '',
    name: '',
    issuer: '',
    scope: '' as 'chapter' | 'private' | '',
    description: ''
  })
  const [issuedAt, setIssuedAt] = useState<Date | undefined>(undefined)
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null
  )
  const [existingFileName, setExistingFileName] = useState<string>('')

  // State cho UI
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false)
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)

  // 4. useEffect để lấy dữ liệu tài liệu cần chỉnh sửa
  useEffect(() => {
    if (!id) {
      Alert.alert('Lỗi', 'Không tìm thấy ID tài liệu.')
      router.back()
      return
    }
    const fetchDocument = async () => {
      try {
        const response = await documentApi.getDocumentById(id)
        const doc = response.data.data
        setFormData({
          docCode: doc.docCode,
          name: doc.name,
          issuer: doc.issuer,
          scope: doc.scope,
          description: doc.description || ''
        })
        setIssuedAt(new Date(doc.issuedAt))
        setExistingFileName(doc.file?.url?.split('/').pop() || 'Tệp hiện tại')
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu tài liệu.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocument()
  }, [id])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
      Alert.alert('Lỗi', 'Không thể chọn tệp.')
    }
  }

  // 5. Hàm handleSubmit được cập nhật để gọi API update
  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.docCode ||
      !issuedAt ||
      !formData.issuer ||
      !formData.scope
    ) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc.')
      return
    }
    if (!id) return

    setIsSaving(true)
    const dataToSubmit = new FormData()

    // Append tất cả các trường từ formData state
    Object.keys(formData).forEach(key => {
      dataToSubmit.append(key, formData[key as keyof typeof formData])
    })
    dataToSubmit.append('issuedAt', issuedAt.toISOString())

    // Nếu người dùng chọn một file mới, thêm nó vào FormData
    if (file) {
      dataToSubmit.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf'
      } as any)
    }

    try {
      await documentApi.updateDocument(id, dataToSubmit)
      Alert.alert('Thành công', 'Đã cập nhật tài liệu.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('Thất bại', e.response?.data?.message || 'Đã có lỗi xảy ra.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#3E4FF5' />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name='arrow-back' size={28} color='white' />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Chỉnh sửa Tài liệu</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps='handled'
      >
        {/* Số hiệu văn bản */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Số hiệu văn bản <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder='Ví dụ: 123/QĐ-ĐTN'
            value={formData.docCode}
            onChangeText={v => handleInputChange('docCode', v)}
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
            value={formData.name}
            onChangeText={v => handleInputChange('name', v)}
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* ... Các ô input khác tương tự, chỉ cần thay đổi value và onChangeText ... */}

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
            date={issuedAt || new Date()}
            onConfirm={date => {
              setIssuedAt(date)
              setDatePickerVisibility(false)
            }}
            onCancel={() => setDatePickerVisibility(false)}
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
            value={formData.issuer}
            onChangeText={v => handleInputChange('issuer', v)}
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
            selectedValue={formData.scope}
            onSelect={(v: 'chapter' | 'private') =>
              handleInputChange('scope', v)
            }
            isOpen={scopeDropdownOpen}
            onToggle={() => setScopeDropdownOpen(!scopeDropdownOpen)}
          />
        </View>

        {/* Tệp tài liệu */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tệp tài liệu mới (tùy chọn)</Text>
          <View style={styles.fileInputContainer}>
            <Text
              style={[
                styles.input,
                styles.fileInputDisplay,
                !file && styles.fileInputPlaceholder
              ]}
              numberOfLines={1}
            >
              {file?.name || 'Chưa chọn file mới'}
            </Text>
            <TouchableOpacity
              style={styles.fileBrowseButton}
              onPress={handleSelectFile}
            >
              <Ionicons name='attach-outline' size={24} color='#3E4FF5' />
              <Text style={styles.fileBrowseButtonText}>Chọn PDF</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Tệp hiện tại: {existingFileName}
          </Text>
          <Text style={styles.helperText}>
            Nếu bạn chọn tệp mới, tệp cũ sẽ bị ghi đè.
          </Text>
        </View>

        {/* Mô tả */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Mô tả thêm <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder='Nhập mô tả chi tiết'
            value={formData.description}
            onChangeText={v => handleInputChange('description', v)}
            multiline
            numberOfLines={4}
            textAlignVertical='top'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Nút Lưu */}
        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color='white' />
          ) : (
            <>
              <Ionicons
                name='save-outline'
                size={22}
                color='white'
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitButtonText}>Lưu Thay Đổi</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

// --- Stylesheet (dùng lại từ các màn hình trước) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    backgroundColor: '#3E4FF5',
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 30,
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: { padding: 8 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerRightPlaceholder: { width: 44 },
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
  helperText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  submitButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10
  },
  submitButtonDisabled: { backgroundColor: '#FCD34D' },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: '600' }
})
