import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView as DropdownScrollView,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useDebounce } from 'use-debounce'

// --- 1. IMPORT API VÀ TYPES ---
import {
  Account,
  AccountStatus,
  Member as ApiMember,
  changeMemberStatus,
  Chapter,
  getMembers,
  MemberPosition
} from '../../../../api' // Cập nhật đường dẫn nếu cần

// --- 2. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU CHO UI ---

// Kiểu dữ liệu để render trong FlatList, được ánh xạ từ API
type MemberDisplayInfo = {
  id: string // Member ID (infoMember._id)
  accountId: string
  name: string
  email: string
  phone: string
  position: MemberPosition // Chức vụ
  status: 'Hoạt động' | 'Chờ phê duyệt' | 'Bị khóa'
  avatar?: string
  branchName?: string
}

interface DropdownOption {
  label: string
  value: string
}

// --- 3. HẰNG SỐ VÀ HÀM HỖ TRỢ (ĐÃ ĐỒNG BỘ VỚI BE) ---

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

const mapApiStatusToDisplay = (
  apiStatus?: AccountStatus
): MemberDisplayInfo['status'] => {
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

// --- COMPONENT DROPDOWN TÙY CHỈNH ---
const CustomDropdown: React.FC<{
  options: DropdownOption[]
  placeholder: string
  onSelect: (value: string) => void
  selectedValue: string
  isOpen: boolean
  onToggle: () => void
}> = ({ options, placeholder, onSelect, selectedValue, isOpen, onToggle }) => {
  const displayLabel =
    options.find(opt => opt.value === selectedValue)?.label || placeholder
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
            {options.map(option => (
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

// --- 4. COMPONENT CHÍNH ---
export default function MembersListScreen () {
  const router = useRouter()

  // State cho UI
  const [members, setMembers] = useState<MemberDisplayInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
  const [selectedStatus, setSelectedStatus] = useState<string>('Tất cả')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  // State cho API
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  })

  // --- LOGIC LẤY VÀ XỬ LÝ DỮ LIỆU ---

  const fetchMembers = useCallback(
    async (page = 1, isLoadMore = false) => {
      if ((isLoading && !isLoadMore) || isFetchingMore) return
      if (isLoadMore && pagination.currentPage >= pagination.totalPages) return

      isLoadMore ? setIsFetchingMore(true) : setIsLoading(true)
      setError(null)

      try {
        const response = await getMembers({
          page,
          limit: 10,
          search: debouncedSearchQuery,
          status: STATUS_MAP_TO_API[selectedStatus]
        })

        const mappedMembers = response.members
          .filter(acc => acc.infoMember && typeof acc.infoMember === 'object')
          .map((acc: Account) => {
            const infoMember = acc.infoMember as ApiMember
            const chapter = infoMember.chapterId as Chapter
            return {
              id: infoMember._id,
              accountId: acc._id,
              name: acc.fullname,
              email: acc.email,
              phone: acc.phone,
              position: infoMember.position,
              status: mapApiStatusToDisplay(infoMember.status),
              avatar: acc.avatar,
              branchName: chapter?.name
            }
          })

        setMembers(prev =>
          isLoadMore ? [...prev, ...mappedMembers] : mappedMembers
        )
        setPagination(response.pagination)
      } catch (e) {
        setError('Không thể tải danh sách đoàn viên.')
        console.error(e)
      } finally {
        setIsLoading(false)
        setIsFetchingMore(false)
      }
    },
    [debouncedSearchQuery, selectedStatus]
  )

  useEffect(() => {
    // Reset và fetch lại từ trang 1 khi filter hoặc search thay đổi
    setMembers([])
    setPagination(p => ({ ...p, currentPage: 1 }))
    fetchMembers(1)
  }, [debouncedSearchQuery, selectedStatus])

  const handleLoadMore = () => {
    if (!isFetchingMore && pagination.currentPage < pagination.totalPages) {
      fetchMembers(pagination.currentPage + 1, true)
    }
  }

  const handleLockMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Xác nhận Khóa tài khoản',
      `Bạn có chắc muốn khóa tài khoản của "${memberName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khóa',
          onPress: async () => {
            try {
              await changeMemberStatus(memberId, 'banned') // API status là 'banned'
              Alert.alert('Thành công', `Đã khóa tài khoản của ${memberName}.`)
              fetchMembers(1) // Tải lại danh sách
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.')
            }
          },
          style: 'destructive'
        }
      ]
    )
  }

  // --- CÁC COMPONENT RENDER PHỤ ---

  const renderMemberItem = ({ item }: { item: MemberDisplayInfo }) => {
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
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetail}>
            <Ionicons name='mail-outline' /> {item.email}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name='call-outline' /> {item.phone}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name='people-outline' />{' '}
            {item.branchName || 'Chưa có chi đoàn'}
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
        <TouchableOpacity
          onPress={() => handleLockMember(item.id, item.name)}
          style={styles.lockButton}
        >
          <Ionicons name='lock-closed-outline' size={24} color='#EF4444' />
        </TouchableOpacity>
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
            onPress={() => fetchMembers(1)}
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

  // --- GIAO DIỆN CHÍNH ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name='arrow-back' size={28} color='white' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách Đoàn viên</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/leader/members/add')}
          style={styles.headerButton}
        >
          <Ionicons name='add' size={28} color='white' />
        </TouchableOpacity>
      </View>

      {/* Controls */}
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

      {/* List */}
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

// --- STYLESHEET ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  // Header
  header: {
    backgroundColor: '#3E4FF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16
  },
  headerButton: { padding: 8 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  // Controls
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
  // Dropdown
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
  // List Item
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
  lockButton: { padding: 8, alignSelf: 'flex-start' },
  // Empty/Error/Loading
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
