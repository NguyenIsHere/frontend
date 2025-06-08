import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Sharing from 'expo-sharing'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

// 1. Import API và các hook cần thiết
import { documentApi } from '../../../../api'

// --- 2. Cập nhật kiểu dữ liệu và các hàm helper cho khớp với BE ---

// Type này ánh xạ trực tiếp từ document.model.js
type DocumentFromApi = {
  _id: string
  docCode: string
  name: string
  description: string
  issuer: string
  issuedAt: string
  file: { url: string; public_id: string }
  scope: 'chapter' | 'private'
  chapterId: any
}

// Helper để hiển thị và tạo style cho 'scope'
const getScopeStyle = (scope: 'chapter' | 'private') => {
  switch (scope) {
    case 'private':
      return {
        text: 'Riêng tư',
        icon: 'lock-closed-outline' as const,
        color: '#EF4444', // red-500
        bgColor: 'bg-red-100'
      }
    case 'chapter':
    default:
      return {
        text: 'Chi đoàn',
        icon: 'people-outline' as const,
        color: '#3B82F6', // blue-500
        bgColor: 'bg-blue-100'
      }
  }
}

export default function DocumentDetailScreen () {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  // 3. State để quản lý dữ liệu, loading, lỗi
  const [document, setDocument] = useState<DocumentFromApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 4. useEffect để gọi API lấy chi tiết tài liệu
  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy ID tài liệu.')
      setIsLoading(false)
      return
    }

    const fetchDocument = async () => {
      setIsLoading(true)
      try {
        const response = await documentApi.getDocumentById(id)
        if (response.data.success) {
          setDocument(response.data.data)
        } else {
          throw new Error(response.data.message)
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Không thể tải dữ liệu.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [id])

  // 5. Hàm xử lý cho các nút hành động
  const handleDelete = () => {
    if (!document) return
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa vĩnh viễn tài liệu "${document.name}"? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentApi.deleteDocument(document._id)
              Alert.alert('Thành công', 'Đã xóa tài liệu.', [
                { text: 'OK', onPress: () => router.back() }
              ])
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa tài liệu này.')
            }
          }
        }
      ]
    )
  }

  const handleEdit = () => {
    if (!document) return
    router.push({
      pathname: '/(app)/leader/documents/edit', // Sửa: đường dẫn tới màn hình edit
      params: { id: document._id } // Chỉ cần truyền ID
    })
  }

  const handleOpenFile = async () => {
    if (!document?.file?.url) {
      Alert.alert('Lỗi', 'Tài liệu này không có tệp đính kèm.')
      return
    }

    // --- BẮT ĐẦU PHẦN LOGIC MỚI ---

    // Lấy tên tài liệu từ API để làm tên file
    const docName = document.name || 'document'

    // Tạo tên file hợp lệ: thay khoảng trắng bằng gạch dưới, bỏ ký tự đặc biệt
    const sanitizedName = docName
      .replace(/\s/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '')
    const fileName = `${sanitizedName}.pdf` // Giả định tất cả file đều là PDF

    const localUri = FileSystem.documentDirectory + fileName

    try {
      // Hiển thị loading (tùy chọn)
      console.log('Bắt đầu tải file:', document.file.url)

      const { uri: downloadedUri } = await FileSystem.downloadAsync(
        document.file.url,
        localUri
      )

      console.log('Tải file thành công tại:', downloadedUri)

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Lỗi', 'Tính năng chia sẻ hoặc mở tệp không khả dụng.')
        return
      }

      // Mở file đã tải về với tên và đuôi file chính xác
      await Sharing.shareAsync(downloadedUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf'
      })
    } catch (err) {
      console.error(err)
      Alert.alert('Lỗi', 'Không thể tải hoặc mở tệp đính kèm.')
    }
  }

  // --- 6. Giao diện ---
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#3E4FF5' />
      </View>
    )
  }

  if (error || !document) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Lỗi</Text>
        </View>
        <View style={styles.centered}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const scopeStyle = getScopeStyle(document.scope)

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
              Chi tiết Tài liệu
            </Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.card}>
          <Text style={styles.documentName}>{document.name}</Text>
          <Text style={styles.docCode}>Số hiệu: {document.docCode}</Text>

          <InfoRow
            icon='calendar-outline'
            label='Ngày ban hành:'
            value={new Date(document.issuedAt).toLocaleDateString('vi-VN')}
          />
          <InfoRow
            icon='location-outline'
            label='Nơi ban hành:'
            value={document.issuer}
          />

          <View style={styles.tagRow}>
            <TagItem
              icon={scopeStyle.icon}
              text={scopeStyle.text}
              color={scopeStyle.color}
              bgColor={scopeStyle.bgColor}
            />
          </View>

          <TouchableOpacity
            style={styles.fileLinkButton}
            onPress={handleOpenFile}
          >
            <Ionicons
              name='attach-outline'
              size={20}
              color='#3E4FF5'
              style={{ marginRight: 8 }}
            />
            <Text style={styles.fileLinkText} numberOfLines={1}>
              Mở tệp đính kèm
            </Text>
            <Ionicons
              name='open-outline'
              size={20}
              color='#3E4FF5'
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Mô tả chi tiết:</Text>
            <Text style={styles.descriptionText}>
              {document.description || 'Không có mô tả.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Nút hành động ở cuối màn hình */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name='trash-outline' size={22} color='white' />
          <Text style={styles.actionButtonText}>Xóa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Ionicons name='pencil-outline' size={22} color='white' />
          <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// Các component phụ
const InfoRow: React.FC<{ icon: any; label: string; value: string }> = ({
  icon,
  label,
  value
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color='#4B5563' style={styles.infoIcon} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
)
const TagItem: React.FC<{
  icon: any
  text: string
  color: string
  bgColor: string
}> = ({ icon, text, color, bgColor }) => (
  <View style={[styles.tag, { backgroundColor: color + '20' }]}>
    <Ionicons name={icon} size={16} color={color} style={{ marginRight: 6 }} />
    <Text style={[styles.tagText, { color: color }]}>{text}</Text>
  </View>
)

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  backButton: { padding: 8 },
  headerTitleContainer: { flex: 1, marginHorizontal: 8 },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  headerRightPlaceholder: { width: 44 },
  scrollView: { flex: 1 },
  scrollViewContent: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  documentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 30
  },
  docCode: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4
  },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
    marginRight: 8
  },
  infoValue: { fontSize: 16, color: '#1F2937', flexShrink: 1 },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 15,
    justifyContent: 'center',
    gap: 10
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  tagText: { fontSize: 14, fontWeight: '500' },
  fileLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  fileLinkText: {
    fontSize: 15,
    color: '#3E4FF5',
    fontWeight: '500',
    flexShrink: 1
  },
  descriptionContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  descriptionText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5
  },
  deleteButton: { backgroundColor: '#EF4444' },
  editButton: { backgroundColor: '#F59E0B' },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
})
