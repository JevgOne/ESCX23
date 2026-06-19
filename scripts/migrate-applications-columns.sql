-- Add missing columns to girl_applications table
-- Safe to run multiple times (SQLite will error on existing columns, but that's OK)

ALTER TABLE girl_applications ADD COLUMN bust_natural INTEGER;
ALTER TABLE girl_applications ADD COLUMN style_wardrobe TEXT;
ALTER TABLE girl_applications ADD COLUMN converted_to_girl_id INTEGER;
