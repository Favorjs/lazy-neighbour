const express = require('express');
const { prisma } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const toNotification = (n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    errandId: n.errandId,
    isRead: n.isRead,
    createdAt: n.createdAt
});

// GET /api/notifications - Newest first
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'desc' },
                take: 100
            }),
            prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
        ]);

        res.json({ notifications: rows.map(toNotification), unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to load notifications' });
    }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const unreadCount = await prisma.notification.count({
            where: { userId: req.user.id, isRead: false }
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error('Get unread notifications error:', error);
        res.status(500).json({ error: 'Failed to load notifications' });
    }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authMiddleware, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true }
        });

        res.json({ message: 'All caught up' });
    } catch (error) {
        console.error('Read all notifications error:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: { isRead: true }
        });

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Read notification error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

module.exports = router;
