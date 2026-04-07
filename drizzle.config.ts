import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Run /setup-db to configure the application tracker."
  );
}

export default defineConfig({
  schema: "./lib/tracker/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
