import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { migrateDb } from "./migrate-db";
import { createSeed } from "./seed";
import type { Db } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
  try {
    const raw = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db;
    const db = migrateDb(raw);
    const dirty =
      !raw.preventivePlans?.length ||
      !raw.counters?.technician ||
      raw.technicians.some((t, i) => !t.email && db.technicians[i]?.email);
    if (dirty) await save(db);
    return db;
  } catch {
    const db = createSeed();
    await save(db);
    return db;
  }
}

async function save(db: Db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_FILE);
}

/** Serializa lecturas/escrituras para que reportes simultáneos desde varias tablets no se pisen. */
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export function readDb(): Promise<Db> {
  return exclusive(load);
}

export function updateDb<T>(fn: (db: Db) => T): Promise<T> {
  return exclusive(async () => {
    const db = await load();
    const result = fn(db);
    await save(db);
    return result;
  });
}

export function resetDb(): Promise<Db> {
  return exclusive(async () => {
    const db = createSeed();
    await save(db);
    return db;
  });
}
