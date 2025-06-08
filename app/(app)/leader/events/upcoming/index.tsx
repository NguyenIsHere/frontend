import { eventApi } from '@/api';
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
} from 'react-native';

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
};

type Comment = {
    id: number;
    text: string;
    user: string;
    time: string;
    avatar?: string;
    likes?: number;
    isLiked?: boolean;
};

interface ExpandableTextProps {
    text: string;
    maxLength?: number;
}

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
};

const UpcomingScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});

    // Mock contacts for share feature
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
    }, []); const fetchUpcomingEvents = async () => {
        try {
            setLoading(true);
            const defaultParams = {
                page: 1,
                limit: 20,
                status: 'Sắp diễn ra',
                sort: 'time',
                order: 'asc'
            };

            const response = await eventApi.getUpcomingEvents(defaultParams);

            if (!response?.data?.data?.docs) {
                console.error('Invalid API response format:', response.data);
                throw new Error('Invalid response format');
            }

            const eventDocs = response.data.data.docs;
            setUpcomingEvents(eventDocs.map((event: any) => ({
                id: event.id || '',
                chapterName: event.chapterName || 'Không có tên',
                title: event.title || 'Không có tiêu đề',
                time: event.time || 'Chưa cập nhật',
                location: event.location || 'Chưa cập nhật',
                scope: event.scope || 'Chi đoàn',
                description: event.description || '',
                participants: event.participants || '',
                requirements: event.requirements || '',
                images: event.images || [],
                likes: event.likes || 0,
                comments: event.comments || 0,
                isLiked: event.isLiked || false,
                isRegistered: event.isRegistered || false
            })));

        } catch (error: any) {
            console.error('Error fetching upcoming events:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: error?.config
            });

            if (error.message === 'Invalid response format') {
                Alert.alert('Lỗi', 'Không thể đọc dữ liệu từ máy chủ');
            } else {
                Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Register/unregister for an event
    const toggleRegistration = async (id: string) => {
        try {
            const event = upcomingEvents.find(e => e.id === id);
            if (!event) return;

            if (!event.isRegistered) {
                await eventApi.registerEvent(id);
                Alert.alert(
                    "Đăng ký thành công",
                    `Bạn đã đăng ký tham gia sự kiện "${event.title}".`
                );
            } else {
                await eventApi.unregisterEvent(id);
                Alert.alert(
                    "Hủy đăng ký",
                    `Bạn đã hủy đăng ký tham gia sự kiện "${event.title}".`
                );
            }

            // Refresh events list
            fetchUpcomingEvents();
        } catch (error) {
            console.error('Error toggling registration:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
        }
    };

    // Handle like for an event
    const toggleLike = async (id: string) => {
        try {
            await eventApi.toggleLike(id);
            // Refresh events to get updated like status
            fetchUpcomingEvents();
        } catch (error) {
            console.error('Error toggling like:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
        }
    };

    // Toggle like for a comment
    const toggleCommentLike = async (eventId: string, commentId: number) => {
        // In a real app, you would implement this with an API call
        setComments(prevComments => ({
            ...prevComments,
            [eventId]: prevComments[eventId].map(comment =>
                comment.id === commentId
                    ? {
                        ...comment,
                        isLiked: !comment.isLiked,
                        likes: (comment.likes || 0) + (comment.isLiked ? -1 : 1)
                    }
                    : comment
            )
        }));
    };

    // Handle comment submit
    const handleCommentSubmit = async () => {
        if (commentText.trim() && selectedEventId) {
            try {
                await eventApi.addComment(selectedEventId, commentText.trim());
                setCommentText('');
                // Refresh events to get updated comments
                fetchUpcomingEvents();
            } catch (error) {
                console.error('Error adding comment:', error);
                Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại.');
            }
        }
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
    };

    // Render an upcoming event item
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
                            <Text className="font-bold text-gray-900">{item.chapterName}</Text>
                            <Text className="text-xs text-gray-500">{item.time}</Text>
                        </View>
                    </View>

                    {/* Register button */}
                    <TouchableOpacity
                        className={`px-3 py-1.5 rounded-full ${item.isRegistered ? 'bg-gray-200' : 'bg-blue-600'}`}
                        onPress={() => toggleRegistration(item.id)}
                    >
                        <Text className={`font-medium text-sm ${item.isRegistered ? 'text-gray-700' : 'text-white'}`}>
                            {item.isRegistered ? 'Đã đăng ký' : 'Đăng ký'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Post title */}
                <View className="px-4 mb-2">
                    <Text className="font-bold text-lg text-gray-900">{item.title}</Text>
                </View>

                {/* Image carousel */}
                {item.images && item.images.length > 0 && (
                    <View>
                        <FlatList
                            data={item.images}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={e => {
                                const index = Math.round(
                                    e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
                                );
                                setActiveImageIndex(prev => ({
                                    ...prev,
                                    [item.id]: index
                                }));
                            }}
                            renderItem={({ item: image, index }) => (
                                <Image source={{ uri: image }} className="w-full aspect-square" />
                            )}
                        />
                        {/* Image counter */}
                        <View className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded">
                            <Text className="text-white text-xs">
                                {(activeImageIndex[item.id] || 0) + 1}/{item.images.length}
                            </Text>
                        </View>
                        {/* Image dots */}
                        <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                            {item.images.map((_, index) => {
                                const isActive = (activeImageIndex[item.id] || 0) === index;
                                return (
                                    <View
                                        key={index}
                                        className={`h-2 mx-1 rounded-full ${isActive
                                            ? 'w-4 bg-blue-500'
                                            : 'w-2 bg-white/70'
                                            }`}
                                    />
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Post content */}
                <View className="p-4">
                    {/* Time, Location, Scope, Participants and Requirements */}
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
                            <Ionicons name="people-circle-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-sm">{item.participants}</Text>
                        </View>

                        <View className="flex-row items-center mb-3">
                            <Ionicons name="list-outline" size={16} color="#666" />
                            <Text className="ml-1 text-gray-500 text-sm">{item.requirements}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View className="bg-gray-50 rounded-lg p-3">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="information-circle-outline" size={16} color="#666" />
                            <Text className="text-sm font-medium ml-2 text-gray-600">Mô tả</Text>
                        </View>
                        <Text className="text-gray-900">{item.description}</Text>
                    </View>
                </View>

                {/* Post actions */}
                <View className="flex-row justify-between px-4 pt-3">
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
                    <Text className="text-white text-xl font-bold">
                        Sự kiện sắp diễn ra
                    </Text>
                    <TouchableOpacity>
                        <Ionicons name="search-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Event list */}
            <FlatList
                data={upcomingEvents}
                keyExtractor={(item) => item.id}
                renderItem={renderEventItem}
                contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Comment Modal */}
            <Modal
                visible={commentModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCommentModalVisible(false)}
            >
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-white rounded-t-2xl">
                        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
                            <Text className="text-xl font-bold">Bình luận</Text>
                            <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                                <Ionicons name="close-outline" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Comment list */}
                        <FlatList
                            data={selectedEventId ? comments[selectedEventId] || [] : []}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <View className="flex-row mb-4">
                                    <Image
                                        source={{ uri: item.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <View className="ml-3 flex-1">
                                        <View className="bg-gray-100 p-3 rounded-2xl">
                                            <Text className="font-bold text-gray-900">{item.user}</Text>
                                            <Text className="text-gray-900">{item.text}</Text>
                                        </View>
                                        <View className="flex-row mt-1 items-center">
                                            <Text className="text-gray-500 text-xs">{item.time}</Text>
                                            <TouchableOpacity
                                                className="ml-4 flex-row items-center"
                                                onPress={() => selectedEventId && toggleCommentLike(selectedEventId, item.id)}
                                            >
                                                <Text className="text-gray-500 text-xs mr-1">Thích</Text>
                                                {item.isLiked && <Ionicons name="heart" size={12} color="#ef4444" />}
                                            </TouchableOpacity>
                                            {(item.likes || 0) > 0 && (
                                                <View className="ml-2 flex-row items-center">
                                                    <Ionicons name="heart" size={12} color="#ef4444" />
                                                    <Text className="text-gray-500 text-xs ml-1">{item.likes}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}
                        />

                        {/* Comment input */}
                        <View className="p-3 border-t border-gray-200 flex-row items-center">
                            <TextInput
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2"
                                placeholder="Viết bình luận..."
                                value={commentText}
                                onChangeText={setCommentText}
                            />
                            <TouchableOpacity
                                className={`rounded-full p-2 ${commentText.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}
                                onPress={handleCommentSubmit}
                                disabled={!commentText.trim()}
                            >
                                <Ionicons name="send" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xl font-bold">Chia sẻ</Text>
                                <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                    <Ionicons name="close-outline" size={24} color="black" />
                                </TouchableOpacity>
                            </View>

                            {/* Search bar */}
                            <View className="bg-gray-100 rounded-lg flex-row items-center px-3 py-2">
                                <Ionicons name="search-outline" size={20} color="#666" />
                                <TextInput
                                    className="flex-1 ml-2"
                                    placeholder="Tìm kiếm người dùng"
                                    value={searchContact}
                                    onChangeText={setSearchContact}
                                />
                            </View>
                        </View>

                        {/* Contact list */}
                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
                                    <Image
                                        source={{ uri: item.avatar }}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <Text className="ml-3 font-medium text-gray-900">{item.name}</Text>
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
