import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CloudinaryImage {
    url: string;
    public_id: string;
}

interface EditEventModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void; event: {
        _id: string;
        name: string;
        description: string;
        location: string;
        startedAt: string;
        images: CloudinaryImage[];
    };
}

const EditEventModal: React.FC<EditEventModalProps> = ({
    isVisible,
    onClose,
    onSuccess,
    event,
}) => {
    const [name, setName] = useState(event?.name || '');
    const [description, setDescription] = useState(event?.description || '');
    const [location, setLocation] = useState(event?.location || '');
    const [startedAt, setStartedAt] = useState(new Date(event?.startedAt || Date.now()));
    const [selectedImages, setSelectedImages] = useState<CloudinaryImage[]>(event?.images || []);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets.length > 0) {
                const newImages = result.assets.map(asset => ({
                    url: asset.uri,
                    public_id: '', // New images don't have public_id yet
                }));

                setSelectedImages(prevImages => {
                    const combined = [...prevImages, ...newImages];
                    if (combined.length > 10) {
                        Alert.alert('Thông báo', 'Bạn chỉ có thể tải lên tối đa 10 ảnh');
                        return combined.slice(0, 10);
                    }
                    return combined;
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        }
    };

    const handleSubmit = async () => {
        try {
            setUploading(true);

            // Validate required fields
            if (!name || !location || !startedAt) {
                Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }

            const formData = new FormData();

            // Basic event info
            formData.append('name', name);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('startedAt', startedAt.toISOString());

            // Handle existing images
            const imagesToKeep = selectedImages.filter(img => img.public_id).map(img => img.public_id);
            formData.append('keepImages', JSON.stringify(imagesToKeep));

            // Handle new images
            selectedImages
                .filter(img => !img.public_id) // Only include images without public_id (new ones)
                .forEach((img, index) => {
                    const uri = img.url;
                    const filename = uri.split('/').pop() || `image-${index}.jpg`;
                    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
                    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

                    formData.append('images', {
                        uri,
                        type: mimeType,
                        name: filename,
                    } as any);
                });

            await eventApi.updateEvent(event._id, formData);
            onSuccess();

        } catch (error: any) {
            console.error('Error in EditEventModal:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật sự kiện. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 mt-20"
                >
                    <View className="flex-1 bg-white rounded-t-2xl">
                        {/* Modal Header */}
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-xl font-bold">Chỉnh sửa sự kiện</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close-outline" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Modal Content */}
                        <ScrollView className="flex-1 p-4">
                            {/* Name */}
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

                            {/* Description */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="document-text-outline" size={20} color="#000" />
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

                            {/* Location */}
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

                            {/* Date and Time */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="calendar-outline" size={20} color="#000" />
                                    <Text className="text-lg font-bold ml-2 text-gray-900">Thời gian *</Text>
                                </View>
                                <TouchableOpacity
                                    className="border border-gray-300 p-3 rounded-lg bg-white flex-row justify-between items-center"
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text className="text-gray-900">
                                        {`${startedAt.getFullYear()}-${(startedAt.getMonth() + 1)
                                            .toString()
                                            .padStart(2, '0')}-${startedAt
                                                .getDate()
                                                .toString()
                                                .padStart(2, '0')} ${startedAt
                                                    .getHours()
                                                    .toString()
                                                    .padStart(2, '0')}:${startedAt
                                                        .getMinutes()
                                                        .toString()
                                                        .padStart(2, '0')}`}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#000" />
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={startedAt}
                                        mode="datetime"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(Platform.OS === 'ios');
                                            if (selectedDate) {
                                                setStartedAt(selectedDate);
                                            }
                                        }}
                                    />
                                )}
                            </View>

                            {/* Images */}
                            <View className="mb-4">
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
                                        {selectedImages.map((img, index) => (
                                            <View key={index} className="mr-2 relative">
                                                <Image
                                                    source={{ uri: img.url }}
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
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-lg font-bold">Lưu thay đổi</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default EditEventModal;
