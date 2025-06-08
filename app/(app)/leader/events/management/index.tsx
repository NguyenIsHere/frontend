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
            // Mock data for testing
            const mockEvents: Event[] = [
                {
                    id: '1',
                    title: 'Chiến dịch Mùa hè xanh 2025',
                    time: '07:00 - 17:00, 15/06/2025',
                    location: 'Xã Tân Phú, Huyện Tân Châu, Tỉnh Tây Ninh',
                    status: 'Sắp diễn ra',
                    scope: 'Chi đoàn'
                },
                {
                    id: '2',
                    title: 'Hiến máu nhân đạo đợt 1/2025',
                    time: '07:00 - 11:00, 10/06/2025',
                    location: 'Trường Đại học Khoa học Tự nhiên',
                    status: 'Sắp diễn ra',
                    scope: 'Công khai'
                },
                {
                    id: '3',
                    title: 'Lễ kết nạp đoàn viên mới',
                    time: '14:00 - 16:00, 26/05/2025',
                    location: 'Hội trường A1',
                    status: 'Đã kết thúc',
                    scope: 'Chi đoàn'
                }
            ];
            setEvents(mockEvents);
        } catch (error: any) {
            console.error('Error fetching events:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách sự kiện');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDeleteEvent = async (id: string) => {
        try {
            await eventApi.deleteEvent(id);
            Alert.alert('Thành công', 'Đã xóa sự kiện');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            Alert.alert('Lỗi', 'Không thể xóa sự kiện');
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'Tất cả' || event.status === selectedStatus;
        const matchesScope = selectedScope === 'Tất cả' || event.scope === selectedScope;
        return matchesSearch && matchesStatus && matchesScope;
    });

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
                    <Text className="text-gray-600 text-sm ml-1">{item.time}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text className="text-gray-600 text-sm ml-1">{item.location}</Text>
                </View>
            </View>
            <TouchableOpacity
                className="bg-red-100 p-2 rounded-lg"
                onPress={() =>
                    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa sự kiện này?', [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Xóa', onPress: () => handleDeleteEvent(item.id) },
                    ])
                }
            >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-2 text-gray-600">Đang tải danh sách sự kiện...</Text>
            </View>
        );
    }

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
                        <Ionicons name="filter" size={20} color="#374151" />
                    </TouchableOpacity>
                </View>

                {/* Active filters */}
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
            </View>

            {/* Event list */}
            <FlatList
                className="px-4"
                data={filteredEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
            />

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
                                <Text className="text-xl font-bold">Lọc sự kiện</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                    <Ionicons name="close-outline" size={24} color="black" />
                                </TouchableOpacity>
                            </View>

                            {/* Status filter */}
                            <View className="mt-4">
                                <Text className="text-lg font-semibold mb-2">Trạng thái</Text>
                                <View className="flex-row flex-wrap">
                                    {['Tất cả', 'Sắp diễn ra', 'Đang diễn ra', 'Đã kết thúc'].map(
                                        (status) => (
                                            <TouchableOpacity
                                                key={status}
                                                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${selectedStatus === status
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'bg-white border-gray-300'
                                                    }`}
                                                onPress={() => setSelectedStatus(status)}
                                            >
                                                <Text
                                                    className={
                                                        selectedStatus === status
                                                            ? 'text-white'
                                                            : 'text-gray-700'
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
                                <Text className="text-lg font-semibold mb-2">Phạm vi</Text>
                                <View className="flex-row flex-wrap">
                                    {['Tất cả', 'Chi đoàn', 'Công khai'].map((scope) => (
                                        <TouchableOpacity
                                            key={scope}
                                            className={`mr-2 mb-2 px-4 py-2 rounded-full border ${selectedScope === scope
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'bg-white border-gray-300'
                                                }`}
                                            onPress={() => setSelectedScope(scope)}
                                        >
                                            <Text
                                                className={
                                                    selectedScope === scope
                                                        ? 'text-white'
                                                        : 'text-gray-700'
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
