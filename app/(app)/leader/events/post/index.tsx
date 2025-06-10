import { eventApi } from '@/api';
import CommentsSection from '@/components/CommentsSection';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const width = Dimensions.get('window').width;

// Define the event post type
type EventPost = {
    id: string;
    chapterName: string;
    title: string;
    time: string;
    location: string;
    scope: 'Chi đoàn' | 'Công khai';
    status: 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã hoàn thành' | 'Khóa';
    description: string;
    participants: string;
    requirements: string;
    images: string[];
    likes: number;
    comments: number;
    isLiked: boolean;
    favoriteId?: string; // ID of the user's like for this event
};

interface EventFavorite {
    _id: string;
    userId: string;
    eventId: string;
    createdAt: string;
    updatedAt: string;
}

const EventPostList = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [events, setEvents] = useState<EventPost[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedScope, setSelectedScope] = useState('Tất cả');
    const [activeImageIndex, setActiveImageIndex] = useState<{ [eventId: string]: number }>({});
    // Track favorite IDs for each post to handle unlike operations
    const [favoriteIds, setFavoriteIds] = useState<{ [key: string]: string }>({});
    // Track last tap time for double-tap detection
    const [lastTap, setLastTap] = useState<{ [key: string]: number }>({});
    // Animation values for heart animation
    const [heartAnimations, setHeartAnimations] = useState<{ [key: string]: Animated.Value }>({});

    // Mock contacts for sharing - this would typically come from an API
    const contacts = [
        { id: '1', name: 'Nguyễn Văn A', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { id: '2', name: 'Trần Thị B', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: '3', name: 'Lê Hoàng C', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    ];

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        // Initialize animation values for each event
        const animations: { [key: string]: Animated.Value } = {};
        events.forEach(event => {
            animations[event.id] = new Animated.Value(0);
        });
        setHeartAnimations(animations);
    }, [events]);

    const fetchEvents = async () => {
        try {
            if (!refreshing) {
                setLoading(true);
            }

            // Gọi API để lấy các sự kiện đã hoàn thành
            const response = await eventApi.getEvents({
                status: 'completed',
                limit: 10
            });

            if (response?.data?.data?.docs) {
                const eventDocs = response.data.data.docs;

                // Biến đổi dữ liệu từ API thành định dạng post
                const transformedPosts = await Promise.all(eventDocs.map(async (event: any) => {
                    try {
                        const eventDetail = await eventApi.getEventById(event._id);
                        const eventData = eventDetail.data.data;

                        // Kiểm tra trạng thái like
                        const likeStatus = await eventApi.checkLikeStatus(event._id);

                        return {
                            id: event._id,
                            chapterName: eventData.chapterName || 'Chi đoàn',
                            title: eventData.name,
                            time: new Date(eventData.startedAt).toLocaleString('vi-VN'),
                            location: eventData.location,
                            scope: eventData.scope === 'chapter' ? 'Chi đoàn' : 'Công khai',
                            status: eventData.status === 'completed' ? 'Đã hoàn thành' : 'Đã kết thúc',
                            description: eventData.description || '', images: Array.isArray(eventData.images) ? eventData.images.map((img: any) => {
                                console.log('Processing image:', img);
                                if (typeof img === 'object' && img !== null && img.url) {
                                    console.log('Found image URL:', img.url);
                                    return img.url;
                                }
                                if (typeof img === 'string') {
                                    return img;
                                }
                                return null;
                            }).filter((url: string | null): url is string => typeof url === 'string') : [],
                            likes: eventData.favorites?.length || 0,
                            comments: eventData.comments?.length || 0,
                            isLiked: likeStatus.isLiked,
                            favoriteId: likeStatus.favoriteId
                        };
                    } catch (err) {
                        console.error('Error fetching event detail:', err);
                        return null;
                    }
                }));

                // Lọc bỏ các sự kiện null (nếu có lỗi khi lấy chi tiết)
                const validPosts = transformedPosts.filter(post => post !== null);
                setEvents(validPosts as EventPost[]);
            }
        } catch (error: any) {
            console.error('Error fetching posts:', error);
            const message = error.response?.data?.message || 'Không thể tải danh sách sự kiện';
            Alert.alert('Lỗi', message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle pull-to-refresh
    const handleRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const filteredPosts = events.filter(post => {
        const matchesSearch = post.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesScope = selectedScope === 'Tất cả' || post.scope === selectedScope;
        return matchesSearch && matchesScope;
    });    // Handle like for an event
    const toggleLike = async (eventId: string) => {
        try {
            const event = events.find(e => e.id === eventId);
            if (!event) return;

            // Optimistically update UI
            setEvents(events.map(e => e.id === eventId ? {
                ...e,
                isLiked: !e.isLiked,
                likes: e.isLiked ? e.likes - 1 : e.likes + 1
            } : e));

            if (event.isLiked) {
                if (event.favoriteId) {
                    await eventApi.unlikeEvent(event.favoriteId);
                }
            } else {
                const response = await eventApi.likeEvent(eventId);
                if (response.data?._id) {
                    // Update the favorite ID after successful like
                    setEvents(events.map(e => e.id === eventId ? {
                        ...e,
                        favoriteId: response.data._id
                    } : e));
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');

            // Revert UI change on error
            const event = events.find(e => e.id === eventId);
            if (event) {
                setEvents(events.map(e => e.id === eventId ? {
                    ...e,
                    isLiked: event.isLiked,
                    likes: event.isLiked ? event.likes : event.likes - 1
                } : e));
            }
        }
    };

    // Handle double tap
    const handleDoubleTap = (eventId: string) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTap[eventId] && (now - lastTap[eventId]) < DOUBLE_TAP_DELAY) {
            // It's a double tap - like the post if not already liked
            const event = events.find(e => e.id === eventId);
            if (event && !event.isLiked) {
                toggleLike(eventId);
                animateHeart(eventId);
            } else if (event && event.isLiked) {
                // Just animate the heart for visual feedback
                animateHeart(eventId);
            }
        }

        // Update last tap time
        setLastTap({ ...lastTap, [eventId]: now });
    };

    // Animate heart when double-tapped
    const animateHeart = (eventId: string) => {
        if (!heartAnimations[eventId]) {
            heartAnimations[eventId] = new Animated.Value(0);
        }

        heartAnimations[eventId].setValue(0);

        Animated.sequence([
            Animated.timing(heartAnimations[eventId], {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.delay(500),
            Animated.timing(heartAnimations[eventId], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start();
    };

    const renderEventPost = ({ item }: { item: EventPost }) => {
        return (
            <View className="bg-white mb-4 rounded-lg overflow-hidden">
                {/* Post header */}
                <View className="p-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="mr-3">
                            <Image
                                source={require('@/assets/images/logo.png')}
                                className="w-10 h-10 rounded-full"
                            />
                        </View>
                        <View>
                            <Text className="font-medium text-gray-900">{item.chapterName}</Text>
                            <Text className="text-gray-500 text-sm">{item.title}</Text>
                        </View>
                    </View>
                </View>

                {/* Images with double-tap detection */}
                {item.images.length > 0 && (
                    <View className="relative">
                        <TouchableWithoutFeedback onPress={() => handleDoubleTap(item.id)}>
                            <View className="w-full h-72 bg-gray-100">
                                <FlatList
                                    data={item.images}
                                    keyExtractor={(_, index) => index.toString()}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    snapToInterval={width}
                                    snapToAlignment="center"
                                    decelerationRate="fast"
                                    style={{ width: width, height: 288 }}
                                    getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                                    renderItem={({ item: image }) => (
                                        <View style={{ flex: 1 }}>
                                            <Image
                                                source={{ uri: image }}
                                                style={{ width: width, height: 288 }}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                    onMomentumScrollEnd={(e) => {
                                        const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                                        setActiveImageIndex(prev => ({ ...prev, [item.id]: newIndex }));
                                    }}
                                />

                                {/* Animated heart overlay */}
                                <Animated.View
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{
                                        opacity: heartAnimations[item.id] || 0,
                                        transform: [{
                                            scale: heartAnimations[item.id]?.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0, 1.2, 1]
                                            }) || 1
                                        }]
                                    }}
                                >
                                    <Ionicons name="heart" size={80} color="white" />
                                </Animated.View>

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
                        </TouchableWithoutFeedback>
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

                        <View className="flex-row items-center mb-2">
                            <Ionicons name="flag-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-sm">{item.status}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    {item.description && (
                        <View className="bg-gray-50 rounded-lg p-3">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="information-circle-outline" size={16} color="#666" />
                                <Text className="text-sm font-medium ml-2 text-gray-600">
                                    Mô tả
                                </Text>
                            </View>
                            <Text className="text-gray-900">{item.description}</Text>
                        </View>
                    )}
                </View>

                {/* Post actions with improved like animation */}
                <View className="flex-row justify-between px-4 pb-4">
                    <View className="flex-row">
                        <TouchableOpacity
                            className="flex-row items-center mr-4"
                            onPress={() => {
                                toggleLike(item.id);
                                if (!item.isLiked) {
                                    animateHeart(item.id);
                                }
                            }}
                        >
                            <Animated.View
                                style={{
                                    transform: [{
                                        scale: item.isLiked ? heartAnimations[item.id]?.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [1, 1.2, 1]
                                        }) || 1 : 1
                                    }]
                                }}
                            >
                                <Ionicons
                                    name={item.isLiked ? "heart" : "heart-outline"}
                                    size={24}
                                    color={item.isLiked ? "#ef4444" : "#666"}
                                />
                            </Animated.View>
                            <Text className="ml-1 text-gray-600">{item.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-row items-center"
                            onPress={() => {
                                setSelectedEventId(item.id);
                                setCommentModalVisible(true);
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={22} color="#666" />
                            <Text className="ml-1 text-gray-600">{item.comments}</Text>
                        </TouchableOpacity>
                    </View>

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
            </View>
        );
    }; return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" />            {/* Header */}
            <View style={{ 
                backgroundColor: '#3E4FF5', // Changed from '#3B82F6' 
                padding: 16
            }}>
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Bảng tin sự kiện</Text>
                    <TouchableOpacity>
                        <Ionicons name="search-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={events}
                renderItem={renderEventPost}
                keyExtractor={item => item.id}
                className="flex-1"
                contentContainerClassName="p-4"
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />            {/* Comments Section (Modal) */}
            {selectedEventId && (
                <CommentsSection
                    eventId={selectedEventId}
                    showModal={commentModalVisible}
                    onCloseModal={() => {
                        setCommentModalVisible(false);
                        // Refresh the events list to get updated comment counts
                        fetchEvents();
                    }}
                    onCommentCountChange={(count) => {
                        // Update the comment count in the events list
                        setEvents(events.map(e =>
                            e.id === selectedEventId ? { ...e, comments: count } : e
                        ));
                    }}
                />
            )}

            {/* Share Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={shareModalVisible}
                onRequestClose={() => {
                    setShareModalVisible(false);
                }}
            >
                <View className="flex-1 justify-end">
                    <TouchableOpacity
                        className="flex-1 bg-black bg-opacity-50"
                        onPress={() => setShareModalVisible(false)}
                    />
                    <View className="bg-white rounded-t-xl">
                        <View className="p-4">
                            <Text className="text-lg font-medium mb-4">Chia sẻ</Text>
                            {/* Add share options here */}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default EventPostList;
