import { accountApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const EditProfileScreen = () => {
    const router = useRouter();

    // Profile state
    const [loading, setLoading] = useState(true);
    const [avatar, setAvatar] = useState('');
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [birthday, setBirthday] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [cardCode, setCardCode] = useState('');
    const [hometown, setHometown] = useState('');
    const [ethnicity, setEthnicity] = useState('');
    const [religion, setReligion] = useState('');
    const [eduLevel, setEduLevel] = useState('');

    // Fetch current user data
    const fetchUserProfile = async () => {
        try {
            const response = await accountApi.getCurrentUser();
            const userData = response.data.data;

            setFullname(userData.fullname || '');
            setEmail(userData.email || '');
            setPhone(userData.phone || '');
            setBirthday(userData.birthday || '');
            setGender(userData.gender || '');
            setAddress(userData.address || '');
            setCardCode(userData.cardCode || '');
            setHometown(userData.hometown || '');
            setEthnicity(userData.ethnicity || '');
            setReligion(userData.religion || '');
            setEduLevel(userData.eduLevel || '');
            setAvatar(userData.avatar || '');

        } catch (error: any) {
            console.error('Error fetching user profile:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể tải thông tin người dùng'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Handle image pick
    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                setAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        }
    };

    // Handle form submit
    const handleSubmit = async () => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('fullname', fullname);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('birthday', birthday);
            formData.append('gender', gender);
            formData.append('address', address);
            formData.append('cardCode', cardCode);
            formData.append('hometown', hometown);
            formData.append('ethnicity', ethnicity);
            formData.append('religion', religion);
            formData.append('eduLevel', eduLevel);

            // Append avatar if changed
            if (avatar && !avatar.startsWith('http')) {
                const filename = avatar.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('avatar', {
                    uri: avatar,
                    name: filename,
                    type
                } as any);
            }

            await accountApi.updateProfile(formData);
            Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
            router.back();

        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.'
            );
        } finally {
            setLoading(false);
        }
    };

    const renderInputField = (
        label: string,
        value: string,
        onChangeText: (text: string) => void,
        icon: string,
        placeholder: string,
        keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default'
    ) => (
        <View className="mb-4">
            <View className="flex-row items-center mb-2">
                <Ionicons name={icon as any} size={20} color="#000" />
                <Text className="text-lg font-bold ml-2 text-gray-900">{label}</Text>
            </View>
            <TextInput
                className="border border-gray-300 p-3 rounded-lg bg-white"
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
            />
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-2 text-gray-600">Đang tải thông tin...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="bg-blue-600 p-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Cập nhật thông tin</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Form */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-4">
                    {/* Avatar */}
                    <View className="items-center mb-6">
                        <TouchableOpacity onPress={handleImagePick}>
                            <View className="relative">
                                <Image
                                    source={
                                        avatar
                                            ? { uri: avatar }
                                            : require('@/assets/images/avatar-placeholder.png')
                                    }
                                    className="w-24 h-24 rounded-full"
                                />
                                <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2">
                                    <Ionicons name="camera" size={16} color="white" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text className="mt-2 text-gray-600">Nhấn để thay đổi ảnh đại diện</Text>
                    </View>

                    {/* Personal Information */}
                    {renderInputField('Họ và tên', fullname, setFullname, 'person-outline', 'Nhập họ và tên')}
                    {renderInputField('Email', email, setEmail, 'mail-outline', 'Nhập email', 'email-address')}
                    {renderInputField('Số điện thoại', phone, setPhone, 'call-outline', 'Nhập số điện thoại', 'phone-pad')}
                    {renderInputField('Ngày sinh', birthday, setBirthday, 'calendar-outline', 'YYYY-MM-DD')}
                    {renderInputField('Giới tính', gender, setGender, 'male-female-outline', 'Nam/Nữ')}
                    {renderInputField('Địa chỉ', address, setAddress, 'location-outline', 'Nhập địa chỉ')}
                    {renderInputField('Mã thẻ đoàn viên', cardCode, setCardCode, 'card-outline', 'Nhập mã thẻ đoàn viên')}
                    {renderInputField('Quê quán', hometown, setHometown, 'home-outline', 'Nhập quê quán')}
                    {renderInputField('Dân tộc', ethnicity, setEthnicity, 'people-outline', 'Nhập dân tộc')}
                    {renderInputField('Tôn giáo', religion, setReligion, 'star-outline', 'Nhập tôn giáo')}
                    {renderInputField('Trình độ học vấn', eduLevel, setEduLevel, 'school-outline', 'Nhập trình độ học vấn')}

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-blue-600 p-4 rounded-lg items-center mb-8"
                        onPress={handleSubmit}
                    >
                        <Text className="text-white text-lg font-bold">Cập nhật</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default EditProfileScreen;
