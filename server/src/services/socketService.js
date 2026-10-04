const jwt = require('jsonwebtoken');

/**
 * Socket.io event handlers for real-time features
 */
const setupSocketHandlers = (io) => {
    // Authentication middleware for sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            // Allow connection but mark as unauthenticated
            socket.userId = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            socket.userId = null;
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.userId || 'anonymous'})`);

        // Join user's personal room for notifications
        if (socket.userId) {
            socket.join(`user-${socket.userId}`);
        }

        // Join errand chat room
        socket.on('join-errand', (errandId) => {
            socket.join(`errand-${errandId}`);
            console.log(`📍 Socket ${socket.id} joined errand-${errandId}`);
        });

        // Leave errand chat room
        socket.on('leave-errand', (errandId) => {
            socket.leave(`errand-${errandId}`);
            console.log(`👋 Socket ${socket.id} left errand-${errandId}`);
        });

        // Typing indicator
        socket.on('typing', ({ errandId, isTyping }) => {
            socket.to(`errand-${errandId}`).emit('user-typing', {
                userId: socket.userId,
                isTyping
            });
        });

        // Location update (for runner tracking)
        socket.on('location-update', ({ errandId, lat, lng }) => {
            socket.to(`errand-${errandId}`).emit('runner-location', {
                userId: socket.userId,
                lat,
                lng,
                timestamp: new Date()
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = { setupSocketHandlers };
