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
  enter: string;
  leave: string;
}> = {
  cs: {
    title: 'Potvrzení věku',
    p1: 'Tento web obsahuje obsah určený výhradně pro dospělé osoby starší 18 let.',
    p2: 'Vstupem potvrzujete, že jste dovršili věk 18 let a souhlasíte s podmínkami užití.',
    enter: 'Je mi 18+ — Vstoupit',
    leave: 'Odejít',
  },
  en: {
    title: 'Age verification',
    p1: 'This website contains content intended for adults aged 18 and over.',
    p2: 'By entering you confirm that you are 18+ and agree to the terms of use.',
    enter: 'I am 18+ — Enter',
    leave: 'Leave',
  },
  de: {
    title: 'Altersbestätigung',
    p1: 'Diese Website enthält Inhalte für Erwachsene ab 18 Jahren.',
    p2: 'Mit dem Eintritt bestätigen Sie, dass Sie 18+ sind und den Nutzungsbedingungen zustimmen.',
    enter: 'Ich bin 18+ — Eintreten',
    leave: 'Verlassen',
  },
  uk: {
    title: 'Підтвердження віку',
    p1: 'Цей сайт містить матеріали виключно для дорослих 18+.',
    p2: 'Натискаючи «Увійти», ви підтверджуєте, що вам виповнилось 18 років і погоджуєтесь з умовами користування.',
    enter: 'Мені 18+ — Увійти',
    leave: 'Вийти',
  },
};

export default async function AgeGate() {
  const cookieStore = await cookies();
  if (cookieStore.get('age_verified')?.value === '1') return null;

  const hdrs = await headers();
  const ua = (hdrs.get('user-agent') ?? '').toLowerCase();
  if (BOT_PATTERNS.some((p) => ua.includes(p))) return null;

  const locale = await getLocale();
  const L = T[locale] ?? T.en;

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
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '28px', fontSize: '13px' }}>
            {L.p2}
          </p>
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
