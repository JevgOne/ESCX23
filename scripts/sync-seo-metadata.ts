/**
 * One-time script: populate seo_metadata table with inline defaults
 * so admin dashboard shows reality.
 *
 * Run: npx tsx scripts/sync-seo-metadata.ts
 *
 * Rules:
 * - If row exists with real data (meta_title filled) → SKIP (admin already edited)
 * - If row exists but empty → UPDATE with defaults
 * - If row doesn't exist → INSERT with defaults
 */
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.DATABASE_URL ?? 'file:./data/app.db',
});

const BASE = 'https://www.lovelygirls.cz';

// Default titles/descriptions per locale for static pages
const STATIC_DEFAULTS: Record<string, Record<string, { title: string; desc: string }>> = {
  '': {
    cs: { title: 'LovelyGirls Praha — Ověřené společnice', desc: 'Prémiové escort služby v Praze. 13 ověřených společnic, 4 soukromé byty.' },
    en: { title: 'LovelyGirls Prague — Verified Companions', desc: 'Premium escort services in Prague. 13 verified companions, 4 private apartments.' },
    de: { title: 'LovelyGirls Prag — Verifizierte Begleiterinnen', desc: 'Premium-Escort-Services in Prag. 13 verifizierte Begleiterinnen.' },
    uk: { title: 'LovelyGirls Прага — Перевірені супутниці', desc: 'Преміум ескорт послуги в Празі. 13 перевірених супутниць.' },
  },
  '/divky': {
    cs: { title: 'Escort dívky Praha – ověřené společnice | LovelyGirls', desc: 'Profily ověřených escort dívek v Praze. Luxusní společnice, diskrétní služby.' },
    en: { title: 'Escort Girls Prague – Verified Companions | LovelyGirls', desc: 'Browse verified escort girl profiles in Prague.' },
    de: { title: 'Escort Mädchen Prag – Verifizierte Begleiterinnen | LovelyGirls', desc: 'Verifizierte Escort-Profile in Prag.' },
    uk: { title: 'Ескорт дівчата Прага – перевірені супутниці | LovelyGirls', desc: 'Профілі перевірених ескорт дівчат у Празі.' },
  },
  '/cenik': {
    cs: { title: 'Ceník | LovelyGirls Praha', desc: 'Programy společnic od 2 500 Kč / 30 min. Cena zahrnuje soukromý apartmán.' },
    en: { title: 'Pricing | LovelyGirls Prague', desc: 'Companion programs from 2,500 CZK / 30 min. All prices include the private apartment.' },
    de: { title: 'Preise | LovelyGirls Prag', desc: 'Begleitprogramme ab 2.500 CZK / 30 Min. Preis inkl. Privatwohnung.' },
    uk: { title: 'Ціни | LovelyGirls Прага', desc: 'Програми супутниць від 2 500 CZK / 30 хв. Ціна включає апартамент.' },
  },
  '/rozvrh': {
    cs: { title: 'Rozvrh dívek | LovelyGirls Praha', desc: 'Kdo dnes pracuje? Denní rozvrh escort dívek v Praze.' },
    en: { title: 'Schedule | LovelyGirls Prague', desc: 'Who is working today? Daily escort schedule in Prague.' },
    de: { title: 'Zeitplan | LovelyGirls Prag', desc: 'Wer arbeitet heute? Täglicher Escort-Zeitplan in Prag.' },
    uk: { title: 'Розклад | LovelyGirls Прага', desc: 'Хто працює сьогодні? Денний розклад ескорт-супутниць у Празі.' },
  },
  '/slevy': {
    cs: { title: 'Slevy a akce | LovelyGirls Praha', desc: 'Aktuální slevy na escort služby v Praze.' },
    en: { title: 'Discounts | LovelyGirls Prague', desc: 'Current discounts on escort services in Prague.' },
    de: { title: 'Rabatte | LovelyGirls Prag', desc: 'Aktuelle Rabatte auf Escort-Services in Prag.' },
    uk: { title: 'Знижки | LovelyGirls Прага', desc: 'Актуальні знижки на ескорт послуги в Празі.' },
  },
  '/faq': {
    cs: { title: 'Časté otázky | LovelyGirls Praha', desc: 'Odpovědi na nejčastější otázky o escort službách v Praze.' },
    en: { title: 'FAQ | LovelyGirls Prague', desc: 'Answers to frequently asked questions about escort services in Prague.' },
    de: { title: 'FAQ | LovelyGirls Prag', desc: 'Antworten auf häufig gestellte Fragen zu Escort-Services in Prag.' },
    uk: { title: 'FAQ | LovelyGirls Прага', desc: 'Відповіді на часті питання про ескорт послуги в Празі.' },
  },
  '/blog': {
    cs: { title: 'Blog | LovelyGirls Praha', desc: 'Novinky a příběhy ze světa LovelyGirls.' },
    en: { title: 'Blog | LovelyGirls Prague', desc: 'News and stories from the LovelyGirls world.' },
    de: { title: 'Blog | LovelyGirls Prag', desc: 'Neuigkeiten und Geschichten aus der Welt von LovelyGirls.' },
    uk: { title: 'Блог | LovelyGirls Прага', desc: 'Новини та історії зі світу LovelyGirls.' },
  },
  '/recenze': {
    cs: { title: 'Recenze | LovelyGirls Praha', desc: 'Skutečné recenze od klientů LovelyGirls Praha.' },
    en: { title: 'Reviews | LovelyGirls Prague', desc: 'Real reviews from LovelyGirls Prague clients.' },
    de: { title: 'Bewertungen | LovelyGirls Prag', desc: 'Echte Bewertungen von LovelyGirls-Kunden.' },
    uk: { title: 'Відгуки | LovelyGirls Прага', desc: 'Справжні відгуки клієнтів LovelyGirls Прага.' },
  },
  '/o-nas': {
    cs: { title: 'O nás | LovelyGirls Praha', desc: 'Poznejte LovelyGirls Praha — prémiovou escort agenturu.' },
    en: { title: 'About Us | LovelyGirls Prague', desc: 'Meet LovelyGirls Prague — a premium escort agency.' },
    de: { title: 'Über uns | LovelyGirls Prag', desc: 'Lernen Sie LovelyGirls Prag kennen — eine Premium-Escort-Agentur.' },
    uk: { title: 'Про нас | LovelyGirls Прага', desc: 'Знайомтесь з LovelyGirls Прага — преміум ескорт агентурою.' },
  },
  '/kontakt': {
    cs: { title: 'Kontakt | LovelyGirls Praha', desc: 'Kontaktujte LovelyGirls Praha přes WhatsApp, Telegram nebo telefon.' },
    en: { title: 'Contact | LovelyGirls Prague', desc: 'Contact LovelyGirls Prague via WhatsApp, Telegram or phone.' },
    de: { title: 'Kontakt | LovelyGirls Prag', desc: 'Kontaktieren Sie LovelyGirls Prag über WhatsApp, Telegram oder Telefon.' },
    uk: { title: 'Контакт | LovelyGirls Прага', desc: 'Зв\'яжіться з LovelyGirls Прага через WhatsApp, Telegram або телефон.' },
  },
  '/podminky': {
    cs: { title: 'Podmínky | LovelyGirls Praha', desc: 'Obchodní podmínky služeb LovelyGirls Praha.' },
    en: { title: 'Terms | LovelyGirls Prague', desc: 'Terms of service for LovelyGirls Prague.' },
    de: { title: 'AGB | LovelyGirls Prag', desc: 'Allgemeine Geschäftsbedingungen von LovelyGirls Prag.' },
    uk: { title: 'Умови | LovelyGirls Прага', desc: 'Умови обслуговування LovelyGirls Прага.' },
  },
  '/soukromi': {
    cs: { title: 'Ochrana soukromí | LovelyGirls Praha', desc: 'Zásady ochrany osobních údajů LovelyGirls Praha.' },
    en: { title: 'Privacy Policy | LovelyGirls Prague', desc: 'Privacy policy for LovelyGirls Prague.' },
    de: { title: 'Datenschutz | LovelyGirls Prag', desc: 'Datenschutzrichtlinie von LovelyGirls Prag.' },
    uk: { title: 'Конфіденційність | LovelyGirls Прага', desc: 'Політика конфіденційності LovelyGirls Прага.' },
  },
  '/join': {
    cs: { title: 'Přidej se k nám | LovelyGirls Praha', desc: 'Staň se součástí LovelyGirls Praha. Férové podmínky, bezpečné prostředí.' },
    en: { title: 'Join Us | LovelyGirls Prague', desc: 'Become part of LovelyGirls Prague. Fair conditions, safe environment.' },
    de: { title: 'Mitmachen | LovelyGirls Prag', desc: 'Werden Sie Teil von LovelyGirls Prag. Faire Bedingungen, sichere Umgebung.' },
    uk: { title: 'Приєднуйтесь | LovelyGirls Прага', desc: 'Стань частиною LovelyGirls Прага. Чесні умови, безпечне середовище.' },
  },
  '/clenstvi/zadost': {
    cs: { title: 'Žádost o členství | LovelyGirls Praha', desc: 'Přihlaste se do členského programu LovelyGirls Praha.' },
    en: { title: 'Membership Application | LovelyGirls Prague', desc: 'Apply for LovelyGirls Prague membership program.' },
    de: { title: 'Mitgliedschaftsantrag | LovelyGirls Prag', desc: 'Bewerben Sie sich für das Mitgliedschaftsprogramm.' },
    uk: { title: 'Заявка на членство | LovelyGirls Прага', desc: 'Подайте заявку на членство в LovelyGirls Прага.' },
  },
};

