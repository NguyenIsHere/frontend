import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Type definitions
type Comment = {
    id: string;
    text: string;
    user: string;
    userAvatar?: string;
    time: string;
    userId?: string; // Store user ID to check if current user can delete the comment
};

type CommentsSectionProps = {
    eventId: string;
    showModal?: boolean;
    onCloseModal?: () => void;
    onCommentCountChange?: (count: number) => void;
};

const CommentsSection = ({
    eventId,
    showModal = false,
    onCloseModal,
    onCommentCountChange
}: CommentsSectionProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentModalVisible, setCommentModalVisible] = useState(showModal);

    useEffect(() => {
        if (eventId && (showModal || commentModalVisible)) {
            fetchComments();
        }
    }, [eventId, showModal]);

    useEffect(() => {
        setCommentModalVisible(showModal);
    }, [showModal]);    // Fetch comments for an event
    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const response = await eventApi.getComments(eventId);
            console.log('Comments API response:', JSON.stringify(response.data, null, 2));

            if (response.data?.data) {                // Transform API response to our Comment type
                const commentsData = response.data.data.map((comment: any) => {
                    console.log('Processing comment:', JSON.stringify(comment, null, 2));
                    return {
                        id: comment._id,
                        text: comment.comment || comment.text || 'No content',  // Support both 'comment' and 'text' field names
                        user: comment.userId?.fullName || comment.accountId?.fullName || 'Người dùng',
                        userAvatar: comment.userId?.avatar || comment.accountId?.avatar || undefined,
                        time: new Date(comment.createdAt).toLocaleString('vi-VN'),
                        userId: comment.userId?._id || comment.accountId?._id, // Store user ID to check if user can delete comment
                    };
                });
                console.log('Transformed comments:', JSON.stringify(commentsData, null, 2));
                setComments(commentsData);

                // Notify parent component about comment count
                if (onCommentCountChange) {
                    onCommentCountChange(commentsData.length);
                }
            } else {
                setComments([]);
                if (onCommentCountChange) {
                    onCommentCountChange(0);
                }
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            Alert.alert('Lỗi', 'Không thể tải bình luận. Vui lòng thử lại.');
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    };

    // Handle comment deletion
    const handleDeleteComment = async (commentId: string) => {
        try {
            Alert.alert(
                'Xác nhận',
                'Bạn có chắc chắn muốn xóa bình luận này?',
                [
                    {
                        text: 'Hủy',
                        style: 'cancel',
                    },
                    {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: async () => {
                            await eventApi.deleteComment(commentId);

                            // Remove comment from list
                            const updatedComments = comments.filter(c => c.id !== commentId);
                            setComments(updatedComments);

                            // Notify parent component about comment count
                            if (onCommentCountChange) {
                                onCommentCountChange(updatedComments.length);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error deleting comment:', error);
            Alert.alert('Lỗi', 'Không thể xóa bình luận. Vui lòng thử lại.');
        }
    };    // Handle comment submit
    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !eventId) return;
        try {
            // Make sure the comment is not empty
            const trimmedComment = commentText.trim();
            if (!trimmedComment) {
                Alert.alert('Lỗi', 'Nội dung bình luận không được để trống');
                return;
            }

            console.log('Submitting comment:', {
                eventId,
                comment: trimmedComment
            });

            const response = await eventApi.addComment(eventId, trimmedComment);
            console.log('Comment response:', JSON.stringify(response?.data, null, 2));

            if (response?.data && response.data.success !== false) {
                // Clear the input
                setCommentText('');

                // Refresh the comment list from server to get proper data
                fetchComments();

                // Show success message
                Alert.alert('Thành công', 'Đã thêm bình luận');
            } else {
                console.error('Comment submission failed:', response?.data);
                throw new Error(response?.data?.message || 'Không thể thêm bình luận');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại.');
        }
    };

    const closeModal = () => {
        setCommentModalVisible(false);
        if (onCloseModal) {
            onCloseModal();
        }
    };

    // Inline comments view (when not in modal)
    if (!showModal && !commentModalVisible) {
        return (
            <View className="mt-4">
                <View className="flex-row items-center mb-4">
                    <Ionicons name="chatbubble-outline" size={20} color="#4b5563" />
                    <Text className="ml-2 text-gray-700 font-medium">Bình luận ({comments.length})</Text>
                </View>

                {loadingComments ? (
                    <View className="py-4 items-center">
                        <ActivityIndicator size="small" color="#3b82f6" />
                        <Text className="text-gray-500 mt-2">Đang tải bình luận...</Text>
                    </View>
                ) : comments.length === 0 ? (
                    <View className="py-4 items-center">
                        <Text className="text-gray-500">Chưa có bình luận nào</Text>
                    </View>
                ) : (
                    <View>
                        {comments.slice(0, 3).map(comment => (
                            <View key={comment.id} className="mb-4 bg-gray-50 p-3 rounded-lg">
                                <View className="flex-row items-center mb-2">
                                    <Image
                                        source={comment.userAvatar
                                            ? { uri: comment.userAvatar }
                                            : require('@/assets/images/avatar-placeholder.png')
                                        }
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <View className="ml-2 flex-1">
                                        <Text className="font-medium text-sm">{comment.user}</Text>
                                        <Text className="text-gray-500 text-xs">{comment.time}</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-900">{comment.text}</Text>
                            </View>
                        ))}

                        {comments.length > 3 && (
                            <TouchableOpacity
                                className="mt-2 items-center"
                                onPress={() => setCommentModalVisible(true)}
                            >
                                <Text className="text-blue-600">Xem tất cả {comments.length} bình luận</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View className="flex-row mt-4 items-center">
                    <TextInput
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
                        placeholder="Viết bình luận..."
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                    />
                    <TouchableOpacity
                        className={`justify-center p-2 rounded-full bg-blue-600 ${!commentText.trim() ? 'opacity-50' : ''}`}
                        onPress={handleCommentSubmit}
                        disabled={!commentText.trim()}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Modal view for comments
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={commentModalVisible}
            onRequestClose={closeModal}
        >
            <View className="flex-1 bg-white">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                    <Text className="text-lg font-medium">Bình luận ({comments.length})</Text>
                    <TouchableOpacity onPress={closeModal}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {loadingComments ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-gray-500 mt-4">Đang tải bình luận...</Text>
                    </View>
                ) : comments.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                        <Text className="text-gray-500 mt-4">Chưa có bình luận nào</Text>
                        <Text className="text-gray-400 text-sm mt-1">Hãy là người đầu tiên bình luận</Text>
                    </View>
                ) : (
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
                                    <View className="ml-3 flex-1">
                                        <Text className="font-medium">{comment.user}</Text>
                                        <Text className="text-gray-500 text-xs">{comment.time}</Text>
                                    </View>

                                    {comment.userId && (
                                        <TouchableOpacity
                                            onPress={() => handleDeleteComment(comment.id)}
                                            className="p-2"
                                        >
                                            <Ionicons name="ellipsis-vertical" size={16} color="#666" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text className="text-gray-900">{comment.text}</Text>
                            </View>
                        )}
                        keyExtractor={comment => comment.id}
                        contentContainerClassName="pb-20"
                    />
                )}

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
                            className={`justify-center px-4 ${!commentText.trim() ? 'opacity-50' : ''}`}
                            onPress={handleCommentSubmit}
                            disabled={!commentText.trim()}
                        >
                            <Ionicons name="send" size={24} color="#3b82f6" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CommentsSection;
