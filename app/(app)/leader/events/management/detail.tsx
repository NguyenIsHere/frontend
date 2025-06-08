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
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type EventStatus = 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã hoàn thành' | 'Khóa';

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
    images: string[];
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
            const response = await eventApi.getEventById(eventId);

            if (!response?.data?.data) {
                throw new Error('No event data received from API');
            }

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
            <ScrollView className="flex-1">                {/* Event Image */}
                <View className="relative">
                    {event.images && event.images.length > 0 ? (
                        <>
                            <FlatList
                                ref={flatListRef}
                                data={event.images}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                decelerationRate="fast"
                                snapToInterval={screenWidth}
                                snapToAlignment="center"
                                keyExtractor={(_, index) => `image-${index}`}
                                onScroll={(e) => {
                                    const contentOffset = e.nativeEvent.contentOffset;
                                    const viewSize = e.nativeEvent.layoutMeasurement;
                                    const index = Math.floor(contentOffset.x / viewSize.width);
                                    setCurrentImageIndex(index);
                                }}
                                scrollEventThrottle={16}
                                renderItem={({ item: image }) => (
                                    <View className="w-full aspect-square">
                                        <Image
                                            source={{ uri: image }}
                                            className="w-full h-full"
                                            style={{ resizeMode: 'cover' }}
                                        />
                                    </View>
                                )}
                            />

                            {/* Image number indicator */}
                            {event.images.length > 1 && (
                                <View className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded-full">
                                    <Text className="text-white text-xs font-medium">
                                        {currentImageIndex + 1}/{event.images.length}
                                    </Text>
                                </View>
                            )}

                            {/* Image pagination indicators */}
                            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
                                {event.images.map((_, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            setCurrentImageIndex(index);
                                            flatListRef.current?.scrollToIndex({
                                                index: index,
                                                animated: true
                                            });
                                        }}
                                        className="px-1 py-2"
                                    >
                                        <View
                                            className={`h-2 rounded-full mx-1 ${currentImageIndex === index ? 'w-4 bg-blue-500' : 'w-2 bg-white opacity-70'}`}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View className="w-full aspect-square bg-gray-100 items-center justify-center">
                            <Ionicons name="images-outline" size={48} color="#9ca3af" />
                            <Text className="text-gray-400 mt-2">Chưa có hình ảnh</Text>
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
        </SafeAreaView>
    );
};

export default EventDetail;
