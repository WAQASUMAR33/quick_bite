// src/util/prisma.js
const { PrismaClient } = require('@prisma/client');

// Initialize a single Prisma client instance globally
const prisma = new PrismaClient();

// Export the Prisma client for reuse
module.exports = prisma;