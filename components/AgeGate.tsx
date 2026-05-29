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
  intro: string;
  terms: string[];
  cookies: string;
  legalNotice: string;
  privacyLink: string;
  termsLink: string;
  enter: string;
  leave: string;
}> = {
  cs: {
    title: 'Prohlášení',
    intro: 'Následující stránky mohou obsahovat sexuálně explicitní obrazový nebo slovní materiál. Proto si před vstupem přečtěte následující podmínky použití. Kliknutím na tlačítko "Souhlasím" potvrzujete svůj úplný a nepodmíněný souhlas s následujícími podmínkami:',
    terms: [
      'Jsem dospělá osoba ve věku 18 let nebo starší, pokud to vyžadují zákony státu, ve kterém se nacházím.',
      'Jsem si vědom(a), že přistupuji na stránky obsahující sexuálně explicitní materiál.',
      'Svým chováním nedovolím nikomu nezpůsobilému nebo nezletilému přístup k údajům zde obsaženým.',
      'Můj zájem o veškeré zde obsažené informace je čistě soukromý a slouží pouze k mému vlastnímu použití.',
      'Beru na vědomí, že veškeré obrazové a textové materiály jsou chráněny autorským právem.',
    ],
    cookies: '',
    legalNotice: 'Veškeré informace umístěné na těchto webových stránkách jsou zveřejňovány pro reklamní účely poskytovatelů služeb. Provozovatel této webové stránky neodpovídá za správnost a aktuálnost zveřejněných informací ani za poskytované služby. Podmínkou inzerátu je pronájem pokoje.',
    privacyLink: 'Soukromí',
    termsLink: 'Podmínky',
    enter: 'Souhlasím a potvrzuji výše uvedené',
    leave: 'Odejít',
  },
  en: {
    title: 'Disclaimer',
    intro: 'The following pages may contain sexually explicit images or verbal material. Therefore, before entering, read the following terms of use. By clicking on the "I agree" button, you acknowledge your full and unconditional consent to the following conditions:',
    terms: [
      'I am an adult 18 years of age or older if required by the laws of the state in which I am located.',
      'I am aware that I am accessing sites containing sexually explicit material.',
      'By my behavior, I will not allow anyone ineligible or underage to access the data contained herein.',
      'My interest in all information contained herein is purely private and is for my own use only.',
      'I acknowledge that all image and text materials are protected by copyright law.',
    ],
    cookies: '',
    legalNotice: 'All information published on this website is for advertising purposes of service providers. The operator of this website is not responsible for the accuracy and timeliness of published information or for the services provided. A condition of advertisement is room rental.',
    privacyLink: 'Privacy',
    termsLink: 'Terms',
    enter: 'I agree and confirm the above',
    leave: 'Leave',
  },
  de: {
    title: 'Haftungsausschluss',
    intro: 'Die folgenden Seiten können sexuell explizite Bilder oder verbales Material enthalten. Lesen Sie daher vor dem Betreten die folgenden Nutzungsbedingungen. Durch Klicken auf die Schaltfläche "Ich stimme zu" bestätigen Sie Ihre vollständige und bedingungslose Zustimmung zu den folgenden Bedingungen:',
    terms: [
      'Ich bin ein Erwachsener im Alter von 18 Jahren oder älter, falls dies nach den Gesetzen des Staates erforderlich ist, in dem ich mich befinde.',
      'Mir ist bewusst, dass ich auf Websites mit sexuell explizitem Material zugreife.',
      'Durch mein Verhalten werde ich niemandem, der nicht berechtigt oder minderjährig ist, Zugang zu den hierin enthaltenen Daten gewähren.',
      'Mein Interesse an allen hierin enthaltenen Informationen ist rein privat und dient nur meiner eigenen Verwendung.',
      'Ich erkenne an, dass alle Bild- und Textmaterialien urheberrechtlich geschützt sind.',
    ],
    cookies: '',
    legalNotice: 'Alle auf dieser Website veröffentlichten Informationen dienen Werbezwecken der Dienstleister. Der Betreiber dieser Website übernimmt keine Verantwortung für die Richtigkeit und Aktualität der veröffentlichten Informationen oder für die erbrachten Dienstleistungen. Bedingung der Anzeige ist die Zimmervermietung.',
    privacyLink: 'Datenschutz',
    termsLink: 'AGB',
    enter: 'Ich stimme zu und bestätige das Vorstehende',
    leave: 'Verlassen',
  },
  uk: {
    title: 'Відмова від відповідальності',
    intro: 'Наступні сторінки можуть містити сексуально відвертий візуальний або словесний матеріал. Тому перед входом прочитайте наступні умови використання. Натискаючи кнопку «Я погоджуюся», ви підтверджуєте свою повну та беззастережну згоду з наступними умовами:',
    terms: [
      'Я є дорослою особою віком 18 років або старше, якщо це вимагається законами держави, в якій я знаходжуся.',
      'Я усвідомлюю, що отримую доступ до сайтів, що містять сексуально відвертий матеріал.',
      'Своєю поведінкою я не дозволю нікому, хто не має права або є неповнолітнім, отримати доступ до даних, що містяться тут.',
      'Мій інтерес до всієї інформації, що міститься тут, є суто приватним і призначений лише для мого власного використання.',
      'Я визнаю, що всі зображення та текстові матеріали захищені законом про авторське право.',
    ],
    cookies: '',
    legalNotice: 'Вся інформація, розміщена на цьому веб-сайті, публікується в рекламних цілях постачальників послуг. Оператор цього веб-сайту не несе відповідальності за правильність та актуальність опублікованої інформації, а також за надані послуги. Умовою реклами є оренда кімнати.',
    privacyLink: 'Конфіденційність',
    termsLink: 'Умови',
    enter: 'Я погоджуюся і підтверджую вищезазначене',
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
          <div className="age-gate-badge">18+</div>
          <h2 className="age-gate-title">{L.title}</h2>
          <p className="age-gate-intro">{L.intro}</p>
          <ul className="age-gate-terms">
            {L.terms.map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
          {L.legalNotice && (
            <p className="age-gate-legal-notice">{L.legalNotice}</p>
          )}
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
