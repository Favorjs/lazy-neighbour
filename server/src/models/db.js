/**
 * Database connection using @anclatechs/sql-buns
 * Provides pool access and utility functions for raw SQL queries
 */
require('dotenv').config();

const {
    pool,
    getAllRows,
    getSingleRow,
    createRowAndReturn,
    batchTransaction,
    RecordDoesNotExist,
    NonUniqueRecordError,
} = require('@anclatechs/sql-buns');

module.exports = {
    pool,
    getAllRows,
    getSingleRow,
    createRowAndReturn,
    batchTransaction,
    RecordDoesNotExist,
    NonUniqueRecordError,
};
