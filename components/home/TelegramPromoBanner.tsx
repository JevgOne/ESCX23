/**
 * Promo banner — Telegram booking coming soon with 200 CZK discount.
 * Uses Telegram blue to stand out from the site's coral/dark palette.
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
        background: 'rgba(34,158,217,0.08)',
        border: '1px solid rgba(34,158,217,0.3)',
        padding: '14px 20px',
        margin: '8px 20px 40px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.57 7.4c-.12.54-.43.67-.87.42l-2.4-1.77-1.16 1.12c-.13.13-.24.24-.49.24l.17-2.44 4.44-4.01c.19-.17-.04-.27-.3-.1l-5.5 3.46-2.37-.74c-.51-.16-.52-.51.11-.76l9.26-3.57c.43-.16.8.1.66.75z" fill="#229ED9"/>
      </svg>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </section>
  );
}
