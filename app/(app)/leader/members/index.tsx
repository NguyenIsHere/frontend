// MembersListScreen.tsx (Đã sửa lỗi loading hoài)

import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react' // Import useCallback
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
import { accountApi } from '../../../../api'

// --- CÁC TYPE, HẰNG SỐ, COMPONENT PHỤ GIỮ NGUYÊN ---
type MemberDisplayInfo = {
  id: string
  fullname: string
  email: string
  phone: string
  position: string
  status: 'Hoạt động' | 'Chờ phê duyệt' | 'Bị khóa'
  avatar?: string
  chapterName?: string
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
  'Chờ phê duyệt': 'pending',
  'Bị khóa': 'locked'
}
const STATUS_OPTIONS: DropdownOption[] = [
  { label: 'Tất cả trạng thái', value: 'Tất cả' },
  { label: 'Hoạt động', value: 'Hoạt động' },
  { label: 'Chờ phê duyệt', value: 'Chờ phê duyệt' },
  { label: 'Bị khóa', value: 'Bị khóa' }
]
const mapApiStatusToDisplay = (
  apiStatus?: 'actived' | 'pending' | 'locked'
): MemberDisplayInfo['status'] => {
  switch (apiStatus) {
    case 'actived':
      return 'Hoạt động'
    case 'pending':
      return 'Chờ phê duyệt'
    case 'locked':
      return 'Bị khóa'
    default:
      return 'Bị khóa'
  }
}
const CustomDropdown: React.FC<any> = ({
  options,
  placeholder,
  onSelect,
  selectedValue,
  isOpen,
  onToggle
}) => {
  const displayLabel =
    options.find((opt: any) => opt.value === selectedValue)?.label ||
    placeholder
  return (
    <View style={{ zIndex: isOpen ? 30 : 10 }}>
      <TouchableOpacity onPress={onToggle} style={styles.dropdownButton}>
        <Text style={styles.dropdownButtonText} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color='#6B7280'
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownListContainer}>
          <DropdownScrollView nestedScrollEnabled={true}>
            {options.map((option: any) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onSelect(option.value)
                  onToggle()
                }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </DropdownScrollView>
        </View>
      )}
    </View>
  )
}

