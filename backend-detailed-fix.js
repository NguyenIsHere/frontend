// Detailed fix for updateEventById function
const updateEventById = async (req, res) => {
    try {
        const { id } = req.params
        const form = req.body
        const images = req.uploadedFiles
        const userId = req.userId
        const manager = await Account.findById(userId)
        const event = await Event.findById(id)

        if (!event) {
            return sendResponse(res, 404, 'Không tìm thấy sự kiện')
        }

        const validation = validateEventForm(form, true)
        if (!validation.isValid) {
            return sendResponse(res, 400, validation.message)
        }

        // Simplified duplication check
        // Only check for duplication if name or startedAt is being changed
        if (form?.name || form?.startedAt) {
            const eventName = form?.name || event.name
            const eventStartedAt = form?.startedAt ? new Date(form.startedAt) : event.startedAt

            const duplication = await Event.findOne({
                _id: { $ne: id }, // Exclude current event
                name: eventName,
                chapterId: manager.chapterId.toString(),
                startedAt: eventStartedAt
            })

            if (duplication) {
                return sendResponse(res, 400, 'Sự kiện đã tồn tại')
            }
        }

        // IMPORTANT: This part must be changed - DO NOT use Account model for event updates
        // OLD (INCORRECT) CODE:
        // const update = new Account(form)
        // for (const field in update.toObject()) {
        //     if (update[field] != null && field != '_id') {
        //         event[field] = update[field]
        //     }
        // }

        // NEW (CORRECT) CODE:
        // Update event fields directly
        console.log('Updating event with form data:', form);
        for (const field in form) {
            if (form[field] != null && field !== '_id') {
                event[field] = form[field]
            }
        }

        // Handle images
        if (images) {
            if (event.images) {
                for (const image of event.images) {
                    deleteFromCloudinary(image.public_id)
                }
            }
            event.images = images
        }

        await event.save()

        // IMPORTANT: Fix the success message to reference events, not accounts
        return sendResponse(res, 200, 'Cập nhật thông tin sự kiện thành công', event)
    } catch (error) {
        console.log(error?.message)
        return sendResponse(res, 500, error.message)
    }
}
