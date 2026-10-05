const express = require('express');
const { prisma } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { idempotent } = require('../middleware/idempotency');
const { canUserTransition, getValidNextStates } = require('../services/errandStateMachine');
const { applyWalletChange, InsufficientFundsError } = require('../services/walletService');
const { notify } = require('../services/notificationService');

const naira = (n) => `\u20a6${Number(n).toLocaleString('en-NG')}`;

const router = express.Router();

// Smallest bounty, in naira (keep in sync with MIN_BOUNTY in the mobile app)
const MIN_BOUNTY = parseFloat(process.env.MIN_BOUNTY) || 100;

const VALID_CATEGORIES = ['FOOD', 'STORE', 'HOME', 'QUICK'];
const VALID_STATUSES = ['PENDING', 'ACTIVE', 'COMPLETED', 'RELEASED', 'DISPUTED', 'CANCELLED'];

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

// Relation selects shared by the queries below
const USER_BRIEF = { id: true, name: true, avatarUrl: true, ratingScore: true };
const USER_WITH_PHONE = { ...USER_BRIEF, phone: true };
const WITH_USERS = {
    requester: { select: USER_BRIEF },
    runner: { select: USER_BRIEF }
};

const transformUser = (user) => user ? {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    ratingScore: user.ratingScore != null ? Number(user.ratingScore) : null
} : undefined;

const transformTransaction = (t) => t ? {
    id: t.id,
    stripePaymentIntent: t.stripePaymentIntent,
    stripeTransferId: t.stripeTransferId,
    amount: Number(t.amount),
    serviceFee: Number(t.serviceFee),
    runnerPayout: Number(t.runnerPayout),
    status: t.status
} : undefined;

// Helper to transform a Prisma errand (optionally with requester/runner) to the API shape
const transformErrand = (e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    bountyAmount: Number(e.bountyAmount),
    serviceFee: Number(e.serviceFee),
    status: e.status,
    locationLat: Number(e.locationLat),
    locationLng: Number(e.locationLng),
    address: e.address,
    proofPhotoUrl: e.proofPhotoUrl,
    requesterId: e.requesterId,
    runnerId: e.runnerId,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    acceptedAt: e.acceptedAt,
    completedAt: e.completedAt,
    releasedAt: e.releasedAt,
    requester: transformUser(e.requester),
    runner: transformUser(e.runner)
});

class AlreadyChangedError extends Error {}

// Move an errand to a new status only if it is still in `from`; throws if another request got there first
const moveStatus = async (tx, id, from, data) => {
    const { count } = await tx.errand.updateMany({ where: { id, status: from }, data });
    if (count !== 1) throw new AlreadyChangedError();
};

// Look up an errand and run the state-machine permission check for a transition
const loadForTransition = async (req, newStatus) => {
    const errand = await prisma.errand.findUnique({ where: { id: req.params.id } });

    if (!errand) {
        return { status: 404, error: 'Errand not found' };
    }

    const canTransition = canUserTransition(req.user, errand, newStatus);
    if (!canTransition.allowed) {
        return { status: 403, error: canTransition.reason };
    }

    return { errand };
};