// --- COMPONENT CHÍNH ---
export default function MembersListScreen () {
  const router = useRouter()

  // States
  const [members, setMembers] = useState<MemberDisplayInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
  const [selectedStatus, setSelectedStatus] = useState<string>('Tất cả')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  // Sửa: Tách biệt state loading cho lần đầu và tải thêm
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNextPage: false
  })

  // --- LOGIC LẤY VÀ XỬ LÝ DỮ LIỆU ---

  // Sửa: Tách hàm fetching ra khỏi useCallback để quản lý life cycle trong useEffect
  const fetchAndSetMembers = async (page: number, isLoadMore = false) => {
    isLoadMore ? setIsFetchingMore(true) : setIsLoading(true)
    setError(null)

    try {
      const apiStatus = STATUS_MAP_TO_API[selectedStatus]
      const response = await accountApi.getAccounts({
        page,
        limit: 10,
        search: debouncedSearchQuery,
        ...(apiStatus !== 'all' && { status: apiStatus }),
        role: 'member'
      })

      const responseData = response.data.data
      const accountsFromApi = responseData.docs || []

      const mappedMembers: MemberDisplayInfo[] = accountsFromApi.map(
        (acc: any) => ({
          id: acc._id,
          fullname: acc.fullname,
          email: acc.email,
          phone: acc.phone,
          position: acc.position,
          status: mapApiStatusToDisplay(acc.status),
          avatar: acc.avatar?.url,
          chapterName: acc.chapterId?.name
        })
      )

      setMembers(prev =>
        isLoadMore ? [...prev, ...mappedMembers] : mappedMembers
      )

      setPagination({
        page: responseData.page,
        totalPages: responseData.totalPages,
        hasNextPage: responseData.hasNextPage
      })
    } catch (e) {
      setError('Không thể tải danh sách đoàn viên.')
      console.error('Fetch error:', e)
    } finally {
      isLoadMore ? setIsFetchingMore(false) : setIsLoading(false)
    }
  }

  // Sửa: useEffect này chỉ chạy khi filter thay đổi, để tải lại dữ liệu từ đầu
  useEffect(() => {
    // Reset state và fetch trang 1
    setMembers([])
    setPagination(p => ({ ...p, page: 1 }))
    fetchAndSetMembers(1)
  }, [debouncedSearchQuery, selectedStatus])

  const handleLoadMore = () => {
    // Chỉ tải thêm khi không đang loading và còn trang tiếp theo
    if (!isLoading && !isFetchingMore && pagination.hasNextPage) {
      fetchAndSetMembers(pagination.page + 1, true)
    }
  }

  // Hàm handleLockMember không cần thay đổi nhiều, chỉ cần gọi lại fetchAndSetMembers
  const handleLockMember = (accountId: string, memberName: string) => {
    Alert.alert(
      'Xác nhận Khóa tài khoản',
      `Bạn có chắc muốn khóa tài khoản của "${memberName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khóa',
          onPress: async () => {
            try {
              await accountApi.updateAccount(accountId, { status: 'locked' })
              Alert.alert('Thành công', `Đã khóa tài khoản của ${memberName}.`)
              fetchAndSetMembers(1) // Tải lại danh sách từ đầu
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.')
            }
          },
          style: 'destructive'
        }
      ]
    )
  }

  // Thêm: Hàm xử lý mở khóa tài khoản
  const handleUnlockMember = (accountId: string, memberName: string) => {
    Alert.alert(
      'Xác nhận Mở khóa tài khoản',
      `Bạn có muốn mở khóa tài khoản cho "${memberName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Mở khóa',
          onPress: async () => {
            try {
              // Gọi API cập nhật trạng thái sang 'actived'
              await accountApi.updateAccount(accountId, { status: 'actived' })
              Alert.alert(
                'Thành công',
                `Đã mở khóa tài khoản của ${memberName}.`
              )
              fetchAndSetMembers(1) // Tải lại danh sách từ đầu
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.')
            }
          },
          style: 'default' // Kiểu mặc định cho hành động tích cực
        }
      ]
    )
  }

  // --- CÁC COMPONENT RENDER PHỤ VÀ GIAO DIỆN (GIỮ NGUYÊN) ---
  const renderMemberItem = ({ item }: { item: MemberDisplayInfo }) => {
    // ... (code render item không đổi)
    let statusIconName: keyof typeof Ionicons.glyphMap = 'alert-circle'
    let statusColor = '#6B7280'

    if (item.status === 'Hoạt động') {
      statusIconName = 'checkmark-circle'
      statusColor = '#10B981'
    } else if (item.status === 'Chờ phê duyệt') {
      statusIconName = 'hourglass'
      statusColor = '#F59E0B'
    } else if (item.status === 'Bị khóa') {
      statusIconName = 'lock-closed'
      statusColor = '#EF4444'
    }

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() =>
          router.push({
            pathname: '/(app)/leader/members/detail',
            params: { id: item.id }
          })
        }
      >
        <Image
          source={
            item.avatar
              ? { uri: item.avatar }
              : require('../../../../assets/images/avatar-placeholder.png')
          }
          style={styles.itemAvatar}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.fullname}</Text>
          <Text style={styles.itemDetail}>
            <Ionicons name='mail-outline' /> {item.email}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name='call-outline' /> {item.phone}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name='people-outline' />{' '}
            {item.chapterName || 'Chưa có chi đoàn'}
          </Text>
          <View
            style={[styles.itemStatus, { backgroundColor: `${statusColor}20` }]}
          >
            <Ionicons name={statusIconName} size={14} color={statusColor} />
            <Text style={[styles.itemStatusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>
        {item.status === 'Bị khóa' ? (
          // Nút Mở khóa
          <TouchableOpacity
            onPress={() => handleUnlockMember(item.id, item.fullname)}
            style={styles.actionButton}
          >
            <Ionicons name='lock-open-outline' size={24} color='#10B981' />
          </TouchableOpacity>
        ) : (
          // Nút Khóa
          <TouchableOpacity
            onPress={() => handleLockMember(item.id, item.fullname)}
            style={styles.actionButton}
          >
            <Ionicons name='lock-closed-outline' size={24} color='#EF4444' />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  const ListFooter = () => {
    if (!isFetchingMore) return null
    return (
      <ActivityIndicator
        style={{ marginVertical: 20 }}
        size='large'
        color='#3E4FF5'
      />
    )
  }

  const ListEmpty = () => {
    // Sửa: Dùng isLoading thay vì isFetchingMore ở đây
    if (isLoading) {
      return (
        <ActivityIndicator
          style={{ marginTop: 50 }}
          size='large'
          color='#3E4FF5'
        />
      )
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name='cloud-offline-outline' size={48} color='#9CA3AF' />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchAndSetMembers(1)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name='information-circle-outline' size={48} color='#9CA3AF' />
        <Text style={styles.emptyText}>Không tìm thấy đoàn viên nào.</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name='arrow-back' size={28} color='white' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách Đoàn viên</Text>
        {/* <TouchableOpacity
          onPress={() => router.push('/(app)/leader/members/add')}
          style={styles.headerButton}
        >
          <Ionicons name='add' size={28} color='white' />
        </TouchableOpacity> */}
      </View>
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Feather name='search' size={20} color='#6B7280' />
          <TextInput
            style={styles.searchInput}
            placeholder='Tìm theo tên, email, SĐT...'
            placeholderTextColor='#9CA3AF'
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <CustomDropdown
          options={STATUS_OPTIONS}
          placeholder='Lọc theo trạng thái'
          selectedValue={selectedStatus}
          onSelect={setSelectedStatus}
          isOpen={statusDropdownOpen}
          onToggle={() => setStatusDropdownOpen(prev => !prev)}
        />
      </View>
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </SafeAreaView>
  )
}

// ... (Stylesheet giữ nguyên)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#3E4FF5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4
  },
  headerButton: { padding: 8 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  controlsContainer: { padding: 16, zIndex: 10 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  searchInput: {
    flex: 1,
    height: 50,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937'
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  dropdownButtonText: { color: '#374151', fontSize: 16 },
  dropdownListContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 20,
    elevation: 3
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  dropdownItemText: { fontSize: 16, color: '#374151' },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  itemAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16 },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  itemDetail: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  itemStatusText: { marginLeft: 6, fontWeight: '600', fontSize: 12 },
  actionButton: {
    // Sửa: đổi tên từ lockButton thành actionButton cho chung
    padding: 8,
    alignSelf: 'flex-start'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: 20
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3E4FF5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8
  },
  retryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
})
