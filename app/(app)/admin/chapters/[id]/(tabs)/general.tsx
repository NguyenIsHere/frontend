import { chapterApi } from "@/api";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ChapterGeneralTab = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chapterId = params.id as string;

  const [chapterInfo, setChapterInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!chapterId) {
          setError("Thiếu mã chi đoàn (chapterId)");
          setLoading(false);
          return;
        }
        const res = await chapterApi.getChapterById(chapterId);
        console.log("[DEBUG] API response:", res);
        if (!res?.data?.data) {
          setError("Không tìm thấy dữ liệu chi đoàn");
          setChapterInfo(null);
        } else {
          setChapterInfo(res.data.data);
          setLocked(res.data.data.status === "Đã khóa");
        }
      } catch (err) {
        console.error("[ERROR] Lỗi tải thông tin chi đoàn:", err);
        setError("Không thể tải thông tin chi đoàn");
      } finally {
        setLoading(false);
      }
    };
    if (chapterId) fetchChapter();
    else setError("Thiếu mã chi đoàn (chapterId)");
  }, [chapterId]);

  const handleEdit = () => {
    if (!chapterInfo) return;
    router.push({
      pathname: "/(app)/admin/chapters/edit",
      params: { ...chapterInfo, id: chapterId },
    });
  };

  // Cập nhật trạng thái chi đoàn
  const handleToggleLock = async () => {
    if (!chapterInfo || !chapterId) return;
    const newStatus = locked ? "actived" : "locked";
    try {
      await chapterApi.updateChapter(chapterId, { status: newStatus });
      setLocked(!locked);
      setChapterInfo({ ...chapterInfo, status: newStatus });
      // Hiển thị thông báo
      alert(!locked ? "Chi đoàn đã bị khóa." : "Chi đoàn đã được mở khóa.");
    } catch {
      alert("Không thể cập nhật trạng thái chi đoàn.");
    }
  };

  if (loading) {
    return <ActivityIndicator className='mt-10' size='large' color='#3E4FF5' />;
  }
  if (error || !chapterInfo) {
    return (
      <Text className='text-center text-red-500 mt-10'>
        {error || "Không có dữ liệu"}
      </Text>
    );
  }

  return (
    <ScrollView className='flex-1 bg-white px-4 py-4'>
      {/* Tên chi đoàn */}
      <View className='mb-4'>
        <Text className='text-gray-800 font-medium mb-2'>Tên chi đoàn</Text>
        <View className='border border-gray-300 rounded-lg p-3'>
          <Text className='text-gray-700'>
            {chapterInfo?.name || "Không có dữ liệu"}
          </Text>
        </View>
      </View>

      {/* Địa chỉ */}
      <View className='mb-4'>
        <Text className='text-gray-800 font-medium mb-2'>Địa chỉ</Text>
        <View className='border border-gray-300 rounded-lg p-3'>
          <Text className='text-gray-700'>
            {chapterInfo?.address || "Không có dữ liệu"}
          </Text>
        </View>
      </View>

      {/* Đoàn trực thuộc */}
      <View className='mb-4'>
        <Text className='text-gray-800 font-medium mb-2'>Đoàn trực thuộc</Text>
        <View className='border border-gray-300 rounded-lg p-3'>
          <Text className='text-gray-700'>
            {chapterInfo?.affiliated || "Không có dữ liệu"}
          </Text>
        </View>
      </View>

      {/* Ngày thành lập */}
      <View className='mb-4'>
        <Text className='text-gray-800 font-medium mb-2'>Ngày thành lập</Text>
        <View className='border border-gray-300 rounded-lg p-3'>
          <Text className='text-gray-700'>
            {chapterInfo?.establishedAt?.$date
              ? new Date(chapterInfo.establishedAt.$date)
                  .toISOString()
                  .slice(0, 10)
              : typeof chapterInfo?.establishedAt === "string"
              ? chapterInfo.establishedAt.slice(0, 10)
              : "Không có dữ liệu"}
          </Text>
        </View>
      </View>

      {/* Trạng thái */}
      <View className='mb-4'>
        <Text className='text-gray-800 font-medium mb-2'>Trạng thái</Text>
        <View className='border border-gray-300 rounded-lg p-3'>
          <Text
            className={`font-semibold ${
              locked ? "text-red-500" : "text-green-600"
            }`}
          >
            {locked
              ? "Đã khóa"
              : chapterInfo?.status === "actived"
              ? "Đang hoạt động"
              : chapterInfo?.status || "Không rõ"}
          </Text>
        </View>
      </View>

      {/* Người quản lý */}
      <View className='mb-4'>
        <Text className='text-gray-800 font-medium mb-2'>Người quản lý</Text>
        <View className='border border-gray-300 rounded-lg p-3'>
          <Text className='text-gray-700'>
            {chapterInfo?.manager?.fullname || "Chưa cập nhật"}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className='flex-row justify-center gap-4 mt-6'>
        <TouchableOpacity
          className='bg-[#3E4FF5] py-2.5 px-5 rounded-lg flex-row items-center justify-center mr-2'
          onPress={handleEdit}
        >
          <Feather
            name='edit-2'
            size={16}
            color='white'
            style={{ marginRight: 5 }}
          />
          <Text className='text-white font-medium'>Chỉnh sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`py-2.5 px-5 rounded-lg flex-row items-center justify-center ${
            locked ? "bg-green-600" : "bg-red-500"
          }`}
          onPress={handleToggleLock}
        >
          <Feather
            name={locked ? "unlock" : "lock"}
            size={16}
            color='white'
            style={{ marginRight: 5 }}
          />
          <Text className='text-white font-medium'>
            {locked ? "Mở khóa" : "Khóa"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ChapterGeneralTab;
