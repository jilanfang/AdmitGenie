import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "@/db/schema";

export type AdmitGenieDatabase = NeonHttpDatabase<typeof schema>;

export function createDatabaseConnection(url: string): AdmitGenieDatabase {
  const sql = neon(url);

  return drizzle(sql, { schema });
}
