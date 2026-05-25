import { createClient } from '@libsql/client';
const client = createClient({ url: 'file:./data/app.db' });

const girls = await client.execute("SELECT id FROM girls WHERE status='active'");

let inserted = 0;
for (const g of girls.rows) {
  const girlId = Number(g.id);

  const existing = await client.execute({
    sql: 'SELECT day_of_week FROM girl_schedules WHERE girl_id = ? AND is_active = 1',
    args: [girlId],
  });
  const existingDays = new Set(existing.rows.map(r => Number(r.day_of_week)));

  for (let day = 0; day < 6; day++) {
    if (existingDays.has(day)) continue;

    const morning = (girlId + day) % 3 === 0;
    const afternoon = (girlId + day) % 3 === 1;

    let from, to;
    if (morning) { from = '10:00'; to = '16:00'; }
    else if (afternoon) { from = '16:30'; to = '22:30'; }
    else { from = '10:00'; to = '22:00'; }

    await client.execute({
      sql: `INSERT INTO girl_schedules (girl_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, 1)`,
      args: [girlId, day, from, to],
    });
    inserted++;
  }
}

console.log(`Inserted ${inserted} schedule rows for ${girls.rows.length} girls`);

const today = new Date();
const jsDay = today.getDay();
const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
console.log(`Today is day_of_week=${dayOfWeek}`);

const todayCount = await client.execute({
  sql: `SELECT COUNT(*) as c FROM girls g
        JOIN girl_schedules gs ON gs.girl_id = g.id
        WHERE g.status='active' AND gs.day_of_week = ? AND gs.is_active = 1`,
  args: [dayOfWeek],
});
console.log(`Girls working today: ${todayCount.rows[0].c}`);
