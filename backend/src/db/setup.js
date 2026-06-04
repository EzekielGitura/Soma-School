import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool, query } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function dbFile(fileName) {
  const candidates = [
    path.resolve(process.cwd(), "..", "db", fileName),
    path.resolve(process.cwd(), "db", fileName),
    path.resolve(__dirname, "..", "..", "..", "db", fileName),
  ];

  return candidates;
}

async function readDbFile(fileName) {
  for (const candidate of dbFile(fileName)) {
    try {
      return await fs.readFile(candidate, "utf8");
    } catch {
      // Try the next known project layout.
    }
  }

  throw new Error(`Could not find ${fileName}.`);
}

async function waitForDatabase() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await query("SELECT 1");
      return;
    } catch (error) {
      if (attempt === 30) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function setup() {
  await waitForDatabase();
  await query(await readDbFile("schema.sql"));
  await query(await readDbFile("seed.sql"));
  await pool.end();
  console.log("Database schema and seed data are ready.");
}

setup().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
