// Hàm đã được sửa lỗi cú pháp
const handleUpdate = async (formData: FormData) => {
    if (!event) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin sự kiện');
        return;
    }

    try {
        setUploading(true);

        // Ensure name field is present
        if (!formData.has('name') && formData.has('title')) {
            const title = formData.get('title');
            formData.append('name', title as string);
        }

        // Tạo một object với các thông tin đã cập nhật
        const updatedData: Record<string, any> = {};

        // Trích xuất dữ liệu từ FormData
        for (const pair of (formData as any)._parts) {
            if (Array.isArray(pair) && pair.length >= 2) {
                const key = pair[0];
                const value = pair[1];

                if (key !== 'images' && key !== 'keepImages') {
                    updatedData[key] = value;
                }
            }
        }

        // Cập nhật event trong state ngay lập tức
        const updatedEvent = {
            ...event,
            ...updatedData,
            // Giữ nguyên các trường khác
        };

        setEvent(updatedEvent);
        setIsEditModalVisible(false);

        // Hiển thị thông báo thành công
        Alert.alert('Thành công', 'Đã cập nhật sự kiện');

        // Gửi request cập nhật đến server
        const response = await eventApi.updateEvent(event._id, formData);
        console.log('Server response:', response);

        // Nếu thành công, refresh dữ liệu
        if (response?.data?.success) {
            await fetchEventDetail();
        } else {
            console.warn('Server update failed, but UI already updated:', response?.data?.message);
        }
    } catch (error: any) {
        console.error('Error updating event:', error);
        // Vẫn giữ UI đã cập nhật
        Alert.alert(
            'Thông báo',
            'Dữ liệu đã được cập nhật trên ứng dụng nhưng có thể chưa được lưu trên máy chủ.'
        );
    } finally {
        setUploading(false);
    }
};
