/**
 * Promo banner — Telegram booking coming soon with 200 CZK discount.
 * Displayed on homepage between Hero and content sections.
 * Clean text-only strip, no icons (emoji renders inconsistently on mobile).
 */

const TEXTS: Record<string, string> = {
  cs: 'Jiz brzy bude mozne delat rezervace pres Telegram se slevou 200 Kc!',
  en: 'Coming soon: Book via Telegram and get 200 CZK discount!',
  de: 'Bald verfugbar: Buchen Sie uber Telegram und erhalten Sie 200 CZK Rabatt!',
  uk: '\u041D\u0435\u0437\u0430\u0431\u0430\u0440\u043E\u043C: \u0431\u0440\u043E\u043D\u044E\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 Telegram \u0437\u0456 \u0437\u043D\u0438\u0436\u043A\u043E\u044E 200 CZK!',
};

export default function TelegramPromoBanner({ locale }: { locale: string }) {
  const text = TEXTS[locale] ?? TEXTS.cs;

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, rgba(242,125,141,0.10) 0%, rgba(167,139,250,0.08) 100%)',
        borderBottom: '1px solid rgba(242,125,141,0.15)',
        padding: '14px 16px',
        marginBottom: '8px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text)',
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </section>
  );
}
