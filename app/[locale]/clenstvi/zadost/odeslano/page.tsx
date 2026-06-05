import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';

interface MetaBundle { title: string }
const META: Record<string, MetaBundle> = {
  cs: { title: 'Žádost odeslána — LovelyGirls Praha' },
  en: { title: 'Application submitted — LovelyGirls Prague' },
  de: { title: 'Anfrage gesendet — LovelyGirls Prag' },
  uk: { title: 'Заявку надіслано — LovelyGirls Прага' },
};

interface PageBundle { h1: string; body1: string; body2: string; back: string }
const T: Record<string, PageBundle> = {
  cs: {
    h1: 'Žádost odeslána',
    body1: 'Děkujeme za Vaši žádost o VIP členství.',
    body2: 'Žádost prověříme a budeme Vás kontaktovat do 48 hodin na zadaný e-mail.',
    back: 'Zpět na hlavní stránku',
  },
  en: {
    h1: 'Application submitted',
    body1: 'Thank you for your VIP membership application.',
    body2: 'We will review it and contact you within 48 hours at the e-mail you provided.',
    back: 'Back to homepage',
  },
  de: {
    h1: 'Anfrage gesendet',
    body1: 'Vielen Dank für Ihre VIP-Mitgliedschaftsanfrage.',
    body2: 'Wir prüfen Ihre Anfrage und melden uns innerhalb von 48 Stunden unter der angegebenen E-Mail.',
    back: 'Zur Startseite',
  },
  uk: {
    h1: 'Заявку надіслано',
    body1: 'Дякуємо за вашу заявку на VIP членство.',
    body2: 'Ми розглянемо її та зв\'яжемося з вами протягом 48 годин на вказану електронну пошту.',
    back: 'На головну сторінку',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const M = META[locale] ?? META.en;
  return applyDBOverride(`/${locale}/clenstvi/zadost/odeslano`, { title: M.title, robots: { index: false, follow: false } });

}

export default async function ClenstviOdeslanoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const L = T[locale] ?? T.en;

  return (
    <main>
      <div className="container" style={{ textAlign: 'center', padding: '80px 24px', maxWidth: '560px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-coral), var(--color-magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
          ✓
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '16px' }}>
          {L.h1}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '8px', fontSize: '15px' }}>
          {L.body1}
        </p>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '36px', fontSize: '15px' }}>
          {L.body2}
        </p>
        <a href={`/${locale}`} className="btn btn-pink">
          {L.back}
        </a>
      </div>
    </main>
  );
}
