import { Feather, Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView as DropdownScrollView,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useDebounce } from 'use-debounce'

// --- 1. Imports và Hooks ---
import { accountApi } from '../../../../api'

// --- 2. Kiểu dữ liệu và Hằng số (khớp với BE) ---
type AccountFromApi = {
  _id: string
  fullname: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'member'
  status: 'actived' | 'pending' | 'locked'
  avatar?: { url: string }
  chapterId?: { name: string }
}

interface DropdownOption {
  label: string
  value: string
}

const STATUS_MAP_TO_API: {
  [key: string]: 'actived' | 'pending' | 'locked' | 'all'
} = {
  'Tất cả': 'all',
  'Hoạt động': 'actived',
  'Chờ duyệt': 'pending',
  'Bị khóa': 'locked'
}
const STATUS_OPTIONS: DropdownOption[] = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Hoạt động', value: 'actived' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Bị khóa', value: 'locked' }
]

const ROLE_OPTIONS: DropdownOption[] = [
  { label: 'Tất cả vai trò', value: 'all' },
  { label: 'Quản trị viên', value: 'admin' },
  { label: 'Quản lý', value: 'manager' },
  { label: 'Đoàn viên', value: 'member' }
]

// --- Component CustomDropdown (giữ nguyên) ---
const CustomDropdown: React.FC<{
  options: DropdownOption[]
  placeholder: string
  onSelect: (value: string) => void
  selectedValue: string
  isOpen: boolean
  onToggle: () => void
  containerClassName?: string
  dropdownListClassName?: string
}> = ({
  options,
  placeholder,
  onSelect,
  selectedValue,
  isOpen,
  onToggle,
  containerClassName = 'w-full',
  dropdownListClassName = ''
}) => {
  const displayLabel =
    options.find(opt => opt.value === selectedValue)?.label || placeholder
  return (
    <View className={containerClassName} style={{ zIndex: isOpen ? 30 : 10 }}>
      <TouchableOpacity
        onPress={onToggle}
        className='flex-row items-center justify-between p-3 border border-gray-300 bg-white rounded-lg shadow-sm h-[50px]'
      >
        <Text className='text-gray-700 text-base' numberOfLines={1}>
          {displayLabel}
        </Text>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color='#6B7280'
        />
      </TouchableOpacity>
      {isOpen && (
        <View
          className={`border border-gray-200 rounded-lg mt-1 absolute top-full left-0 right-0 bg-white max-h-48 shadow-lg ${dropdownListClassName}`}
          style={{ zIndex: 40 }}
        >
          <DropdownScrollView nestedScrollEnabled={true}>
            {options.map(option => (
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
export default function AccountsListScreen () {
  const router = useRouter()

  // State
  const [accounts, setAccounts] = useState<AccountFromApi[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebounce(searchQuery, 500)

  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Logic Fetching ---
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: any = {
        search: debouncedSearch,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedRole !== 'all' && { role: selectedRole })
      }
      console.log(params)
      const response = await accountApi.getAccounts(params)
      setAccounts(response.data.data.docs)
      console.log(response.data.data.docs[4])
    } catch (e) {
      setError('Không thể tải danh sách tài khoản.')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, selectedStatus, selectedRole])

  useFocusEffect(
    useCallback(() => {
      fetchAccounts()
    }, [fetchAccounts])
  )

  // --- Logic Hành động (Phê duyệt, Khóa, Mở khóa) ---
  const updateAccountStatus = async (
    account: AccountFromApi,
    newStatus: 'actived' | 'locked',
    actionText: string
  ) => {
    Alert.alert(
      `Xác nhận ${actionText}`,
      `Bạn có chắc muốn ${actionText.toLowerCase()} tài khoản "${
        account.fullname
      }"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: actionText,
          onPress: async () => {
            try {
              await accountApi.updateAccount(account._id, { status: newStatus })
              Alert.alert(
                'Thành công',
                `Đã ${actionText.toLowerCase()} tài khoản.`
              )
              fetchAccounts()
            } catch (err) {
              Alert.alert('Lỗi', 'Thao tác thất bại.')
            }
          },
          style: newStatus === 'locked' ? 'destructive' : 'default'
        }
      ]
    )
  }

  // --- Giao diện ---
  const renderAccountItem = ({ item }: { item: AccountFromApi }) => {
    let statusColor = '#6B7280'
    if (item.status === 'actived') statusColor = '#10B981'
    else if (item.status === 'pending') statusColor = '#F59E0B'
    else if (item.status === 'locked') statusColor = '#EF4444'

    const roleText =
      ROLE_OPTIONS.find(r => r.value === item.role)?.label || 'Không xác định'

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() =>
          router.push({
            pathname: '/(app)/admin/accounts/detail',
            params: { id: item._id }
          })
        }
      >
        <Image
          source={
            item.avatar?.url
              ? { uri: item.avatar.url }
              : require('../../../../assets/images/avatar-placeholder.png')
          }
          style={styles.itemAvatar}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.fullname}</Text>
          <Text style={styles.itemDetail}>{item.email}</Text>
          <Text style={styles.itemDetail}>
            {roleText} @ {item.chapterId?.name || 'Trung ương'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20' }
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_OPTIONS.find(s => s.value === item.status)?.label}
            </Text>
          </View>
        </View>
        <View style={styles.actionsContainer}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateAccountStatus(item, 'actived', 'Phê duyệt')}
            >
              <Ionicons
                name='checkmark-circle-outline'
                size={24}
                color='#10B981'
              />
            </TouchableOpacity>
          )}
          {item.status === 'actived' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateAccountStatus(item, 'locked', 'Khóa')}
            >
              <Ionicons name='lock-closed-outline' size={22} color='#EF4444' />
            </TouchableOpacity>
          )}
          {item.status === 'locked' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateAccountStatus(item, 'actived', 'Mở khóa')}
            >
              <Ionicons name='lock-open-outline' size={22} color='#F59E0B' />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Quản lý Tài khoản</Text>
      </View>
      <View style={styles.controlsContainer}>
        <View style={styles.searchBarContainer}>
          <Feather
            name='search'
            size={22}
            color='#6B7280'
            style={{ marginRight: 12 }}
          />
          <TextInput
            placeholder='Tìm theo tên, email...'
            placeholderTextColor='#9CA3AF'
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filtersRow}>
          <CustomDropdown
            options={ROLE_OPTIONS}
            placeholder='Lọc vai trò'
            selectedValue={selectedRole}
            onSelect={setSelectedRole}
            isOpen={roleDropdownOpen}
            onToggle={() => {
              setRoleDropdownOpen(!roleDropdownOpen)
              setStatusDropdownOpen(false)
            }}
            containerClassName='flex-1'
          />
          <View style={{ width: 8 }} />
          <CustomDropdown
            options={STATUS_OPTIONS}
            placeholder='Lọc trạng thái'
            selectedValue={selectedStatus}
            onSelect={setSelectedStatus}
            isOpen={statusDropdownOpen}
            onToggle={() => {
              setStatusDropdownOpen(!statusDropdownOpen)
              setRoleDropdownOpen(false)
            }}
            containerClassName='flex-1'
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(app)/admin/accounts/add')}
        >
          <Ionicons
            name='add-circle-outline'
            size={22}
            color='white'
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addButtonText}>Tạo tài khoản</Text>
        </TouchableOpacity>
      </View>

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
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={item => item._id}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Ionicons name='people-outline' size={48} color='#9CA3AF' />
              <Text style={styles.emptyListText}>Không có tài khoản nào.</Text>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
          onRefresh={fetchAccounts}
          refreshing={isLoading}
        />
      )}
    </SafeAreaView>
  )
}

// --- Stylesheet ---
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 100
  },
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
  emptyListText: { color: '#6B7280', marginTop: 16, fontSize: 16 },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  itemAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
  itemDetail: { fontSize: 14, color: '#4B5563', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8 }
})
