// DocumentsListScreen.tsx (phiên bản đã sửa)

import { Feather, Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView as DropdownScrollView,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useDebounce } from 'use-debounce'

// --- 1. Imports và Hooks ---
import { documentApi } from '../../../../api' // Import API
// Giả sử bạn có một hook để lấy thông tin user đã đăng nhập
// import { useAuth } from '../../../../hooks/useAuth';

// --- 2. Kiểu dữ liệu (khớp với BE) ---
type DocumentFromApi = {
  _id: string
  name: string
  docCode: string
  issuedAt: string // Ngày ban hành
  issuer: string // Nơi ban hành
  scope: 'chapter' | 'private'
  file: { url: string; public_id: string }
  description?: string
}

interface DropdownOption {
  label: string
  value: string
}

// --- 3. Hằng số và Options (khớp với BE) ---
const SCOPE_MAP: { [key: string]: string } = {
  private: 'Riêng tư',
  chapter: 'Chi đoàn'
}

const SCOPE_OPTIONS: DropdownOption[] = [
  { label: 'Tất cả phạm vi', value: 'all' },
  { label: 'Chi đoàn', value: 'chapter' },
  { label: 'Riêng tư', value: 'private' }
]

// --- Component CustomDropdown (Giữ nguyên) ---
const CustomDropdown: React.FC<any> = ({
  options,
  placeholder,
  onSelect,
  selectedValue,
  isOpen,
  onToggle,
  containerClassName = 'w-full',
  disabled = false
}) => {
  // ...
  const displayLabel =
    options.find((opt: DropdownOption) => opt.value === selectedValue)?.label ||
    placeholder
  return (
    <View className={containerClassName} style={{ zIndex: isOpen ? 30 : 10 }}>
      <TouchableOpacity
        onPress={!disabled ? onToggle : undefined}
        disabled={disabled}
        className={`flex-row items-center justify-between p-3 border ${
          disabled ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-300'
        } rounded-lg shadow-sm h-[50px]`}
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
          style={{ zIndex: 40 }}
        >
          <DropdownScrollView nestedScrollEnabled={true}>
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
          </DropdownScrollView>
        </View>
      )}
    </View>
  )
}

