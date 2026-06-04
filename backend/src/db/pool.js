import path from "node:path";

import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;

dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env"), quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function query(text, params) {
  return pool.query(text, params);
}
