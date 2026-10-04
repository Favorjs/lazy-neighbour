const jwt = require('jsonwebtoken');
const { pool, getSingleRow, RecordDoesNotExist } = require('../models/db');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Raw SQL query to find user by ID
        const result = await pool.query(`
            SELECT 
                id, email, name, phone, avatar_url, rating_score, karma_points,
                total_earnings, total_spent, current_role, stripe_account_id,
                stripe_customer_id, is_verified, created_at
            FROM users 
            WHERE id = $1
        `, [decoded.userId]);

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Transform snake_case to camelCase for compatibility
        req.user = {
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
            createdAt: user.created_at
        };
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

            const result = await pool.query(`
                SELECT * FROM users WHERE id = $1
            `, [decoded.userId]);

            const user = result.rows[0];
            if (user) {
                req.user = {
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
                    createdAt: user.created_at
                };
            }
        }
        next();
    } catch (error) {
        // Just continue without user
        next();
    }
};

module.exports = { authMiddleware, optionalAuth };
