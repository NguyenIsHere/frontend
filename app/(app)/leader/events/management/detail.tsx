import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type EventStatus = 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã kết thúc' | 'Đã hủy';

type Participant = {
    id: string;
    name: string;
    cardNumber: string;
    role: string;
    chapter: string;
    status: 'present' | 'absent' | 'pending';
    avatar?: string;
};

const { width: screenWidth } = Dimensions.get('window');

const EventDetail = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const flatListRef = useRef<FlatList>(null);

    // Mock event data
    const event = {
        id: params.eventId as string,
        title: 'Chiến dịch thanh niên tình nguyện Mùa hè xanh 2025',
        time: '07:00 - 17:00, 15/03/2025 - 16/03/2025',
        location: 'Xã Tân Phú, Huyện Tân Châu, Tỉnh Tây Ninh',
        description:
            'Chiến dịch tình nguyện thường niên với các hoạt động: phát quang bụi rậm, dọn dẹp vệ sinh môi trường, tặng quà cho các em nhỏ có hoàn cảnh khó khăn.',
        scope: 'Toàn thể đoàn viên Chi đoàn',
        participants: '50 đoàn viên',
        requirements: 'Đoàn viên có sức khỏe tốt, tinh thần nhiệt huyết',
        status: 'Sắp diễn ra' as EventStatus,
        images: [
            'https://scontent.fsgn5-14.fna.fbcdn.net/v/t39.30808-6/482032651_1033663062119428_6517174517474946357_n.jpg',
            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205',
            'https://images.unsplash.com/photo-1540317700647-ec69694d70d0'
        ],
    };

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentStatus, setCurrentStatus] = useState<EventStatus>(event.status);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [participantModalVisible, setParticipantModalVisible] = useState(false);

    // Mock participants data
    const [participants, setParticipants] = useState<Participant[]>([
        {
            id: '1',
            name: 'Nguyễn Văn A',
            cardNumber: '001234',
            role: 'Đoàn viên',
            chapter: 'Chi đoàn 1',
            status: 'present',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        {
            id: '2',
            name: 'Trần Thị B',
            cardNumber: '001235',
            role: 'Đoàn viên',
            chapter: 'Chi đoàn 2',
            status: 'absent',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        {
            id: '3',
            name: 'Lê Văn C',
            cardNumber: '001236',
            role: 'Đoàn viên',
            chapter: 'Chi đoàn 1',
            status: 'pending',
            avatar: 'https://randomuser.me/api/portraits/men/45.jpg'
        }
    ]);

    const filteredParticipants = participants.filter(participant => {
        const searchLower = searchQuery.toLowerCase();
        return (
            participant.name.toLowerCase().includes(searchLower) ||
            participant.cardNumber.includes(searchQuery)
        );
    });

    const handleStatusChange = (newStatus: EventStatus) => {
        setCurrentStatus(newStatus);
        setStatusModalVisible(false);

        // Show confirmation alert
        Alert.alert(
            'Xác nhận',
            `Đã chuyển trạng thái sự kiện sang "${newStatus}"`,
            [{ text: 'OK' }]
        );
    };

    const toggleParticipantStatus = (participantId: string) => {
        setParticipants(current =>
            current.map(p => {
                if (p.id === participantId) {
                    let newStatus: 'present' | 'absent' | 'pending';
                    switch (p.status) {
                        case 'pending':
                            newStatus = 'present';
                            break;
                        case 'present':
                            newStatus = 'absent';
                            break;
                        default:
                            newStatus = 'pending';
                    }
                    return { ...p, status: newStatus };
                }
                return p;
            })
        );
    };

    const getStatusColor = (status: EventStatus) => {
        switch (status) {
            case 'Sắp diễn ra':
                return 'text-blue-600';
            case 'Đang diễn ra':
                return 'text-green-600';
            case 'Đã kết thúc':
                return 'text-gray-600';
            case 'Đã hủy':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getParticipantStatusStyle = (status: 'present' | 'absent' | 'pending') => {
        switch (status) {
            case 'present':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    label: 'Có mặt'
                };
            case 'absent':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    label: 'Vắng mặt'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    label: 'Chưa điểm danh'
                };
        }
    };

    const renderParticipantItem = ({ item }: { item: Participant }) => {
        const statusStyle = getParticipantStatusStyle(item.status);

        return (
            <View className="bg-white p-4 mb-2 rounded-lg flex-row items-center">
                <Image
                    source={{ uri: item.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                    className="w-12 h-12 rounded-full"
                />
                <View className="flex-1 ml-3">
                    <Text className="font-bold text-gray-900">{item.name}</Text>
                    <Text className="text-gray-600">Mã thẻ: {item.cardNumber}</Text>
                    <View className="flex-row items-center mt-1">
                        <Text className="text-gray-600 mr-2">{item.role}</Text>
                        <Text className="text-gray-600">{item.chapter}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => toggleParticipantStatus(item.id)}
                    className={`px-3 py-1 rounded-full ${statusStyle.bg}`}
                >
                    <Text className={statusStyle.text}>{statusStyle.label}</Text>
                </TouchableOpacity>
            </View>
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
                <Text className="text-white text-xl font-bold flex-1 ml-4">
                    Chi tiết sự kiện
                </Text>
            </View>

            {/* Content */}
            <ScrollView className="flex-1">
                {/* Event Image */}
                <View className="relative">
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
                        onScroll={(event) => {
                            const contentOffset = event.nativeEvent.contentOffset;
                            const viewSize = event.nativeEvent.layoutMeasurement;
                            const index = Math.floor(contentOffset.x / viewSize.width);
                            setCurrentImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                        renderItem={({ item: image }) => (
                            <View style={{ width: screenWidth }}>
                                <Image
                                    source={{ uri: image }}
                                    className="w-full aspect-square"
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
                                    className={`h-2 rounded-full mx-1 ${index === currentImageIndex
                                            ? 'bg-blue-500 w-4'
                                            : 'bg-white opacity-70 w-2'
                                        }`}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Event Info */}
                <View className="p-4">
                    <Text className="text-2xl font-bold mb-2">{event.title}</Text>

                    {/* Basic Info */}
                    <View className="mt-1 mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-xs">{event.time}</Text>
                        </View>

                        <View className="flex-row items-center">
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-xs">{event.location}</Text>
                        </View>
                    </View>

                    {/* Status - with dropdown */}
                    <TouchableOpacity
                        className="bg-white rounded-lg p-4 mb-4 border border-gray-300"
                        onPress={() => setStatusModalVisible(true)}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <Ionicons
                                    name="flag-outline"
                                    size={20}
                                    color="#3b82f6"
                                />
                                <Text className="text-lg font-bold ml-2 text-blue-600">
                                    Trạng thái
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className={`mr-2 ${getStatusColor(currentStatus)}`}>
                                    {currentStatus}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Scope */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                        <View className="flex-row items-center mb-3">
                            <Ionicons
                                name="people-outline"
                                size={20}
                                color="#3b82f6"
                            />
                            <Text className="text-lg font-bold ml-2 text-blue-600">
                                Phạm vi
                            </Text>
                        </View>
                        <Text className="text-gray-900 leading-6">
                            {event.scope}
                        </Text>
                    </View>

                    {/* Participants Section */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <Ionicons
                                    name="people-circle-outline"
                                    size={20}
                                    color="#3b82f6"
                                />
                                <Text className="text-lg font-bold ml-2 text-blue-600">
                                    Người tham gia
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setParticipantModalVisible(true)}
                                className="bg-blue-100 px-3 py-1 rounded-full"
                            >
                                <Text className="text-blue-800">Xem chi tiết</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className="text-gray-900 leading-6">
                            {event.participants}
                        </Text>
                    </View>

                    {/* Requirements */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                        <View className="flex-row items-center mb-3">
                            <Ionicons
                                name="list-outline"
                                size={20}
                                color="#3b82f6"
                            />
                            <Text className="text-lg font-bold ml-2 text-blue-600">
                                Yêu cầu
                            </Text>
                        </View>
                        <Text className="text-gray-900 leading-6">
                            {event.requirements}
                        </Text>
                    </View>

                    {/* Description */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                        <View className="flex-row items-center mb-3">
                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color="#3b82f6"
                            />
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

            {/* Status Modal */}
            <Modal
                visible={statusModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-white rounded-t-2xl">
                        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
                            <Text className="text-xl font-bold">Chọn trạng thái</Text>
                            <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                                <Ionicons name="close-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {(['Sắp diễn ra', 'Đang diễn ra', 'Đã kết thúc', 'Đã hủy'] as EventStatus[]).map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => handleStatusChange(status)}
                                    className="p-4 border-b border-gray-100"
                                >
                                    <Text className={`text-lg ${getStatusColor(status)}`}>
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Participants Modal */}
            <Modal
                visible={participantModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setParticipantModalVisible(false)}
            >
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-white rounded-t-2xl">
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xl font-bold">Danh sách người tham gia</Text>
                                <TouchableOpacity onPress={() => setParticipantModalVisible(false)}>
                                    <Ionicons name="close-outline" size={24} color="black" />
                                </TouchableOpacity>
                            </View>

                            {/* Search bar */}
                            <View className="bg-gray-100 rounded-lg flex-row items-center px-3 py-2">
                                <Ionicons name="search-outline" size={20} color="#666" />
                                <TextInput
                                    className="flex-1 ml-2"
                                    placeholder="Tìm theo tên hoặc mã thẻ đoàn viên"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            {/* Statistics */}
                            <View className="flex-row justify-around my-4">
                                <View className="items-center">
                                    <Text className="text-lg font-bold text-green-600">
                                        {participants.filter(p => p.status === 'present').length}
                                    </Text>
                                    <Text className="text-gray-600">Có mặt</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-lg font-bold text-red-600">
                                        {participants.filter(p => p.status === 'absent').length}
                                    </Text>
                                    <Text className="text-gray-600">Vắng mặt</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-lg font-bold text-gray-600">
                                        {participants.filter(p => p.status === 'pending').length}
                                    </Text>
                                    <Text className="text-gray-600">Chưa điểm danh</Text>
                                </View>
                            </View>
                        </View>

                        <FlatList
                            data={filteredParticipants}
                            renderItem={renderParticipantItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16 }}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default EventDetail;
