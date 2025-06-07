import { Feather } from '@expo/vector-icons'
import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

// --- 1. Định nghĩa các kiểu dữ liệu (Types) cho component ---

// Kiểu dữ liệu cho mỗi mục trong danh sách dropdown
export interface DropdownOption {
  label: string
  value: string
}

// Kiểu dữ liệu cho các props mà component CustomDropdown nhận vào
export type CustomDropdownProps = {
  options: DropdownOption[]
  placeholder: string
  onSelect: (value: string) => void
  selectedValue: string
  isOpen: boolean
  onToggle: () => void
  disabled?: boolean
}

// --- 2. Component CustomDropdown ---

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  placeholder,
  onSelect,
  selectedValue,
  isOpen,
  onToggle,
  disabled = false
}) => {
  // Tìm label tương ứng với value được chọn để hiển thị
  const displayLabel =
    options.find((opt: DropdownOption) => opt.value === selectedValue)?.label ||
    placeholder

  return (
    <View style={[styles.container, { zIndex: isOpen ? 1000 : 10 }]}>
      {/* Nút bấm để mở/đóng dropdown */}
      <TouchableOpacity
        onPress={!disabled ? onToggle : undefined}
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

      {/* Danh sách các lựa chọn (chỉ hiện khi isOpen là true) */}
      {isOpen && !disabled && (
        <View style={styles.dropdownListContainer}>
          <ScrollView nestedScrollEnabled={true}>
            {options.map((option: DropdownOption, index: number) => (
              <TouchableOpacity
                key={`${option.value}-${index}`}
                onPress={() => {
                  onSelect(option.value)
                  onToggle() // Tự động đóng dropdown sau khi chọn
                }}
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
      )}
    </View>
  )
}

// --- 3. StyleSheet cho Component ---
const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50 // Chiều cao cố định để các input bằng nhau
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F3F4F6' // gray-100
  },
  dropdownButtonText: {
    color: '#1F2937', // gray-800
    fontSize: 16,
    flex: 1
  },
  placeholderText: {
    color: '#9CA3AF' // gray-400
  },
  disabledText: {
    color: '#9CA3AF' // gray-400
  },
  dropdownListContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    marginTop: 4,
    maxHeight: 200, // Giới hạn chiều cao của danh sách
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6' // gray-100
  },
  lastDropdownItem: {
    borderBottomWidth: 0
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151' // gray-700
  }
})

export default CustomDropdown
