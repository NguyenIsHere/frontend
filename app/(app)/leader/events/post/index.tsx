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
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Define the event post type
type EventPost = {
    id: string;
    chapterName: string;
    title: string;
    time: string;
    location: string;
    scope: 'Chi đoàn' | 'Công khai';
    status: 'Sắp diễn ra' | 'Đã kết thúc';
    description: string;
    participants: string;
    requirements: string;
    images: string[];
    likes: number;
    comments: number;
    isLiked: boolean;
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

const PostScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<EventPost[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedScope, setSelectedScope] = useState('Tất cả');
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});

    // Mock contacts for sharing - this would typically come from an API
    const contacts = [
        { id: '1', name: 'Nguyễn Văn A', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { id: '2', name: 'Trần Thị B', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: '3', name: 'Lê Hoàng C', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    ];

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchContact.toLowerCase())
    );

    useEffect(() => {
        fetchPosts();
    }, []); const fetchPosts = async () => {
        try {
            setLoading(true);
            // Get completed events
            const response = await eventApi.getEvents({ status: 'Đã kết thúc' }); if (response.data?.data?.docs) {
                const eventDocs = response.data.data.docs;
                if (eventDocs.length === 0) {
                    setPosts([]);
                } else {
                    setPosts(eventDocs.map((event: any) => ({
                        id: event.id,
                        chapterName: event.chapterName || '',
                        title: event.title,
                        time: event.time || '',
                        location: event.location || '',
                        scope: event.scope || 'Chi đoàn',
                        status: event.status || 'Đã kết thúc',
                        description: event.description || '',
                        participants: event.participants || '',
                        requirements: event.requirements || '',
                        images: event.images || [],
                        likes: event.likes || 0,
                        comments: event.comments || 0,
                        isLiked: event.isLiked || false
                    })));
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            console.error('Error fetching posts:', error);
            const message = error.response?.data?.message || 'Không thể tải danh sách sự kiện';
            Alert.alert('Lỗi', message);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesScope = selectedScope === 'Tất cả' || post.scope === selectedScope;
        return matchesSearch && matchesScope;
    });

    // Handle like for an event
    const toggleLike = async (id: string) => {
        try {
            await eventApi.toggleLike(id);
            // Refresh posts to get updated like status
            fetchPosts();
        } catch (error) {
            console.error('Error toggling like:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
        }
    };

    // Handle comment submit
    const handleCommentSubmit = async () => {
        if (commentText.trim() && selectedEventId) {
            try {
                await eventApi.addComment(selectedEventId, commentText.trim());
                setCommentText('');
                // Refresh posts to get updated comments
                fetchPosts();
            } catch (error) {
                console.error('Error adding comment:', error);
                Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại.');
            }
        }
    };

    // Render event post component
    const renderEventPost = ({ item }: { item: EventPost }) => (
        <View className="bg-white mb-4">
            {/* Header */}
            <View className="p-4 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.chapterName)}` }}
                        className="w-10 h-10 rounded-full"
                    />
                    <View className="ml-3">
                        <Text className="font-bold text-gray-900">{item.chapterName}</Text>
                        <Text className="text-gray-500 text-xs">{item.time}</Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Image carousel */}
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
                    renderItem={({ item: image }) => (
                        <Image source={{ uri: image }} className="w-full aspect-square" />
                    )}
                />

                {/* Image indicators */}
                {item.images.length > 1 && (
                    <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                        {item.images.map((_, index) => {
                            const isActive = (activeImageIndex[item.id] || 0) === index;
                            return (
                                <View
                                    key={index}
                                    className={`h-2 mx-1 rounded-full ${isActive ? 'w-4 bg-blue-500' : 'w-2 bg-white opacity-70'
                                        }`}
                                />
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Post content */}
            <View className="p-4">
                <Text className="font-bold text-lg text-gray-900 mb-3">{item.title}</Text>

                {/* Time, Location and Scope */}
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
                <View className="bg-gray-50 rounded-lg p-3">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="information-circle-outline" size={16} color="#666" />
                        <Text className="text-sm font-medium ml-2 text-gray-600">
                            Mô tả
                        </Text>
                    </View>
                    <Text className="text-gray-900">{item.description}</Text>
                </View>
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

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-2 text-gray-600">Đang tải bài viết...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View className="bg-blue-600 p-4">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">
                        Bảng tin
                    </Text>
                    <TouchableOpacity>
                        <Ionicons name="search-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search and filter */}
            <View className="p-4 bg-white border-b border-gray-200">
                <TextInput
                    className="bg-gray-100 rounded-lg px-4 py-2 mb-2"
                    placeholder="Tìm kiếm sự kiện..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />

                {/* Filter chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Tất cả', 'Chi đoàn', 'Công khai'].map(scope => (
                        <TouchableOpacity
                            key={scope}
                            onPress={() => setSelectedScope(scope)}
                            className={`px-4 py-2 rounded-full mr-2 ${selectedScope === scope ? 'bg-blue-100' : 'bg-gray-100'
                                }`}
                        >
                            <Text
                                className={
                                    selectedScope === scope ? 'text-blue-800' : 'text-gray-600'
                                }
                            >
                                {scope}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Event posts */}
            <FlatList
                data={filteredPosts}
                keyExtractor={(item) => item.id}
                renderItem={renderEventPost}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Comment Modal */}
            <Modal
                visible={commentModalVisible}
                transparent={true}
                animationType="slide"
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

                        {/* Comment input */}
                        <View className="p-4 border-t border-gray-200 flex-row items-center">
                            <TextInput
                                className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
                                placeholder="Viết bình luận..."
                                value={commentText}
                                onChangeText={setCommentText}
                            />
                            <TouchableOpacity
                                className={`p-2 rounded-full ${commentText.trim() ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
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

export default PostScreen;
