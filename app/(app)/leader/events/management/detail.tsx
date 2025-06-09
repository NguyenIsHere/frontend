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
    NativeScrollEvent,
    NativeSyntheticEvent,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EventImage {
    url: string;
    public_id: string;
}

interface Participant {
    _id: string;
    userId: {
        _id: string;
        avatarUrl?: string;
        fullName: string;
        unionCardNumber?: string;
        position?: string;
        chapterName?: string;
    };
    eventId: string;
    status: 'registered' | 'checked-in';
    createdAt: string;
    updatedAt: string;
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
    isRegistered?: boolean;
    participants?: Participant[];
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
    const [searchQuery, setSearchQuery] = useState('');

    const flatListRef = React.useRef<FlatList>(null);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;

    const statuses: EventStatus[] = [
        'Sắp diễn ra',
        'Đang diễn ra',
        'Đã hoàn thành',
        'Khóa'
    ];

    // Filter participants based on search query
    const filteredParticipants = event?.participants?.filter(participant => {
        if (!participant?.userId) return false;

        const searchLower = searchQuery.toLowerCase();
        const fullName = participant.userId.fullName || '';
        const unionCardNumber = participant.userId.unionCardNumber || '';

        return (
            fullName.toLowerCase().includes(searchLower) ||
            unionCardNumber.toLowerCase().includes(searchLower)
        );
    }) || [];

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
            const [eventResponse, participantsResponse] = await Promise.all([
                eventApi.getEventById(eventId),
                eventApi.getEventParticipants(eventId)
            ]);

            if (!eventResponse?.data?.data) {
                throw new Error('Không tìm thấy thông tin sự kiện');
            }

            console.log('API Response [event]:', eventResponse.data);
            console.log('API Response [participants]:', participantsResponse?.data);

            // Get the event data
            const eventData = eventResponse.data.data;

            // Get and process the participants data
            const rawParticipants = participantsResponse?.data?.data || [];
            const participants = rawParticipants.map((participant: any) => {
                // Handle both nested and direct userId object structures
                const userId = participant.userId || {};
                const userInfo = typeof userId === 'string' ? participant : userId;

                return {
                    _id: participant._id,
                    userId: {
                        _id: userInfo._id || userId,
                        avatarUrl: userInfo.avatar?.url || userInfo.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                        fullName: userInfo.fullname || userInfo.fullName || 'Không có tên',
                        unionCardNumber: userInfo.cardCode || userInfo.unionCardNumber || '',
                        position: userInfo.position || userInfo.chapterPosition || 'Đoàn viên',
                        chapterName: userInfo.chapterId?.name || userInfo.chapterName || ''
                    },
                    eventId: participant.eventId,
                    status: participant.status || 'registered',
                    createdAt: participant.createdAt,
                    updatedAt: participant.updatedAt
                };
            });

            setEvent({
                ...eventData,
                participants
            });

