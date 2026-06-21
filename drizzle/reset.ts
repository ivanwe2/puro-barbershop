import "dotenv/config";
import pg from "postgres";

const DB_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (!DB_URL) {
  console.error("ERROR: DATABASE_URL or DATABASE_URL_UNPOOLED is not set.");
  process.exit(1);
}

if (DB_URL.includes("neon.tech")) {
  console.error(
    "ERROR: Refusing to run db:reset against a Neon (production) database. This command is for local development only.",
  );
  process.exit(1);
}

async function main() {
  console.log("Dropping and recreating local dev database...");

  const client = pg(DB_URL as string);

  // Drop all tables in reverse dependency order
  await client`DROP TABLE IF EXISTS bookings CASCADE`;
  await client`DROP TABLE IF EXISTS working_hours CASCADE`;
  await client`DROP TABLE IF EXISTS time_off CASCADE`;
  await client`DROP TABLE IF EXISTS email_blacklist CASCADE`;
  await client`DROP TABLE IF EXISTS services CASCADE`;
  await client`DROP TABLE IF EXISTS barbers CASCADE`;
  await client`DROP TABLE IF EXISTS users CASCADE`;
  await client`DROP TABLE IF EXISTS settings CASCADE`;

  // Drop enums
  await client`DROP TYPE IF EXISTS booking_status CASCADE`;
  await client`DROP TYPE IF EXISTS user_role CASCADE`;

  // Clear migration tracking so drizzle-kit will re-apply
  await client`DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE`;

  await client.end();

  console.log("Tables dropped. Re-running migrations...");

  // Re-run migrations via child process
  const { spawn } = await import("child_process");
  const migrate = spawn("npx", ["drizzle-kit", "migrate"], {
    stdio: "inherit",
    shell: true,
  });

  migrate.on("close", (code) => {
    if (code !== 0) {
      console.error("Migration failed after reset.");
      process.exit(code ?? 1);
    }
    console.log("\nRunning seed...");
    const seed = spawn("npx", ["tsx", "drizzle/seed.ts"], {
      stdio: "inherit",
      shell: true,
    });

    seed.on("close", (seedCode) => {
      if (seedCode !== 0) {
        console.error("Seed failed after reset.");
        process.exit(seedCode ?? 1);
      }
      console.log("\nReset complete!");
    });
  });
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
