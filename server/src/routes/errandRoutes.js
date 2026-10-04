const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { canUserTransition, getValidNextStates } = require('../services/errandStateMachine');

const router = express.Router();

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Service fee calculation
const calculateServiceFee = (bountyAmount) => {
    const feePercent = parseFloat(process.env.SERVICE_FEE_PERCENT) || 10;
    return Math.round(bountyAmount * feePercent) / 100;
};

// Helper to transform errand row to camelCase
const transformErrand = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    bountyAmount: parseFloat(row.bounty_amount),
    serviceFee: parseFloat(row.service_fee),
    status: row.status,
    locationLat: parseFloat(row.location_lat),
    locationLng: parseFloat(row.location_lng),
    address: row.address,
    proofPhotoUrl: row.proof_photo_url,
    requesterId: row.requester_id,
    runnerId: row.runner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    completedAt: row.completed_at,
    releasedAt: row.released_at,
    // Nested requester if present
    requester: row.requester_name ? {
        id: row.requester_id,
        name: row.requester_name,
        avatarUrl: row.requester_avatar_url,
        ratingScore: row.requester_rating_score ? parseFloat(row.requester_rating_score) : null
    } : undefined,
    // Nested runner if present
    runner: row.runner_name ? {
        id: row.runner_id,
        name: row.runner_name,
        avatarUrl: row.runner_avatar_url,
        ratingScore: row.runner_rating_score ? parseFloat(row.runner_rating_score) : null
    } : undefined
});

// POST /api/errands - Create new errand (Lazy user)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, bountyAmount, locationLat, locationLng, address } = req.body;

        // Validation
        if (!title || !description || !category || !bountyAmount || !locationLat || !locationLng) {
            return res.status(400).json({
                error: 'Title, description, category, bounty, and location are required'
            });
        }

        if (bountyAmount < 1) {
            return res.status(400).json({ error: 'Bounty must be at least $1' });
        }

        const validCategories = ['FOOD', 'STORE', 'HOME', 'QUICK'];
        if (!validCategories.includes(category.toUpperCase())) {
            return res.status(400).json({
                error: `Category must be one of: ${validCategories.join(', ')}`
            });
        }

        const serviceFee = calculateServiceFee(bountyAmount);

        // Create errand with raw SQL
        const result = await pool.query(`
            INSERT INTO errands (title, description, category, bounty_amount, service_fee, location_lat, location_lng, address, requester_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
            RETURNING *
        `, [title, description, category.toUpperCase(), parseFloat(bountyAmount), serviceFee, parseFloat(locationLat), parseFloat(locationLng), address || null, req.user.id]);

        const errandRow = result.rows[0];

        // Get requester info
        const userResult = await pool.query(`
            SELECT id, name, avatar_url, rating_score FROM users WHERE id = $1
        `, [req.user.id]);

        const errand = {
            ...transformErrand(errandRow),
            requester: {
                id: userResult.rows[0].id,
                name: userResult.rows[0].name,
                avatarUrl: userResult.rows[0].avatar_url,
                ratingScore: parseFloat(userResult.rows[0].rating_score)
            }
        };

        // Emit to nearby runners via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('new-errand', errand);
        }

        res.status(201).json({
            message: 'Errand posted! 📝 Waiting for a Runner...',
            errand
        });
    } catch (error) {
        console.error('Create errand error:', error);
        res.status(500).json({ error: 'Failed to create errand' });
    }
});

// GET /api/errands/nearby - Get errands within radius (Runner)
router.get('/nearby', authMiddleware, async (req, res) => {
    try {
        const { lat, lng, radiusKm = 5, category } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Location (lat, lng) is required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const radius = parseFloat(radiusKm);

        // Get all pending errands not created by this user
        let query = `
            SELECT e.*, 
                   u.name as requester_name, u.avatar_url as requester_avatar_url, u.rating_score as requester_rating_score
            FROM errands e
            JOIN users u ON e.requester_id = u.id
            WHERE e.status = 'PENDING' AND e.requester_id != $1
        `;
        const params = [req.user.id];

        if (category) {
            query += ` AND e.category = $2`;
            params.push(category.toUpperCase());
        }

        query += ` ORDER BY e.created_at DESC`;

        const result = await pool.query(query, params);

        // Filter by distance
        const nearbyErrands = result.rows
            .map(row => {
                const errand = transformErrand(row);
                const distance = calculateDistance(
                    userLat, userLng,
                    errand.locationLat, errand.locationLng
                );
                return { ...errand, distance: Math.round(distance * 10) / 10 };
            })
            .filter(errand => errand.distance <= radius)
            .sort((a, b) => a.distance - b.distance);

        res.json({
            count: nearbyErrands.length,
            radiusKm: radius,
            errands: nearbyErrands
        });
    } catch (error) {
        console.error('Get nearby errands error:', error);
        res.status(500).json({ error: 'Failed to get errands' });
    }
});

