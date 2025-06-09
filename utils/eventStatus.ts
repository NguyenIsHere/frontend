// Map API status to UI display text
export type EventStatus = 'completed' | 'doing' | 'pending' | 'canceled';
export type EventStatusDisplay = 'Đã hoàn thành' | 'Đang diễn ra' | 'Sắp diễn ra' | 'Đã hủy';

export const mapApiStatusToUI = (status: string): EventStatusDisplay => {
    switch (status) {
        case 'completed':
            return 'Đã hoàn thành';
        case 'doing':
            return 'Đang diễn ra';
        case 'pending':
            return 'Sắp diễn ra';
        case 'canceled':
            return 'Đã hủy';
        default:
            return 'Sắp diễn ra';
    }
};

export const mapUIStatusToApi = (uiStatus: EventStatusDisplay): EventStatus => {
    switch (uiStatus) {
        case 'Đã hoàn thành':
            return 'completed';
        case 'Đang diễn ra':
            return 'doing';
        case 'Sắp diễn ra':
            return 'pending';
        case 'Đã hủy':
            return 'canceled';
        default:
            return 'pending';
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return '#16A34A'; // Green
        case 'doing':
            return '#3B82F6'; // Blue
        case 'pending':
            return '#F59E0B'; // Yellow
        case 'canceled':
            return '#EF4444'; // Red
        default:
            return '#6B7280'; // Gray
    }
};
