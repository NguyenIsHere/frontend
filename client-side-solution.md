# Giải pháp "Mì ăn liền" cho Update Event trong React Native

Dựa trên đề xuất của Đặng Hữu Thắng, sau đây là cách giải quyết vấn đề khi backend không cập nhật đúng dữ liệu sự kiện.

## Nguyên tắc cơ bản

Ý tưởng chính là:
1. Lưu trữ dữ liệu gốc và dữ liệu đã cập nhật trong state
2. Khi người dùng submit form, cập nhật UI ngay lập tức với dữ liệu mới
3. Gửi request đến server, nhưng không phụ thuộc vào kết quả trả về

## Các thay đổi đã áp dụng cho edit.tsx

```tsx
// 1. Thêm state mới để theo dõi dữ liệu gốc và dữ liệu đã submit
const [eventData, setEventData] = useState<APIEvent | null>(null);
const [submittedFormData, setSubmittedFormData] = useState<any>(null);

// 2. Khi fetch dữ liệu, lưu trữ dữ liệu gốc
const fetchEventDetail = async () => {
    try {
        // ... code hiện tại ...
        
        // Lưu trữ dữ liệu gốc
        setEventData(event);
        
        // ... code hiện tại ...
    } catch (error) {
        // ... code hiện tại ...
    }
}

// 3. Cập nhật hàm handleSubmit
const handleSubmit = async () => {
    try {
        // ... validation code hiện tại ...
        
        const formData = new FormData();
        // ... code tạo formData hiện tại ...
        
        // Lưu trữ dữ liệu đã submit để cập nhật UI
        const submittedData = {
            name: name.trim(),
            description: description.trim() || '',
            location: location.trim(),
            startedAt: startedAt.toISOString(),
            status: status,
            images: selectedImages
        };
        setSubmittedFormData(submittedData);
        
        // Cập nhật eventData ngay lập tức
        if (eventData) {
            const updatedEventData = {
                ...eventData,
                name: name.trim(),
                description: description.trim() || '',
                location: location.trim(),
                startedAt: startedAt.toISOString(),
                status: status,
            };
            setEventData(updatedEventData);
        }
        
        // Gửi request và xử lý response
        const response = await eventApi.updateEvent(eventId, formData);
        
        if (response?.data?.success) {
            // Nếu thành công, xử lý như bình thường
            setShouldRefresh(true);
            Alert.alert('Thành công', 'Đã cập nhật sự kiện');
            router.back();
        } else {
            // Ngay cả khi API trả về lỗi, UI vẫn đã được cập nhật
            Alert.alert(
                'Thông báo', 
                'Dữ liệu đã được cập nhật trên ứng dụng nhưng có thể chưa được lưu trên máy chủ.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    } catch (error) {
        // Nếu có lỗi nhưng đã có dữ liệu submit, vẫn giữ UI đã cập nhật
        if (submittedFormData) {
            Alert.alert(
                'Thông báo', 
                'Có lỗi khi gửi dữ liệu lên máy chủ, nhưng thông tin đã được cập nhật trong ứng dụng.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            return;
        }
        
        // Xử lý lỗi như bình thường nếu không có dữ liệu submit
        // ... error handling code hiện tại ...
    } finally {
        setUploading(false);
    }
}
```

## Các thay đổi cho detail.tsx (cùng nguyên tắc)

```tsx
// Cập nhật hàm handleStatusChange
const handleStatusChange = async (newStatus: EventStatusDisplay) => {
    try {
        const apiStatus = mapUIStatusToApi(newStatus);
        
        // Cập nhật UI ngay lập tức
        setCurrentStatus(newStatus);
        setIsStatusModalOpen(false);
        
        // Cập nhật event trong state
        if (event) {
            const updatedEvent = {
                ...event,
                status: apiStatus as EventStatus
            };
            setEvent(updatedEvent);
        }
        
        // Hiển thị thông báo thành công
        Alert.alert('Thành công', `Sự kiện đã chuyển sang trạng thái ${newStatus}`);
        
        // Gửi request đến server (không quan tâm kết quả)
        const formData = new FormData();
        formData.append('status', apiStatus);
        await eventApi.updateEvent(eventId, formData);
        
        // Optional: Refresh data
        await fetchEventDetail();
    } catch (error) {
        console.error('Error updating event status:', error);
        // Vẫn giữ UI đã cập nhật
        Alert.alert(
            'Thông báo',
            'Trạng thái đã được cập nhật trong ứng dụng nhưng có thể chưa được lưu trên máy chủ.'
        );
    }
}

// Tương tự cho handleUpdate
const handleUpdate = async (formData: FormData) => {
    if (!event) return;
    
    try {
        setUploading(true);
        
        // Extract data from FormData
        const updatedData = {};
        for (const pair of (formData as any)._parts) {
            if (Array.isArray(pair) && pair.length >= 2) {
                const key = pair[0];
                const value = pair[1];
                
                if (key !== 'images' && key !== 'keepImages') {
                    updatedData[key] = value;
                }
            }
        }
        
        // Update event in state immediately
        const updatedEvent = {
            ...event,
            ...updatedData
        };
        setEvent(updatedEvent);
        
        // Show success message and close modal
        setIsEditModalVisible(false);
        Alert.alert('Thành công', 'Đã cập nhật sự kiện');
        
        // Send request to server
        await eventApi.updateEvent(event._id, formData);
        
        // Optional: Refresh data
        await fetchEventDetail();
    } catch (error) {
        console.error('Error updating event:', error);
        // Still keep the updated UI
        Alert.alert(
            'Thông báo',
            'Dữ liệu đã được cập nhật trên ứng dụng nhưng có thể chưa được lưu trên máy chủ.'
        );
    } finally {
        setUploading(false);
    }
}
```

## Kết luận

Với cách tiếp cận này, chúng ta đã tạo ra một trải nghiệm người dùng mượt mà hơn:

1. UI luôn phản ánh những thay đổi của người dùng ngay lập tức
2. Không bị phụ thuộc vào việc backend có lưu thành công hay không
3. Vẫn thông báo cho người dùng về tình trạng lưu trữ server

Đây là giải pháp tạm thời "mì ăn liền" trong khi chờ đợi backend được sửa chữa đúng cách.
