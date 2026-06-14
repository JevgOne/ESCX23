/**
 * Seed / update seo_metadata table with recommended SEO texts.
 * Admin can then edit any of these from /admin/seo.
 *
 * Run: npx tsx scripts/sync-seo-metadata.ts
 *
 * Rules:
 * - Always UPDATE existing rows (overwrite old Secretstory defaults)
 * - If row doesn't exist → INSERT
 * - Admin edits after this seed will persist (until re-run)
 */
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.DATABASE_URL ?? 'file:./data/app.db',
});

const BASE = 'https://www.lovelygirls.cz';

// ── Recommended titles & descriptions per locale (from SEO-recommendations.md) ──

const STATIC_PAGES: Record<string, Record<string, { title: string; desc: string; keywords?: string }>> = {
  '': {
    cs: {
      title: 'Escort Praha — Ověřené společnice v privátním apartmánu | LovelyGirls',
      desc: '13 ověřených společnic v Praze. 4 diskrétní apartmány, transparentní ceník, otevřeno denně 10–22:30. Kontakt přes WhatsApp.',
      keywords: 'escort praha, společnice praha, privátní apartmán, ověřené dívky, escort služby praha',
    },
    en: {
      title: 'Escort Prague — Verified Companions, Private Apartments | LovelyGirls',
      desc: '13 verified companions in Prague. 4 discreet apartments, transparent pricing, open daily 10–22:30. Instant WhatsApp booking.',
      keywords: 'escort prague, companions prague, private apartments, verified girls, escort services prague',
    },
    de: {
      title: 'Escort Prag — Verifizierte Begleiterinnen, Diskrete Apartments | LovelyGirls',
      desc: '13 verifizierte Begleiterinnen in Prag. 4 diskrete Apartments, transparente Preise, täglich 10–22:30. WhatsApp-Buchung.',
      keywords: 'escort prag, begleiterinnen prag, diskrete apartments, verifizierte mädchen',
    },
    uk: {
      title: 'Ескорт Прага — Перевірені супутниці, Приватні апартаменти | LovelyGirls',
      desc: '13 перевірених супутниць у Празі. 4 дискретних апартаменти, прозорі ціни, щодня 10–22:30. Бронювання через WhatsApp.',
      keywords: 'ескорт прага, супутниці прага, приватні апартаменти, перевірені дівчата',
    },
  },
  '/divky': {
    cs: {
      title: 'Společnice Praha — Ověřené dívky na escort a privát | LovelyGirls',
      desc: 'Prohlédněte si ověřené společnice LovelyGirls Praha. Reálné fotky, transparentní ceny, filtr podle služeb a dostupnosti. Diskrétní apartmány v centru.',
      keywords: 'společnice praha, escort dívky, ověřené profily, reálné fotky, escort praha',
    },
    en: {
      title: 'Prague Companions — Verified Escort Girls with Real Photos | LovelyGirls',
      desc: 'Browse verified companions at LovelyGirls Prague. Real photos, transparent pricing, filter by services & availability. Discreet central apartments.',
      keywords: 'prague companions, escort girls prague, verified profiles, real photos',
    },
    de: {
      title: 'Begleiterinnen Prag — Verifizierte Escort-Mädchen | LovelyGirls',
      desc: 'Entdecken Sie verifizierte Begleiterinnen bei LovelyGirls Prag. Echte Fotos, transparente Preise, Filter nach Service und Verfügbarkeit.',
      keywords: 'begleiterinnen prag, escort mädchen prag, verifizierte profile',
    },
    uk: {
      title: 'Супутниці Прага — Перевірені дівчата з реальними фото | LovelyGirls',
      desc: 'Перегляньте перевірених супутниць LovelyGirls Прага. Реальні фото, прозорі ціни, фільтр за послугами та доступністю.',
      keywords: 'супутниці прага, ескорт дівчата, перевірені профілі, реальні фото',
    },
  },
  '/cenik': {
    cs: {
      title: 'Ceník společnic Praha — Programy a ceny | LovelyGirls',
      desc: 'Transparentní ceník LovelyGirls Praha. 5 programů od 30 do 120 minut, platba v hotovosti, žádné skryté poplatky. Extra služby na výběr.',
      keywords: 'ceník escort praha, ceny společnic, programy escort, platba hotově',
    },
    en: {
      title: 'Escort Pricing Prague — Packages & Rates | LovelyGirls',
      desc: 'Transparent pricing at LovelyGirls Prague. 5 packages from 30 to 120 minutes, cash payment, no hidden fees. Extra services available.',
      keywords: 'escort pricing prague, companion rates, packages, cash payment',
    },
    de: {
      title: 'Escort Preise Prag — Programme und Preise | LovelyGirls',
      desc: 'Transparente Preise bei LovelyGirls Prag. 5 Programme von 30 bis 120 Minuten, Barzahlung, keine versteckten Gebühren.',
      keywords: 'escort preise prag, begleiterinnen preise, programme, barzahlung',
    },
    uk: {
      title: 'Ціни ескорт Прага — Програми та тарифи | LovelyGirls',
      desc: 'Прозорі ціни LovelyGirls Прага. 5 програм від 30 до 120 хвилин, готівка, без прихованих платежів.',
      keywords: 'ціни ескорт прага, програми супутниць, тарифи, готівка',
    },
  },
  '/rozvrh': {
    cs: {
      title: 'Rozvrh společnic dnes — Kdo je k dispozici | LovelyGirls Praha',
      desc: 'Kdo dnes pracuje u LovelyGirls Praha? Rozvrh společnic na celý týden. Filtrujte podle pobočky. Aktualizováno v reálném čase.',
      keywords: 'rozvrh escort praha, kdo dnes pracuje, dostupné společnice, escort schedule',
    },
    en: {
      title: 'Companion Schedule Today — Who\'s Available | LovelyGirls Prague',
      desc: 'Who\'s working at LovelyGirls Prague today? Weekly companion schedule. Filter by apartment location. Updated in real time.',
      keywords: 'companion schedule prague, who is available, escort schedule, real time',
    },
    de: {
      title: 'Zeitplan Begleiterinnen heute — Verfügbarkeit | LovelyGirls Prag',
      desc: 'Wer arbeitet heute bei LovelyGirls Prag? Wöchentlicher Zeitplan. Nach Apartment filtern. Echtzeit-Aktualisierung.',
      keywords: 'zeitplan begleiterinnen prag, verfügbarkeit, escort zeitplan',
    },
    uk: {
      title: 'Розклад супутниць сьогодні — Хто доступний | LovelyGirls Прага',
      desc: 'Хто працює у LovelyGirls Прага сьогодні? Тижневий розклад. Фільтруйте за локацією. Оновлення в реальному часі.',
      keywords: 'розклад ескорт прага, хто працює, доступні супутниці',
    },
  },
  '/slevy': {
    cs: {
      title: 'Slevy a věrnostní program — Až 20 % sleva | LovelyGirls Praha',
      desc: 'Ranní sleva, věrnostní bonus po 3/5/10 návštěvách, narozeninová sleva 20 %. LovelyGirls Praha odměňuje stálé klienty.',
      keywords: 'slevy escort praha, věrnostní program, narozeninová sleva, ranní sleva',
    },
    en: {
      title: 'Discounts & Loyalty Program — Up to 20 % Off | LovelyGirls Prague',
      desc: 'Morning discount, loyalty bonus after 3/5/10 visits, 20 % birthday discount. LovelyGirls Prague rewards returning clients.',
      keywords: 'escort discounts prague, loyalty program, birthday discount, morning discount',
    },
    de: {
      title: 'Rabatte & Treueprogramm — Bis zu 20 % Rabatt | LovelyGirls Prag',
      desc: 'Morgenrabatt, Treuebonus nach 3/5/10 Besuchen, 20 % Geburtstagsrabatt. LovelyGirls Prag belohnt Stammkunden.',
      keywords: 'rabatte escort prag, treueprogramm, geburtstagsrabatt, morgenrabatt',
    },
    uk: {
      title: 'Знижки та програма лояльності — До 20 % знижки | LovelyGirls Прага',
      desc: 'Ранкова знижка, бонус лояльності після 3/5/10 відвідувань, 20 % знижка до дня народження. LovelyGirls Прага.',
      keywords: 'знижки ескорт прага, програма лояльності, знижка на день народження',
    },
  },
  '/faq': {
    cs: {
      title: 'Časté dotazy — Escort Praha, rezervace, platba | LovelyGirls',
      desc: 'Odpovědi na nejčastější otázky o escort službách v Praze. Jak rezervovat, platba hotově, diskrétnost, bezpečnost, legalita.',
      keywords: 'faq escort praha, časté dotazy, jak rezervovat, platba hotově, bezpečnost',
    },
    en: {
      title: 'FAQ — Escort Prague Booking, Payment, Discretion | LovelyGirls',
      desc: 'Answers to common questions about escort services in Prague. How to book, cash payment, discretion, safety, legality.',
      keywords: 'faq escort prague, common questions, how to book, cash payment, safety',
    },
    de: {
      title: 'FAQ — Escort Prag Buchung, Zahlung, Diskretion | LovelyGirls',
      desc: 'Antworten auf häufige Fragen über Escort-Services in Prag. Buchung, Barzahlung, Diskretion, Sicherheit, Legalität.',
      keywords: 'faq escort prag, häufige fragen, buchung, barzahlung, diskretion',
    },
    uk: {
      title: 'Часті питання — Ескорт Прага, бронювання, оплата | LovelyGirls',
      desc: 'Відповіді на часті питання про ескорт послуги в Празі. Як замовити, оплата готівкою, дискретність, безпека, легальність.',
      keywords: 'faq ескорт прага, часті питання, як замовити, оплата готівкою',
    },
  },
  '/recenze': {
    cs: {
      title: 'Recenze klientů — Zkušenosti se společnicemi | LovelyGirls Praha',
      desc: 'Skutečné anonymní recenze klientů LovelyGirls Praha. Hodnocení, zkušenosti a doporučení. Průměr 4.8 z 5 hvězd.',
      keywords: 'recenze escort praha, hodnocení společnic, zkušenosti klientů, doporučení',
    },
    en: {
      title: 'Client Reviews — Companion Experiences | LovelyGirls Prague',
      desc: 'Real anonymous client reviews of LovelyGirls Prague. Ratings, experiences and recommendations. Average 4.8 out of 5 stars.',
      keywords: 'escort reviews prague, client ratings, companion experiences, recommendations',
    },
    de: {
      title: 'Kundenbewertungen — Erfahrungen mit Begleiterinnen | LovelyGirls Prag',
      desc: 'Echte anonyme Kundenbewertungen von LovelyGirls Prag. Bewertungen und Empfehlungen. Durchschnitt 4.8 von 5 Sternen.',
      keywords: 'kundenbewertungen escort prag, erfahrungen, empfehlungen, bewertungen',
    },
    uk: {
      title: 'Відгуки клієнтів — Досвід з супутницями | LovelyGirls Прага',
      desc: 'Справжні анонімні відгуки клієнтів LovelyGirls Прага. Оцінки та рекомендації. Середній бал 4.8 з 5 зірок.',
      keywords: 'відгуки ескорт прага, оцінки клієнтів, досвід, рекомендації',
    },
  },
  '/blog': {
    cs: {
      title: 'Blog — Tipy, novinky a průvodci | LovelyGirls Praha',
      desc: 'Novinky a příběhy ze světa LovelyGirls Praha. Tipy pro klienty, průvodci Prahou, aktuality.',
      keywords: 'blog escort praha, tipy, novinky, průvodci prahou',
    },
    en: {
      title: 'Blog — Tips, News & Guides | LovelyGirls Prague',
      desc: 'News and stories from the LovelyGirls Prague world. Tips for clients, Prague guides, updates.',
      keywords: 'escort blog prague, tips, news, prague guides',
    },
    de: {
      title: 'Blog — Tipps, Neuigkeiten & Ratgeber | LovelyGirls Prag',
      desc: 'Neuigkeiten und Geschichten aus der Welt von LovelyGirls Prag. Tipps, Ratgeber, Aktuelles.',
      keywords: 'blog escort prag, tipps, neuigkeiten, ratgeber',
    },
    uk: {
      title: 'Блог — Поради, новини та путівники | LovelyGirls Прага',
      desc: 'Новини та історії зі світу LovelyGirls Прага. Поради для клієнтів, путівники Прагою.',
      keywords: 'блог ескорт прага, поради, новини, путівники',
    },
  },
  '/o-nas': {
    cs: {
      title: 'O nás — Escort agentura v Praze od roku 2023 | LovelyGirls',
      desc: 'LovelyGirls Praha — prémiová escort agentura v centru Prahy. Ověřené společnice, diskrétní apartmány, transparentní přístup.',
      keywords: 'o nás, escort agentura praha, lovelygirls, prémiová agentura',
    },
    en: {
      title: 'About Us — Escort Agency in Prague Since 2023 | LovelyGirls',
      desc: 'LovelyGirls Prague — premium escort agency in central Prague. Verified companions, discreet apartments, transparent approach.',
      keywords: 'about us, escort agency prague, lovelygirls, premium agency',
    },
    de: {
      title: 'Über uns — Escort-Agentur in Prag seit 2023 | LovelyGirls',
      desc: 'LovelyGirls Prag — Premium-Escort-Agentur im Zentrum von Prag. Verifizierte Begleiterinnen, diskrete Apartments.',
      keywords: 'über uns, escort agentur prag, lovelygirls, premium agentur',
    },
    uk: {
      title: 'Про нас — Ескорт агентство у Празі з 2023 | LovelyGirls',
      desc: 'LovelyGirls Прага — преміальне ескорт агентство в центрі Праги. Перевірені супутниці, дискретні апартаменти.',
      keywords: 'про нас, ескорт агентство прага, lovelygirls, преміальне агентство',
    },
  },
  '/kontakt': {
    cs: {
      title: 'Kontakt — WhatsApp, telefon, Telegram | LovelyGirls Praha',
      desc: 'Kontaktujte LovelyGirls Praha přes WhatsApp, telefon nebo Telegram. Rychlá odpověď, diskrétní komunikace. Otevřeno denně 10–22:30.',
      keywords: 'kontakt escort praha, whatsapp, telegram, telefon, otevírací doba',
    },
    en: {
      title: 'Contact — WhatsApp, Phone, Telegram | LovelyGirls Prague',
      desc: 'Contact LovelyGirls Prague via WhatsApp, phone or Telegram. Fast response, discreet communication. Open daily 10–22:30.',
      keywords: 'contact escort prague, whatsapp, telegram, phone, opening hours',
    },
    de: {
      title: 'Kontakt — WhatsApp, Telefon, Telegram | LovelyGirls Prag',
      desc: 'Kontaktieren Sie LovelyGirls Prag per WhatsApp, Telefon oder Telegram. Schnelle Antwort, diskrete Kommunikation.',
      keywords: 'kontakt escort prag, whatsapp, telegram, telefon',
    },
    uk: {
      title: 'Контакт — WhatsApp, телефон, Telegram | LovelyGirls Прага',
      desc: 'Зв\'яжіться з LovelyGirls Прага через WhatsApp, телефон або Telegram. Швидка відповідь, дискретне спілкування.',
      keywords: 'контакт ескорт прага, whatsapp, telegram, телефон',
    },
  },
  '/podminky': {
    cs: { title: 'Podmínky používání | LovelyGirls Praha', desc: 'Obchodní podmínky služeb LovelyGirls Praha.' },
    en: { title: 'Terms of Service | LovelyGirls Prague', desc: 'Terms of service for LovelyGirls Prague.' },
    de: { title: 'AGB | LovelyGirls Prag', desc: 'Allgemeine Geschäftsbedingungen von LovelyGirls Prag.' },
    uk: { title: 'Умови використання | LovelyGirls Прага', desc: 'Умови обслуговування LovelyGirls Прага.' },
  },
  '/soukromi': {
    cs: { title: 'Ochrana soukromí | LovelyGirls Praha', desc: 'Zásady ochrany osobních údajů LovelyGirls Praha.' },
    en: { title: 'Privacy Policy | LovelyGirls Prague', desc: 'Privacy policy for LovelyGirls Prague.' },
    de: { title: 'Datenschutz | LovelyGirls Prag', desc: 'Datenschutzrichtlinie von LovelyGirls Prag.' },
    uk: { title: 'Конфіденційність | LovelyGirls Прага', desc: 'Політика конфіденційності LovelyGirls Прага.' },
  },
  '/join': {
    cs: { title: 'Práce společnice Praha — Přidej se k LovelyGirls', desc: 'Hledáme nové společnice pro LovelyGirls Praha. Bezpečné zázemí, férové podmínky, diskrétní apartmány v centru.' },
    en: { title: 'Work as a Companion in Prague — Join LovelyGirls', desc: 'We\'re looking for new companions at LovelyGirls Prague. Safe environment, fair conditions, discreet central apartments.' },
    de: { title: 'Arbeiten als Begleiterin in Prag — LovelyGirls', desc: 'Wir suchen neue Begleiterinnen für LovelyGirls Prag. Sichere Umgebung, faire Bedingungen.' },
    uk: { title: 'Робота супутницею у Празі — Приєднуйтесь до LovelyGirls', desc: 'Шукаємо нових супутниць для LovelyGirls Прага. Безпечне середовище, чесні умови.' },
  },
  '/clenstvi/zadost': {
    cs: { title: 'Žádost o členství | LovelyGirls Praha', desc: 'Přihlaste se do členského programu LovelyGirls Praha.' },
    en: { title: 'Membership Application | LovelyGirls Prague', desc: 'Apply for LovelyGirls Prague membership program.' },
    de: { title: 'Mitgliedschaftsantrag | LovelyGirls Prag', desc: 'Bewerben Sie sich für das Mitgliedschaftsprogramm.' },
    uk: { title: 'Заявка на членство | LovelyGirls Прага', desc: 'Подайте заявку на членство в LovelyGirls Прага.' },
  },
};

