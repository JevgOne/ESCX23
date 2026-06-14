-- Add is_new column to girls table (production Turso migration)
-- Run against production:
--   turso db shell <db-name> < scripts/migrate-add-is-new.sql
-- Or via local:
--   sqlite3 data/app.db < scripts/migrate-add-is-new.sql
--
-- Safe to re-run: uses ALTER TABLE ... ADD COLUMN which errors harmlessly
-- if column already exists (Turso/SQLite ignores duplicate ADD COLUMN).

ALTER TABLE girls ADD COLUMN is_new BOOLEAN DEFAULT 0;
