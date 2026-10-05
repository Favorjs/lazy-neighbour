const { prisma } = require('../models/db');

/**
 * Save a notification for a user and push it live over Socket.io.
 * Never throws: a failed notification must not fail the request that triggered it.
 */
const notify = async (io, userId, { type, title, body, errandId = null }) => {
    try {
        const notification = await prisma.notification.create({
            data: { userId, type, title, body, errandId }
        });

        if (io) {
            io.to(`user-${userId}`).emit('notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Notify error:', error);
        return null;
    }
};

module.exports = { notify };
