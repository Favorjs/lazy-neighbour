require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma } = require('../src/models/db');

async function main() {
    const email = process.env.SEED_EMAIL;
    const password = process.env.SEED_PASSWORD;

    if (!email || !password) {
        throw new Error('SEED_EMAIL and SEED_PASSWORD must be set in .env');
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email: email.toLowerCase() },
        create: {
            email: email.toLowerCase(),
            password: hashed,
            name: process.env.SEED_NAME || 'Adeboye',
            isVerified: true
        },
        update: { password: hashed }
    });

    console.log(`Seeded user ${user.email} (${user.id})`);
}

main()
    .catch((err) => {
        console.error('Seed failed:', err.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
