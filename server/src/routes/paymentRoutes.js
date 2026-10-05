const express = require('express');
const { prisma } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Stripe setup (conditional - only if keys are provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// POST /api/payments/create-payment-intent - Create payment intent for errand
router.post('/create-payment-intent', authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({
                error: 'Payment system not configured. Please add Stripe keys.'
            });
        }

        const { errandId } = req.body;

        const errand = await prisma.errand.findUnique({ where: { id: errandId } });

        if (!errand) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        if (errand.requesterId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const serviceFee = Number(errand.serviceFee);
        const totalAmount = Number(errand.bountyAmount) + serviceFee;

        // Create payment intent with manual capture (for escrow)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'ngn',
            capture_method: 'manual', // Hold funds, capture later
            metadata: {
                errandId: errand.id,
                requesterId: req.user.id,
                bountyAmount: errand.bountyAmount.toString(),
                serviceFee: errand.serviceFee.toString()
            }
        });

        // Create (or replace, on retry) the transaction record
        await prisma.transaction.upsert({
            where: { errandId: errand.id },
            create: {
                errandId: errand.id,
                stripePaymentIntent: paymentIntent.id,
                amount: totalAmount,
                serviceFee,
                status: 'HELD'
            },
            update: {
                stripePaymentIntent: paymentIntent.id,
                amount: totalAmount,
                serviceFee,
                status: 'HELD'
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: totalAmount
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// POST /api/payments/capture - Capture held funds (when releasing to runner)
router.post('/capture', authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Payment system not configured' });
        }

        const { errandId } = req.body;

        // Get errand with transaction and runner
        const errand = await prisma.errand.findUnique({
            where: { id: errandId },
            include: {
                transaction: true,
                runner: { select: { stripeAccountId: true } }
            }
        });

        if (!errand) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        if (errand.requesterId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (!errand.transaction?.stripePaymentIntent) {
            return res.status(400).json({ error: 'No payment to capture' });
        }

        // Capture the payment
        await stripe.paymentIntents.capture(errand.transaction.stripePaymentIntent);

        // If runner has a Stripe Connect account, create transfer
        const runnerStripeAccountId = errand.runner?.stripeAccountId;
        if (runnerStripeAccountId) {
            const bounty = Number(errand.bountyAmount);

            const transfer = await stripe.transfers.create({
                amount: Math.round(bounty * 100),
                currency: 'ngn',
                destination: runnerStripeAccountId,
                metadata: {
                    errandId: errand.id
                }
            });

            await prisma.transaction.update({
                where: { id: errand.transaction.id },
                data: {
                    stripeTransferId: transfer.id,
                    runnerPayout: bounty,
                    status: 'RELEASED'
                }
            });
        }

        res.json({ message: 'Payment captured and transferred' });
    } catch (error) {
        console.error('Capture payment error:', error);
        res.status(500).json({ error: 'Failed to capture payment' });
    }
});

// POST /api/payments/refund - Refund a cancelled errand
router.post('/refund', authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Payment system not configured' });
        }

        const { errandId } = req.body;

        const errand = await prisma.errand.findUnique({
            where: { id: errandId },
            include: { transaction: true }
        });

        if (!errand) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        if (!errand.transaction?.stripePaymentIntent) {
            return res.status(400).json({ error: 'No payment to refund' });
        }

        // Cancel the payment intent (releases the hold)
        await stripe.paymentIntents.cancel(errand.transaction.stripePaymentIntent);

        await prisma.transaction.update({
            where: { id: errand.transaction.id },
            data: { status: 'REFUNDED' }
        });

        res.json({ message: 'Payment refunded' });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ error: 'Failed to refund payment' });
    }
});

// POST /api/payments/connect-account - Create Stripe Connect account for runner
router.post('/connect-account', authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Payment system not configured' });
        }

        // Check if user already has an account
        if (req.user.stripeAccountId) {
            // Generate login link for existing account
            const loginLink = await stripe.accounts.createLoginLink(req.user.stripeAccountId);
            return res.json({ url: loginLink.url });
        }

        // Create Connect Express account
        const account = await stripe.accounts.create({
            type: 'express',
            email: req.user.email,
            metadata: {
                userId: req.user.id
            },
            capabilities: {
                transfers: { requested: true }
            }
        });

        // Save account ID
        await prisma.user.update({
            where: { id: req.user.id },
            data: { stripeAccountId: account.id }
        });

        // Create onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.APP_URL || 'http://localhost:3000'}/stripe/refresh`,
            return_url: `${process.env.APP_URL || 'http://localhost:3000'}/stripe/return`,
            type: 'account_onboarding'
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        console.error('Create connect account error:', error);
        res.status(500).json({ error: 'Failed to create payment account' });
    }
});

// GET /api/payments/balance - Get runner's Stripe balance
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.json({
                available: 0,
                pending: 0,
                message: 'Payment system not configured'
            });
        }

        if (!req.user.stripeAccountId) {
            return res.json({
                available: 0,
                pending: 0,
                message: 'No payment account connected'
            });
        }

        const balance = await stripe.balance.retrieve({
            stripeAccount: req.user.stripeAccountId
        });

        res.json({
            available: balance.available[0]?.amount / 100 || 0,
            pending: balance.pending[0]?.amount / 100 || 0
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to get balance' });
    }
});

module.exports = router;
