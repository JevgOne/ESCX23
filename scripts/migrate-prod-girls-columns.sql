-- Production migration: add columns to girls table that may be missing
-- Run against production Turso:
--   turso db shell <db-name> < scripts/migrate-prod-girls-columns.sql
-- Or via Turso Dashboard → SQL Editor → paste and run each line separately
--
-- SQLite will error on ADD COLUMN if column already exists.
-- This is harmless — run each line individually if batch fails.

-- NOVA badge
ALTER TABLE girls ADD COLUMN is_new BOOLEAN DEFAULT 0;

-- Per-locale SEO fields
ALTER TABLE girls ADD COLUMN meta_title_cs TEXT;
ALTER TABLE girls ADD COLUMN meta_title_en TEXT;
ALTER TABLE girls ADD COLUMN meta_title_de TEXT;
ALTER TABLE girls ADD COLUMN meta_title_uk TEXT;
ALTER TABLE girls ADD COLUMN meta_description_cs TEXT;
ALTER TABLE girls ADD COLUMN meta_description_en TEXT;
ALTER TABLE girls ADD COLUMN meta_description_de TEXT;
ALTER TABLE girls ADD COLUMN meta_description_uk TEXT;
ALTER TABLE girls ADD COLUMN og_title_cs TEXT;
ALTER TABLE girls ADD COLUMN og_title_en TEXT;
ALTER TABLE girls ADD COLUMN og_title_de TEXT;
ALTER TABLE girls ADD COLUMN og_title_uk TEXT;
ALTER TABLE girls ADD COLUMN og_description_cs TEXT;
ALTER TABLE girls ADD COLUMN og_description_en TEXT;
ALTER TABLE girls ADD COLUMN og_description_de TEXT;
ALTER TABLE girls ADD COLUMN og_description_uk TEXT;

-- Per-locale subtitles
ALTER TABLE girls ADD COLUMN subtitle_cs TEXT;
ALTER TABLE girls ADD COLUMN subtitle_en TEXT;
ALTER TABLE girls ADD COLUMN subtitle_de TEXT;
ALTER TABLE girls ADD COLUMN subtitle_uk TEXT;

-- Additional profile fields (added after Secretstory export)
ALTER TABLE girls ADD COLUMN preferred_program_id INTEGER;
ALTER TABLE girls ADD COLUMN personal_message TEXT;
ALTER TABLE girls ADD COLUMN voice_url TEXT;
ALTER TABLE girls ADD COLUMN calendar_embed_url TEXT;
ALTER TABLE girls ADD COLUMN vip BOOLEAN DEFAULT 0;
ALTER TABLE girls ADD COLUMN bust_natural BOOLEAN;
ALTER TABLE girls ADD COLUMN waist INTEGER;
ALTER TABLE girls ADD COLUMN hips INTEGER;