// GET /api/errands/feed - Social feed of local errands
router.get('/feed', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = `WHERE e.status IN ('PENDING', 'ACTIVE')`;
        const params = [];
        let paramCount = 1;

        if (category) {
            whereClause += ` AND e.category = $${paramCount++}`;
            params.push(category.toUpperCase());
        }

        // Get errands with requester and runner info
        const errandsResult = await pool.query(`
            SELECT e.*,
                   req.name as requester_name, req.avatar_url as requester_avatar_url, req.rating_score as requester_rating_score,
                   run.name as runner_name, run.avatar_url as runner_avatar_url
            FROM errands e
            JOIN users req ON e.requester_id = req.id
            LEFT JOIN users run ON e.runner_id = run.id
            ${whereClause}
            ORDER BY e.created_at DESC
            LIMIT $${paramCount++} OFFSET $${paramCount}
        `, [...params, parseInt(limit), offset]);

        // Get total count
        const countResult = await pool.query(`
            SELECT COUNT(*) as count FROM errands e ${whereClause}
        `, params);

        const total = parseInt(countResult.rows[0].count);

        res.json({
            errands: errandsResult.rows.map(transformErrand),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({ error: 'Failed to get feed' });
    }
});

// GET /api/errands/my - Get user's errands (both as requester and runner)
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const { role, status } = req.query;

        let whereClause = '';
        const params = [req.user.id];

        if (role === 'lazy' || role === 'requester') {
            whereClause = `WHERE e.requester_id = $1`;
        } else if (role === 'runner') {
            whereClause = `WHERE e.runner_id = $1`;
        } else {
            whereClause = `WHERE (e.requester_id = $1 OR e.runner_id = $1)`;
        }

        if (status) {
            whereClause += ` AND e.status = $2`;
            params.push(status.toUpperCase());
        }

        const result = await pool.query(`
            SELECT e.*,
                   req.name as requester_name, req.avatar_url as requester_avatar_url, req.rating_score as requester_rating_score,
                   run.name as runner_name, run.avatar_url as runner_avatar_url, run.rating_score as runner_rating_score,
                   t.id as transaction_id, t.stripe_payment_intent, t.stripe_transfer_id, t.amount as transaction_amount, 
                   t.service_fee as transaction_service_fee, t.runner_payout, t.status as transaction_status
            FROM errands e
            JOIN users req ON e.requester_id = req.id
            LEFT JOIN users run ON e.runner_id = run.id
            LEFT JOIN transactions t ON t.errand_id = e.id
            ${whereClause}
            ORDER BY e.created_at DESC
        `, params);

        const errands = result.rows.map(row => {
            const errand = transformErrand(row);
            if (row.transaction_id) {
                errand.transaction = {
                    id: row.transaction_id,
                    stripePaymentIntent: row.stripe_payment_intent,
                    stripeTransferId: row.stripe_transfer_id,
                    amount: parseFloat(row.transaction_amount),
                    serviceFee: parseFloat(row.transaction_service_fee),
                    runnerPayout: parseFloat(row.runner_payout),
                    status: row.transaction_status
                };
            }
            return errand;
        });

        res.json({ errands });
    } catch (error) {
        console.error('Get my errands error:', error);
        res.status(500).json({ error: 'Failed to get errands' });
    }
});

// GET /api/errands/:id - Get single errand
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        // Get errand with requester, runner, and transaction
        const errandResult = await pool.query(`
            SELECT e.*,
                   req.name as requester_name, req.avatar_url as requester_avatar_url, req.rating_score as requester_rating_score, req.phone as requester_phone,
                   run.name as runner_name, run.avatar_url as runner_avatar_url, run.rating_score as runner_rating_score, run.phone as runner_phone,
                   t.id as transaction_id, t.stripe_payment_intent, t.stripe_transfer_id, t.amount as transaction_amount,
                   t.service_fee as transaction_service_fee, t.runner_payout, t.status as transaction_status
            FROM errands e
            JOIN users req ON e.requester_id = req.id
            LEFT JOIN users run ON e.runner_id = run.id
            LEFT JOIN transactions t ON t.errand_id = e.id
            WHERE e.id = $1
        `, [req.params.id]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const row = errandResult.rows[0];
        const errand = transformErrand(row);

        // Add phone numbers to requester/runner
        if (errand.requester) errand.requester.phone = row.requester_phone;
        if (errand.runner) errand.runner.phone = row.runner_phone;

        // Add transaction if exists
        if (row.transaction_id) {
            errand.transaction = {
                id: row.transaction_id,
                stripePaymentIntent: row.stripe_payment_intent,
                stripeTransferId: row.stripe_transfer_id,
                amount: parseFloat(row.transaction_amount),
                serviceFee: parseFloat(row.transaction_service_fee),
                runnerPayout: parseFloat(row.runner_payout),
                status: row.transaction_status
            };
        }

        // Get messages
        const messagesResult = await pool.query(`
            SELECT m.*, s.name as sender_name, s.avatar_url as sender_avatar_url
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            WHERE m.errand_id = $1
            ORDER BY m.created_at ASC
            LIMIT 50
        `, [req.params.id]);

        errand.messages = messagesResult.rows.map(m => ({
            id: m.id,
            content: m.content,
            isRead: m.is_read,
            createdAt: m.created_at,
            sender: {
                id: m.sender_id,
                name: m.sender_name,
                avatarUrl: m.sender_avatar_url
            }
        }));

        // Add valid transitions for UI
        const validNextStates = getValidNextStates(errand.status);

        res.json({
            errand,
            validTransitions: validNextStates
        });
    } catch (error) {
        console.error('Get errand error:', error);
        res.status(500).json({ error: 'Failed to get errand' });
    }
});

