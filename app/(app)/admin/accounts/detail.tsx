import { Feather, Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

// --- 1. Imports và Helpers ---
import { accountApi } from '../../../../api'

type AccountFromApi = any // Nên định nghĩa chi tiết hơn để có type-safety

// Các hàm helper để định dạng dữ liệu
const formatDate = (isoDate?: string) => {
  if (!isoDate) return 'Chưa cập nhật'
  const date = new Date(isoDate)
  return date.toLocaleDateString('vi-VN')
}
const formatGender = (gender?: string) =>
  gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Chưa cập nhật'
const formatRole = (role?: string) => {
  if (role === 'admin') return 'Quản trị viên'
  if (role === 'manager') return 'Quản lý Chi đoàn'
  return 'Đoàn viên'
}

// Component để hiển thị một dòng thông tin
const DetailRow: React.FC<{ label: string; value?: string | null }> = ({
  label,
  value
}) => {
  if (!value) return null
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

// --- 2. Component chính ---
export default function AccountDetailScreen () {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [account, setAccount] = useState<AccountFromApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- 3. Logic Fetching và Actions ---
  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy ID tài khoản.')
      setIsLoading(false)
      return
    }
    const fetchAccount = async () => {
      setIsLoading(true)
      try {
        const response = await accountApi.getAccountById(id)
        if (response.data.success) {
          setAccount(response.data.data)
        } else {
          throw new Error(response.data.message)
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Không thể tải dữ liệu.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAccount()
  }, [id])

  const updateStatus = async (
    newStatus: 'actived' | 'locked',
    actionText: string
  ) => {
    if (!account) return
    Alert.alert(
      `Xác nhận ${actionText}`,
      `Bạn có chắc muốn ${actionText.toLowerCase()} tài khoản "${
        account.fullname
      }"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: newStatus === 'locked' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await accountApi.updateAccount(account._id, { status: newStatus })
              // Cập nhật lại state để UI thay đổi ngay lập tức
              setAccount((prev: any) =>
                prev ? { ...prev, status: newStatus } : null
              )
              Alert.alert(
                'Thành công',
                `Đã ${actionText.toLowerCase()} tài khoản.`
              )
            } catch (err) {
              Alert.alert('Lỗi', 'Thao tác thất bại.')
            }
          }
        }
      ]
    )
  }

  // --- 4. Giao diện ---
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#3E4FF5' />
      </View>
    )
  }

  if (error || !account) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Lỗi</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const statusStyles = {
    actived: { label: 'Hoạt động', color: '#10B981' },
    pending: { label: 'Chờ phê duyệt', color: '#F59E0B' },
    locked: { label: 'Bị khóa', color: '#EF4444' }
  }

  // --- HÀM ĐIỀU HƯỚNG ĐÃ CẬP NHẬT ---
  const handleNavigateToEdit = () => {
    // Đảm bảo account và account._id đã tồn tại
    if (!account?._id) return

    router.push({
      // Sửa lại pathname cho đúng với cấu trúc route của bạn
      pathname: '/admin/accounts/add',
      params: { id: account._id } // Truyền ID qua params
    })
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name='arrow-back' size={28} color='white' />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {account.fullname}
            </Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Thông tin cá nhân */}
        <View style={styles.infoBlock}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                account.avatar?.url
                  ? { uri: account.avatar.url }
                  : require('../../../../assets/images/avatar-placeholder.png')
              }
              style={styles.avatar}
            />
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    statusStyles[account.status as keyof typeof statusStyles]
                      .color + '20'
                }
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      statusStyles[account.status as keyof typeof statusStyles]
                        .color
                  }
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      statusStyles[account.status as keyof typeof statusStyles]
                        .color
                  }
                ]}
              >
                {
                  statusStyles[account.status as keyof typeof statusStyles]
                    .label
                }
              </Text>
            </View>
          </View>
          <DetailRow label='Họ và tên' value={account.fullname} />
          <DetailRow label='Vai trò' value={formatRole(account.role)} />
          <DetailRow label='Email' value={account.email} />
          <DetailRow label='Số điện thoại' value={account.phone} />
          <DetailRow label='Giới tính' value={formatGender(account.gender)} />
          <DetailRow label='Ngày sinh' value={formatDate(account.birthday)} />
        </View>

        {/* Thông tin Đoàn/Chi đoàn - chỉ hiển thị nếu có */}
        {(account.role === 'member' || account.role === 'manager') && (
          <View style={styles.infoBlock}>
            <Text style={styles.blockTitle}>Thông tin Đoàn thể</Text>
            <DetailRow label='Chi đoàn' value={account.chapterId?.name} />
            <DetailRow label='Số thẻ Đoàn' value={account.cardCode} />
            <DetailRow label='Chức vụ' value={account.position} />
            <DetailRow
              label='Ngày vào Đoàn'
              value={formatDate(account.joinedAt)}
            />
            <DetailRow label='Quê quán' value={account.hometown} />
            <DetailRow label='Địa chỉ' value={account.address} />
            <DetailRow label='Dân tộc' value={account.ethnicity} />
            <DetailRow label='Tôn giáo' value={account.religion} />
            <DetailRow label='Trình độ học vấn' value={account.eduLevel} />
          </View>
        )}
      </ScrollView>

      {/* --- CÁC NÚT HÀNH ĐỘNG (ĐÃ CẬP NHẬT) --- */}
      <View style={styles.footerActions}>
        {account.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => updateStatus('actived', 'Phê duyệt')}
          >
            <Text style={styles.actionButtonText}>Phê duyệt</Text>
          </TouchableOpacity>
        )}

        {account.status === 'actived' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleNavigateToEdit}
            >
              <Feather name='edit-2' size={16} color='white' />
              <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.lockButton]}
              onPress={() => updateStatus('locked', 'Khóa')}
            >
              <Text style={styles.actionButtonText}>Khóa TK</Text>
            </TouchableOpacity>
          </View>
        )}

        {account.status === 'locked' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleNavigateToEdit}
            >
              <Feather name='edit-2' size={16} color='white' />
              <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.unlockButton]}
              onPress={() => updateStatus('actived', 'Mở khóa')}
            >
              <Text style={styles.actionButtonText}>Mở khóa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: { color: '#EF4444', fontSize: 16, textAlign: 'center' },
  headerContainer: {
    backgroundColor: '#3E4FF5',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: { padding: 0 },
  headerTitleContainer: { flex: 1, marginHorizontal: 8 },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  headerRightPlaceholder: { width: 44 },
  scrollViewContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 12
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '600' },
  infoBlock: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  infoRow: { marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#111827', fontWeight: '500' },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12 // Khoảng cách giữa các nút
  },
  actionButton: {
    flex: 1, // Để các nút chia sẻ không gian
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8 // Khoảng cách giữa icon và text
  },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  approveButton: { backgroundColor: '#10B981' }, // green-500
  lockButton: { backgroundColor: '#EF4444' }, // red-500
  unlockButton: { backgroundColor: '#F59E0B' }, // amber-500
  editButton: { backgroundColor: '#6B7280' } // gray-500
})
