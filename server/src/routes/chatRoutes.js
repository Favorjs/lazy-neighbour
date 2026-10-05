const express = require('express');
const { prisma } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { notify } = require('../services/notificationService');

const router = express.Router();

// Chat is only open while an errand is in progress (until the requester pays)
const CHAT_OPEN_STATUSES = ['ACTIVE', 'COMPLETED'];

const SENDER_SELECT = { id: true, name: true, avatarUrl: true };

const toMessage = (m) => ({
    id: m.id,
    content: m.content,
    isRead: m.isRead,
    createdAt: m.createdAt,
    senderId: m.senderId,
    errandId: m.errandId,
    sender: {
        id: m.sender.id,
        name: m.sender.name,
        avatarUrl: m.sender.avatarUrl
    }
});

// GET /api/chat/:errandId - Get messages for an errand
router.get('/:errandId', authMiddleware, async (req, res) => {
    try {
        // Get errand to verify permissions
        const errand = await prisma.errand.findUnique({
            where: { id: req.params.errandId },
            select: { requesterId: true, runnerId: true }
        });

        if (!errand) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        // Only participants can view chat
        if (errand.requesterId !== req.user.id && errand.runnerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view this chat' });
        }

        // Get messages with sender info
        const rows = await prisma.message.findMany({
            where: { errandId: req.params.errandId },
            include: { sender: { select: SENDER_SELECT } },
            orderBy: { createdAt: 'asc' }
        });

        const messages = rows.map(toMessage);

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                errandId: req.params.errandId,
                senderId: { not: req.user.id },
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// POST /api/chat/:errandId - Send a message
router.post('/:errandId', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Get errand to verify permissions
        const errand = await prisma.errand.findUnique({
            where: { id: req.params.errandId },
            select: { id: true, requesterId: true, runnerId: true, status: true }
        });

        if (!errand) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        // Only participants can send messages
        if (errand.requesterId !== req.user.id && errand.runnerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to send messages' });
        }

        if (!CHAT_OPEN_STATUSES.includes(errand.status)) {
            return res.status(403).json({
                code: 'CHAT_CLOSED',
                error: 'Chat opens when a runner picks up the errand and closes once it is paid.'
            });
        }

        // Create message (with sender info)
        const message = toMessage(await prisma.message.create({
            data: {
                content: content.trim(),
                senderId: req.user.id,
                errandId: req.params.errandId
            },
            include: { sender: { select: SENDER_SELECT } }
        }));

        // Emit via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`errand-${req.params.errandId}`).emit('new-message', message);

            // Notify other participant
            const recipientId = errand.requesterId === req.user.id
                ? errand.runnerId
                : errand.requesterId;

            if (recipientId) {
                io.to(`user-${recipientId}`).emit('message-notification', {
                    errandId: errand.id,
                    message
                });
            }
        }

        const recipientId = errand.requesterId === req.user.id ? errand.runnerId : errand.requesterId;
        if (recipientId) {
            const preview = message.content.length > 80 ? `${message.content.slice(0, 77)}...` : message.content;
            notify(io, recipientId, {
                type: 'MESSAGE',
                title: `New message from ${req.user.name}`,
                body: preview,
                errandId: errand.id
            });
        }

        res.status(201).json({ message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// GET /api/chat/unread/count - Get unread message count
router.get('/unread/count', authMiddleware, async (req, res) => {
    try {
        const unreadCount = await prisma.message.count({
            where: {
                senderId: { not: req.user.id },
                isRead: false,
                errand: {
                    OR: [{ requesterId: req.user.id }, { runnerId: req.user.id }]
                }
            }
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

module.exports = router;
