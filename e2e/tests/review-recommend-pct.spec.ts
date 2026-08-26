import { test, expect } from 'playwright/test';
import { createClient } from '@libsql/client';

// Reads the same local DB the dev server reads from, and re-computes the "% doporučují"
// figure with the exact same SQL as lib/queries.ts#getReviewStatsForGirl, so this test
// fails the moment the two drift apart instead of hard-coding a number that would go
// stale as soon as someone edits the seed data.
const db = createClient({ url: `file:${__dirname}/../../data/app.db` });

async function expectedStats(girlId: number) {
  const dist = await db.execute({
    sql: `SELECT CAST(rating AS INTEGER) AS stars, COUNT(*) AS cnt
          FROM reviews WHERE girl_id = ? AND status = 'approved' GROUP BY stars`,
    args: [girlId],
  });
  const buckets = [0, 0, 0, 0, 0];
  let count = 0;
  for (const row of dist.rows as unknown as Record<string, unknown>[]) {
    const stars = Math.min(5, Math.max(1, Number(row.stars ?? 0)));
    buckets[stars - 1] += Number(row.cnt ?? 0);
    count += Number(row.cnt ?? 0);
  }
  let recommendPct: number | null = null;
  if (count >= 3) {
    const rec = await db.execute({
      sql: `SELECT SUM(CASE WHEN COALESCE(recommends, 1) = 1 AND rating >= 4 THEN 1 ELSE 0 END) AS rec
            FROM reviews WHERE girl_id = ? AND status = 'approved'`,
      args: [girlId],
    });
    const recommended = Number((rec.rows[0] as Record<string, unknown> | undefined)?.rec ?? 0);
    recommendPct = Math.round((recommended / count) * 100);
  }
  return { count, buckets, recommendPct };
}

test('recommend % on a girl with reviews under 4★ mixed in matches the DB, and stays below 100%', async ({ page }) => {
  const girlId = 31; // katy — has reviews at every star level in the seed data
  const slug = 'katy';
  const expected = await expectedStats(girlId);
  test.skip(expected.count < 3, 'seed data no longer has >=3 approved reviews for this girl');

  await page.context().addCookies([{ name: 'age_verified', value: '1', url: 'http://localhost:3000' }]);
  await page.goto(`/cs/profil/${slug}`);

  const recommendEl = page.locator('.reviews-summary-recommend strong');
  await expect(recommendEl).toHaveText(`${expected.recommendPct}%`);
  // Guards against the pre-fix bug where every historical row defaulted to
  // recommends=1 and the figure was always ~100% regardless of actual ratings.
  expect(expected.recommendPct).toBeLessThan(100);

  // Histogram under the summary must sum to the same total shown in "based on N reviews".
  const counts = await page.locator('.rev-bar-count').allTextContents();
  const sum = counts.reduce((a, c) => a + Number(c), 0);
  expect(sum).toBe(expected.count);
  await expect(page.locator('.reviews-summary-meta')).toContainText(String(expected.count));
});

test('recommend % is hidden below the 3-review threshold', async ({ page }) => {
  const girlId = 26;
  const slug = 'natalie';
  const expected = await expectedStats(girlId);
  test.skip(expected.count === 0 || expected.count >= 3, 'seed data no longer has 1-2 approved reviews for this girl');

  await page.context().addCookies([{ name: 'age_verified', value: '1', url: 'http://localhost:3000' }]);
  await page.goto(`/cs/profil/${slug}`);

  expect(expected.recommendPct).toBeNull();
  await expect(page.locator('.reviews-summary-recommend')).toHaveCount(0);
});
