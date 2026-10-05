const { prisma } = require('../models/db');

class InsufficientFundsError extends Error {
    constructor(balance, required) {
        super('Not enough money in your wallet');
        this.code = 'INSUFFICIENT_FUNDS';
        this.balance = balance;
        this.required = required;
    }
}

/**
 * Move money in or out of a user's wallet and write a ledger line.
 * Must run inside a prisma.$transaction callback (pass its `tx`), so a failure rolls everything back.
 * `delta` is signed: positive adds money, negative takes it out.
 */
const applyWalletChange = async (tx, userId, delta, { type, description, errandId = null, status = 'COMPLETED' }) => {
    const user = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: delta } },
        select: { walletBalance: true }
    });

    // The increment is atomic, so a negative result means the wallet could not cover it. Roll back.
    if (Number(user.walletBalance) < 0) {
        throw new InsufficientFundsError(Number(user.walletBalance) - delta, Math.abs(delta));
    }

    await tx.walletTransaction.create({
        data: {
            userId,
            type,
            amount: delta,
            balanceAfter: user.walletBalance,
            description,
            errandId,
            status
        }
    });

    return user.walletBalance;
};

const getBalance = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
    return Number(user?.walletBalance ?? 0);
};

module.exports = { applyWalletChange, getBalance, InsufficientFundsError };
