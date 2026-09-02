import { Link } from '@/i18n/navigation';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: Record<string, FaqItem[]> = {
  en: [
    {
      q: 'How does a Prague escort booking work at LovelyGirls?',
      a: 'Choose a companion from the gallery, check the schedule to see who is working today, and contact us via WhatsApp, Telegram or phone. We confirm availability within minutes. You visit our private apartment in central Prague — no outcall.',
    },
    {
      q: 'Are the escort photos real and verified?',
      a: 'Yes. Every companion is verified in person by our team. The photos show the woman who opens the door — no surprises, no stock images.',
    },
    {
      q: 'How much does an escort in Prague cost?',
      a: 'Pricing is based on time, not services — programmes from 30 to 120 minutes, the same rate for every companion. Apartment and shower included. Full details on the pricing page. Cash on arrival, no hidden fees.',
    },
    {
      q: 'Where are the LovelyGirls apartments located?',
      a: 'We operate three private apartments in central Prague — Prague 1, Prague 2 and Prague 3. Exact addresses are shared after booking. All locations are discreet, clean and easily reachable by metro.',
    },
    {
      q: 'Is hiring an escort in Prague legal?',
      a: 'Yes. Hiring an adult companion is legal in the Czech Republic for clients aged 18 and over. LovelyGirls operates transparently with verified companions and registered premises.',
    },
    {
      q: 'Can I book a Prague escort for an outcall or hotel visit?',
      a: 'LovelyGirls works exclusively incall — you visit our apartment. This lets us guarantee privacy, safety and the quality of the experience for both you and the companion.',
    },
  ],
  cs: [
    {
      q: 'Jak funguje rezervace escort služby v Praze u LovelyGirls?',
      a: 'Vyberte si společnici z galerie, zkontrolujte rozvrh kdo dnes pracuje a kontaktujte nás přes WhatsApp, Telegram nebo telefon. Dostupnost potvrdíme během minut. Navštívíte náš privátní apartmán v centru Prahy — nepracujeme na výjezdy.',
    },
    {
      q: 'Jsou fotky společnic skutečné a ověřené?',
      a: 'Ano. Každou společnici ověřujeme osobně. Na fotkách je ta žena, která vám otevře dveře — žádná překvapení, žádné stock fotky.',
    },
    {
      q: 'Kolik stojí escort v Praze?',
      a: 'Ceny jsou za čas, ne za služby — programy od 30 do 120 minut, stejná sazba pro všechny společnice. Apartmán a sprcha v ceně. Kompletní přehled najdete v ceníku. Platba hotově na místě, bez příplatků.',
    },
    {
      q: 'Kde se nachází apartmány LovelyGirls?',
      a: 'Provozujeme tři privátní apartmány v centru Prahy — Praha 1, Praha 2 a Praha 3. Přesné adresy sdělujeme po rezervaci. Všechny lokace jsou diskrétní, čisté a snadno dostupné metrem.',
    },
    {
      q: 'Je escort v Praze legální?',
      a: 'Ano. Najmutí dospělé společnice je v České republice pro klienty od 18 let legální. LovelyGirls funguje transparentně s ověřenými společnicemi a registrovanými prostory.',
    },
    {
      q: 'Mohu si objednat společnici na hotel nebo výjezd?',
      a: 'LovelyGirls pracuje výhradně formou incall — navštívíte náš apartmán. Díky tomu garantujeme soukromí, bezpečnost a kvalitu zážitku pro vás i společnici.',
    },
  ],
  de: [
    {
      q: 'Wie funktioniert eine Escort-Buchung in Prag bei LovelyGirls?',
      a: 'Wählen Sie eine Begleiterin aus der Galerie, prüfen Sie im Zeitplan, wer heute arbeitet, und kontaktieren Sie uns per WhatsApp, Telegram oder Telefon. Wir bestätigen die Verfügbarkeit innerhalb von Minuten. Sie besuchen unser privates Apartment im Zentrum von Prag — kein Outcall.',
    },
    {
      q: 'Sind die Escort-Fotos echt und verifiziert?',
      a: 'Ja. Jede Begleiterin wird persönlich von unserem Team verifiziert. Die Fotos zeigen die Frau, die Ihnen die Tür öffnet — keine Überraschungen, keine Stockfotos.',
    },
    {
      q: 'Wie viel kostet eine Escort in Prag?',
      a: 'Die Preise basieren auf Zeit, nicht auf Leistungen — Programme von 30 bis 120 Minuten, der gleiche Tarif für alle Begleiterinnen. Apartment und Dusche inklusive. Alle Details auf der Preisseite. Barzahlung vor Ort, keine versteckten Gebühren.',
    },
    {
      q: 'Wo befinden sich die LovelyGirls-Apartments?',
      a: 'Wir betreiben drei private Apartments im Zentrum von Prag — Prag 1, Prag 2 und Prag 3. Genaue Adressen werden nach der Buchung mitgeteilt. Alle Standorte sind diskret, sauber und per Metro gut erreichbar.',
    },
    {
      q: 'Ist eine Escort in Prag legal?',
      a: 'Ja. Die Buchung einer erwachsenen Begleiterin ist in Tschechien für Kunden ab 18 Jahren legal. LovelyGirls arbeitet transparent mit verifizierten Begleiterinnen und registrierten Räumlichkeiten.',
    },
    {
      q: 'Kann ich eine Prager Escort für einen Outcall oder Hotelbesuch buchen?',
      a: 'LovelyGirls arbeitet ausschließlich Incall — Sie besuchen unser Apartment. So garantieren wir Privatsphäre, Sicherheit und Qualität für Sie und die Begleiterin.',
    },
  ],
  uk: [
    {
      q: 'Як працює бронювання ескорту в Празі у LovelyGirls?',
      a: 'Оберіть супутницю з галереї, перевірте розклад хто працює сьогодні та зверніться до нас через WhatsApp, Telegram або телефон. Підтвердження протягом кількох хвилин. Ви відвідуєте наш приватний апартамент у центрі Праги — без виїздів.',
    },
    {
      q: 'Фотографії супутниць справжні та перевірені?',
      a: 'Так. Кожну супутницю перевіряємо особисто. На фото — та жінка, яка відчинить вам двері. Жодних сюрпризів, жодних стокових фото.',
    },
    {
      q: 'Скільки коштує ескорт у Празі?',
      a: 'Ціни залежать від часу, а не від послуг — програми від 30 до 120 хвилин, однакова ціна для всіх супутниць. Апартаменти та душ включені. Деталі на сторінці цін. Оплата готівкою на місці, без прихованих платежів.',
    },
    {
      q: 'Де знаходяться апартаменти LovelyGirls?',
      a: 'Ми працюємо в трьох приватних апартаментах у центрі Праги — Прага 1, Прага 2 та Прага 3. Точні адреси повідомляємо після бронювання. Всі локації дискретні, чисті та легко доступні метро.',
    },
    {
      q: 'Чи легальний ескорт у Празі?',
      a: 'Так. Замовлення дорослої супутниці у Чехії легальне для клієнтів від 18 років. LovelyGirls працює прозоро з перевіреними супутницями та зареєстрованими приміщеннями.',
    },
    {
      q: 'Чи можу я замовити супутницю в готель або на виїзд?',
      a: 'LovelyGirls працює виключно incall — ви відвідуєте наш апартамент. Це гарантує приватність, безпеку та якість досвіду для вас і супутниці.',
    },
  ],
};

const HEADINGS: Record<string, string> = {
  en: 'Frequently Asked Questions',
  cs: 'Časté dotazy',
  de: 'Häufig gestellte Fragen',
  uk: 'Часті питання',
};

export default function HomeFaq({ locale }: { locale: string }) {
  const items = FAQ[locale] ?? FAQ.en;
  const heading = HEADINGS[locale] ?? HEADINGS.en;

  return (
    <section className="home-faq">
      <div className="container home-faq-inner">
        <h2>{heading}</h2>
        <div className="home-faq-list">
          {items.map((item, i) => (
            <details key={i} className="faq-item">
              <summary>{item.q}</summary>
              <div className="faq-item-body">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
        <p className="home-faq-more">
          <Link href="/faq">
            {locale === 'cs' ? 'Všechny dotazy →' : locale === 'de' ? 'Alle Fragen →' : locale === 'uk' ? 'Усі питання →' : 'All questions →'}
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Returns plain Q&A array for JSON-LD injection on the homepage. */
export function getHomeFaqItems(locale: string): { q: string; a: string }[] {
  return FAQ[locale] ?? FAQ.en;
}
