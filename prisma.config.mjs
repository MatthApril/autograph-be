import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
  },
  datasource: {
    // Prisma CLI commands (migrate, db push, studio) use the direct, non-pooled
    // connection. Neon's pooler runs PgBouncer in transaction mode, which breaks
    // session-level operations used by migration tooling.
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
