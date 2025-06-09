import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface EventItemProps {
  title: string;
  time?: string;
  location?: string;
  status?: string;
  scale?: string; // Add scale prop
  onPress?: () => void;
  onDelete?: () => void;
}

const getStatusColor = (status?: string) => {
  if (status === "actived") return "#10B981";
  if (status === "pending") return "#F59E0B";
  if (status === "locked") return "#EF4444";
  return "#6B7280";
};
const getStatusLabel = (status?: string) => {
  if (status === "actived") return "Đang hoạt động";
  if (status === "pending") return "Chờ duyệt";
  if (status === "locked") return "Đã khóa";
  return "Không rõ";
};

const EventItem: React.FC<EventItemProps> = ({
  title,
  time = "Thời gian",
  location = "Địa điểm",
  status = "Tình trạng",
  scale = "Quy mô", // Default value
  onPress,
  onDelete,
}) => {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  return (
    <TouchableOpacity
      className='bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm'
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className='flex-row justify-between items-center'>
        <Text className='font-medium text-base flex-1 pr-2' numberOfLines={2}>
          {title}
        </Text>

        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name='trash-2' size={20} color='#FF3B30' />
          </TouchableOpacity>
        )}
      </View>

      <View className='flex-row mt-3 flex-wrap' style={{ gap: 8 }}>
        <View className='flex-row items-center mr-4 mb-2'>
          <Feather name='clock' size={14} color='#666' />
          <Text className='text-gray-600 text-xs ml-1'>{time}</Text>
        </View>

        <View className='flex-row items-center mr-4 mb-2'>
          <Feather name='map-pin' size={14} color='#666' />
          <Text className='text-gray-600 text-xs ml-1'>{location}</Text>
        </View>

        <View className='flex-row items-center mr-4 mb-2'>
          <Feather name='users' size={14} color='#666' />
          <Text className='text-gray-600 text-xs ml-1'>{scale}</Text>
        </View>

        <View className='flex-row items-center mb-2'>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: statusColor + "20",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginLeft: 4,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: statusColor,
                marginRight: 6,
              }}
            />
            <Text
              style={{
                color: statusColor,
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventItem;
