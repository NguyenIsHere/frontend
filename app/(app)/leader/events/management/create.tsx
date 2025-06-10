import { eventApi } from '@/api';
import CustomDropdown from '@/components/CustomDropdown';
import { EventsContext } from '@/context/EventsContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
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
    const { setShouldRefresh } = useContext(EventsContext);
    const scrollViewRef = useRef<ScrollView>(null);

    // Event fields - chỉ giữ các trường cần thiết
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [location, setLocation] = useState('');
    const [startedAt, setStartedAt] = useState(new Date());    // Status selection
    const [status, setStatus] = useState('pending');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    // Status options
    const statusOptions = [
        { label: 'Sắp diễn ra', value: 'pending' },
        { label: 'Đang diễn ra', value: 'doing' },
        { label: 'Hoàn thành', value: 'completed' },
        { label: 'Đã hủy', value: 'canceled' }
    ]; const handleSubmit = async () => {
        try {
            // Validate required fields
            if (!name.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập tên sự kiện');
                return;
            }

            if (!location.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập địa điểm');
                return;
            }

            if (!startedAt) {
                Alert.alert('Lỗi', 'Vui lòng chọn thời gian bắt đầu');
                return;
            }

            const formData = new FormData();

            // Basic event info
            formData.append('name', name.trim());
            formData.append('description', description.trim() || '');
            formData.append('location', location.trim());
            formData.append('startedAt', startedAt.toISOString());
            formData.append('status', status); // Use the selected status
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
                // Set shouldRefresh to true before navigating back
                setShouldRefresh(true);
                Alert.alert('Thành công', 'Đã tạo sự kiện mới');
                router.back();
            } else {
                const errorMessage = response?.data?.message;
                const validationErrors = response?.data?.errors;

                if (validationErrors) {
                    // Handle specific validation errors
                    const errorMessages = [];
                    for (const field in validationErrors) {
                        if (validationErrors[field]) {
                            errorMessages.push(`${validationErrors[field]}`);
                        }
                    }
                    if (errorMessages.length > 0) {
                        Alert.alert('Lỗi kiểm tra dữ liệu', errorMessages.join('\n'));
                        return;
                    }
                }

                if (errorMessage) {
                    Alert.alert('Lỗi', errorMessage);
                    return;
                }

                throw new Error('Không thể tạo sự kiện');
            }
        } catch (error: any) {
            console.error('Error creating event:', error);

            // Handle specific API error responses
            if (error.response) {
                console.error('Error response:', {
                    status: error.response.status,
                    data: error.response.data
                });

                // Handle specific HTTP status codes                // Get error details from the response
                const errorMessage = error.response?.data?.message;
                const statusCode = error.response.status;

                switch (statusCode) {
                    case 400:
                        Alert.alert('Lỗi', 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.');
                        break;
                    case 401:
                        Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                        break;
                    case 403:
                        Alert.alert('Lỗi', 'Bạn không có quyền thực hiện thao tác này.');
                        break;
                    case 500:
                        Alert.alert(
                            'Lỗi',
                            errorMessage || 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau.'
                        );
                        break;
                    default:
                        Alert.alert(
                            'Lỗi',
                            errorMessage || 'Không thể tạo sự kiện. Vui lòng thử lại.'
                        );
                }
            } else {
                Alert.alert(
                    'Lỗi',
                    error.message || 'Không thể tạo sự kiện. Vui lòng thử lại.'
                );
            }
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
                    </View>                    {/* Thời gian bắt đầu */}
                    <DateTimePickerField
                        label="Thời gian bắt đầu *"
                        dateValue={startedAt}
                        onDateChange={(_, date) => date && setStartedAt(date)}
                    />

                    {/* Trạng thái */}
                    <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="flag-outline" size={20} color="#000" />
                            <Text className="text-lg font-bold ml-2 text-gray-900">Trạng thái</Text>
                        </View>
                        <CustomDropdown
                            options={statusOptions}
                            placeholder="Chọn trạng thái"
                            selectedValue={status}
                            onSelect={setStatus}
                            isOpen={isStatusDropdownOpen}
                            onToggle={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        />
                    </View>

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
