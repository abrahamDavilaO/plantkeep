import "server-only";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { isAhead } from "./client-db";
import { migrateDb } from "./migrate-db";
import { createSeed } from "./seed";
import type { Db } from "./types";

/** En Vercel el disco del proyecto es solo lectura; los datos viven en /tmp (efímeros por instancia). */
function resolveDataPaths() {
  const base =
    process.env.VERCEL === "1"
      ? path.join(os.tmpdir(), "plantkeep-data")
      : path.join(process.cwd(), "data");
  return { dir: base, file: path.join(base, "db.json") };
}

let memoryDb: Db | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
  if (memoryDb) return migrateDb(memoryDb);

  const { dir, file } = resolveDataPaths();

  try {
    const raw = JSON.parse(await fs.readFile(file, "utf8")) as Db;
    const db = migrateDb(raw);
    const dirty =
      !raw.preventivePlans?.length ||
      !raw.counters?.technician ||
      raw.technicians.some((t, i) => !t.email && db.technicians[i]?.email);
    if (dirty) await save(db, dir, file);
    return db;
  } catch {
    const db = createSeed();
    try {
      await save(db, dir, file);
    } catch {
      memoryDb = db;
    }
    return migrateDb(db);
  }
}

async function save(db: Db, dir = resolveDataPaths().dir, file = resolveDataPaths().file) {
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, file);
  if (memoryDb) memoryDb = db;
}

function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export function readDb(): Promise<Db> {
  return exclusive(load);
}

function failedMutation(result: unknown) {
  return (
    result == null ||
    (typeof result === "object" && result !== null && "error" in result && !("wo" in result))
  );
}

export function updateDb<T>(fn: (db: Db) => T, clientState?: Db | null): Promise<{ result: T; db: Db }> {
  return exclusive(async () => {
    let db = await load();
    const adopted = Boolean(clientState && isAhead(clientState, db));
    if (adopted && clientState) db = migrateDb(structuredClone(clientState));
    const result = fn(db);
    if (!failedMutation(result)) db.revision = (db.revision ?? 1) + 1;
    if (!failedMutation(result) || adopted) {
      try {
        const { dir, file } = resolveDataPaths();
        await save(db, dir, file);
      } catch {
        memoryDb = db;
      }
    }
    return { result, db: structuredClone(db) };
  });
}

/** Sustituye la base solo si el navegador trae una época o revisión más nueva. */
export function replaceIfAhead(incoming: Db): Promise<Db> {
  return exclusive(async () => {
    const current = await load();
    if (!isAhead(incoming, current)) return current;
    const db = migrateDb(structuredClone(incoming));
    try {
      const { dir, file } = resolveDataPaths();
      await save(db, dir, file);
    } catch {
      memoryDb = db;
    }
    return db;
  });
}

export function resetDb(clientEpoch?: number): Promise<Db> {
  return exclusive(async () => {
    const current = await load();
    const db = createSeed();
    const fromClient = typeof clientEpoch === "number" && clientEpoch >= 1 ? Math.floor(clientEpoch) : 1;
    db.epoch = Math.max(current.epoch ?? 1, fromClient) + 1;
    db.revision = 1;
    memoryDb = null;
    try {
      const { dir, file } = resolveDataPaths();
      await save(db, dir, file);
    } catch {
      memoryDb = db;
    }
    return migrateDb(db);
  });
}