// POST /api/errands/:id/accept - Accept errand (Runner)
router.post('/:id/accept', authMiddleware, async (req, res) => {
    try {
        const errandResult = await pool.query(`SELECT * FROM errands WHERE id = $1`, [req.params.id]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errandRow = errandResult.rows[0];
        const errand = {
            status: errandRow.status,
            requesterId: errandRow.requester_id,
            runnerId: errandRow.runner_id
        };

        // Check permissions
        const canTransition = canUserTransition(req.user, errand, 'ACTIVE');
        if (!canTransition.allowed) {
            return res.status(403).json({ error: canTransition.reason });
        }

        // Update errand
        const updateResult = await pool.query(`
            UPDATE errands 
            SET status = 'ACTIVE', runner_id = $1, accepted_at = NOW(), updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [req.user.id, req.params.id]);

        // Get full errand with users
        const fullResult = await pool.query(`
            SELECT e.*,
                   req.name as requester_name, req.avatar_url as requester_avatar_url,
                   run.name as runner_name, run.avatar_url as runner_avatar_url
            FROM errands e
            JOIN users req ON e.requester_id = req.id
            LEFT JOIN users run ON e.runner_id = run.id
            WHERE e.id = $1
        `, [req.params.id]);

        const updatedErrand = transformErrand(fullResult.rows[0]);

        // Notify requester via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${errandRow.requester_id}`).emit('errand-accepted', updatedErrand);
        }

        res.json({
            message: 'Errand accepted! 🏃 Get moving!',
            errand: updatedErrand
        });
    } catch (error) {
        console.error('Accept errand error:', error);
        res.status(500).json({ error: 'Failed to accept errand' });
    }
});

