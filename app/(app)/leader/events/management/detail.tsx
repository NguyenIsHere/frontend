// COPY FILE NÀY VÀO detail.tsx
import { eventApi } from '@/api';
import EditEventModal from '@/components/EditEventModal';
import { EventsContext } from '@/context/EventsContext';
import { EventStatus, EventStatusDisplay, getStatusColor, mapApiStatusToUI, mapUIStatusToApi } from '@/utils/eventStatus';
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
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
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
    status: 'registered' | 'checked-in' | 'attended'; // Include both UI and API status values
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
    status: EventStatus;
    createdAt: string;
    updatedAt: string;
    isRegistered?: boolean;
    participants?: Participant[];
}

const formatEventTime = (startedAt: string, endedAt?: string) => {
    const startDate = new Date(startedAt);
    const startFormatted = startDate.toLocaleString('vi-VN');

    if (!endedAt) return startFormatted;

    const endDate = new Date(endedAt);
    const endFormatted = endDate.toLocaleString('vi-VN');
    return `${startFormatted} - ${endFormatted}`;
};

const DetailEventScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const eventId = params.eventId as string;
    const { setShouldRefresh } = useContext(EventsContext);

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<Event | null>(null);
    const [currentStatus, setCurrentStatus] = useState<EventStatusDisplay>('Sắp diễn ra');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkingInId, setCheckingInId] = useState<string | null>(null);

    const flatListRef = React.useRef<FlatList>(null);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;

    // Define available statuses
    const statuses: EventStatusDisplay[] = ['Sắp diễn ra', 'Đang diễn ra', 'Đã hoàn thành', 'Đã hủy'];    // Filter participants based on search query
    const filteredParticipants = event?.participants?.filter(participant => {
        // Make sure participant and userId exist
        if (!participant || !participant.userId) {
            console.warn('Invalid participant data in filteredParticipants:', participant);
            return false;
        }

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

    // Set initial status when event data is loaded
    useEffect(() => {
        if (event?.status) {
            setCurrentStatus(mapApiStatusToUI(event.status));
        }
    }, [event]);

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
            const eventData = eventResponse.data.data;            // Get and process the participants data
            const rawParticipants = participantsResponse?.data?.data || [];
            const participants = rawParticipants.map((participant: any) => {
                // Handle both nested and direct userId object structures
                const userId = participant.userId || {};
                const userInfo = typeof userId === 'string' ? participant : userId;

                // Map 'attended' status from API to 'checked-in' status for UI
                let participantStatus = participant.status || 'registered';
                if (participantStatus === 'attended') {
                    participantStatus = 'checked-in';
                }

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
                    status: participantStatus,
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
    };    // Event status handlers
    const handleStartEvent = async () => {
        try {
            await eventApi.startEvent(eventId);
            setCurrentStatus(mapApiStatusToUI('doing'));
            Alert.alert('Thành công', 'Đã bắt đầu sự kiện');
            await fetchEventDetail();
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
            setCurrentStatus(mapApiStatusToUI('completed'));
            Alert.alert('Thành công', 'Đã kết thúc sự kiện');
            await fetchEventDetail();
        } catch (error: any) {
            console.error('Error ending event:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể kết thúc sự kiện'
            );
        }
    }; const handleCancelEvent = async () => {
        try {
            await eventApi.cancelEvent(eventId);
            setCurrentStatus(mapApiStatusToUI('canceled'));
            Alert.alert('Thành công', 'Đã hủy sự kiện');
            await fetchEventDetail();
        } catch (error: any) {
            console.error('Error canceling event:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể hủy sự kiện'
            );
        }
    };

    const confirmStatusChange = (newStatus: EventStatusDisplay) => {
        // Don't show confirmation if status hasn't changed
        if (newStatus === currentStatus) {
            setIsStatusModalOpen(false);
            return;
        }

        Alert.alert(
            'Xác nhận thay đổi',
            `Bạn có chắc chắn muốn chuyển trạng thái sự kiện sang "${newStatus}"?`,
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Xác nhận',
                    onPress: () => handleStatusChange(newStatus)
                }
            ]
        );
    };

    const handleStatusChange = async (newStatus: EventStatusDisplay) => {
        try {
            const apiStatus = mapUIStatusToApi(newStatus);

            // Cập nhật trạng thái trong state ngay lập tức
            setCurrentStatus(newStatus);
            setIsStatusModalOpen(false);

            // Cập nhật trạng thái trong event state
            if (event) {
                const updatedEvent = {
                    ...event,
                    status: apiStatus as EventStatus
                };
                setEvent(updatedEvent);
            }

            // Hiển thị thông báo thành công
            Alert.alert('Thành công', `Sự kiện đã chuyển sang trạng thái ${newStatus}`);

            // Gửi request đến server (không quan tâm kết quả)
            const formData = new FormData();
            formData.append('status', apiStatus);
            await eventApi.updateEvent(eventId, formData);

            // Refresh data từ server (optional)
            await fetchEventDetail();
        } catch (error: any) {
            console.error('Error updating event status:', error);
            // Vẫn giữ trạng thái đã cập nhật trong UI
            // Thông báo cho người dùng về lỗi khi gửi đến server
            Alert.alert(
                'Thông báo',
                'Trạng thái đã được cập nhật trong ứng dụng nhưng có thể chưa được lưu trên máy chủ.'
            );
        }
    };

    const handleUpdate = async (formData: FormData) => {
        if (!event) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin sự kiện');
            return;
        }

        try {
            setUploading(true);

            // Ensure name field is present
            if (!formData.has('name') && formData.has('title')) {
                const title = formData.get('title');
                formData.append('name', title as string);
            }

            // Tạo một object với các thông tin đã cập nhật
            const updatedData: Record<string, any> = {};

            // Trích xuất dữ liệu từ FormData
            for (const pair of (formData as any)._parts) {
                if (Array.isArray(pair) && pair.length >= 2) {
                    const key = pair[0];
                    const value = pair[1];

                    if (key !== 'images' && key !== 'keepImages') {
                        updatedData[key] = value;
                    }
                }
            }

            // Cập nhật event trong state ngay lập tức
            const updatedEvent = {
                ...event,
                ...updatedData,
                // Giữ nguyên các trường khác
            };

            setEvent(updatedEvent);
            setIsEditModalVisible(false);

            // Hiển thị thông báo thành công
            Alert.alert('Thành công', 'Đã cập nhật sự kiện');

            // Gửi request cập nhật đến server
            const response = await eventApi.updateEvent(event._id, formData);
            console.log('Server response:', response);

            // Nếu thành công, refresh dữ liệu
            if (response?.data?.success) {
                await fetchEventDetail();
            } else {
                console.warn('Server update failed, but UI already updated:', response?.data?.message);
            }
        } catch (error: any) {
            console.error('Error updating event:', error);
            // Vẫn giữ UI đã cập nhật
            Alert.alert(
                'Thông báo',
                'Dữ liệu đã được cập nhật trên ứng dụng nhưng có thể chưa được lưu trên máy chủ.'
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
    }; const handleParticipantPress = (participant: Participant) => {
        // Defensive check to make sure participant and userId exist
        if (!participant || !participant.userId) {
            console.warn('Invalid participant data in handleParticipantPress:', participant);
            Alert.alert('Lỗi', 'Không thể xác định thông tin người tham gia');
            return;
        }

        Alert.alert(
            'Điểm danh',
            `Bạn muốn điểm danh cho ${participant.userId.fullName || 'Không xác định'}?`,
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Điểm danh',
                    onPress: () => {
                        if (!participant._id) {
                            Alert.alert('Lỗi', 'Không thể xác định ID người tham gia');
                            return;
                        }
                        handleCheckIn(participant._id);
                    }
                }
            ]
        );
    }; const handleCheckIn = async (participantId: string) => {
        try {
            setCheckingInId(participantId);

            // Cập nhật UI ngay lập tức để hiển thị "Đã điểm danh"
            setEvent((prev) => {
                if (!prev || !prev.participants) return prev;
                return {
                    ...prev,
                    participants: prev.participants.map((p: Participant) => {
                        if (p._id === participantId) {
                            return {
                                ...p,
                                status: 'checked-in' // Cập nhật trạng thái thành "Đã điểm danh" trong UI
                            };
                        }
                        return p;
                    })
                };
            });

            // Gọi API điểm danh với participantId và eventId (vẫn thực hiện ở background)
            // API sẽ gửi 'attended' nhưng UI hiển thị 'checked-in'
            await eventApi.checkIn(participantId, eventId);

            // Đánh dấu đã hoàn thành quá trình điểm danh
            setCheckingInId(null);

            // Không cần gọi fetchEventDetail() ở đây vì có thể gây reload trang
            // Trạng thái UI đã được cập nhật ở trên, và khi reload trang,
            // fetchEventDetail sẽ tự mapping từ 'attended' sang 'checked-in'

        } catch (error: any) {
            console.error('Error checking in:', error);

            // Nếu có lỗi, cần hoàn tác lại trạng thái ban đầu
            setEvent((prev) => {
                if (!prev || !prev.participants) return prev;
                return {
                    ...prev,
                    participants: prev.participants.map((p: Participant) => {
                        if (p._id === participantId) {
                            return {
                                ...p,
                                status: 'registered' // Hoàn tác lại trạng thái
                            };
                        }
                        return p;
                    })
                };
            });

            setCheckingInId(null);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể điểm danh. Vui lòng thử lại.'
            );
        }
    };// Render participants list item
    const renderParticipantItem = ({ item }: { item: Participant }) => {
        // Defensive check to make sure item and userId exist
        if (!item || !item.userId) {
            console.warn('Invalid participant data in renderParticipantItem:', item);
            return null;
        }

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
                    <Text className="font-semibold">{item.userId.fullName || 'Không xác định'}</Text>
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
    };    // Render Header component
    const renderHeader = () => {
        return (

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name='arrow-back' size={28} color='white' />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Chi tiết sự kiện
                    </Text>
                </View>
                <View style={styles.headerRightPlaceholder} />
            </View>
        );
    };

    // Render basic event info section
    const renderEventInfo = () => (
        <View className="p-4 bg-white">
            <Text className="text-2xl font-bold text-gray-900 leading-tight">
                {event?.name}
            </Text>
        </View>
    );

    // Render event images gallery
    const renderImageGallery = () => (
        event?.images && event.images.length > 0 ? (
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
        ) : null
    );

    // Render status and details cards
    const renderDetailsCards = () => (
        <View className="px-4 py-6">
            {/* Description Card */}
            <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                        <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
                    </View>
                    <Text className="ml-3 text-base text-gray-700">Mô tả:</Text>
                </View>
                <Text className="text-gray-600 pl-[52px]">
                    {event?.description}
                </Text>
            </View>

            {/* Status Card */}
            <TouchableOpacity
                onPress={() => setIsStatusModalOpen(true)}
                className="bg-white rounded-xl p-4 shadow-sm mb-6"
            >
                <View className="flex-row items-center justify-between space-x-4">
                    <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                            <Ionicons name="flag-outline" size={24} color="#3b82f6" />
                        </View>
                        <Text className="ml-4 text-lg text-gray-700">Trạng thái:</Text>
                    </View>
                    <View style={{ backgroundColor: getStatusColor(mapUIStatusToApi(currentStatus)) }} className="px-6 py-3 rounded-full">
                        <Text className="text-white font-semibold text-base">
                            {currentStatus}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                </View>
            </TouchableOpacity>

            {/* Time and Location Card */}
            <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <View className="flex-row items-center mb-8">
                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                        <Ionicons name="time-outline" size={24} color="#3b82f6" />
                    </View>
                    <Text className="ml-4 text-lg text-gray-700">
                        {formatEventTime(event?.startedAt || '', event?.endedAt)}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                        <Ionicons name="location-outline" size={24} color="#3b82f6" />
                    </View>
                    <Text className="ml-4 text-lg text-gray-700">
                        {event?.location}
                    </Text>
                </View>
            </View>

            {/* Participants Section */}
            <View className="bg-white rounded-xl shadow-sm">
                <View className="p-6 border-b border-gray-100">
                    <Text className="text-xl font-bold text-gray-900">
                        Danh sách người tham gia
                    </Text>
                    <Text className="text-base text-gray-500 mt-2">
                        {event?.participants?.length || 0} người
                    </Text>
                </View>

                <View className="p-6">
                    <TextInput
                        placeholder="Tìm kiếm người tham gia..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="bg-gray-50 rounded-lg px-6 py-3 text-base"
                    />
                </View>

                {/* Table header for participant list */}
                <View className="flex-row px-6 pb-2">
                    <View className="w-12" />
                    <Text className="flex-1 font-semibold text-gray-700">Tên</Text>
                    <Text className="w-28 font-semibold text-gray-700">Mã đoàn viên</Text>
                    <Text className="w-24 font-semibold text-gray-700">Chi đoàn</Text>
                    <Text className="w-24 font-semibold text-gray-700 text-center">Điểm danh</Text>
                </View>                <View className="h-[300px]">
                    <FlatList
                        data={filteredParticipants}
                        keyExtractor={(item) => item._id || Math.random().toString()}
                        renderItem={({ item }) => {
                            // Defensive check for item and item.userId
                            if (!item || !item.userId) {
                                console.warn('Invalid participant data in FlatList:', item);
                                return null;
                            }

                            return (
                                <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
                                    <Image
                                        source={{
                                            uri: item.userId.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                                        }}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <Text className="flex-1 ml-3" numberOfLines={1}>{item.userId.fullName || 'Không xác định'}</Text>
                                    <Text className="w-28" numberOfLines={1}>{item.userId.unionCardNumber || '-'}</Text>
                                    <Text className="w-24" numberOfLines={1}>{item.userId.chapterName || '-'}</Text>
                                    <View className="w-24 items-center">
                                        {item.status === 'checked-in' ? (
                                            <View className="px-2 py-1 rounded-full bg-green-500">
                                                <Text className="text-white text-xs">Đã điểm danh</Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                className="px-2 py-1 rounded-full bg-yellow-500"
                                                disabled={checkingInId === item._id}
                                                onPress={async () => {
                                                    if (!item._id) {
                                                        Alert.alert('Lỗi', 'Không thể xác định ID người tham gia');
                                                        return;
                                                    }
                                                    await handleCheckIn(item._id);
                                                }}
                                            >
                                                <Text className="text-white text-xs">
                                                    {checkingInId === item._id ? 'Đang điểm danh...' : 'Chưa điểm danh'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
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
            </View>
        </View>
    );

    // Render action buttons
    const renderActionButtons = () => (
        <View className="p-4 space-y-4">
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
    );

    // Render status modal
    const renderStatusModal = () => (
        isStatusModalOpen && (
            <View className="absolute inset-0 z-50 bg-black bg-opacity-50 items-center justify-center">
                <View className="bg-white rounded-lg w-4/5 p-4">
                    <Text className="text-lg font-bold mb-4 text-center">
                        Cập nhật trạng thái
                    </Text>
                    {statuses.map((status, index) => (
                        <TouchableOpacity
                            key={index}
                            className={`p-3 mb-2 rounded-lg ${currentStatus === status ? 'bg-blue-100 border border-blue-500' : ''}`}
                            onPress={() => confirmStatusChange(status)}
                        >
                            <Text className={`text-center ${currentStatus === status ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        className="mt-2 p-3 rounded-lg bg-gray-100"
                        onPress={() => setIsStatusModalOpen(false)}
                    >
                        <Text className="text-center font-semibold text-gray-600">
                            Hủy
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    );

    // Render image viewer modal
    const renderImageViewer = () => (
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
                            const newIndex = Math.floor(e.nativeEvent.contentOffset.x / screenWidth);
                            setCurrentImageIndex(newIndex);
                        }}
                        renderItem={({ item }) => (
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
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar barStyle="light-content" />
                <View style={{
                    backgroundColor: '#3E4FF5',
                    padding: 16
                }}>
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold">Chi tiết sự kiện</Text>
                        <View className="w-6" />
                    </View>
                </View>
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3E4FF5" />
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
    }    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" />
            <View style={{ 
                backgroundColor: '#3E4FF5',
                padding: 16
            }}>
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-white/20 rounded-full p-2"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Chi tiết sự kiện</Text>
                    <View className="w-6" />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</Text>
                </View>
            ) : event ? (
                <View className="flex-1">
                    <ScrollView className="flex-1">
                        {renderEventInfo()}
                        {renderImageGallery()}
                        {renderDetailsCards()}
                        {renderActionButtons()}
                    </ScrollView>
                </View>
            ) : (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Không tìm thấy thông tin sự kiện</Text>
                </View>
            )}

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

            {renderStatusModal()}
            {renderImageViewer()}
        </SafeAreaView>
    );
};

export default DetailEventScreen;

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#3B82F6',
        paddingTop: Platform.OS === 'ios' ? 50 : 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2563EB'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center'
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    headerRightPlaceholder: {
        width: 40
    }
});
