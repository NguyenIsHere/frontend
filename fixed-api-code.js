// Đây là phần code đã được sửa lỗi, bạn có thể sao chép từng phần này vào file gốc

// Phần 1: Sửa phần cuối của hàm updateEvent và phần đầu của startEvent
    } catch (error: any) {
    console.error('Error in ultimate updateEvent:', error);
    return {
        data: {
            success: false,
            message: error.message || 'Có lỗi xảy ra khi cập nhật sự kiện',
            data: null
        },
        status: 500
    };
}
  },

/**
 * Start an event
 * @param id - ID of the event to start
 */
startEvent: (id: string) => {
    const formData = new FormData();
    formData.append('status', 'doing');
    return eventApi.updateEvent(id, formData);
},

    // Phần 2: Sửa phần endEvent
    /**
     * End an event
     * @param id - ID of the event to end
     */
    endEvent: (id: string) => {
        const formData = new FormData();
        formData.append('status', 'completed');
        return eventApi.updateEvent(id, formData);
    },

        // Phần 3: Sửa phần cancelEvent
        /**
         * Cancel an event
         * @param id - ID of the event to cancel
         */
        cancelEvent: (id: string) => {
            const formData = new FormData();
            formData.append('status', 'canceled');
            return eventApi.updateEvent(id, formData);
        },

            // Phần 4: Sửa phần registerEvent
            /**
             * Register for an event
             * @param eventId - ID of the event to register for
             */
            registerEvent: (eventId: string) => {
                return api.post('/registrations', { eventId });
            },

                // Phần 5: Sửa phần unregisterEvent
                /**
                 * Unregister from an event
                 * @param eventId - ID of the event to unregister from
                 */
                unregisterEvent: (eventId: string) => {
                    return api.delete(`/registrations/${eventId}`);
                },

                    // Phần 6: Sửa phần getEventRegistrations
                    /**
                     * Get list of events user has registered for
                     */
                    getEventRegistrations: () => {
                        return api.get('/registrations/me');
                    },

                        // Phần 7: Sửa phần checkIn
                        /**
                         * Check in a participant to an event
                         * @param participantId - ID of the participant registration
                         * @param eventId - ID of the event
                         */
                        checkIn: (participantId: string, eventId: string) => {
                            return api.patch(`/registrations/${participantId}`, {
                                eventId: eventId,
                                status: 'checked-in'
                            });
                        },

                            // Phần 8: Sửa phần getEventParticipants
                            /**
                             * Get participants of an event
                             * @param eventId - ID of the event to get participants for
                             */
                            getEventParticipants: (eventId: string) => {
                                return api.get('/registrations', { params: { eventId } });
                            },

                                // Phần 9: Sửa phần deleteEvent
                                /**
                                 * Xóa một sự kiện bằng ID
                                 * @param id - ID của sự kiện
                                 */
                                deleteEvent: (id: string) => {
                                    return api.delete(`/events/${id}`);
                                },

                                    // Phần 10: Sửa phần cuối
                                    unlikeComment: (likeId: string) => {
                                        return api.delete(`/comments/likes/${likeId}`);
                                    }
}; // Dấu chấm phẩy cuối cùng cho eventApi object
