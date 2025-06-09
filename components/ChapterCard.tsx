import "@/app/global.css";
import { Entypo, Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ChapterCardProps {
  name: string;
  affiliated: string;
  establishedAt?: string; // ISO string or undefined
  status?: string;
  onPress?: () => void;
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

const ChapterCard: React.FC<ChapterCardProps> = ({
  name,
  affiliated,
  establishedAt,
  status,
  onPress,
}) => {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className='p-6 bg-white rounded-xl shadow-lg mb-6'
    >
      {/* Top: Name + Chevron */}
      <View className='flex-row justify-between items-start mb-3'>
        <Text className='text-xl font-bold text-black-900 flex-1'>{name}</Text>
        <Entypo name='chevron-right' size={20} color='#888' />
      </View>
      {/* Info Block */}
      <View className='flex-1 justify-center' style={{ gap: 8 }}>
        <View className='flex-row items-start'>
          <Feather
            name='home'
            size={16}
            color='#555'
            style={{ marginTop: 2 }}
          />
          <Text className='text-sm text-gray-700 ml-1 flex-1'>
            <Text className='font-semibold'>Trực thuộc: </Text>
            {affiliated}
          </Text>
        </View>
        <View className='flex-row items-start'>
          <MaterialIcons
            name='event'
            size={16}
            color='#555'
            style={{ marginTop: 2 }}
          />
          <Text className='text-sm text-gray-700 ml-1 flex-1'>
            <Text className='font-semibold'>Ngày thành lập: </Text>
            {establishedAt
              ? new Date(establishedAt).toLocaleDateString("vi-VN")
              : "Không rõ"}
          </Text>
        </View>
        <View className='flex-row items-center mt-1'>
          {/* Remove status icon */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: statusColor + "20",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginLeft: 0, // Remove margin left since no icon
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
                fontSize: 13,
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

export default ChapterCard;
