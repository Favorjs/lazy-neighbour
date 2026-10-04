const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Email, password, and name are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if user exists
        const existingUserResult = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (existingUserResult.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const result = await pool.query(`
            INSERT INTO users (email, password, name, phone)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, name, phone, current_role, rating_score, karma_points, created_at
        `, [email.toLowerCase(), hashedPassword, name, phone || null]);

        const user = result.rows[0];
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'Account created successfully! 🎉',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                currentRole: user.current_role,
                ratingScore: parseFloat(user.rating_score),
                karmaPoints: user.karma_points,
                createdAt: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Find user
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id);

        // Transform to camelCase and remove password
        res.json({
            message: 'Welcome back! 👋',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                avatarUrl: user.avatar_url,
                ratingScore: parseFloat(user.rating_score),
                karmaPoints: user.karma_points,
                totalEarnings: parseFloat(user.total_earnings),
                totalSpent: parseFloat(user.total_spent),
                currentRole: user.current_role,
                stripeAccountId: user.stripe_account_id,
                stripeCustomerId: user.stripe_customer_id,
                isVerified: user.is_verified,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // Get user stats
        const [requestedResult, completedResult] = await Promise.all([
            pool.query(
                `SELECT COUNT(*) as count FROM errands WHERE requester_id = $1`,
                [req.user.id]
            ),
            pool.query(
                `SELECT COUNT(*) as count FROM errands WHERE runner_id = $1 AND status = 'RELEASED'`,
                [req.user.id]
            )
        ]);

        res.json({
            user: {
                ...req.user,
                stats: {
                    errandsRequested: parseInt(requestedResult.rows[0].count),
                    errandsCompleted: parseInt(completedResult.rows[0].count)
                }
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// PATCH /api/auth/toggle-role - Switch between LAZY and RUNNER
router.patch('/toggle-role', authMiddleware, async (req, res) => {
    try {
        const newRole = req.user.currentRole === 'LAZY' ? 'RUNNER' : 'LAZY';

        const result = await pool.query(`
            UPDATE users 
            SET current_role = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, email, name, current_role, rating_score, karma_points
        `, [newRole, req.user.id]);

        const user = result.rows[0];
        const emoji = newRole === 'RUNNER' ? '🏃' : '😴';

        res.json({
            message: `Switched to ${newRole} mode! ${emoji}`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                currentRole: user.current_role,
                ratingScore: parseFloat(user.rating_score),
                karmaPoints: user.karma_points
            }
        });
    } catch (error) {
        console.error('Toggle role error:', error);
        res.status(500).json({ error: 'Failed to toggle role' });
    }
});

// PATCH /api/auth/profile - Update profile
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, avatarUrl } = req.body;

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (phone) {
            updates.push(`phone = $${paramCount++}`);
            values.push(phone);
        }
        if (avatarUrl) {
            updates.push(`avatar_url = $${paramCount++}`);
            values.push(avatarUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(req.user.id);

        const result = await pool.query(`
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, email, name, phone, avatar_url, current_role, rating_score, karma_points
        `, values);

        const user = result.rows[0];

        res.json({
            message: 'Profile updated! ✨',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                avatarUrl: user.avatar_url,
                currentRole: user.current_role,
                ratingScore: parseFloat(user.rating_score),
                karmaPoints: user.karma_points
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// POST /api/auth/push-token - Save push notification token
router.post('/push-token', authMiddleware, async (req, res) => {
    try {
        const { pushToken } = req.body;

        await pool.query(`
            UPDATE users SET push_token = $1, updated_at = NOW() WHERE id = $2
        `, [pushToken, req.user.id]);

        res.json({ message: 'Push token saved' });
    } catch (error) {
        console.error('Save push token error:', error);
        res.status(500).json({ error: 'Failed to save push token' });
    }
});

module.exports = router;
