import { eventApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Define the event type
type Event = {
    id: string;
    title: string;
    time: string;
    location: string;
    status: string;
    scope: string;
};

const ManagementEventList = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('Tất cả');
    const [selectedScope, setSelectedScope] = useState('Tất cả');

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getEvents({
                page: 1,
                limit: 20
            });

            if (!response?.data?.data) {
                console.error('Invalid API response format:', response);
                throw new Error('Invalid response format');
            }

            // Map API response to our Event type
            const eventData = Array.isArray(response.data.data)
                ? response.data.data
                : response.data.data.docs || [];

            console.log('Raw event data:', eventData[0]);

            const mappedEvents = eventData.map((event: any) => ({
                id: event._id, // Keep original _id
                title: event.name || 'Không có tiêu đề',
                time: event.startedAt ? new Date(event.startedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật',
                location: event.location || 'Chưa cập nhật',
                status: event.status || 'pending',
                scope: event.scope || 'Chi đoàn'
            }));

            console.log("Mapped event:", mappedEvents[0]);
            setEvents(mappedEvents);

        } catch (error: any) {
            console.error('Error fetching events:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            Alert.alert('Lỗi', 'Không thể tải danh sách sự kiện');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'Tất cả' || event.status === selectedStatus;
        const matchesScope = selectedScope === 'Tất cả' || event.scope === selectedScope;
        return matchesSearch && matchesStatus && matchesScope;
    });

    const handleDeleteEvent = async (id: string) => {
        try {
            await eventApi.deleteEvent(id);
            Alert.alert('Thành công', 'Đã xóa sự kiện');
            fetchEvents(); // Refresh list after delete
        } catch (error: any) {
            console.error('Error deleting event:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa sự kiện');
        }
    };

    const renderEventItem = ({ item }: { item: Event }) => (
        <TouchableOpacity
            className="bg-white p-4 mb-2 rounded-lg flex-row items-center"
            onPress={() =>
                router.push({
                    pathname: '/(app)/leader/events/management/detail',
                    params: { eventId: item.id },
                })
            }
        >
            <View className="flex-1">
                <Text className="font-bold text-base">{item.title}</Text>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.time}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.location}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.status}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text className="text-gray-600 ml-1">{item.scope}</Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => {
                    Alert.alert(
                        "Xác nhận xóa",
                        "Bạn có chắc chắn muốn xóa sự kiện này không?",
                        [
                            { text: "Hủy", style: "cancel" },
                            { text: "Xóa", style: "destructive", onPress: () => handleDeleteEvent(item.id) }
                        ]
                    );
                }}
            >
                <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const NoEventsMessage = () => (
        <View className="flex-1 justify-center items-center py-8">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-base">Chưa có sự kiện nào</Text>
            <Text className="text-gray-400 mt-1 text-sm">Nhấn vào nút + để tạo sự kiện mới</Text>
        </View>
    );

    const renderEventList = () => {
        if (loading) {
            return (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-2 text-gray-600">Đang tải sự kiện...</Text>
                </View>
            );
        }

        if (events.length === 0) {
            return <NoEventsMessage />;
        }

        if (filteredEvents.length === 0) {
            return (
                <View className="flex-1 justify-center items-center py-8">
                    <Text className="text-gray-500">Không tìm thấy sự kiện nào phù hợp</Text>
                </View>
            );
        }

        return (
            <FlatList
                className="px-4"
                data={filteredEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
            />
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* Header */}
            <View className="bg-blue-600 p-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Danh sách sự kiện</Text>
                <TouchableOpacity
                    onPress={() => router.push('/(app)/leader/events/management/create')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Search and filter bar */}
            <View className="p-4">
                <View className="flex-row items-center mb-2">
                    <View className="flex-1 mr-2">
                        <TextInput
                            className="border border-gray-300 p-3 rounded-lg bg-white"
                            placeholder="Tìm kiếm sự kiện"
                            placeholderTextColor="#6B7280"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        className="bg-gray-200 p-3 rounded-lg"
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <Ionicons name="filter" size={24} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                {/* Active filters */}
                {(selectedStatus !== 'Tất cả' || selectedScope !== 'Tất cả') && (
                    <View className="flex-row flex-wrap">
                        {selectedStatus !== 'Tất cả' && (
                            <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                                <Text className="text-blue-800 mr-1">Trạng thái: {selectedStatus}</Text>
                                <TouchableOpacity onPress={() => setSelectedStatus('Tất cả')}>
                                    <Ionicons name="close-circle" size={16} color="#1e40af" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {selectedScope !== 'Tất cả' && (
                            <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                                <Text className="text-blue-800 mr-1">Phạm vi: {selectedScope}</Text>
                                <TouchableOpacity onPress={() => setSelectedScope('Tất cả')}>
                                    <Ionicons name="close-circle" size={16} color="#1e40af" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {renderEventList()}

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-white rounded-t-2xl">
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-xl font-bold">Bộ lọc</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                    <Ionicons name="close-outline" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>

                            {/* Status filter */}
                            <View className="mt-4">
                                <Text className="font-bold text-gray-900 mb-2">Trạng thái</Text>
                                <View className="flex-row flex-wrap -mx-1">
                                    {['Tất cả', 'Sắp diễn ra', 'Đang diễn ra', 'Đã kết thúc', 'Đã hủy'].map(
                                        (status) => (
                                            <TouchableOpacity
                                                key={status}
                                                className={`m-1 rounded-full px-3 py-1 ${selectedStatus === status
                                                    ? 'bg-blue-600'
                                                    : 'bg-gray-200'
                                                    }`}
                                                onPress={() => setSelectedStatus(status)}
                                            >
                                                <Text
                                                    className={
                                                        selectedStatus === status
                                                            ? 'text-white'
                                                            : 'text-gray-800'
                                                    }
                                                >
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    )}
                                </View>
                            </View>

                            {/* Scope filter */}
                            <View className="mt-4">
                                <Text className="font-bold text-gray-900 mb-2">Phạm vi</Text>
                                <View className="flex-row flex-wrap -mx-1">
                                    {['Tất cả', 'Chi đoàn', 'Công khai'].map((scope) => (
                                        <TouchableOpacity
                                            key={scope}
                                            className={`m-1 rounded-full px-3 py-1 ${selectedScope === scope
                                                ? 'bg-blue-600'
                                                : 'bg-gray-200'
                                                }`}
                                            onPress={() => setSelectedScope(scope)}
                                        >
                                            <Text
                                                className={
                                                    selectedScope === scope
                                                        ? 'text-white'
                                                        : 'text-gray-800'
                                                }
                                            >
                                                {scope}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default ManagementEventList;
