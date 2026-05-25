-- Dump of girl_schedules (23 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:19.447Z

-- Original schema (for reference):
-- CREATE TABLE girl_schedules (
--         id INTEGER PRIMARY KEY AUTOINCREMENT,
--         girl_id INTEGER NOT NULL,
--         day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
--         start_time TEXT NOT NULL,
--         end_time TEXT NOT NULL,
--         is_active BOOLEAN DEFAULT 1,
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
--       )

DROP TABLE IF EXISTS "girl_schedules";
CREATE TABLE girl_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        girl_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
      );

INSERT INTO "girl_schedules" ("id", "girl_id", "day_of_week", "start_time", "end_time", "is_active", "created_at", "updated_at") VALUES
(477, 22, 0, '10:00', '16:00', 1, '2026-05-04 05:59:01', '2026-05-04 05:59:01'),
(478, 22, 3, '16:30', '22:30', 1, '2026-05-04 05:59:01', '2026-05-04 05:59:01'),
(479, 22, 2, '16:30', '22:30', 1, '2026-05-04 05:59:01', '2026-05-04 05:59:01'),
(480, 41, 0, '10:00', '16:00', 1, '2026-05-04 05:59:47', '2026-05-04 05:59:47'),
(481, 41, 4, '10:00', '16:00', 1, '2026-05-04 05:59:47', '2026-05-04 05:59:47'),
(482, 41, 1, '16:30', '22:30', 1, '2026-05-04 05:59:47', '2026-05-04 05:59:47'),
(483, 27, 5, '10:00', '16:00', 1, '2026-05-04 06:00:19', '2026-05-04 06:00:19'),
(484, 27, 3, '16:30', '22:30', 1, '2026-05-04 06:00:19', '2026-05-04 06:00:19'),
(485, 27, 6, '16:30', '22:30', 1, '2026-05-04 06:00:20', '2026-05-04 06:00:20'),
(486, 31, 3, '10:00', '16:00', 1, '2026-05-04 06:00:56', '2026-05-04 06:00:56'),
(487, 31, 2, '10:00', '16:00', 1, '2026-05-04 06:00:56', '2026-05-04 06:00:56'),
(488, 31, 0, '16:30', '22:30', 1, '2026-05-04 06:00:57', '2026-05-04 06:00:57'),
(489, 25, 2, '10:00', '22:00', 1, '2026-05-04 06:01:14', '2026-05-04 06:01:14'),
(490, 25, 6, '16:30', '22:30', 1, '2026-05-04 06:01:14', '2026-05-04 06:01:14'),
(491, 20, 5, '10:00', '16:00', 1, '2026-05-04 06:01:33', '2026-05-04 06:01:33'),
(492, 20, 4, '16:30', '22:30', 1, '2026-05-04 06:01:33', '2026-05-04 06:01:33'),
(493, 44, 5, '16:30', '22:30', 1, '2026-05-04 06:02:06', '2026-05-04 06:02:06'),
(494, 44, 4, '10:00', '22:00', 1, '2026-05-04 06:02:06', '2026-05-04 06:02:06'),
(495, 26, 5, '16:30', '22:30', 1, '2026-05-04 06:02:39', '2026-05-04 06:02:39'),
(496, 26, 1, '16:30', '22:30', 1, '2026-05-04 06:02:39', '2026-05-04 06:02:39'),
(498, 28, 1, '10:00', '16:00', 1, '2026-05-04 06:02:56', '2026-05-04 06:02:56'),
(499, 28, 3, '10:00', '16:00', 1, '2026-05-04 06:02:56', '2026-05-04 06:02:56'),
(500, 26, 6, '10:00', '16:00', 1, '2026-05-04 06:03:46', '2026-05-04 06:03:46');
