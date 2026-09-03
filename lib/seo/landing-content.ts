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
        a: { cs: 'V diskrétním privátním apartmánu v centru Prahy ({districts}). Přesnou adresu obdržíte po potvrzení termínu.', en: 'In a discreet private apartment in central Prague ({districts}). Exact address sent after booking confirmation.', de: 'In einem diskreten privaten Apartment im Zentrum von Prag.', uk: 'У дискретному приватному апартаменті у центрі Праги.' },
      },
      {
        q: { cs: 'Kolik stojí setkání s blondýnkou?', en: 'How much does a meeting with a blonde companion cost?', de: 'Was kostet ein Treffen mit einer Blondine?', uk: 'Скільки коштує зустріч з блондинкою?' },
        a: { cs: 'Ceny jsou jednotné pro všechny společnice a začínají od 2 000 Kč za 30 minut. Kompletní ceník najdete na stránce Ceník.', en: 'Prices are the same for all companions, starting from 2,000 CZK for 30 minutes. Full pricing on our Pricing page.', de: 'Die Preise sind für alle Begleiterinnen gleich, ab 2.000 CZK für 30 Minuten.', uk: 'Ціни єдині для всіх супутниць, від 2 000 CZK за 30 хвилин.' },
      },
      {
        q: { cs: 'Můžu si blondýnku objednat i na hotel?', en: 'Can I book a blonde companion to my hotel?', de: 'Kann ich eine Blondine ins Hotel bestellen?', uk: 'Чи можу замовити блондинку до готелю?' },
        a: { cs: 'Setkání probíhají výhradně v našich privátních apartmánech v centru Prahy. Outcall služby nenabízíme — zajišťujeme tak maximální diskrétnost a bezpečnost pro všechny.', en: 'Meetings take place exclusively in our private apartments in central Prague. We don\'t offer outcall — this ensures maximum discretion and safety for everyone.', de: 'Treffen finden ausschließlich in unseren privaten Apartments statt. Kein Outcall.', uk: 'Зустрічі проходять виключно у наших приватних апартаментах. Виїзд не пропонуємо.' },
      },
    ],
    related: ['cernovlasky-praha', 'brunetky-praha', 'studentky-praha', 'gfe-praha', 'modre-oci', 'dlouhe-vlasy'],
  },

  'brunetky-praha': {
    metaDesc: {
      cs: 'Brunetky Praha — ověřené brunet společnice v centru. Diskrétní apartmány, jasné ceny, ⭐ recenze. Otevřeno denně 10:00–22:30.',
      en: 'Brunette companions Prague — verified brunette escorts in central apartments. Discreet, transparent pricing, real reviews. Daily 10:00–22:30.',
      de: 'Brünette Prag — verifizierte brünette Begleiterinnen in zentralen Apartments. Diskret, transparente Preise. Täglich 10:00–22:30.',
      uk: 'Брюнетки Прага — перевірені брюнет супутниці у центрі. Дискретні апартаменти, прозорі ціни. Щодня 10:00–22:30.',
    },
    intro: {
      cs: 'Brunetky v Praze nabízejí elegantní a smyslné setkání v diskrétních privátních apartmánech v centru města. Každá brunetka v naší agentuře LovelyGirls je osobně ověřená — fotografie odpovídají realitě, profily jsou aktuální a pravidelně kontrolované. Brunetky často přitahují klienty pro klasickou ženskou eleganci, výrazné rysy a tmavé vlasy. Nabízíme brunetky různých typů — od štíhlých po dívky s křivkami, od sportovních po sofistikované. Všechny mluví minimálně česky a anglicky. Vyberte si z aktuálně dostupných brunetek v rozvrhu, prohlédněte si galerie fotek a ozvěte se přes WhatsApp nebo Telegram pro okamžitou domluvu termínu.',
      en: 'Brunette companions in Prague offer elegant and sensual encounters in discreet private apartments in the city center. Every brunette at LovelyGirls is personally verified — photos match reality, profiles are current and regularly checked. Brunettes appeal to clients seeking classical feminine elegance, striking features, and dark hair. We offer brunettes of various types — from slim to curvy, athletic to sophisticated. All speak at least Czech and English. Browse available brunettes in the schedule, explore photo galleries, and contact via WhatsApp or Telegram for instant booking.',
      de: 'Brünette in Prag bieten elegante und sinnliche Begegnungen in diskreten privaten Apartments im Stadtzentrum. Jede Brünette bei LovelyGirls ist persönlich verifiziert — Fotos entsprechen der Realität, Profile werden regelmäßig aktualisiert. Wir bieten Brünette verschiedener Typen — von schlank bis kurvig, sportlich bis elegant. Alle sprechen mindestens Tschechisch und Englisch. Schauen Sie sich den Zeitplan an und kontaktieren Sie uns via WhatsApp.',
      uk: 'Брюнетки у Празі пропонують елегантні та чуттєві зустрічі у дискретних приватних апартаментах у центрі міста. Кожна брюнетка у LovelyGirls особисто перевірена — фотографії відповідають реальності, профілі регулярно оновлюються. Ми пропонуємо брюнеток різних типів — від стрункіх до пишних, спортивних до елегантних. Усі розмовляють щонайменше чеською та англійською. Перегляньте графік доступності та зв\'яжіться через WhatsApp або Telegram.',
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
      {
        q: { cs: 'Jaké programy nabízejí brunetky?', en: 'What programs do brunettes offer?', de: 'Welche Programme bieten die Brünetten an?', uk: 'Які програми пропонують брюнетки?' },
        a: { cs: 'Stejné programy jako všechny naše společnice — od 30 minut po 120 minut. Většina brunetek nabízí i GFE (Girlfriend Experience). Detaily v ceníku.', en: 'Same programs as all our companions — from 30 to 120 minutes. Most brunettes also offer GFE (Girlfriend Experience). Details in pricing.', de: 'Gleiche Programme wie alle Begleiterinnen — 30 bis 120 Minuten, die meisten auch GFE.', uk: 'Ті ж програми, що й усі супутниці — від 30 до 120 хвилин. Більшість брюнеток також пропонують GFE.' },
      },
      {
        q: { cs: 'Jak rychle mohu domluvit setkání s brunetkou?', en: 'How quickly can I arrange a meeting with a brunette?', de: 'Wie schnell kann ich ein Treffen vereinbaren?', uk: 'Як швидко можу домовити зустріч з брюнеткою?' },
        a: { cs: 'Obvykle do 30 minut od prvního kontaktu. Napište přes WhatsApp nebo Telegram, ověříme dostupnost a pošleme adresu apartmánu.', en: 'Usually within 30 minutes of first contact. Message via WhatsApp or Telegram, we verify availability and send the apartment address.', de: 'In der Regel innerhalb von 30 Minuten. Kontaktieren Sie uns via WhatsApp.', uk: 'Зазвичай протягом 30 хвилин від першого контакту. Напишіть через WhatsApp або Telegram.' },
      },
    ],
    related: ['cernovlasky-praha', 'blondynky-praha', 'gfe-praha', 'elegantni-holky'],
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
        q: { cs: 'Kolik černovlásek máte aktuálně k dispozici?', en: 'How many dark-haired companions are currently available?', de: 'Wie viele schwarzhaarige Begleiterinnen sind verfügbar?', uk: 'Скільки темноволосих супутниць наразі доступно?' },
        a: { cs: 'Aktuální počet a dnešní dostupnost černovlásek najdete přímo v rozvrhu — aktualizujeme denně.', en: 'Current availability of dark-haired companions is in the live schedule, updated daily.', de: 'Aktuelle Verfügbarkeit schwarzhaariger Begleiterinnen finden Sie im täglichen Zeitplan.', uk: 'Актуальна доступність темноволосих супутниць — у графіку, оновлюється щодня.' },
      },
      {
        q: { cs: 'Jsou fotografie černovlásek skutečné?', en: 'Are the dark-haired companion photos real?', de: 'Sind die Fotos der schwarzhaarigen Begleiterinnen echt?', uk: 'Чи справжні фото темноволосих супутниць?' },
        a: { cs: 'Ano. Každou společnici osobně ověřujeme včetně fotografií — žádné fake profily, žádný přehnaný retouching.', en: 'Yes. Every companion is personally verified including photos — no fake profiles, no excessive retouching.', de: 'Ja. Jede Begleiterin wird persönlich verifiziert, auch die Fotos.', uk: 'Так. Кожну супутницю особисто перевіряємо, включно з фотографіями.' },
      },
      {
        q: { cs: 'Kde se s černovláskou potkám?', en: 'Where do I meet a dark-haired companion?', de: 'Wo treffe ich eine schwarzhaarige Begleiterin?', uk: 'Де я зустріну темноволосу супутницю?' },
        a: { cs: 'V diskrétním privátním apartmánu v centru Prahy ({districts}). Přesnou adresu obdržíte po potvrzení termínu.', en: 'In a discreet private apartment in central Prague ({districts}). Exact address sent after booking confirmation.', de: 'In einem diskreten privaten Apartment im Zentrum von Prag ({districts}).', uk: 'У дискретному приватному апартаменті у центрі Праги ({districts}).' },
      },
      {
        q: { cs: 'Nabízejí černovlásky GFE?', en: 'Do dark-haired companions offer GFE?', de: 'Bieten schwarzhaarige Begleiterinnen GFE an?', uk: 'Чи пропонують темноволосі супутниці GFE?' },
        a: { cs: 'Většina ano. GFE (Girlfriend Experience) je v profilu každé společnice — podívejte se do sekce služby u vybrané černovlásky.', en: 'Most do. GFE (Girlfriend Experience) is listed in each companion\'s profile — check the services section of your chosen dark-haired companion.', de: 'Die meisten ja. GFE ist im Profil jeder Begleiterin unter Dienstleistungen aufgeführt.', uk: 'Більшість так. GFE вказано у профілі кожної супутниці в секції послуг.' },
      },
    ],
    related: ['brunetky-praha', 'blondynky-praha', 'exoticke-krasky'],
  },

  'gfe-praha': {
    metaDesc: {
      cs: 'GFE Praha — Girlfriend Experience s ověřenými společnicemi. Autentické setkání jako s přítelkyní, diskrétní apartmány, transparentní ceny.',
      en: 'GFE Prague — Girlfriend Experience with verified companions. Authentic girlfriend-like encounter, discreet apartments, transparent pricing.',
      de: 'GFE Prag — Girlfriend Experience mit verifizierten Begleiterinnen. Authentisches Treffen wie mit der Freundin.',
      uk: 'GFE Прага — Girlfriend Experience з перевіреними супутницями. Автентична зустріч як з дівчиною.',
    },
    intro: {
      cs: 'GFE neboli Girlfriend Experience je nejoblíbenější styl setkání v LovelyGirls Praha. Není to mechanická služba — společnice s vámi tráví čas jako s přítelkyní: ležérní povídání, polibky, dotyky, intimní propojení a vzájemná chemie. Naše GFE společnice jsou osobně ověřené, mluví několika jazyky a vědí, jak vytvořit autentický zážitek bez umělé hry. GFE v Praze nabízí většina našich společnic a je součástí standardního programu. Programy 60+ minut jsou pro GFE doporučované — méně času znamená méně prostoru pro skutečné propojení. Setkání probíhají v diskrétních apartmánech v centru Prahy s vlastním vchodem a plným soukromím.',
      en: 'GFE — Girlfriend Experience — is the most popular style of encounter at LovelyGirls Prague. It\'s not mechanical: the companion spends time with you like a girlfriend would — casual conversation, kissing, touching, genuine intimacy and mutual chemistry. Our GFE companions are personally verified, multilingual, and know how to create an authentic experience without artificial performance. GFE is offered by most of our companions and is part of the standard program. 60+ minute programs are recommended — less time means less room for real connection. Meetings take place in discreet apartments in central Prague with private entrance and full privacy.',
      de: 'GFE — Girlfriend Experience — ist die beliebteste Art des Treffens bei LovelyGirls Prag. Die Begleiterin verbringt Zeit mit Ihnen wie eine Freundin — Gespräche, Küsse, Berührungen, echte Intimität und gegenseitige Chemie. Unsere GFE-Begleiterinnen sind persönlich verifiziert und mehrsprachig. GFE wird von den meisten unserer Begleiterinnen angeboten. Programme ab 60 Minuten empfohlen. Treffen in diskreten Apartments im Zentrum von Prag.',
      uk: 'GFE — Girlfriend Experience — найпопулярніший формат зустрічі у LovelyGirls Прага. Супутниця проводить час як дівчина: розмови, поцілунки, дотики, справжня близькість та взаємна хімія. Наші GFE-супутниці особисто перевірені та розмовляють кількома мовами. GFE пропонує більшість наших супутниць. Програми від 60 хвилин рекомендовані. Зустрічі у дискретних апартаментах у центрі Праги.',
    },
    faq: [
      {
        q: { cs: 'Co je Girlfriend Experience (GFE)?', en: 'What is Girlfriend Experience (GFE)?', de: 'Was ist Girlfriend Experience (GFE)?', uk: 'Що таке Girlfriend Experience (GFE)?' },
        a: { cs: 'GFE je styl setkání, kdy společnice vytváří atmosféru autentického rande — polibky, objímání, konverzace a vzájemná chemie. U LovelyGirls Praha nabízí GFE většina společnic.', en: 'GFE is a style of encounter where the companion creates the atmosphere of an authentic date — kissing, cuddling, conversation and mutual chemistry. At LovelyGirls Prague, most companions offer GFE.', de: 'GFE ist ein Treffensstil, bei dem die Begleiterin die Atmosphäre eines authentischen Dates schafft — Küsse, Umarmungen, Gespräche.', uk: 'GFE — стиль зустрічі, де супутниця створює атмосферу справжнього побачення — поцілунки, обійми, розмови та взаємна хімія.' },
      },
      {
        q: { cs: 'Kolik stojí GFE v Praze?', en: 'How much does GFE cost in Prague?', de: 'Was kostet GFE in Prag?', uk: 'Скільки коштує GFE у Празі?' },
        a: { cs: 'GFE je součástí standardního programu od 2 000 Kč za 30 minut. Konkrétní ceny najdete v našem ceníku.', en: 'GFE is part of the standard program starting from 2,000 CZK for 30 minutes. Specific prices on our pricing page.', de: 'GFE ist Teil des Standardprogramms ab 2.000 CZK für 30 Minuten. Preise auf unserer Preisseite.', uk: 'GFE є частиною стандартної програми від 2 000 CZK за 30 хвилин. Конкретні ціни у нашому прайсі.' },
      },
      {
        q: { cs: 'Co všechno GFE zahrnuje?', en: 'What does GFE include?', de: 'Was beinhaltet GFE?', uk: 'Що включає GFE?' },
        a: { cs: 'Polibky, něžné dotyky, oboustranný orální styk (s ochranou), klasický pohlavní styk, intimitu na úrovni přítelkyně. Konkrétní detaily dohodněte předem s vybranou společnicí.', en: 'Kissing, gentle touching, mutual oral (with protection), classic intercourse, girlfriend-level intimacy. Specifics arranged in advance with chosen companion.', de: 'Küssen, sanfte Berührungen, gegenseitiger Oralverkehr (geschützt), klassischer Geschlechtsverkehr.', uk: 'Поцілунки, ніжні дотики, оральний секс (з захистом), класичний секс, інтимність як з дівчиною.' },
      },
      {
        q: { cs: 'Jaké programy jsou pro GFE nejlepší?', en: 'Which programs are best for GFE?', de: 'Welche Programme eignen sich für GFE?', uk: 'Які програми найкращі для GFE?' },
        a: { cs: 'Doporučujeme 90 nebo 120 minut. Třicet minut na GFE nestačí — chybí prostor na pomalé propojení.', en: 'We recommend 90 or 120 minutes. Thirty minutes isn\'t enough for GFE — no time for slow connection.', de: 'Wir empfehlen 90 oder 120 Minuten.', uk: 'Рекомендуємо 90 або 120 хвилин.' },
      },
      {
        q: { cs: 'Nabízí GFE všechny vaše společnice?', en: 'Do all your companions offer GFE?', de: 'Bieten alle Begleiterinnen GFE an?', uk: 'Чи пропонують GFE усі ваші супутниці?' },
        a: { cs: 'Většina ano. V profilu každé společnice najdete seznam služeb, které nabízí. GFE je označeno jako „Girlfriend Experience" v sekci služby.', en: 'Most do. Each companion\'s profile lists their offered services. GFE is labeled as "Girlfriend Experience" in the services section.', de: 'Die meisten ja. Im Profil jeder Begleiterin finden Sie die Liste der angebotenen Dienste.', uk: 'Більшість так. У профілі кожної супутниці знайдете список послуг. GFE позначено як «Girlfriend Experience».' },
      },
    ],
    related: ['blondynky-praha', 'brunetky-praha', 'studentky-praha', 'luxusni-sluzby', 'elegantni-holky'],
  },

  'studentky-praha': {
    metaDesc: {
      cs: 'Studentky Praha — mladé ověřené společnice (18+), diskrétní setkání v centru. Transparentní ceny, ⭐ recenze, denně 10:00–22:30.',
      en: 'Student companions Prague — young verified escorts (18+), discreet central apartments. Transparent pricing, daily 10:00–22:30.',
      de: 'Studentinnen Prag — junge verifizierte Begleiterinnen (18+), diskrete Apartments im Zentrum.',
      uk: 'Студентки Прага — молоді перевірені супутниці (18+), дискретні апартаменти.',
    },
    intro: {
      cs: 'Mladé studentky v Praze — energické, otevřené a zvědavé společnice ve věku od 18+ let. Studují na pražských univerzitách, pracují s námi mimo školu a často mluví plynně anglicky či jinými cizími jazyky. Každá je osobně ověřená — máme zkontrolovaný občanský průkaz a písemný souhlas. Žádné nezletilé, žádné fake profily. Studentky jsou oblíbené pro svou přirozenost, bezprostřednost a hravou energii. Setkání probíhají v diskrétních apartmánech v centru Prahy. V profilu každé studentky najdete její věk, jazyky, fotogalerii a dostupné služby. Programy začínají od 30 minut.',
      en: 'Young student companions in Prague — energetic, open-minded, curious escorts aged 18+. They study at Prague universities, work with us outside class, and often speak fluent English or other languages. Every one personally verified — we check ID and have written consent. No underage, no fake profiles. Students are popular for their natural personality, spontaneity, and playful energy. Meetings take place in discreet apartments in central Prague. Each student\'s profile shows her age, languages, photo gallery, and available services. Programs start from 30 minutes.',
      de: 'Junge Studentinnen in Prag — energiegeladen, offen und neugierig, 18+. Sie studieren an Prager Universitäten und arbeiten nebenher mit uns. Jede ist persönlich verifiziert — Ausweis und schriftliche Zustimmung. Keine Minderjährigen, keine Fake-Profile. Studentinnen sind beliebt für ihre Natürlichkeit, Spontanität und verspielte Energie. Treffen in diskreten Apartments im Zentrum von Prag. Programme ab 30 Minuten.',
      uk: 'Молоді студентки у Празі — енергійні, відкриті та допитливі супутниці від 18 років. Навчаються у празьких університетах, працюють з нами поза заняттями, часто вільно говорять англійською та іншими мовами. Кожна особисто перевірена — перевіряємо посвідчення та маємо письмову згоду. Жодних неповнолітніх, жодних фейкових профілів. Студентки популярні завдяки природності, безпосередності та грайливій енергії. Зустрічі у дискретних апартаментах у центрі Праги.',
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
      {
        q: { cs: 'Kolik stojí setkání se studentkou?', en: 'How much does a meeting with a student companion cost?', de: 'Was kostet ein Treffen mit einer Studentin?', uk: 'Скільки коштує зустріч зі студенткою?' },
        a: { cs: 'Ceny jsou jednotné pro všechny společnice — od 2 000 Kč za 30 minut. Studentky nemají vyšší ani nižší ceny. Kompletní ceník na stránce Ceník.', en: 'Prices are the same for all companions — from 2,000 CZK for 30 minutes. Students have no higher or lower prices. Full pricing on the Pricing page.', de: 'Preise sind für alle Begleiterinnen gleich — ab 2.000 CZK. Kein Aufpreis für Studentinnen.', uk: 'Ціни єдині для всіх супутниць — від 2 000 CZK за 30 хвилин. Студентки не мають інших цін.' },
      },
      {
        q: { cs: 'Nabízejí studentky GFE?', en: 'Do student companions offer GFE?', de: 'Bieten Studentinnen GFE an?', uk: 'Чи пропонують студентки GFE?' },
        a: { cs: 'Většina studentek GFE (Girlfriend Experience) nabízí. Konkrétní služby najdete v profilu každé dívky v sekci Služby.', en: 'Most student companions offer GFE (Girlfriend Experience). Specific services listed in each girl\'s profile under Services.', de: 'Die meisten Studentinnen bieten GFE an. Details im jeweiligen Profil.', uk: 'Більшість студенток пропонують GFE (Girlfriend Experience). Конкретні послуги — у профілі кожної дівчини.' },
      },
    ],
    related: ['mlade-holky', 'blondynky-praha', 'brunetky-praha', 'gfe-praha', 'fit-holky'],
  },

  'spolecnice-praha': {
    metaDesc: {
      cs: 'Společnice Praha — {count} {companions} v centru. Diskrétní apartmány v centru Prahy. Transparentní ceny, ⭐ recenze, denně 10:00–22:30.',
      en: 'Companions Prague — {count} {companions} in central apartments. Transparent pricing, real reviews, daily 10:00–22:30.',
      de: 'Begleiterinnen Prag — {count} {companions} in zentralen Apartments.',
      uk: 'Супутниці Прага — {count} {companions} у центрі.',
    },
    intro: {
      cs: 'LovelyGirls Praha je prémiová agentura společnic v centru Prahy. Provozujeme diskrétní privátní apartmány v centru Prahy — {districts} — s osobně ověřenými společnicemi všech typů — blondýnky, brunetky, černovlásky, štíhlé, s křivkami, české i zahraniční. Každý profil je osobně ověřený, fotografie odpovídají realitě a ceny jsou jasně uvedené bez skrytých poplatků. Společnice mluví česky, anglicky a často i dalšími jazyky. Nabízíme programy od 30 minut po 120 minut, GFE (Girlfriend Experience), párové programy a další služby. Kontaktujte nás přes WhatsApp nebo Telegram pro okamžitou domluvu. Otevřeno denně 10:00–22:30.',
      en: 'LovelyGirls Prague is a premium companion agency in central Prague. We operate discreet private apartments in central Prague — {districts} — with personally verified companions of every type — blondes, brunettes, dark-haired, slim, curvy, Czech and international. Every profile is personally verified, photos match reality, and prices are clearly listed with no hidden fees. Companions speak Czech, English, and often additional languages. We offer programs from 30 to 120 minutes, GFE (Girlfriend Experience), couples programs, and more. Contact us via WhatsApp or Telegram for instant booking. Open daily 10:00–22:30.',
      de: 'LovelyGirls Prag ist eine Premium-Begleitagentur im Zentrum von Prag. Wir betreiben diskrete private Apartments im Zentrum von Prag — {districts} — mit persönlich verifizierten Begleiterinnen aller Typen — Blondinen, Brünette, schlank, kurvig, tschechische und internationale. Jedes Profil ist verifiziert, Fotos entsprechen der Realität, Preise transparent. Programme von 30 bis 120 Minuten, GFE und mehr. Kontakt via WhatsApp oder Telegram. Täglich 10:00–22:30.',
      uk: 'LovelyGirls Прага — преміальна агенція супутниць у центрі Праги. Ми керуємо дискретними приватними апартаментами у центрі Праги — {districts} — з особисто перевіреними супутницями всіх типів — блондинки, брюнетки, темноволосі, стрункі, пишні, чеські та міжнародні. Кожен профіль перевірений, фотографії відповідають реальності, ціни прозорі. Програми від 30 до 120 хвилин, GFE та інше. Зв\'яжіться через WhatsApp або Telegram. Щодня 10:00–22:30.',
    },
    faq: [
      {
        q: { cs: 'Kolik společnic je aktuálně k dispozici?', en: 'How many companions are currently available?', de: 'Wie viele Begleiterinnen sind verfügbar?', uk: 'Скільки супутниць наразі доступно?' },
        a: { cs: 'Aktuální dostupnost najdete v rozvrhu — aktualizujeme denně.', en: 'Live availability in the schedule, updated daily.', de: 'Aktuelle Verfügbarkeit im täglichen Zeitplan.', uk: 'Актуальна доступність — у графіку.' },
      },
      {
        q: { cs: 'Jak si vybrat společnici?', en: 'How do I choose a companion?', de: 'Wie wähle ich eine Begleiterin?', uk: 'Як обрати супутницю?' },
        a: { cs: 'Prohlédněte si profily na stránce Dívky — každý profil obsahuje fotogalerii, popis, služby, jazyky a tělesné parametry. Filtrujte podle typu (blondýnka, brunetka), lokace nebo služby. Po výběru nás kontaktujte přes WhatsApp.', en: 'Browse profiles on the Girls page — each profile includes photo gallery, description, services, languages, and body parameters. Filter by type (blonde, brunette), location, or service. After choosing, contact us via WhatsApp.', de: 'Profile auf der Mädchen-Seite durchsuchen — Fotos, Beschreibung, Dienste, Sprachen. Nach Auswahl via WhatsApp kontaktieren.', uk: 'Перегляньте профілі на сторінці Дівчата — кожен містить фотогалерею, опис, послуги, мови та параметри. Фільтруйте за типом або послугою. Зв\'яжіться через WhatsApp.' },
      },
      {
        q: { cs: 'Jaké platební metody přijímáte?', en: 'What payment methods do you accept?', de: 'Welche Zahlungsmethoden akzeptieren Sie?', uk: 'Які способи оплати приймаєте?' },
        a: { cs: 'Platba hotově na místě v apartmánu. Žádný úvodní poplatek, žádné zálohy online. Platíte až při setkání.', en: 'Cash payment on-site at the apartment. No upfront fee, no online deposits. You pay at the meeting.', de: 'Barzahlung vor Ort im Apartment. Keine Vorauszahlung, keine Online-Kaution.', uk: 'Оплата готівкою на місці в апартаменті. Жодних передоплат, жодних онлайн-депозитів.' },
      },
      {
        q: { cs: 'Jsou vaše společnice zdravotně testované?', en: 'Are your companions health-tested?', de: 'Werden die Begleiterinnen gesundheitlich getestet?', uk: 'Чи проходять супутниці медичні тести?' },
        a: { cs: 'Ano. Všechny společnice se pravidelně testují a dodržují přísné hygienické standardy. Ochrana je vždy povinná.', en: 'Yes. All companions are regularly tested and follow strict hygiene standards. Protection is always mandatory.', de: 'Ja. Alle Begleiterinnen werden regelmäßig getestet. Schutz ist immer Pflicht.', uk: 'Так. Усі супутниці регулярно тестуються та дотримуються суворих гігієнічних стандартів. Захист завжди обов\'язковий.' },
      },
    ],
    related: ['blondynky-praha', 'brunetky-praha', 'gfe-praha', 'studentky-praha', 'ceske-holky'],
  },

  'prirodni-poprsi': {
    metaDesc: {
      cs: 'Společnice s přírodním poprsím v Praze — ověřené dívky bez silikonu. Diskrétní apartmány, transparentní ceny.',
      en: 'Companions with natural breasts in Prague — verified girls without silicone. Discreet apartments, transparent pricing.',
      de: 'Begleiterinnen mit natürlicher Brust in Prag — verifiziert, ohne Silikon.',
      uk: 'Супутниці з натуральним бюстом у Празі — перевірені, без силікону.',
    },
    intro: {
      cs: 'Společnice s přírodním poprsím v Praze — autentický pocit a přirozený vzhled bez silikonu. Mnoho klientů preferuje přírodní poprsí pro jeho měkkost, přirozený tvar a autentický dotek. V LovelyGirls Praha nabízíme výběr ověřených společnic s přírodním poprsím různých velikostí — od menších po plnější. Každý profil obsahuje přesnou velikost prsou a jasné označení, zda jsou přírodní nebo s silikon, takže víte přesně, co očekávat. Fotografie odpovídají realitě a tělesné parametry jsou pravidelně kontrolovány. Setkání probíhají v diskrétních apartmánech v centru Prahy.',
      en: 'Companions with natural breasts in Prague — authentic feel and natural look without silicone. Many clients prefer natural breasts for their softness, natural shape, and authentic touch. At LovelyGirls Prague we offer a selection of verified companions with natural breasts of various sizes — from smaller to fuller. Each profile shows exact bust size and a clear indicator of natural or silicone, so you know exactly what to expect. Photos match reality and body measurements are regularly verified. Meetings in discreet apartments in central Prague.',
      de: 'Begleiterinnen mit natürlicher Brust in Prag — authentisches Gefühl und natürlicher Look ohne Silikon. Viele Klienten bevorzugen natürliche Brüste für ihre Weichheit und natürliche Form. Bei LovelyGirls Prag bieten wir verifizierte Begleiterinnen mit natürlicher Brust verschiedener Größen. Jedes Profil zeigt die genaue Brustgröße und eine klare Angabe natürlich/Silikon. Fotos entsprechen der Realität.',
      uk: 'Супутниці з натуральним бюстом у Празі — справжній вигляд і відчуття без силікону. Багато клієнтів надають перевагу натуральному бюсту за його м\'якість, природну форму та автентичний дотик. У LovelyGirls Прага пропонуємо перевірених супутниць з натуральним бюстом різних розмірів. Кожен профіль містить точний розмір та позначення натуральний/силікон. Фотографії відповідають реальності.',
    },
    faq: [
      {
        q: { cs: 'Jak poznám, že má společnice přírodní poprsí?', en: 'How do I know if breasts are natural?', de: 'Wie erkenne ich, ob die Brust natürlich ist?', uk: 'Як зрозуміти, що бюст натуральний?' },
        a: { cs: 'V profilu každé dívky je u sloupce „Prsa" označení (přírodní/silikon). Také najdete přesnou velikost — žádné dohady.', en: 'Each profile has a "Bust" field with natural/silicone indicator plus exact size — no guesswork.', de: 'Im Profil ist die Angabe natürlich/Silikon plus exakte Größe.', uk: 'У профілі вказано натуральні/силікон та точний розмір.' },
      },
      {
        q: { cs: 'Kolik společnic s přírodním poprsím máte?', en: 'How many companions with natural breasts do you have?', de: 'Wie viele Begleiterinnen mit natürlicher Brust haben Sie?', uk: 'Скільки супутниць з натуральним бюстом у вас є?' },
        a: { cs: 'Většina našich společnic má přírodní poprsí. Aktuální počet a dostupnost najdete na stránce Dívky — filtrujte podle hashtagu „přírodní poprsí".', en: 'Most of our companions have natural breasts. Current count and availability on the Girls page — filter by the "natural breasts" hashtag.', de: 'Die meisten unserer Begleiterinnen haben natürliche Brüste. Aktuell auf der Mädchen-Seite filtern.', uk: 'Більшість наших супутниць мають натуральний бюст. Актуальна кількість — на сторінці Дівчата.' },
      },
      {
        q: { cs: 'Mají společnice s přírodním poprsím stejný ceník?', en: 'Do companions with natural breasts have the same pricing?', de: 'Haben Begleiterinnen mit natürlicher Brust die gleichen Preise?', uk: 'Чи мають супутниці з натуральним бюстом такий же прайс?' },
        a: { cs: 'Ano. Ceník je jednotný pro všechny společnice bez ohledu na typ poprsí. Programy od 30 do 120 minut.', en: 'Yes. Pricing is the same for all companions regardless of breast type. Programs from 30 to 120 minutes.', de: 'Ja. Preise sind für alle Begleiterinnen gleich. Programme von 30 bis 120 Minuten.', uk: 'Так. Ціни однакові для всіх супутниць незалежно від типу бюсту. Програми від 30 до 120 хвилин.' },
      },
      {
        q: { cs: 'Mohu si vybrat společnici podle velikosti poprsí?', en: 'Can I choose a companion by breast size?', de: 'Kann ich nach Brustgröße wählen?', uk: 'Чи можу обрати супутницю за розміром бюсту?' },
        a: { cs: 'Ano. V profilu každé společnice najdete přesný rozměr a typ poprsí. Prohlédněte si profily na stránce Dívky a vyberte si podle svých preferencí.', en: 'Yes. Each companion\'s profile shows exact bust measurement and type. Browse profiles on the Girls page and choose by your preference.', de: 'Ja. Im Profil jeder Begleiterin finden Sie genaue Maße und Typ. Auf der Mädchen-Seite auswählen.', uk: 'Так. У профілі кожної супутниці знайдете точний розмір та тип бюсту. Оберіть на сторінці Дівчата.' },
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
      {
        q: { cs: 'Mohu si vybrat společnici podle stylu tetování?', en: 'Can I choose a companion by tattoo style?', de: 'Kann ich eine Begleiterin nach Tattoo-Stil auswählen?', uk: 'Чи можу обрати супутницю за стилем татуювання?' },
        a: { cs: 'Ano. V profilu každé společnice je popis tetování a fotogalerie, kde tetování uvidíte. Filtrujte podle hashtagu Tetování a prohlédněte si profily.', en: 'Yes. Each companion\'s profile includes a tattoo description and photo gallery where you can see the tattoos. Filter by the Tattoo hashtag and browse profiles.', de: 'Ja. Im Profil jeder Begleiterin finden Sie Tattoo-Beschreibung und Fotogalerie.', uk: 'Так. У профілі кожної супутниці є опис татуювань і фотогалерея.' },
      },
      {
        q: { cs: 'Mají tetované společnice stejný ceník?', en: 'Do tattooed companions have the same pricing?', de: 'Haben tätowierte Begleiterinnen die gleichen Preise?', uk: 'Чи однакові ціни у татуйованих супутниць?' },
        a: { cs: 'Ano. Ceník je jednotný pro všechny společnice bez ohledu na vzhled — od 2 000 Kč za 30 minut.', en: 'Yes. Pricing is the same for all companions regardless of appearance — from 2,000 CZK for 30 minutes.', de: 'Ja. Die Preise sind für alle Begleiterinnen gleich — ab 2.000 CZK für 30 Minuten.', uk: 'Так. Ціни єдині для всіх супутниць — від 2 000 CZK за 30 хвилин.' },
      },
    ],
    related: ['piercing-holky', 'sexy-holky', 'fit-holky'],
  },

  'escort-prague': {
    metaDesc: {
      cs: 'Escort Praha — {count} ověřených společnic v privátních apartmánech v centru Prahy. Transparentní ceny, ověřené fotky, denně 10–22:30.',
      en: 'Escort Prague — {count} verified companions in private central apartments. Transparent pricing, verified photos, daily 10–22:30. Cash only, no hidden fees.',
      de: 'Escort Prag — {count} verifizierte Begleiterinnen in privaten Apartments im Zentrum. Transparente Preise, täglich 10–22:30.',
      uk: 'Ескорт Прага — {count} перевірених супутниць у приватних апартаментах у центрі. Прозорі ціни, щодня 10–22:30.',
    },
    intro: {
      cs: 'LovelyGirls je escort agentura v Praze s {count} osobně ověřenými společnicemi a třemi vlastními apartmány v centru — {districts}. Na fotkách je vždy ta žena, která vám otevře dveře. Pracujeme výhradně incall — navštívíte náš diskrétní apartmán. Programy od 30 do 120 minut za jednotné ceny, v ceně apartmán i sprcha. Kontaktujte nás přes WhatsApp nebo Telegram, dostupnost potvrdíme během minut. Platba hotově na místě, žádné zálohy ani příplatky.',
      en: 'LovelyGirls is a Prague escort agency with {count} personally verified companions and three private apartments in the centre — {districts}. The photos always show the woman who opens the door. We work exclusively incall — you visit our discreet apartment. Programs from 30 to 120 minutes at flat rates, apartment and shower included. Contact us via WhatsApp or Telegram, we confirm availability within minutes. Cash on arrival, no deposits or hidden fees.',
      de: 'LovelyGirls ist eine Escort-Agentur in Prag mit {count} persönlich verifizierten Begleiterinnen und drei privaten Apartments im Zentrum — {districts}. Auf den Fotos ist immer die Frau, die Ihnen die Tür öffnet. Ausschließlich Incall — Sie besuchen unser Apartment. Programme von 30 bis 120 Minuten zu Festpreisen, Apartment und Dusche inklusive. Kontakt via WhatsApp oder Telegram. Barzahlung vor Ort.',
      uk: 'LovelyGirls — ескорт-агенція у Празі з {count} особисто перевіреними супутницями та трьома приватними апартаментами в центрі — {districts}. На фото завжди та жінка, яка відчинить двері. Працюємо виключно incall — ви відвідуєте наш апартамент. Програми від 30 до 120 хвилин за фіксованими цінами, апартамент і душ включені. Зв\'яжіться через WhatsApp або Telegram. Оплата готівкою на місці.',
    },
    faq: [
      {
        q: { cs: 'Jak si zarezervovat escort v Praze?', en: 'How do I book an escort in Prague?', de: 'Wie buche ich eine Escort in Prag?', uk: 'Як замовити ескорт у Празі?' },
        a: { cs: 'Vyberte si společnici z galerie, zkontrolujte rozvrh a napište nám přes WhatsApp nebo Telegram. Potvrdíme dostupnost a pošleme adresu apartmánu. Žádná registrace ani záloha.', en: 'Pick a companion from the gallery, check the schedule, and message us on WhatsApp or Telegram. We confirm availability and send the apartment address. No registration or deposit needed.', de: 'Begleiterin aus der Galerie wählen, Zeitplan prüfen, via WhatsApp oder Telegram kontaktieren. Bestätigung und Adresse folgen sofort.', uk: 'Оберіть супутницю з галереї, перевірте графік і напишіть нам у WhatsApp або Telegram. Підтвердимо доступність і надішлемо адресу.' },
      },
      {
        q: { cs: 'Kolik stojí escort v Praze?', en: 'How much does a Prague escort cost?', de: 'Was kostet eine Escort in Prag?', uk: 'Скільки коштує ескорт у Празі?' },
        a: { cs: 'Ceny jsou za čas — programy od 30 do 120 minut. Jednotná sazba pro všechny společnice, v ceně apartmán a sprcha. Kompletní ceník na stránce Ceník. Platba hotově, žádné příplatky.', en: 'Pricing is time-based — programs from 30 to 120 minutes. Same rate for every companion, apartment and shower included. Full pricing on the Pricing page. Cash only, no surcharges.', de: 'Zeitbasierte Preise — Programme von 30 bis 120 Minuten. Gleicher Tarif für alle Begleiterinnen, Apartment und Dusche inklusive. Barzahlung, keine Zuschläge.', uk: 'Ціни за часом — програми від 30 до 120 хвилин. Однакова ставка для всіх супутниць, апартамент і душ включені. Оплата готівкою.' },
      },
      {
        q: { cs: 'Jsou fotky escort společnic skutečné?', en: 'Are the escort photos real?', de: 'Sind die Escort-Fotos echt?', uk: 'Чи справжні фото ескорт-супутниць?' },
        a: { cs: 'Ano. Každou společnici ověřujeme osobně. Na fotkách je ta žena, která vám otevře — žádné stock fotky, žádné úpravy postav.', en: 'Yes. Every companion is verified in person by our team. The photos show the woman who opens the door — no stock images, no body editing.', de: 'Ja. Jede Begleiterin wird persönlich verifiziert. Auf den Fotos ist die Frau, die Ihnen die Tür öffnet.', uk: 'Так. Кожну супутницю перевіряємо особисто. На фото — та жінка, яка відчинить двері.' },
      },
      {
        q: { cs: 'Je escort v Praze legální?', en: 'Is escort legal in Prague?', de: 'Ist Escort in Prag legal?', uk: 'Чи легальний ескорт у Празі?' },
        a: { cs: 'Ano. Námutí dospělé společnice je v České republice legální pro klienty od 18 let. LovelyGirls pracuje transparentně s ověřenými společnicemi a registrovanými prostory.', en: 'Yes. Hiring an adult companion is legal in the Czech Republic for clients aged 18+. LovelyGirls operates transparently with verified companions and registered premises.', de: 'Ja. Die Buchung einer Begleiterin ist in Tschechien für Kunden ab 18 legal. LovelyGirls arbeitet transparent.', uk: 'Так. Замовлення дорослої супутниці у Чехії легальне для клієнтів від 18 років.' },
      },
      {
        q: { cs: 'Nabízíte outcall nebo návštěvy v hotelu?', en: 'Do you offer outcall or hotel visits?', de: 'Bieten Sie Outcall oder Hotelbesuche an?', uk: 'Чи є виїзд або візити в готель?' },
        a: { cs: 'Ne. LovelyGirls pracuje výhradně incall — navštívíte náš apartmán v centru Prahy. Díky tomu garantujeme soukromí a kvalitu pro obě strany.', en: 'No. LovelyGirls works exclusively incall — you visit our apartment in central Prague. This ensures privacy and quality for both sides.', de: 'Nein. Ausschließlich Incall — Sie besuchen unser Apartment. Das sichert Privatsphäre und Qualität.', uk: 'Ні. Тільки incall — ви відвідуєте наш апартамент у центрі Праги.' },
      },
    ],
    related: ['spolecnice-praha', 'sex-praha', 'vip-escort-praha', 'luxusni-spolecnice-praha', 'gfe-praha'],
  },

  'escort-praha': {
    metaDesc: {
      cs: 'Escort Praha — {count} ověřených společnic v privátních apartmánech. Ověřené fotky, jasné ceny od 2 000 Kč, denně 10–22:30.',
      en: 'Escort Prague — {count} verified companions in private apartments. Verified photos, clear pricing from 2,000 CZK, daily 10–22:30.',
      de: 'Escort Prag — {count} verifizierte Begleiterinnen in privaten Apartments. Ab 2.000 CZK, täglich 10–22:30.',
      uk: 'Ескорт Прага — {count} перевірених супутниць у приватних апартаментах. Від 2 000 CZK, щодня 10–22:30.',
    },
    intro: {
      cs: 'Hledáte escort v Praze? LovelyGirls je prémiová agentura s {count} osobně ověřenými společnicemi a třemi vlastními apartmány — {districts}. Každá společnice prochází osobním pohovorem a fotoverifikací. Pracujeme výhradně incall, programy od 30 do 120 minut za jednotné ceny. Kontaktujte nás přes WhatsApp nebo Telegram.',
      en: 'Looking for escort in Prague? LovelyGirls is a premium agency with {count} personally verified companions and three private apartments — {districts}. Every companion is interviewed and photo-verified in person. Incall only, programs from 30 to 120 minutes at flat rates. Contact us via WhatsApp or Telegram.',
      de: 'Escort in Prag gesucht? LovelyGirls ist eine Premium-Agentur mit {count} verifizierten Begleiterinnen und drei privaten Apartments — {districts}. Ausschließlich Incall, Programme von 30 bis 120 Minuten.',
      uk: 'Шукаєте ескорт у Празі? LovelyGirls — преміальна агенція з {count} перевіреними супутницями та трьома приватними апартаментами — {districts}. Тільки incall, програми від 30 до 120 хвилин.',
    },
    faq: [
      {
        q: { cs: 'Kde se nachází apartmány pro escort v Praze?', en: 'Where are the Prague escort apartments?', de: 'Wo befinden sich die Escort-Apartments in Prag?', uk: 'Де знаходяться ескорт-апартаменти у Празі?' },
        a: { cs: 'Tři privátní apartmány v centru — {districts}. Přesné adresy sdělujeme po domluvení schůzky. Všechny lokace jsou diskrétní a snadno dostupné metrem.', en: 'Three private apartments in the centre — {districts}. Exact addresses shared after booking. All locations are discreet and easily reached by metro.', de: 'Drei Apartments im Zentrum — {districts}. Adressen nach Buchung. Diskret, per Metro erreichbar.', uk: 'Три апартаменти в центрі — {districts}. Адреси — після бронювання. Дискретні, зручні для метро.' },
      },
      {
        q: { cs: 'Jak rychle mohu domluvit schůzku?', en: 'How quickly can I arrange a meeting?', de: 'Wie schnell kann ich ein Treffen vereinbaren?', uk: 'Як швидко можна домовитися про зустріч?' },
        a: { cs: 'Většinou do několika minut. Napište přes WhatsApp nebo Telegram, potvrdíme dostupnost a pošleme adresu. Některé společnice přijímají i klienty bez předchozí domluvy, ale doporučujeme kontaktovat nás alespoň 30 minut předem.', en: 'Usually within minutes. Message via WhatsApp or Telegram, we confirm and send the address. Some companions accept walk-ins, but we recommend contacting us at least 30 minutes ahead.', de: 'Meist innerhalb von Minuten via WhatsApp/Telegram. Mindestens 30 Minuten Vorlauf empfohlen.', uk: 'Зазвичай за кілька хвилин через WhatsApp або Telegram. Рекомендуємо зв\'язатися мінімум за 30 хвилин.' },
      },
      {
        q: { cs: 'Jaké služby escort společnice nabízí?', en: 'What services do Prague escorts offer?', de: 'Welche Dienste bieten Prager Escorts an?', uk: 'Які послуги пропонують ескорт-супутниці?' },
        a: { cs: 'Klasika, GFE, masáže, erotické masáže a další — kompletní seznam služeb najdete v profilu každé společnice. Služby se mohou lišit, vždy zkontrolujte profil.', en: 'Classic, GFE, massages, erotic massages, and more — full service list in each companion\'s profile. Services vary, always check the profile.', de: 'Klassik, GFE, Massagen und mehr — vollständige Liste im Profil jeder Begleiterin.', uk: 'Класика, GFE, масажі та інше — повний список у профілі кожної супутниці.' },
      },
    ],
    related: ['escort-prague', 'spolecnice-praha', 'sex-praha', 'vip-escort-praha', 'gfe-praha'],
  },

  'sex-praha': {
    metaDesc: {
      cs: 'Sex Praha — {count} ověřených společnic v privátních apartmánech. Diskrétní setkání v centru Prahy, jasné ceny, žádné příplatky.',
      en: 'Sex Prague — {count} verified companions in private apartments. Discreet meetings in central Prague, clear pricing, no hidden fees.',
      de: 'Sex Prag — {count} verifizierte Begleiterinnen in privaten Apartments im Zentrum.',
      uk: 'Секс Прага — {count} перевірених супутниць у приватних апартаментах у центрі.',
    },
    intro: {
      cs: 'Hledáte diskrétní sex v Praze? LovelyGirls nabízí {count} osobně ověřených společnic ve třech privátních apartmánech v centru — {districts}. Žádné veřejné prostory, žádní prostředníci. Fotky odpovídají realitě, ceny jsou jasné a jednotné. Programy od 30 do 120 minut, v ceně apartmán a sprcha. Setkání domluvíte přes WhatsApp nebo Telegram, adresu sdělíme po potvrzení.',
      en: 'Looking for discreet sex in Prague? LovelyGirls offers {count} personally verified companions in three private apartments in the centre — {districts}. No public venues, no middlemen. Photos match reality, pricing is clear and uniform. Programs from 30 to 120 minutes, apartment and shower included. Arrange via WhatsApp or Telegram, address shared after confirmation.',
      de: 'Diskreter Sex in Prag? LovelyGirls bietet {count} verifizierte Begleiterinnen in drei privaten Apartments im Zentrum — {districts}. Keine öffentlichen Orte, keine Vermittler. Fotos entsprechen der Realität, transparente Preise. Programme von 30 bis 120 Minuten.',
      uk: 'Шукаєте дискретний секс у Празі? LovelyGirls пропонує {count} перевірених супутниць у трьох приватних апартаментах у центрі — {districts}. Жодних публічних місць, жодних посередників. Фото відповідають реальності, ціни прозорі. Програми від 30 до 120 хвилин.',
    },
    faq: [
      {
        q: { cs: 'Je sex v Praze bezpečný?', en: 'Is sex in Prague safe?', de: 'Ist Sex in Prag sicher?', uk: 'Чи безпечний секс у Празі?' },
        a: { cs: 'U LovelyGirls ano. Pracujeme ve vlastních apartmánech, všechny společnice jsou ověřené a pravidelně testované. Ochrana je vždy povinná.', en: 'At LovelyGirls, yes. We operate our own apartments, all companions are verified and regularly tested. Protection is always mandatory.', de: 'Bei LovelyGirls ja. Eigene Apartments, alle Begleiterinnen verifiziert und getestet. Schutz immer Pflicht.', uk: 'У LovelyGirls так. Власні апартаменти, всі супутниці перевірені та протестовані. Захист завжди обов\'язковий.' },
      },
      {
        q: { cs: 'Kde probíhají setkání?', en: 'Where do meetings take place?', de: 'Wo finden die Treffen statt?', uk: 'Де проходять зустрічі?' },
        a: { cs: 'Ve třech privátních apartmánech v centru Prahy — {districts}. Diskrétní, čisté, vybavené sprchou. Adresu sdělíme po domluvení schůzky.', en: 'In three private apartments in central Prague — {districts}. Discreet, clean, equipped with shower. Address shared after booking.', de: 'In drei privaten Apartments im Zentrum — {districts}. Diskret, sauber, mit Dusche.', uk: 'У трьох приватних апартаментах у центрі — {districts}. Дискретні, чисті, з душем.' },
      },
      {
        q: { cs: 'Kolik stojí sex v Praze u LovelyGirls?', en: 'How much does it cost at LovelyGirls?', de: 'Was kostet es bei LovelyGirls?', uk: 'Скільки коштує у LovelyGirls?' },
        a: { cs: 'Programy od 30 do 120 minut za jednotné ceny. V ceně apartmán i sprcha. Kompletní ceník na stránce Ceník. Hotově na místě.', en: 'Programs from 30 to 120 minutes at flat rates. Apartment and shower included. Full pricing on the Pricing page. Cash on arrival.', de: 'Programme von 30 bis 120 Minuten zu Festpreisen. Apartment und Dusche inklusive. Barzahlung vor Ort.', uk: 'Програми від 30 до 120 хвилин за фіксованими цінами. Апартамент і душ включені. Оплата готівкою.' },
      },
    ],
    related: ['escort-prague', 'escort-praha', 'spolecnice-praha', 'gfe-praha', 'vip-escort-praha'],
  },

  'vip-escort-praha': {
    metaDesc: {
      cs: 'VIP Escort Praha — exkluzivní společnice v privátních apartmánech. Osobně ověřené, diskrétní, denně 10–22:30.',
      en: 'VIP Escort Prague — exclusive companions in private apartments. Personally verified, discreet, daily 10–22:30.',
      de: 'VIP Escort Prag — exklusive Begleiterinnen in privaten Apartments.',
      uk: 'VIP Ескорт Прага — ексклюзивні супутниці у приватних апартаментах.',
    },
    intro: {
      cs: 'VIP escort v Praze od LovelyGirls — {count} exkluzivních společnic v privátních apartmánech v centru Prahy — {districts}. Každá společnice prochází osobním pohovorem a fotoverifikací. VIP programy od 60 do 120 minut zahrnují apartmán, sprchu a plný komfort. Pro VIP klienty nabízíme prioritní rezervace a osobní přístup. Kontaktujte nás přes WhatsApp nebo Telegram.',
      en: 'VIP escort in Prague by LovelyGirls — {count} exclusive companions in private central apartments — {districts}. Every companion is interviewed and photo-verified. VIP programs from 60 to 120 minutes include apartment, shower, and full comfort. Priority booking and personal service for VIP clients. Contact via WhatsApp or Telegram.',
      de: 'VIP Escort in Prag von LovelyGirls — {count} exklusive Begleiterinnen in privaten Apartments im Zentrum — {districts}. VIP-Programme von 60 bis 120 Minuten. Prioritätsbuchung für VIP-Kunden.',
      uk: 'VIP ескорт у Празі від LovelyGirls — {count} ексклюзивних супутниць у приватних апартаментах у центрі — {districts}. VIP програми від 60 до 120 хвилин. Пріоритетне бронювання для VIP клієнтів.',
    },
    faq: [
      {
        q: { cs: 'Co zahrnuje VIP escort program?', en: 'What does the VIP escort program include?', de: 'Was beinhaltet das VIP-Programm?', uk: 'Що включає VIP ескорт програму?' },
        a: { cs: 'VIP programy zahrnují delší čas (60–120 min), privátní apartmán, sprchu a plné pohodlí. Konkrétní služby závisí na společnici — podrobnosti v profilu.', en: 'VIP programs include longer time (60–120 min), private apartment, shower, and full comfort. Specific services depend on the companion — details in her profile.', de: 'VIP-Programme: längere Zeit (60–120 Min), privates Apartment, Dusche, voller Komfort. Details im Profil.', uk: 'VIP програми: більше часу (60–120 хв), приватний апартамент, душ, повний комфорт. Деталі у профілі.' },
      },
      {
        q: { cs: 'Jak se liší VIP od standardního programu?', en: 'How is VIP different from standard?', de: 'Wie unterscheidet sich VIP vom Standard?', uk: 'Чим VIP відрізняється від стандартного?' },
        a: { cs: 'VIP klienti mají prioritní rezervace, delší programy a osobní přístup. Ceník je transparentní — rozdíl je v délce programu, ne v přirážkách.', en: 'VIP clients get priority booking, longer programs, and personal service. Pricing is transparent — the difference is in program length, not surcharges.', de: 'Prioritätsbuchung, längere Programme, persönlicher Service. Transparente Preise ohne Zuschläge.', uk: 'Пріоритетне бронювання, довші програми, персональний сервіс. Прозорі ціни без надбавок.' },
      },
    ],
    related: ['escort-prague', 'luxusni-spolecnice-praha', 'gfe-praha', 'elegantni-holky'],
  },

  'luxusni-spolecnice-praha': {
    metaDesc: {
      cs: 'Luxusní společnice Praha — prémiové escort služby v privátních apartmánech. Ověřené profily, transparentní ceny.',
      en: 'Luxury companions Prague — premium escort services in private apartments. Verified profiles, transparent pricing.',
      de: 'Luxus-Begleiterinnen Prag — Premium-Escort in privaten Apartments.',
      uk: 'Розкішні супутниці Прага — преміальний ескорт у приватних апартаментах.',
    },
    intro: {
      cs: 'Luxusní společnice v Praze od LovelyGirls — {count} prémiových společnic ve vlastních apartmánech v centru — {districts}. Elegantní, vzdělané a osobně ověřené. Nabízíme programy od 30 do 120 minut, GFE (Girlfriend Experience), párové programy a další prémiové služby. Fotografie odpovídají realitě, ceny jasné a bez příplatků.',
      en: 'Luxury companions in Prague by LovelyGirls — {count} premium companions in our own central apartments — {districts}. Elegant, educated, and personally verified. Programs from 30 to 120 minutes, GFE (Girlfriend Experience), couples programs, and more. Photos match reality, pricing clear with no surcharges.',
      de: 'Luxus-Begleiterinnen in Prag — {count} Premium-Begleiterinnen in eigenen Apartments im Zentrum — {districts}. Elegant, gebildet, persönlich verifiziert. Programme von 30 bis 120 Minuten, GFE und mehr.',
      uk: 'Розкішні супутниці у Празі від LovelyGirls — {count} преміальних супутниць у власних апартаментах у центрі — {districts}. Елегантні, освічені, особисто перевірені. Програми від 30 до 120 хвилин, GFE та інше.',
    },
    faq: [
      {
        q: { cs: 'Co dělá společnici luxusní?', en: 'What makes a companion luxury?', de: 'Was macht eine Begleiterin zur Luxus-Begleiterin?', uk: 'Що робить супутницю розкішною?' },
        a: { cs: 'Osobní ověření, profesionální přístup, elegantní vzhled a široká nabídka služeb včetně GFE. Každá společnice u nás prochází osobním pohovorem.', en: 'Personal verification, professional approach, elegant appearance, and a wide range of services including GFE. Every companion at LovelyGirls is personally interviewed.', de: 'Persönliche Verifizierung, professioneller Ansatz, elegantes Auftreten und breites Serviceangebot.', uk: 'Особиста перевірка, професійний підхід, елегантний вигляд та широкий спектр послуг включаючи GFE.' },
      },
      {
        q: { cs: 'Jaký je rozdíl mezi luxusní a běžnou společnicí?', en: 'What is the difference between luxury and standard?', de: 'Was ist der Unterschied zwischen Luxus und Standard?', uk: 'Яка різниця між розкішною та стандартною супутницею?' },
        a: { cs: 'U LovelyGirls jsou všechny společnice na prémiové úrovni — ověřené, s profesionálním přístupem. Ceník je jednotný, rozdíly jsou v nabídce služeb a osobnosti.', en: 'At LovelyGirls, all companions are at a premium level — verified, with a professional approach. Pricing is uniform; differences are in services offered and personality.', de: 'Bei LovelyGirls sind alle Begleiterinnen auf Premium-Niveau. Einheitliche Preise, Unterschiede bei Services und Persönlichkeit.', uk: 'У LovelyGirls всі супутниці на преміальному рівні. Єдині ціни, відмінності у послугах та особистості.' },
      },
    ],
    related: ['vip-escort-praha', 'escort-prague', 'elegantni-holky', 'gfe-praha', 'spolecnice-praha'],
  },

  'fit-holky': {
    metaDesc: {
      cs: 'Fit společnice Praha — sportovní a atletické společnice s vytvarovanou postavou. Ověřené profily, diskrétní apartmány v centru.',
      en: 'Fit companions Prague — athletic and toned escorts with sculpted bodies. Verified profiles, discreet central apartments.',
      de: 'Sportliche Begleiterinnen Prag — athletisch und durchtrainiert. Verifizierte Profile, diskrete Apartments.',
      uk: 'Спортивні супутниці Прага — атлетичні та підтягнуті. Перевірені профілі, дискретні апартаменти.',
    },
    intro: {
      cs: 'Fit společnice v Praze — sportovní, atletické a s vytvarovanou postavou. Tyto společnice aktivně sportují a dbají na svou kondici, což se odráží v jejich vzhledu i energii. Každý profil je osobně ověřený, fotografie odpovídají realitě. Setkání probíhají v diskrétních apartmánech v centru Prahy.',
      en: 'Fit companions in Prague — athletic, toned, and with sculpted bodies. These companions actively exercise and maintain their fitness, which shows in their appearance and energy. Every profile is personally verified, photos match reality. Meetings in discreet apartments in central Prague.',
      de: 'Sportliche Begleiterinnen in Prag — athletisch, durchtrainiert und mit geformtem Körper. Jedes Profil ist persönlich verifiziert. Treffen in diskreten Apartments im Zentrum von Prag.',
      uk: 'Спортивні супутниці у Празі — атлетичні, підтягнуті, з виліпленою фігурою. Кожен профіль особисто перевірений. Зустрічі у дискретних апартаментах у центрі Праги.',
    },
    faq: [
      {
        q: { cs: 'Jak poznám, že je společnice fit?', en: 'How do I know a companion is fit?', de: 'Woran erkenne ich eine sportliche Begleiterin?', uk: 'Як я дізнаюся, що супутниця спортивна?' },
        a: { cs: 'V profilu každé společnice je uvedena postava a fotogalerie. Fit společnice mají štíhlou a atletickou postavu, kterou uvidíte na ověřených fotografiích.', en: 'Each companion\'s profile shows body type and photo gallery. Fit companions have a slim and athletic figure, visible in verified photos.', de: 'Im Profil jeder Begleiterin finden Sie Körpertyp und Fotogalerie.', uk: 'У профілі кожної супутниці вказано тип фігури і фотогалерея.' },
      },
      {
        q: { cs: 'Kolik fit společnic máte k dispozici?', en: 'How many fit companions do you have?', de: 'Wie viele sportliche Begleiterinnen haben Sie?', uk: 'Скільки спортивних супутниць у вас є?' },
        a: { cs: 'Aktuální počet a dostupnost fit společnic najdete v rozvrhu — aktualizujeme denně.', en: 'Current availability of fit companions is in the live schedule, updated daily.', de: 'Aktuelle Verfügbarkeit im täglichen Zeitplan.', uk: 'Актуальна доступність — у графіку, оновлюється щодня.' },
      },
      {
        q: { cs: 'Mají fit společnice jiný ceník?', en: 'Do fit companions have different pricing?', de: 'Haben sportliche Begleiterinnen andere Preise?', uk: 'Чи мають спортивні супутниці інші ціни?' },
        a: { cs: 'Ne. Ceník je jednotný pro všechny společnice bez ohledu na postavu — od 2 000 Kč za 30 minut.', en: 'No. Pricing is the same for all companions regardless of body type — from 2,000 CZK for 30 minutes.', de: 'Nein. Einheitliche Preise für alle Begleiterinnen — ab 2.000 CZK.', uk: 'Ні. Ціни єдині для всіх супутниць — від 2 000 CZK за 30 хвилин.' },
      },
    ],
    related: ['stihla-postava', 'dokonale-telo', 'studentky-praha', 'prirodni-poprsi'],
  },

  'ceske-holky': {
    metaDesc: {
      cs: 'České společnice Praha — rodilé Češky s plynulou češtinou a angličtinou. Ověřené profily, diskrétní apartmány v centru Prahy.',
      en: 'Czech companions Prague — native Czech escorts with fluent Czech and English. Verified profiles, discreet central apartments.',
      de: 'Tschechische Begleiterinnen Prag — Muttersprachlerinnen mit fließendem Tschechisch und Englisch. Verifiziert.',
      uk: 'Чеські супутниці Прага — чеські дівчата з вільною чеською та англійською. Перевірені профілі.',
    },
    intro: {
      cs: 'České společnice v Praze — rodilé Češky, které perfektně rozumí české mentalitě a kultuře. Komunikace bez bariér, přirozený humor a bezprostřednost. Každá je osobně ověřená, fotografie odpovídají realitě. Setkání v diskrétních apartmánech v centru Prahy.',
      en: 'Czech companions in Prague — native Czech women who perfectly understand local culture and mentality. Barrier-free communication, natural humour, and spontaneity. Every one personally verified, photos match reality. Meetings in discreet apartments in central Prague.',
      de: 'Tschechische Begleiterinnen in Prag — einheimische Frauen, die die lokale Kultur und Mentalität perfekt verstehen. Jede persönlich verifiziert. Treffen in diskreten Apartments im Zentrum.',
      uk: 'Чеські супутниці у Празі — місцеві дівчата, які чудово розуміють чеську культуру та менталітет. Кожна особисто перевірена. Зустрічі у дискретних апартаментах у центрі Праги.',
    },
    faq: [
      {
        q: { cs: 'Jakými jazyky české společnice mluví?', en: 'What languages do Czech companions speak?', de: 'Welche Sprachen sprechen tschechische Begleiterinnen?', uk: 'Якими мовами говорять чеські супутниці?' },
        a: { cs: 'Všechny mluví plynně česky a většina i anglicky. Některé ovládají i němčinu nebo ruštinu. Jazyky najdete v profilu každé společnice.', en: 'All speak fluent Czech and most speak English too. Some also speak German or Russian. Languages are listed in each companion\'s profile.', de: 'Alle sprechen fließend Tschechisch, die meisten auch Englisch. Sprachen im Profil aufgeführt.', uk: 'Усі вільно говорять чеською, більшість і англійською. Мови вказані у профілі.' },
      },
      {
        q: { cs: 'Kolik českých společnic máte?', en: 'How many Czech companions do you have?', de: 'Wie viele tschechische Begleiterinnen haben Sie?', uk: 'Скільки чеських супутниць у вас є?' },
        a: { cs: 'Aktuální počet a dostupnost najdete v rozvrhu — aktualizujeme denně. České společnice tvoří významnou část našeho týmu.', en: 'Current availability is in the live schedule, updated daily. Czech companions make up a significant part of our team.', de: 'Aktuelle Verfügbarkeit im täglichen Zeitplan.', uk: 'Актуальна доступність — у графіку. Чеські супутниці складають значну частину нашого колективу.' },
      },
      {
        q: { cs: 'Jsou české společnice dražší?', en: 'Are Czech companions more expensive?', de: 'Sind tschechische Begleiterinnen teurer?', uk: 'Чи дорожчі чеські супутниці?' },
        a: { cs: 'Ne. Ceník je jednotný pro všechny společnice bez ohledu na národnost — od 2 000 Kč za 30 minut.', en: 'No. Pricing is the same for all companions regardless of nationality — from 2,000 CZK for 30 minutes.', de: 'Nein. Einheitliche Preise unabhängig von der Nationalität — ab 2.000 CZK.', uk: 'Ні. Ціни єдині незалежно від національності — від 2 000 CZK за 30 хвилин.' },
      },
      {
        q: { cs: 'Kde se s českou společnicí potkám?', en: 'Where do I meet a Czech companion?', de: 'Wo treffe ich eine tschechische Begleiterin?', uk: 'Де я зустріну чеську супутницю?' },
        a: { cs: 'V diskrétním privátním apartmánu v centru Prahy ({districts}). Přesnou adresu obdržíte po potvrzení termínu.', en: 'In a discreet private apartment in central Prague ({districts}). Exact address sent after booking confirmation.', de: 'In einem diskreten Apartment im Zentrum von Prag ({districts}).', uk: 'У дискретному апартаменті у центрі Праги ({districts}).' },
      },
    ],
    related: ['spolecnice-praha', 'blondynky-praha', 'brunetky-praha', 'gfe-praha'],
  },

  'ukrajinske-holky': {
    metaDesc: {
      cs: 'Ukrajinské společnice Praha — krásné a elegantní Ukrajinky v centru Prahy. Ověřené profily, diskrétní apartmány.',
      en: 'Ukrainian companions Prague — beautiful and elegant Ukrainian escorts in central Prague. Verified profiles, discreet apartments.',
      de: 'Ukrainische Begleiterinnen Prag — schön und elegant. Verifizierte Profile, diskrete Apartments.',
      uk: 'Українські супутниці Прага — красиві та елегантні українки у центрі Праги. Перевірені профілі.',
    },
    intro: {
      cs: 'Ukrajinské společnice v Praze — elegantní, krásné a často vícejazyčné. Ukrajinky jsou oblíbené pro svůj exotický šarm, péči o vzhled a vstřícnou povahu. Každá je osobně ověřená, fotografie odpovídají realitě. Setkání probíhají v diskrétních apartmánech v centru Prahy.',
      en: 'Ukrainian companions in Prague — elegant, beautiful, and often multilingual. Ukrainian women are popular for their exotic charm, attention to appearance, and welcoming personality. Every one personally verified, photos match reality. Meetings in discreet apartments in central Prague.',
      de: 'Ukrainische Begleiterinnen in Prag — elegant, schön und oft mehrsprachig. Jede persönlich verifiziert. Treffen in diskreten Apartments im Zentrum.',
      uk: 'Українські супутниці у Празі — елегантні, красиві та часто багатомовні. Українки популярні завдяки екзотичному шарму, увазі до зовнішності та привітному характеру. Кожна особисто перевірена. Зустрічі у дискретних апартаментах у центрі Праги.',
    },
    faq: [
      {
        q: { cs: 'Mluví ukrajinské společnice česky?', en: 'Do Ukrainian companions speak Czech?', de: 'Sprechen ukrainische Begleiterinnen Tschechisch?', uk: 'Чи говорять українські супутниці чеською?' },
        a: { cs: 'Většina mluví česky na komunikativní úrovni a plynně anglicky nebo rusky. Jazyky najdete v profilu každé společnice.', en: 'Most speak Czech at conversational level and are fluent in English or Russian. Languages listed in each companion\'s profile.', de: 'Die meisten sprechen Tschechisch auf Konversationsniveau und fließend Englisch oder Russisch.', uk: 'Більшість говорять чеською на розмовному рівні та вільно англійською або російською. Мови вказані у профілі.' },
      },
      {
        q: { cs: 'Kolik ukrajinských společnic máte k dispozici?', en: 'How many Ukrainian companions are available?', de: 'Wie viele ukrainische Begleiterinnen sind verfügbar?', uk: 'Скільки українських супутниць доступно?' },
        a: { cs: 'Aktuální počet a dostupnost najdete v rozvrhu — aktualizujeme denně.', en: 'Current availability is in the live schedule, updated daily.', de: 'Aktuelle Verfügbarkeit im täglichen Zeitplan.', uk: 'Актуальна доступність — у графіку, оновлюється щодня.' },
      },
      {
        q: { cs: 'Jsou fotografie ukrajinských společnic skutečné?', en: 'Are the Ukrainian companion photos real?', de: 'Sind die Fotos der ukrainischen Begleiterinnen echt?', uk: 'Чи справжні фото українських супутниць?' },
        a: { cs: 'Ano. Každou společnici osobně ověřujeme včetně fotografií — žádné fake profily.', en: 'Yes. Every companion is personally verified including photos — no fake profiles.', de: 'Ja. Jede Begleiterin wird persönlich verifiziert, auch die Fotos.', uk: 'Так. Кожну супутницю перевіряємо особисто, включно з фотографіями.' },
      },
    ],
    related: ['ruske-holky', 'exoticke-krasky', 'blondynky-praha', 'cernovlasky-praha'],
  },

  'luxusni-sluzby': {
    metaDesc: {
      cs: 'Luxusní escort služby Praha — prémiové programy, GFE, duo setkání a VIP doprovodné služby. Ověřené společnice, diskrétní apartmány.',
      en: 'Luxury escort services Prague — premium programs, GFE, duo meetings, and VIP companion services. Verified escorts, discreet apartments.',
      de: 'Luxus-Escort-Dienstleistungen Prag — Premium-Programme, GFE, Duo-Treffen. Verifizierte Begleiterinnen.',
      uk: 'Розкішні ескорт-послуги Прага — преміальні програми, GFE, дуо-зустрічі. Перевірені супутниці.',
    },
    intro: {
      cs: 'Luxusní escort služby v Praze od LovelyGirls — prémiové programy pro náročné klienty. GFE (Girlfriend Experience), duo setkání, delší programy a VIP doprovod. Každá společnice je osobně ověřená, apartmány v centru Prahy nabízejí plné soukromí a komfort.',
      en: 'Luxury escort services in Prague by LovelyGirls — premium programs for discerning clients. GFE (Girlfriend Experience), duo meetings, extended programs, and VIP companionship. Every companion personally verified, central Prague apartments offer full privacy and comfort.',
      de: 'Luxus-Escort-Dienstleistungen in Prag — Premium-Programme für anspruchsvolle Kunden. GFE, Duo-Treffen, verlängerte Programme. Jede Begleiterin persönlich verifiziert.',
      uk: 'Розкішні ескорт-послуги у Празі від LovelyGirls — преміальні програми для вибагливих клієнтів. GFE, дуо-зустрічі, подовжені програми. Кожна супутниця особисто перевірена.',
    },
    faq: [
      {
        q: { cs: 'Jaké luxusní služby nabízíte?', en: 'What luxury services do you offer?', de: 'Welche Luxus-Dienstleistungen bieten Sie an?', uk: 'Які розкішні послуги ви пропонуєте?' },
        a: { cs: 'GFE (Girlfriend Experience), duo setkání, delší programy 90–120 minut, erotickou masáž a další prémiové služby. Kompletní nabídku najdete v profilech společnic.', en: 'GFE (Girlfriend Experience), duo meetings, extended 90–120 minute programs, erotic massage, and more. Full range in companion profiles.', de: 'GFE, Duo-Treffen, verlängerte Programme 90–120 Minuten, erotische Massage und mehr.', uk: 'GFE, дуо-зустрічі, подовжені програми 90–120 хвилин, еротичний масаж та інше.' },
      },
      {
        q: { cs: 'Kolik stojí luxusní program?', en: 'How much does a luxury program cost?', de: 'Was kostet ein Luxus-Programm?', uk: 'Скільки коштує розкішна програма?' },
        a: { cs: 'Ceny jsou transparentní a začínají od 2 000 Kč za 30 minut. Delší a prémiové programy najdete v ceníku. Žádné skryté příplatky.', en: 'Pricing is transparent, starting from 2,000 CZK for 30 minutes. Extended and premium programs on the pricing page. No hidden surcharges.', de: 'Transparente Preise ab 2.000 CZK für 30 Minuten. Keine versteckten Zuschläge.', uk: 'Прозорі ціни від 2 000 CZK за 30 хвилин. Жодних прихованих доплат.' },
      },
      {
        q: { cs: 'Jak si objednat luxusní službu?', en: 'How do I book a luxury service?', de: 'Wie buche ich eine Luxus-Dienstleistung?', uk: 'Як замовити розкішну послугу?' },
        a: { cs: 'Kontaktujte nás přes WhatsApp nebo Telegram, sdělte jakou službu a program si přejete. Potvrdíme dostupnost a domluvíme termín.', en: 'Contact us via WhatsApp or Telegram, tell us which service and program you\'d like. We confirm availability and arrange the appointment.', de: 'Kontaktieren Sie uns via WhatsApp oder Telegram. Wir bestätigen Verfügbarkeit und vereinbaren einen Termin.', uk: 'Зв\'яжіться через WhatsApp або Telegram, вкажіть бажану послугу та програму. Підтвердимо доступність.' },
      },
      {
        q: { cs: 'Nabízíte duo setkání?', en: 'Do you offer duo meetings?', de: 'Bieten Sie Duo-Treffen an?', uk: 'Чи пропонуєте дуо-зустрічі?' },
        a: { cs: 'Ano. Duo setkání (dvě společnice najednou) je k dispozici pro vybrané páry. Podrobnosti a dostupnost sdělíme na požádání.', en: 'Yes. Duo meetings (two companions at once) are available for selected pairs. Details and availability on request.', de: 'Ja. Duo-Treffen (zwei Begleiterinnen) für ausgewählte Paare verfügbar. Details auf Anfrage.', uk: 'Так. Дуо-зустрічі (дві супутниці одночасно) доступні для обраних пар. Деталі за запитом.' },
      },
    ],
    related: ['vip-escort-praha', 'luxusni-spolecnice-praha', 'gfe-praha', 'escort-prague'],
  },

  'elegantni-holky': {
    metaDesc: {
      cs: 'Elegantní společnice Praha — sofistikované a stylové společnice pro náročné klienty. Ověřené profily, diskrétní apartmány v centru.',
      en: 'Elegant companions Prague — sophisticated and stylish escorts for discerning clients. Verified profiles, discreet central apartments.',
      de: 'Elegante Begleiterinnen Prag — stilvoll und anspruchsvoll. Verifizierte Profile, diskrete Apartments.',
      uk: 'Елегантні супутниці Прага — стильні та витончені. Перевірені профілі, дискретні апартаменти.',
    },
    intro: {
      cs: 'Elegantní společnice v Praze — sofistikované, stylové a s výborným vystupováním. Tyto společnice jsou ideální pro klienty, kteří oceňují kultivovanost, inteligentní konverzaci a přirozený šarm. Každá je osobně ověřená, fotografie odpovídají realitě. Setkání v diskrétních apartmánech v centru Prahy.',
      en: 'Elegant companions in Prague — sophisticated, stylish, and with excellent manners. These companions are ideal for clients who appreciate refinement, intelligent conversation, and natural charm. Every one personally verified, photos match reality. Meetings in discreet apartments in central Prague.',
      de: 'Elegante Begleiterinnen in Prag — anspruchsvoll, stilvoll und mit ausgezeichneten Umgangsformen. Jede persönlich verifiziert. Treffen in diskreten Apartments im Zentrum.',
      uk: 'Елегантні супутниці у Празі — стильні, витончені та з чудовими манерами. Ідеальні для клієнтів, які цінують вишуканість та інтелектуальну бесіду. Кожна особисто перевірена. Зустрічі у дискретних апартаментах у центрі Праги.',
    },
    faq: [
      {
        q: { cs: 'Co dělá společnici elegantní?', en: 'What makes a companion elegant?', de: 'Was macht eine Begleiterin elegant?', uk: 'Що робить супутницю елегантною?' },
        a: { cs: 'Kultivované vystupování, stylový vzhled, inteligentní konverzace a přirozený šarm. Naše elegantní společnice jsou ideální pro GFE a delší programy.', en: 'Refined manners, stylish appearance, intelligent conversation, and natural charm. Our elegant companions are ideal for GFE and extended programs.', de: 'Kultiviertes Auftreten, stilvolles Erscheinungsbild, intelligente Konversation und natürlicher Charme.', uk: 'Вишукані манери, стильний вигляд, інтелектуальна бесіда та природний шарм.' },
      },
      {
        q: { cs: 'Kolik elegantních společnic máte?', en: 'How many elegant companions do you have?', de: 'Wie viele elegante Begleiterinnen haben Sie?', uk: 'Скільки елегантних супутниць у вас є?' },
        a: { cs: 'Aktuální počet a dostupnost najdete v rozvrhu — aktualizujeme denně.', en: 'Current availability is in the live schedule, updated daily.', de: 'Aktuelle Verfügbarkeit im täglichen Zeitplan.', uk: 'Актуальна доступність — у графіку, оновлюється щодня.' },
      },
      {
        q: { cs: 'Nabízejí elegantní společnice GFE?', en: 'Do elegant companions offer GFE?', de: 'Bieten elegante Begleiterinnen GFE an?', uk: 'Чи пропонують елегантні супутниці GFE?' },
        a: { cs: 'Většina ano. Elegantní společnice jsou pro GFE ideální — dokážou vytvořit atmosféru autentického rande. Podrobnosti v profilu každé společnice.', en: 'Most do. Elegant companions are ideal for GFE — they create the atmosphere of an authentic date. Details in each companion\'s profile.', de: 'Die meisten ja. Elegante Begleiterinnen sind ideal für GFE. Details im Profil.', uk: 'Більшість так. Елегантні супутниці ідеальні для GFE. Деталі у профілі.' },
      },
      {
        q: { cs: 'Kde se s elegantní společnicí potkám?', en: 'Where do I meet an elegant companion?', de: 'Wo treffe ich eine elegante Begleiterin?', uk: 'Де я зустріну елегантну супутницю?' },
        a: { cs: 'V diskrétním privátním apartmánu v centru Prahy ({districts}). Přesnou adresu obdržíte po potvrzení termínu.', en: 'In a discreet private apartment in central Prague ({districts}). Exact address sent after booking confirmation.', de: 'In einem diskreten Apartment im Zentrum von Prag ({districts}).', uk: 'У дискретному апартаменті у центрі Праги ({districts}).' },
      },
    ],
    related: ['luxusni-spolecnice-praha', 'gfe-praha', 'spolecnice-praha', 'vip-escort-praha'],
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
  'praha-3': {
    metaDesc: {
      cs: 'Escort Praha 3 — ověřené společnice v diskrétním privátu na Žižkově. Metro Jiřího z Poděbrad, soukromý vchod, denně 10–22:30.',
      en: 'Escort Prague 3 — verified companions in a discreet private flat in Zizkov. Metro Jiřího z Poděbrad, private entrance, daily 10–22:30.',
      de: 'Escort Prag 3 — verifizierte Begleiterinnen im diskreten Privatapartment in Zizkov. Metro Jiřího z Poděbrad, privater Eingang, täglich 10–22:30.',
      uk: 'Ескорт Прага 3 — перевірені супутниці у дискретному приватному апартаменті на Жижкові. Метро Jiřího z Poděbrad, приватний вхід, щодня 10–22:30.',
    },
    intro: {
      cs: 'Apartmán LovelyGirls na Žižkově (Praha 3) je diskrétní privát s vlastním vchodem v klidné ulici. Od metra Jiřího z Poděbrad (linka A) je to pět minut pěšky, tramvaje jezdí Seifertovou i Husitskou. Žižkov je čtvrť kaváren a vináren, takže příchod ani odchod tu nikoho nezaujme. Uvnitř najdete sprchu, ručníky a plné vybavení. Ceník je stejný jako na ostatních apartmánech, platí se hotově na místě. Otevřeno denně 10:00–22:30, kdo pracuje dnes uvidíte v rozvrhu.',
      en: 'The LovelyGirls apartment in Zizkov (Prague 3) is a discreet private flat with its own entrance on a quiet street. Five minutes on foot from Jiřího z Poděbrad metro (line A), with trams running along Seifertova and Husitská. Zizkov is a neighbourhood of cafes and wine bars, so nobody pays attention to who comes or goes. Inside there is a shower, towels and full amenities. Pricing matches our other apartments and payment is cash on arrival. Open daily 10:00–22:30 — the schedule shows who is working today.',
      de: 'Das LovelyGirls Apartment in Zizkov (Prag 3) ist eine diskrete Privatwohnung mit eigenem Eingang in einer ruhigen Straße. Fünf Gehminuten von der Metro Jiřího z Poděbrad (Linie A), Straßenbahnen in der Seifertova und Husitská. Zizkov ist ein Viertel voller Cafés und Weinbars — niemand achtet darauf, wer kommt oder geht. Dusche, Handtücher und volle Ausstattung sind vorhanden. Gleiche Preise wie in unseren anderen Apartments, Barzahlung vor Ort. Täglich 10:00–22:30 geöffnet.',
      uk: 'Апартамент LovelyGirls на Жижкові (Прага 3) — дискретна приватна квартира з власним входом на тихій вулиці. П\'ять хвилин пішки від метро Jiřího z Poděbrad (лінія A), трамваї по Seifertova та Husitská. Жижков — район кав\'ярень і винних барів, тож ніхто не звертає уваги, хто приходить чи йде. Усередині душ, рушники та повне обладнання. Ціни такі ж, як в інших апартаментах, оплата готівкою на місці. Відкрито щодня 10:00–22:30.',
    },
    faq: [
      {
        q: { cs: 'Jak se dostanu na Žižkov MHD?', en: 'How do I get to Zizkov by public transport?', de: 'Wie komme ich mit dem ÖPNV nach Zizkov?', uk: 'Як дістатися на Жижков громадським транспортом?' },
        a: { cs: 'Metro A — stanice Jiřího z Poděbrad, pět minut pěšky. Tramvaje jezdí po Seifertově a Husitské ulici. Parkování v okolních modrých zónách.', en: 'Metro A — Jiřího z Poděbrad station, five minutes on foot. Trams run on Seifertova and Husitská. Street parking in the surrounding blue zones.', de: 'Metro A — Jiřího z Poděbrad, fünf Gehminuten. Straßenbahnen in der Seifertova und Husitská. Parken in den blauen Zonen.', uk: 'Метро A — станція Jiřího z Poděbrad, п\'ять хвилин пішки. Трамваї по Seifertova та Husitská. Парковка в синіх зонах поблизу.' },
      },
      {
        q: { cs: 'Je nabídka na Praze 3 stejná jako na ostatních apartmánech?', en: 'Is Prague 3 the same as your other apartments?', de: 'Ist Prag 3 wie unsere anderen Apartments?', uk: 'Чи такий же вибір на Празі 3, як в інших апартаментах?' },
        a: { cs: 'Ano — stejné společnice, stejný ceník, stejný komfort. Část dívek se mezi apartmány střídá podle rozvrhu.', en: 'Yes — same companions, same pricing, same comfort. Some companions rotate between apartments according to the schedule.', de: 'Ja — gleiche Begleiterinnen, gleiche Preise, gleicher Komfort. Einige wechseln je nach Zeitplan zwischen den Apartments.', uk: 'Так — ті ж супутниці, ті ж ціни, той же комфорт. Частина дівчат чергується між апартаментами за графіком.' },
      },
      {
        q: { cs: 'Jak zjistím, kdo je dnes na Praze 3?', en: 'How do I find who is at Prague 3 today?', de: 'Wie erfahre ich, wer heute in Prag 3 ist?', uk: 'Як дізнатися, хто сьогодні на Празі 3?' },
        a: { cs: 'V rozvrhu si vyberete den a vyfiltrujete podle apartmánu. Rozvrh se aktualizuje průběžně, takže vidíte reálnou dostupnost.', en: 'Open the schedule, pick a day and filter by apartment. It updates continuously, so what you see is real availability.', de: 'Im Zeitplan den Tag wählen und nach Apartment filtern. Er wird laufend aktualisiert.', uk: 'У графіку оберіть день і відфільтруйте за апартаментом. Графік оновлюється постійно.' },
      },
    ],
    relatedHashtags: ['spolecnice-praha', 'blondynky-praha', 'gfe-praha', 'studentky-praha'],
  },

  'praha-5': {
    metaDesc: {
      cs: 'Escort Praha 5 — ověřené společnice v diskrétním privátu u Anděla. Metro Anděl linka B, soukromý vchod, denně 10–22:30.',
      en: 'Escort Prague 5 — verified companions in a discreet private flat by Andel. Andel metro line B, private entrance, daily 10–22:30.',
      de: 'Escort Prag 5 — verifizierte Begleiterinnen im diskreten Privatapartment bei Andel. Metro Andel Linie B, privater Eingang, täglich 10–22:30.',
      uk: 'Ескорт Прага 5 — перевірені супутниці у дискретному приватному апартаменті біля Анділа. Метро Anděl лінія B, приватний вхід, щодня 10–22:30.',
    },
    intro: {
      cs: 'Apartmán LovelyGirls na Smíchově (Praha 5) stojí kousek od metra Anděl, linka B. Je to jedna z nejživějších částí Prahy — obchody, kavárny a stálý pohyb lidí, což je pro diskrétní návštěvu spíš výhoda. Byt má vlastní vchod, sprchu a plné vybavení. Ceník je jednotný se zbytkem apartmánů, platba hotově na místě. Otevřeno denně 10:00–22:30; aktuální obsazení najdete v rozvrhu, kde si můžete filtrovat právě Prahu 5.',
      en: 'The LovelyGirls apartment in Smichov (Prague 5) sits a short walk from Andel metro on line B. It is one of the liveliest parts of Prague — shops, cafes and constant foot traffic, which works in favour of a discreet visit. The flat has its own entrance, a shower and full amenities. Pricing is the same across all our apartments and payment is cash on arrival. Open daily 10:00–22:30; the schedule lets you filter for Prague 5.',
      de: 'Das LovelyGirls Apartment in Smichov (Prag 5) liegt wenige Gehminuten von der Metro Andel, Linie B. Es ist einer der lebhaftesten Teile Prags — Geschäfte, Cafés und ständiger Betrieb, was einem diskreten Besuch entgegenkommt. Eigener Eingang, Dusche und volle Ausstattung. Einheitliche Preise, Barzahlung vor Ort. Täglich 10:00–22:30 geöffnet.',
      uk: 'Апартамент LovelyGirls на Смíхові (Прага 5) розташований за кілька хвилин від метро Anděl, лінія B. Це одна з найжвавіших частин Праги — магазини, кав\'ярні та постійний рух людей, що для дискретного візиту радше плюс. Квартира має власний вхід, душ і повне обладнання. Ціни єдині для всіх апартаментів, оплата готівкою. Відкрито щодня 10:00–22:30.',
    },
    faq: [
      {
        q: { cs: 'Kde přesně na Praze 5 apartmán je?', en: 'Where exactly in Prague 5 is the apartment?', de: 'Wo genau in Prag 5 befindet sich das Apartment?', uk: 'Де саме на Празі 5 знаходиться апартамент?' },
        a: { cs: 'Pár minut od metra Anděl (linka B). Přesnou adresu pošleme po potvrzení termínu — kvůli soukromí dívek i vašemu ji neuvádíme veřejně.', en: 'A few minutes from Andel metro (line B). We send the exact address once your booking is confirmed — we keep it off the public site for everyone\'s privacy.', de: 'Wenige Minuten von der Metro Andel (Linie B). Die genaue Adresse senden wir nach Bestätigung der Buchung.', uk: 'За кілька хвилин від метро Anděl (лінія B). Точну адресу надсилаємо після підтвердження бронювання.' },
      },
      {
        q: { cs: 'Je Praha 5 levnější než ostatní apartmány?', en: 'Is Prague 5 cheaper than your other apartments?', de: 'Ist Prag 5 günstiger als die anderen Apartments?', uk: 'Чи Прага 5 дешевша за інші апартаменти?' },
        a: { cs: 'Ne, ceník je jednotný pro všechny apartmány — stejné programy, stejné ceny. Lokalita cenu neovlivňuje.', en: 'No — pricing is unified across all apartments, same programs and same prices. Location does not change the price.', de: 'Nein, die Preise sind an allen Standorten gleich — gleiche Programme, gleiche Preise.', uk: 'Ні, ціни єдині для всіх апартаментів — ті ж програми, ті ж ціни.' },
      },
      {
        q: { cs: 'Dá se na Praze 5 zaparkovat?', en: 'Is there parking near Prague 5?', de: 'Gibt es Parkplätze in Prag 5?', uk: 'Чи є парковка біля Праги 5?' },
        a: { cs: 'V okolí jsou modré zóny a placená parkoviště u Anděla. Většina hostů ale dorazí metrem — je to rychlejší.', en: 'There are blue zones and paid car parks around Andel. Most guests arrive by metro, which is faster.', de: 'Rund um Andel gibt es blaue Zonen und Parkhäuser. Die meisten Gäste kommen mit der Metro.', uk: 'Поблизу Anděl є сині зони та платні паркінги. Більшість гостей приїжджає метро — це швидше.' },
      },
    ],
    relatedHashtags: ['spolecnice-praha', 'brunetky-praha', 'gfe-praha', 'cernovlasky-praha'],
  },

  'praha-1': {
    metaDesc: {
      cs: 'Escort Staré Město Praha 1 — ověřené společnice v centru. Diskrétní apartmán u Staroměstského náměstí, soukromý vchod, denně 10–22:30.',
      en: 'Escort Old Town Prague 1 — verified companions in the center. Discreet apartment near Old Town Square, private entrance, daily 10–22:30.',
      de: 'Escort Altstadt Prag 1 — verifizierte Begleiterinnen im Zentrum. Diskretes Apartment am Altstädter Ring, privater Eingang, täglich 10–22:30.',
      uk: 'Ескорт Старе Місто Прага 1 — перевірені супутниці у центрі. Дискретний апартамент біля Староміської площі, приватний вхід, щодня 10–22:30.',
    },
    intro: {
      cs: 'Apartmán LovelyGirls v Praze 1 (Staré Město) se nachází v samém srdci Prahy — pár minut od Staroměstského náměstí a Karlova mostu. Ideální pro návštěvníky centra, kteří hledají diskrétní setkání bez nutnosti cestovat. Soukromý vchod z tiché uličky, plně vybavený byt se sprchou a Wi-Fi. Metro Staroměstská (linka A) i Můstek (linky A+B) jsou do 5 minut pěšky.',
      en: 'The LovelyGirls Prague 1 apartment (Old Town) is in the heart of Prague — minutes from Old Town Square and Charles Bridge. Perfect for visitors to the center seeking a discreet encounter without traveling. Private entrance from a quiet side street, fully equipped flat with shower and Wi-Fi. Metro Staroměstská (line A) and Můstek (lines A+B) are within 5 minutes on foot.',
      de: 'Das LovelyGirls Apartment in Prag 1 (Altstadt) liegt im Herzen Prags — wenige Minuten vom Altstädter Ring und der Karlsbrücke entfernt. Ideal für Besucher des Zentrums. Privater Eingang, voll ausgestattete Wohnung mit Dusche und WLAN. Metro Staroměstská (Linie A) und Můstek (Linien A+B) in 5 Minuten zu Fuß.',
      uk: 'Апартамент LovelyGirls у Празі 1 (Старе Місто) розташований у самому серці Праги — кілька хвилин від Староміської площі та Карлового мосту. Ідеально для відвідувачів центру, які шукають дискретну зустріч. Приватний вхід з тихої вулички, повністю обладнана квартира з душем та Wi-Fi.',
    },
    faq: [
      {
        q: { cs: 'Kde přesně v Praze 1 se apartmán nachází?', en: 'Where exactly in Prague 1 is the apartment?', de: 'Wo genau in Prag 1 befindet sich das Apartment?', uk: 'Де саме у Празі 1 знаходиться апартамент?' },
        a: { cs: 'V klidné uličce nedaleko Staroměstského náměstí. Přesnou adresu sdílíme po potvrzení rezervace — plná diskrétnost.', en: 'On a quiet side street near Old Town Square. Exact address shared after booking confirmation — full discretion.', de: 'In einer ruhigen Seitenstraße nahe dem Altstädter Ring. Adresse nach Buchungsbestätigung.', uk: 'У тихій вулиці біля Староміської площі. Точну адресу надаємо після підтвердження бронювання.' },
      },
      {
        q: { cs: 'Jak se dostanu do apartmánu v Praze 1?', en: 'How do I get to the Prague 1 apartment?', de: 'Wie komme ich zum Apartment in Prag 1?', uk: 'Як дістатися до апартаменту у Празі 1?' },
        a: { cs: 'Metro A — Staroměstská (3 min pěšky), metro A+B — Můstek (5 min). Tramvaje na Národní třídě i Revoluční ulici. Taxi z hlavního nádraží do 8 minut.', en: 'Metro A — Staroměstská (3 min walk), metro A+B — Můstek (5 min). Trams on Národní and Revoluční streets. Taxi from main station under 8 minutes.', de: 'Metro A — Staroměstská (3 Min.), Metro A+B — Můstek (5 Min.). Taxi vom Hauptbahnhof unter 8 Minuten.', uk: 'Метро A — Staroměstská (3 хв пішки), метро A+B — Můstek (5 хв). Таксі з головного вокзалу до 8 хвилин.' },
      },
      {
        q: { cs: 'Je v centru Prahy snadné zaparkovat?', en: 'Is parking easy in Prague center?', de: 'Gibt es Parkmöglichkeiten im Zentrum?', uk: 'Чи є паркування у центрі Праги?' },
        a: { cs: 'Parkování v Praze 1 je omezené — doporučujeme MHD nebo taxi. Nejbližší placený parking je v Palladiu nebo na Náměstí Republiky.', en: 'Parking in Prague 1 is limited — we recommend public transport or taxi. Nearest paid parking at Palladium or Náměstí Republiky.', de: 'Parken in Prag 1 ist begrenzt — wir empfehlen ÖPNV oder Taxi.', uk: 'Паркування у Празі 1 обмежене — рекомендуємо МГТ або таксі.' },
      },
    ],
    relatedHashtags: ['spolecnice-praha', 'blondynky-praha', 'gfe-praha', 'elegantni-holky'],
  },

  'nove-mesto': {
    metaDesc: {
      cs: 'Escort Nové Město Praha — ověřené společnice u Václavského náměstí. Diskrétní apartmán, soukromý vchod, denně 10–22:30.',
      en: 'Escort New Town Prague — verified companions near Wenceslas Square. Discreet apartment, private entrance, daily 10–22:30.',
      de: 'Escort Neustadt Prag — verifizierte Begleiterinnen am Wenzelsplatz. Diskretes Apartment, privater Eingang, täglich 10–22:30.',
      uk: 'Ескорт Нове Місто Прага — перевірені супутниці біля Вацлавської площі. Дискретний апартамент, приватний вхід, щодня 10–22:30.',
    },
    intro: {
      cs: 'Apartmán LovelyGirls v Novém Městě je situovaný v klidné části nedaleko Václavského náměstí — obchodního a společenského centra Prahy. Vynikající dopravní dostupnost díky stanicím metra Můstek, Muzeum a I. P. Pavlova. Moderní byt s vlastním vchodem, sprchou a plným vybavením. Nové Město nabízí nejlepší kompromis mezi centrem a klidnou lokalitou.',
      en: 'The LovelyGirls New Town apartment is situated in a quiet area near Wenceslas Square — Prague\'s commercial and social center. Excellent transport thanks to metro stations Můstek, Muzeum, and I. P. Pavlova. Modern flat with private entrance, shower, and full amenities. New Town offers the best compromise between central location and quiet surroundings.',
      de: 'Das LovelyGirls Apartment in der Neustadt liegt in ruhiger Lage nahe dem Wenzelsplatz. Hervorragende Anbindung durch die Metrostationen Můstek, Muzeum und I. P. Pavlova. Moderne Wohnung mit privatem Eingang.',
      uk: 'Апартамент LovelyGirls у Новому Місті розташований у тихій частині біля Вацлавської площі — комерційного центру Праги. Відмінне транспортне сполучення завдяки станціям метро Můstek, Muzeum та I. P. Pavlova. Сучасна квартира з приватним входом.',
    },
    faq: [
      {
        q: { cs: 'Jak daleko je apartmán od Václavského náměstí?', en: 'How far is the apartment from Wenceslas Square?', de: 'Wie weit ist es vom Wenzelsplatz?', uk: 'Як далеко від Вацлавської площі?' },
        a: { cs: 'Do 5 minut pěšky. Přesnou adresu obdržíte po potvrzení rezervace.', en: 'Within 5 minutes on foot. Exact address after booking confirmation.', de: 'Innerhalb von 5 Gehminuten. Adresse nach Buchungsbestätigung.', uk: 'До 5 хвилин пішки. Точну адресу надаємо після підтвердження.' },
      },
      {
        q: { cs: 'Jaké metro je nejblíže?', en: 'Which metro station is closest?', de: 'Welche Metrostation ist am nächsten?', uk: 'Яка станція метро найближча?' },
        a: { cs: 'Muzeum (linky A+C) nebo I. P. Pavlova (linka C) — obě do 4 minut pěšky. Můstek (A+B) do 7 minut.', en: 'Muzeum (lines A+C) or I. P. Pavlova (line C) — both within 4 min walk. Můstek (A+B) within 7 min.', de: 'Muzeum (A+C) oder I. P. Pavlova (C) — jeweils 4 Min. zu Fuß.', uk: 'Muzeum (лінії A+C) або I. P. Pavlova (лінія C) — обидві до 4 хв пішки.' },
      },
      {
        q: { cs: 'Je v Novém Městě parkování?', en: 'Is there parking in New Town?', de: 'Gibt es Parkmöglichkeiten in der Neustadt?', uk: 'Чи є паркування у Новому Місті?' },
        a: { cs: 'Modré a oranžové zóny v okolních ulicích. Podzemní garáže u Národního muzea a v OC Quadrio (do 5 minut).', en: 'Blue and orange zones in nearby streets. Underground garages at National Museum and Quadrio shopping center (within 5 min).', de: 'Blaue und orange Zonen. Tiefgaragen am Nationalmuseum und im Quadrio (5 Min.).', uk: 'Сині та помаранчеві зони. Підземні гаражі біля Національного музею та ТЦ Quadrio (до 5 хв).' },
      },
    ],
    relatedHashtags: ['spolecnice-praha', 'gfe-praha', 'blondynky-praha', 'brunetky-praha'],
  },

  'vinohrady': {
    metaDesc: {
      cs: 'Apartmán Vinohrady Praha 2 — ověřené společnice, diskrétní privátní byt. Metro a tramvaj minutu pěšky, hotovostní platba.',
      en: 'Vinohrady apartment Prague 2 — verified companions, discreet private flat. Metro & tram minutes away, cash payment.',
      de: 'Apartment Vinohrady Prag 2 — verifizierte Begleiterinnen, diskretes Privatapartment.',
      uk: 'Апартамент Виногради Прага 2 — перевірені супутниці, дискретні приватні апартаменти.',
    },
    intro: {
      cs: 'Apartmán LovelyGirls na Vinohradech (Praha 2) je naší hlavní pobočkou. Diskrétní byt s vlastním vchodem, sprchou a Wi-Fi. Metro Náměstí Míru i tramvaj Vinohradská tržnice minutu pěšky. Modré parkovací zóny v okolních ulicích, placené parkoviště do 2 minut. Adresu obdržíte po potvrzení termínu — diskrétně, žádné kamery v okolí vchodu.',
      en: 'LovelyGirls Vinohrady apartment (Prague 2) is our main location. Discreet flat with private entry, shower, Wi-Fi. Metro Náměstí Míru and tram Vinohradská tržnice minutes away. Blue parking zones nearby, paid lot within 2 min. Exact address sent after booking — no cameras near entry.',
      de: 'LovelyGirls Vinohrady Apartment (Prag 2) ist unser Hauptstandort. Diskret, mit eigenem Eingang, Dusche, WLAN.',
      uk: 'Апартамент LovelyGirls на Виноградах (Прага 2) — головна локація. Дискретні, з власним входом, душ, Wi-Fi.',
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

const LOCATION_SLUG_ALIASES: Record<string, string> = {
  // Praha 2 is Nové Město, not Vinohrady — the alias below used to serve
  // Vinohrady copy on /pobocka/praha-2 while the DB said Nové Město.
  'praha-2': 'nove-mesto',
  'stare-mesto': 'praha-1',
  'smichov': 'praha-5',
};

export function getLocationContent(slug: string): LocationContent | null {
  return LOCATION_CONTENT[slug] ?? LOCATION_CONTENT[LOCATION_SLUG_ALIASES[slug]] ?? null;
}
