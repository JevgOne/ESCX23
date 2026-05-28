/**
 * SEO landing page content — intro, FAQ, related slugs for hashtag/lokace/service pages.
 * Used by /hashtag/[slug], /pobocka/[slug], /sluzba/[slug] pages.
 */

export type Locale = 'cs' | 'en' | 'de' | 'uk';

export interface LandingIntro {
  cs: string;
  en: string;
  de: string;
  uk: string;
}

export interface LandingFaqItem {
  q: { cs: string; en: string; de: string; uk: string };
  a: { cs: string; en: string; de: string; uk: string };
}

export interface LandingContent {
  intro: LandingIntro;
  faq: LandingFaqItem[];
  related: string[]; // hashtag slugs
  relatedLocations?: string[]; // location names
  metaDesc: { cs: string; en: string; de: string; uk: string };
}

/* ============================================================
   HASHTAG LANDING CONTENT
============================================================ */

export const HASHTAG_CONTENT: Record<string, LandingContent> = {
  'blondynky-praha': {
    metaDesc: {
      cs: 'Blondýnky Praha — ověřené blond společnice v centru Prahy. Diskrétní apartmány, jasné ceny, ⭐ recenze. Otevřeno denně 10:00–22:30.',
      en: 'Blonde companions in Prague — verified blonde escorts in central Prague apartments. Discreet, transparent pricing, real reviews. Open daily 10:00–22:30.',
      de: 'Blondinen Prag — verifizierte blonde Begleiterinnen in zentralen Apartments. Diskret, transparente Preise, echte Bewertungen. Täglich 10:00–22:30.',
      uk: 'Блондинки Прага — перевірені блонд супутниці у центрі. Дискретні апартаменти, прозорі ціни, ⭐ відгуки. Щодня 10:00–22:30.',
    },
    intro: {
      cs: 'Hledáte blondýnku v Praze? V LovelyGirls najdete ověřené blond společnice, které pracují v diskrétních apartmánech v centru Prahy. Každý profil je osobně ověřený — fotografie odpovídají realitě, žádné překvapení. Naše blondýnky mluví česky, anglicky a často i dalšími jazyky, takže komunikace je vždy bezproblémová. Programy začínají od 30 minut a všechny ceny jsou jasně uvedené v ceníku. Diskrétní vstup, soukromé apartmány a okamžitý kontakt přes WhatsApp či Telegram.',
      en: 'Looking for a blonde companion in Prague? At LovelyGirls you\'ll find verified blonde escorts working in private apartments in central Prague. Every profile is personally verified — photos match reality, no surprises. Our blonde companions speak English, Czech, and often German or Russian, so communication is always easy. Programs start from 30 minutes with transparent pricing. Discreet entry, private apartments, instant contact via WhatsApp or Telegram.',
      de: 'Sie suchen eine Blondine in Prag? Bei LovelyGirls finden Sie verifizierte blonde Begleiterinnen in privaten Apartments im Zentrum von Prag. Jedes Profil ist persönlich verifiziert — Fotos entsprechen der Realität. Unsere blonden Begleiterinnen sprechen Deutsch, Englisch und Tschechisch. Programme ab 30 Minuten mit transparenter Preisliste. Diskreter Zugang, private Apartments, sofortiger Kontakt via WhatsApp oder Telegram.',
      uk: 'Шукаєте блондинку у Празі? У LovelyGirls знайдете перевірених білявих супутниць у приватних апартаментах у центрі Праги. Кожен профіль особисто перевірений — фотографії відповідають реальності. Наші блондинки розмовляють англійською, чеською, часто й українською або російською. Програми від 30 хвилин з прозорими цінами.',
    },
    faq: [
      {
        q: { cs: 'Kolik blondýnek máte aktuálně k dispozici?', en: 'How many blonde companions are currently available?', de: 'Wie viele blonde Begleiterinnen sind verfügbar?', uk: 'Скільки блондинок наразі доступно?' },
        a: { cs: 'Aktuální počet a dnešní dostupnost najdete přímo v rozvrhu — aktualizujeme denně.', en: 'Current availability is in the live schedule, updated daily.', de: 'Aktuelle Verfügbarkeit finden Sie im täglichen Zeitplan.', uk: 'Актуальна доступність — у графіку, оновлюється щодня.' },
      },
      {
        q: { cs: 'Jsou fotografie blondýnek skutečné?', en: 'Are the blonde photos real?', de: 'Sind die Fotos echt?', uk: 'Чи справжні фото блондинок?' },
        a: { cs: 'Ano. Každou společnici osobně ověřujeme včetně fotografií — žádný retouching mimo míru, žádné fake profily.', en: 'Yes. Every companion is personally verified including photos — no excessive retouching, no fake profiles.', de: 'Ja. Jede Begleiterin wird persönlich verifiziert, auch die Fotos.', uk: 'Так. Кожну супутницю особисто перевіряємо, включно з фотографіями.' },
      },
      {
        q: { cs: 'Kde se s blondýnkou potkám?', en: 'Where do I meet the blonde companion?', de: 'Wo treffe ich die Begleiterin?', uk: 'Де я зустріну блондинку?' },
        a: { cs: 'V diskrétním privátním apartmánu v centru Prahy (Praha 1, 2, 3 nebo 8). Přesnou adresu obdržíte po potvrzení termínu.', en: 'In a discreet private apartment in central Prague (Prague 1, 2, 3 or 8). Exact address sent after booking confirmation.', de: 'In einem diskreten privaten Apartment im Zentrum von Prag.', uk: 'У дискретному приватному апартаменті у центрі Праги.' },
      },
    ],
    related: ['cernovlasky-praha', 'brunetky-praha', 'studentky-praha', 'gfe-praha', 'modre-oci', 'dlouhe-vlasy'],
    relatedLocations: ['vinohrady'],
  },

  'brunetky-praha': {
    metaDesc: {
      cs: 'Brunetky Praha — ověřené brunet společnice v centru. Diskrétní apartmány, jasné ceny, ⭐ recenze. Otevřeno denně 10:00–22:30.',
      en: 'Brunette companions Prague — verified brunette escorts in central apartments. Discreet, transparent pricing, real reviews. Daily 10:00–22:30.',
      de: 'Brünette Prag — verifizierte brünette Begleiterinnen in zentralen Apartments. Diskret, transparente Preise. Täglich 10:00–22:30.',
      uk: 'Брюнетки Прага — перевірені брюнет супутниці у центрі. Дискретні апартаменти, прозорі ціни. Щодня 10:00–22:30.',
    },
    intro: {
      cs: 'Brunetky v Praze nabízejí elegantní a smyslné setkání v diskrétních privátních apartmánech. Každá brunetka v naší agentuře je osobně ověřená — fotografie odpovídají realitě, profily jsou aktuální. Brunetky často přitahují klienty pro klasickou ženskou eleganci, výrazné rysy a tmavé vlasy. Vyberte si z aktuálně dostupných brunetek, podívejte se na rozvrh a ozvěte se přes WhatsApp pro okamžitou domluvu.',
      en: 'Brunette companions in Prague offer elegant and sensual encounters in discreet private apartments. Every brunette is personally verified — photos match reality. Brunettes appeal to clients seeking classical feminine elegance, striking features, and dark hair. Browse available brunettes, check the schedule, and contact via WhatsApp for instant booking.',
      de: 'Brünette in Prag bieten elegante und sinnliche Begegnungen in diskreten privaten Apartments. Jede Brünette ist persönlich verifiziert. Schauen Sie sich verfügbare Brünette an und kontaktieren Sie uns via WhatsApp.',
      uk: 'Брюнетки у Празі пропонують елегантні зустрічі у дискретних приватних апартаментах. Кожна брюнетка особисто перевірена.',
    },
    faq: [
      {
        q: { cs: 'Mluví vaše brunetky anglicky?', en: 'Do your brunettes speak English?', de: 'Sprechen die Brünette Englisch?', uk: 'Чи розмовляють брюнетки англійською?' },
        a: { cs: 'Většina ano. Konkrétní jazyky najdete v profilu každé společnice (vlajky pod fotkou).', en: 'Most do. Languages are listed on each profile (flags below photo).', de: 'Die meisten ja. Sprachen sind auf jedem Profil aufgeführt.', uk: 'Більшість так. Мови — у профілі.' },
      },
      {
        q: { cs: 'Mohu si vybrat konkrétní brunetku?', en: 'Can I choose a specific brunette?', de: 'Kann ich eine bestimmte Brünette wählen?', uk: 'Чи можу обрати конкретну брюнетку?' },
        a: { cs: 'Ano, vyberte si z profilů, napište nám její jméno přes WhatsApp a my potvrdíme dostupnost.', en: 'Yes — pick from profiles, message her name via WhatsApp, we confirm availability.', de: 'Ja — wählen Sie aus den Profilen.', uk: 'Так — оберіть з профілів.' },
      },
    ],
    related: ['cernovlasky-praha', 'blondynky-praha', 'gfe-praha', 'elegantni-holky'],
    relatedLocations: ['vinohrady'],
  },

  'cernovlasky-praha': {
    metaDesc: {
      cs: 'Černovlásky Praha — ověřené společnice s černými vlasy. Diskrétní apartmány v centru, transparentní ceny, ⭐ recenze.',
      en: 'Dark-haired companions Prague — verified escorts with black hair in central apartments. Transparent pricing, real reviews.',
      de: 'Schwarzhaarige Begleiterinnen Prag — verifizierte Begleiterinnen mit dunklem Haar in zentralen Apartments.',
      uk: 'Темноволосі супутниці Прага — перевірені супутниці з чорним волоссям у центрі.',
    },
    intro: {
      cs: 'Černovlásky v Praze — výrazné a smyslné společnice s tmavými vlasy a často exotickým vzhledem. Každý profil je ověřený, fotografie aktuální. Setkání probíhají v diskrétním privátním apartmánu v centru Prahy.',
      en: 'Dark-haired companions in Prague — striking and sensual escorts with black hair and often exotic looks. Every profile verified, photos current. Meetings in discreet private central Prague apartment.',
      de: 'Schwarzhaarige Begleiterinnen in Prag — markant und sinnlich. Jedes Profil verifiziert, Fotos aktuell.',
      uk: 'Темноволосі супутниці у Празі — яскраві та чуттєві. Кожен профіль перевірений.',
    },
    faq: [
      {
        q: { cs: 'Jak dlouhé je standardní setkání?', en: 'How long is a standard meeting?', de: 'Wie lang ist ein Standardtreffen?', uk: 'Скільки триває стандартна зустріч?' },
        a: { cs: 'Programy začínají na 30 minutách. Nejoblíbenější je 60 minut. Kompletní ceník najdete na stránce Ceník.', en: 'Programs start at 30 minutes. Most popular is 60 minutes. Full pricing on the Pricing page.', de: 'Programme ab 30 Minuten. Beliebt: 60 Minuten.', uk: 'Програми від 30 хвилин. Найпопулярніше — 60 хвилин.' },
      },
    ],
    related: ['brunetky-praha', 'blondynky-praha', 'exoticke-krasky'],
    relatedLocations: ['vinohrady'],
  },

  'gfe-praha': {
    metaDesc: {
      cs: 'GFE Praha — Girlfriend Experience s ověřenými společnicemi. Autentické setkání jako s přítelkyní, diskrétní apartmány, transparentní ceny.',
      en: 'GFE Prague — Girlfriend Experience with verified companions. Authentic girlfriend-like encounter, discreet apartments, transparent pricing.',
      de: 'GFE Prag — Girlfriend Experience mit verifizierten Begleiterinnen. Authentisches Treffen wie mit der Freundin.',
      uk: 'GFE Прага — Girlfriend Experience з перевіреними супутницями. Автентична зустріч як з дівчиною.',
    },
    intro: {
      cs: 'GFE neboli Girlfriend Experience je nejoblíbenější styl setkání. Není to mechanická služba — společnice s vámi tráví čas jako s přítelkyní: ležérní povídání, polibky, dotyky, intimní propojení. Naše GFE společnice jsou ověřené, mluví několika jazyky a vědí, jak vytvořit autentický zážitek bez umělé hry. Programy 60+ minut jsou pro GFE doporučované — méně času znamená méně prostoru pro skutečné propojení.',
      en: 'GFE — Girlfriend Experience — is our most popular service. It\'s not mechanical: the companion spends time with you like a girlfriend would — casual conversation, kissing, touching, genuine intimacy. Our GFE companions are verified, multilingual, and know how to create an authentic experience without artificial performance. 60+ minute programs are recommended for GFE — less time means less room for real connection.',
      de: 'GFE ist unsere beliebteste Dienstleistung. Die Begleiterin verbringt Zeit mit Ihnen wie eine Freundin — Gespräche, Küsse, echte Intimität.',
      uk: 'GFE — Girlfriend Experience — найпопулярніший формат. Супутниця проводить час як дівчина: розмови, поцілунки, справжня близькість.',
    },
    faq: [
      {
        q: { cs: 'Co všechno GFE zahrnuje?', en: 'What does GFE include?', de: 'Was beinhaltet GFE?', uk: 'Що включає GFE?' },
        a: { cs: 'Polibky, něžné dotyky, oboustranný orální styk (s ochranou), klasický pohlavní styk, intimitu na úrovni přítelkyně. Konkrétní detaily dohodněte předem s vybranou společnicí.', en: 'Kissing, gentle touching, mutual oral (with protection), classic intercourse, girlfriend-level intimacy. Specifics arranged in advance with chosen companion.', de: 'Küssen, sanfte Berührungen, gegenseitiger Oralverkehr (geschützt), klassischer Geschlechtsverkehr.', uk: 'Поцілунки, ніжні дотики, оральний секс (з захистом), класичний секс, інтимність як з дівчиною.' },
      },
      {
        q: { cs: 'Jaké programy jsou pro GFE nejlepší?', en: 'Which programs are best for GFE?', de: 'Welche Programme eignen sich für GFE?', uk: 'Які програми найкращі для GFE?' },
        a: { cs: 'Doporučujeme 90 nebo 120 minut. Třicet minut na GFE nestačí — chybí prostor na pomalé propojení.', en: 'We recommend 90 or 120 minutes. Thirty minutes isn\'t enough for GFE — no time for slow connection.', de: 'Wir empfehlen 90 oder 120 Minuten.', uk: 'Рекомендуємо 90 або 120 хвилин.' },
      },
    ],
    related: ['blondynky-praha', 'brunetky-praha', 'studentky-praha', 'luxusni-sluzby', 'elegantni-holky'],
    relatedLocations: ['vinohrady'],
  },

  'studentky-praha': {
    metaDesc: {
      cs: 'Studentky Praha — mladé ověřené společnice (18+), diskrétní setkání v centru. Transparentní ceny, ⭐ recenze, denně 10:00–22:30.',
      en: 'Student companions Prague — young verified escorts (18+), discreet central apartments. Transparent pricing, daily 10:00–22:30.',
      de: 'Studentinnen Prag — junge verifizierte Begleiterinnen (18+), diskrete Apartments im Zentrum.',
      uk: 'Студентки Прага — молоді перевірені супутниці (18+), дискретні апартаменти.',
    },
    intro: {
      cs: 'Mladé studentky v Praze — energické, otevřené a zvědavé společnice ve věku od 18+ let. Studují, pracují s námi mimo školu, a často mluví anglicky či jinými cizími jazyky. Každá je osobně ověřená — máme zkontrolovaný občanský průkaz a souhlas. Žádné nezletilé, žádné fake profily.',
      en: 'Young student companions in Prague — energetic, open-minded, curious escorts aged 18+. They study, work with us outside class, often speak English or other languages. Every one personally verified — we check ID and consent. No underage, no fake profiles.',
      de: 'Junge Studentinnen in Prag — energiegeladen, offen, neugierig, 18+. Studium nebenher, oft mehrsprachig.',
      uk: 'Молоді студентки у Празі — енергійні, відкриті, 18+. Навчаються, працюють поза заняттями, часто говорять кількома мовами.',
    },
    faq: [
      {
        q: { cs: 'Jsou opravdu studentky?', en: 'Are they really students?', de: 'Sind sie wirklich Studentinnen?', uk: 'Чи справді студентки?' },
        a: { cs: 'Ano. Mladé společnice ve věku 18+ které studují nebo nedávno dokončily školu. Věk každé je v jejím profilu.', en: 'Yes. Young companions aged 18+ currently studying or recently graduated. Age in each profile.', de: 'Ja. Junge Begleiterinnen 18+, die studieren oder kürzlich abgeschlossen haben.', uk: 'Так. Молоді супутниці 18+, які навчаються або нещодавно закінчили.' },
      },
      {
        q: { cs: 'Jak ověřujete věk?', en: 'How do you verify age?', de: 'Wie wird das Alter verifiziert?', uk: 'Як перевіряєте вік?' },
        a: { cs: 'Občanským průkazem osobně před zveřejněním profilu. Žádná dívka pod 18 let v naší agentuře není.', en: 'In-person ID check before profile publication. No under-18 in our agency.', de: 'Persönliche Ausweiskontrolle vor Profilveröffentlichung.', uk: 'Особиста перевірка ID перед публікацією профілю.' },
      },
    ],
    related: ['mlade-holky', 'blondynky-praha', 'brunetky-praha', 'gfe-praha', 'fit-holky'],
    relatedLocations: ['vinohrady'],
  },

  'spolecnice-praha': {
    metaDesc: {
      cs: 'Společnice Praha — 13 ověřených společnic v centru. Diskrétní apartmány Praha 1, 2, 3, 8. Transparentní ceny, ⭐ recenze, denně 10:00–22:30.',
      en: 'Companions Prague — 13 verified companions in central apartments. Prague 1, 2, 3, 8. Transparent pricing, real reviews, daily 10:00–22:30.',
      de: 'Begleiterinnen Prag — 13 verifizierte Begleiterinnen in zentralen Apartments.',
      uk: 'Супутниці Прага — 13 перевірених супутниць у центрі.',
    },
    intro: {
      cs: 'LovelyGirls Praha provozuje 4 diskrétní privátní apartmány v centru Prahy s ověřenými společnicemi všech typů. Blondýnky, brunetky, štíhlé, s křivkami — výběr aktuálně dostupných najdete na stránce Dívky. Každý profil je osobně ověřený, fotografie odpovídají realitě, ceny jsou jasně uvedené. Žádný úvodní poplatek, žádné překvapení.',
      en: 'LovelyGirls Prague operates 4 discreet private apartments in central Prague with verified companions of every type. Blondes, brunettes, slim, curvy — see currently available on the Girls page. Every profile personally verified, photos match reality, prices clearly listed. No upfront fee, no surprises.',
      de: 'LovelyGirls Prag betreibt 4 diskrete private Apartments im Zentrum.',
      uk: 'LovelyGirls Прага керує 4 дискретними апартаментами у центрі.',
    },
    faq: [
      {
        q: { cs: 'Kolik společnic je aktuálně k dispozici?', en: 'How many companions are currently available?', de: 'Wie viele Begleiterinnen sind verfügbar?', uk: 'Скільки супутниць наразі доступно?' },
        a: { cs: 'Aktuální dostupnost najdete v rozvrhu — aktualizujeme denně.', en: 'Live availability in the schedule, updated daily.', de: 'Aktuelle Verfügbarkeit im täglichen Zeitplan.', uk: 'Актуальна доступність — у графіку.' },
      },
    ],
    related: ['blondynky-praha', 'brunetky-praha', 'gfe-praha', 'studentky-praha', 'ceske-holky'],
    relatedLocations: ['vinohrady'],
  },

  'prirodni-poprsi': {
    metaDesc: {
      cs: 'Společnice s přírodním poprsím v Praze — ověřené dívky bez implantátů. Diskrétní apartmány, transparentní ceny.',
      en: 'Companions with natural breasts in Prague — verified girls without implants. Discreet apartments, transparent pricing.',
      de: 'Begleiterinnen mit natürlicher Brust in Prag — verifiziert, ohne Implantate.',
      uk: 'Супутниці з натуральним бюстом у Празі — перевірені, без імплантів.',
    },
    intro: {
      cs: 'Přírodní poprsí — autentický pocit a vzhled. Naše společnice s přírodním poprsím jsou ověřené a jejich tělesné parametry odpovídají realitě. V profilu každé dívky je uvedená velikost prsou a označení (přírodní/implantáty).',
      en: 'Natural breasts — authentic feel and look. Our companions with natural breasts are verified and body measurements match reality. Each profile shows bust size and (natural/implant) indicator.',
      de: 'Natürliche Brüste — authentisches Gefühl und Aussehen.',
      uk: 'Натуральний бюст — справжній вигляд і відчуття.',
    },
    faq: [
      {
        q: { cs: 'Jak poznám, že má společnice přírodní poprsí?', en: 'How do I know if breasts are natural?', de: 'Wie erkenne ich, ob die Brust natürlich ist?', uk: 'Як зрозуміти, що бюст натуральний?' },
        a: { cs: 'V profilu každé dívky je u sloupce „Prsa" označení (přírodní/implantáty).', en: 'Each profile has a "Bust" field with natural/implant indicator.', de: 'Im Profil ist die Angabe natürlich/Implantat.', uk: 'У профілі вказано натуральні/імпланти.' },
      },
    ],
    related: ['blondynky-praha', 'brunetky-praha', 'stihla-postava', 'krivky'],
  },

  'tetovani': {
    metaDesc: {
      cs: 'Společnice s tetováním v Praze — ověřené dívky s viditelnými tetováními. Diskrétní apartmány, transparentní ceny.',
      en: 'Tattooed companions in Prague — verified girls with visible tattoos. Discreet apartments, transparent pricing.',
      de: 'Begleiterinnen mit Tattoos in Prag — verifiziert, sichtbar tätowiert.',
      uk: 'Супутниці з татуюваннями у Празі — перевірені.',
    },
    intro: {
      cs: 'Společnice s tetováním — alternativní styl a unikátní vzhled. V profilu každé dívky je uvedeno, zda má diskrétní, viditelné, výrazné nebo rozsáhlé tetování.',
      en: 'Tattooed companions — alternative style and unique look. Each profile indicates whether tattoos are discreet, visible, significant, or extensive.',
      de: 'Begleiterinnen mit Tattoos — alternativer Stil.',
      uk: 'Супутниці з тату — альтернативний стиль.',
    },
    faq: [
      {
        q: { cs: 'Jak rozsáhlé tetování společnice má?', en: 'How extensive are the tattoos?', de: 'Wie umfangreich sind die Tattoos?', uk: 'Наскільки великі татуювання?' },
        a: { cs: 'V profilu jsou 4 úrovně — diskrétní (do 5 %), viditelné (5–30 %), výrazné (30–70 %), rozsáhlé (70+ %).', en: '4 levels in profile — discreet (<5%), visible (5–30%), significant (30–70%), extensive (70+%).', de: '4 Stufen — dezent, sichtbar, auffällig, großflächig.', uk: '4 рівні — непомітне, видиме, значне, дуже значне.' },
      },
    ],
    related: ['piercing-holky', 'sexy-holky', 'fit-holky'],
  },
};

