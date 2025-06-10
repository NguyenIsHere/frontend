// Phần cần sửa khoảng trắng và thụt lề
// Thay thế từ sau openImageViewer
const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
};

const handleParticipantPress = (participant: Participant) => {
    Alert.alert(
        'Điểm danh',
        `Bạn muốn điểm danh cho ${participant.userId.fullName}?`,
        [
            {
                text: 'Hủy',
                style: 'cancel'
            },
            {
                text: 'Điểm danh',
                onPress: () => handleCheckIn(participant._id)
            }
        ]
    );
};
