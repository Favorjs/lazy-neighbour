const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/chat/:errandId - Get messages for an errand
router.get('/:errandId', authMiddleware, async (req, res) => {
    try {
        // Get errand to verify permissions
        const errandResult = await pool.query(`
            SELECT requester_id, runner_id FROM errands WHERE id = $1
        `, [req.params.errandId]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errand = errandResult.rows[0];

        // Only participants can view chat
        if (errand.requester_id !== req.user.id && errand.runner_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view this chat' });
        }

        // Get messages with sender info
        const messagesResult = await pool.query(`
            SELECT m.*, s.name as sender_name, s.avatar_url as sender_avatar_url
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            WHERE m.errand_id = $1
            ORDER BY m.created_at ASC
        `, [req.params.errandId]);

        const messages = messagesResult.rows.map(m => ({
            id: m.id,
            content: m.content,
            isRead: m.is_read,
            createdAt: m.created_at,
            senderId: m.sender_id,
            errandId: m.errand_id,
            sender: {
                id: m.sender_id,
                name: m.sender_name,
                avatarUrl: m.sender_avatar_url
            }
        }));

        // Mark messages as read
        await pool.query(`
            UPDATE messages 
            SET is_read = true 
            WHERE errand_id = $1 AND sender_id != $2 AND is_read = false
        `, [req.params.errandId, req.user.id]);

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
        const errandResult = await pool.query(`
            SELECT id, requester_id, runner_id FROM errands WHERE id = $1
        `, [req.params.errandId]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errand = errandResult.rows[0];

        // Only participants can send messages
        if (errand.requester_id !== req.user.id && errand.runner_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to send messages' });
        }

        // Create message
        const messageResult = await pool.query(`
            INSERT INTO messages (content, sender_id, errand_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [content.trim(), req.user.id, req.params.errandId]);

        const m = messageResult.rows[0];

        // Get sender info
        const senderResult = await pool.query(`
            SELECT id, name, avatar_url FROM users WHERE id = $1
        `, [req.user.id]);

        const sender = senderResult.rows[0];

        const message = {
            id: m.id,
            content: m.content,
            isRead: m.is_read,
            createdAt: m.created_at,
            senderId: m.sender_id,
            errandId: m.errand_id,
            sender: {
                id: sender.id,
                name: sender.name,
                avatarUrl: sender.avatar_url
            }
        };

        // Emit via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`errand-${req.params.errandId}`).emit('new-message', message);

            // Notify other participant
            const recipientId = errand.requester_id === req.user.id
                ? errand.runner_id
                : errand.requester_id;

            if (recipientId) {
                io.to(`user-${recipientId}`).emit('message-notification', {
                    errandId: errand.id,
                    message
                });
            }
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
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM messages m
            JOIN errands e ON m.errand_id = e.id
            WHERE (e.requester_id = $1 OR e.runner_id = $1)
              AND m.sender_id != $1
              AND m.is_read = false
        `, [req.user.id]);

        res.json({ unreadCount: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

module.exports = router;