/* ============================================================
   POPULAR HASHTAGS for cross-linking on homepage / /divky
============================================================ */

export const POPULAR_HASHTAGS = [
  'spolecnice-praha',
  'blondynky-praha',
  'brunetky-praha',
  'gfe-praha',
  'studentky-praha',
  'cernovlasky-praha',
  'prirodni-poprsi',
  'fit-holky',
  'ceske-holky',
  'ukrajinske-holky',
  'luxusni-sluzby',
  'elegantni-holky',
];

/* ============================================================
   POBOCKA (LOCATION) LANDING CONTENT
============================================================ */

export interface LocationContent {
  metaDesc: { cs: string; en: string; de: string; uk: string };
  intro: { cs: string; en: string; de: string; uk: string };
  faq: LandingFaqItem[];
  relatedHashtags: string[];
}

export const LOCATION_CONTENT: Record<string, LocationContent> = {
  'vinohrady': {
    metaDesc: {
      cs: 'Apartmán Vinohrady Praha 2 — ověřené společnice, diskrétní privátní byt. Metro a tramvaj minutu pěšky, hotovostní platba.',
      en: 'Vinohrady apartment Prague 2 — verified companions, discreet private flat. Metro & tram minutes away, cash payment.',
      de: 'Apartment Vinohrady Prag 2 — verifizierte Begleiterinnen, diskretes Privatapartment.',
      uk: 'Апартамент Виногради Прага 2 — перевірені супутниці, дискретні приватні апартаменти.',
    },
    intro: {
      cs: 'Apartmán LovelyGirls na Vinohradech (Praha 2) je naší hlavní pobočkou. Diskrétní byt s vlastním vchodem, klimatizací, sprchou a Wi-Fi. Metro Náměstí Míru i tramvaj Vinohradská tržnice minutu pěšky. Modré parkovací zóny v okolních ulicích, placené parkoviště do 2 minut. Adresu obdržíte po potvrzení termínu — diskrétně, žádné kamery v okolí vchodu.',
      en: 'LovelyGirls Vinohrady apartment (Prague 2) is our main location. Discreet flat with private entry, AC, shower, Wi-Fi. Metro Náměstí Míru and tram Vinohradská tržnice minutes away. Blue parking zones nearby, paid lot within 2 min. Exact address sent after booking — no cameras near entry.',
      de: 'LovelyGirls Vinohrady Apartment (Prag 2) ist unser Hauptstandort. Diskret, mit eigenem Eingang, Klimaanlage, Dusche, WLAN.',
      uk: 'Апартамент LovelyGirls на Виноградах (Прага 2) — головна локація. Дискретні, з власним входом, кондиціонер, душ, Wi-Fi.',
    },
    faq: [
      {
        q: { cs: 'Jak se k vám dostanu MHD?', en: 'How do I get there by public transport?', de: 'Wie komme ich mit dem ÖPNV hin?', uk: 'Як дістатися громадським транспортом?' },
        a: { cs: 'Metro A — stanice Náměstí Míru nebo Jiřího z Poděbrad, obě do 5 minut pěšky. Tramvaj Vinohradská tržnice 1 minutu od vchodu.', en: 'Metro A — Náměstí Míru or Jiřího z Poděbrad, both within 5 min walk. Tram Vinohradská tržnice 1 minute from entry.', de: 'Metro A — Náměstí Míru, 5 Minuten zu Fuß.', uk: 'Метро A — Náměstí Míru, 5 хвилин пішки.' },
      },
      {
        q: { cs: 'Mohu zaparkovat u apartmánu?', en: 'Can I park at the apartment?', de: 'Kann ich parken?', uk: 'Чи можу припаркуватися?' },
        a: { cs: 'Modré zóny v okolních ulicích nebo placené parkoviště Tylova/Vinohradská do 2 minut chůze.', en: 'Blue zones in nearby streets or paid lot Tylova/Vinohradská within 2 min walk.', de: 'Blaue Zonen oder bezahlter Parkplatz Tylova/Vinohradská.', uk: 'Сині зони або платний паркінг Tylova/Vinohradská.' },
      },
      {
        q: { cs: 'Jaké jsou otevírací doby apartmánu?', en: 'What are the opening hours?', de: 'Was sind die Öffnungszeiten?', uk: 'Які години роботи?' },
        a: { cs: 'Denně 10:00–22:30, včetně víkendů.', en: 'Daily 10:00–22:30, including weekends.', de: 'Täglich 10:00–22:30, auch am Wochenende.', uk: 'Щодня 10:00–22:30, включно з вихідними.' },
      },
    ],
    relatedHashtags: ['spolecnice-praha', 'blondynky-praha', 'brunetky-praha', 'gfe-praha'],
  },
};

/* ============================================================
   HELPERS
============================================================ */

export function getHashtagContent(slug: string): LandingContent | null {
  return HASHTAG_CONTENT[slug] ?? null;
}

export function getLocationContent(slug: string): LocationContent | null {
  return LOCATION_CONTENT[slug] ?? null;
}
