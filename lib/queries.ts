import { db } from './db';
import { pragueDateISO, pragueDayOfWeek, formatPragueTime } from './utils';

/* =========================================================
 *  Sprint 1 query helpers — čte přímo z importovaného Secretstory schema
 *  (girls, girl_photos, girl_schedules, services, pricing_plans, …)
 *
 *  V Sprint 2 se schema přejmenuje (companions, photos, …) podle ZADANI.
 *  Tehdy se tyhle helpery aktualizují / přepíšou na Prisma.
 * ========================================================= */

export type GirlStatus = 'working' | 'later' | 'off';

/** is_new=1 → always new. is_new=0/NULL → fallback to 30 days from created_at. */
function computeIsNew(dbIsNew: unknown, createdAt: unknown): boolean {
  if (Number(dbIsNew) === 1) return true;
  if (!createdAt) return false;
  const d = new Date(String(createdAt));
  return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
}

function parseLangs(raw: unknown): string[] {
  if (!raw) return ['cs', 'en'];
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try { return JSON.parse(s) as string[]; } catch { /* fall through */ }
  }
  return s.split(',').map((l) => l.trim()).filter(Boolean);
}

export interface GirlCard {
  id: number;
  slug: string;
  name: string;
  age: number;
  height: number | null;
  weight: number | null;
  bust: number | null;
  location: string;
  primaryPhoto: string | null;
  secondaryPhoto: string | null;
  photoCount: number;
  videoCount: number;
  status: GirlStatus;
  shiftFrom: string | null;
  shiftTo: string | null;
  isVip: boolean;
  isPaused: boolean;
  isNew: boolean;
  languages: string[];
  rating: number;
  reviewsCount: number;
  hashtags: string[];
}

