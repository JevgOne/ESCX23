import { createClient, type Client } from '@libsql/client';

declare global {
  // eslint-disable-next-line no-var
  var __libsql_client: Client | undefined;
  // eslint-disable-next-line no-var
  var __db_migrated: boolean | undefined;
}

function buildClient(): Client {
  const url =
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
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
    // Per-girl booking rules (Task #24 — Emily individual booking config)
    'ALTER TABLE girls ADD COLUMN booking_start_offset INTEGER DEFAULT NULL',
    'ALTER TABLE girls ADD COLUMN booking_allowed_durations TEXT DEFAULT NULL',
    'ALTER TABLE girls ADD COLUMN booking_break_minutes INTEGER DEFAULT NULL',
    // Booking code — human-readable identifier (LG-YYYYMMDD-XXXX)
    'ALTER TABLE bookings_v2 ADD COLUMN booking_code TEXT',
  ];

  // One-time fix: clear future effective_from that hid schedules from public page
  try {
    await client.execute("UPDATE girl_schedules SET effective_from = NULL WHERE effective_from > date('now')");
  } catch {
    // OK
  }

  // One-time fix: assign primary location to schedules missing location_id
  try {
    await client.execute(`
      UPDATE girl_schedules
      SET location_id = (SELECT id FROM locations WHERE is_primary = 1 LIMIT 1)
      WHERE location_id IS NULL
        AND (SELECT id FROM locations WHERE is_primary = 1 LIMIT 1) IS NOT NULL
    `);
  } catch {
    // OK
  }

  // One-time fix: migrate day_of_week from JS convention (0=Sun..6=Sat) to
  // app convention (0=Mon..6=Sun). The admin schedule editor writes 0=Mon,
  // but the original Secretstory import used 0=Sun. Uses a flag table to
  // ensure this runs only once.
  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)`);
    const done = await client.execute({
      sql: `SELECT 1 FROM _migrations WHERE name = ?`,
      args: ['dow_js_to_mon'],
    });
    if (done.rows.length === 0) {
      await client.execute(`
        UPDATE girl_schedules
        SET day_of_week = CASE WHEN day_of_week = 0 THEN 6 ELSE day_of_week - 1 END
      `);
      await client.execute({
        sql: `INSERT INTO _migrations (name) VALUES (?)`,
        args: ['dow_js_to_mon'],
      });
      console.log('[db] Migrated girl_schedules day_of_week from JS(0=Sun) to app(0=Mon) convention');
    }
  } catch (e) {
    console.error('[db] day_of_week migration error:', e);
  }

  // REVERT: dow_js_to_mon was wrong — data was already in Mon=0 convention.
  // The -1 shift moved all schedules back by one day (Mon→Sun etc.).
  // This +1 shift restores the correct values.
  try {
    const reverted = await client.execute({
      sql: `SELECT 1 FROM _migrations WHERE name = ?`,
      args: ['dow_revert_shift'],
    });
    if (reverted.rows.length === 0) {
      await client.execute(`
        UPDATE girl_schedules
        SET day_of_week = CASE WHEN day_of_week = 6 THEN 0 ELSE day_of_week + 1 END
      `);
      await client.execute({
        sql: `INSERT INTO _migrations (name) VALUES (?)`,
        args: ['dow_revert_shift'],
      });
      console.log('[db] Reverted day_of_week shift (+1) — data was already in Mon=0 convention');
    }
  } catch (e) {
    console.error('[db] dow_revert_shift migration error:', e);
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

  // Emily (id=28) — individual booking rules: start 30min after shift, only 60min duration
  try {
    await client.execute({
      sql: `UPDATE girls SET booking_start_offset = 30, booking_allowed_durations = '[60]'
            WHERE id = 28 AND booking_start_offset IS NULL`,
      args: [],
    });
  } catch {
    // OK — girls table may not exist yet
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

  // Add telegram_chat_id to users for operator/manager notifications
  try {
    await client.execute('ALTER TABLE users ADD COLUMN telegram_chat_id TEXT');
  } catch { /* OK — column already exists */ }

  // Booking notifications (bot bookings → operator/manager in-app alerts)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS booking_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        booking_id INTEGER,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings_v2(id)
      )
    `);
  } catch { /* OK */ }

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

  // Discount codes (promo codes for Telegram booking flow)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
        value INTEGER NOT NULL,
        min_duration INTEGER DEFAULT NULL,
        valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
        valid_until DATETIME DEFAULT NULL,
        max_uses INTEGER DEFAULT NULL,
        current_uses INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* OK */ }

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

  // ----- STUDIOFLOW Booking System tables -----

  // Booking clients (encrypted PII)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS booking_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_number TEXT NOT NULL UNIQUE,
        nickname TEXT NOT NULL,
        phone_encrypted TEXT,
        phone_hmac TEXT,
        name_encrypted TEXT,
        surname_encrypted TEXT,
        email_encrypted TEXT,
        telegram_id TEXT,
        source TEXT NOT NULL DEFAULT 'phone'
          CHECK (source IN ('phone', 'telegram', 'whatsapp', 'walkin', 'web')),
        trust_level TEXT NOT NULL DEFAULT 'new'
          CHECK (trust_level IN ('new', 'verified', 'regular', 'vip')),
        total_visits INTEGER NOT NULL DEFAULT 0,
        total_spent INTEGER NOT NULL DEFAULT 0,
        total_points INTEGER NOT NULL DEFAULT 0,
        no_show_count INTEGER NOT NULL DEFAULT 0,
        is_banned INTEGER NOT NULL DEFAULT 0,
        ban_reason TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* OK */ }

  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bc_phone_hmac ON booking_clients(phone_hmac)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bc_telegram ON booking_clients(telegram_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bc_trust ON booking_clients(trust_level)');
  } catch { /* OK */ }

  // Deep-link token for Telegram bot activation
  try {
    await client.execute('ALTER TABLE booking_clients ADD COLUMN deep_link_token TEXT');
  } catch { /* column already exists */ }
  try {
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_bc_deeplink ON booking_clients(deep_link_token)');
  } catch { /* OK */ }

  // Bookings V2 (main reservation table)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS bookings_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        girl_id INTEGER NOT NULL,
        location_id INTEGER,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        program_id INTEGER,
        extras TEXT DEFAULT '[]',
        price INTEGER,
        points_earned INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('draft', 'pending', 'confirmed', 'in_progress', 'completed',
                             'no_show', 'declined', 'expired',
                             'cancelled_client', 'cancelled_girl',
                             'rescheduled', 'reassigned')),
        channel TEXT NOT NULL DEFAULT 'phone'
          CHECK (channel IN ('phone', 'telegram', 'whatsapp', 'admin', 'sms')),
        source TEXT,
        notes TEXT,
        girl_notes TEXT,
        decline_reason TEXT,
        cancel_reason TEXT,
        no_show_level INTEGER,
        confirmed_at DATETIME,
        arrived_at DATETIME,
        completed_at DATETIME,
        cancelled_at DATETIME,
        created_by INTEGER,
        updated_by INTEGER,
        slot_version INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES booking_clients(id)
      )
    `);
  } catch { /* OK */ }

  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bv2_girl_date ON bookings_v2(girl_id, date)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bv2_client ON bookings_v2(client_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bv2_status ON bookings_v2(status)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bv2_slot ON bookings_v2(girl_id, date, start_time, status)');
  } catch { /* OK */ }

  // New client confirmation columns
  try {
    await client.execute('ALTER TABLE bookings_v2 ADD COLUMN needs_confirmation INTEGER NOT NULL DEFAULT 0');
  } catch { /* OK — column already exists */ }
  try {
    await client.execute('ALTER TABLE bookings_v2 ADD COLUMN confirmation_due_at DATETIME');
  } catch { /* OK — column already exists */ }
  try {
    await client.execute('ALTER TABLE bookings_v2 ADD COLUMN confirmation_sent_at DATETIME');
  } catch { /* OK — column already exists */ }
  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bv2_confirmation ON bookings_v2(needs_confirmation, confirmation_due_at) WHERE needs_confirmation = 1');
  } catch { /* OK */ }

  // Booking drafts (real-time bot → calendar sync)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS booking_drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        telegram_chat_id TEXT,
        girl_id INTEGER,
        date TEXT,
        start_time TEXT,
        end_time TEXT,
        duration_minutes INTEGER,
        channel TEXT NOT NULL DEFAULT 'telegram'
          CHECK (channel IN ('telegram', 'whatsapp')),
        session_id TEXT NOT NULL UNIQUE,
        step TEXT NOT NULL DEFAULT 'select_girl'
          CHECK (step IN ('select_girl', 'select_day', 'select_time', 'select_duration', 'confirm', 'enter_promo')),
        expires_at DATETIME NOT NULL,
        is_converted INTEGER NOT NULL DEFAULT 0,
        converted_to_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES booking_clients(id)
      )
    `);
  } catch { /* OK */ }

  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bd_girl_slot ON booking_drafts(girl_id, date, start_time)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bd_expires ON booking_drafts(expires_at)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bd_chat ON booking_drafts(telegram_chat_id)');
  } catch { /* OK */ }

  // Add discount_code_id + expand step CHECK to include 'enter_promo'
  try {
    await client.execute('ALTER TABLE booking_drafts ADD COLUMN discount_code_id INTEGER');
  } catch { /* OK — column already exists */ }
  // Recreate table to expand CHECK constraint (SQLite can't ALTER CHECK)
  try {
    const checkSql = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='booking_drafts'");
    const tableDef = String(checkSql.rows[0]?.sql ?? '');
    if (!tableDef.includes("'enter_promo'")) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS booking_drafts_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER,
          telegram_chat_id TEXT,
          girl_id INTEGER,
          date TEXT,
          start_time TEXT,
          end_time TEXT,
          duration_minutes INTEGER,
          channel TEXT NOT NULL DEFAULT 'telegram' CHECK (channel IN ('telegram', 'whatsapp')),
          session_id TEXT NOT NULL UNIQUE,
          step TEXT NOT NULL DEFAULT 'select_girl'
            CHECK (step IN ('select_girl', 'select_day', 'select_time', 'select_duration', 'confirm', 'enter_promo')),
          discount_code_id INTEGER,
          expires_at DATETIME NOT NULL,
          is_converted INTEGER NOT NULL DEFAULT 0,
          converted_to_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES booking_clients(id)
        )
      `);
      await client.execute(`INSERT INTO booking_drafts_new
        SELECT id, client_id, telegram_chat_id, girl_id, date, start_time, end_time, duration_minutes,
               channel, session_id, step, discount_code_id, expires_at, is_converted, converted_to_id, created_at, updated_at
        FROM booking_drafts`).catch(() => {
        // If discount_code_id doesn't exist yet in old table, copy without it
        return client.execute(`INSERT INTO booking_drafts_new
          (id, client_id, telegram_chat_id, girl_id, date, start_time, end_time, duration_minutes,
           channel, session_id, step, expires_at, is_converted, converted_to_id, created_at, updated_at)
          SELECT id, client_id, telegram_chat_id, girl_id, date, start_time, end_time, duration_minutes,
                 channel, session_id, step, expires_at, is_converted, converted_to_id, created_at, updated_at
          FROM booking_drafts`);
      });
      await client.execute('DROP TABLE booking_drafts');
      await client.execute('ALTER TABLE booking_drafts_new RENAME TO booking_drafts');
    }
  } catch (e) {
    console.error('[db] booking_drafts migration error:', e);
  }

  // Add discount columns to bookings_v2
  try {
    await client.execute('ALTER TABLE bookings_v2 ADD COLUMN discount_code_id INTEGER');
  } catch { /* OK */ }
  try {
    await client.execute('ALTER TABLE bookings_v2 ADD COLUMN discount_amount INTEGER DEFAULT 0');
  } catch { /* OK */ }

  // Break/pause booking type
  try {
    await client.execute("ALTER TABLE bookings_v2 ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'booking'");
  } catch { /* OK — column already exists */ }

  // System client for breaks (no real client needed)
  try {
    await client.execute(`
      INSERT OR IGNORE INTO booking_clients (id, client_number, nickname, source, trust_level, total_visits, total_spent, total_points, no_show_count)
      VALUES (0, 'SYSTEM', 'SYSTEM', 'phone', 'verified', 0, 0, 0, 0)
    `);
  } catch { /* OK */ }

  // Telegram users (bot deep-link activation)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS telegram_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_user_id TEXT NOT NULL UNIQUE,
        telegram_name TEXT,
        client_id INTEGER NOT NULL UNIQUE,
        chat_id TEXT,
        activation_token TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        activated_at DATETIME,
        last_interaction DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES booking_clients(id)
      )
    `);
  } catch { /* OK */ }

  // Booking audit log (immutable — INSERT only)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS booking_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        user_id INTEGER,
        action TEXT NOT NULL,
        actor_type TEXT NOT NULL DEFAULT 'user'
          CHECK (actor_type IN ('user', 'bot', 'system', 'cron')),
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT DEFAULT '{}',
        ip_hash TEXT,
        user_agent TEXT,
        severity TEXT NOT NULL DEFAULT 'info'
          CHECK (severity IN ('info', 'warn', 'critical')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* OK */ }

  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bal_booking ON booking_audit_log(booking_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bal_user ON booking_audit_log(user_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bal_action ON booking_audit_log(action)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bal_created ON booking_audit_log(created_at)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bal_severity ON booking_audit_log(severity)');
  } catch { /* OK */ }

  // Slot locks (race condition prevention)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS slot_locks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        girl_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        locked_by TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(girl_id, date, start_time, end_time)
      )
    `);
  } catch { /* OK */ }

  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_sl_expires ON slot_locks(expires_at)');
  } catch { /* OK */ }

  // Booking interest — tracks who showed interest in a girl/date for last-minute offers
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS booking_interest (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_chat_id TEXT NOT NULL,
        girl_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* OK */ }
  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_bi_girl_date ON booking_interest(girl_id, date)');
  } catch { /* OK */ }

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

  // Force password change flag for girls
  try {
    await client.execute('ALTER TABLE users ADD COLUMN force_password_change INTEGER NOT NULL DEFAULT 0');
  } catch { /* OK — column already exists */ }

  // One-time import: 17 Google Calendar bookings (week 21.9.-27.9.2026)
  try {
    const icsImported = await client.execute({
      sql: `SELECT 1 FROM _migrations WHERE name = ?`,
      args: ['ics_import_sep2026'],
    });
    if (icsImported.rows.length === 0) {
      // Girl ID mapping
      const girlMap: Record<string, number> = {
        'Kim': 46, 'Caty': 31, 'Emily': 28, 'Nika': 25, 'Viktoria': 50,
      };

      // Duration prices (from pricing_plans)
      const priceMap: Record<number, number> = {
        30: 1500, 45: 2000, 60: 2500, 90: 3500, 120: 4500,
      };

      // Bookings data: [girl, date, startTime, endTime, durationMin, clientNickname]
      const bookings: [string, string, string, string, number, string][] = [
        ['Kim',      '2026-09-21', '12:30', '13:30', 60, 'mila12'],
        ['Kim',      '2026-09-21', '14:30', '16:00', 90, 'Vojtech Salomoun'],
        ['Caty',     '2026-09-21', '16:30', '17:30', 60, 'Henry2109'],
        ['Emily',    '2026-09-22', '10:30', '11:30', 60, 'Cizinec140301'],
        ['Emily',    '2026-09-22', '11:40', '12:40', 60, 'Klient23071'],
        ['Emily',    '2026-09-22', '12:45', '13:45', 60, 'HynekSvoboda'],
        ['Emily',    '2026-09-22', '14:00', '15:00', 60, 'Lukas01/26b'],
        ['Emily',    '2026-09-22', '15:15', '16:15', 60, 'Belkacem0402'],
        ['Kim',      '2026-09-22', '16:30', '17:30', 60, 'David 2309'],
        ['Viktoria', '2026-09-22', '16:30', '17:15', 45, 'Nov0412'],
        ['Nika',     '2026-09-23', '10:00', '11:00', 60, 'Kl0711'],
        ['Nika',     '2026-09-23', '15:00', '16:00', 60, 'Tcr 2109'],
        ['Emily',    '2026-09-24', '10:30', '12:30', 120, 'N0172 HIGH SOCKS'],
        ['Emily',    '2026-09-24', '14:00', '15:00', 60, 'NO1108'],
        ['Emily',    '2026-09-24', '15:15', '16:15', 60, 'Novy999'],
        ['Nika',     '2026-09-25', '10:00', '11:00', 60, 'Pepicek1007'],
        ['Viktoria', '2026-09-26', '20:00', '21:00', 60, 'Vojtech2109'],
      ];

      // Create clients + insert bookings
      for (const [girl, date, startTime, endTime, dur, nickname] of bookings) {
        const girlId = girlMap[girl];
        if (!girlId) continue;

        // Find or create client by nickname
        let clientId: number;
        const existing = await client.execute({
          sql: 'SELECT id FROM booking_clients WHERE nickname = ? LIMIT 1',
          args: [nickname],
        });
        if (existing.rows.length > 0) {
          clientId = Number(existing.rows[0].id);
        } else {
          const maxRes = await client.execute(
            "SELECT MAX(CAST(REPLACE(client_number, 'ICS-', '') AS INTEGER)) AS mx FROM booking_clients WHERE client_number LIKE 'ICS-%'",
          );
          const maxNum = Number(maxRes.rows[0]?.mx ?? 0);
          const clientNumber = `ICS-${maxNum + 1}`;
          const ins = await client.execute({
            sql: `INSERT INTO booking_clients (client_number, nickname, source, trust_level, total_visits, created_at, updated_at)
                  VALUES (?, ?, 'phone', 'verified', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [clientNumber, nickname],
          });
          clientId = Number(ins.lastInsertRowid);
        }

        // Skip if booking already exists (girl_id + date + start_time)
        const dup = await client.execute({
          sql: `SELECT id FROM bookings_v2 WHERE girl_id = ? AND date = ? AND start_time = ?
                AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired') LIMIT 1`,
          args: [girlId, date, startTime],
        });
        if (dup.rows.length > 0) continue;

        const price = priceMap[dur] ?? 2500;
        await client.execute({
          sql: `INSERT INTO bookings_v2 (
                  client_id, girl_id, date, start_time, end_time, duration_minutes,
                  price, points_earned, status, channel, source, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'phone', 'ics_import', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [clientId, girlId, date, startTime, endTime, dur, price, price],
        });
      }

      await client.execute({
        sql: `INSERT INTO _migrations (name) VALUES (?)`,
        args: ['ics_import_sep2026'],
      });
      console.log('[db] Imported 17 Google Calendar bookings (Sep 21-27, 2026)');
    }
  } catch (e) {
    console.error('[db] ICS import migration error:', e);
  }

  // Cleanup: delete ICS-imported bookings before this week (user sees stale data in calendar)
  try {
    await client.execute(`DELETE FROM bookings_v2 WHERE source = 'ics_import' AND date < '2026-09-21'`);
  } catch { /* OK */ }

  // Re-import ICS bookings — previous migration registered in _migrations but data not inserted
  try {
    const reimportDone = await client.execute({
      sql: `SELECT 1 FROM _migrations WHERE name = ?`,
      args: ['ics_reimport_sep2026_v2'],
    });
    if (reimportDone.rows.length === 0) {
      const existingIcs = await client.execute({
        sql: `SELECT COUNT(*) AS cnt FROM bookings_v2 WHERE source = 'ics_import' AND date BETWEEN '2026-09-21' AND '2026-09-27'`,
        args: [],
      });
      const existingCount = Number(existingIcs.rows[0]?.cnt ?? 0);

      if (existingCount < 17) {
        // Clean partial data — delete bookings only (not clients, FK constraint)
        await client.execute(`DELETE FROM bookings_v2 WHERE source IN ('ics_import', 'gcal_import') AND date BETWEEN '2026-09-21' AND '2026-09-27'`);

        const gMap: Record<string, number> = {
          'Kim': 46, 'Caty': 31, 'Emily': 28, 'Nika': 25, 'Viktoria': 50,
        };
        const pMap: Record<number, number> = {
          30: 1500, 45: 2000, 60: 2500, 90: 3500, 120: 4500,
        };
        const bkData: [string, string, string, string, number, string][] = [
          ['Kim',      '2026-09-21', '12:30', '13:30', 60, 'mila12'],
          ['Kim',      '2026-09-21', '14:30', '16:00', 90, 'Vojtech Salomoun'],
          ['Caty',     '2026-09-21', '16:30', '17:30', 60, 'Henry2109'],
          ['Emily',    '2026-09-22', '10:30', '11:30', 60, 'Cizinec140301'],
          ['Emily',    '2026-09-22', '11:40', '12:40', 60, 'Klient23071'],
          ['Emily',    '2026-09-22', '12:45', '13:45', 60, 'HynekSvoboda'],
          ['Emily',    '2026-09-22', '14:00', '15:00', 60, 'Lukas01/26b'],
          ['Emily',    '2026-09-22', '15:15', '16:15', 60, 'Belkacem0402'],
          ['Kim',      '2026-09-22', '16:30', '17:30', 60, 'David 2309'],
          ['Viktoria', '2026-09-22', '16:30', '17:15', 45, 'Nov0412'],
          ['Nika',     '2026-09-23', '10:00', '11:00', 60, 'Kl0711'],
          ['Nika',     '2026-09-23', '15:00', '16:00', 60, 'Tcr 2109'],
          ['Emily',    '2026-09-24', '10:30', '12:30', 120, 'N0172 HIGH SOCKS'],
          ['Emily',    '2026-09-24', '14:00', '15:00', 60, 'NO1108'],
          ['Emily',    '2026-09-24', '15:15', '16:15', 60, 'Novy999'],
          ['Nika',     '2026-09-25', '10:00', '11:00', 60, 'Pepicek1007'],
          ['Viktoria', '2026-09-26', '20:00', '21:00', 60, 'Vojtech2109'],
        ];

        let insertedCount = 0;
        for (const [girl, date, startTime, endTime, dur, nickname] of bkData) {
          const girlId = gMap[girl];
          if (!girlId) continue;

          let clientId: number;
          const ex = await client.execute({
            sql: 'SELECT id FROM booking_clients WHERE nickname = ? LIMIT 1',
            args: [nickname],
          });
          if (ex.rows.length > 0) {
            clientId = Number(ex.rows[0].id);
          } else {
            const mx = await client.execute(
              "SELECT MAX(CAST(REPLACE(client_number, 'ICS-', '') AS INTEGER)) AS mx FROM booking_clients WHERE client_number LIKE 'ICS-%'",
            );
            const maxNum = Number(mx.rows[0]?.mx ?? 0);
            const ins = await client.execute({
              sql: `INSERT INTO booking_clients (client_number, nickname, source, trust_level, total_visits, created_at, updated_at)
                    VALUES (?, ?, 'phone', 'verified', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              args: [`ICS-${maxNum + 1}`, nickname],
            });
            clientId = Number(ins.lastInsertRowid);
          }

          const price = pMap[dur] ?? 2500;
          await client.execute({
            sql: `INSERT INTO bookings_v2 (
                    client_id, girl_id, date, start_time, end_time, duration_minutes,
                    price, points_earned, status, channel, source, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'phone', 'ics_import', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [clientId, girlId, date, startTime, endTime, dur, price, price],
          });
          insertedCount++;
        }
        console.log(`[db] Re-imported ${insertedCount}/${bkData.length} ICS bookings (ics_reimport_sep2026_v2)`);
      }

      await client.execute({
        sql: `INSERT INTO _migrations (name) VALUES (?)`,
        args: ['ics_reimport_sep2026_v2'],
      });
    }
  } catch (e) {
    console.error('[db] ICS reimport error:', e);
  }

  // Recalculate total_visits for all clients based on actual completed/confirmed bookings
  try {
    const recalcDone = await client.execute({
      sql: `SELECT 1 FROM _migrations WHERE name = ?`,
      args: ['recalc_client_visits'],
    });
    if (recalcDone.rows.length === 0) {
      await client.execute(`
        UPDATE booking_clients SET total_visits = (
          SELECT COUNT(*) FROM bookings_v2
          WHERE bookings_v2.client_id = booking_clients.id
            AND bookings_v2.status IN ('confirmed', 'completed', 'in_progress')
        ), updated_at = CURRENT_TIMESTAMP
      `);
      await client.execute({
        sql: `INSERT INTO _migrations (name) VALUES (?)`,
        args: ['recalc_client_visits'],
      });
      console.log('[db] Recalculated total_visits for all booking clients');
    }
  } catch (e) {
    console.error('[db] recalc_client_visits error:', e);
  }

  // Set exact addresses for locations (Task #35)
  try {
    await client.execute({
      sql: `UPDATE locations SET address = ? WHERE name = ? AND (address IS NULL OR address = '')`,
      args: ['Kostnické náměstí', 'praha-3'],
    });
    await client.execute({
      sql: `UPDATE locations SET address = ? WHERE name = ? AND (address IS NULL OR address = '')`,
      args: ['Karlovo náměstí', 'praha-2'],
    });
  } catch { /* OK */ }

  // Booking confirmation reminders (antispam — sent 30 min after booking creation)
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS booking_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        chat_id TEXT NOT NULL,
        booking_code TEXT,
        send_at DATETIME NOT NULL,
        sent INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings_v2(id)
      )
    `);
  } catch { /* OK */ }
  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_br_send ON booking_reminders(sent, send_at)');
  } catch { /* OK */ }

  // Push notification subscriptions
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch { /* OK */ }
}

// Fire and forget on startup
runMigrations(db).catch(() => {});
