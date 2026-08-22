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
    relatedLocations: ['vinohrady'],
  },

  'spolecnice-praha': {
    metaDesc: {
      cs: 'Společnice Praha — {count} {companions} v centru. Diskrétní apartmány v centru Prahy. Transparentní ceny, ⭐ recenze, denně 10:00–22:30.',
      en: 'Companions Prague — {count} {companions} in central apartments. Transparent pricing, real reviews, daily 10:00–22:30.',
      de: 'Begleiterinnen Prag — {count} {companions} in zentralen Apartments.',
      uk: 'Супутниці Прага — {count} {companions} у центрі.',
    },
    intro: {
      cs: 'LovelyGirls Praha je prémiová agentura společnic v centru Prahy. Provozujeme diskrétní privátní apartmány v Praze 1, 2, 3 a 8 s osobně ověřenými společnicemi všech typů — blondýnky, brunetky, černovlásky, štíhlé, s křivkami, české i zahraniční. Každý profil je osobně ověřený, fotografie odpovídají realitě a ceny jsou jasně uvedené bez skrytých poplatků. Společnice mluví česky, anglicky a často i dalšími jazyky. Nabízíme programy od 30 minut po 120 minut, GFE (Girlfriend Experience), párové programy a další služby. Kontaktujte nás přes WhatsApp nebo Telegram pro okamžitou domluvu. Otevřeno denně 10:00–22:30.',
      en: 'LovelyGirls Prague is a premium companion agency in central Prague. We operate discreet private apartments in Prague 1, 2, 3, and 8 with personally verified companions of every type — blondes, brunettes, dark-haired, slim, curvy, Czech and international. Every profile is personally verified, photos match reality, and prices are clearly listed with no hidden fees. Companions speak Czech, English, and often additional languages. We offer programs from 30 to 120 minutes, GFE (Girlfriend Experience), couples programs, and more. Contact us via WhatsApp or Telegram for instant booking. Open daily 10:00–22:30.',
      de: 'LovelyGirls Prag ist eine Premium-Begleitagentur im Zentrum von Prag. Wir betreiben diskrete private Apartments in Prag 1, 2, 3 und 8 mit persönlich verifizierten Begleiterinnen aller Typen — Blondinen, Brünette, schlank, kurvig, tschechische und internationale. Jedes Profil ist verifiziert, Fotos entsprechen der Realität, Preise transparent. Programme von 30 bis 120 Minuten, GFE und mehr. Kontakt via WhatsApp oder Telegram. Täglich 10:00–22:30.',
      uk: 'LovelyGirls Прага — преміальна агенція супутниць у центрі Праги. Ми керуємо дискретними приватними апартаментами у Празі 1, 2, 3 та 8 з особисто перевіреними супутницями всіх типів — блондинки, брюнетки, темноволосі, стрункі, пишні, чеські та міжнародні. Кожен профіль перевірений, фотографії відповідають реальності, ціни прозорі. Програми від 30 до 120 хвилин, GFE та інше. Зв\'яжіться через WhatsApp або Telegram. Щодня 10:00–22:30.',
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
      cs: 'Společnice s přírodním poprsím v Praze — autentický pocit a přirozený vzhled bez implantátů. Mnoho klientů preferuje přírodní poprsí pro jeho měkkost, přirozený tvar a autentický dotek. V LovelyGirls Praha nabízíme výběr ověřených společnic s přírodním poprsím různých velikostí — od menších po plnější. Každý profil obsahuje přesnou velikost prsou a jasné označení, zda jsou přírodní nebo s implantáty, takže víte přesně, co očekávat. Fotografie odpovídají realitě a tělesné parametry jsou pravidelně kontrolovány. Setkání probíhají v diskrétních apartmánech v centru Prahy.',
      en: 'Companions with natural breasts in Prague — authentic feel and natural look without implants. Many clients prefer natural breasts for their softness, natural shape, and authentic touch. At LovelyGirls Prague we offer a selection of verified companions with natural breasts of various sizes — from smaller to fuller. Each profile shows exact bust size and a clear indicator of natural or implant, so you know exactly what to expect. Photos match reality and body measurements are regularly verified. Meetings in discreet apartments in central Prague.',
      de: 'Begleiterinnen mit natürlicher Brust in Prag — authentisches Gefühl und natürlicher Look ohne Implantate. Viele Klienten bevorzugen natürliche Brüste für ihre Weichheit und natürliche Form. Bei LovelyGirls Prag bieten wir verifizierte Begleiterinnen mit natürlicher Brust verschiedener Größen. Jedes Profil zeigt die genaue Brustgröße und eine klare Angabe natürlich/Implantat. Fotos entsprechen der Realität.',
      uk: 'Супутниці з натуральним бюстом у Празі — справжній вигляд і відчуття без імплантів. Багато клієнтів надають перевагу натуральному бюсту за його м\'якість, природну форму та автентичний дотик. У LovelyGirls Прага пропонуємо перевірених супутниць з натуральним бюстом різних розмірів. Кожен профіль містить точний розмір та позначення натуральний/імпланти. Фотографії відповідають реальності.',
    },
    faq: [
      {
        q: { cs: 'Jak poznám, že má společnice přírodní poprsí?', en: 'How do I know if breasts are natural?', de: 'Wie erkenne ich, ob die Brust natürlich ist?', uk: 'Як зрозуміти, що бюст натуральний?' },
        a: { cs: 'V profilu každé dívky je u sloupce „Prsa" označení (přírodní/implantáty). Také najdete přesnou velikost — žádné dohady.', en: 'Each profile has a "Bust" field with natural/implant indicator plus exact size — no guesswork.', de: 'Im Profil ist die Angabe natürlich/Implantat plus exakte Größe.', uk: 'У профілі вказано натуральні/імпланти та точний розмір.' },
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
  'praha-3': {
    metaDesc: {
      cs: 'Apartmán Žižkov Praha 3 — nový diskrétní privát. Otevření červen 2026. Ověřené společnice, soukromý vchod, hotovostní platba.',
      en: 'Zizkov apartment Prague 3 — new discreet private flat. Opening June 2026. Verified companions, private entrance, cash payment.',
      de: 'Apartment Zizkov Prag 3 — neues diskretes Privatapartment. Eröffnung Juni 2026. Verifizierte Begleiterinnen.',
      uk: 'Апартамент Жижков Прага 3 — новий дискретний приватний апартамент. Відкриття червень 2026.',
    },
    intro: {
      cs: 'Nový apartmán LovelyGirls na Žižkově (Praha 3) otevíráme v červnu 2026. Diskrétní byt s vlastním vchodem v klidné ulici, snadná dostupnost metrem i tramvají. Žižkov je oblíbená čtvrť plná kaváren a vináren — náš apartmán v ní nabídne stejný komfort a soukromí jako hlavní pobočka na Vinohradech.',
      en: 'The new LovelyGirls Zizkov apartment (Prague 3) opens in June 2026. Discreet flat with private entrance on a quiet street, easy metro and tram access. Zizkov is a popular neighborhood full of cafes and wine bars — our apartment offers the same comfort and privacy as the main Vinohrady location.',
      de: 'Das neue LovelyGirls Zizkov Apartment (Prag 3) eröffnet im Juni 2026. Diskrete Wohnung mit privatem Eingang, Metro- und Tramanbindung.',
      uk: 'Новий апартамент LovelyGirls на Жижкові (Прага 3) відкривається у червні 2026. Дискретна квартира з приватним входом у тихій вулиці, зручний доступ метро та трамваєм.',
    },
    faq: [
      {
        q: { cs: 'Kdy otevíráte apartmán na Žižkově?', en: 'When does the Zizkov apartment open?', de: 'Wann eröffnet das Zizkov-Apartment?', uk: 'Коли відкривається апартамент на Жижкові?' },
        a: { cs: 'Plánované otevření je 18. června 2026. Sledujte naše stránky pro aktuální informace.', en: 'Planned opening is June 18, 2026. Follow our pages for updates.', de: 'Geplante Eröffnung am 18. Juni 2026.', uk: 'Планове відкриття 18 червня 2026. Слідкуйте за нашими сторінками.' },
      },
      {
        q: { cs: 'Jak se dostanu na Žižkov MHD?', en: 'How do I get to Zizkov by public transport?', de: 'Wie komme ich mit dem ÖPNV nach Zizkov?', uk: 'Як дістатися на Жижков громадським транспортом?' },
        a: { cs: 'Metro A — stanice Jiřího z Poděbrad (5 minut pěšky), tramvaje po Seifertově a Husitské ulici. Žižkov je velmi dobře dopravně obsloužený.', en: 'Metro A — Jiřího z Poděbrad station (5 min walk), trams on Seifertova and Husitská streets. Zizkov has excellent public transport.', de: 'Metro A — Jiřího z Poděbrad (5 Min. Fußweg), Tram auf Seifertova.', uk: 'Метро A — станція Jiřího z Poděbrad (5 хвилин пішки), трамваї по Seifertova та Husitská. Жижков має відмінне транспортне сполучення.' },
      },
      {
        q: { cs: 'Bude na Žižkově stejná nabídka jako na Vinohradech?', en: 'Will Zizkov offer the same services as Vinohrady?', de: 'Hat Zizkov das gleiche Angebot wie Vinohrady?', uk: 'Чи буде на Жижкові такий же вибір як на Виноградах?' },
        a: { cs: 'Ano — stejné společnice, stejný ceník, stejný komfort. Některé dívky budou pracovat v obou lokacích.', en: 'Yes — same companions, same pricing, same comfort. Some girls will work at both locations.', de: 'Ja — gleiche Begleiterinnen, gleiche Preise, gleicher Komfort.', uk: 'Так — ті ж супутниці, ті ж ціни, той же комфорт. Деякі дівчата працюватимуть в обох локаціях.' },
      },
    ],
    relatedHashtags: ['spolecnice-praha', 'blondynky-praha', 'gfe-praha', 'studentky-praha'],
  },

  'praha-5': {
    metaDesc: {
      cs: 'Apartmán Smíchov Praha 5 — nový diskrétní privát u Anděla. Otevření červenec 2026. Ověřené společnice, soukromý vchod.',
      en: 'Smichov apartment Prague 5 — new discreet private flat near Andel. Opening July 2026. Verified companions, private entrance.',
      de: 'Apartment Smichov Prag 5 — neues diskretes Privatapartment nahe Andel. Eröffnung Juli 2026.',
      uk: 'Апартамент Смíхов Прага 5 — новий дискретний приватний апартамент біля Анділа. Відкриття липень 2026.',
    },
    intro: {
      cs: 'Apartmán LovelyGirls na Smíchově (Praha 5, Anděl) otevíráme v červenci 2026. Moderní byt s vlastním vchodem v blízkosti metra Anděl — jedna z nejživějších částí Prahy. Apartmán nabídne stejný komfort a diskrétnost jako naše ostatní pobočky.',
      en: 'The LovelyGirls Smichov apartment (Prague 5, Andel) opens in July 2026. Modern flat with private entrance near Andel metro — one of Prague\'s liveliest neighborhoods. Same comfort and discretion as our other locations.',
      de: 'Das LovelyGirls Smichov Apartment (Prag 5, Andel) eröffnet im Juli 2026. Moderne Wohnung nahe der Metro Andel.',
      uk: 'Апартамент LovelyGirls на Смíхові (Прага 5, Анділ) відкривається у липні 2026. Сучасна квартира з приватним входом біля метро Анділ — одна з найжвавіших частин Праги.',
    },
    faq: [
      {
        q: { cs: 'Kdy otevíráte apartmán na Smíchově?', en: 'When does the Smichov apartment open?', de: 'Wann eröffnet das Smichov-Apartment?', uk: 'Коли відкривається апартамент на Смíхові?' },
        a: { cs: 'Plánované otevření je 25. července 2026.', en: 'Planned opening is July 25, 2026.', de: 'Geplante Eröffnung am 25. Juli 2026.', uk: 'Планове відкриття 25 липня 2026.' },
      },
      {
        q: { cs: 'Kde přesně na Smíchově se apartmán nachází?', en: 'Where exactly in Smichov is the apartment?', de: 'Wo genau in Smichov befindet sich das Apartment?', uk: 'Де саме на Смíхові знаходиться апартамент?' },
        a: { cs: 'V blízkosti metra Anděl (linka B). Přesnou adresu sdílíme po potvrzení rezervace.', en: 'Near Andel metro (line B). Exact address shared after booking confirmation.', de: 'Nahe der Metro Andel (Linie B). Adresse nach Buchung.', uk: 'Біля метро Анділ (лінія B). Точну адресу надаємо після підтвердження бронювання.' },
      },
      {
        q: { cs: 'Bude Smíchov levnější než Vinohrady?', en: 'Will Smichov be cheaper than Vinohrady?', de: 'Wird Smichov günstiger sein als Vinohrady?', uk: 'Чи буде Смíхов дешевшим ніж Виногради?' },
        a: { cs: 'Ceník je jednotný pro všechny pobočky — stejné programy, stejné ceny.', en: 'Pricing is unified across all locations — same programs, same prices.', de: 'Die Preise sind an allen Standorten gleich.', uk: 'Ціни єдині для всіх локацій — ті ж програми, ті ж ціни.' },
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
  'praha-2': 'vinohrady',
  'stare-mesto': 'praha-1',
  'smichov': 'praha-5',
};

export function getLocationContent(slug: string): LocationContent | null {
  return LOCATION_CONTENT[slug] ?? LOCATION_CONTENT[LOCATION_SLUG_ALIASES[slug]] ?? null;
}
