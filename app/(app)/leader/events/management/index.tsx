import { eventApi } from '@/api';
import { EventsContext } from '@/context/EventsContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Component for date and time picker
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

// Define the event type
type Event = {
    _id: string;
    id: string;
    name: string;
    title: string;
    description?: string;
    time: string;
    startedAt: string;
    location: string;
    status: string;
    scope: string;
    chapterId?: {
        _id: string;
        name: string;
    };
    images?: Array<{
        public_id: string;
        url: string;
    }>;
};

// Type guard function to check if an object is an Event
function isEvent(event: Event | null): event is Event {
    return event !== null;
}

const ManagementEventList = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('Tất cả');
    const [selectedScope, setSelectedScope] = useState('Tất cả');
    const { shouldRefresh, setShouldRefresh } = useContext(EventsContext);

    // Edit modal states
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedLocation, setEditedLocation] = useState('');
    const [editedStartedAt, setEditedStartedAt] = useState<Date>(new Date());
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const fetchEvents = async () => {
        try {
            setError(null);
            setLoading(true);

            const response = await eventApi.getEvents({
                page: 1,
                limit: 20
            });

            if (response?.data?.data?.docs) {
                const eventDocs = response.data.data.docs;
                const processedEvents = eventDocs
                    .map((event: Record<string, any>): Event | null => {
                        if (!event?._id) {
                            console.warn('Invalid event data:', event);
                            return null;
                        }

                        return {
                            _id: event._id,
                            id: event._id,
                            name: event.name || 'Sự kiện chưa có tên',
                            title: event.name || 'Sự kiện chưa có tên',
                            description: event.description,
                            time: event.startedAt ? new Date(event.startedAt).toLocaleString('vi-VN') : 'Chưa cập nhật',
                            startedAt: event.startedAt || new Date().toISOString(),
                            location: event.location || 'Chưa cập nhật',
                            status: event.status || 'pending',
                            scope: event.scope === 'chapter' ? 'Chi đoàn' : 'Công khai',
                            chapterId: event.chapterId ? {
                                _id: event.chapterId._id || event.chapterId,
                                name: event.chapterId.name || 'Chi đoàn'
                            } : undefined,
                            images: Array.isArray(event.images) ? event.images : undefined
                        };
                    })
                    .filter(isEvent);

                setEvents(processedEvents);
            } else {
                console.warn('No events data in response:', response);
                setEvents([]);
            }
        } catch (error: any) {
            console.error('Error fetching events:', error);
            setError(error.response?.data?.message || 'Không thể tải danh sách sự kiện');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [shouldRefresh]); const handleUpdateEvent = async () => {
        if (!selectedEventId) return;

        try {
            setUploading(true);

            // Create form data
            const formData = new FormData();
            formData.append('name', editedName);
            formData.append('title', editedName);
            formData.append('description', editedDescription);
            formData.append('location', editedLocation);
            formData.append('startedAt', editedStartedAt.toISOString());
            formData.append('scope', 'chapter');

            // Handle existing images
            const existingImages = selectedImages.filter(url => url.includes('QLDV/images/'));
            if (existingImages.length > 0) {
                // Extract the image IDs from URLs and only send those that should be kept
                const keepImages = existingImages
                    .map(url => {
                        const parts = url.split('/');
                        const filename = parts[parts.length - 1];
                        return filename.split('.')[0]; // Get the ID without extension
                    })
                    .filter(Boolean);

                if (keepImages.length > 0) {
                    formData.append('keepImages', JSON.stringify(keepImages));
                }
            }

            // Add new local images if any
            const newImages = selectedImages.filter(url => !url.includes('QLDV/images/'));
            newImages.forEach((imageUri, index) => {
                formData.append('images', {
                    uri: imageUri,
                    type: 'image/jpeg',
                    name: `image_${index}.jpg`
                } as any);
            });

            console.log('Updating event:', selectedEventId, 'with form data:',
                JSON.stringify({
                    name: editedName,
                    description: editedDescription,
                    location: editedLocation,
                    startedAt: editedStartedAt.toISOString(),
                    keepImages: formData.get('keepImages'),
                    newImagesCount: newImages.length
                })
            );

            const response = await eventApi.updateEvent(selectedEventId, formData);
            console.log('Update response:', response);

            if (response?.data?.success) {
                await fetchEvents(); // Directly fetch events instead of relying on context refresh
                setEditModalVisible(false);
                Alert.alert('Thành công', 'Cập nhật sự kiện thành công');
            } else {
                throw new Error(response?.data?.message || 'Không thể cập nhật sự kiện');
            }
        } catch (error: any) {
            console.error('Error updating event:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể cập nhật sự kiện. Vui lòng thử lại.',
                [{ text: 'Đóng' }]
            );
        } finally {
            setUploading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'Tất cả' || event.status === selectedStatus;
        const matchesScope = selectedScope === 'Tất cả' || event.scope === selectedScope;
        return matchesSearch && matchesStatus && matchesScope;
    });

    const handleDeleteEvent = async (eventId: string) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa sự kiện này không?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await eventApi.deleteEvent(eventId);
                            setShouldRefresh(!shouldRefresh); // This will trigger a list refresh
                            Alert.alert('Thành công', 'Xóa sự kiện thành công');
                        } catch (error: any) {
                            console.error('Error deleting event:', error);
                            Alert.alert(
                                'Lỗi',
                                error.response?.data?.message || 'Không thể xóa sự kiện. Vui lòng thử lại.',
                                [{ text: 'Đóng' }]
                            );
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleOpenEditModal = async (eventId: string) => {
        try {
            const response = await eventApi.getEventById(eventId);
            const event = response?.data?.data;

            if (!event) {
                throw new Error('Không tìm thấy thông tin sự kiện');
            }

            setSelectedEventId(eventId);
            setEditedName(event.name);
            setEditedDescription(event.description || '');
            setEditedLocation(event.location);
            setEditedStartedAt(new Date(event.startedAt));
            setSelectedImages(event.images.map((img: { url: string }) => img.url));
            setEditModalVisible(true);

        } catch (error: any) {
            console.error('Error fetching event detail:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin sự kiện');
        }
    };

    const handleCloseEditModal = () => {
        setEditModalVisible(false);
        setSelectedEventId(null);
        setEditedName('');
        setEditedDescription('');
        setEditedLocation('');
        setEditedStartedAt(new Date());
        setSelectedImages([]);
    }; const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets.length > 0) {
                // Get the URIs of newly selected images 
                const newImages = result.assets.map(asset => asset.uri);

                // Combine with existing images
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

    const renderEventItem = ({ item }: { item: Event }) => (
        <TouchableOpacity
            className="bg-white p-4 mb-2 rounded-lg"
            onPress={() =>
                router.push({
                    pathname: '/(app)/leader/events/management/detail',
                    params: { eventId: item.id },
                })
            }
        >
            <View className="flex-1">
                <Text className="font-bold text-base">{item.title}</Text>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.time}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.location}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.status}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.scope}</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-end mt-3 border-t border-gray-100 pt-3">
                <TouchableOpacity
                    className="flex-row items-center bg-blue-100 px-3 py-1.5 rounded-lg mr-2"
                    onPress={() => handleOpenEditModal(item.id)}
                >
                    <Ionicons name="pencil-outline" size={16} color="#2563eb" />
                    <Text className="text-blue-600 ml-1">Chỉnh sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-row items-center bg-red-100 px-3 py-1.5 rounded-lg"
                    onPress={() => {
                        Alert.alert(
                            "Xác nhận xóa",
                            "Bạn có chắc chắn muốn xóa sự kiện này không?",
                            [
                                { text: "Hủy", style: "cancel" },
                                { text: "Xóa", style: "destructive", onPress: () => handleDeleteEvent(item.id) }
                            ]
                        );
                    }}
                >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text className="text-red-600 ml-1">Xóa</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const NoEventsMessage = () => (
        <View className="flex-1 justify-center items-center py-8">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-base">Chưa có sự kiện nào</Text>
            <Text className="text-gray-400 mt-1 text-sm">Nhấn vào nút + để tạo sự kiện mới</Text>
        </View>
    );

    const renderEventList = () => {
        if (loading) {
            return (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-2 text-gray-600">Đang tải sự kiện...</Text>
                </View>
            );
        }

        if (events.length === 0) {
            return <NoEventsMessage />;
        }

        if (filteredEvents.length === 0) {
            return (
                <View className="flex-1 justify-center items-center py-8">
                    <Text className="text-gray-500">Không tìm thấy sự kiện nào phù hợp</Text>
                </View>
            );
        }

        return (
            <FlatList
                className="px-4"
                data={filteredEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
            />
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View className="bg-blue-600 p-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Danh sách sự kiện</Text>
                <TouchableOpacity
                    onPress={() => router.push('/(app)/leader/events/management/create')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Search and filter bar */}
            <View className="p-4">
                <View className="flex-row items-center mb-2">
                    <View className="flex-1 mr-2">
                        <TextInput
                            className="border border-gray-300 p-3 rounded-lg bg-white"
                            placeholder="Tìm kiếm sự kiện"
                            placeholderTextColor="#6B7280"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        className="bg-gray-200 p-3 rounded-lg"
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <Ionicons name="filter" size={24} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                {/* Active filters */}
                {(selectedStatus !== 'Tất cả' || selectedScope !== 'Tất cả') && (
                    <View className="flex-row flex-wrap">
                        {selectedStatus !== 'Tất cả' && (
                            <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                                <Text className="text-blue-800 mr-1">Trạng thái: {selectedStatus}</Text>
                                <TouchableOpacity onPress={() => setSelectedStatus('Tất cả')}>
                                    <Ionicons name="close-circle" size={16} color="#1e40af" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {selectedScope !== 'Tất cả' && (
                            <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                                <Text className="text-blue-800 mr-1">Phạm vi: {selectedScope}</Text>
                                <TouchableOpacity onPress={() => setSelectedScope('Tất cả')}>
                                    <Ionicons name="close-circle" size={16} color="#1e40af" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {renderEventList()}

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-white rounded-t-2xl">
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-xl font-bold">Bộ lọc</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                    <Ionicons name="close-outline" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>

                            {/* Status filter */}
                            <View className="mt-4">
                                <Text className="font-bold text-gray-900 mb-2">Trạng thái</Text>
                                <View className="flex-row flex-wrap -mx-1">
                                    {['Tất cả', 'Sắp diễn ra', 'Đang diễn ra', 'Đã kết thúc', 'Đã hủy'].map(
                                        (status) => (
                                            <TouchableOpacity
                                                key={status}
                                                className={`m-1 rounded-full px-3 py-1 ${selectedStatus === status
                                                    ? 'bg-blue-600'
                                                    : 'bg-gray-200'
                                                    }`}
                                                onPress={() => setSelectedStatus(status)}
                                            >
                                                <Text
                                                    className={
                                                        selectedStatus === status
                                                            ? 'text-white'
                                                            : 'text-gray-800'
                                                    }
                                                >
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    )}
                                </View>
                            </View>

                            {/* Scope filter */}
                            <View className="mt-4">
                                <Text className="font-bold text-gray-900 mb-2">Phạm vi</Text>
                                <View className="flex-row flex-wrap -mx-1">
                                    {['Tất cả', 'Chi đoàn', 'Công khai'].map((scope) => (
                                        <TouchableOpacity
                                            key={scope}
                                            className={`m-1 rounded-full px-3 py-1 ${selectedScope === scope
                                                ? 'bg-blue-600'
                                                : 'bg-gray-200'
                                                }`}
                                            onPress={() => setSelectedScope(scope)}
                                        >
                                            <Text
                                                className={
                                                    selectedScope === scope
                                                        ? 'text-white'
                                                        : 'text-gray-800'
                                                }
                                            >
                                                {scope}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseEditModal}
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
                                    <TouchableOpacity onPress={handleCloseEditModal}>
                                        <Ionicons name="close-outline" size={24} color="#000" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Modal Content */}
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
                                        value={editedName}
                                        onChangeText={setEditedName}
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
                                        value={editedLocation}
                                        onChangeText={setEditedLocation}
                                    />
                                </View>

                                {/* Thời gian bắt đầu */}
                                <DateTimePickerField
                                    label="Thời gian bắt đầu *"
                                    dateValue={editedStartedAt}
                                    onDateChange={(_, date) => date && setEditedStartedAt(date)}
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
                                        value={editedDescription}
                                        onChangeText={setEditedDescription}
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
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
                                            {selectedImages.map((uri, index) => (
                                                <View key={index} className="mr-2 relative">
                                                    <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
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
                                    onPress={handleUpdateEvent}
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
        </SafeAreaView>
    );
};

export default ManagementEventList;
