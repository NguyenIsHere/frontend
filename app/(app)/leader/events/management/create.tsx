import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const DateTimePickerField = ({
    label,
    dateValue,
    onDateChange,
}: {
    label: string;
    dateValue: Date;
    onDateChange: (event: any, selectedDate?: Date) => void;
}) => {
    const [showPicker, setShowPicker] = useState(false);

    const handlePress = () => setShowPicker(true);

    const handleDateChangeInternal = (event: any, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShowPicker(false); // Close picker only when dismissed explicitly
        } else {
            onDateChange(event, selectedDate);
        }
    };

    return (
        <View className="mb-4">
            <View className="flex-row items-center mb-2">
                <Ionicons name="calendar-outline" size={20} color="#000" />
                <Text className="text-lg font-bold ml-2 text-gray-900">{label}</Text>
            </View>
            <TouchableOpacity
                className="border border-gray-300 p-3 rounded-lg bg-white flex-row justify-between items-center"
                onPress={handlePress}
            >
                <Text className="text-gray-900">
                    {`${dateValue.getFullYear()}-${(dateValue.getMonth() + 1)
                        .toString()
                        .padStart(2, '0')}-${dateValue.getDate().toString().padStart(2, '0')} ${dateValue
                            .getHours()
                            .toString()
                            .padStart(2, '0')}:${dateValue.getMinutes().toString().padStart(2, '0')}`}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#000" />
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={dateValue}
                    mode="datetime"
                    display="default"
                    onChange={handleDateChangeInternal}
                />
            )}
        </View>
    );
};

const CreateEvent = () => {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);

    // Event fields - chỉ giữ các trường cần thiết
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [location, setLocation] = useState('');
    const [startedAt, setStartedAt] = useState(new Date());

    const handleSubmit = async () => {
        try {
            // Validate required fields
            if (!name || !location || !startedAt) {
                Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }

            const formData = new FormData();

            // Basic event info - chỉ gửi các trường cần thiết
            formData.append('name', name);
            formData.append('description', description || '');
            formData.append('location', location);
            formData.append('startedAt', startedAt.toISOString());
            formData.append('status', 'pending');
            formData.append('scope', 'chapter');
            formData.append('chapterId', '684429f7643d08abee566cca');

            // Append images if any are selected
            if (selectedImages.length > 0) {
                selectedImages.forEach((uri, index) => {
                    const filename = uri.split('/').pop() || 'photo.jpg';
                    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
                    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

                    formData.append('images', {
                        uri,
                        type: mimeType,
                        name: filename,
                    } as any);
                });
            }

            const response = await eventApi.createEvent(formData);
            console.log('Server response:', response?.data);

            if (response?.data?.success) {
                Alert.alert('Thành công', 'Đã tạo sự kiện mới');
                router.back();
            } else {
                throw new Error(response?.data?.message || 'Không thể tạo sự kiện');
            }
        } catch (error: any) {
            console.error('Error creating event:', error);
            if (error.response) {
                console.error('Error response:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            Alert.alert(
                'Lỗi',
                error.message || 'Không thể tạo sự kiện. Vui lòng thử lại.'
            );
        }
    };

    // Các hàm xử lý
    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 1,
                aspect: [4, 3],
            });

            if (!result.canceled) {
                const newImages = result.assets.map(asset => asset.uri);
                setSelectedImages(prevImages => [...prevImages, ...newImages]);
                console.log('Selected images:', newImages);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="bg-blue-600 p-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Tạo sự kiện mới</Text>
                <View className="w-[24px]" />
            </View>

            {/* Form */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-4">
                    {/* Tên sự kiện */}
                    <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="document-text-outline" size={20} color="#000" />
                            <Text className="text-lg font-bold ml-2 text-gray-900">Tên sự kiện *</Text>
                        </View>
                        <TextInput
                            className="border border-gray-300 p-3 rounded-lg bg-white"
                            placeholder="Nhập tên sự kiện"
                            placeholderTextColor="#9ca3af"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Địa điểm */}
                    <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="location-outline" size={20} color="#000" />
                            <Text className="text-lg font-bold ml-2 text-gray-900">Địa điểm *</Text>
                        </View>
                        <TextInput
                            className="border border-gray-300 p-3 rounded-lg bg-white"
                            placeholder="Nhập địa điểm tổ chức"
                            placeholderTextColor="#9ca3af"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    {/* Thời gian bắt đầu */}
                    <DateTimePickerField
                        label="Thời gian bắt đầu *"
                        dateValue={startedAt}
                        onDateChange={(_, date) => date && setStartedAt(date)}
                    />

                    {/* Mô tả */}
                    <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="information-circle-outline" size={20} color="#000" />
                            <Text className="text-lg font-bold ml-2 text-gray-900">Mô tả</Text>
                        </View>
                        <TextInput
                            className="border border-gray-300 p-3 rounded-lg bg-white"
                            placeholder="Nhập mô tả sự kiện"
                            placeholderTextColor="#9ca3af"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Image Upload */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="images-outline" size={20} color="#000" />
                            <Text className="text-lg font-bold ml-2 text-gray-900">Hình ảnh</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleImagePick}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center justify-center"
                        >
                            <Ionicons name="cloud-upload-outline" size={32} color="#666" />
                            <Text className="text-gray-500 mt-2">Chọn hình ảnh (có thể chọn nhiều)</Text>
                        </TouchableOpacity>

                        {/* Image Preview */}
                        {selectedImages.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="mt-4"
                            >
                                {selectedImages.map((uri, index) => (
                                    <View key={index} className="mr-2 relative">
                                        <Image
                                            source={{ uri }}
                                            className="w-20 h-20 rounded-lg"
                                        />
                                        <TouchableOpacity
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                            onPress={() => {
                                                setSelectedImages(images =>
                                                    images.filter((_, i) => i !== index)
                                                );
                                            }}
                                        >
                                            <Ionicons name="close" size={12} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-blue-600 p-4 rounded-lg items-center mb-8"
                        onPress={handleSubmit}
                    >
                        <Text className="text-white text-lg font-bold">Tạo sự kiện</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CreateEvent;
