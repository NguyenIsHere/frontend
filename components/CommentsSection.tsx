import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type Comment = {
    id: string;
    text: string;
    user: string;
    userAvatar?: string;
    time: string;
    userId?: string;
    likes: number;
    isLiked: boolean;
    likeId?: string;
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
    const [likeAnimations, setLikeAnimations] = useState<{ [key: string]: Animated.Value }>({});

    // Bottom sheet animation value
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Calculate snap point (80% of screen height)
    const snapPoint = SCREEN_HEIGHT * 0.8;

    // Pan responder for dragging
    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderGrant: () => {
            // Store the current position when starting to drag
            translateY.setOffset(translateY._value);
            translateY.setValue(0);
        },
        onPanResponderMove: Animated.event(
            [null, { dy: translateY }],
            { useNativeDriver: false }
        ),
        onPanResponderRelease: (_, gestureState) => {
            // Reset the offset
            translateY.flattenOffset();

            // If dragged down past threshold or with enough velocity, close modal
            if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                closeModal();
            } else {
                // Snap back to original position
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    bounciness: 4
                }).start();
            }
        }
    });

    useEffect(() => {
        if (eventId && showModal) {
            fetchComments();
        }
    }, [eventId, showModal]);

    // Animate the modal when it becomes visible
    useEffect(() => {
        if (showModal) {
            setCommentModalVisible(true);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 4
            }).start();
        } else {
            translateY.setValue(SCREEN_HEIGHT);
        }
    }, [showModal]);

    // Initialize like animations for each comment
    useEffect(() => {
        const animations: { [key: string]: Animated.Value } = {};
        comments.forEach(comment => {
            animations[comment.id] = new Animated.Value(1);
        });
        setLikeAnimations(animations);
    }, [comments]);

    // Fetch comments
    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const response = await eventApi.getComments(eventId);

            if (response.data?.data) {
                const commentsData = response.data.data.map((comment: any) => {
                    return {
                        id: comment._id,
                        text: comment.comment || comment.text || 'No content',
                        user: comment.userId?.fullName || comment.accountId?.fullName || 'Người dùng',
                        userAvatar: comment.userId?.avatar || comment.accountId?.avatar || undefined,
                        time: new Date(comment.createdAt).toLocaleString('vi-VN'),
                        userId: comment.userId?._id || comment.accountId?._id,
                        likes: comment.likes?.length || 0,
                        isLiked: comment.isLiked || false,
                        likeId: comment.likeId,
                    };
                });
                setComments(commentsData);
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
                            const updatedComments = comments.filter(c => c.id !== commentId);
                            setComments(updatedComments);
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
    };

    // Handle like on comment
    const handleLikeComment = async (commentId: string) => {
        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;

            setComments(comments.map(c => c.id === commentId ? {
                ...c,
                isLiked: !c.isLiked,
                likes: c.isLiked ? c.likes - 1 : c.likes + 1
            } : c));

            if (!comment.isLiked) {
                Animated.sequence([
                    Animated.timing(likeAnimations[commentId], {
                        toValue: 1.2,
                        duration: 150,
                        useNativeDriver: true
                    }),
                    Animated.timing(likeAnimations[commentId], {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    })
                ]).start();
            }

            if (comment.isLiked && comment.likeId) {
                await eventApi.unlikeComment(comment.likeId);
            } else {
                const response = await eventApi.likeComment(commentId);
                if (response.data?._id) {
                    setComments(comments.map(c => c.id === commentId ? {
                        ...c,
                        likeId: response.data._id
                    } : c));
                }
            }
        } catch (error) {
            console.error('Error toggling comment like:', error);
            const comment = comments.find(c => c.id === commentId);
            if (comment) {
                setComments(comments.map(c => c.id === commentId ? {
                    ...c,
                    isLiked: comment.isLiked,
                    likes: comment.isLiked ? comment.likes : comment.likes - 1
                } : c));
            }
        }
    };

    // Handle comment submit
    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !eventId) return;

        try {
            const trimmedComment = commentText.trim();
            if (!trimmedComment) {
                Alert.alert('Lỗi', 'Nội dung bình luận không được để trống');
                return;
            }

            const response = await eventApi.addComment(eventId, trimmedComment);

            if (response?.data && response.data.success !== false) {
                setCommentText('');
                fetchComments();
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
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            setCommentModalVisible(false);
            if (onCloseModal) {
                onCloseModal();
            }
        });
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={commentModalVisible}
            onRequestClose={closeModal}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <TouchableOpacity
                    activeOpacity={1}
                    className="flex-1 bg-black/50"
                    onPress={closeModal}
                >
                    <Animated.View
                        style={[
                            {
                                transform: [{ translateY }],
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: snapPoint,
                                backgroundColor: 'white',
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: -2
                                },
                                shadowOpacity: 0.1,
                                shadowRadius: 5,
                                elevation: 10
                            }
                        ]}
                    >
                        {/* Draggable handle */}
                        <View
                            {...panResponder.panHandlers}
                            className="w-full items-center py-2"
                        >
                            <View className="w-16 h-1 bg-gray-300 rounded-full" />
                        </View>

                        {/* Header */}
                        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                            <Text className="text-lg font-bold">Bình luận</Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Comments list */}
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
                                        <View className="flex-row justify-between">
                                            <View className="flex-row flex-1">
                                                <Image
                                                    source={
                                                        comment.userAvatar
                                                            ? { uri: comment.userAvatar }
                                                            : require('@/assets/images/avatar-placeholder.png')
                                                    }
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <View className="ml-3 flex-1">
                                                    <View className="flex-row items-start">
                                                        <Text className="font-bold text-sm mr-2">{comment.user}</Text>
                                                        <Text className="text-gray-900 text-sm flex-wrap flex-1">{comment.text}</Text>
                                                    </View>
                                                    <View className="flex-row items-center mt-2">
                                                        <Text className="text-gray-500 text-xs mr-4">{comment.time}</Text>
                                                        <TouchableOpacity onPress={() => handleLikeComment(comment.id)}>
                                                            <Animated.View style={{ transform: [{ scale: likeAnimations[comment.id] || 1 }] }}>
                                                                <Text className={`text-xs mr-4 ${comment.isLiked ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
                                                                    Thích {comment.likes > 0 && `(${comment.likes})`}
                                                                </Text>
                                                            </Animated.View>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
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
                                    </View>
                                )}
                                keyExtractor={comment => comment.id}
                                contentContainerStyle={{ paddingBottom: 80 }}
                            />
                        )}

                        {/* Comment input */}
                        <View className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-200 p-4">
                            <View className="flex-row items-center">
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
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CommentsSection;
