import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

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

type Comment = {
    id: string;
    text: string;
    user: string;
    userAvatar?: string;
    time: string;
};

const EventPostList = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<EventPost[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedScope, setSelectedScope] = useState('Tất cả');
    const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});
    // Track favorite IDs for each post to handle unlike operations
    const [favoriteIds, setFavoriteIds] = useState<{ [key: string]: string }>({});

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

    const fetchEvents = async () => {
        try {
            setLoading(true);

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
                            description: eventData.description || '',
                            images: eventData.images ? eventData.images.map((img: any) => {
                                // If the image is already a string URL, return it directly
                                if (typeof img === 'string') return img;

                                // If the image is an object, check for secure_url or url
                                if (typeof img === 'object' && img !== null) {
                                    // Cloudinary typically uses secure_url
                                    if (img.secure_url) return img.secure_url;
                                    // Fallback to url property
                                    if (img.url) return img.url;
                                    // If there's a raw URL in the first level
                                    if (img.raw) return img.raw;
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
        }
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

            if (event.isLiked) {
                if (event.favoriteId) {
                    await eventApi.unlikeEvent(event.favoriteId);
                }
                setEvents(events.map(e => e.id === eventId ? { ...e, isLiked: false, likes: e.likes - 1 } : e));
            } else {
                const response = await eventApi.likeEvent(eventId);
                if (response.data?._id) {
                    setEvents(events.map(e => e.id === eventId ? {
                        ...e,
                        isLiked: true,
                        likes: e.likes + 1,
                        favoriteId: response.data._id
                    } : e));
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
        }
    };    // Handle comment submit
    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !selectedEventId) return;
        try {
            const response = await eventApi.addComment(selectedEventId, commentText.trim());
            if (response.data?.success) {
                // Add new comment to the list
                const newComment: Comment = {
                    id: response.data.id,
                    text: commentText.trim(),
                    user: 'Current User', // Replace with actual user name
                    time: new Date().toISOString(),
                };
                setComments([newComment, ...comments]);
                setCommentText('');

                // Update post's comment count
                setEvents(events.map(e =>
                    e.id === selectedEventId
                        ? { ...e, comments: e.comments + 1 }
                        : e
                ));

                setCommentModalVisible(false);
                Alert.alert('Thành công', 'Đã thêm bình luận');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại.');
        }
    };

    const renderEventPost = ({ item }: { item: EventPost }) => {
        if (loading) {
            return (
                <View className="flex-1 justify-center items-center bg-gray-100">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-2 text-gray-600">Đang tải bài viết...</Text>
                </View>
            );
        }

        return (
            <View className="bg-white rounded-lg shadow-sm mb-4">
                {/* Header */}
                <View className="flex-row justify-between items-center p-4">
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

                {/* Images */}
                {item.images.length > 0 && (
                    <View className="relative">
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={(e) => {
                                const offset = e.nativeEvent.contentOffset.x;
                                const newIndex = Math.round(offset / width);
                                setActiveImageIndex({ ...activeImageIndex, [item.id]: newIndex });
                            }}
                            scrollEventThrottle={16}
                        >
                            {item.images.map((image, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: image }}
                                    className="w-full h-64"
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>

                        {item.images.length > 1 && (
                            <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                                {item.images.map((_, index) => {
                                    const isActive = (activeImageIndex[item.id] || 0) === index;
                                    return (
                                        <View
                                            key={index}
                                            className={`h-2 mx-1 rounded-full ${isActive ? 'w-4 bg-blue-500' : 'w-2 bg-white opacity-70'}`}
                                        />
                                    );
                                })}
                            </View>
                        )}
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
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar />
            <FlatList
                data={events}
                renderItem={renderEventPost}
                keyExtractor={item => item.id}
                className="flex-1"
                contentContainerClassName="p-4"
            />

            {/* Comment Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={commentModalVisible}
                onRequestClose={() => {
                    setCommentModalVisible(false);
                }}
            >
                <View className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                        <Text className="text-lg font-medium">Bình luận</Text>
                        <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={comments}
                        renderItem={({ item: comment }) => (
                            <View className="p-4 border-b border-gray-100">
                                <View className="flex-row items-center mb-2">
                                    <Image source={
                                        comment.userAvatar
                                            ? { uri: comment.userAvatar }
                                            : require('@/assets/images/avatar-placeholder.png')
                                    }
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <View className="ml-3">
                                        <Text className="font-medium">{comment.user}</Text>
                                        <Text className="text-gray-500 text-sm">{comment.time}</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-900">{comment.text}</Text>
                            </View>
                        )}
                        keyExtractor={comment => comment.id}
                        contentContainerClassName="pb-20"
                    />

                    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                        <View className="flex-row">
                            <TextInput
                                className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
                                placeholder="Viết bình luận..."
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                            />
                            <TouchableOpacity
                                className="justify-center px-4"
                                onPress={handleCommentSubmit}
                            >
                                <Ionicons name="send" size={24} color="#3b82f6" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
