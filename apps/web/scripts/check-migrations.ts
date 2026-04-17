/**
 * CI guard: ensure `supabase/migrations` contains at least one `.sql` file.
 * Schema changes are authored as SQL migrations (RPCs + DDL), not generated
 * from an ORM.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
);

const sqlFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

if (sqlFiles.length === 0) {
  console.error(
    `❌ No .sql files found under ${migrationsDir}. Add Supabase SQL migrations.`,
  );
  process.exit(1);
}

console.log(
  `✓ Found ${sqlFiles.length} SQL migration(s) under supabase/migrations`,
);
