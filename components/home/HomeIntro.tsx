import { Link } from '@/i18n/navigation';
import { localeHref } from '@/lib/seo/meta';
import { getSiteFacts, districtList } from '@/lib/site-facts';
import { verifiedCompanions } from '@/lib/plural';

/**
 * The one connected passage on a page that is otherwise all cards.
 *
 * The homepage says plenty, but almost all of it is inside cards and UI — a
 * crawler sees "Prague", "companions" and "verified" scattered across widgets
 * and no single passage explaining what this place is or where it operates.
 * The strongest query the site has, "prague escort" at 7,094 impressions, sits
 * at position 10. This is the connected paragraph that was missing, and it
 * carries contextual links to the pages that should rank for the narrower
 * searches — the three apartments, the schedule, the pricing.
 *
 * Numbers come from site-facts so the copy cannot drift from the roster.
 */
export default async function HomeIntro({ locale }: { locale: string }) {
  const facts = await getSiteFacts();
  const companions = verifiedCompanions(facts.companionsCount, locale);
  const districts = districtList(facts, locale);

  const copy: Record<string, { h2: string; body: React.ReactNode; more: string }> = {
    en: {
      h2: 'Prague Escort Agency — Verified Companions in Private Apartments',
      more: 'Where you will meet',
      body: (
        <>
          <p>
            LovelyGirls is a Prague escort agency with {companions} and three private
            apartments of its own — {districts}. Every profile is verified in person: the
            photographs are of the woman who opens the door. Browse all{' '}
            <Link href="/divky">verified Prague escorts</Link>, check who is
            working today on the <Link href="/rozvrh">schedule</Link>.
          </p>
          <p>
            Prices depend on time, not on services — 30 to 120 minutes, the same for every
            companion, apartment and shower included. See the{' '}
            <Link href="/cenik">pricing</Link> or the <Link href="/faq">FAQ</Link>. Cash on
            arrival, no hidden fees.
          </p>
        </>
      ),
    },
    cs: {
      h2: 'Escort Praha — Ověřené společnice v privátních apartmánech',
      more: 'Kde se potkáme',
      body: (
        <>
          <p>
            LovelyGirls je pražská escort agentura — {companions} a tři vlastní privátní
            apartmány: {districts}. Každý profil ověřujeme osobně, na fotkách je ta žena,
            která vám otevře. Prohlédněte si všechny{' '}
            <Link href="/divky">ověřené společnice v Praze</Link>, kdo dnes pracuje najdete
            v <Link href="/rozvrh">rozvrhu</Link>.
          </p>
          <p>
            Platí se za čas, ne za služby — 30 až 120 minut, jednotně pro všechny
            společnice, v ceně apartmán i sprcha. Podrobnosti v{' '}
            <Link href="/cenik">ceníku</Link> nebo ve <Link href="/faq">FAQ</Link>. Hotově
            na místě, bez příplatků.
          </p>
        </>
      ),
    },
    de: {
      h2: 'Escort Prag — Verifizierte Begleiterinnen in privaten Apartments',
      more: 'Wo wir uns treffen',
      body: (
        <>
          <p>
            LovelyGirls ist eine Prager Escort-Agentur mit {companions} und drei eigenen
            privaten Apartments im Zentrum. Jedes Profil wird persönlich verifiziert: Auf den
            Fotos ist die Frau, die Ihnen die Tür öffnet. Alle{' '}
            <Link href="/divky">verifizierten Begleiterinnen in Prag</Link> ansehen, oder
            im <Link href="/rozvrh">Zeitplan</Link> nachsehen, wer heute arbeitet.
          </p>
          <p>
            Bezahlt wird die Zeit, nicht die Leistung: Programme von 30 bis 120 Minuten, für
            alle Begleiterinnen gleich, Apartment und Dusche inklusive. Die vollständige{' '}
            <Link href="/cenik">Preisliste</Link> und die{' '}
            <Link href="/faq">häufigen Fragen</Link> finden Sie hier. Barzahlung vor Ort,
            keine versteckten Gebühren.
          </p>
        </>
      ),
    },
    uk: {
      h2: 'Ескорт Прага — Перевірені супутниці у приватних апартаментах',
      more: 'Де ми зустрінемось',
      body: (
        <>
          <p>
            LovelyGirls — празьке ескорт-агентство: {companions} і три власні приватні
            апартаменти в центрі. Кожен профіль перевіряємо особисто: на фото та жінка, яка
            відчинить вам двері. Переглянути всіх{' '}
            <Link href="/divky">перевірених супутниць у Празі</Link> або хто
            працює сьогодні — у <Link href="/rozvrh">розкладі</Link>.
          </p>
          <p>
            Платите за час, а не за послуги: програми від 30 до 120 хвилин, однакові для всіх
            супутниць, апартаменти й душ включені. Повний{' '}
            <Link href="/cenik">цінник</Link> і відповіді на{' '}
            <Link href="/faq">часті питання</Link> — тут. Готівкою на місці, без прихованих
            платежів.
          </p>
        </>
      ),
    },
  };

  const c = copy[locale] ?? copy.en;

  return (
    <section className="home-intro">
      <div className="container home-intro-inner">
        <div className="home-intro-head">
          <span className="home-intro-eyebrow">LovelyGirls</span>
          <h2>{c.h2}</h2>
        </div>
        <div className="home-intro-body">{c.body}</div>
        {facts.apartments.length > 0 && (
          <div className="home-intro-links">
            <span className="home-intro-links-label">{c.more}</span>
            <div className="home-intro-chips">
              {facts.apartments.map((a) => (
                <Link
                  key={a.slug}
                  // The i18n Link adds the locale prefix itself; localeHref would
                // add a second one and produce /cs/cs/pobocka/praha-2.
                href={`/pobocka/${a.slug}` as '/'}
                  className="home-intro-chip"
                >
                  {a.district && a.district !== a.name ? `${a.name} (${a.district})` : a.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