const locales = ['cs', 'en', 'de', 'uk'];

async function upsertRow(
  path: string,
  type: string,
  locale: string,
  title: string,
  desc: string,
  keywords?: string,
) {
  const canonical = `${BASE}${path}`;

  const existing = await db.execute({
    sql: `SELECT id FROM seo_metadata WHERE page_path = ?`,
    args: [path],
  });

  if (existing.rows.length > 0) {
    // Update with recommended text
    await db.execute({
      sql: `UPDATE seo_metadata
            SET meta_title = ?, meta_description = ?, meta_keywords = COALESCE(?, meta_keywords),
                og_title = ?, og_description = ?,
                canonical_url = ?, seo_score = 75, updated_at = CURRENT_TIMESTAMP
            WHERE page_path = ?`,
      args: [title, desc, keywords ?? null, title, desc, canonical, path],
    });
    return 'updated';
  }

  // Insert new
  await db.execute({
    sql: `INSERT INTO seo_metadata (page_path, page_type, locale, meta_title, meta_description, meta_keywords, og_title, og_description, canonical_url, seo_score)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 75)`,
    args: [path, type, locale, title, desc, keywords ?? null, title, desc, canonical],
  });
  return 'inserted';
}

async function main() {
  let inserted = 0;
  let updated = 0;

  // Static pages
  for (const [slug, localeDefs] of Object.entries(STATIC_PAGES)) {
    for (const locale of locales) {
      const def = localeDefs[locale];
      if (!def) continue;
      const path = `/${locale}${slug}`;
      const result = await upsertRow(path, 'static', locale, def.title, def.desc, def.keywords);
      if (result === 'inserted') inserted++;
      else updated++;
    }
  }

  // Girl profiles — dynamic title from DB
  const girls = await db.execute(
    `SELECT slug, name, age FROM girls WHERE status IN ('active','inactive') ORDER BY name`
  );
  for (const girl of girls.rows) {
    const name = String(girl.name);
    const slug = String(girl.slug);
    const age = girl.age ? `, ${girl.age}` : '';
    for (const locale of locales) {
      const path = `/${locale}/profil/${slug}`;
      const city = locale === 'cs' ? 'Praha' : locale === 'de' ? 'Prag' : locale === 'uk' ? 'Прага' : 'Prague';
      const role = locale === 'cs' ? 'Společnice' : locale === 'de' ? 'Begleiterin' : locale === 'uk' ? 'Супутниця' : 'Companion';
      const title = `${name}${age} — ${role} ${city} | LovelyGirls`;
      const desc = locale === 'cs'
        ? `${name}${age} — ověřená společnice v Praze. Diskrétní apartmán, reálné fotky. Služby a recenze na LovelyGirls.`
        : locale === 'de'
          ? `${name}${age} — verifizierte Begleiterin in Prag. Diskretes Apartment, echte Fotos. Services und Bewertungen.`
          : locale === 'uk'
            ? `${name}${age} — перевірена супутниця у Празі. Дискретні апартаменти, реальні фото.`
            : `${name}${age} — verified companion in Prague. Discreet apartment, real photos. Services and reviews at LovelyGirls.`;
      const result = await upsertRow(path, 'girl', locale, title, desc);
      if (result === 'inserted') inserted++;
      else updated++;
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
      const city = locale === 'cs' ? 'Praha' : locale === 'de' ? 'Prag' : locale === 'uk' ? 'Прага' : 'Prague';
      const name = locale === 'cs' || locale === 'uk' ? nameCs : locale === 'de' ? nameEn : nameEn;
      const title = `${name} ${city} — Ověřené společnice | LovelyGirls`;
      const desc = locale === 'cs'
        ? `${nameCs} u ověřených společnic LovelyGirls Praha. Diskrétní apartmán, transparentní ceny.`
        : locale === 'de'
          ? `${nameEn} mit verifizierten Begleiterinnen bei LovelyGirls Prag. Diskretes Apartment, transparente Preise.`
          : locale === 'uk'
            ? `${nameCs} з перевіреними супутницями LovelyGirls Прага. Дискретні апартаменти, прозорі ціни.`
            : `${nameEn} with verified companions at LovelyGirls Prague. Discreet apartment, transparent pricing.`;
      const result = await upsertRow(path, 'service', locale, title, desc);
      if (result === 'inserted') inserted++;
      else updated++;
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
      const city = locale === 'cs' ? 'Praha' : locale === 'de' ? 'Prag' : locale === 'uk' ? 'Прага' : 'Prague';
      const title = locale === 'cs'
        ? `Apartmán ${displayName} — Diskrétní privát | LovelyGirls ${city}`
        : locale === 'de'
          ? `Apartment ${displayName} — Diskretes Privat | LovelyGirls ${city}`
          : locale === 'uk'
            ? `Апартамент ${displayName} — Дискретний приват | LovelyGirls ${city}`
            : `${displayName} Apartment — Discreet Private | LovelyGirls ${city}`;
      const desc = locale === 'cs'
        ? `Escort společnice na pobočce ${displayName}. Diskrétní privátní apartmán v centru Prahy.`
        : locale === 'de'
          ? `Escort Begleiterinnen am Standort ${displayName}. Diskretes Privatappartement.`
          : locale === 'uk'
            ? `Ескорт супутниці в локації ${displayName}. Дискретні апартаменти.`
            : `Escort companions at ${displayName} location. Discreet private apartment in central Prague.`;
      const result = await upsertRow(path, 'location', locale, title, desc);
      if (result === 'inserted') inserted++;
      else updated++;
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
      else updated++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Updated: ${updated}`);
  console.log('Admin can now edit all SEO texts at /admin/seo');
}

main().catch(console.error);
