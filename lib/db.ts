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
    'ALTER TABLE girls ADD COLUMN ethnicity TEXT DEFAULT NULL',
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists — OK
    }
  }

  // Create admin_notifications table if it doesn't exist
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch {
    // Table already exists — OK
  }

  // CHECK constraint on girls.status already fixed to include 'archived' — migration removed

  // Apartment reviews table
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS apartment_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        content TEXT NOT NULL,
        cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
        discretion INTEGER CHECK (discretion >= 1 AND discretion <= 5),
        comfort INTEGER CHECK (comfort >= 1 AND comfort <= 5),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        FOREIGN KEY (location_id) REFERENCES locations(id)
      )
    `);
  } catch {
    // Table already exists — OK
  }
}

// Fire and forget on startup
runMigrations(db).catch(() => {});
