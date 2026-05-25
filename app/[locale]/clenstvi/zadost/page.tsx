import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { submitMemberApplication } from './actions';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface MetaBundle { title: string; description: string }
const META: Record<string, MetaBundle> = {
  cs: { title: 'VIP členství — žádost o přijetí', description: 'Požádejte o VIP členství v LovelyGirls Praha. Exkluzivní výhody pro naše členy.' },
  en: { title: 'VIP membership — application', description: 'Apply for VIP membership at LovelyGirls Prague. Exclusive benefits for our members.' },
  de: { title: 'VIP-Mitgliedschaft — Bewerbung', description: 'Bewerben Sie sich für die VIP-Mitgliedschaft bei LovelyGirls Prag. Exklusive Vorteile für unsere Mitglieder.' },
  uk: { title: 'VIP членство — заявка', description: 'Подайте заявку на VIP членство в LovelyGirls Прага. Ексклюзивні переваги для наших членів.' },
};

interface PageBundle {
  bcMembership: string;
  bcApply: string;
  badge: string;
  h1: string;
  intro: string;
  emailError: string;
  emailLabel: string;
  emailPh: string;
  nameLabel: string;
  namePh: string;
  phoneLabel: string;
  reasonLabel: string;
  reasonPh: string;
  submit: string;
  note: string;
}

const T: Record<string, PageBundle> = {
  cs: {
    bcMembership: 'VIP členství',
    bcApply: 'Žádost',
    badge: 'VIP členství',
    h1: 'Žádost o VIP přístup',
    intro: 'Vyplňte žádost o členství. Po schválení získáte přístup k exkluzivním profilům, soukromým galeriím a věrnostnímu programu se slevami.',
    emailError: 'Zadejte prosím platnou e-mailovou adresu.',
    emailLabel: 'E-mail *',
    emailPh: 'vas@email.cz',
    nameLabel: 'Jméno nebo přezdívka',
    namePh: 'Jak Vás máme oslovovat',
    phoneLabel: 'Telefon',
    reasonLabel: 'Proč máte zájem o členství? (volitelné)',
    reasonPh: 'Stručně napište, co Vás na VIP přístupu zajímá…',
    submit: 'Odeslat žádost',
    note: 'Váš e-mail použijeme výhradně pro komunikaci ohledně Vaší žádosti. Vyřízení do 48 hodin.',
  },
  en: {
    bcMembership: 'VIP membership',
    bcApply: 'Apply',
    badge: 'VIP membership',
    h1: 'Apply for VIP access',
    intro: 'Submit your membership application. Once approved, you will gain access to exclusive profiles, private galleries and our loyalty program with discounts.',
    emailError: 'Please enter a valid e-mail address.',
    emailLabel: 'E-mail *',
    emailPh: 'you@email.com',
    nameLabel: 'Name or nickname',
    namePh: 'How should we address you',
    phoneLabel: 'Phone',
    reasonLabel: 'Why do you want to join? (optional)',
    reasonPh: 'Briefly tell us what interests you about VIP access…',
    submit: 'Submit application',
    note: 'We use your e-mail solely to respond to your application. Reviewed within 48 hours.',
  },
  de: {
    bcMembership: 'VIP-Mitgliedschaft',
    bcApply: 'Bewerbung',
    badge: 'VIP-Mitgliedschaft',
    h1: 'VIP-Zugang beantragen',
    intro: 'Reichen Sie Ihre Mitgliedschaftsanfrage ein. Nach der Bestätigung erhalten Sie Zugang zu exklusiven Profilen, privaten Galerien und unserem Treueprogramm mit Rabatten.',
    emailError: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    emailLabel: 'E-Mail *',
    emailPh: 'sie@email.com',
    nameLabel: 'Name oder Nickname',
    namePh: 'Wie sollen wir Sie ansprechen',
    phoneLabel: 'Telefon',
    reasonLabel: 'Warum möchten Sie Mitglied werden? (optional)',
    reasonPh: 'Schildern Sie kurz, was Sie am VIP-Zugang interessiert…',
    submit: 'Anfrage senden',
    note: 'Ihre E-Mail-Adresse nutzen wir ausschließlich für die Bearbeitung Ihrer Anfrage. Bearbeitungszeit: 48 Stunden.',
  },
  uk: {
    bcMembership: 'VIP членство',
    bcApply: 'Заявка',
    badge: 'VIP членство',
    h1: 'Заявка на VIP доступ',
    intro: 'Заповніть заявку на членство. Після підтвердження ви отримаєте доступ до ексклюзивних профілів, приватних галерей і програми лояльності зі знижками.',
    emailError: 'Будь ласка, вкажіть дійсну електронну адресу.',
    emailLabel: 'E-mail *',
    emailPh: 'vy@email.com',
    nameLabel: 'Ім\'я або псевдонім',
    namePh: 'Як до вас звертатися',
    phoneLabel: 'Телефон',
    reasonLabel: 'Чому ви хочете стати членом? (необов\'язково)',
    reasonPh: 'Коротко напишіть, що вас цікавить у VIP доступі…',
    submit: 'Надіслати заявку',
    note: 'Ваш e-mail використовуємо лише для відповіді на заявку. Обробка протягом 48 годин.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const M = META[locale] ?? META.en;
  return { title: M.title, description: M.description };
}

export default async function ClenstviZadostPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const L = T[locale] ?? T.en;
  const hasError = sp.error === 'validation';

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: L.bcMembership, href: `/${locale}/clenstvi/zadost` },
          { label: L.bcApply },
        ]}
        locale={locale}
      />
      <div className="container" style={{ maxWidth: '640px', padding: '60px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, var(--color-coral), var(--color-magenta))', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {L.badge}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1.2, marginBottom: '12px' }}>
            {L.h1}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '15px' }}>
            {L.intro}
          </p>
        </div>

        {hasError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: 'var(--color-red)', fontSize: '13px' }}>
            {L.emailError}
          </div>
        )}

        <form action={submitMemberApplication} className="application-form">
          <div className="form-group">
            <label htmlFor="email">{L.emailLabel}</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={L.emailPh}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">{L.nameLabel}</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder={L.namePh}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{L.phoneLabel}</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+420 xxx xxx xxx"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason">{L.reasonLabel}</label>
            <textarea
              id="reason"
              name="reason"
              rows={4}
              placeholder={L.reasonPh}
            />
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-pink" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
              {L.submit}
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '16px', lineHeight: 1.6 }}>
            {L.note}
          </p>
        </form>
      </div>
    </main>
  );
}
