const { prisma } = require('../models/db');

// A request still "in flight" for longer than this is assumed to have died (server restart, crash),
// so its key is released and the retry is allowed through.
const STALE_AFTER_MS = 60 * 1000;

/**
 * Idempotency for requests that move money or create things.
 *
 * The client sends an `Idempotency-Key` header (one fresh key per user action). The first request with a
 * key runs normally and its result is remembered. Any repeat with the same key gets that same result back
 * (marked with `Idempotent-Replay: true`) and the work is NOT done again. A repeat that arrives while the
 * first is still running gets 409. Requests without a key behave as before.
 *
 * Use after authMiddleware:  router.post('/', authMiddleware, idempotent, handler)
 */
const idempotent = async (req, res, next) => {
    const key = req.get('Idempotency-Key');
    if (!key) return next();

    if (key.length > 100) {
        return res.status(400).json({ error: 'Idempotency-Key is too long' });
    }

    const userId = req.user.id;
    const route = `${req.method} ${req.baseUrl}${req.path}`;

    try {
        await prisma.idempotencyKey.create({ data: { userId, key, route } });
    } catch (error) {
        if (error.code !== 'P2002') {
            console.error('Idempotency error:', error);
            return res.status(500).json({ error: 'Something went wrong. Please try again.' });
        }

        // This key has been used before
        const existing = await prisma.idempotencyKey.findUnique({
            where: { userId_key: { userId, key } }
        });

        if (!existing) return idempotent(req, res, next); // removed in between: try again

        if (existing.route !== route) {
            return res.status(422).json({ error: 'That request key was already used for something else' });
        }

        if (existing.response !== null && existing.status !== null) {
            res.set('Idempotent-Replay', 'true');
            return res.status(existing.status).json(existing.response);
        }

        // Still running: let it finish, unless it looks dead
        if (Date.now() - existing.createdAt.getTime() > STALE_AFTER_MS) {
            await prisma.idempotencyKey.deleteMany({ where: { userId, key, response: { equals: null } } }).catch(() => {});
            return idempotent(req, res, next);
        }

        return res.status(409).json({ error: 'That is already being processed. Give it a moment.' });
    }

    // First time we have seen this key: remember the outcome once the handler responds.
    // Successes are stored (so repeats replay them). Failures release the key so a corrected retry works.
    const send = res.json.bind(res);
    res.json = (body) => {
        const status = res.statusCode || 200;
        const save =
            status < 300
                ? prisma.idempotencyKey.update({
                      where: { userId_key: { userId, key } },
                      // Round-trip through JSON so dates and decimals are stored exactly as the client received them
                      data: { status, response: JSON.parse(JSON.stringify(body)) }
                  })
                : prisma.idempotencyKey.delete({ where: { userId_key: { userId, key } } });

        // Save before replying so an instant retry can already see the stored result
        save.catch((err) => console.error('Idempotency save error:', err)).finally(() => send(body));
        return res;
    };

    next();
};

module.exports = { idempotent };
