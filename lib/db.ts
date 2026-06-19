import { createClient, type Client } from '@libsql/client';

declare global {
  // eslint-disable-next-line no-var
  var __libsql_client: Client | undefined;
  // eslint-disable-next-line no-var
  var __db_migrated: boolean | undefined;
}

function buildClient(): Client {
  const url =
    process.env.TURSO_DATABASE_URL ??
    process.env.DATABASE_URL ??
    'file:./data/app.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  return createClient({
    url,
    ...(authToken ? { authToken } : {}),
  });
}

export const db: Client = global.__libsql_client ?? buildClient();

if (process.env.NODE_ENV !== 'production') {
  global.__libsql_client = db;
}

/** Run once per process — adds missing columns to tables. Errors on existing columns are silently ignored. */
async function runMigrations(client: Client) {
  if (global.__db_migrated) return;
  global.__db_migrated = true;

  const migrations = [
    'ALTER TABLE girl_applications ADD COLUMN bust_natural INTEGER',
    'ALTER TABLE girl_applications ADD COLUMN style_wardrobe TEXT',
    'ALTER TABLE girl_applications ADD COLUMN converted_to_girl_id INTEGER',
    'ALTER TABLE girl_applications ADD COLUMN tattoo_percentage INTEGER DEFAULT 0',
    'ALTER TABLE girl_applications ADD COLUMN nationality TEXT',
    'ALTER TABLE girl_photos ADD COLUMN is_secondary INTEGER DEFAULT 0',
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists — OK
    }
  }

  // Fix CHECK constraint on girls.status — allow 'archived' value
  try {
    const checkRes = await client.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='girls'`);
    const createSql = checkRes.rows[0]?.sql ? String(checkRes.rows[0].sql) : '';
    if (createSql.includes("'inactive')") && !createSql.includes("'archived'")) {
      // Recreate table without restrictive CHECK
      await client.execute(`PRAGMA foreign_keys=OFF`);
      await client.execute(`ALTER TABLE girls RENAME TO _girls_old`);
      // Recreate with expanded CHECK
      const newSql = createSql.replace(
        /CHECK\s*\(\s*status\s+IN\s*\([^)]+\)\s*\)/i,
        `CHECK(status IN ('active', 'pending', 'inactive', 'archived'))`
      );
      await client.execute(newSql);
      await client.execute(`INSERT INTO girls SELECT * FROM _girls_old`);
      await client.execute(`DROP TABLE _girls_old`);
      await client.execute(`PRAGMA foreign_keys=ON`);
    }
  } catch {
    // Migration already done or not needed
  }
}

// Fire and forget on startup
runMigrations(db).catch(() => {});
