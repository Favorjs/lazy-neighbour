require('dotenv').config();
const { pool } = require('./src/models/db');
const { up } = require('./database/migrations/2026_01_25_0100_initial_schema');

async function setupDatabase() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await up(client);
        await client.query('COMMIT');
        console.log('✅ Database tables created successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Setup failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

setupDatabase();