/** Dívky nabízející konkrétní službu (pro /sluzba/[slug]). */
export async function getGirlsForService(serviceSlug: string): Promise<GirlCard[]> {
  const dayOfWeek = pragueDayOfWeek();
  const today = pragueDateISO();
  const now = formatPragueTime();

  const result = await db.execute({
    sql: `
      SELECT
        g.id, g.slug, g.name, g.age, g.height, g.weight, g.bust, g.location,
        g.created_at, g.is_new, g.languages, g.hashtags, g.rating, g.reviews_count, g.status,
        gs.start_time AS shift_from, gs.end_time AS shift_to,
        se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
        l.display_name AS schedule_location,
        l2.display_name AS fallback_location,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS primary_photo,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND (is_primary = 0 OR is_primary IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1) AS secondary_photo,
        (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count,
        (SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id) AS video_count
      FROM girls g
      INNER JOIN girl_services gsvc ON gsvc.girl_id = g.id
      INNER JOIN services svc ON svc.id = gsvc.service_id AND svc.slug = ?
      LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
        AND gs.day_of_week = ? AND gs.is_active = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN locations l2 ON l2.district = g.location AND l2.is_active = 1
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.status IN ('active', 'inactive') AND (g.vip = 0 OR g.vip IS NULL)
        AND gsvc.is_included != 0
      ORDER BY g.name
    `,
    args: [serviceSlug, dayOfWeek, today],
  });

  return result.rows
    .map((r): GirlCard | null => {
      const isPaused = String(r.status ?? '') === 'inactive';

      let from: string | null = r.shift_from ? String(r.shift_from).substring(0, 5) : null;
      let to: string | null = r.shift_to ? String(r.shift_to).substring(0, 5) : null;
      let status: GirlStatus = 'off';

      if (r.exception_type === 'unavailable') {
        if (!isPaused) return null;
      }
      if (r.exception_type === 'custom_hours') {
        from = r.ex_from ? String(r.ex_from).substring(0, 5) : from;
        to = r.ex_to ? String(r.ex_to).substring(0, 5) : to;
      }

      if (from && to) {
        if (now >= from && now <= to) status = 'working';
        else if (now < from) status = 'later';
        else status = 'off';
      }

      if (status === 'off' && !isPaused) return null;

      const isNew = computeIsNew(r.is_new, r.created_at);

      const scheduleLoc = r.schedule_location ? String(r.schedule_location) : null;
      const fallbackLoc = r.fallback_location ? String(r.fallback_location) : null;

      return {
        id: Number(r.id),
        slug: String(r.slug),
        name: String(r.name),
        age: Number(r.age),
        height: r.height != null ? Number(r.height) : null,
        weight: r.weight != null ? Number(r.weight) : null,
        bust: r.bust != null ? Number(r.bust) : null,
        location: scheduleLoc ?? fallbackLoc ?? String(r.location ?? 'Praha'),
        primaryPhoto: r.primary_photo ? String(r.primary_photo) : null,
        secondaryPhoto: r.secondary_photo ? String(r.secondary_photo) : null,
        photoCount: Number(r.photo_count),
        videoCount: Number(r.video_count),
        status: isPaused ? 'off' : status,
        shiftFrom: from,
        shiftTo: to,
        isVip: false,
        isPaused,
        isNew,
        languages: parseLangs(r.languages),
        rating: r.rating != null ? Number(r.rating) : 0,
        reviewsCount: r.reviews_count != null ? Number(r.reviews_count) : 0,
        hashtags: parseLangs(r.hashtags),
      };
    })
    .filter((g): g is GirlCard => g !== null)
    .sort((a, b) => {
      const rank = { working: 0, later: 1, off: 2 } as const;
      const ra = rank[a.status] ?? 2;
      const rb = rank[b.status] ?? 2;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
}

/** Vše live dívky (homepage / /divky listing / /rozvrh) s dnešním rozvrhem a stavem. */
export async function getGirlsWithToday(): Promise<GirlCard[]> {
  const dayOfWeek = pragueDayOfWeek();
  const today = pragueDateISO();
  const now = formatPragueTime();

  const result = await db.execute({
    sql: `
      SELECT
        g.id, g.slug, g.name, g.age, g.height, g.weight, g.bust, g.location,
        g.created_at, g.is_new, g.languages, g.hashtags, g.rating, g.reviews_count, g.status,
        gs.start_time AS shift_from, gs.end_time AS shift_to,
        se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
        l.display_name AS schedule_location,
        l2.display_name AS fallback_location,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS primary_photo,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND (is_primary = 0 OR is_primary IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1) AS secondary_photo,
        (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count,
        (SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id) AS video_count
      FROM girls g
      LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
        AND gs.day_of_week = ? AND gs.is_active = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN locations l2 ON l2.district = g.location AND l2.is_active = 1
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.status IN ('active', 'inactive') AND (g.vip = 0 OR g.vip IS NULL)
      ORDER BY g.name
    `,
    args: [dayOfWeek, today],
  });

  return result.rows
    .map((r): GirlCard | null => {
      const isPaused = String(r.status ?? '') === 'inactive';

      let from: string | null = r.shift_from ? String(r.shift_from).substring(0, 5) : null;
      let to: string | null = r.shift_to ? String(r.shift_to).substring(0, 5) : null;
      let status: GirlStatus = 'off';

      if (r.exception_type === 'unavailable') {
        if (!isPaused) return null;
      }
      if (r.exception_type === 'custom_hours') {
        from = r.ex_from ? String(r.ex_from).substring(0, 5) : from;
        to = r.ex_to ? String(r.ex_to).substring(0, 5) : to;
      }

      if (from && to) {
        if (now >= from && now <= to) status = 'working';
        else if (now < from) status = 'later';
        else status = 'off';
      }

      if (status === 'off' && !isPaused) return null;

      const isNew = computeIsNew(r.is_new, r.created_at);

      const scheduleLoc = r.schedule_location ? String(r.schedule_location) : null;
      const fallbackLoc = r.fallback_location ? String(r.fallback_location) : null;

      return {
        id: Number(r.id),
        slug: String(r.slug),
        name: String(r.name),
        age: Number(r.age),
        height: r.height != null ? Number(r.height) : null,
        weight: r.weight != null ? Number(r.weight) : null,
        bust: r.bust != null ? Number(r.bust) : null,
        location: scheduleLoc ?? fallbackLoc ?? String(r.location ?? 'Praha'),
        primaryPhoto: r.primary_photo ? String(r.primary_photo) : null,
        secondaryPhoto: r.secondary_photo ? String(r.secondary_photo) : null,
        photoCount: Number(r.photo_count),
        videoCount: Number(r.video_count),
        status: isPaused ? 'off' : status,
        shiftFrom: from,
        shiftTo: to,
        isVip: false,
        isPaused,
        isNew,
        languages: parseLangs(r.languages),
        rating: r.rating != null ? Number(r.rating) : 0,
        reviewsCount: r.reviews_count != null ? Number(r.reviews_count) : 0,
        hashtags: parseLangs(r.hashtags),
      };
    })
    .filter((g): g is GirlCard => g !== null)
    .sort((a, b) => {
      const rank = { working: 0, later: 1, off: 2 } as const;
      const ra = rank[a.status] ?? 2;
      const rb = rank[b.status] ?? 2;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
}

/** Profil podle slug (pro /profil/{slug}). Vrací aktivní i pauzované i vip. */
export async function getGirlBySlug(slug: string) {
  const result = await db.execute({
    sql: `SELECT g.*,
            (SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id) AS video_count,
            (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count
          FROM girls g WHERE slug = ? AND status IN ('active','inactive') LIMIT 1`,
    args: [slug],
  });
  return result.rows[0] ?? null;
}

/** Aktivní pricing plans (programy 30/45/60/90/120 min). */
export async function getActivePricingPlans() {
  const result = await db.execute(
    `SELECT id, duration, price, is_popular, title_cs, title_en, title_de, title_uk
     FROM pricing_plans WHERE is_active = 1
     ORDER BY duration ASC`
  );
  return result.rows;
}

/** Aktivní slevy. */
export async function getActiveDiscounts() {
  const result = await db.execute(
    `SELECT * FROM discounts WHERE is_active = 1 ORDER BY display_order ASC`
  );
  return result.rows;
}

/** FAQ položky. */
export async function getFaqItems() {
  const result = await db.execute(
    `SELECT * FROM faq_items WHERE is_active = 1 ORDER BY display_order ASC`
  );
  return result.rows;
}

/** Recenze pro konkrétní dívku. */
export async function getReviewsForGirl(girlId: number, limit = 10) {
  const result = await db.execute({
    sql: `SELECT id, girl_id, author_name, rating, content, created_at,
            vibe, tags, reply, reply_at, reply_by
          FROM reviews WHERE girl_id = ? AND status = 'approved'
          ORDER BY created_at DESC LIMIT ?`,
    args: [girlId, limit],
  });
  return result.rows;
}

/** Všechny fotky dívky. */
export async function getPhotosForGirl(girlId: number) {
  const result = await db.execute({
    sql: `SELECT * FROM girl_photos WHERE girl_id = ? ORDER BY display_order ASC, id ASC`,
    args: [girlId],
  });
  return result.rows;
}

/** Mapa slug → seznam photo URL (až 5 fotek) pro image sitemap. Pouze aktivní dívky. */
export async function getPhotosBySlug(maxPerGirl = 5): Promise<Record<string, string[]>> {
  try {
    const result = await db.execute(`
      SELECT g.slug, p.url, p.is_primary, p.display_order
      FROM girls g
      INNER JOIN girl_photos p ON p.girl_id = g.id
      WHERE g.status = 'active'
      ORDER BY g.slug, p.is_primary DESC, p.display_order ASC, p.id ASC
    `);
    const map: Record<string, string[]> = {};
    for (const r of result.rows) {
      const slug = String(r.slug ?? '');
      const url = r.url ? String(r.url) : null;
      if (!slug || !url) continue;
      if (!map[slug]) map[slug] = [];
      if (map[slug].length < maxPerGirl) map[slug].push(url);
    }
    return map;
  } catch (err) {
    console.error('[sitemap] getPhotosBySlug failed', err);
    return {};
  }
}

/** Týdenní rozvrh dívky (pro studio editor). */
export async function getSchedulesForGirl(girlId: number) {
  const result = await db.execute({
    sql: `SELECT day_of_week, start_time, end_time, is_active, location_id
          FROM girl_schedules WHERE girl_id = ?
          ORDER BY day_of_week ASC`,
    args: [girlId],
  });
  return result.rows;
}

export interface HomepageStats {
  totalLive: number;
  workingNow: number;
  totalReviews: number;
  avgRating: number;
}

export async function getHomepageStats(): Promise<HomepageStats> {
  const dayOfWeek = (await import('./utils')).pragueDayOfWeek();
  const now = (await import('./utils')).formatPragueTime();

  const [liveRes, reviewsRes] = await Promise.all([
    db.execute({
      sql: `SELECT
              COUNT(*) AS total_live,
              SUM(CASE
                WHEN gs.start_time IS NOT NULL AND gs.end_time IS NOT NULL
                  AND ? >= SUBSTR(gs.start_time,1,5)
                  AND ? <= SUBSTR(gs.end_time,1,5)
                THEN 1 ELSE 0
              END) AS working_now
            FROM girls g
            LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
              AND gs.day_of_week = ? AND gs.is_active = 1
            WHERE g.status = 'active'`,
      args: [now, now, dayOfWeek],
    }),
    db.execute(
      `SELECT COUNT(*) AS total, AVG(rating) AS avg_rating
       FROM reviews WHERE status = 'approved'`
    ),
  ]);

  const liveRow = liveRes.rows[0];
  const revRow = reviewsRes.rows[0];

  return {
    totalLive: Number(liveRow?.total_live ?? 0),
    workingNow: Number(liveRow?.working_now ?? 0),
    totalReviews: Number(revRow?.total ?? 0),
    avgRating: revRow?.avg_rating != null ? Math.round(Number(revRow.avg_rating) * 10) / 10 : 0,
  };
}

export interface ActivityItem {
  kind: 'photo' | 'review';
  girlSlug: string;
  girlName: string;
  girlPhoto: string | null;
  when: string;
  photoCount?: number;
  rating?: number;
}

export async function getRecentActivity(limit = 5): Promise<ActivityItem[]> {
  const [photoRes, reviewRes] = await Promise.all([
    db.execute({
      sql: `SELECT
              g.slug, g.name,
              (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo,
              DATE(p.created_at) AS day,
              COUNT(*) AS cnt,
              MAX(p.created_at) AS last_at
            FROM girl_photos p
            JOIN girls g ON g.id = p.girl_id
            WHERE g.status = 'active'
            GROUP BY g.id, DATE(p.created_at)
            ORDER BY last_at DESC
            LIMIT ?`,
      args: [limit],
    }),
    db.execute({
      sql: `SELECT
              g.slug, g.name,
              (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo,
              r.rating, r.created_at
            FROM reviews r
            JOIN girls g ON g.id = r.girl_id
            WHERE r.status = 'approved'
            ORDER BY r.created_at DESC
            LIMIT ?`,
      args: [limit],
    }),
  ]);

  const photos: ActivityItem[] = photoRes.rows.map((r) => ({
    kind: 'photo' as const,
    girlSlug: String(r.slug),
    girlName: String(r.name),
    girlPhoto: r.photo ? String(r.photo) : null,
    when: String(r.last_at),
    photoCount: Number(r.cnt),
  }));

  const reviews: ActivityItem[] = reviewRes.rows.map((r) => ({
    kind: 'review' as const,
    girlSlug: String(r.slug),
    girlName: String(r.name),
    girlPhoto: r.photo ? String(r.photo) : null,
    when: String(r.created_at),
    rating: r.rating != null ? Number(r.rating) : undefined,
  }));

  return [...photos, ...reviews]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, limit);
}

export interface ReviewWithGirl {
  id: number;
  rating: number;
  text: string;
  clientNickname: string | null;
  girlSlug: string;
  girlName: string;
  girlPhoto: string | null;
  createdAt: string;
  vibe: string | null;
  tags: string[];
  reply: string | null;
  replyAt: string | null;
}

export async function getRecentApprovedReviews(limit = 4): Promise<ReviewWithGirl[]> {
  const result = await db.execute({
    sql: `SELECT
            r.id, r.rating, r.content AS text, r.author_name AS client_nickname,
            g.slug, g.name,
            (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo,
            r.created_at, r.vibe, r.tags, r.reply, r.reply_at
          FROM reviews r
          JOIN girls g ON g.id = r.girl_id
          WHERE r.status = 'approved'
          ORDER BY r.created_at DESC
          LIMIT ?`,
    args: [limit],
  });

  return result.rows.map((r) => {
    let tags: string[] = [];
    try { tags = r.tags ? JSON.parse(String(r.tags)) : []; } catch { /* */ }
    return {
      id: Number(r.id),
      rating: Number(r.rating),
      text: String(r.text),
      clientNickname: r.client_nickname ? String(r.client_nickname) : null,
      girlSlug: String(r.slug),
      girlName: String(r.name),
      girlPhoto: r.photo ? String(r.photo) : null,
      createdAt: String(r.created_at),
      vibe: r.vibe ? String(r.vibe) : null,
      tags,
      reply: r.reply ? String(r.reply) : null,
      replyAt: r.reply_at ? String(r.reply_at) : null,
    };
  });
}

/** Review page stats + girls with review counts. */
export async function getReviewPageData() {
  const [statsRes, girlsRes] = await Promise.all([
    db.execute(`SELECT COUNT(*) as cnt, ROUND(AVG(rating),1) as avg FROM reviews WHERE status = 'approved'`),
    db.execute(`SELECT g.name, g.slug,
                  (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo,
                  COUNT(r.id) as cnt
                FROM reviews r JOIN girls g ON g.id = r.girl_id
                WHERE r.status = 'approved'
                GROUP BY g.id ORDER BY cnt DESC`),
  ]);
  return {
    totalReviews: Number(statsRes.rows[0].cnt),
    avgRating: Number(statsRes.rows[0].avg),
    girlsWithReviews: girlsRes.rows.map((r) => ({
      name: String(r.name),
      slug: String(r.slug),
      photo: r.photo ? String(r.photo) : null,
      reviewCount: Number(r.cnt),
    })),
  };
}

export interface Location {
  id: number;
  name: string;
  displayName: string;
  district: string | null;
  city?: string | null;
  isPrimary: boolean;
  openingDate: string | null;
}

export interface FooterStats {
  companionsCount: number;
  locationsCount: number;
}

export async function getFooterStats(): Promise<FooterStats> {
  try {
    const [g, l] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS c FROM girls WHERE status IN ('active','inactive')`),
      db.execute(`SELECT COUNT(*) AS c FROM locations WHERE is_active = 1`),
    ]);
    return {
      companionsCount: Number(g.rows[0]?.c ?? 0),
      locationsCount: Number(l.rows[0]?.c ?? 0),
    };
  } catch {
    return { companionsCount: 0, locationsCount: 0 };
  }
}

export async function getLocationBySlug(slug: string, locale = 'cs') {
  const result = await db.execute({
    sql: `SELECT * FROM locations WHERE name = ? AND is_active = 1 LIMIT 1`,
    args: [slug],
  });
  if (!result.rows[0]) return null;
  const r = result.rows[0] as Record<string, unknown>;
  const suffix = locale === 'cs' ? '' : `_${locale}`;
  const localized = (base: string): string | null => {
    const v = r[`${base}${suffix}`] ?? r[base];
    return v ? String(v) : null;
  };
  return {
    id: Number(r.id),
    slug: String(r.name),
    displayName: String(r.display_name ?? r.name),
    district: r.district ? String(r.district) : null,
    city: String(r.city ?? 'Praha'),
    address: r.address ? String(r.address) : null,
    postalCode: r.postal_code ? String(r.postal_code) : null,
    phone: r.phone ? String(r.phone) : null,
    email: r.email ? String(r.email) : null,
    description: localized('description'),
    transportText: localized('transport_text'),
    paymentText: localized('payment_text'),
    parkingText: localized('parking_text'),
    featuresText: localized('features_text'),
    hoursText: localized('hours_text') ?? 'Denně 10:00 — 22:30',
    isPrimary: Number(r.is_primary) === 1,
    openingDate: r.opening_date ? String(r.opening_date) : null,
  };
}

export async function getActiveLocations(): Promise<Location[]> {
  const result = await db.execute(
    `SELECT * FROM locations WHERE is_active = 1 ORDER BY is_primary DESC, id ASC`
  );
  return result.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    displayName: String(r.display_name ?? r.name),
    district: r.district ? String(r.district) : null,
    city: (r as Record<string, unknown>).city ? String((r as Record<string, unknown>).city) : null,
    isPrimary: Number((r as Record<string, unknown>).is_primary ?? 0) === 1,
    openingDate: (r as Record<string, unknown>).opening_date ? String((r as Record<string, unknown>).opening_date) : null,
  }));
}

/** Dívky pracující v daný den (pro /rozvrh). */
export async function getGirlsForDay(
  date: string,
  locationFilter?: string
): Promise<GirlCard[]> {
  const dayOfWeek = (() => {
    const d = new Date(date + 'T12:00:00Z');
    const jsDay = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Prague' })).getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  })();
  const today = pragueDateISO();
  const isToday = date === today;
  const now = isToday ? formatPragueTime() : null;

  const result = await db.execute({
    sql: `
      SELECT
        g.id, g.slug, g.name, g.age, g.height, g.weight, g.bust, g.location,
        g.created_at, g.is_new, g.languages, g.rating, g.reviews_count,
        gs.start_time AS shift_from, gs.end_time AS shift_to, gs.is_active AS gs_active,
        se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
        l.display_name AS schedule_location, l.district AS schedule_district,
        l2.display_name AS fallback_location,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS primary_photo,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND (is_primary = 0 OR is_primary IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1) AS secondary_photo,
        (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count,
        (SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id) AS video_count
      FROM girls g
      LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
        AND gs.day_of_week = ? AND gs.is_active = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN locations l2 ON l2.district = g.location AND l2.is_active = 1
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.status = 'active' AND (g.vip = 0 OR g.vip IS NULL)
      ORDER BY g.name
    `,
    args: [dayOfWeek, date],
  });

  return result.rows
    .map((r): GirlCard | null => {
      if (r.exception_type === 'unavailable') return null;

      let from: string | null = r.shift_from ? String(r.shift_from).substring(0, 5) : null;
      let to: string | null = r.shift_to ? String(r.shift_to).substring(0, 5) : null;

      if (r.exception_type === 'custom_hours') {
        from = r.ex_from ? String(r.ex_from).substring(0, 5) : from;
        to = r.ex_to ? String(r.ex_to).substring(0, 5) : to;
      }

      if (!from || !to) return null;

      // Prefer schedule's location, then fallback from locations table, then g.location
      const scheduleLoc = r.schedule_location ? String(r.schedule_location) : null;
      const fallbackLoc = r.fallback_location ? String(r.fallback_location) : null;
      const loc = scheduleLoc ?? fallbackLoc ?? String(r.location ?? 'Praha');
      if (locationFilter && locationFilter !== 'all') {
        const locSlug = loc.toLowerCase().replace(/\s/g, '-').replace(/\./g, '');
        if (!locSlug.includes(locationFilter.toLowerCase())) return null;
      }

      const isNew = computeIsNew(r.is_new, r.created_at);

      let status: GirlStatus = 'working';
      if (!isToday) {
        status = 'later';
      } else if (now && from && to) {
        if (now >= from && now <= to) status = 'working';
        else if (now < from) status = 'later';
        else status = 'off';
      }

      return {
        id: Number(r.id),
        slug: String(r.slug),
        name: String(r.name),
        age: Number(r.age),
        height: r.height != null ? Number(r.height) : null,
        weight: r.weight != null ? Number(r.weight) : null,
        bust: r.bust != null ? Number(r.bust) : null,
        location: loc,
        primaryPhoto: r.primary_photo ? String(r.primary_photo) : null,
        secondaryPhoto: r.secondary_photo ? String(r.secondary_photo) : null,
        photoCount: Number(r.photo_count),
        videoCount: Number(r.video_count),
        status,
        shiftFrom: from,
        shiftTo: to,
        isVip: false,
        isPaused: false,
        isNew,
        languages: parseLangs(r.languages),
        rating: r.rating != null ? Number(r.rating) : 0,
        reviewsCount: r.reviews_count != null ? Number(r.reviews_count) : 0,
        hashtags: parseLangs(r.hashtags),
      };
    })
    .filter((g): g is GirlCard => g !== null)
    .sort((a, b) => {
      const rank = { working: 0, later: 1, off: 2 } as const;
      const ra = rank[a.status] ?? 2;
      const rb = rank[b.status] ?? 2;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
}

/* =========================================================
 *  Admin queries
 * ========================================================= */

export interface AdminDashboardStats {
  activeGirls: number;
  totalGirls: number;
  pendingPhotos: number;
  pendingReviews: number;
  pendingApplications: number;
  totalReviews: number;
  totalPhotos: number;
  newGirls: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [girlsRes, photosRes, reviewsRes, appsRes] = await Promise.all([
    db.execute({
      sql: `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS new_girls
        FROM girls
      `,
      args: [thirtyDaysAgo],
    }),
    db.execute(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END) AS pending FROM girl_photos`
    ),
    db.execute(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending FROM reviews`
    ),
    db.execute(`SELECT COUNT(*) AS cnt FROM girl_applications`),
  ]);

  const gr = girlsRes.rows[0];
  const pr = photosRes.rows[0];
  const rr = reviewsRes.rows[0];
  const ar = appsRes.rows[0];

  return {
    activeGirls: Number(gr?.active ?? 0),
    totalGirls: Number(gr?.total ?? 0),
    newGirls: Number(gr?.new_girls ?? 0),
    pendingPhotos: Number(pr?.pending ?? 0),
    totalPhotos: Number(pr?.total ?? 0),
    pendingReviews: Number(rr?.pending ?? 0),
    totalReviews: Number(rr?.total ?? 0),
    pendingApplications: Number(ar?.cnt ?? 0),
  };
}

export interface AdminGirlRow {
  id: number;
  slug: string;
  name: string;
  age: number;
  status: string;
  primaryPhoto: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export async function getAllGirlsForAdmin(q?: string, status?: string): Promise<AdminGirlRow[]> {
  let sql = `
    SELECT
      g.id, g.slug, g.name, g.age, g.status, g.created_at, g.updated_at,
      (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS primary_photo,
      (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count
    FROM girls g
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (q) {
    sql += ` AND g.name LIKE ?`;
    args.push(`%${q}%`);
  }
  if (status && status !== 'all') {
    sql += ` AND g.status = ?`;
    args.push(status);
  }

  sql += ` ORDER BY g.updated_at DESC, g.name ASC`;

  const result = await db.execute({ sql, args });
  return result.rows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    age: Number(r.age),
    status: String(r.status),
    primaryPhoto: r.primary_photo ? String(r.primary_photo) : null,
    photoCount: Number(r.photo_count),
    createdAt: String(r.created_at),
    updatedAt: r.updated_at ? String(r.updated_at) : null,
  }));
}

export async function getGirlById(id: number) {
  const result = await db.execute({
    sql: `SELECT * FROM girls WHERE id = ? LIMIT 1`,
    args: [id],
  });
  return result.rows[0] ?? null;
}

export interface GirlUpdateData {
  name: string;
  slug: string;
  age: number;
  height: number | null;
  weight: number | null;
  bust: string | null;
  bust_natural: number;
  waist: number | null;
  hips: number | null;
  eyes: string | null;
  hair: string | null;
  tattoo_percentage: number;
  tattoo_description: string | null;
  piercing: number;
  piercing_description: string | null;
  bio: string | null;
  status: string;
  online: number;
  badge_type: string | null;
  location: string | null;
  nationality: string | null;
  telegram: string | null;
  email: string | null;
  phone: string | null;
  languages: string | null;
  is_new: number;
  is_top: number;
  is_featured: number;
  verified: number;
  hashtags: string | null;
  vip: number;
  description_cs?: string | null;
  description_en?: string | null;
  description_de?: string | null;
  description_uk?: string | null;
  subtitle_cs?: string | null;
  subtitle_en?: string | null;
  subtitle_de?: string | null;
  subtitle_uk?: string | null;
  meta_title_cs?: string | null;
  meta_title_en?: string | null;
  meta_title_de?: string | null;
  meta_title_uk?: string | null;
  meta_description_cs?: string | null;
  meta_description_en?: string | null;
  meta_description_de?: string | null;
  meta_description_uk?: string | null;
  og_title_cs?: string | null;
  og_title_en?: string | null;
  og_title_de?: string | null;
  og_title_uk?: string | null;
  og_description_cs?: string | null;
  og_description_en?: string | null;
  og_description_de?: string | null;
  og_description_uk?: string | null;
  calendar_embed_url?: string | null;
}

export async function updateGirlById(id: number, data: GirlUpdateData): Promise<void> {
  await db.execute({
    sql: `UPDATE girls SET
      name=?, slug=?, age=?, height=?, weight=?, bust=?, bust_natural=?, waist=?, hips=?,
      eyes=?, hair=?, tattoo_percentage=?, tattoo_description=?, piercing=?, piercing_description=?,
      bio=?, status=?, online=?, badge_type=?, location=?, nationality=?,
      telegram=?, email=?, phone=?, languages=?,
      is_new=?, is_top=?, is_featured=?, verified=?, hashtags=?, vip=?,
      description_cs=?, description_en=?, description_de=?, description_uk=?,
      subtitle_cs=?, subtitle_en=?, subtitle_de=?, subtitle_uk=?,
      meta_title_cs=?, meta_title_en=?, meta_title_de=?, meta_title_uk=?,
      meta_description_cs=?, meta_description_en=?, meta_description_de=?, meta_description_uk=?,
      og_title_cs=?, og_title_en=?, og_title_de=?, og_title_uk=?,
      og_description_cs=?, og_description_en=?, og_description_de=?, og_description_uk=?,
      calendar_embed_url=?,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?`,
    args: [
      data.name, data.slug, data.age, data.height, data.weight, data.bust, data.bust_natural, data.waist, data.hips,
      data.eyes, data.hair, data.tattoo_percentage, data.tattoo_description, data.piercing, data.piercing_description,
      data.bio, data.status, data.online, data.badge_type, data.location, data.nationality,
      data.telegram, data.email, data.phone, data.languages,
      data.is_new, data.is_top, data.is_featured, data.verified, data.hashtags, data.vip,
      data.description_cs ?? null, data.description_en ?? null, data.description_de ?? null, data.description_uk ?? null,
      data.subtitle_cs ?? null, data.subtitle_en ?? null, data.subtitle_de ?? null, data.subtitle_uk ?? null,
      data.meta_title_cs ?? null, data.meta_title_en ?? null, data.meta_title_de ?? null, data.meta_title_uk ?? null,
      data.meta_description_cs ?? null, data.meta_description_en ?? null, data.meta_description_de ?? null, data.meta_description_uk ?? null,
      data.og_title_cs ?? null, data.og_title_en ?? null, data.og_title_de ?? null, data.og_title_uk ?? null,
      data.og_description_cs ?? null, data.og_description_en ?? null, data.og_description_de ?? null, data.og_description_uk ?? null,
      data.calendar_embed_url ?? null,
      id,
    ],
  });
}

export async function createGirl(data: {
  name: string;
  slug: string;
  age: number;
  email: string | null;
  phone: string | null;
}): Promise<number> {
  const result = await db.execute({
    sql: `INSERT INTO girls (name, slug, age, email, phone, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [data.name, data.slug, data.age, data.email, data.phone],
  });
  return Number(result.lastInsertRowid);
}

export async function deleteGirlById(id: number): Promise<void> {
  await db.execute({ sql: `DELETE FROM girls WHERE id=?`, args: [id] });
}

export async function getGirlProfileCompletion(girlId: number): Promise<number> {
  const result = await db.execute({
    sql: `SELECT name, age, bio, height, weight, bust, eyes, hair, nationality, location FROM girls WHERE id = ? LIMIT 1`,
    args: [girlId],
  });
  if (result.rows.length === 0) return 0;
  const row = result.rows[0] as Record<string, unknown>;
  const fields = ['name', 'age', 'bio', 'height', 'weight', 'bust', 'eyes', 'hair', 'nationality', 'location'];
  const filled = fields.filter((f) => row[f] != null && String(row[f]).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

export interface PendingPhoto {
  id: number;
  girlId: number;
  girlName: string;
  girlSlug: string;
  url: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export async function getPendingPhotos(): Promise<PendingPhoto[]> {
  const result = await db.execute(`
    SELECT p.id, p.girl_id, p.url, p.thumbnail_url, p.created_at,
           g.name AS girl_name, g.slug AS girl_slug
    FROM girl_photos p
    JOIN girls g ON g.id = p.girl_id
    WHERE p.is_primary = 0
    ORDER BY p.created_at DESC
  `);
  return result.rows.map((r) => ({
    id: Number(r.id),
    girlId: Number(r.girl_id),
    girlName: String(r.girl_name),
    girlSlug: String(r.girl_slug),
    url: String(r.url),
    thumbnailUrl: r.thumbnail_url ? String(r.thumbnail_url) : null,
    createdAt: String(r.created_at),
  }));
}

export interface StudioReview {
  id: number;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
  vibe: string | null;
  reply: string | null;
  replyAt: string | null;
}

export async function getReviewsForStudio(girlId: number): Promise<StudioReview[]> {
  const result = await db.execute({
    sql: `SELECT id, author_name, rating, content, created_at, vibe, reply, reply_at
          FROM reviews WHERE girl_id = ? AND status = 'approved'
          ORDER BY created_at DESC`,
    args: [girlId],
  });
  return result.rows.map((r) => ({
    id: Number(r.id),
    authorName: String(r.author_name ?? ''),
    rating: Number(r.rating ?? 5),
    content: String(r.content ?? ''),
    createdAt: String(r.created_at),
    vibe: r.vibe ? String(r.vibe) : null,
    reply: r.reply ? String(r.reply) : null,
    replyAt: r.reply_at ? String(r.reply_at) : null,
  }));
}

export async function saveReviewReply(reviewId: number, girlId: number, replyText: string): Promise<boolean> {
  try {
    await db.execute({
      sql: `UPDATE reviews SET reply = ?, reply_at = CURRENT_TIMESTAMP, reply_by = 'girl'
            WHERE id = ? AND girl_id = ?`,
      args: [replyText, reviewId, girlId],
    });
    return true;
  } catch (err) {
    console.error('[studio] saveReviewReply failed', err);
    return false;
  }
}

export interface PendingReview {
  id: number;
  girlId: number;
  girlName: string;
  girlSlug: string;
  girlPhoto: string | null;
  authorName: string;
  rating: number | null;
  content: string;
  status: string;
  createdAt: string;
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  const result = await db.execute(`
    SELECT r.id, r.girl_id, r.author_name, r.rating, r.content, r.status, r.created_at,
           g.name AS girl_name, g.slug AS girl_slug,
           (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS girl_photo
    FROM reviews r
    JOIN girls g ON g.id = r.girl_id
    WHERE r.status IS NULL OR r.status = 'pending'
    ORDER BY r.created_at DESC
  `);
  return result.rows.map((r) => ({
    id: Number(r.id),
    girlId: Number(r.girl_id),
    girlName: String(r.girl_name),
    girlSlug: String(r.girl_slug),
    girlPhoto: r.girl_photo ? String(r.girl_photo) : null,
    authorName: String(r.author_name),
    rating: r.rating != null ? Number(r.rating) : null,
    content: String(r.content),
    status: String(r.status ?? 'pending'),
    createdAt: String(r.created_at),
  }));
}

/* =========================================================
 *  Listing /divky
 * ========================================================= */

export interface GirlListingFilters {
  status?: string;
  q?: string;
  sort?: string;
  service?: string;
  page?: number;
  pageSize?: number;
}

// ─── STORIES ─────────────────────────────────────────────────────────────────

export interface AdminStoryRow {
  id: number;
  girlId: number;
  girlName: string | null;
  mediaUrl: string;
  mediaType: string;
  bgType: string | null;
  caption: string | null;
  category: string | null;
  status: string;
  viewsCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export async function getStoriesForAdmin(statusFilter?: string): Promise<AdminStoryRow[]> {
  let sql = `
    SELECT
      s.id, s.girl_id, s.media_url, s.media_type,
      s.is_active, s.views_count, s.expires_at, s.created_at,
      g.name AS girl_name
    FROM stories s
    LEFT JOIN girls g ON g.id = s.girl_id AND s.girl_id != 0
    WHERE 1=1
  `;
  const args: string[] = [];

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'live') {
      sql += ` AND s.is_active = 1 AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)`;
    } else if (statusFilter === 'expired') {
      sql += ` AND (s.is_active = 0 OR (s.expires_at IS NOT NULL AND s.expires_at <= CURRENT_TIMESTAMP))`;
    }
  }

  sql += ` ORDER BY s.created_at DESC LIMIT 100`;

  const result = await db.execute({ sql, args });
  return result.rows.map((r) => ({
    id: Number(r.id),
    girlId: Number(r.girl_id),
    girlName: r.girl_name ? String(r.girl_name) : null,
    mediaUrl: String(r.media_url),
    mediaType: String(r.media_type),
    bgType: null,
    caption: null,
    category: null,
    status: Number(r.is_active) === 1
      ? (r.expires_at && String(r.expires_at) <= new Date().toISOString() ? 'expired' : 'live')
      : 'expired',
    viewsCount: Number(r.views_count ?? 0),
    expiresAt: r.expires_at ? String(r.expires_at) : null,
    createdAt: String(r.created_at),
  }));
}

export interface PublicStory {
  id: number;
  girlId: number;
  girlName: string;
  girlSlug: string;
  girlPhoto: string | null;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  createdAt: string;
}

/**
 * Returns active (live, not expired) stories grouped by girl — one preview per girl,
 * showing the most recent live story. Used on the homepage stories row.
 */
export async function getPublicStories(): Promise<PublicStory[]> {
  const res = await db.execute(`
    SELECT
      s.id, s.girl_id, s.media_url, s.media_type, s.created_at,
      g.name AS girl_name, g.slug AS girl_slug,
      (SELECT url FROM girl_photos WHERE girl_id=g.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS girl_photo
    FROM stories s
    INNER JOIN girls g ON g.id = s.girl_id
    WHERE s.is_active = 1
      AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
      AND s.girl_id > 0
      AND g.status = 'active'
    GROUP BY s.girl_id
    HAVING s.created_at = MAX(s.created_at)
    ORDER BY s.created_at DESC
    LIMIT 20
  `);
  return res.rows.map((r) => ({
    id: Number(r.id),
    girlId: Number(r.girl_id),
    girlName: String(r.girl_name ?? ''),
    girlSlug: String(r.girl_slug ?? ''),
    girlPhoto: r.girl_photo ? String(r.girl_photo) : null,
    mediaUrl: String(r.media_url),
    mediaType: (String(r.media_type) === 'video' ? 'video' : 'image') as 'image' | 'video',
    caption: null,
    createdAt: String(r.created_at),
  }));
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export interface AdminBookingRow {
  id: number;
  girlId: number;
  girlName: string | null;
  girlPhoto: string | null;
  channel: string | null;
  clientContact: string | null;
  proposedDate: string;
  startTime: string;
  status: string;
  createdAt: string;
}

export async function getBookings(statusFilter?: string): Promise<AdminBookingRow[]> {
  let sql = `
    SELECT
      b.id, b.girl_id, b.date, b.start_time, b.status,
      b.client_phone, b.client_email, b.communication_type, b.created_at,
      g.name AS girl_name,
      (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS girl_photo
    FROM bookings b
    LEFT JOIN girls g ON g.id = b.girl_id
    WHERE 1=1
  `;
  const args: string[] = [];

  if (statusFilter && statusFilter !== 'all') {
    sql += ` AND b.status = ?`;
    args.push(statusFilter);
  }

  sql += ` ORDER BY b.created_at DESC LIMIT 50`;

  const result = await db.execute({ sql, args });
  return result.rows.map((r) => {
    const phone = r.client_phone ? String(r.client_phone) : null;
    const email = r.client_email ? String(r.client_email) : null;
    const contact = phone
      ? phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4)
      : email
        ? email.replace(/(.{2}).*(@)/, '$1***$2')
        : null;
    return {
      id: Number(r.id),
      girlId: Number(r.girl_id),
      girlName: r.girl_name ? String(r.girl_name) : null,
      girlPhoto: r.girl_photo ? String(r.girl_photo) : null,
      channel: r.communication_type ? String(r.communication_type) : null,
      clientContact: contact,
      proposedDate: String(r.date),
      startTime: String(r.start_time),
      status: String(r.status ?? 'pending'),
      createdAt: String(r.created_at),
    };
  });
}

export interface ServiceItem {
  id: number;
  slug: string | null;
  name: string;
  category: string;
  default_extra_price: number | null;
}

export interface ServicesByCategory {
  included: ServiceItem[];
  extra: ServiceItem[];
  on_request: ServiceItem[];
  not_offered: ServiceItem[];
}

export async function getServicesForGirl(girlId: number, locale: string = 'cs'): Promise<ServicesByCategory> {
  const nameCol = ['cs', 'en', 'de', 'uk'].includes(locale) ? `name_${locale}` : 'name_cs';

  const result = await db.execute(
    `SELECT id, slug, ${nameCol} AS name, category, base_price FROM services ORDER BY id ASC`
  );

  const girlOverrides = await db.execute({
    sql: `SELECT service_id, is_included, extra_price FROM girl_services WHERE girl_id = ?`,
    args: [girlId],
  });

  const overrideMap = new Map<number, { is_included: number; extra_price: number | null }>();
  for (const row of girlOverrides.rows) {
    overrideMap.set(Number(row.service_id), {
      is_included: Number(row.is_included),
      extra_price: row.extra_price != null ? Number(row.extra_price) : null,
    });
  }

  const out: ServicesByCategory = { included: [], extra: [], on_request: [], not_offered: [] };

  for (const row of result.rows) {
    const sid = Number(row.id);
    const override = overrideMap.get(sid);
    const cat = String(row.category);
    const basePrice = row.base_price != null ? Number(row.base_price) : null;

    const item: ServiceItem = {
      id: sid,
      slug: row.slug ? String(row.slug) : null,
      name: row.name ? String(row.name) : String(row.id),
      category: cat,
      default_extra_price: override?.extra_price ?? basePrice,
    };

    if (override) {
      if (override.is_included === 0) {
        out.not_offered.push(item);
      } else if (cat === 'extras' || cat === 'special' || cat === 'oral' || cat === 'massage' || cat === 'types') {
        out.extra.push(item);
      } else {
        out.included.push(item);
      }
    } else {
      if (cat === 'basic') {
        out.included.push(item);
      } else if (cat === 'extras' || cat === 'types') {
        out.extra.push(item);
      } else {
        out.on_request.push(item);
      }
    }
  }

  return out;
}

export interface ServiceRow {
  id: number;
  slug: string | null;
  name_cs: string | null;
  name_en: string | null;
  name_de: string | null;
  name_uk: string | null;
  category: string;
  description_cs?: string | null;
  description_en?: string | null;
  description_de?: string | null;
  description_uk?: string | null;
  content_cs?: string | null;
  content_en?: string | null;
  content_de?: string | null;
  content_uk?: string | null;
  seo_title_cs?: string | null;
  seo_title_en?: string | null;
  seo_title_de?: string | null;
  seo_title_uk?: string | null;
  seo_description_cs?: string | null;
  seo_description_en?: string | null;
  seo_description_de?: string | null;
  seo_description_uk?: string | null;
}

export async function getAllServices(): Promise<ServiceRow[]> {
  const result = await db.execute(
    `SELECT id, slug, name_cs, name_en, name_de, name_uk, category FROM services ORDER BY category, id ASC`
  );
  return result.rows.map((r) => ({
    id: Number(r.id),
    slug: r.slug ? String(r.slug) : null,
    name_cs: r.name_cs ? String(r.name_cs) : null,
    name_en: r.name_en ? String(r.name_en) : null,
    name_de: r.name_de ? String(r.name_de) : null,
    name_uk: r.name_uk ? String(r.name_uk) : null,
    category: String(r.category),
  }));
}

export async function getServiceBySlug(slug: string): Promise<ServiceRow | null> {
  const result = await db.execute({
    sql: `SELECT * FROM services WHERE slug = ? LIMIT 1`,
    args: [slug],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as ServiceRow;
}

export async function getRelatedServices(currentSlug: string, category: string, limit = 6): Promise<ServiceRow[]> {
  const result = await db.execute({
    sql: `SELECT * FROM services WHERE category = ? AND slug != ? LIMIT ?`,
    args: [category, currentSlug, limit],
  });
  return result.rows as unknown as ServiceRow[];
}

export interface GirlTodaySchedule {
  shiftFrom: string | null;
  shiftTo: string | null;
  scheduleLocation: string | null;
  scheduleAddress: string | null;
}

export async function getGirlScheduleForToday(girlId: number): Promise<GirlTodaySchedule> {
  const dayOfWeek = pragueDayOfWeek();
  const today = pragueDateISO();

  const result = await db.execute({
    sql: `
      SELECT
        gs.start_time AS shift_from, gs.end_time AS shift_to,
        se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
        l.display_name AS schedule_location,
        l.display_name AS schedule_address
      FROM girls g
      LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
        AND gs.day_of_week = ? AND gs.is_active = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.id = ?
      LIMIT 1
    `,
    args: [dayOfWeek, today, girlId],
  });

  const r = result.rows[0];
  if (!r) return { shiftFrom: null, shiftTo: null, scheduleLocation: null, scheduleAddress: null };
  if (r.exception_type === 'unavailable') return { shiftFrom: null, shiftTo: null, scheduleLocation: null, scheduleAddress: null };

  let from: string | null = r.shift_from ? String(r.shift_from).substring(0, 5) : null;
  let to: string | null = r.shift_to ? String(r.shift_to).substring(0, 5) : null;

  if (r.exception_type === 'custom_hours') {
    from = r.ex_from ? String(r.ex_from).substring(0, 5) : from;
    to = r.ex_to ? String(r.ex_to).substring(0, 5) : to;
  }

  const scheduleLocation = r.schedule_location ? String(r.schedule_location) : null;
  const scheduleAddress = r.schedule_address ? String(r.schedule_address) : null;

  return { shiftFrom: from, shiftTo: to, scheduleLocation, scheduleAddress };
}

/* =========================================================
 *  Blog queries
 * ========================================================= */

export interface BlogTag {
  id: number;
  slug: string;
  name: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  metaDescription: string | null;
  coverUrl: string | null;
  author: string;
  readingTime: number;
  createdAt: string;
  publishedAt: string | null;
  tags: BlogTag[];
}

type BlogLocale = 'cs' | 'en';
function blogLang(locale: string): BlogLocale {
  return locale === 'cs' ? 'cs' : 'en';
}

export async function getBlogPosts(locale: string, limit = 20, offset = 0): Promise<BlogPost[]> {
  const lang = blogLang(locale);
  try {
    const result = await db.execute({
      sql: `SELECT id, slug,
              title_cs, title_en, excerpt_cs, excerpt_en,
              meta_description_cs, meta_description_en,
              cover_url, author, reading_time_min,
              created_at, published_at
            FROM blog_posts WHERE status = 'published'
            ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?`,
      args: [limit, offset],
    });
    const posts = result.rows.map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      title: String(r[`title_${lang}`] || r.title_cs || ''),
      excerpt: r[`excerpt_${lang}`] ? String(r[`excerpt_${lang}`]) : (r.excerpt_cs ? String(r.excerpt_cs) : null),
      content: null as string | null,
      metaDescription: r[`meta_description_${lang}`] ? String(r[`meta_description_${lang}`]) : null,
      coverUrl: r.cover_url ? String(r.cover_url) : null,
      author: String(r.author ?? 'LovelyGirls Praha'),
      readingTime: Number(r.reading_time_min ?? 3),
      createdAt: String(r.created_at),
      publishedAt: r.published_at ? String(r.published_at) : null,
      tags: [] as BlogTag[],
    }));

    // Fetch tags for all posts in one query
    if (posts.length > 0) {
      const ids = posts.map((p) => p.id);
      const placeholders = ids.map(() => '?').join(',');
      const tagResult = await db.execute({
        sql: `SELECT bpt.post_id, bt.id, bt.slug, bt.name_cs, bt.name_en
              FROM blog_post_tags bpt
              JOIN blog_tags bt ON bt.id = bpt.tag_id
              WHERE bpt.post_id IN (${placeholders})`,
        args: ids,
      });
      const tagMap = new Map<number, BlogTag[]>();
      for (const tr of tagResult.rows) {
        const postId = Number(tr.post_id);
        if (!tagMap.has(postId)) tagMap.set(postId, []);
        tagMap.get(postId)!.push({
          id: Number(tr.id),
          slug: String(tr.slug),
          name: String(tr[`name_${lang}`] || tr.name_cs || ''),
        });
      }
      for (const p of posts) {
        p.tags = tagMap.get(p.id) ?? [];
      }
    }

    return posts;
  } catch (err) {
    console.error('[blog] getBlogPosts failed', err);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string, locale: string): Promise<BlogPost | null> {
  const lang = blogLang(locale);
  try {
    const result = await db.execute({
      sql: `SELECT id, slug,
              title_cs, title_en, excerpt_cs, excerpt_en,
              content_cs, content_en,
              meta_description_cs, meta_description_en,
              cover_url, author, reading_time_min,
              created_at, published_at
            FROM blog_posts WHERE slug = ? AND status = 'published' LIMIT 1`,
      args: [slug],
    });
    if (!result.rows[0]) return null;
    const r = result.rows[0];

    // Fetch tags
    const tagResult = await db.execute({
      sql: `SELECT bt.id, bt.slug, bt.name_cs, bt.name_en
            FROM blog_post_tags bpt
            JOIN blog_tags bt ON bt.id = bpt.tag_id
            WHERE bpt.post_id = ?`,
      args: [Number(r.id)],
    });
    const tags: BlogTag[] = tagResult.rows.map((tr) => ({
      id: Number(tr.id),
      slug: String(tr.slug),
      name: String(tr[`name_${lang}`] || tr.name_cs || ''),
    }));

    return {
      id: Number(r.id),
      slug: String(r.slug),
      title: String(r[`title_${lang}`] || r.title_cs || ''),
      excerpt: r[`excerpt_${lang}`] ? String(r[`excerpt_${lang}`]) : (r.excerpt_cs ? String(r.excerpt_cs) : null),
      content: r[`content_${lang}`] ? String(r[`content_${lang}`]) : (r.content_cs ? String(r.content_cs) : null),
      metaDescription: r[`meta_description_${lang}`] ? String(r[`meta_description_${lang}`]) : null,
      coverUrl: r.cover_url ? String(r.cover_url) : null,
      author: String(r.author ?? 'LovelyGirls Praha'),
      readingTime: Number(r.reading_time_min ?? 3),
      createdAt: String(r.created_at),
      publishedAt: r.published_at ? String(r.published_at) : null,
      tags,
    };
  } catch (err) {
    console.error('[blog] getBlogPostBySlug failed', err);
    return null;
  }
}

/** All published blog slugs (for sitemap). */
export async function getBlogPostSlugs(): Promise<{ slug: string; updatedAt: string | null }[]> {
  try {
    const result = await db.execute({
      sql: `SELECT slug, updated_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`,
      args: [],
    });
    return result.rows.map((r) => ({
      slug: String(r.slug),
      updatedAt: r.updated_at ? String(r.updated_at) : null,
    }));
  } catch (err) {
    console.error('[blog] getBlogPostSlugs failed', err);
    return [];
  }
}

/** Posts sharing any tag with the given post. */
export async function getRelatedBlogPosts(postId: number, locale: string, limit = 3): Promise<BlogPost[]> {
  const lang = blogLang(locale);
  try {
    const result = await db.execute({
      sql: `SELECT DISTINCT bp.id, bp.slug,
              bp.title_cs, bp.title_en, bp.excerpt_cs, bp.excerpt_en,
              bp.meta_description_cs, bp.meta_description_en,
              bp.cover_url, bp.author, bp.reading_time_min,
              bp.created_at, bp.published_at
            FROM blog_posts bp
            JOIN blog_post_tags bpt ON bpt.post_id = bp.id
            WHERE bpt.tag_id IN (SELECT tag_id FROM blog_post_tags WHERE post_id = ?)
              AND bp.id != ? AND bp.status = 'published'
            ORDER BY bp.published_at DESC LIMIT ?`,
      args: [postId, postId, limit],
    });
    return result.rows.map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      title: String(r[`title_${lang}`] || r.title_cs || ''),
      excerpt: r[`excerpt_${lang}`] ? String(r[`excerpt_${lang}`]) : (r.excerpt_cs ? String(r.excerpt_cs) : null),
      content: null,
      metaDescription: null,
      coverUrl: r.cover_url ? String(r.cover_url) : null,
      author: String(r.author ?? 'LovelyGirls Praha'),
      readingTime: Number(r.reading_time_min ?? 3),
      createdAt: String(r.created_at),
      publishedAt: r.published_at ? String(r.published_at) : null,
      tags: [],
    }));
  } catch (err) {
    console.error('[blog] getRelatedBlogPosts failed', err);
    return [];
  }
}

export async function getTopServicesForFilter(limit = 12) {
  const result = await db.execute({
    sql: `SELECT s.slug, s.name_cs, s.name_en, s.name_de, s.name_uk, s.category,
            COUNT(gs.girl_id) AS girl_count
          FROM services s
          LEFT JOIN girl_services gs ON gs.service_id = s.id
          GROUP BY s.id
          ORDER BY girl_count DESC, s.id ASC
          LIMIT ?`,
    args: [limit],
  });
  return result.rows.map((r) => ({
    slug: String(r.slug),
    name_cs: String(r.name_cs ?? r.slug),
    name_en: String(r.name_en ?? r.name_cs ?? r.slug),
    name_de: String(r.name_de ?? r.name_en ?? r.slug),
    name_uk: String(r.name_uk ?? r.name_en ?? r.slug),
    category: String(r.category ?? ''),
    count: Number(r.girl_count ?? 0),
  }));
}

export async function getGirlsForListing(
  f: GirlListingFilters
): Promise<{ girls: GirlCard[]; total: number }> {
  const dayOfWeek = pragueDayOfWeek();
  const today = pragueDateISO();
  const now = formatPragueTime();
  const pageSize = f.pageSize ?? 12;
  const page = f.page ?? 1;
  const offset = (page - 1) * pageSize;

  let whereClauses = [`g.status IN ('active','inactive')`, `(g.vip = 0 OR g.vip IS NULL)`];
  const args: (string | number)[] = [dayOfWeek, today];

  if (f.q) {
    whereClauses.push(`(g.name LIKE ? OR g.slug LIKE ?)`);
    args.push(`%${f.q}%`, `%${f.q}%`);
  }

  if (f.service) {
    whereClauses.push(`EXISTS (SELECT 1 FROM girl_services gss
      JOIN services s ON s.id = gss.service_id
      WHERE gss.girl_id = g.id AND s.slug = ?)`);
    args.push(f.service);
  }

  const whereSQL = whereClauses.join(' AND ');

  // Default: priority by status (working → later → off → paused), then A-Z
  let orderSQL = 'status_rank ASC, g.name ASC';
  if (f.sort === 'newest') orderSQL = 'g.created_at DESC';
  else if (f.sort === 'name') orderSQL = 'g.name ASC';
  else if (f.sort === 'available_first') orderSQL = 'status_rank ASC, g.name ASC';

  const baseSql = `
    SELECT
      g.id, g.slug, g.name, g.age, g.height, g.weight, g.bust, g.location,
      g.created_at, g.is_new, g.languages, g.rating, g.reviews_count, g.status,
      gs.start_time AS shift_from, gs.end_time AS shift_to,
      se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
      l.display_name AS schedule_location,
      l2.display_name AS fallback_location,
      (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS primary_photo,
      (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count,
      (SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id) AS video_count,
      CASE
        WHEN se.exception_type = 'unavailable' THEN 0
        WHEN (COALESCE(se.start_time, gs.start_time)) IS NOT NULL
          AND ? >= SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
          AND ? <= SUBSTR(COALESCE(se.end_time, gs.end_time),1,5)
        THEN 1
        ELSE 0
      END AS working_now,
      CASE
        WHEN g.status = 'inactive' THEN 4
        WHEN se.exception_type = 'unavailable' THEN 3
        WHEN (COALESCE(se.start_time, gs.start_time)) IS NOT NULL
          AND ? >= SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
          AND ? <= SUBSTR(COALESCE(se.end_time, gs.end_time),1,5)
        THEN 1
        WHEN (COALESCE(se.start_time, gs.start_time)) IS NOT NULL
          AND ? < SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
        THEN 2
        ELSE 3
      END AS status_rank
    FROM girls g
    LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
      AND gs.day_of_week = ? AND gs.is_active = 1
    LEFT JOIN locations l ON l.id = gs.location_id
    LEFT JOIN locations l2 ON l2.district = g.location AND l2.is_active = 1
    LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
    WHERE ${whereSQL}
  `;

  const allArgs = [now, now, now, now, now, ...args];

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) AS cnt FROM (${baseSql}) sub`,
    args: allArgs,
  });
  const total = Number(countResult.rows[0]?.cnt ?? 0);

  const dataResult = await db.execute({
    sql: `${baseSql} ORDER BY ${orderSQL} LIMIT ? OFFSET ?`,
    args: [...allArgs, pageSize, offset],
  });

  const girls: GirlCard[] = dataResult.rows
    .filter((r) => {
      const isPaused = String(r.status ?? '') === 'inactive';
      if (r.exception_type === 'unavailable' && !isPaused) return false;
      if (f.status === 'available') {
        return Number(r.working_now) === 1;
      }
      return true;
    })
    .map((r): GirlCard => {
      const isPaused = String(r.status ?? '') === 'inactive';
      let from: string | null = r.shift_from ? String(r.shift_from).substring(0, 5) : null;
      let to: string | null = r.shift_to ? String(r.shift_to).substring(0, 5) : null;
      if (r.exception_type === 'custom_hours') {
        from = r.ex_from ? String(r.ex_from).substring(0, 5) : from;
        to = r.ex_to ? String(r.ex_to).substring(0, 5) : to;
      }
      let status: GirlStatus = 'off';
      if (from && to) {
        if (now >= from && now <= to) status = 'working';
        else if (now < from) status = 'later';
      }
      const isNew = computeIsNew(r.is_new, r.created_at);
      const scheduleLoc = r.schedule_location ? String(r.schedule_location) : null;
      const fallbackLoc = r.fallback_location ? String(r.fallback_location) : null;
      return {
        id: Number(r.id),
        slug: String(r.slug),
        name: String(r.name),
        age: Number(r.age),
        height: r.height != null ? Number(r.height) : null,
        weight: r.weight != null ? Number(r.weight) : null,
        bust: r.bust != null ? Number(r.bust) : null,
        location: scheduleLoc ?? fallbackLoc ?? String(r.location ?? 'Praha'),
        primaryPhoto: r.primary_photo ? String(r.primary_photo) : null,
        secondaryPhoto: r.secondary_photo ? String(r.secondary_photo) : null,
        photoCount: Number(r.photo_count),
        videoCount: Number(r.video_count),
        status: isPaused ? 'off' : status,
        shiftFrom: from,
        shiftTo: to,
        isVip: false,
        isPaused,
        isNew,
        languages: parseLangs(r.languages),
        rating: r.rating != null ? Number(r.rating) : 0,
        reviewsCount: r.reviews_count != null ? Number(r.reviews_count) : 0,
        hashtags: parseLangs(r.hashtags),
      };
    });

  return { girls, total };
}

export async function getGirlsForHashtag(slug: string): Promise<GirlCard[]> {
  const dayOfWeek = pragueDayOfWeek();
  const today = pragueDateISO();

  const result = await db.execute({
    sql: `
      SELECT
        g.id, g.slug, g.name, g.age, g.height, g.weight, g.bust, g.location,
        g.created_at, g.is_new, g.languages, g.hashtags, g.rating, g.reviews_count,
        gs.start_time AS shift_from, gs.end_time AS shift_to,
        se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
        l.display_name AS schedule_location,
        l2.display_name AS fallback_location,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS primary_photo,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND (is_primary = 0 OR is_primary IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1) AS secondary_photo,
        (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count,
        (SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id) AS video_count
      FROM girls g
      LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
        AND gs.day_of_week = ? AND gs.is_active = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN locations l2 ON l2.district = g.location AND l2.is_active = 1
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.status = 'active' AND (g.vip = 0 OR g.vip IS NULL)
        AND g.hashtags IS NOT NULL
        AND g.hashtags != '[]'
        AND g.hashtags != ''
      ORDER BY g.name
    `,
    args: [dayOfWeek, today],
  });

  return result.rows
    .map((r): GirlCard | null => {
      if (r.exception_type === 'unavailable') return null;

      const tags = parseLangs(r.hashtags);
      if (!tags.includes(slug)) return null;

      let from: string | null = r.shift_from ? String(r.shift_from).substring(0, 5) : null;
      let to: string | null = r.shift_to ? String(r.shift_to).substring(0, 5) : null;

      if (r.exception_type === 'custom_hours') {
        from = r.ex_from ? String(r.ex_from).substring(0, 5) : from;
        to = r.ex_to ? String(r.ex_to).substring(0, 5) : to;
      }

      let status: GirlStatus = 'off';
      if (from && to) {
        const now = formatPragueTime();
        if (now >= from && now <= to) status = 'working';
        else if (now < from) status = 'later';
      }

      const isNew = computeIsNew(r.is_new, r.created_at);
      const scheduleLoc = r.schedule_location ? String(r.schedule_location) : null;
      const fallbackLoc = r.fallback_location ? String(r.fallback_location) : null;

      return {
        id: Number(r.id),
        slug: String(r.slug),
        name: String(r.name),
        age: Number(r.age),
        height: r.height != null ? Number(r.height) : null,
        weight: r.weight != null ? Number(r.weight) : null,
        bust: r.bust != null ? Number(r.bust) : null,
        location: scheduleLoc ?? fallbackLoc ?? String(r.location ?? 'Praha'),
        primaryPhoto: r.primary_photo ? String(r.primary_photo) : null,
        secondaryPhoto: r.secondary_photo ? String(r.secondary_photo) : null,
        photoCount: Number(r.photo_count),
        videoCount: Number(r.video_count),
        status,
        shiftFrom: from,
        shiftTo: to,
        isVip: false,
        isPaused: false,
        isNew,
        languages: parseLangs(r.languages),
        rating: r.rating != null ? Number(r.rating) : 0,
        reviewsCount: r.reviews_count != null ? Number(r.reviews_count) : 0,
        hashtags: tags,
      };
    })
    .filter((g): g is GirlCard => g !== null);
}

/* =========================================================
 * ADMIN — Schedules grouped by girl
 * ========================================================= */

export interface ScheduleEntry {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location_name: string | null;
}

export interface GirlScheduleGroup {
  girlId: number;
  girlName: string;
  girlSlug: string;
  girlColor: string | null;
  girlPhoto: string | null;
  schedules: ScheduleEntry[];
}

export async function getAllSchedulesGrouped(): Promise<GirlScheduleGroup[]> {
  const girlsRes = await db.execute(
    `SELECT id, name, slug, color FROM girls WHERE status IN ('active','inactive','pending') ORDER BY name`
  );

  if (girlsRes.rows.length === 0) return [];

  const girlIds = girlsRes.rows.map((r) => Number(r.id));

  const schedRes = await db.execute({
    sql: `SELECT gs.id, gs.girl_id, gs.day_of_week, gs.start_time, gs.end_time,
                 l.display_name AS location_name
          FROM girl_schedules gs
          LEFT JOIN locations l ON l.id = gs.location_id
          WHERE gs.girl_id IN (${girlIds.map(() => '?').join(',')})
          ORDER BY gs.girl_id, gs.day_of_week`,
    args: girlIds,
  });

  const photoRes = await db.execute({
    sql: `SELECT girl_id, url FROM girl_photos WHERE is_primary = 1 AND girl_id IN (${girlIds.map(() => '?').join(',')}) GROUP BY girl_id`,
    args: girlIds,
  });

  const photoMap = new Map<number, string>();
  for (const r of photoRes.rows) {
    photoMap.set(Number(r.girl_id), String(r.url));
  }

  const schedMap = new Map<number, ScheduleEntry[]>();
  for (const r of schedRes.rows) {
    const gid = Number(r.girl_id);
    if (!schedMap.has(gid)) schedMap.set(gid, []);
    schedMap.get(gid)!.push({
      id: Number(r.id),
      day_of_week: Number(r.day_of_week),
      start_time: String(r.start_time ?? ''),
      end_time: String(r.end_time ?? ''),
      location_name: r.location_name ? String(r.location_name) : null,
    });
  }

  return girlsRes.rows.map((r) => ({
    girlId: Number(r.id),
    girlName: String(r.name),
    girlSlug: String(r.slug),
    girlColor: r.color ? String(r.color) : null,
    girlPhoto: photoMap.get(Number(r.id)) ?? null,
    schedules: schedMap.get(Number(r.id)) ?? [],
  }));
}

export interface FeaturedGirlForHero {
  id: number;
  name: string;
  age: number;
  location: string;
  photo: string;
}

export async function getFeaturedGirlForHero(): Promise<FeaturedGirlForHero | null> {
  const res = await db.execute(
    `SELECT g.id, g.name, g.age, g.location,
            (SELECT url FROM girl_photos WHERE girl_id=g.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS photo
     FROM girls g
     WHERE g.status='active' AND g.vip IS NOT 1
     ORDER BY g.is_featured DESC, g.rating DESC, g.id DESC
     LIMIT 1`
  );
  const r = res.rows[0];
  if (!r || !r.photo) return null;
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    age: Number(r.age ?? 0),
    location: r.location ? String(r.location) : 'Praha',
    photo: String(r.photo),
  };
}

export async function getGirlServices(girlId: number): Promise<number[]> {
  const res = await db.execute({
    sql: `SELECT service_id FROM girl_services WHERE girl_id = ?`,
    args: [girlId],
  });
  return res.rows.map((r) => Number(r.service_id));
}

export interface ApplicationRow {
  id: number;
  name: string;
  age: number;
  height: number | null;
  weight: number | null;
  bust: number | null;
  bust_natural: number | null;
  waist: number | null;
  hips: number | null;
  email: string | null;
  phone: string;
  telegram: string | null;
  experience: string | null;
  languages: string | null;
  availability: string | null;
  bio_cs: string | null;
  bio_en: string | null;
  services: string | null;
  hair: string | null;
  eyes: string | null;
  tattoo: number | null;
  tattoo_description: string | null;
  piercing: number | null;
  status: string;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  converted_to_girl_id: number | null;
}

function mapApplicationRow(r: Record<string, unknown>): ApplicationRow {
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    age: Number(r.age ?? 0),
    height: r.height != null ? Number(r.height) : null,
    weight: r.weight != null ? Number(r.weight) : null,
    bust: r.bust != null ? Number(r.bust) : null,
    bust_natural: r.bust_natural != null ? Number(r.bust_natural) : null,
    waist: r.waist != null ? Number(r.waist) : null,
    hips: r.hips != null ? Number(r.hips) : null,
    email: r.email != null ? String(r.email) : null,
    phone: String(r.phone ?? ''),
    telegram: r.telegram != null ? String(r.telegram) : null,
    experience: r.experience != null ? String(r.experience) : null,
    languages: r.languages != null ? String(r.languages) : null,
    availability: r.availability != null ? String(r.availability) : null,
    bio_cs: r.bio_cs != null ? String(r.bio_cs) : null,
    bio_en: r.bio_en != null ? String(r.bio_en) : null,
    services: r.services != null ? String(r.services) : null,
    hair: r.hair != null ? String(r.hair) : null,
    eyes: r.eyes != null ? String(r.eyes) : null,
    tattoo: r.tattoo != null ? Number(r.tattoo) : null,
    tattoo_description: r.tattoo_description != null ? String(r.tattoo_description) : null,
    piercing: r.piercing != null ? Number(r.piercing) : null,
    status: String(r.status ?? 'pending'),
    rejection_reason: r.rejection_reason != null ? String(r.rejection_reason) : null,
    notes: r.notes != null ? String(r.notes) : null,
    created_at: r.created_at != null ? String(r.created_at) : null,
    reviewed_at: r.reviewed_at != null ? String(r.reviewed_at) : null,
    converted_to_girl_id: r.converted_to_girl_id != null ? Number(r.converted_to_girl_id) : null,
  };
}

export async function getApplications(status?: 'pending' | 'approved' | 'rejected'): Promise<ApplicationRow[]> {
  const sql = status
    ? `SELECT * FROM girl_applications WHERE status = ? ORDER BY created_at DESC`
    : `SELECT * FROM girl_applications ORDER BY created_at DESC`;
  const res = await db.execute({ sql, args: status ? [status] : [] });
  return res.rows.map((r) => mapApplicationRow(r as unknown as Record<string, unknown>));
}

export async function getApplicationById(id: number): Promise<ApplicationRow | null> {
  const res = await db.execute({
    sql: `SELECT * FROM girl_applications WHERE id = ? LIMIT 1`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return mapApplicationRow(res.rows[0] as unknown as Record<string, unknown>);
}

export async function getApplicationCounts(): Promise<{ pending: number; approved: number; rejected: number }> {
  const res = await db.execute(
    `SELECT status, COUNT(*) AS cnt FROM girl_applications GROUP BY status`
  );
  const out = { pending: 0, approved: 0, rejected: 0 };
  for (const r of res.rows) {
    const s = String(r.status ?? '');
    const c = Number(r.cnt ?? 0);
    if (s === 'pending') out.pending = c;
    else if (s === 'approved') out.approved = c;
    else if (s === 'rejected') out.rejected = c;
  }
  return out;
}

