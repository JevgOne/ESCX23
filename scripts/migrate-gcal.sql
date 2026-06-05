-- Google Calendar OAuth integration tables
-- Run: sqlite3 data/app.db < scripts/migrate-gcal.sql
--
-- Admin connects Google Calendar on behalf of each girl.
-- One token per girl (UNIQUE on girl_id). Admin's user_id stored for audit.

-- OAuth state for CSRF protection (short-lived, auto-cleaned)
-- girl_id passed through the OAuth flow so callback knows which girl to link
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  girl_id INTEGER NOT NULL,
  redirect_to TEXT,
  expires_at DATETIME NOT NULL
);

-- Store OAuth tokens per girl (admin connects on their behalf)
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at DATETIME NOT NULL,
  scope TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gcal_tokens_girl ON google_calendar_tokens(girl_id);