// --- Component chính ---
export default function DocumentsListScreen () {
  const router = useRouter()
  // const { user } = useAuth(); // Lấy thông tin user, ví dụ: user = { role: 'manager' }
  const user = { role: 'manager' } // << THAY BẰNG HOOK useAuth CỦA BẠN

  const [documents, setDocuments] = useState<DocumentFromApi[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebounce(searchQuery, 500)

  // State cho bộ lọc
  const [selectedScope, setSelectedScope] = useState<string>('all')
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false)

  // State cho loading/error
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Logic Fetching ---
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let apiParams: any = { search: debouncedSearch, role: user.role }

      // Áp dụng bộ lọc scope dựa trên vai trò
      if (user.role === 'manager') {
        if (selectedScope !== 'all') {
          apiParams.scope = selectedScope
        }
      } else {
        // Nếu là member, chỉ lấy scope 'chapter'
        apiParams.scope = 'chapter'
      }

      const response = await documentApi.getDocuments(apiParams)
      if (response.data.success) {
        setDocuments(response.data.data.docs)
      } else {
        throw new Error(response.data.message)
      }
    } catch (e: any) {
      setError('Không thể tải danh sách tài liệu.')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, selectedScope, user.role])

  // Dùng useFocusEffect để tải lại dữ liệu mỗi khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchDocuments()
    }, [fetchDocuments])
  )

  const handleDeleteDocument = (docId: string, docName: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa vĩnh viễn tài liệu "${docName}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          onPress: async () => {
            try {
              await documentApi.deleteDocument(docId) // Gọi API xóa thật
              Alert.alert('Thành công', 'Đã xóa tài liệu.')
              fetchDocuments() // Tải lại danh sách
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa tài liệu này.')
            }
          },
          style: 'destructive'
        }
      ]
    )
  }

  const renderDocumentItem = ({ item }: { item: DocumentFromApi }) => {
    // ...
    const scopeColor = item.scope === 'private' ? '#EF4444' : '#3B82F6'
    return (
      <TouchableOpacity
        className='bg-white p-4 mb-3 rounded-lg shadow-sm active:bg-gray-100'
        onPress={() =>
          router.push({
            pathname: '/(app)/leader/documents/detail',
            params: { id: item._id }
          })
        }
      >
        <View className='flex-row items-start'>
          <Ionicons
            name='document-text-outline'
            size={36}
            color='#4A5568'
            className='mr-4 mt-1'
          />
          <View className='flex-1'>
            <Text
              className='font-bold text-lg text-gray-800 mb-1'
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <View className='flex-row items-center mt-1'>
              <Ionicons name='calendar-outline' size={14} color='#6B7280' />
              <Text className='text-gray-600 ml-2 text-sm'>
                Ngày ban hành:{' '}
                {new Date(item.issuedAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View className='flex-row items-center mt-1'>
              <Ionicons name='location-outline' size={14} color='#6B7280' />
              <Text className='text-gray-600 ml-2 text-sm'>
                Nơi ban hành: {item.issuer}
              </Text>
            </View>
            <View className='flex-row items-center mt-1'>
              <Ionicons
                name='shield-checkmark-outline'
                size={14}
                color={scopeColor}
              />
              <Text
                className={`ml-2 text-sm font-medium`}
                style={{ color: scopeColor }}
              >
                Phạm vi: {SCOPE_MAP[item.scope]}
              </Text>
            </View>
          </View>
          {user.role === 'manager' && ( // Chỉ manager mới được xóa
            <TouchableOpacity
              onPress={() => handleDeleteDocument(item._id, item.name)}
              className='p-2 ml-2 self-start'
            >
              <Ionicons name='trash-outline' size={24} color='#EF4444' />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tài liệu</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchBarContainer}>
          <Feather
            name='search'
            size={22}
            color='#6B7280'
            style={{ marginRight: 12 }}
          />
          <TextInput
            placeholder='Tìm theo tên, nơi ban hành...'
            placeholderTextColor='#9CA3AF'
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Bộ lọc chỉ hiển thị cho manager */}
        {user.role === 'manager' && (
          <CustomDropdown
            options={SCOPE_OPTIONS}
            placeholder='Lọc theo phạm vi'
            selectedValue={selectedScope}
            onSelect={setSelectedScope}
            isOpen={scopeDropdownOpen}
            onToggle={() => setScopeDropdownOpen(!scopeDropdownOpen)}
            containerClassName='mb-3'
          />
        )}

        {/* Nút tạo tài liệu chỉ cho manager */}
        {user.role === 'manager' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/leader/documents/add')}
          >
            <Ionicons
              name='add-circle-outline'
              size={22}
              color='white'
              style={{ marginRight: 8 }}
            />
            <Text style={styles.addButtonText}>Tạo tài liệu mới</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator
          size='large'
          color='#3E4FF5'
          style={{ marginTop: 20 }}
        />
      ) : error ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={item => item._id}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Ionicons name='file-tray-outline' size={48} color='#9CA3AF' />
              <Text style={styles.emptyListText}>Không có tài liệu nào.</Text>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
          onRefresh={fetchDocuments}
          refreshing={isLoading} // Thêm tính năng pull-to-refresh
        />
      )}
    </SafeAreaView>
  )
}

// --- Styles (NativeWind không có ở đây, dùng StyleSheet) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  headerContainer: {
    backgroundColor: '#3E4FF5',
    padding: 16
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  controlsContainer: { padding: 16 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 50
  },
  searchInput: { flex: 1, height: '100%', color: '#374151', fontSize: 16 },
  addButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50
  },
  addButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  listContentContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyListContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40
  },
  emptyListText: { color: '#6B7280', marginTop: 16, fontSize: 16 }
  // Styles cho dropdown và item có thể thêm ở đây nếu cần
})
