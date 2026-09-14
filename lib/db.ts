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
    'ALTER TABLE reviews ADD COLUMN recommends INTEGER DEFAULT 1',
    'ALTER TABLE reviews ADD COLUMN reply TEXT',
    'ALTER TABLE reviews ADD COLUMN reply_at TEXT',
    'ALTER TABLE reviews ADD COLUMN reply_by TEXT',
    'ALTER TABLE girl_applications ADD COLUMN bust_natural INTEGER',
    'ALTER TABLE girl_applications ADD COLUMN style_wardrobe TEXT',
    'ALTER TABLE girl_applications ADD COLUMN converted_to_girl_id INTEGER',
    'ALTER TABLE girl_applications ADD COLUMN tattoo_percentage INTEGER DEFAULT 0',
    'ALTER TABLE girl_applications ADD COLUMN nationality TEXT',
    'ALTER TABLE girl_photos ADD COLUMN is_secondary INTEGER DEFAULT 0',
    'ALTER TABLE girls ADD COLUMN ethnicity TEXT DEFAULT NULL',
    'ALTER TABLE girl_schedules ADD COLUMN effective_from DATE DEFAULT NULL',
    'ALTER TABLE girls ADD COLUMN style_wardrobe TEXT DEFAULT NULL',
    'ALTER TABLE pricing_plans ADD COLUMN night_price INTEGER DEFAULT NULL',
  ];

  // One-time fix: clear future effective_from that hid schedules from public page
  try {
    await client.execute("UPDATE girl_schedules SET effective_from = NULL WHERE effective_from > date('now')");
  } catch {
    // OK
  }

  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists — OK
    }
  }

  // Seed night prices for existing plans (idempotent — only updates NULL values)
  const nightPrices: [number, number][] = [
    [30, 2500],
    [45, 2700],
    [60, 3000],
    [90, 4500],
    [120, 5500],
  ];
  for (const [duration, nightPrice] of nightPrices) {
    try {
      await client.execute({
        sql: 'UPDATE pricing_plans SET night_price = ? WHERE duration = ? AND night_price IS NULL',
        args: [nightPrice, duration],
      });
    } catch {
      // OK — table may not exist yet
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

  // Telegram bot — girl linking table
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS telegram_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        girl_id INTEGER NOT NULL UNIQUE,
        chat_id TEXT NOT NULL,
        username TEXT,
        linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
      )
    `);
  } catch {
    // Table already exists — OK
  }

  // Expand users.role CHECK constraint to include 'operator'
  // SQLite can't ALTER CHECK — recreate table with new constraint
  try {
    // Check if the migration already ran by seeing if operator role works
    const testResult = await client.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
    );
    const tableSql = String(testResult.rows[0]?.sql ?? '');
    if (tableSql.includes("'operator'") === false && tableSql.includes('role')) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'operator', 'girl')),
          girl_id INTEGER,
          display_name TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.execute(`
        INSERT INTO users_new (id, email, password_hash, role, girl_id, display_name, is_active, created_at, updated_at)
        SELECT id, email, password_hash, role, girl_id, display_name, is_active, created_at, updated_at FROM users
      `);
      await client.execute('DROP TABLE users');
      await client.execute('ALTER TABLE users_new RENAME TO users');
    }
  } catch {
    // Migration may fail if columns don't exist yet — OK, will retry on next startup
  }

  // Schedule reminders — clients want to be notified when new week schedule is published
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS schedule_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_telegram_id TEXT NOT NULL,
        girl_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_telegram_id, girl_id),
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
      )
    `);
  } catch {
    // Table already exists — OK
  }

  // Review listing queries do correlated subqueries on reviews per row — index the lookup.
  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_reviews_girl_status ON reviews(girl_id, status)'
    );
  } catch {
    // OK
  }

  // Security audit log — tracks PII access, auth events, booking changes
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS security_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_role TEXT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        ip_hash TEXT,
        user_agent TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch {
    // Table already exists — OK
  }

  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_audit_action ON security_audit_log(action, created_at)'
    );
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_log(user_id, created_at)'
    );
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_audit_entity ON security_audit_log(entity_type, entity_id)'
    );
  } catch {
    // OK
  }

  // Girl notifications table (for studio PWA)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS girl_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        girl_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'default',
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
      )
    `);
  } catch {
    // Table already exists — OK
  }

  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_girl_notifs ON girl_notifications(girl_id, is_read, created_at)'
    );
  } catch {
    // OK
  }

  // Tracks slugs of girls removed (deleted or archived) from the public site, so their
  // old profile URLs can 308-redirect instead of 404ing — Google keeps crawling them
  // long after the profile is gone.
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS removed_girl_slugs (
        slug TEXT PRIMARY KEY,
        removed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        reason TEXT
      )
    `);
  } catch {
    // Table already exists — OK
  }

  // Telegram AI — conversation message history
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS telegram_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool_use', 'tool_result')),
        content TEXT NOT NULL,
        tool_name TEXT,
        tool_use_id TEXT,
        tokens_in INTEGER DEFAULT 0,
        tokens_out INTEGER DEFAULT 0,
        model TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch {
    // Table already exists — OK
  }

  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_tm_chat ON telegram_messages(chat_id)'
    );
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_tm_chat_created ON telegram_messages(chat_id, created_at)'
    );
  } catch {
    // OK
  }

  // Telegram AI — rate limiting sliding windows
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS telegram_rate_limits (
        chat_id TEXT NOT NULL,
        window_start DATETIME NOT NULL,
        message_count INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (chat_id, window_start)
      )
    `);
  } catch {
    // Table already exists — OK
  }

  // Legacy slugs confirmed 404ing in production (GSC export, /Users/lunagroup/Downloads/
  // lovelygirls-3/Tabulka.csv, cross-checked against production with curl) from before
  // this table existed.
  const legacyRemovedSlugs = [
    'rebeca', 'anhel', 'anna', 'diana', 'ema', 'christina', 'jessica',
    'karin', 'lara', 'lucka', 'marie', 'nikol', 'niky', 'sammy', 'sophie',
    // Found via the /girls/{slug} and /girls-cz/{slug} legacy pattern (docs/TASKS-404.md #2)
    'linda', 'samantha', 'bibi', 'jennifer',
  ];
  for (const slug of legacyRemovedSlugs) {
    try {
      await client.execute({
        sql: "INSERT OR IGNORE INTO removed_girl_slugs (slug, reason) VALUES (?, 'legacy')",
        args: [slug],
      });
    } catch {
      // OK
    }
  }
}

// Fire and forget on startup
runMigrations(db).catch(() => {});
