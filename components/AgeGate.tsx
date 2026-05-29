import { cookies, headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { setAgeVerified } from '@/lib/age-gate-actions';

const BOT_PATTERNS = [
  'googlebot',
  'bingbot',
  'seznambot',
  'gptbot',
  'claudebot',
  'perplexitybot',
  'oai-searchbot',
  'google-extended',
  'applebot',
  'bytespider',
  'amazonbot',
  'yandexbot',
  'duckduckbot',
];

const T: Record<string, {
  title: string;
  p1: string;
  p2: string;
  cookies: string;
  privacyLink: string;
  termsLink: string;
  enter: string;
  leave: string;
}> = {
  cs: {
    title: 'Potvrzení věku a cookies',
    p1: 'Tento web obsahuje obsah určený výhradně pro dospělé osoby starší 18 let.',
    p2: 'Vstupem potvrzujete, že je vám 18+ a souhlasíte s podmínkami užití a používáním nezbytných cookies pro správné fungování webu.',
    cookies: 'Používáme pouze nezbytné cookies (uložení souhlasu, jazyk, session). Žádné marketingové ani analytické cookies třetích stran.',
    privacyLink: 'Zásady soukromí',
    termsLink: 'Podmínky',
    enter: 'Je mi 18+ — Souhlasím a vstoupit',
    leave: 'Odejít',
  },
  en: {
    title: 'Age verification & cookies',
    p1: 'This website contains content intended for adults aged 18 and over.',
    p2: 'By entering you confirm that you are 18+ and agree to the terms of use and to the necessary cookies required for the site to function.',
    cookies: 'We use only essential cookies (consent storage, language, session). No third-party marketing or analytics cookies.',
    privacyLink: 'Privacy policy',
    termsLink: 'Terms',
    enter: 'I am 18+ — Agree & Enter',
    leave: 'Leave',
  },
  de: {
    title: 'Altersbestätigung & Cookies',
    p1: 'Diese Website enthält Inhalte für Erwachsene ab 18 Jahren.',
    p2: 'Mit dem Eintritt bestätigen Sie, dass Sie 18+ sind und stimmen den Nutzungsbedingungen sowie der Verwendung notwendiger Cookies zu, die für den Betrieb der Website erforderlich sind.',
    cookies: 'Wir verwenden nur notwendige Cookies (Einwilligungs-Speicherung, Sprache, Session). Keine Drittanbieter-Marketing- oder Analyse-Cookies.',
    privacyLink: 'Datenschutz',
    termsLink: 'AGB',
    enter: 'Ich bin 18+ — Zustimmen & Eintreten',
    leave: 'Verlassen',
  },
  uk: {
    title: 'Підтвердження віку та cookies',
    p1: 'Цей сайт містить матеріали виключно для дорослих 18+.',
    p2: 'Натискаючи «Увійти», ви підтверджуєте, що вам 18+, погоджуєтеся з умовами користування та з використанням необхідних cookies для роботи сайту.',
    cookies: 'Ми використовуємо лише необхідні cookies (збереження згоди, мова, сесія). Без сторонніх маркетингових та аналітичних cookies.',
    privacyLink: 'Конфіденційність',
    termsLink: 'Умови',
    enter: 'Мені 18+ — Згода і увійти',
    leave: 'Вийти',
  },
};

const LOCALE_PREFIX: Record<string, string> = { cs: '/cs', en: '', de: '/de', uk: '/uk' };
const PRIVACY_PATH: Record<string, string> = {
  cs: '/soukromi', en: '/privacy', de: '/datenschutz', uk: '/konfidentsiinist',
};
const TERMS_PATH: Record<string, string> = {
  cs: '/podminky', en: '/terms', de: '/agb', uk: '/umovy',
};

export default async function AgeGate() {
  const cookieStore = await cookies();
  if (cookieStore.get('age_verified')?.value === '1') return null;

  const hdrs = await headers();
  const ua = (hdrs.get('user-agent') ?? '').toLowerCase();
  if (BOT_PATTERNS.some((p) => ua.includes(p))) return null;

  const locale = await getLocale();
  const L = T[locale] ?? T.en;
  const prefix = LOCALE_PREFIX[locale] ?? '';
  const privacyHref = `${prefix}${PRIVACY_PATH[locale] ?? PRIVACY_PATH.en}`;
  const termsHref = `${prefix}${TERMS_PATH[locale] ?? TERMS_PATH.en}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: 'html, body { overflow: hidden !important; height: 100vh !important; }' }} />
      <div className="age-gate-overlay">
        <div className="age-gate-modal">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>18+</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '12px' }}>
            {L.title}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '8px' }}>
            {L.p1}
          </p>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            {L.p2}
          </p>
          <div className="age-gate-cookies-note">
            🍪 {L.cookies}
          </div>
          <div className="age-gate-legal-links">
            <a href={privacyHref} target="_blank" rel="noopener noreferrer">{L.privacyLink}</a>
            <span>·</span>
            <a href={termsHref} target="_blank" rel="noopener noreferrer">{L.termsLink}</a>
          </div>
          <div className="age-gate-buttons">
            <form action={setAgeVerified}>
              <button type="submit" className="btn btn-pink age-gate-confirm">
                {L.enter}
              </button>
            </form>
            <a href="https://www.google.com" className="age-gate-leave">
              {L.leave}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
