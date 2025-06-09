import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MemberItemProps {
  fullname: string;
  cardNumber?: string; // Số thẻ đoàn
  position?: string; // Chức vụ
  imageUri?: ImageSourcePropType;
  onPress?: () => void;
  onDelete?: () => void;
}

const MemberItem: React.FC<MemberItemProps> = ({
  fullname,
  cardNumber = "",
  position = "",
  imageUri,
  onPress,
  onDelete,
}) => {
  return (
    <TouchableOpacity
      className='bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm'
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className='flex-row'>
        {/* Profile Image */}
        {imageUri ? (
          <Image
            source={imageUri}
            className='w-16 h-16 rounded-full mr-3'
            resizeMode='cover'
          />
        ) : (
          <View className='w-16 h-16 rounded-full bg-gray-200 mr-3 items-center justify-center'>
            <Feather name='user' size={24} color='#888' />
          </View>
        )}

        {/* Content */}
        <View className='flex-1 justify-center'>
          {/* Member name */}
          <Text className='font-medium text-lg'>{fullname}</Text>

          {/* Member details */}
          <View className='mt-1'>
            {cardNumber && (
              <View className='flex-row items-center mb-1'>
                <Feather name='credit-card' size={14} color='#666' />
                <Text className='text-gray-600 text-xs ml-2'>
                  <Text className='font-bold'>Số thẻ đoàn:</Text> {cardNumber}
                </Text>
              </View>
            )}

            {position && (
              <View className='flex-row items-center'>
                <Feather name='user-check' size={14} color='#666' />
                <Text className='text-gray-600 text-xs ml-2'>
                  <Text className='font-bold'>Chức vụ:</Text> {position}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MemberItem;
