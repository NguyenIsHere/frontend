import { eventApi } from '@/api';
import CommentsSection from '@/components/CommentsSection';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

// Remove direct dimension declaration and use hook instead
// const { width } = useWindowDimensions();

// Format datetime string to HH:mm DD/MM/YYYY
const formatDateTimeString = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
};

// Define the upcoming event type
type UpcomingEvent = {
    id: string;
    chapterName: string;
    title: string;
    time: string;
    location: string;
    scope: string;
    description: string;
    participants: string;
    requirements: string;
    images: string[];
    likes: number;
    comments: number;
    isLiked: boolean;
    isRegistered: boolean;
    favoriteId?: string;
};

const UpcomingScreen = () => {
    const router = useRouter();
    const { width } = useWindowDimensions(); // Hook call at component level
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [searchContact, setSearchContact] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState<{ [eventId: string]: number }>({});

    // Mock contacts for sharing
    const contacts = [
        { id: '1', name: 'Nguyễn Văn A', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { id: '2', name: 'Trần Thị B', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: '3', name: 'Lê Hoàng C', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    ];

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchContact.toLowerCase())
    );

    useEffect(() => {
        fetchUpcomingEvents();
    }, []);

    const fetchUpcomingEvents = async () => {
        try {
            setLoading(true);

            // Get upcoming events and user's registrations in parallel
            const [eventsResponse, registrationsResponse] = await Promise.all([
                eventApi.getEvents({
                    status: 'pending',
                    limit: 10
                }),
                eventApi.getEventRegistrations()
            ]);

            console.log('API Response:', eventsResponse?.data);
            console.log('Registrations Response:', registrationsResponse?.data);

            if (eventsResponse?.data?.data?.docs) {
                const eventDocs = eventsResponse.data.data.docs;
                const registeredEventIds = new Set(
                    (registrationsResponse?.data?.data || [])
                        .filter((reg: any) => reg.eventId && (reg.eventId._id || reg.eventId)) // Filter out null eventIds
                        .map((reg: any) => reg.eventId._id || reg.eventId)
                );

                console.log('Registered Event IDs:', registeredEventIds);

                // Transform event data
                const transformedEvents = await Promise.all(eventDocs.map(async (event: any) => {
                    try {
                        if (!event?._id) {
                            console.log('Invalid event data:', event);
                            return null;
                        }

                        const eventDetail = await eventApi.getEventById(event._id);
                        console.log('Event Detail Response:', eventDetail?.data);
                        const eventData = eventDetail.data.data;

                        if (!eventData) {
                            console.log('Invalid event detail data for ID:', event._id);
                            return null;
                        }

                        // Debug images data
                        console.log('Event Images:', eventData.images);

                        // Check like status
                        const likeStatus = await eventApi.checkLikeStatus(event._id);

                        const transformedEvent = {
                            id: event._id,
                            chapterName: eventData.chapterName || 'Chi đoàn',
                            title: eventData.name,
                            time: eventData.startedAt ? formatDateTimeString(eventData.startedAt) : '',
                            location: eventData.location,
                            scope: eventData.scope === 'chapter' ? 'Chi đoàn' : 'Công khai',
                            description: eventData.description || '',
                            participants: eventData.participants || '',
                            requirements: eventData.requirements || '',
                            images: Array.isArray(eventData.images) ? eventData.images.map((img: any) => {
                                if (typeof img === 'object' && img !== null) {
                                    return img.url || img.secure_url || null;
                                }
                                return typeof img === 'string' ? img : null;
                            }).filter((url: string | null): url is string => typeof url === 'string') : [],
                            likes: eventData.favorites?.length || 0,
                            comments: eventData.comments?.length || 0,
                            isLiked: likeStatus.isLiked,
                            isRegistered: registeredEventIds.has(event._id),
                            favoriteId: likeStatus.favoriteId
                        };

                        return transformedEvent;
                    } catch (err) {
                        console.error('Error processing event:', err);
                        return null;
                    }
                }));

                // Filter out null events and log the final result
                const validEvents = transformedEvents.filter(event => event !== null);
                console.log('Final Events Array:', validEvents);
                setUpcomingEvents(validEvents as UpcomingEvent[]);
            }
        } catch (error: any) {
            console.error('Error fetching upcoming events:', error);
            const message = error.response?.data?.message || 'Không thể tải danh sách sự kiện';
            Alert.alert('Lỗi', message);
        } finally {
            setLoading(false);
        }
    };

    // Handle event registration
    const toggleRegistration = async (id: string) => {
        try {
            const event = upcomingEvents.find(e => e.id === id);
            if (!event) return;

            if (!event.isRegistered) {
                // Register for the event
                await eventApi.registerEvent(id);
                setUpcomingEvents(events =>
                    events.map(e =>
                        e.id === id
                            ? { ...e, isRegistered: true }
                            : e
                    )
                );
                Alert.alert(
                    "Đăng ký thành công",
                    `Bạn đã đăng ký tham gia sự kiện "${event.title}".`,
                    [{ text: "OK" }]
                );
            } else {
                // Unregister from the event
                await eventApi.unregisterEvent(id);
                setUpcomingEvents(events =>
                    events.map(e =>
                        e.id === id
                            ? { ...e, isRegistered: false }
                            : e
                    )
                );
                Alert.alert(
                    "Hủy đăng ký",
                    `Bạn đã hủy đăng ký tham gia sự kiện "${event.title}".`,
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error('Error toggling registration:', error);
            Alert.alert(
                'Lỗi',
                'Không thể thực hiện thao tác. Vui lòng thử lại sau.',
                [{ text: 'OK' }]
            );
        }
    };

    // Handle like for an event
    const toggleLike = async (eventId: string) => {
        try {
            const event = upcomingEvents.find(e => e.id === eventId);
            if (!event) return;

            if (event.isLiked && event.favoriteId) {
                await eventApi.unlikeEvent(event.favoriteId);
                setUpcomingEvents(events => events.map(e =>
                    e.id === eventId
                        ? { ...e, isLiked: false, likes: e.likes - 1, favoriteId: undefined }
                        : e
                ));
            } else {
                const response = await eventApi.likeEvent(eventId);
                if (response.data?._id) {
                    setUpcomingEvents(events => events.map(e =>
                        e.id === eventId
                            ? { ...e, isLiked: true, likes: e.likes + 1, favoriteId: response.data._id }
                            : e
                    ));
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
        }
    };    // Toggle like for a comment
    const toggleCommentLike = async (eventId: string, commentId: number) => {
        // This function will be removed as we'll use CommentsSection component
    };

    // Handle comment submit
    const handleCommentSubmit = async () => {
        // This function will be removed as we'll use CommentsSection component
    };

    // Render more/less text component
    type ExpandableTextProps = {
        text: string;
        maxLength?: number;
    };

    const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLength = 150 }) => {
        const [isExpanded, setIsExpanded] = useState(false);

        if (text.length <= maxLength) {
            return <Text className="text-gray-900">{text}</Text>;
        }

        return (
            <View>
                <Text className="text-gray-900">
                    {isExpanded ? text : `${text.substring(0, maxLength)}...`}
                </Text>
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                    <Text className="text-blue-600 mt-1">
                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };    // Render an upcoming event item
    const renderEventItem = ({ item }: { item: UpcomingEvent }) => {

        return (
            <View className="bg-white mb-4 rounded-lg overflow-hidden">
                {/* Post header */}
                <View className="p-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="h-12 w-12 rounded-full bg-blue-500 items-center justify-center">
                            <Text className="text-white font-bold text-lg">
                                {item.chapterName.charAt(0)}
                            </Text>
                        </View>
                        <View className="ml-3">
                            <Text className="font-medium text-gray-900">{item.chapterName}</Text>
                            <Text className="text-gray-500 text-sm">{item.title}</Text>
                        </View>
                    </View>
                </View>

                {/* Images */}
                {item.images.length > 0 && (
                    <View className="relative">
                        <View className="w-full h-72">
                            <FlatList
                                data={item.images}
                                keyExtractor={(_, index) => index.toString()}
                                horizontal
                                pagingEnabled
                                initialScrollIndex={0}
                                showsHorizontalScrollIndicator={false} snapToInterval={width}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                onMomentumScrollEnd={(e) => {
                                    const newIndex = Math.round(
                                        e.nativeEvent.contentOffset.x / width
                                    );
                                    setActiveImageIndex({
                                        ...activeImageIndex,
                                        [item.id]: newIndex
                                    });
                                }}
                                getItemLayout={(_, index) => ({
                                    length: width,
                                    offset: width * index,
                                    index,
                                })}
                                renderItem={({ item: image }) => (
                                    <View className="relative">
                                        <Image
                                            source={{ uri: image }}
                                            className="w-screen h-72"
                                            resizeMode="cover"
                                        />
                                    </View>
                                )}
                            />

                            {/* Pagination indicators */}
                            {item.images.length > 1 && (
                                <>
                                    <View className="absolute bottom-4 flex-row justify-center w-full">
                                        {item.images.map((_, index) => (
                                            <View
                                                key={index}
                                                className={`w-2 h-2 rounded-full mx-1 ${(activeImageIndex[item.id] || 0) === index
                                                        ? 'bg-white'
                                                        : 'bg-white/50'
                                                    }`}
                                            />
                                        ))}
                                    </View>
                                    <View className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded-full">
                                        <Text className="text-white text-xs font-medium">
                                            {(activeImageIndex[item.id] || 0) + 1}/{item.images.length}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* Post content */}
                <View className="p-4">
                    <View className="mt-1 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-sm">{item.time}</Text>
                        </View>

                        <View className="flex-row items-center mb-2">
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-sm">{item.location}</Text>
                        </View>

                        <View className="flex-row items-center mb-2">
                            <Ionicons name="people-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-sm">{item.scope}</Text>
                        </View>
                    </View>

                    {item.description && (
                        <View className="bg-gray-50 rounded-lg p-3">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="information-circle-outline" size={16} color="#666" />
                                <Text className="text-sm font-medium ml-2 text-gray-600">Mô tả</Text>
                            </View>
                            <Text className="text-gray-900">{item.description}</Text>
                        </View>
                    )}
                </View>

                {/* Post actions */}
                <View className="flex-row justify-between px-4 pb-4">
                    <View className="flex-row">
                        <TouchableOpacity
                            className="flex-row items-center mr-4"
                            onPress={() => toggleLike(item.id)}
                        >
                            <Ionicons
                                name={item.isLiked ? "heart" : "heart-outline"}
                                size={24}
                                color={item.isLiked ? "#ef4444" : "#666"}
                            />
                            <Text className="ml-1 text-gray-600">{item.likes}</Text>
                        </TouchableOpacity>                        <TouchableOpacity
                            className="flex-row items-center mr-4"
                            onPress={() => {
                                setSelectedEventId(item.id);
                                setCommentModalVisible(true);
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={22} color="#666" />
                            <Text className="ml-1 text-gray-600">{item.comments}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center"
                            onPress={() => {
                                setSelectedEventId(item.id);
                                setShareModalVisible(true);
                            }}
                        >
                            <Ionicons name="share-social-outline" size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className={`px-4 py-2 rounded-full ${item.isRegistered ? 'bg-gray-100' : 'bg-blue-500'
                            }`}
                        onPress={() => toggleRegistration(item.id)}
                    >
                        <Text
                            className={`font-medium ${item.isRegistered ? 'text-gray-600' : 'text-white'
                                }`}
                        >
                            {item.isRegistered ? 'Đã đăng ký' : 'Đăng ký'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-2 text-gray-600">Đang tải sự kiện...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="bg-blue-600 p-4">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Sự kiện sắp diễn ra</Text>
                    <View className="w-6" />
                </View>
            </View>

            {/* Event list */}
            <FlatList
                data={upcomingEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
                className="flex-1"
                contentContainerClassName="p-4 pb-20"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="flex-1 justify-center items-center py-8">
                        <Text className="text-gray-500">Chưa có sự kiện nào sắp diễn ra</Text>
                    </View>
                )}
            />            {/* Comment Modal */}
            {selectedEventId && (
                <CommentsSection
                    eventId={selectedEventId}
                    showModal={commentModalVisible}
                    onCloseModal={() => setCommentModalVisible(false)}
                    onCommentCountChange={(count) => {
                        // Update the event's comment count
                        if (selectedEventId) {
                            setUpcomingEvents(events =>
                                events.map(event =>
                                    event.id === selectedEventId
                                        ? { ...event, comments: count }
                                        : event
                                )
                            );
                        }
                    }}
                />
            )}

            {/* Share Modal */}
            <Modal
                visible={shareModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShareModalVisible(false)}
            >
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-white rounded-t-2xl">
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-xl font-bold">Chia sẻ</Text>
                                <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                    <Ionicons name="close-outline" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                className="bg-gray-100 rounded-lg px-4 py-2 mt-4"
                                placeholder="Tìm kiếm người dùng..."
                                value={searchContact}
                                onChangeText={setSearchContact}
                            />
                        </View>

                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item) => item.id}
                            className="flex-1"
                            contentContainerClassName="p-4"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="flex-row items-center py-2"
                                    onPress={() => {
                                        // TODO: Implement share functionality
                                        setShareModalVisible(false);
                                        Alert.alert('Thành công', 'Đã chia sẻ sự kiện');
                                    }}
                                >
                                    <Image
                                        source={{ uri: item.avatar }}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <Text className="ml-3 font-medium text-gray-900">
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default UpcomingScreen;
