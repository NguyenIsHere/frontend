import { chapterApi } from "@/api";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ChapterAddScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Prefill state from params
  const [name, setName] = useState((params.name as string) || "");
  const [address, setAddress] = useState((params.address as string) || "");
  const [foundingDate, setFoundingDate] = useState("");
  const [affiliated, setAffiliated] = useState(
    (params.affiliated as string) || ""
  );
  const [imageUri, setImageUri] = useState((params.image as string) || "");
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const showDatePickerHandler = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      setFoundingDate(`${year}-${month}-${day}`);
    }
  };

  // Handle add new chapter
  const handleAddChapter = async () => {
    setLoading(true);
    setError(null);
    try {
      let establishedAt: string | undefined = undefined;
      if (foundingDate) {
        // Validate YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(foundingDate)) {
          setError(
            "Ngày thành lập không hợp lệ. Định dạng phải là YYYY-MM-DD."
          );
          setLoading(false);
          return;
        }
        const [year, month, day] = foundingDate.split("-");
        // Check if valid date
        const dateObj = new Date(`${year}-${month}-${day}`);
        if (
          dateObj.getFullYear() !== Number(year) ||
          dateObj.getMonth() + 1 !== Number(month) ||
          dateObj.getDate() !== Number(day)
        ) {
          setError("Ngày thành lập không hợp lệ.");
          setLoading(false);
          return;
        }
        // Check if date is in the future
        const today = new Date();
        if (dateObj > today) {
          setError("Ngày thành lập không được lớn hơn ngày hiện tại.");
          setLoading(false);
          return;
        }
        establishedAt = foundingDate;
      }

      const payload: any = {
        name,
        address,
        affiliated,
      };
      if (establishedAt) payload.establishedAt = establishedAt;
      if (imageUri) payload.image = imageUri;
      // Debug log
      console.log("Add payload:", payload);
      try {
        const res = await chapterApi.createChapter(payload);
        console.log("Add response:", res);
        router.replace("/admin/chapters");
      } catch (err: any) {
        if (err?.response?.data) {
          console.log("API error:", err.response.data);
          setError(
            err.response.data.message || JSON.stringify(err.response.data)
          );
        } else {
          setError(
            err?.message || "Không thể thêm chi đoàn. Vui lòng thử lại."
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      {/* Header Section */}
      <View className='w-full bg-[#3E4FF5] py-8 px-4 rounded-b-xl'>
        <View className='flex-row items-center justify-center'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='absolute left-0'
          >
            <Feather name='chevron-left' size={26} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-2xl font-bold text-center'>
            Thêm chi đoàn mới
          </Text>
        </View>
      </View>
      <ScrollView className='flex-1 bg-white px-4'>
        {/* Chapter Logo */}
        <View className='items-center mt-6 mb-4 relative'>
          <View className='w-28 h-28 rounded-xl bg-[#F5F5F5] items-center justify-center overflow-hidden'>
            {imageError || !imageUri ? (
              <Feather name='image' size={40} color='#888' />
            ) : (
              <Image
                source={{ uri: imageUri }}
                onError={() => setImageError(true)}
                className='w-28 h-28'
                resizeMode='cover'
              />
            )}
          </View>
          <TouchableOpacity
            className='absolute right-[35%] bottom-0 bg-[#3E4FF5] w-10 h-10 rounded-full items-center justify-center'
            onPress={() => {
              // Add image selection logic here
            }}
          >
            <Feather name='edit-2' size={18} color='white' />
          </TouchableOpacity>
        </View>
        {/* Form Fields */}
        <View className='mt-4'>
          {/* Name Field */}
          <View className='mb-4'>
            <Text className='text-gray-700 mb-2'>Tên</Text>
            <TextInput
              className='border border-gray-300 rounded-lg p-3 text-gray-700'
              placeholder='Nhập tên chi đoàn'
              value={name}
              onChangeText={setName}
            />
          </View>
          {/* Address Field */}
          <View className='mb-4 relative'>
            <Text className='text-gray-700 mb-2'>Địa chỉ</Text>
            <View className='relative'>
              <TextInput
                className='border border-gray-300 rounded-lg p-3 text-gray-700 pr-10'
                placeholder='Nhập địa chỉ chi đoàn'
                value={address}
                onChangeText={setAddress}
              />
              <TouchableOpacity
                className='absolute right-3 top-3'
                onPress={() => {
                  // Add location picker logic
                }}
              >
                <Feather name='map-pin' size={20} color='#3E4FF5' />
              </TouchableOpacity>
            </View>
          </View>
          {/* Founding Date Field - Manual Input with Calendar Icon */}
          <View className='mb-4'>
            <Text className='text-gray-700 mb-2'>Ngày thành lập</Text>
            <View className='relative'>
              <TextInput
                className='border border-gray-300 rounded-lg p-3 text-gray-700 pr-10'
                placeholder='YYYY-MM-DD'
                value={foundingDate}
                onChangeText={setFoundingDate}
                editable={false}
              />
              <TouchableOpacity
                className='absolute right-3 top-3'
                onPress={showDatePickerHandler}
              >
                <Feather name='calendar' size={20} color='#3E4FF5' />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={foundingDate ? new Date(foundingDate) : new Date()}
                  mode='date'
                  display='default'
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>
          {/* Parent Organization Field */}
          <View className='mb-4'>
            <Text className='text-gray-700 mb-2'>Đoàn trực thuộc</Text>
            <TextInput
              className='border border-gray-300 rounded-lg p-3 text-gray-700'
              placeholder='Nhập tên đoàn trực thuộc'
              value={affiliated}
              onChangeText={setAffiliated}
            />
          </View>
        </View>
        {/* Save Button */}
        <TouchableOpacity
          className='bg-blue-600 py-3 rounded-lg flex-row items-center justify-center mb-4 w-3/6 mx-auto'
          onPress={handleAddChapter}
          disabled={loading}
        >
          <Feather name='save' size={18} color='white' className='mr-2' />
          <Text className='text-white font-semibold ml-2'>
            {loading ? "Đang lưu..." : "Thêm chi đoàn"}
          </Text>
        </TouchableOpacity>
        {error && (
          <Text className='text-center text-red-500 mb-4'>{error}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChapterAddScreen;
