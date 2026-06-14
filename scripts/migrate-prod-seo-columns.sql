-- Production migration: add missing columns to seo_metadata table
-- Run against production Turso:
--   turso db shell <db-name> < scripts/migrate-prod-seo-columns.sql

-- Content fields for admin SEO editor
ALTER TABLE seo_metadata ADD COLUMN h1_title TEXT;
ALTER TABLE seo_metadata ADD COLUMN h2_subtitle TEXT;
ALTER TABLE seo_metadata ADD COLUMN page_content TEXT;
