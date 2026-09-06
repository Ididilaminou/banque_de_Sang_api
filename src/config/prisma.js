const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const env = require("./env");

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL est obligatoire pour connecter Prisma.");
}

const adapter = new PrismaMariaDb(env.databaseUrl);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
