interface QuickLinksProps {
  locale: string;
}

const LINKS: Array<{
  href: Record<string, string>;
  label: Record<string, string>;
  icon: string;
}> = [
  {
    href: { cs: '/cs/cenik', en: '/pricing', de: '/de/preise', uk: '/uk/tsiny' },
    label: { cs: 'Ceník programů', en: 'Pricing & Programs', de: 'Preise & Programme', uk: 'Ціни та програми' },
    icon: '💎',
  },
  {
    href: { cs: '/cs/rozvrh', en: '/schedule', de: '/de/zeitplan', uk: '/uk/rozklad' },
    label: { cs: 'Rozvrh dnes', en: 'Today\'s schedule', de: 'Zeitplan heute', uk: 'Розклад сьогодні' },
    icon: '📅',
  },
  {
    href: { cs: '/cs/faq', en: '/faq', de: '/de/faq', uk: '/uk/faq' },
    label: { cs: 'Časté dotazy', en: 'FAQ', de: 'Häufige Fragen', uk: 'Часті питання' },
    icon: '❓',
  },
  {
    href: { cs: '/cs/blog', en: '/blog', de: '/de/blog', uk: '/uk/blog' },
    label: { cs: 'Blog & novinky', en: 'Blog & News', de: 'Blog & Neuigkeiten', uk: 'Блог та новини' },
    icon: '📰',
  },
  {
    href: { cs: '/cs/recenze', en: '/reviews', de: '/de/rezensionen', uk: '/uk/vidhuky' },
    label: { cs: 'Recenze klientů', en: 'Client reviews', de: 'Kundenbewertungen', uk: 'Відгуки клієнтів' },
    icon: '⭐',
  },
  {
    href: { cs: '/cs/slevy', en: '/discounts', de: '/de/rabatte', uk: '/uk/znyzhky' },
    label: { cs: 'Akční slevy', en: 'Discounts', de: 'Rabatte', uk: 'Знижки' },
    icon: '🏷️',
  },
];

export default function QuickLinks({ locale }: QuickLinksProps) {
  const heading = locale === 'cs' ? 'Užitečné odkazy'
    : locale === 'de' ? 'Nützliche Links'
    : locale === 'uk' ? 'Корисні посилання'
    : 'Useful links';

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2 className="section-h2">{heading}</h2>
        </div>
        <div className="quick-links-grid">
          {LINKS.map((link) => (
            <a
              key={link.href.en}
              href={link.href[locale] ?? link.href.en}
              className="quick-link-card"
            >
              <span className="quick-link-icon">{link.icon}</span>
              <span className="quick-link-label">{link.label[locale] ?? link.label.en}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
