/**
 * Initial schema migration
 */
async function up(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email           TEXT NOT NULL UNIQUE,
            password        TEXT NOT NULL,
            name            TEXT NOT NULL,
            phone           TEXT,
            avatar_url      TEXT,
            rating_score    NUMERIC(3,2) NOT NULL DEFAULT 5.00,
            karma_points    INTEGER NOT NULL DEFAULT 0,
            total_earnings  NUMERIC(10,2) NOT NULL DEFAULT 0,
            total_spent     NUMERIC(10,2) NOT NULL DEFAULT 0,
            current_role    TEXT NOT NULL DEFAULT 'LAZY' CHECK (current_role IN ('LAZY', 'RUNNER')),
            stripe_account_id  TEXT,
            stripe_customer_id TEXT,
            is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
            push_token      TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS errands (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title           TEXT NOT NULL,
            description     TEXT NOT NULL,
            category        TEXT NOT NULL CHECK (category IN ('FOOD', 'STORE', 'HOME', 'QUICK')),
            bounty_amount   NUMERIC(10,2) NOT NULL,
            service_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
            status          TEXT NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'RELEASED', 'DISPUTED', 'CANCELLED')),
            location_lat    NUMERIC(10,7) NOT NULL,
            location_lng    NUMERIC(10,7) NOT NULL,
            address         TEXT,
            proof_photo_url TEXT,
            requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            runner_id       UUID REFERENCES users(id) ON DELETE SET NULL,
            accepted_at     TIMESTAMPTZ,
            completed_at    TIMESTAMPTZ,
            released_at     TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            errand_id               UUID NOT NULL REFERENCES errands(id) ON DELETE CASCADE,
            stripe_payment_intent   TEXT,
            stripe_transfer_id      TEXT,
            amount                  NUMERIC(10,2) NOT NULL,
            service_fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
            runner_payout           NUMERIC(10,2) NOT NULL DEFAULT 0,
            status                  TEXT NOT NULL DEFAULT 'PENDING',
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            errand_id   UUID NOT NULL REFERENCES errands(id) ON DELETE CASCADE,
            sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content     TEXT NOT NULL,
            is_read     BOOLEAN NOT NULL DEFAULT FALSE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS ratings (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            errand_id   UUID NOT NULL REFERENCES errands(id) ON DELETE CASCADE,
            rater_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            rated_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            score       SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
            comment     TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

async function down(client) {
    // Drop tables in reverse order due to foreign key constraints
    await client.query(`DROP TABLE IF EXISTS ratings;`);
    await client.query(`DROP TABLE IF EXISTS messages;`);
    await client.query(`DROP TABLE IF EXISTS transactions;`);
    await client.query(`DROP TABLE IF EXISTS errands;`);
    await client.query(`DROP TABLE IF EXISTS users;`);
}

module.exports = { up, down };
