const express = require('express');
const { prisma } = require('../models/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { idempotent } = require('../middleware/idempotency');
const { applyWalletChange, getBalance, InsufficientFundsError } = require('../services/walletService');
const { notify } = require('../services/notificationService');

const router = express.Router();

const MIN_TOPUP = 100;
const MAX_TOPUP = 1000000;
const MIN_WITHDRAWAL = 500;

const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;

const toTransaction = (t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    balanceAfter: Number(t.balanceAfter),
    description: t.description,
    errandId: t.errandId,
    status: t.status,
    createdAt: t.createdAt
});

const toBankAccount = (b) => ({
    id: b.id,
    bankName: b.bankName,
    accountNumber: b.accountNumber,
    accountName: b.accountName,
    isDefault: b.isDefault
});

// GET /api/wallet - Balance and the latest activity
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [balance, recent] = await Promise.all([
            getBalance(req.user.id),
            prisma.walletTransaction.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        res.json({
            balance,
            currency: 'NGN',
            // Top-ups are instant "test money" until a payment gateway is connected
            topupMode: process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_TOPUP !== 'true' ? 'unavailable' : 'test',
            recent: recent.map(toTransaction)
        });
    } catch (error) {
        console.error('Get wallet error:', error);
        res.status(500).json({ error: 'Failed to load your wallet' });
    }
});

// GET /api/wallet/transactions - Full history
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const rows = await prisma.walletTransaction.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        res.json({ transactions: rows.map(toTransaction) });
    } catch (error) {
        console.error('Get wallet transactions error:', error);
        res.status(500).json({ error: 'Failed to load transactions' });
    }
});

// POST /api/wallet/topup - Add money
router.post('/topup', authMiddleware, idempotent, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_TOPUP !== 'true') {
            return res.status(503).json({ error: 'Adding money is not available yet' });
        }

        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
            return res.status(400).json({
                error: `Enter an amount between ${naira(MIN_TOPUP)} and ${naira(MAX_TOPUP)}`
            });
        }

        const balance = await prisma.$transaction((tx) =>
            applyWalletChange(tx, req.user.id, amount, {
                type: 'TOPUP',
                description: 'Added money (test top-up)'
            })
        );

        notify(req.app.get('io'), req.user.id, {
            type: 'WALLET',
            title: 'Money added',
            body: `${naira(amount)} is now in your wallet.`
        });

        res.status(201).json({ message: `${naira(amount)} added to your wallet`, balance: Number(balance) });
    } catch (error) {
        console.error('Top up error:', error);
        res.status(500).json({ error: 'Failed to add money' });
    }
});

// POST /api/wallet/withdraw - Request a payout to a saved bank account
router.post('/withdraw', authMiddleware, idempotent, async (req, res) => {
    try {
        const amount = Number(req.body.amount);
        const { bankAccountId } = req.body;

        if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
            return res.status(400).json({ error: `The smallest withdrawal is ${naira(MIN_WITHDRAWAL)}` });
        }

        const account = await prisma.bankAccount.findFirst({
            where: { id: bankAccountId, userId: req.user.id }
        });

        if (!account) {
            return res.status(400).json({ error: 'Choose a bank account to withdraw to' });
        }

        const balance = await prisma.$transaction((tx) =>
            applyWalletChange(tx, req.user.id, -amount, {
                type: 'WITHDRAWAL',
                description: `Withdrawal to ${account.bankName} ${account.accountNumber.slice(-4).padStart(10, '*')}`,
                status: 'PENDING'
            })
        );

        notify(req.app.get('io'), req.user.id, {
            type: 'WALLET',
            title: 'Withdrawal requested',
            body: `${naira(amount)} is on its way to ${account.bankName}.`
        });

        res.status(201).json({
            message: `Withdrawal of ${naira(amount)} requested`,
            balance: Number(balance)
        });
    } catch (error) {
        if (error instanceof InsufficientFundsError) {
            return res.status(402).json({ error: 'You do not have that much in your wallet' });
        }
        console.error('Withdraw error:', error);
        res.status(500).json({ error: 'Failed to request withdrawal' });
    }
});

// ---------------------------------------------------------------------------
// Bank accounts (where withdrawals are paid out)
// ---------------------------------------------------------------------------

// GET /api/wallet/bank-accounts
router.get('/bank-accounts', authMiddleware, async (req, res) => {
    try {
        const accounts = await prisma.bankAccount.findMany({
            where: { userId: req.user.id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
        });

        res.json({ accounts: accounts.map(toBankAccount) });
    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Failed to load bank accounts' });
    }
});

// POST /api/wallet/bank-accounts
router.post('/bank-accounts', authMiddleware, async (req, res) => {
    try {
        const bankName = String(req.body.bankName || '').trim();
        const accountName = String(req.body.accountName || '').trim();
        const accountNumber = String(req.body.accountNumber || '').trim();

        if (!bankName || !accountName) {
            return res.status(400).json({ error: 'Bank name and account name are required' });
        }

        if (!/^\d{10}$/.test(accountNumber)) {
            return res.status(400).json({ error: 'Account number must be 10 digits' });
        }

        const existing = await prisma.bankAccount.count({ where: { userId: req.user.id } });

        const account = await prisma.bankAccount.create({
            data: {
                userId: req.user.id,
                bankName,
                accountName,
                accountNumber,
                isDefault: existing === 0
            }
        });

        res.status(201).json({ message: 'Bank account added', account: toBankAccount(account) });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'That bank account is already saved' });
        }
        console.error('Add bank account error:', error);
        res.status(500).json({ error: 'Failed to add bank account' });
    }
});

// PATCH /api/wallet/bank-accounts/:id/default
router.patch('/bank-accounts/:id/default', authMiddleware, async (req, res) => {
    try {
        const account = await prisma.bankAccount.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        await prisma.$transaction([
            prisma.bankAccount.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } }),
            prisma.bankAccount.update({ where: { id: account.id }, data: { isDefault: true } })
        ]);

        res.json({ message: 'Default account updated' });
    } catch (error) {
        console.error('Set default bank account error:', error);
        res.status(500).json({ error: 'Failed to update default account' });
    }
});

// DELETE /api/wallet/bank-accounts/:id
router.delete('/bank-accounts/:id', authMiddleware, async (req, res) => {
    try {
        const account = await prisma.bankAccount.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        await prisma.bankAccount.delete({ where: { id: account.id } });

        // Keep one default if any accounts remain
        if (account.isDefault) {
            const next = await prisma.bankAccount.findFirst({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'asc' }
            });
            if (next) {
                await prisma.bankAccount.update({ where: { id: next.id }, data: { isDefault: true } });
            }
        }

        res.json({ message: 'Bank account removed' });
    } catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({ error: 'Failed to remove bank account' });
    }
});

module.exports = router;