// POST /api/errands - Create new errand (Lazy user)
router.post('/', authMiddleware, idempotent, async (req, res) => {
    try {
        const { title, description, category, bountyAmount, locationLat, locationLng, address } = req.body;

        // Validation
        if (!title || !description || !category || !bountyAmount || !locationLat || !locationLng) {
            return res.status(400).json({
                error: 'Title, description, category, bounty, and location are required'
            });
        }

        if (bountyAmount < MIN_BOUNTY) {
            return res.status(400).json({ error: `Bounty must be at least ₦${MIN_BOUNTY}` });
        }

        if (!VALID_CATEGORIES.includes(category.toUpperCase())) {
            return res.status(400).json({
                error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
            });
        }

        const serviceFee = calculateServiceFee(bountyAmount);

        // Create the errand and hold bounty + fee from the wallet in one go (escrow)
        const total = parseFloat(bountyAmount) + serviceFee;

        const row = await prisma.$transaction(async (tx) => {
            const created = await tx.errand.create({
                data: {
                    title,
                    description,
                    category: category.toUpperCase(),
                    bountyAmount: parseFloat(bountyAmount),
                    serviceFee,
                    locationLat: parseFloat(locationLat),
                    locationLng: parseFloat(locationLng),
                    address: address || null,
                    requesterId: req.user.id,
                    status: 'PENDING'
                },
                include: { requester: { select: USER_BRIEF } }
            });

            await applyWalletChange(tx, req.user.id, -total, {
                type: 'ESCROW_HOLD',
                description: `Held for "${created.title}"`,
                errandId: created.id
            });

            return created;
        });

        const errand = transformErrand(row);

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
        if (error instanceof InsufficientFundsError) {
            return res.status(402).json({
                code: 'INSUFFICIENT_FUNDS',
                error: `Add ${naira(Math.ceil(error.required - error.balance))} to your wallet to send this errand`,
                balance: error.balance,
                required: error.required
            });
        }
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

        if (category && !VALID_CATEGORIES.includes(category.toUpperCase())) {
            return res.status(400).json({
                error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
            });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const radius = parseFloat(radiusKm);

        // Get all pending errands not created by this user
        const rows = await prisma.errand.findMany({
            where: {
                status: 'PENDING',
                requesterId: { not: req.user.id },
                ...(category && { category: category.toUpperCase() })
            },
            include: { requester: { select: USER_BRIEF } },
            orderBy: { createdAt: 'desc' }
        });

        // Filter by distance
        const nearbyErrands = rows
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
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (category && !VALID_CATEGORIES.includes(category.toUpperCase())) {
            return res.status(400).json({
                error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
            });
        }

        const where = {
            status: { in: ['PENDING', 'ACTIVE'] },
            ...(category && { category: category.toUpperCase() })
        };

        // Get errands with requester and runner info, plus the total count
        const [rows, total] = await Promise.all([
            prisma.errand.findMany({
                where,
                include: WITH_USERS,
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.errand.count({ where })
        ]);

        res.json({
            errands: rows.map(transformErrand),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
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

        if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
            return res.status(400).json({
                error: `Status must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }

        let roleFilter;
        if (role === 'lazy' || role === 'requester') {
            roleFilter = { requesterId: req.user.id };
        } else if (role === 'runner') {
            roleFilter = { runnerId: req.user.id };
        } else {
            roleFilter = { OR: [{ requesterId: req.user.id }, { runnerId: req.user.id }] };
        }

        const rows = await prisma.errand.findMany({
            where: {
                ...roleFilter,
                ...(status && { status: status.toUpperCase() })
            },
            include: { ...WITH_USERS, transaction: true },
            orderBy: { createdAt: 'desc' }
        });

        const errands = rows.map(row => {
            const errand = transformErrand(row);
            if (row.transaction) {
                errand.transaction = transformTransaction(row.transaction);
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
        // Get errand with requester, runner, transaction and messages
        const row = await prisma.errand.findUnique({
            where: { id: req.params.id },
            include: {
                requester: { select: USER_WITH_PHONE },
                runner: { select: USER_WITH_PHONE },
                transaction: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                    include: { sender: { select: { id: true, name: true, avatarUrl: true } } }
                }
            }
        });

        if (!row) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errand = transformErrand(row);

        // Add phone numbers to requester/runner
        if (errand.requester) errand.requester.phone = row.requester.phone;
        if (errand.runner) errand.runner.phone = row.runner.phone;

        // Add transaction if exists
        if (row.transaction) {
            errand.transaction = transformTransaction(row.transaction);
        }

        errand.messages = row.messages.map(m => ({
            id: m.id,
            content: m.content,
            isRead: m.isRead,
            createdAt: m.createdAt,
            sender: {
                id: m.sender.id,
                name: m.sender.name,
                avatarUrl: m.sender.avatarUrl
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
        const loaded = await loadForTransition(req, 'ACTIVE');
        if (loaded.error) {
            return res.status(loaded.status).json({ error: loaded.error });
        }
        const { errand } = loaded;

        // Update errand and get it back with users
        const row = await prisma.errand.update({
            where: { id: req.params.id },
            data: {
                status: 'ACTIVE',
                runnerId: req.user.id,
                acceptedAt: new Date()
            },
            include: WITH_USERS
        });

        const updatedErrand = transformErrand(row);

        // Notify requester via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${errand.requesterId}`).emit('errand-accepted', updatedErrand);
        }

        notify(io, errand.requesterId, {
            type: 'ERRAND_ACCEPTED',
            title: `${req.user.name} picked up your errand`,
            body: `"${updatedErrand.title}" is on its way.`,
            errandId: errand.id
        });

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

        const loaded = await loadForTransition(req, 'COMPLETED');
        if (loaded.error) {
            return res.status(loaded.status).json({ error: loaded.error });
        }
        const { errand } = loaded;

        const row = await prisma.errand.update({
            where: { id: req.params.id },
            data: {
                status: 'COMPLETED',
                proofPhotoUrl: proofPhotoUrl || null,
                completedAt: new Date()
            },
            include: WITH_USERS
        });

        const updatedErrand = transformErrand(row);

        // Notify requester
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${errand.requesterId}`).emit('errand-completed', updatedErrand);
        }

        notify(io, errand.requesterId, {
            type: 'ERRAND_COMPLETED',
            title: 'Your errand is done',
            body: `"${updatedErrand.title}" is finished. Release payment when you are happy.`,
            errandId: errand.id
        });

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
        const loaded = await loadForTransition(req, 'RELEASED');
        if (loaded.error) {
            return res.status(loaded.status).json({ error: loaded.error });
        }
        const { errand } = loaded;

        const bounty = Number(errand.bountyAmount);
        const serviceFee = Number(errand.serviceFee);
        const now = new Date();

        // Update the errand, both users' stats and the runner's wallet in ONE transaction.
        // The service fee stays with Lazy Neighbour; the bounty goes to the runner's wallet.
        const row = await prisma.$transaction(async (tx) => {
            await moveStatus(tx, errand.id, errand.status, { status: 'RELEASED', releasedAt: now });
            const released = await tx.errand.findUnique({ where: { id: errand.id }, include: WITH_USERS });

            await tx.user.update({
                where: { id: errand.runnerId },
                data: { totalEarnings: { increment: bounty }, karmaPoints: { increment: 10 } }
            });

            await tx.user.update({
                where: { id: errand.requesterId },
                data: { totalSpent: { increment: bounty + serviceFee }, karmaPoints: { increment: 5 } }
            });

            await tx.transaction.updateMany({
                where: { errandId: errand.id },
                data: { status: 'RELEASED', updatedAt: now }
            });

            await applyWalletChange(tx, errand.runnerId, bounty, {
                type: 'EARNING',
                description: `Paid for "${errand.title}"`,
                errandId: errand.id
            });

            return released;
        });

        const updatedErrand = transformErrand(row);

        // Notify runner
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${errand.runnerId}`).emit('payment-released', {
                errand: updatedErrand,
                amount: bounty
            });
        }

        notify(io, errand.runnerId, {
            type: 'PAYMENT_RECEIVED',
            title: `You earned ${naira(bounty)}`,
            body: `It is in your wallet for "${errand.title}".`,
            errandId: errand.id
        });

        res.json({
            message: `Payment of ₦${errand.bountyAmount} released!`,
            errand: updatedErrand
        });
    } catch (error) {
        if (error instanceof AlreadyChangedError) {
            return res.status(409).json({ error: 'This errand was just updated. Pull to refresh and try again.' });
        }
        console.error('Release funds error:', error);
        res.status(500).json({ error: 'Failed to release funds' });
    }
});

// POST /api/errands/:id/cancel - Cancel errand (Lazy user, only if PENDING)
router.post('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const loaded = await loadForTransition(req, 'CANCELLED');
        if (loaded.error) {
            return res.status(loaded.status).json({ error: loaded.error });
        }

        const { errand } = loaded;
        const refund = Number(errand.bountyAmount) + Number(errand.serviceFee);

        // Cancel and give the held money back in one go (only PENDING errands can be cancelled by the requester)
        const updated = await prisma.$transaction(async (tx) => {
            await moveStatus(tx, errand.id, errand.status, { status: 'CANCELLED' });
            const row = await tx.errand.findUnique({ where: { id: errand.id } });

            await applyWalletChange(tx, errand.requesterId, refund, {
                type: 'ESCROW_REFUND',
                description: `Refund for "${errand.title}"`,
                errandId: errand.id
            });

            return row;
        });

        res.json({
            message: 'Errand cancelled and your money is back in your wallet',
            errand: transformErrand(updated)
        });
    } catch (error) {
        if (error instanceof AlreadyChangedError) {
            return res.status(409).json({ error: 'This errand was just updated. Pull to refresh and try again.' });
        }
        console.error('Cancel errand error:', error);
        res.status(500).json({ error: 'Failed to cancel errand' });
    }
});

// POST /api/errands/:id/dispute - Flag errand as disputed
router.post('/:id/dispute', authMiddleware, async (req, res) => {
    try {
        const loaded = await loadForTransition(req, 'DISPUTED');
        if (loaded.error) {
            return res.status(loaded.status).json({ error: loaded.error });
        }

        const updated = await prisma.errand.update({
            where: { id: req.params.id },
            data: { status: 'DISPUTED' }
        });

        res.json({
            message: 'Errand flagged for review. Our team will investigate.',
            errand: transformErrand(updated)
        });
    } catch (error) {
        console.error('Dispute errand error:', error);
        res.status(500).json({ error: 'Failed to dispute errand' });
    }
});

module.exports = router;
