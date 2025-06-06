import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useDebounce } from 'use-debounce'

// --- Import API Service và Types ---
import {
  Account,
  AccountRole,
  AccountStatus,
  Member as ApiMember,
  changeMemberStatus,
  Chapter,
  getMembers,
  MemberPosition
} from '../../../../api' // Cập nhật đường dẫn nếu cần

// --- Kiểu dữ liệu cho UI ---
type DisplayStatus = 'Hoạt động' | 'Chờ phê duyệt' | 'Bị khóa'
type SystemRole = 'QTV' | 'NQL' | 'ĐV'

// Kiểu dữ liệu để render trong FlatList
type MemberDisplayInfo = {
  id: string // Member ID (infoMember._id)
  accountId: string
  name: string
  email: string
  phone: string
  position: MemberPosition // Chức vụ
  systemRole: SystemRole
  status: DisplayStatus
  avatar?: string
  cardNumber?: string
  branch?: string // Tên chi đoàn
  address?: string
  hometown?: string
}

interface DropdownOption {
  label: string
  value: string // Giá trị này là DisplayStatus hoặc 'Tất cả'
}

// --- Hằng số và Hàm hỗ trợ (Đã cập nhật) ---
// Ánh xạ từ Display Status trên UI sang Status của API
const STATUS_MAP_TO_API: { [key: string]: AccountStatus | 'all' } = {
  'Tất cả': 'all',
  'Hoạt động': 'active',
  'Chờ phê duyệt': 'waiting',
  'Bị khóa': 'banned'
}

const STATUS_OPTIONS: DropdownOption[] = [
  { label: 'Tất cả trạng thái', value: 'Tất cả' },
  { label: 'Hoạt động', value: 'Hoạt động' },
  { label: 'Chờ phê duyệt', value: 'Chờ phê duyệt' },
  { label: 'Bị khóa', value: 'Bị khóa' }
]

// Ánh xạ từ API Status sang Display Status
const mapApiStatusToDisplay = (apiStatus?: AccountStatus): DisplayStatus => {
  switch (apiStatus) {
    case 'active':
      return 'Hoạt động'
    case 'waiting':
      return 'Chờ phê duyệt'
    case 'banned':
      return 'Bị khóa'
    default:
      return 'Bị khóa'
  }
}

// Ánh xạ từ API Role sang System Role của UI
const mapAccountRoleToSystemRole = (accountRole: AccountRole): SystemRole => {
  switch (accountRole) {
    case 'admin':
      return 'QTV'
    case 'manager':
      return 'NQL'
    case 'member':
      return 'ĐV'
    default:
      return 'ĐV'
  }
}

// --- Component CustomDropdown (Giữ nguyên) ---
// (Component này không cần thay đổi)

