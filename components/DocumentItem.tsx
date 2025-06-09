import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface DocumentItemProps {
  title: string;
  code?: string; // Số hiệu
  scope?: string; // Quy mô
  createdAt?: string; // Ngày ban hành
  issuer?: string; // Nơi ban hành
  onPress?: () => void;
  onDelete?: () => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  title,
  code = "",
  scope = "",
  createdAt = "",
  issuer = "",
  onPress,
  onDelete,
}) => {
  return (
    <TouchableOpacity
      className='bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm'
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Document Title */}
      <View className='flex-row justify-between items-center'>
        <Text className='font-medium text-base flex-1 pr-2' numberOfLines={2}>
          {title}
        </Text>
        <Feather name='arrow-right' size={20} color='#414141' />
      </View>

      {/* Document Metadata - Full width horizontal layout */}
      <View className='mt-3 flex-row flex-wrap w-full'>
        {code && (
          <View className='flex-row items-center mr-4 mb-1'>
            <Feather name='hash' size={14} color='#414141' />
            <Text className='text-gray-600 text-xs ml-1' numberOfLines={1}>
              {code}
            </Text>
          </View>
        )}
        {scope && (
          <View className='flex-row items-center mr-4 mb-1'>
            <Feather name='users' size={14} color='#414141' />
            <Text className='text-gray-600 text-xs ml-1' numberOfLines={1}>
              {scope}
            </Text>
          </View>
        )}
        {createdAt && (
          <View className='flex-row items-center mr-4 mb-1'>
            <Feather name='calendar' size={14} color='#414141' />
            <Text className='text-gray-600 text-xs ml-1' numberOfLines={1}>
              {createdAt}
            </Text>
          </View>
        )}
        {issuer && (
          <View className='flex-row items-center mb-1'>
            <Feather name='award' size={14} color='#414141' />
            <Text className='text-gray-600 text-xs ml-1' numberOfLines={1}>
              {issuer}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default DocumentItem;
