const { PrismaClient } = require("@autograph-db/prisma-client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Run `neon env pull` to load the branch's Postgres connection string."
  );
}

const adapter = new PrismaPg({
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;
