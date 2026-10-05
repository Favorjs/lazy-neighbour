const jwt = require('jsonwebtoken');
const { prisma } = require('../models/db');

// Map a Prisma user to the shape exposed as req.user
const toRequestUser = (user) => ({
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
    createdAt: user.createdAt
});

const USER_SELECT = {
    id: true, email: true, name: true, phone: true, avatarUrl: true,
    ratingScore: true, karmaPoints: true, totalEarnings: true, totalSpent: true,
    currentRole: true, stripeAccountId: true, stripeCustomerId: true,
    isVerified: true, walletBalance: true, createdAt: true
};

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: USER_SELECT
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = toRequestUser(user);
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: USER_SELECT
            });

            if (user) {
                req.user = toRequestUser(user);
            }
        }
        next();
    } catch (error) {
        // Just continue without user
        next();
    }
};

module.exports = { authMiddleware, optionalAuth };
