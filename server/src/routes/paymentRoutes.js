const express = require('express');
const { pool } = require('../models/db');
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

        const errandResult = await pool.query(`
            SELECT * FROM errands WHERE id = $1
        `, [errandId]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errand = errandResult.rows[0];

        if (errand.requester_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const totalAmount = parseFloat(errand.bounty_amount) + parseFloat(errand.service_fee);

        // Create payment intent with manual capture (for escrow)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'usd',
            capture_method: 'manual', // Hold funds, capture later
            metadata: {
                errandId: errand.id,
                requesterId: req.user.id,
                bountyAmount: errand.bounty_amount.toString(),
                serviceFee: errand.service_fee.toString()
            }
        });

        // Create transaction record
        await pool.query(`
            INSERT INTO transactions (errand_id, stripe_payment_intent, amount, service_fee, status)
            VALUES ($1, $2, $3, $4, 'HELD')
        `, [errand.id, paymentIntent.id, totalAmount, parseFloat(errand.service_fee)]);

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
        const errandResult = await pool.query(`
            SELECT e.*, t.id as transaction_id, t.stripe_payment_intent, 
                   r.stripe_account_id as runner_stripe_account_id
            FROM errands e
            LEFT JOIN transactions t ON t.errand_id = e.id
            LEFT JOIN users r ON e.runner_id = r.id
            WHERE e.id = $1
        `, [errandId]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errand = errandResult.rows[0];

        if (errand.requester_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (!errand.stripe_payment_intent) {
            return res.status(400).json({ error: 'No payment to capture' });
        }

        // Capture the payment
        await stripe.paymentIntents.capture(errand.stripe_payment_intent);

        // If runner has a Stripe Connect account, create transfer
        if (errand.runner_stripe_account_id) {
            const transfer = await stripe.transfers.create({
                amount: Math.round(parseFloat(errand.bounty_amount) * 100),
                currency: 'usd',
                destination: errand.runner_stripe_account_id,
                metadata: {
                    errandId: errand.id
                }
            });

            await pool.query(`
                UPDATE transactions 
                SET stripe_transfer_id = $1, runner_payout = $2, status = 'RELEASED', updated_at = NOW()
                WHERE id = $3
            `, [transfer.id, parseFloat(errand.bounty_amount), errand.transaction_id]);
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

        const errandResult = await pool.query(`
            SELECT e.*, t.id as transaction_id, t.stripe_payment_intent
            FROM errands e
            LEFT JOIN transactions t ON t.errand_id = e.id
            WHERE e.id = $1
        `, [errandId]);

        if (errandResult.rows.length === 0) {
            return res.status(404).json({ error: 'Errand not found' });
        }

        const errand = errandResult.rows[0];

        if (!errand.stripe_payment_intent) {
            return res.status(400).json({ error: 'No payment to refund' });
        }

        // Cancel the payment intent (releases the hold)
        await stripe.paymentIntents.cancel(errand.stripe_payment_intent);

        await pool.query(`
            UPDATE transactions SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1
        `, [errand.transaction_id]);

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
        await pool.query(`
            UPDATE users SET stripe_account_id = $1, updated_at = NOW() WHERE id = $2
        `, [account.id, req.user.id]);

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
