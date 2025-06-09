import { eventApi } from '@/api';
import EditEventModal from '@/components/EditEventModal';
import { EventsContext } from '@/context/EventsContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface EventImage {
    url: string;
    public_id: string;
}

interface Event {
    _id: string;
    name: string;
    description: string;
    location: string;
    startedAt: string;
    endedAt?: string;
    images: EventImage[];
    scope: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

type EventStatus = 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã hoàn thành' | 'Khóa';

const getStatusColor = (status: EventStatus) => {
    switch (status) {
        case 'Sắp diễn ra':
            return 'bg-yellow-500';
        case 'Đang diễn ra':
            return 'bg-green-500';
        case 'Đã hoàn thành':
            return 'bg-blue-500';
        case 'Khóa':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

const formatEventTime = (startedAt: string, endedAt?: string) => {
    const startDate = new Date(startedAt);
    const startFormatted = startDate.toLocaleString('vi-VN');

    if (!endedAt) return startFormatted;

    const endDate = new Date(endedAt);
    const endFormatted = endDate.toLocaleString('vi-VN');
    return `${startFormatted} - ${endFormatted}`;
};

const EventDetail = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const eventId = params.eventId as string;
    const { setShouldRefresh } = useContext(EventsContext);

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<Event | null>(null);
    const [currentStatus, setCurrentStatus] = useState<EventStatus>('Sắp diễn ra');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [uploading, setUploading] = useState(false);

    const flatListRef = React.useRef<FlatList>(null);
    const screenWidth = Dimensions.get('window').width;

    const statuses: EventStatus[] = [
        'Sắp diễn ra',
        'Đang diễn ra',
        'Đã hoàn thành',
        'Khóa'
    ];

    useEffect(() => {
        if (!eventId) {
            Alert.alert('Lỗi', 'Không tìm thấy mã sự kiện');
            router.back();
            return;
        }
        fetchEventDetail();
    }, [eventId]);

    const fetchEventDetail = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getEventById(eventId);

            if (!response?.data?.data) {
                throw new Error('Không tìm thấy thông tin sự kiện');
            }

            setEvent(response.data.data);
            mapEventStatusToUI(response.data.data.status || 'pending');

        } catch (error: any) {
            console.error('Error fetching event detail:', error);
            Alert.alert(
                'Lỗi',
                'Không thể tải thông tin sự kiện. Vui lòng thử lại sau.'
            );
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const mapEventStatusToUI = (apiStatus: string) => {
        switch (apiStatus) {
            case 'upcoming':
                setCurrentStatus('Sắp diễn ra');
                break;
            case 'ongoing':
                setCurrentStatus('Đang diễn ra');
                break;
            case 'completed':
                setCurrentStatus('Đã hoàn thành');
                break;
            case 'cancelled':
                setCurrentStatus('Khóa');
                break;
            default:
                setCurrentStatus('Sắp diễn ra');
        }
    };

    const handleUpdate = async (formData: FormData) => {
        if (!event) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin sự kiện');
            return;
        }

        try {
            setUploading(true);

            const response = await eventApi.updateEvent(event._id, formData);

            if (response?.data?.success) {
                Alert.alert('Thành công', 'Đã cập nhật sự kiện');
                setIsEditModalVisible(false);
                await fetchEventDetail(); // Refresh event data
            } else {
                throw new Error(response?.data?.message || 'Không thể cập nhật sự kiện');
            }
        } catch (error: any) {
            console.error('Error updating event:', error);
            Alert.alert(
                'Lỗi',
                error.message || 'Không thể cập nhật sự kiện. Vui lòng thử lại.'
            );
        } finally {
            setUploading(false);
        }
    };

    const openImageViewer = (index: number) => {
        setCurrentImageIndex(index);
        setIsImageViewerOpen(true);
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar barStyle="light-content" />
                <View className="bg-blue-600 p-4">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            className="bg-white/20 rounded-full p-2"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={22} color="white" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-white text-xl font-bold text-center">
                                Chi tiết sự kiện
                            </Text>
                            <Text className="text-white text-xs text-center">
                                Đoàn Thanh niên - Hội Sinh viên
                            </Text>
                        </View>
                        <View className="w-[30px]" />
                    </View>
                </View>
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar barStyle="light-content" />
                <View className="bg-blue-600 p-4">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            className="bg-white/20 rounded-full p-2"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={22} color="white" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-white text-xl font-bold text-center">
                                Chi tiết sự kiện
                            </Text>
                            <Text className="text-white text-xs text-center">
                                Đoàn Thanh niên - Hội Sinh viên
                            </Text>
                        </View>
                        <View className="w-[30px]" />
                    </View>
                </View>
                <View className="flex-1 justify-center items-center p-4">
                    <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
                    <Text className="text-gray-600 mt-4 text-center">
                        Không tìm thấy thông tin sự kiện. Vui lòng thử lại sau.
                    </Text>
                    <TouchableOpacity
                        className="mt-4 bg-blue-600 px-6 py-2 rounded-lg"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-medium">Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View className="bg-blue-600 p-4">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-white/20 rounded-full p-2"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>

                    <View>
                        <Text className="text-white text-xl font-bold text-center">
                            Chi tiết sự kiện
                        </Text>
                        <Text className="text-white text-xs text-center">
                            Đoàn Thanh niên - Hội Sinh viên
                        </Text>
                    </View>

                    <View className="w-[30px]" />
                </View>
            </View>

            {/* Content */}
            <ScrollView className="flex-1">
                {/* Event Image */}
                <View className="relative">
                    {/* Image Slider */}
                    {event?.images && Array.isArray(event.images) && event.images.length > 0 && (
                        <View className="w-full h-72 bg-gray-100">
                            <FlatList
                                ref={flatListRef}
                                data={event.images}
                                keyExtractor={(item, index) => index.toString()}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const newIndex = Math.floor(
                                        e.nativeEvent.contentOffset.x / screenWidth
                                    );
                                    setCurrentImageIndex(newIndex);
                                }}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => openImageViewer(index)}
                                    >
                                        <Image
                                            source={{ uri: item.url }}
                                            className="w-screen h-72"
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                            />
                            {/* Pagination dots */}
                            {event.images.length > 1 && (
                                <View className="absolute bottom-4 flex-row justify-center w-full">
                                    {event.images.map((_, index) => (
                                        <View
                                            key={index}
                                            className={`w-2 h-2 rounded-full mx-1 ${currentImageIndex === index
                                                ? 'bg-white'
                                                : 'bg-white/50'
                                                }`}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Status Badge */}
                    <TouchableOpacity
                        className={`absolute top-4 right-4 px-4 py-2 rounded-full ${getStatusColor(currentStatus)} shadow-sm`}
                        onPress={() => setIsStatusModalOpen(true)}
                    >
                        <Text className="text-white font-semibold text-base">
                            {currentStatus}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="px-5 pt-6">
                    {/* Title */}
                    <Text className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                        {event.name}
                    </Text>

                    {/* Time and Location */}
                    <View className="space-y-3 mb-6">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                            </View>
                            <Text className="ml-3 text-base text-gray-700">
                                {formatEventTime(event.startedAt, event.endedAt)}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                                <Ionicons name="location-outline" size={20} color="#3b82f6" />
                            </View>
                            <Text className="ml-3 text-base text-gray-700 flex-1">
                                {event.location}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                                <Ionicons name="people-outline" size={20} color="#3b82f6" />
                            </View>
                            <Text className="ml-3 text-base text-gray-700">
                                {event.scope}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-bold text-gray-900 mb-3">
                            Mô tả
                        </Text>
                        <Text className="text-base text-gray-700 leading-relaxed">
                            {event.description || 'Chưa có mô tả'}
                        </Text>
                    </View>

                    {/* Creation Info */}
                    <View className="mb-8 bg-gray-50 rounded-lg p-4">
                        <Text className="text-sm text-gray-500">
                            Tạo ngày {formatDateTime(event.createdAt)}
                        </Text>
                        <Text className="text-sm text-gray-500">
                            Cập nhật lần cuối {formatDateTime(event.updatedAt)}
                        </Text>
                    </View>

                    {/* Edit Button */}
                    <View className="px-5 pb-6">
                        <TouchableOpacity
                            onPress={() => setIsEditModalVisible(true)}
                            className="w-full bg-blue-600 rounded-lg py-3 flex-row items-center justify-center"
                        >
                            <Ionicons name="pencil-outline" size={20} color="white" className="mr-2" />
                            <Text className="text-white text-base font-semibold">
                                Chỉnh sửa sự kiện
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Status Modal */}
            {isStatusModalOpen && (
                <View className="absolute inset-0 z-50 bg-black bg-opacity-50 items-center justify-center">
                    <View className="bg-white rounded-lg w-4/5 p-4">
                        <Text className="text-lg font-bold mb-4 text-center">
                            Cập nhật trạng thái
                        </Text>
                        {statuses.map((status, index) => (
                            <TouchableOpacity
                                key={index}
                                className={`p-3 mb-2 rounded-lg ${currentStatus === status ? 'bg-blue-100 border border-blue-500' : ''}`}
                                onPress={() => {
                                    setCurrentStatus(status);
                                    setIsStatusModalOpen(false);
                                }}
                            >
                                <Text className={`${currentStatus === status ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            className="mt-2 p-3 rounded-lg bg-gray-100"
                            onPress={() => setIsStatusModalOpen(false)}
                        >
                            <Text className="text-center font-bold">Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Edit Modal */}
            <EditEventModal
                isVisible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                onSubmit={handleUpdate}
                initialData={{
                    name: event.name,
                    description: event.description || '',
                    location: event.location,
                    startedAt: new Date(event.startedAt),
                    images: event.images
                }}
            />

            {/* Image Viewer Modal */}
            <Modal
                visible={isImageViewerOpen}
                transparent={true}
                onRequestClose={() => setIsImageViewerOpen(false)}
            >
                <View className="flex-1 bg-black">
                    <SafeAreaView className="flex-1">
                        <View className="flex-row justify-between items-center p-4">
                            <TouchableOpacity
                                onPress={() => setIsImageViewerOpen(false)}
                                className="bg-white/20 rounded-full p-2"
                            >
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white text-base">
                                {currentImageIndex + 1}/{event?.images?.length}
                            </Text>
                            <View className="w-[40px]" />
                        </View>

                        <FlatList
                            data={event?.images}
                            keyExtractor={(_, index) => index.toString()}
                            horizontal
                            pagingEnabled
                            initialScrollIndex={currentImageIndex}
                            getItemLayout={(_, index) => ({
                                length: screenWidth,
                                offset: screenWidth * index,
                                index,
                            })}
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => {
                                const newIndex = Math.floor(
                                    e.nativeEvent.contentOffset.x / screenWidth
                                );
                                setCurrentImageIndex(newIndex);
                            }} renderItem={({ item }) => (
                                <View className="w-screen h-full justify-center">
                                    <Image
                                        source={{ uri: item.url }}
                                        className="w-full h-3/4"
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default EventDetail;
