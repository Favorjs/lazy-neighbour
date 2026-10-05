/**
 * Prisma client singleton (PostgreSQL via the pg driver adapter)
 */
require('dotenv').config();

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, Prisma } = require('@prisma/client');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = { prisma, Prisma };