// POST /api/errands/:id/complete - Mark errand as complete (Runner)
router.post('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const { proofPhotoUrl } = req.body;

        const errandResult = await pool.query(`SELECT * FROM errands WHERE id = $1`, [req.params.id]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errandRow = errandResult.rows[0];
        const errand = {
            status: errandRow.status,
            requesterId: errandRow.requester_id,
            runnerId: errandRow.runner_id
        };

        // Check permissions
        const canTransition = canUserTransition(req.user, errand, 'COMPLETED');
        if (!canTransition.allowed) {
            return res.status(403).json({ error: canTransition.reason });
        }

        // Update errand
        await pool.query(`
            UPDATE errands 
            SET status = 'COMPLETED', proof_photo_url = $1, completed_at = NOW(), updated_at = NOW()
            WHERE id = $2
        `, [proofPhotoUrl || null, req.params.id]);

        // Get full errand with users
        const fullResult = await pool.query(`
            SELECT e.*,
                   req.name as requester_name, req.avatar_url as requester_avatar_url,
                   run.name as runner_name, run.avatar_url as runner_avatar_url
            FROM errands e
            JOIN users req ON e.requester_id = req.id
            LEFT JOIN users run ON e.runner_id = run.id
            WHERE e.id = $1
        `, [req.params.id]);

        const updatedErrand = transformErrand(fullResult.rows[0]);

        // Notify requester
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${errandRow.requester_id}`).emit('errand-completed', updatedErrand);
        }

        res.json({
            message: 'Errand marked as complete! ✅ Waiting for approval...',
            errand: updatedErrand
        });
    } catch (error) {
        console.error('Complete errand error:', error);
        res.status(500).json({ error: 'Failed to complete errand' });
    }
});

// POST /api/errands/:id/release - Release funds (Lazy user)
router.post('/:id/release', authMiddleware, async (req, res) => {
    try {
        // Get errand with transaction
        const errandResult = await pool.query(`
            SELECT e.*, t.id as transaction_id
            FROM errands e
            LEFT JOIN transactions t ON t.errand_id = e.id
            WHERE e.id = $1
        `, [req.params.id]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errandRow = errandResult.rows[0];
        const errand = {
            status: errandRow.status,
            requesterId: errandRow.requester_id,
            runnerId: errandRow.runner_id
        };

        // Check permissions
        const canTransition = canUserTransition(req.user, errand, 'RELEASED');
        if (!canTransition.allowed) {
            return res.status(403).json({ error: canTransition.reason });
        }

        // Start a transaction for multiple updates
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update errand status
            await client.query(`
                UPDATE errands SET status = 'RELEASED', released_at = NOW(), updated_at = NOW() WHERE id = $1
            `, [req.params.id]);

            // Update runner's earnings and karma
            await client.query(`
                UPDATE users 
                SET total_earnings = total_earnings + $1, karma_points = karma_points + 10, updated_at = NOW()
                WHERE id = $2
            `, [parseFloat(errandRow.bounty_amount), errandRow.runner_id]);

            // Update requester's spending
            await client.query(`
                UPDATE users 
                SET total_spent = total_spent + $1, karma_points = karma_points + 5, updated_at = NOW()
                WHERE id = $2
            `, [parseFloat(errandRow.bounty_amount) + parseFloat(errandRow.service_fee), errandRow.requester_id]);

            // Update transaction status if exists
            if (errandRow.transaction_id) {
                await client.query(`
                    UPDATE transactions SET status = 'RELEASED', updated_at = NOW() WHERE id = $1
                `, [errandRow.transaction_id]);
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        // Get updated errand
        const fullResult = await pool.query(`
            SELECT e.*,
                   req.id as requester_id, req.name as requester_name,
                   run.id as runner_id, run.name as runner_name
            FROM errands e
            JOIN users req ON e.requester_id = req.id
            LEFT JOIN users run ON e.runner_id = run.id
            WHERE e.id = $1
        `, [req.params.id]);

        const updatedErrand = transformErrand(fullResult.rows[0]);

        // Notify runner
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${errandRow.runner_id}`).emit('payment-released', {
                errand: updatedErrand,
                amount: parseFloat(errandRow.bounty_amount)
            });
        }

        res.json({
            message: `Payment of $${errandRow.bounty_amount} released! 💰`,
            errand: updatedErrand
        });
    } catch (error) {
        console.error('Release funds error:', error);
        res.status(500).json({ error: 'Failed to release funds' });
    }
});

// POST /api/errands/:id/cancel - Cancel errand (Lazy user, only if PENDING)
router.post('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const errandResult = await pool.query(`SELECT * FROM errands WHERE id = $1`, [req.params.id]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errandRow = errandResult.rows[0];
        const errand = {
            status: errandRow.status,
            requesterId: errandRow.requester_id,
            runnerId: errandRow.runner_id
        };

        // Check permissions
        const canTransition = canUserTransition(req.user, errand, 'CANCELLED');
        if (!canTransition.allowed) {
            return res.status(403).json({ error: canTransition.reason });
        }

        await pool.query(`
            UPDATE errands SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1
        `, [req.params.id]);

        const updatedResult = await pool.query(`SELECT * FROM errands WHERE id = $1`, [req.params.id]);
        const updatedErrand = transformErrand(updatedResult.rows[0]);

        res.json({
            message: 'Errand cancelled',
            errand: updatedErrand
        });
    } catch (error) {
        console.error('Cancel errand error:', error);
        res.status(500).json({ error: 'Failed to cancel errand' });
    }
});

// POST /api/errands/:id/dispute - Flag errand as disputed
router.post('/:id/dispute', authMiddleware, async (req, res) => {
    try {
        const { reason } = req.body;

        const errandResult = await pool.query(`SELECT * FROM errands WHERE id = $1`, [req.params.id]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errandRow = errandResult.rows[0];
        const errand = {
            status: errandRow.status,
            requesterId: errandRow.requester_id,
            runnerId: errandRow.runner_id
        };

        // Check permissions
        const canTransition = canUserTransition(req.user, errand, 'DISPUTED');
        if (!canTransition.allowed) {
            return res.status(403).json({ error: canTransition.reason });
        }

        await pool.query(`
            UPDATE errands SET status = 'DISPUTED', updated_at = NOW() WHERE id = $1
        `, [req.params.id]);

        const updatedResult = await pool.query(`SELECT * FROM errands WHERE id = $1`, [req.params.id]);
        const updatedErrand = transformErrand(updatedResult.rows[0]);

        res.json({
            message: 'Errand flagged for review. Our team will investigate.',
            errand: updatedErrand
        });
    } catch (error) {
        console.error('Dispute errand error:', error);
        res.status(500).json({ error: 'Failed to dispute errand' });
    }
});

module.exports = router;