// --- Component chính ---
export default function MembersListScreen () {
  const router = useRouter()
  const [members, setMembers] = useState<MemberDisplayInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
  const [selectedStatus, setSelectedStatus] = useState<string>('Tất cả')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  })

  const fetchMembers = useCallback(
    async (page = 1, isLoadMore = false) => {
      if (isLoading && !isLoadMore) return // Tránh gọi lại khi đang loading lần đầu
      if (isFetchingMore) return
      if (isLoadMore && pagination.currentPage >= pagination.totalPages) return

      if (isLoadMore) setIsFetchingMore(true)
      else setIsLoading(true)
      setError(null)

      try {
        const apiStatus = STATUS_MAP_TO_API[selectedStatus] || 'all'
        const response = await getMembers({
          page,
          limit: 10,
          search: debouncedSearchQuery,
          status: apiStatus
        })

        // Ánh xạ dữ liệu từ API sang kiểu hiển thị trên UI
        const mappedMembers = response.members
          .filter(acc => acc.infoMember && typeof acc.infoMember === 'object') // Chỉ lấy account có infoMember là object
          .map((acc: Account) => {
            const infoMember = acc.infoMember as ApiMember
            const chapter = infoMember.chapterId as Chapter // Giả sử chapterId được populate

            return {
              id: infoMember._id,
              accountId: acc._id,
              name: acc.fullname,
              email: acc.email,
              phone: acc.phone,
              position: infoMember.position,
              systemRole: mapAccountRoleToSystemRole(acc.role),
              status: mapApiStatusToDisplay(infoMember.status), // Lấy status từ infoMember
              avatar: acc.avatar,
              cardNumber: infoMember.cardId,
              branch: chapter?.name || 'N/A', // Hiển thị tên chi đoàn nếu có
              address: infoMember.address,
              hometown: infoMember.hometown
            }
          })

        setMembers(prev =>
          isLoadMore ? [...prev, ...mappedMembers] : mappedMembers
        )
        setPagination(response.pagination)
      } catch (e) {
        setError('Không thể tải danh sách đoàn viên. Vui lòng thử lại.')
        console.error(e)
      } finally {
        setIsLoading(false)
        setIsFetchingMore(false)
      }
    },
    [debouncedSearchQuery, selectedStatus]
  )

  useEffect(() => {
    fetchMembers(1)
  }, [fetchMembers])

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages && !isFetchingMore) {
      fetchMembers(pagination.currentPage + 1, true)
    }
  }

  const handleLockMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Xác nhận Khóa',
      `Bạn có chắc muốn khóa tài khoản của "${memberName}" không? Hành động này sẽ chuyển trạng thái thành "Bị khóa".`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận Khóa',
          onPress: async () => {
            try {
              // Sử dụng status 'banned' từ backend
              await changeMemberStatus(memberId, 'banned')
              Alert.alert('Thành công', `Đã khóa tài khoản của ${memberName}.`)
              fetchMembers(1) // Tải lại danh sách từ đầu
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.')
            }
          },
          style: 'destructive'
        }
      ]
    )
  }

  // Các phần render (renderMemberItem, renderFooter, renderEmptyOrLoading) và JSX giữ nguyên
  // Chỉ cần thay đổi hàm `onPress` của nút xóa để gọi `handleLockMember`
  // ...

  // Ví dụ cập nhật trong `renderMemberItem`:
  const renderMemberItem = ({ item }: { item: MemberDisplayInfo }) => {
    // ... (logic icon, màu sắc giữ nguyên) ...
    return (
      <TouchableOpacity /* ... */>
        <View className='flex-row items-center'>
          {/* ... (Image, View, Text...) */}
          <TouchableOpacity
            onPress={() => handleLockMember(item.id, item.name)} // Thay đổi ở đây
            className='p-2 ml-2 self-start'
          >
            <Ionicons name='lock-closed-outline' size={24} color='#EF4444' />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  // Phần JSX còn lại của component không cần thay đổi nhiều.
  // ...

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : null)}
          style={styles.backButton}
        >
          <Ionicons name='arrow-back' size={28} color='white' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách Đoàn viên</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search & Filter */}
      <View style={styles.controlsContainer}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Feather name='search' size={22} color='#6B7280' />
          <TextInput
            placeholder='Tìm theo tên, email, SĐT...'
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {/* Filters */}
        <View style={styles.filtersRow}>
          {/* Dropdown */}
          {/* <CustomDropdown ... /> */}
          {/* Add Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/leader/members/add')}
          >
            <Ionicons
              name='add-circle-outline'
              size={22}
              color='white'
              style={{ marginRight: 8 }}
            />
            <Text style={styles.addButtonText}>Tạo mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        // ListEmptyComponent={renderEmptyOrLoading}
        // ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#3E4FF5',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 60,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: { padding: 8 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  headerPlaceholder: { width: 28 + 16 },
  controlsContainer: {
    paddingHorizontal: '5%',
    marginTop: -40,
    zIndex: 10
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937'
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8
  },
  addButton: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16
  }
})