const locales = ['cs', 'en', 'de', 'uk'];

async function upsertRow(path: string, type: string, locale: string, title: string, desc: string) {
  const canonical = `${BASE}${path}`;
  // Check if row with real data exists
  const existing = await db.execute({
    sql: `SELECT meta_title FROM seo_metadata WHERE page_path = ?`,
    args: [path],
  });

  if (existing.rows.length > 0) {
    const existingTitle = existing.rows[0].meta_title;
    if (existingTitle && String(existingTitle).trim() !== '') {
      return 'skipped'; // Admin already edited — keep
    }
    // Row exists but empty — update
    await db.execute({
      sql: `UPDATE seo_metadata SET meta_title = ?, meta_description = ?, canonical_url = ?, seo_score = 50, updated_at = CURRENT_TIMESTAMP WHERE page_path = ?`,
      args: [title, desc, canonical, path],
    });
    return 'updated';
  }

  // Insert new
  await db.execute({
    sql: `INSERT INTO seo_metadata (page_path, page_type, locale, meta_title, meta_description, canonical_url, seo_score)
          VALUES (?, ?, ?, ?, ?, ?, 50)`,
    args: [path, type, locale, title, desc, canonical],
  });
  return 'inserted';
}

async function main() {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Static pages
  for (const [slug, localeDefs] of Object.entries(STATIC_DEFAULTS)) {
    for (const locale of locales) {
      const def = localeDefs[locale];
      if (!def) continue;
      const path = `/${locale}${slug}`;
      const result = await upsertRow(path, 'static', locale, def.title, def.desc);
      if (result === 'inserted') inserted++;
      else if (result === 'updated') updated++;
      else skipped++;
    }
  }

  // Girl profiles
  const girls = await db.execute(
    `SELECT slug, name FROM girls WHERE status IN ('active','inactive') ORDER BY name`
  );
  for (const girl of girls.rows) {
    const name = String(girl.name);
    const slug = String(girl.slug);
    for (const locale of locales) {
      const path = `/${locale}/profil/${slug}`;
      const title = `${name} | LovelyGirls ${locale === 'cs' ? 'Praha' : locale === 'de' ? 'Prag' : locale === 'uk' ? 'Прага' : 'Prague'}`;
      const desc = locale === 'cs' ? `Profil společnice ${name}. Fotogalerie, služby, recenze.`
        : locale === 'de' ? `Profil von ${name}. Fotogalerie, Services, Bewertungen.`
        : locale === 'uk' ? `Профіль супутниці ${name}. Фотогалерея, послуги, відгуки.`
        : `${name}'s profile. Photo gallery, services, reviews.`;
      const result = await upsertRow(path, 'girl', locale, title, desc);
      if (result === 'inserted') inserted++;
      else if (result === 'updated') updated++;
      else skipped++;
    }
  }

  // Services
  const services = await db.execute(`SELECT slug, name_cs, name_en FROM services ORDER BY name_cs`);
  for (const svc of services.rows) {
    const slug = String(svc.slug);
    const nameCs = String(svc.name_cs);
    const nameEn = String(svc.name_en || svc.name_cs);
    for (const locale of locales) {
      const path = `/${locale}/sluzba/${slug}`;
      const name = locale === 'cs' || locale === 'uk' ? nameCs : nameEn;
      const title = `${name} | LovelyGirls`;
      const desc = locale === 'cs' ? `Escort dívky nabízející ${nameCs.toLowerCase()} v Praze.`
        : `Escort girls offering ${nameEn.toLowerCase()} in Prague.`;
      const result = await upsertRow(path, 'service', locale, title, desc);
      if (result === 'inserted') inserted++;
      else if (result === 'updated') updated++;
      else skipped++;
    }
  }

  // Locations
  const locations = await db.execute(
    `SELECT name, display_name FROM locations WHERE is_active = 1 ORDER BY name`
  );
  for (const loc of locations.rows) {
    const slug = String(loc.name);
    const displayName = String(loc.display_name);
    for (const locale of locales) {
      const path = `/${locale}/pobocka/${slug}`;
      const title = `${displayName} | LovelyGirls`;
      const desc = locale === 'cs' ? `Escort společnice na pobočce ${displayName}.`
        : `Escort companions at ${displayName} location.`;
      const result = await upsertRow(path, 'location', locale, title, desc);
      if (result === 'inserted') inserted++;
      else if (result === 'updated') updated++;
      else skipped++;
    }
  }

  // Blog posts
  const blogs = await db.execute(
    `SELECT slug, title_cs FROM blog_posts WHERE status = 'published' ORDER BY slug`
  );
  for (const post of blogs.rows) {
    const slug = String(post.slug);
    const titleCs = String(post.title_cs);
    for (const locale of locales) {
      const path = `/${locale}/blog/${slug}`;
      const title = `${titleCs} | LovelyGirls Blog`;
      const result = await upsertRow(path, 'blog', locale, title, titleCs);
      if (result === 'inserted') inserted++;
      else if (result === 'updated') updated++;
      else skipped++;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Updated: ${updated}, Skipped (had data): ${skipped}`);
}

main().catch(console.error);
