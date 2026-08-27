import { Link } from '@/i18n/navigation';
import { localeHref } from '@/lib/seo/meta';
import { getSiteFacts, districtList } from '@/lib/site-facts';
import { verifiedCompanions } from '@/lib/plural';

/**
 * A block of prose under the hero.
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
      h2: 'Escort in Prague, in our own apartments',
      more: 'Where you will meet',
      body: (
        <>
          <p>
            LovelyGirls is a Prague escort agency with {companions} and three private
            apartments of its own in the centre of the city. Every profile is verified in
            person: the photographs are of the woman who opens the door, and the services
            listed on her page are the services she offers. Nothing is negotiated on the
            doorstep.
          </p>
          <p>
            We work incall only — you come to us, never the other way round. The apartments
            are in {districts}, each with a private entrance, its own bathroom and a street
            where nobody pays attention to who comes or goes. Which companions are working
            today, and in which apartment, is on the{' '}
            <Link href="/rozvrh">schedule</Link>, updated every morning.
          </p>
          <p>
            Prices depend on time, not on services: programmes run from 30 to 120 minutes
            and are the same for every companion, with the apartment and a shower included.
            The full list is on the <Link href="/cenik">pricing page</Link>, and the{' '}
            <Link href="/faq">FAQ</Link> answers what people usually ask before booking.
            Cash on arrival, no card, no hidden fees.
          </p>
        </>
      ),
    },
    cs: {
      h2: 'Escort v Praze, ve vlastních apartmánech',
      more: 'Kde se potkáme',
      body: (
        <>
          <p>
            LovelyGirls je pražská escort agentura — {companions} a tři vlastní privátní
            apartmány v centru. Každý profil ověřujeme osobně: na fotkách je ta žena, která
            vám otevře, a služby v profilu jsou služby, které skutečně nabízí. Na místě se
            nic nedomlouvá.
          </p>
          <p>
            Pracujeme výhradně formou incall — přijedete k nám, nikdy naopak. Apartmány jsou
            v {districts}, každý s vlastním vchodem, koupelnou a v ulici, kde nikdo neřeší,
            kdo přichází a odchází. Kdo dnes pracuje a ve kterém apartmánu, najdete v{' '}
            <Link href="/rozvrh">rozvrhu</Link>, který aktualizujeme každé ráno.
          </p>
          <p>
            Platí se za čas, ne za služby: programy od 30 do 120 minut, jednotné pro všechny
            společnice, v ceně apartmán i sprcha. Kompletní přehled je v{' '}
            <Link href="/cenik">ceníku</Link> a na časté dotazy odpovídáme ve{' '}
            <Link href="/faq">FAQ</Link>. Hotově na místě, bez karet a bez příplatků.
          </p>
        </>
      ),
    },
    de: {
      h2: 'Escort in Prag, in eigenen Apartments',
      more: 'Wo wir uns treffen',
      body: (
        <>
          <p>
            LovelyGirls ist eine Prager Escort-Agentur mit {companions} und drei eigenen
            privaten Apartments im Zentrum. Jedes Profil wird persönlich verifiziert: Auf den
            Fotos ist die Frau, die Ihnen die Tür öffnet, und die aufgeführten Leistungen sind
            die, die sie anbietet. An der Tür wird nichts verhandelt.
          </p>
          <p>
            Wir arbeiten ausschließlich als Incall — Sie kommen zu uns, nie umgekehrt. Die
            Apartments liegen in {districts}, jedes mit eigenem Eingang und eigenem Bad. Wer
            heute arbeitet und in welchem Apartment, steht im{' '}
            <Link href="/rozvrh">Zeitplan</Link>, täglich aktualisiert.
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
      h2: 'Ескорт у Празі, у власних апартаментах',
      more: 'Де ми зустрінемось',
      body: (
        <>
          <p>
            LovelyGirls — празьке ескорт-агентство: {companions} і три власні приватні
            апартаменти в центрі. Кожен профіль перевіряємо особисто: на фото та жінка, яка
            відчинить вам двері, а послуги в профілі — ті, які вона справді пропонує. На
            місці нічого не узгоджується.
          </p>
          <p>
            Працюємо виключно як incall — ви приїжджаєте до нас, ніколи навпаки. Апартаменти
            розташовані в {districts}, кожні з власним входом і ванною кімнатою. Хто працює
            сьогодні й у яких апартаментах — у <Link href="/rozvrh">графіку</Link>, який
            оновлюємо щоранку.
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
      <div className="container">
        <h2>{c.h2}</h2>
        {c.body}
        {facts.apartments.length > 0 && (
          <p className="home-intro-links">
            <span className="home-intro-links-label">{c.more}:</span>
            {facts.apartments.map((a) => (
              <Link
                key={a.slug}
                href={localeHref(locale, `/pobocka/${a.slug}`) as '/'}
                className="home-intro-chip"
              >
                {a.district && a.district !== a.name ? `${a.name} (${a.district})` : a.name}
              </Link>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
