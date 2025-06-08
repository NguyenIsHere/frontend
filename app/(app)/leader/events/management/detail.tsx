import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

// Định nghĩa API URL
const API_URL = 'https://be-qldv.onrender.com';

type EventStatus = 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã hoàn thành' | 'Khóa';

// Định nghĩa kiểu cho object ảnh
interface CloudinaryImage {
    public_id: string;
    url: string;
}

interface APIEvent {
    _id: string;
    name: string;
    description: string;
    location: string;
    startedAt: string;
    endedAt: string;
    requirements: string;
    status: 'pending' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    scope: string;
    participants: string;
    images: CloudinaryImage[];
    createdAt: string;
    updatedAt: string;
}

const EventDetail = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const eventId = params.eventId as string;

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<APIEvent | null>(null);
    const [currentStatus, setCurrentStatus] = useState<EventStatus>('Sắp diễn ra');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const flatListRef = React.useRef<FlatList>(null);
    const screenWidth = Dimensions.get('window').width;

    const statuses = [
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
        if (!eventId) {
            Alert.alert('Lỗi', 'Không tìm thấy mã sự kiện');
            router.back();
            return;
        } try {
            setLoading(true);
            const response = await eventApi.getEventById(eventId); if (!response?.data?.data) {
                throw new Error('No event data received from API');
            }

            // Log the event data for debugging
            console.log('Event data received:', response.data.data);
            console.log('Images received:', response.data.data.images);

            setEvent(response.data.data);
            mapEventStatusToUI(response.data.data.status || 'pending');

        } catch (error: any) {
            console.error('Error fetching event detail:', {
                message: error.message,
                stack: error.stack
            });
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

    const formatEventTime = (startTime?: string, endTime?: string) => {
        if (!startTime) return 'Chưa cập nhật';

        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr);
            return date.toLocaleString('vi-VN', {
                hour: 'numeric',
                minute: 'numeric',
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
        };

        const formattedStart = formatDate(startTime);
        if (endTime) {
            return `${formattedStart} - ${formatDate(endTime)}`;
        }
        return formattedStart;
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const getStatusColor = (status: EventStatus): string => {
        switch (status) {
            case 'Sắp diễn ra': return 'bg-blue-500';
            case 'Đang diễn ra': return 'bg-green-500';
            case 'Đã hoàn thành': return 'bg-purple-500';
            case 'Khóa': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const openImageViewer = (index: number) => {
        setSelectedImageIndex(index);
        setIsImageViewerOpen(true);
    }; const getFullImageUrl = (imagePath: string | undefined) => {
        if (!imagePath || typeof imagePath !== 'string') {
            console.warn('Invalid image path:', imagePath);
            return '';
        }
        try {
            // Log for debugging
            console.log('Processing image path:', imagePath);

            // Nếu là URL đầy đủ, trả về trực tiếp
            if (imagePath.startsWith('http')) return imagePath;

            // Nếu là đường dẫn tương đối, ghép với API_URL
            const fullUrl = `${API_URL}${imagePath}`;
            console.log('Full image URL:', fullUrl);
            return fullUrl;
        } catch (error) {
            console.error('Error processing image URL:', error);
            return '';
        }
    };

    const getImageUrl = (image: CloudinaryImage | undefined) => {
        if (!image || typeof image !== 'object') {
            console.warn('Invalid image object:', image);
            return '';
        }
        return image.url || '';
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
                        <View className="w-full h-64 bg-gray-100">
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
                                            className="w-screen h-64"
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

                    {/* Status */}
                    <TouchableOpacity
                        className={`absolute bottom-4 right-4 px-3 py-1 rounded-full ${getStatusColor(currentStatus)}`}
                        onPress={() => setIsStatusModalOpen(true)}
                    >
                        <Text className="text-white font-medium text-sm">
                            {currentStatus}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Status change modal */}
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
                                        setCurrentStatus(status as EventStatus);
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

                {/* Title */}
                <View className="px-4 pt-4">
                    <Text className="text-gray-900 text-2xl font-bold">
                        {event.name}
                    </Text>

                    {/* Creation/Update dates */}
                    <View className="flex-row mt-1 mb-3">
                        <Text className="text-gray-500 text-xs">
                            Tạo ngày {formatDateTime(event.createdAt)} • Cập nhật {formatDateTime(event.updatedAt)}
                        </Text>
                    </View>
                </View>

                {/* Event Details */}
                <View className="px-4">
                    {/* Time and Location */}
                    <View className="mt-1 mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-xs">
                                {formatEventTime(event.startedAt, event.endedAt)}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-xs">
                                {event.location}
                            </Text>
                        </View>
                    </View>

                    {/* Scope */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="people-outline" size={20} color="#3b82f6" />
                            <Text className="text-lg font-bold ml-2 text-blue-600">
                                Phạm vi
                            </Text>
                        </View>
                        <Text className="text-gray-900 leading-6">
                            {event.scope}
                        </Text>
                    </View>

                    {/* Participants */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="people-circle-outline" size={20} color="#3b82f6" />
                            <Text className="text-lg font-bold ml-2 text-blue-600">
                                Người tham gia
                            </Text>
                        </View>
                        <Text className="text-gray-900 leading-6">
                            {event.participants || 'Chưa cập nhật'}
                        </Text>
                    </View>

                    {/* Requirements */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="list-outline" size={20} color="#3b82f6" />
                            <Text className="text-lg font-bold ml-2 text-blue-600">
                                Yêu cầu
                            </Text>
                        </View>
                        <Text className="text-gray-900 leading-6">
                            {event.requirements || 'Không có yêu cầu'}
                        </Text>
                    </View>

                    {/* Description */}
                    <View className="bg-white rounded-lg p-4 mb-8 border border-gray-300">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                            <Text className="text-lg font-bold ml-2 text-blue-600">
                                Mô tả
                            </Text>
                        </View>
                        <Text className="text-gray-900 leading-6">
                            {event.description}
                        </Text>
                    </View>
                </View>
            </ScrollView>

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
                                {selectedImageIndex + 1}/{event?.images?.length}
                            </Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <FlatList
                            data={event?.images}
                            keyExtractor={(_, index) => index.toString()}
                            horizontal
                            pagingEnabled
                            initialScrollIndex={selectedImageIndex}
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
                                setSelectedImageIndex(newIndex);
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
