import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "axis.sqlite");

fs.mkdirSync(dataDirectory, { recursive: true });

function createDatabase(client: Client) {
  return drizzle(client, {
    schema,
  });
}

type AxisDatabase = ReturnType<typeof createDatabase>;

const globalForDb = globalThis as typeof globalThis & {
  axisDatabase?: AxisDatabase;
  axisClient?: Client;
};

const client =
  globalForDb.axisClient ??
  createClient({
    url: `file:${databasePath}`,
  });

const db =
  globalForDb.axisDatabase ??
  createDatabase(client);

if (process.env.NODE_ENV !== "production") {
  globalForDb.axisClient = client;
  globalForDb.axisDatabase = db;
}

export { client, databasePath, db };
