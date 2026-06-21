-- Add effective_from to girl_schedules
-- NULL = always active (backwards compatible with existing data)
ALTER TABLE girl_schedules ADD COLUMN effective_from DATE DEFAULT NULL;
