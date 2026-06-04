import path from "node:path";

import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;

dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env"), quiet: true });

let activePool;

function getPool() {
  if (!process.env.DATABASE_URL) {
    const error = new Error("Database connection is not configured.");
    error.status = 503;
    error.code = "DATABASE_URL_MISSING";
    throw error;
  }

  if (!activePool) {
    activePool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return activePool;
}

export const pool = {
  connect() {
    return getPool().connect();
  },
  end() {
    if (!activePool) return Promise.resolve();
    return activePool.end();
  },
  query(text, params) {
    return getPool().query(text, params);
  },
};

export function query(text, params) {
  return pool.query(text, params);
}
