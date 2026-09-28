import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

async function main() {
  await prisma.$connect(); // fail fast if the DB is unreachable
  console.log("Connected to PostgreSQL");

  app.listen(env.PORT, () => {
    console.log(`TeamFlow API running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// Close DB connections cleanly on Ctrl+C / process stop
process.on("SIGINT", async () => { await prisma.$disconnect(); process.exit(0); });
process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });