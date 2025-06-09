import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type EventRegistration = {
    _id: string;
    userId: string;
    eventId: {
        _id: string;
        name: string;
        description: string;
        location: string;
        startedAt: string;
        endedAt?: string;
        scope: string;
        status: string;
        images: { url: string; public_id: string; }[];
    };
    createdAt: string;
    updatedAt: string;
    checkedIn: boolean;
};

const formatEventTime = (startedAt: string, endedAt?: string) => {
    const startDate = new Date(startedAt);
    const formattedStart = startDate.toLocaleString('vi-VN');

    if (!endedAt) return formattedStart;

    const endDate = new Date(endedAt);
    const formattedEnd = endDate.toLocaleString('vi-VN');
    return `${formattedStart} - ${formattedEnd}`;
};

const MyEventsScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<EventRegistration[]>([]);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getEventRegistrations();

            if (response?.data?.data) {
                setEvents(response.data.data);
            } else {
                console.error('Invalid response format:', response);
                Alert.alert('Lỗi', 'Không thể tải dữ liệu sự kiện');
            }
        } catch (error: any) {
            console.error('Error fetching my events:', error);
            if (error.response?.status === 404) {
                // Không có sự kiện nào trong database
                setEvents([]);
            } else {
                // Lỗi kết nối hoặc lỗi khác
                const message = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
                Alert.alert('Lỗi', message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUnregister = async (eventId: string) => {
        try {
            await eventApi.unregisterEvent(eventId);
            Alert.alert('Thành công', 'Đã hủy đăng ký tham gia sự kiện');
            // Refresh events list
            fetchMyEvents();
        } catch (error) {
            console.error('Error unregistering from event:', error);
            Alert.alert('Lỗi', 'Không thể hủy đăng ký. Vui lòng thử lại.');
        }
    }; const renderEventItem = ({ item }: { item: EventRegistration }) => (
        <View className="bg-white p-4 mb-4 rounded-lg shadow-sm">
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <Text className="font-bold text-lg text-gray-900">{item.eventId.name}</Text>

                    <View className="mt-2">
                        <View className="flex-row items-center mb-1">
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text className="text-gray-600 ml-2">
                                {formatEventTime(item.eventId.startedAt, item.eventId.endedAt)}
                            </Text>
                        </View>

                        <View className="flex-row items-center mb-1">
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text className="text-gray-600 ml-2">{item.eventId.location}</Text>
                        </View>                    <View className="flex-row items-center mb-1">
                            <Ionicons name="people-outline" size={16} color="#666" />
                            <Text className="text-gray-600 ml-2">{item.eventId.scope}</Text>
                        </View>

                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
                            <Text className="text-gray-600 ml-2">
                                {item.checkedIn ? 'Đã điểm danh' : 'Chưa điểm danh'}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    className="bg-red-100 p-2 rounded-lg"
                    onPress={() => {
                        Alert.alert(
                            "Xác nhận hủy đăng ký",
                            "Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không?",
                            [
                                { text: "Hủy", style: "cancel" },
                                {
                                    text: "Xác nhận",
                                    style: "destructive",
                                    onPress: () => handleUnregister(item.eventId._id)
                                }
                            ]
                        );
                    }}
                >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-2 text-gray-600">Đang tải sự kiện...</Text>
            </View>
        );
    }

    if (events.length === 0) {
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
                            Sự kiện của tôi
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>
                </View>
                <View className="flex-1 justify-center items-center p-4">
                    <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                    <Text className="text-gray-500 text-lg mt-4 text-center">
                        Bạn chưa đăng ký tham gia sự kiện nào
                    </Text>
                </View>
            </SafeAreaView>
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
                        Sự kiện của tôi
                    </Text>
                    <TouchableOpacity>
                        <Ionicons name="search-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>        {/* Event list */}
            <FlatList
                data={events}
                renderItem={renderEventItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={fetchMyEvents}
            />
        </SafeAreaView>
    );
};

export default MyEventsScreen;
