const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../models/db');
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
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                phone: phone || null
            },
            select: {
                id: true, email: true, name: true, phone: true, currentRole: true,
                ratingScore: true, karmaPoints: true, createdAt: true
            }
        });

        const token = generateToken(user.id);

        res.status(201).json({
            message: 'Account created successfully! 🎉',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                currentRole: user.currentRole,
                ratingScore: Number(user.ratingScore),
                karmaPoints: user.karmaPoints,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        // Unique constraint hit by a concurrent registration
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already registered' });
        }
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
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id);

        // Remove password from the response
        res.json({
            message: 'Welcome back! 👋',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                ratingScore: Number(user.ratingScore),
                karmaPoints: user.karmaPoints,
                totalEarnings: Number(user.totalEarnings),
                totalSpent: Number(user.totalSpent),
                currentRole: user.currentRole,
                stripeAccountId: user.stripeAccountId,
                stripeCustomerId: user.stripeCustomerId,
                isVerified: user.isVerified,
                walletBalance: Number(user.walletBalance),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
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
        const [errandsRequested, errandsCompleted] = await Promise.all([
            prisma.errand.count({ where: { requesterId: req.user.id } }),
            prisma.errand.count({ where: { runnerId: req.user.id, status: 'RELEASED' } })
        ]);

        res.json({
            user: {
                ...req.user,
                stats: { errandsRequested, errandsCompleted }
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

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { currentRole: newRole },
            select: {
                id: true, email: true, name: true, currentRole: true,
                ratingScore: true, karmaPoints: true
            }
        });

        const emoji = newRole === 'RUNNER' ? '🏃' : '😴';

        res.json({
            message: `Switched to ${newRole} mode! ${emoji}`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                currentRole: user.currentRole,
                ratingScore: Number(user.ratingScore),
                karmaPoints: user.karmaPoints
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

        const data = {};
        if (name) data.name = name;
        if (phone) data.phone = phone;
        if (avatarUrl) data.avatarUrl = avatarUrl;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data,
            select: {
                id: true, email: true, name: true, phone: true, avatarUrl: true,
                currentRole: true, ratingScore: true, karmaPoints: true
            }
        });

        res.json({
            message: 'Profile updated! ✨',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                currentRole: user.currentRole,
                ratingScore: Number(user.ratingScore),
                karmaPoints: user.karmaPoints
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

        await prisma.user.update({
            where: { id: req.user.id },
            data: { pushToken }
        });

        res.json({ message: 'Push token saved' });
    } catch (error) {
        console.error('Save push token error:', error);
        res.status(500).json({ error: 'Failed to save push token' });
    }
});

// DELETE /api/auth/account - Permanently delete the account (password required)
router.delete('/account', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body || {};

        if (!password) {
            return res.status(400).json({ error: 'Enter your password to delete your account' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        const valid = user && await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ error: 'That password is not right' });
        }

        // Do not let anyone walk away from errands in flight or money in the wallet
        const open = await prisma.errand.count({
            where: {
                OR: [{ requesterId: user.id }, { runnerId: user.id }],
                status: { in: ['PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED'] }
            }
        });

        if (open > 0) {
            return res.status(409).json({
                error: 'Finish or cancel your open errands before deleting your account'
            });
        }

        if (Number(user.walletBalance) > 0) {
            return res.status(409).json({
                error: 'Withdraw what is left in your wallet before deleting your account'
            });
        }

        await prisma.user.delete({ where: { id: user.id } });

        res.json({ message: 'Your account has been deleted' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
