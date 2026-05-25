-- Dump of schedule_exceptions (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:19.964Z

-- Original schema (for reference):
-- CREATE TABLE schedule_exceptions (
--         id INTEGER PRIMARY KEY AUTOINCREMENT,
--         girl_id INTEGER NOT NULL,
--         date TEXT NOT NULL,
--         exception_type TEXT NOT NULL CHECK(exception_type IN ('unavailable', 'custom_hours')),
--         start_time TEXT,
--         end_time TEXT,
--         reason TEXT,
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
--       )

DROP TABLE IF EXISTS "schedule_exceptions";
CREATE TABLE schedule_exceptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        girl_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        exception_type TEXT NOT NULL CHECK(exception_type IN ('unavailable', 'custom_hours')),
        start_time TEXT,
        end_time TEXT,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
      );