            // Set initial status
            setCurrentStatus(mapApiStatusToUI(eventData.status));
        } catch (error: any) {
            console.error('Error fetching event:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || error.message || 'Không thể tải thông tin sự kiện'
            );
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Event status handlers
    const handleStartEvent = async () => {
        try {
            await eventApi.startEvent(eventId);
            setCurrentStatus('Đang diễn ra');
            Alert.alert('Thành công', 'Đã bắt đầu sự kiện');
            await fetchEventDetail(); // Refresh data
        } catch (error: any) {
            console.error('Error starting event:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể bắt đầu sự kiện'
            );
        }
    };

    const handleEndEvent = async () => {
        try {
            await eventApi.endEvent(eventId);
            setCurrentStatus('Đã hoàn thành');
            Alert.alert('Thành công', 'Đã kết thúc sự kiện');
            await fetchEventDetail(); // Refresh data
        } catch (error: any) {
            console.error('Error ending event:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể kết thúc sự kiện'
            );
        }
    };

    const handleCancelEvent = async () => {
        try {
            await eventApi.cancelEvent(eventId);
            setCurrentStatus('Khóa');
            Alert.alert('Thành công', 'Đã hủy sự kiện');
            await fetchEventDetail(); // Refresh data
        } catch (error: any) {
            console.error('Error canceling event:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể hủy sự kiện'
            );
        }
    };

    const mapApiStatusToUI = (apiStatus: string): EventStatus => {
        switch (apiStatus) {
            case 'pending':
                return 'Sắp diễn ra';
            case 'ongoing':
                return 'Đang diễn ra';
            case 'completed':
                return 'Đã hoàn thành';
            case 'cancelled':
                return 'Khóa';
            default:
                return 'Sắp diễn ra';
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

    // Image handlers
    const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setCurrentImageIndex(roundIndex);
    };

    // Image viewer handlers
    const openImageViewer = (index: number) => {
        setCurrentImageIndex(index);
        setIsImageViewerOpen(true);
    };

    // Add safe access to event properties
    const safeEvent = event || {
        name: '',
        description: '',
        images: [],
        participants: []
    };

    const handleParticipantPress = (participant: Participant) => {
        Alert.alert(
            'Điểm danh',
            `Bạn muốn điểm danh cho ${participant.userId.fullName}?`,
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Điểm danh',
                    onPress: () => handleCheckIn(participant._id)
                }
            ]
        );
    };

    const handleCheckIn = async (participantId: string) => {
        try {
            await eventApi.checkIn(participantId, eventId);
            await fetchEventDetail(); // Refresh data
            Alert.alert('Thành công', 'Đã điểm danh thành công');
        } catch (error: any) {
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể điểm danh'
            );
        }
    };

    // Render participants section
    const renderParticipantsSection = () => {
        if (!safeEvent.participants || safeEvent.participants.length === 0) {
            return (
                <View className="p-4">
                    <Text className="text-gray-500 italic">Chưa có người tham gia</Text>
                </View>
            );
        }

        return (
            <View className="flex-1">
                <TextInput
                    placeholder="Tìm kiếm người tham gia..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="mx-4 my-2 p-2 bg-white rounded-lg border border-gray-300"
                />
                <FlatList
                    data={filteredParticipants}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => {
                        if (!item?.userId) return null;
                        return (
                            <TouchableOpacity
                                className="flex-row items-center p-4 border-b border-gray-200 bg-white"
                                onPress={() => handleParticipantPress(item)}
                            >
                                <Image
                                    source={{
                                        uri: item.userId.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                                    }}
                                    className="w-12 h-12 rounded-full"
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="font-semibold">{item.userId.fullName}</Text>
                                    {item.userId.unionCardNumber && (
                                        <Text className="text-gray-500">Mã đoàn viên: {item.userId.unionCardNumber}</Text>
                                    )}
                                    {item.userId.chapterName && (
                                        <Text className="text-gray-500">{item.userId.chapterName}</Text>
                                    )}
                                </View>
                                <View className={`px-2 py-1 rounded ${item.status === 'checked-in' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                    <Text className="text-white text-sm">
                                        {item.status === 'checked-in' ? 'Đã điểm danh' : 'Đã đăng ký'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={() => (
                        <View className="py-8 items-center">
                            <Text className="text-gray-500 italic">
                                Không tìm thấy người tham gia nào
                            </Text>
                        </View>
                    )}
                />
            </View>
        );
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

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</Text>
                </View>
            ) : event ? (
                <View className="flex-1">
                    {/* Event Content */}
                    <ScrollView className="flex-1">
                        {/* Basic Info */}
                        <View className="p-4 bg-white">
                            <Text className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                                {event.name}
                            </Text>
                            <Text className="text-gray-600 mb-4">
                                {event.description}
                            </Text>
                            {/* Status Badge */}
                            <TouchableOpacity
                                onPress={() => setIsStatusModalOpen(true)}
                                className={`absolute top-4 right-4 px-4 py-2 rounded-full ${getStatusColor(currentStatus)} shadow-sm`}
                            >
                                <Text className="text-white font-semibold text-base">
                                    {currentStatus}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Event Images */}
                        {event.images && event.images.length > 0 && (
                            <View className="my-4">
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={handleImageScroll}
                                    scrollEventThrottle={16}
                                    ref={scrollViewRef}
                                >
                                    {event.images.map((image, index) => (
                                        <TouchableOpacity
                                            key={image.public_id}
                                            onPress={() => openImageViewer(index)}
                                        >
                                            <Image
                                                source={{ uri: image.url }}
                                                className="w-screen h-[300px]"
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Event Info Cards */}
                        <View className="p-4 space-y-4">
                            {/* Time and Location */}
                            <View className="bg-white rounded-xl p-4 shadow-sm">
                                <View className="flex-row items-center mb-3">
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
                                    <Text className="ml-3 text-base text-gray-700">
                                        {event.location}
                                    </Text>
                                </View>
                            </View>

                            {/* Participants Section */}
                            <View className="bg-white rounded-xl shadow-sm">
                                <View className="p-4 border-b border-gray-100">
                                    <Text className="text-lg font-bold text-gray-900">
                                        Danh sách người tham gia
                                    </Text>
                                    <Text className="text-sm text-gray-500 mt-1">
                                        {event.participants?.length || 0} người
                                    </Text>
                                </View>

                                <View className="p-4">
                                    <TextInput
                                        placeholder="Tìm kiếm người tham gia..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        className="bg-gray-50 rounded-lg px-4 py-2 text-base"
                                    />
                                </View>

                                <View className="h-[300px]">
                                    <FlatList
                                        data={filteredParticipants}
                                        keyExtractor={(item) => item._id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => handleParticipantPress(item)}
                                                className="flex-row items-center p-4 border-b border-gray-100"
                                            >
                                                <Image
                                                    source={{
                                                        uri: item.userId.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                                                    }}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                                <View className="ml-3 flex-1">
                                                    <Text className="font-semibold">{item.userId.fullName}</Text>
                                                    {item.userId.unionCardNumber && (
                                                        <Text className="text-gray-500">Mã đoàn viên: {item.userId.unionCardNumber}</Text>
                                                    )}
                                                    {item.userId.chapterName && (
                                                        <Text className="text-gray-500">{item.userId.chapterName}</Text>
                                                    )}
                                                </View>
                                                <View className={`px-2 py-1 rounded ${item.status === 'checked-in' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                                    <Text className="text-white text-sm">
                                                        {item.status === 'checked-in' ? 'Đã điểm danh' : 'Đã đăng ký'}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={() => (
                                            <View className="py-8 items-center">
                                                <Text className="text-gray-500 italic">
                                                    Không tìm thấy người tham gia nào
                                                </Text>
                                            </View>
                                        )}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="p-4 space-y-4">
                            {currentStatus === 'Sắp diễn ra' && (
                                <TouchableOpacity
                                    onPress={handleStartEvent}
                                    className="w-full bg-blue-600 py-3 rounded-lg flex-row items-center justify-center"
                                >
                                    <Ionicons name="play" size={20} color="white" />
                                    <Text className="text-white font-semibold ml-2">
                                        Bắt đầu sự kiện
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {currentStatus === 'Đang diễn ra' && (
                                <TouchableOpacity
                                    onPress={handleEndEvent}
                                    className="w-full bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text className="text-white font-semibold ml-2">
                                        Kết thúc sự kiện
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {(currentStatus === 'Sắp diễn ra' || currentStatus === 'Đang diễn ra') && (
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert.alert(
                                            'Xác nhận hủy sự kiện',
                                            'Bạn có chắc chắn muốn hủy sự kiện này không?',
                                            [
                                                { text: 'Không', style: 'cancel' },
                                                {
                                                    text: 'Có',
                                                    style: 'destructive',
                                                    onPress: handleCancelEvent
                                                }
                                            ]
                                        );
                                    }}
                                    className="w-full bg-red-600 py-3 rounded-lg flex-row items-center justify-center"
                                >
                                    <Ionicons name="close-circle" size={20} color="white" />
                                    <Text className="text-white font-semibold ml-2">
                                        Hủy sự kiện
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={() => setIsEditModalVisible(true)}
                                className="w-full bg-blue-600 py-3 rounded-lg flex-row items-center justify-center"
                            >
                                <Ionicons name="pencil-outline" size={20} color="white" />
                                <Text className="text-white font-semibold ml-2">
                                    Chỉnh sửa sự kiện
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Không tìm thấy thông tin sự kiện</Text>
                </View>
            )}

            {/* Edit Modal */}
            {event && (
                <EditEventModal
                    isVisible={isEditModalVisible}
                    event={event}
                    onClose={() => setIsEditModalVisible(false)}
                    onSuccess={() => {
                        setIsEditModalVisible(false);
                        fetchEventDetail();
                    }}
                />
            )}

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
