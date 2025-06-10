// Phần code trước hàm renderHeader, cần loại bỏ khoảng trắng và sửa thụt lề
if (loading) {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" />
            <View className="bg-blue-600 p-4">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-white/20 rounded-full p-2"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-xl font-bold text-center">
                            Chi tiết sự kiện
                        </Text>
                        <Text className="text-white text-xs text-center">
                            Đoàn Thanh niên - Hội Sinh viên
                        </Text>
                    </View>
                    <View className="w-[30px]" />
                </View>
            </View>
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</Text>
            </View>
        </SafeAreaView>
    );
}

if (!event) {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" />
            <View className="bg-blue-600 p-4">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-white/20 rounded-full p-2"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-xl font-bold text-center">
                            Chi tiết sự kiện
                        </Text>
                        <Text className="text-white text-xs text-center">
                            Đoàn Thanh niên - Hội Sinh viên
                        </Text>
                    </View>
                    <View className="w-[30px]" />
                </View>
            </View>
            <View className="flex-1 justify-center items-center p-4">
                <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
                <Text className="text-gray-600 mt-4 text-center">
                    Không tìm thấy thông tin sự kiện. Vui lòng thử lại sau.
                </Text>
                <TouchableOpacity
                    className="mt-4 bg-blue-600 px-6 py-2 rounded-lg"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-medium">Quay lại</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// Render Header component
const renderHeader = () => (
    // ... code continues
);
