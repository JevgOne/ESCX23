import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { submitApplication } from './actions';
import { getBasicServices, getExtraServices } from '@/lib/services';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; sent?: string; lang?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'join' });
  return applyDBOverride(`/${locale}/join`, { title: t('h1'), robots: { index: false, follow: false } });
}

export default async function JoinPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  // CS is the default — only show EN when explicitly opted in via ?lang=en.
  // Any other locale (de, uk) falls back to CS.
  if (locale === 'en' && sp.lang !== 'en') {
    redirect('/cs/join');
  }
  if (locale !== 'cs' && locale !== 'en') {
    redirect('/cs/join');
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'join' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const hasError = sp.error === 'validation';
  const isSent = sp.sent === '1';

  const PH: Record<string, {
    nameErr: string;
    yourName: string;
    selectPrompt: string;
    no: string;
    yes: string;
    tattooDescPh: string;
    bioCsPh: string;
    bioEnPh: string;
    availPh: string;
    hairBlond: string;
    hairBrunette: string;
    hairBlack: string;
    hairRed: string;
    hairGrey: string;
    eyesBlue: string;
    eyesBrown: string;
    eyesGreen: string;
    eyesGrey: string;
    eyesHazel: string;
  }> = {
    cs: {
      nameErr: 'Zkontrolujte prosím povinná pole (jméno, telefon, věk 18+).',
      yourName: 'Vaše jméno',
      selectPrompt: '— vyberte —',
      no: 'Ne',
      yes: 'Ano',
      tattooDescPh: 'Popis tetování (volitelné)',
      bioCsPh: 'Napište něco o sobě česky…',
      bioEnPh: 'Write something about yourself in English…',
      availPh: 'Po–Pá 10:00–22:00, víkendy po domluvě…',
      hairBlond: 'Blond', hairBrunette: 'Hnědé', hairBlack: 'Černé', hairRed: 'Zrzavé', hairGrey: 'Šedé',
      eyesBlue: 'Modré', eyesBrown: 'Hnědé', eyesGreen: 'Zelené', eyesGrey: 'Šedé', eyesHazel: 'Oříškové',
    },
    en: {
      nameErr: 'Please complete the required fields (name, phone, age 18+).',
      yourName: 'Your name',
      selectPrompt: '— select —',
      no: 'No',
      yes: 'Yes',
      tattooDescPh: 'Tattoo description (optional)',
      bioCsPh: 'Write something about yourself in Czech…',
      bioEnPh: 'Write something about yourself in English…',
      availPh: 'Mon–Fri 10:00–22:00, weekends on request…',
      hairBlond: 'Blonde', hairBrunette: 'Brunette', hairBlack: 'Black', hairRed: 'Red', hairGrey: 'Grey',
      eyesBlue: 'Blue', eyesBrown: 'Brown', eyesGreen: 'Green', eyesGrey: 'Grey', eyesHazel: 'Hazel',
    },
    de: {
      nameErr: 'Bitte füllen Sie die Pflichtfelder aus (Name, Telefon, Alter 18+).',
      yourName: 'Ihr Name',
      selectPrompt: '— wählen —',
      no: 'Nein',
      yes: 'Ja',
      tattooDescPh: 'Beschreibung des Tattoos (optional)',
      bioCsPh: 'Schreiben Sie etwas über sich auf Tschechisch…',
      bioEnPh: 'Schreiben Sie etwas über sich auf Englisch…',
      availPh: 'Mo–Fr 10:00–22:00, Wochenenden nach Absprache…',
      hairBlond: 'Blond', hairBrunette: 'Brünett', hairBlack: 'Schwarz', hairRed: 'Rot', hairGrey: 'Grau',
      eyesBlue: 'Blau', eyesBrown: 'Braun', eyesGreen: 'Grün', eyesGrey: 'Grau', eyesHazel: 'Haselnuss',
    },
    uk: {
      nameErr: 'Будь ласка, заповніть обов\'язкові поля (ім\'я, телефон, вік 18+).',
      yourName: 'Ваше ім\'я',
      selectPrompt: '— оберіть —',
      no: 'Ні',
      yes: 'Так',
      tattooDescPh: 'Опис татуювання (необов\'язково)',
      bioCsPh: 'Напишіть про себе чеською…',
      bioEnPh: 'Напишіть про себе англійською…',
      availPh: 'Пн–Пт 10:00–22:00, вихідні за домовленістю…',
      hairBlond: 'Світле', hairBrunette: 'Каштанове', hairBlack: 'Чорне', hairRed: 'Руде', hairGrey: 'Сиве',
      eyesBlue: 'Блакитні', eyesBrown: 'Карі', eyesGreen: 'Зелені', eyesGrey: 'Сірі', eyesHazel: 'Горіхові',
    },
  };
  const PL = PH[locale] ?? PH.en;

  if (isSent) {
    return (
      <main>
        <style dangerouslySetInnerHTML={{ __html: `
          .join-success { position: relative; text-align: center; padding: 80px 24px; overflow: hidden; }
          .join-success-icon { font-size: 72px; margin-bottom: 24px; animation: join-pop 0.5s ease; }
          @keyframes join-pop { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }
          .join-confetti { position: absolute; top: 0; left: 0; right: 0; height: 100%; pointer-events: none; overflow: hidden; }
          .join-confetti i {
            position: absolute; display: block; width: 8px; height: 8px; border-radius: 2px;
            animation: join-fall linear forwards;
          }
          @keyframes join-fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
          }
        `}} />
        <div className="container join-success">
          <div className="join-confetti" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => {
              const colors = ['#f27d8d', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899'];
              const color = colors[i % colors.length];
              const left = `${5 + (i * 3.1) % 90}%`;
              const delay = `${(i * 0.12) % 2}s`;
              const duration = `${1.5 + (i % 5) * 0.3}s`;
              const size = `${6 + (i % 4) * 2}px`;
              return (
                <i
                  key={i}
                  style={{
                    left, background: color,
                    width: size, height: size,
                    animationDelay: delay,
                    animationDuration: duration,
                  }}
                />
              );
            })}
          </div>
          <div className="join-success-icon">🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '16px' }}>
            {t('success.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '16px' }}>
            {t('success.body')}
          </p>
          <a href="/" className="btn btn-pink">{tCommon('back_home')}</a>
        </div>
      </main>
    );
  }

  const LANGS: Array<{ code: 'cs'|'en'; label: string; flag: string }> = [
    { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <main>
      <Breadcrumbs items={[{ label: tNav('join') }]} locale={locale} />
      <PageHeader title={t('h1')} subtitle={t('sub')} />
      <div className="container">
        <div className="join-lang-picker">
          <span className="join-lang-picker-label">{t('lang_picker_label')}:</span>
          <div className="join-lang-picker-buttons">
            {LANGS.map((l) => {
              const isActive = l.code === locale && (l.code !== 'en' || sp.lang === 'en');
              const href = l.code === 'en' ? '/join?lang=en' : '/cs/join';
              return (
                <a
                  key={l.code}
                  href={href}
                  className={`join-lang-btn${isActive ? ' is-active' : ''}`}
                  hrefLang={l.code}
                >
                  <span aria-hidden="true">{l.flag}</span>
                  <span>{l.label}</span>
                </a>
              );
            })}
          </div>
        </div>
        {hasError && (
          <div className="apply-form-error">
            {PL.nameErr}
          </div>
        )}
        <form action={submitApplication} className="apply-form">
          <input type="hidden" name="locale" value={locale} />

          <fieldset className="apply-form-section">
            <legend>{t('section.personal')}</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">{t('field.name')} *</label>
                <input id="name" name="name" type="text" required placeholder={PL.yourName} />
              </div>
              <div className="form-group">
                <label htmlFor="age">{t('field.age')} *</label>
                <input id="age" name="age" type="number" min="18" max="70" required placeholder="18" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nationality">{t('field.nationality')}</label>
                <select id="nationality" name="nationality">
                  <option value="">{PL.selectPrompt}</option>
                  <option value="Česká">{locale === 'cs' ? '🇨🇿 Česká' : '🇨🇿 Czech'}</option>
                  <option value="Slovenská">{locale === 'cs' ? '🇸🇰 Slovenská' : '🇸🇰 Slovak'}</option>
                  <option value="Ukrajinská">{locale === 'cs' ? '🇺🇦 Ukrajinská' : '🇺🇦 Ukrainian'}</option>
                  <option value="Ruská">{locale === 'cs' ? '🇷🇺 Ruská' : '🇷🇺 Russian'}</option>
                  <option value="Polská">{locale === 'cs' ? '🇵🇱 Polská' : '🇵🇱 Polish'}</option>
                  <option value="Rumunská">{locale === 'cs' ? '🇷🇴 Rumunská' : '🇷🇴 Romanian'}</option>
                  <option value="Maďarská">{locale === 'cs' ? '🇭🇺 Maďarská' : '🇭🇺 Hungarian'}</option>
                  <option value="Kolumbijská">{locale === 'cs' ? '🇨🇴 Kolumbijská' : '🇨🇴 Colombian'}</option>
                  <option value="Brazilská">{locale === 'cs' ? '🇧🇷 Brazilská' : '🇧🇷 Brazilian'}</option>
                  <option value="Jiná">{locale === 'cs' ? 'Jiná' : 'Other'}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="height">{t('field.height')}</label>
                <input id="height" name="height" type="number" min="140" max="200" placeholder="165" />
              </div>
              <div className="form-group">
                <label htmlFor="weight">{t('field.weight')}</label>
                <input id="weight" name="weight" type="number" min="40" max="120" placeholder="55" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bust">{t('field.bust')}</label>
                <input id="bust" name="bust" type="number" min="1" max="6" placeholder="2" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bust_natural">{t('field.bust_natural')}</label>
                <select id="bust_natural" name="bust_natural" defaultValue="">
                  <option value="">{PL.selectPrompt}</option>
                  <option value="1">{t('field.bust_natural_yes')}</option>
                  <option value="0">{t('field.bust_natural_no')}</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="apply-form-section">
            <legend>{t('section.appearance')}</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hair">{t('field.hair')}</label>
                <select id="hair" name="hair">
                  <option value="">{PL.selectPrompt}</option>
                  <option value="Blond">{PL.hairBlond}</option>
                  <option value="Hnědé">{PL.hairBrunette}</option>
                  <option value="Černé">{PL.hairBlack}</option>
                  <option value="Zrzavé">{PL.hairRed}</option>
                  <option value="Šedé">{PL.hairGrey}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="eyes">{t('field.eyes')}</label>
                <select id="eyes" name="eyes">
                  <option value="">{PL.selectPrompt}</option>
                  <option value="Modré">{PL.eyesBlue}</option>
                  <option value="Hnědé">{PL.eyesBrown}</option>
                  <option value="Zelené">{PL.eyesGreen}</option>
                  <option value="Šedé">{PL.eyesGrey}</option>
                  <option value="Lískové">{PL.eyesHazel}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tattoo_percentage">{locale === 'cs' ? 'Tetování (% pokrytí těla)' : 'Tattoo (% body coverage)'}</label>
                <select id="tattoo_percentage" name="tattoo_percentage">
                  <option value="0">{locale === 'cs' ? 'Žádné' : 'None'}</option>
                  <option value="5">{locale === 'cs' ? 'Diskrétní (~5%)' : 'Discreet (~5%)'}</option>
                  <option value="15">{locale === 'cs' ? 'Malé (10–20%)' : 'Small (10–20%)'}</option>
                  <option value="30">{locale === 'cs' ? 'Střední (20–40%)' : 'Medium (20–40%)'}</option>
                  <option value="50">{locale === 'cs' ? 'Výrazné (40–60%)' : 'Significant (40–60%)'}</option>
                  <option value="80">{locale === 'cs' ? 'Rozsáhlé (60%+)' : 'Extensive (60%+)'}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="piercing">{t('field.piercing')}</label>
                <select id="piercing" name="piercing">
                  <option value="0">{PL.no}</option>
                  <option value="1">{PL.yes}</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="apply-form-section">
            <legend>{t('section.contact')}</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">{t('field.phone')} *</label>
                <input id="phone" name="phone" type="tel" required placeholder="+420 xxx xxx xxx" />
              </div>
              <div className="form-group">
                <label htmlFor="email">{t('field.email')}</label>
                <input id="email" name="email" type="email" placeholder="vas@email.cz" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="telegram">{t('field.telegram')}</label>
              <input id="telegram" name="telegram" type="text" placeholder="@vasnikname" />
            </div>
          </fieldset>

          <fieldset className="apply-form-section">
            <legend>{t('section.bio')}</legend>
            <div className="form-group">
              <label htmlFor="bio_cs">{t('field.bio_cs')}</label>
              <textarea id="bio_cs" name="bio_cs" rows={5} placeholder={PL.bioCsPh} />
            </div>
            <div className="form-group">
              <label htmlFor="bio_en">{t('field.bio_en')}</label>
              <textarea id="bio_en" name="bio_en" rows={5} placeholder={PL.bioEnPh} />
            </div>
          </fieldset>

          <fieldset className="apply-form-section">
            <legend>{locale === 'cs' ? 'Styl & Šatník' : 'Style & Wardrobe'}</legend>
            <div className="form-group">
              <div className="jn-svc-label">{locale === 'cs' ? 'Váš běžný styl oblékání' : 'Your everyday style'}</div>
              <p className="jn-svc-hint">{locale === 'cs' ? 'Jak se běžně oblékáte? Zaškrtněte vše co vás vystihuje' : 'How do you normally dress? Check all that apply'}</p>
              <div className="jn-svc-grid">
                {([
                  { id: 'elegant', cs: 'Elegantní', en: 'Elegant' },
                  { id: 'casual', cs: 'Casual / ležérní', en: 'Casual' },
                  { id: 'sporty', cs: 'Sportovní', en: 'Sporty' },
                  { id: 'glamour', cs: 'Glamour / okázalý', en: 'Glamour' },
                  { id: 'minimalist', cs: 'Minimalistický', en: 'Minimalist' },
                  { id: 'romantic', cs: 'Romantický / ženský', en: 'Romantic / feminine' },
                  { id: 'streetwear', cs: 'Streetwear / moderní', en: 'Streetwear / trendy' },
                  { id: 'business', cs: 'Business / formální', en: 'Business / formal' },
                  { id: 'bohemian', cs: 'Bohémský / artsy', en: 'Bohemian / artsy' },
                ] as const).map((s) => (
                  <label key={s.id} className="jn-svc-chk">
                    <input type="checkbox" name="style_type" value={s.id} />
                    <span>{locale === 'cs' ? s.cs : s.en}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <div className="jn-svc-label">{locale === 'cs' ? 'Sexy outfity na vyžádání' : 'Sexy outfits on request'}</div>
              <p className="jn-svc-hint">{locale === 'cs' ? 'Co můžete obléct na přání klienta? Zaškrtněte vše co máte' : 'What can you wear on client request? Check all you have'}</p>
              <div className="jn-svc-grid">
                {([
                  { id: 'lingerie', cs: 'Sexy lingerie', en: 'Sexy lingerie' },
                  { id: 'stockings', cs: 'Punčochy & podvazky', en: 'Stockings & garters' },
                  { id: 'high_heels', cs: 'Vysoké podpatky', en: 'High heels' },
                  { id: 'boots', cs: 'Kozačky / overknee', en: 'Boots / overknee' },
                  { id: 'latex', cs: 'Latex / vinyl', en: 'Latex / vinyl' },
                  { id: 'leather', cs: 'Kůže / kožené doplňky', en: 'Leather / leather accessories' },
                  { id: 'corset', cs: 'Korzet', en: 'Corset' },
                  { id: 'bodystocking', cs: 'Bodystocking / catsuit', en: 'Bodystocking / catsuit' },
                  { id: 'costume', cs: 'Kostým / role-play outfit', en: 'Costume / role-play outfit' },
                  { id: 'nurse', cs: 'Zdravotní sestřička', en: 'Nurse' },
                  { id: 'schoolgirl', cs: 'Školačka', en: 'Schoolgirl' },
                  { id: 'maid', cs: 'Pokojská', en: 'Maid' },
                  { id: 'secretary', cs: 'Sekretářka', en: 'Secretary' },
                  { id: 'swimwear', cs: 'Plavky / bikiny', en: 'Swimwear / bikini' },
                ] as const).map((s) => (
                  <label key={s.id} className="jn-svc-chk">
                    <input type="checkbox" name="wardrobe_item" value={s.id} />
                    <span>{locale === 'cs' ? s.cs : s.en}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="apply-form-section">
            <legend>{t('section.services')}</legend>
            <div className="form-group">
              <label htmlFor="languages">{t('field.languages')}</label>
              <input id="languages" name="languages" type="text" placeholder="cs, en, ru" />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
              .join-lang-picker {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 12px;
                margin: 24px auto 0;
                padding: 14px 18px;
                max-width: 760px;
                background: rgba(255,255,255,0.025);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
              }
              .join-lang-picker-label {
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: var(--color-text-muted);
              }
              .join-lang-picker-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }
              .join-lang-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 14px;
                font-size: 13px;
                font-weight: 500;
                color: rgba(255,255,255,0.7);
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                text-decoration: none;
                transition: all 0.15s;
              }
              .join-lang-btn:hover {
                background: rgba(255,255,255,0.08);
                border-color: rgba(255,255,255,0.2);
                color: #fff;
              }
              .join-lang-btn.is-active {
                background: rgba(242,125,141,0.18);
                border-color: rgba(242,125,141,0.6);
                color: #fff;
              }

              .jn-svc-label {
                display: block;
                margin: 4px 0 8px;
                font-size: 14px;
                font-weight: 600;
                color: var(--color-text);
                text-transform: none;
                letter-spacing: 0;
              }
              .jn-svc-hint {
                font-size: 12px;
                color: var(--color-text-muted);
                margin: 0 0 12px;
              }
              .jn-svc-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 10px;
              }
              .jn-svc-fixed,
              .apply-form .jn-svc-chk {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 11px 14px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 400;
                line-height: 1.3;
                text-transform: none;
                letter-spacing: 0;
                color: rgba(255,255,255,0.85);
              }
              .jn-svc-fixed {
                background: rgba(34,197,94,0.08);
                border: 1px solid rgba(34,197,94,0.25);
              }
              .jn-svc-fixed-check { color: #22c55e; font-weight: 700; flex-shrink: 0; }
              .apply-form .jn-svc-chk {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.12);
                cursor: pointer;
                transition: all 0.15s;
                color: rgba(255,255,255,0.85);
              }
              .apply-form .jn-svc-chk:hover {
                background: rgba(255,255,255,0.07);
                border-color: rgba(255,255,255,0.2);
              }
              .apply-form .jn-svc-chk input {
                accent-color: #f27d8d;
                flex-shrink: 0;
                width: 18px;
                height: 18px;
                margin: 0;
              }
              .apply-form .jn-svc-chk:has(input:checked) {
                background: rgba(242,125,141,0.12);
                border-color: rgba(242,125,141,0.55);
                color: #fff;
              }
              .apply-form .jn-svc-chk span {
                text-transform: none;
                letter-spacing: 0;
                font-weight: 400;
              }
            `}} />

            <div className="form-group">
              <div className="jn-svc-label">{t('services_basic_label')}</div>
              <div className="jn-svc-grid">
                {getBasicServices().map((s) => (
                  <div key={s.id} className="jn-svc-fixed">
                    <span className="jn-svc-fixed-check">✓</span>
                    <span>{s.translations[locale as 'cs'|'en'|'de'|'uk'] ?? s.translations.cs}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="jn-svc-label">{t('services_extra_label')}</div>
              <p className="jn-svc-hint">{t('services_extra_hint')}</p>
              <div className="jn-svc-grid">
                {getExtraServices().map((s) => (
                  <label key={s.id} className="jn-svc-chk">
                    <input type="checkbox" name="services" value={s.id} />
                    <span>{s.translations[locale as 'cs'|'en'|'de'|'uk'] ?? s.translations.cs}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="availability">{t('field.availability')}</label>
              <textarea id="availability" name="availability" rows={3} placeholder={PL.availPh} />
            </div>
          </fieldset>

          <div className="apply-form-submit">
            <button type="submit" className="submit-btn">
              {t('submit')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
