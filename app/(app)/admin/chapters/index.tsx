import { chapterApi } from "@/api";
import ChapterCard from "@/components/ChapterCard";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDebounce } from "../../../../hooks/useDebounce";

// Define a type interface for chapter data
interface ChapterType {
  _id: string;
  name: string;
  address: string;
  affiliated: string;
  secretary: string;
  image: string;
  status?: string;
  establishedAt?: { $date: string } | string;
}

// Simple dropdown 
const Dropdown = ({
  options,
  placeholder,
  onSelect,
  selectedValue,
  isOpen,
  onToggle,
}: {
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
  selectedValue: string;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <View className='w-[48%]'>
      {/* Dropdown header */}
      <TouchableOpacity
        onPress={onToggle}
        className='flex-row items-center justify-between p-3 border border-gray-200 rounded-lg'
      >
        <Text className='text-gray-700 text-base' numberOfLines={1}>
          {selectedValue || placeholder}
        </Text>
        <Feather
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color='#333'
        />
      </TouchableOpacity>

      {/* Dropdown options */}
      {isOpen && (
        <View className='border border-gray-200 rounded-lg mt-1 absolute top-full left-0 right-0 bg-white z-20 max-h-40 shadow-md'>
          <ScrollView nestedScrollEnabled={true}>
            {options.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onSelect(item);
                  onToggle();
                }}
                className='p-3 border-b border-gray-100'
              >
                <Text className='text-gray-700 text-base'>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const ChapterList = () => {
  const router = useRouter();
  const STATUS_OPTIONS = [
    { label: "Tất cả trạng thái", value: "all" },
    { label: "Đang hoạt động", value: "actived" },
    { label: "Đã khóa", value: "locked" },
  ];

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [chapters, setChapters] = useState<ChapterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);

  const toggleStatusDropdown = () => {
    setStatusDropdownOpen(!statusDropdownOpen);
  };

  // Fetch chapters from API
  const fetchChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        search: debouncedSearch,
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        limit: 10,
      };
      const res = await chapterApi.getChapters(params);
      setChapters(res.data.data.docs || res.data.data || []);
    } catch {
      setError("Không thể tải danh sách chi đoàn");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedStatus]);

  useFocusEffect(
    useCallback(() => {
      fetchChapters();
    }, [fetchChapters])
  );

  // Navigation to detail screen
  const handleChapterPress = (chapter: ChapterType) => {
    router.push({
      pathname: "/(app)/admin/chapters/[id]/(tabs)/general",
      params: { id: chapter._id },
    });
  };

  // Navigation to add screen
  const handleAddChapter = () => {
    router.push("/(app)/admin/chapters/add");
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      {/* Header Section */}
      <View className='w-full bg-[#3E4FF5] py-8 px-4 rounded-b-xl'>
        <Text className='text-white text-3xl font-bold text-center mb-4'>
          Danh sách chi đoàn
        </Text>
      </View>
      {/* Search Bar */}
      <View className='w-[90%] -mt-6 mb-4 mx-auto flex-row items-center bg-white rounded-lg p-3 shadow-md z-10'>
        <Feather name='search' size={24} color='#888' className='mr-2' />
        <TextInput
          placeholder='Nhập tên chi đoàn'
          placeholderTextColor='#888'
          className='flex-1 py-2 text-gray-700 text-base'
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {/* Status Dropdown and Add Button*/}
      <View className='w-[90%] mx-auto mt-2 mb-2 flex-row items-center justify-between'>
        <Dropdown
          options={STATUS_OPTIONS.map((opt) => opt.label)}
          placeholder='Trạng thái'
          selectedValue={
            STATUS_OPTIONS.find((opt) => opt.value === selectedStatus)?.label ||
            "Tất cả trạng thái"
          }
          onSelect={(label) => {
            const found = STATUS_OPTIONS.find((opt) => opt.label === label);
            setSelectedStatus(found ? found.value : "all");
          }}
          isOpen={statusDropdownOpen}
          onToggle={toggleStatusDropdown}
        />
        <TouchableOpacity
          className='bg-blue-600 py-3 px-4 rounded-lg flex-row items-center justify-center ml-2'
          onPress={handleAddChapter}
        >
          <Text className='text-white font-semibold'>+ Thêm chi đoàn mới</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className='flex-1 bg-white'>
        {/* Content container */}
        <View className='w-[90%] mx-auto pt-1'>
          {/* Loading, Error, and Chapters List */}
          {loading ? (
            <Text className='text-center text-gray-500 my-8'>Đang tải...</Text>
          ) : error ? (
            <Text className='text-center text-red-500 my-8'>{error}</Text>
          ) : chapters.length === 0 ? (
            <Text className='text-center text-gray-500 my-8'>
              Không có chi đoàn nào
            </Text>
          ) : (
            chapters.map((chapter, index) => (
              <ChapterCard
                key={chapter._id || index}
                name={chapter.name}
                affiliated={chapter.affiliated}
                establishedAt={
                  typeof chapter.establishedAt === "object" &&
                  chapter.establishedAt !== null
                    ? chapter.establishedAt.$date
                    : chapter.establishedAt
                }
                status={chapter.status}
                onPress={() => handleChapterPress(chapter)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChapterList;
