import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export * from "./schema";
export { schema };

export type Database = ReturnType<typeof createDb>;

/** İstek başına D1 binding'inden drizzle client'ı üretir. */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
