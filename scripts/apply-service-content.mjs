#!/usr/bin/env node
/**
 * Fills the empty service pages and retitles the English homepage, against the
 * production Turso DB.
 *
 * Why: all 34 rows in `services` have an empty content, seo_title and
 * seo_description in every locale, so app/[locale]/sluzba/[slug]/page.tsx never renders its
 * <section className="service-content"> block — 136 URLs with no body. GSC
 * shows the consequence: "rimming praha" sits at position 11.8 with a 1.8% CTR,
 * "footfetish praha" at 15.1. The homepage row is retitled because the single
 * biggest query, "prague escort" (7,094 impressions, position 10.1), does not
 * appear at the front of the current title.
 *
 * This database is shared with the live site, so the script backs up every row
 * it is about to touch before touching it, refuses to run against a database
 * that does not look like ours, and only ever writes the fields listed here.
 * It never reads or writes girl_schedules.
 *
 *   node scripts/apply-service-content.mjs --dry     # local data/app.db
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/apply-service-content.mjs --dry
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/apply-service-content.mjs --write
 */
import { createClient } from '@libsql/client';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

// Falls back to the local dev DB so a dry run needs no production credentials.
const url = process.env.TURSO_DATABASE_URL || `file:${join(ROOT, 'data/app.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;
const isRemote = !url.startsWith('file:');

if (isRemote && !authToken) {
  console.error('Vzdálená DB bez TURSO_AUTH_TOKEN. Přidej token, nebo nech URL prázdné pro lokální běh.');
  process.exit(1);
}
if (WRITE && !isRemote && !process.env.ALLOW_LOCAL_WRITE) {
  console.error('--write proti lokální DB nedává smysl. Nastav TURSO_DATABASE_URL.');
  process.exit(1);
}

/* ============================================================
   seo_metadata — jen anglická homepage
============================================================ */
const META = {
  '/en': {
    meta_title: 'Prague Escort — Verified Girls, Private Apartments | LovelyGirls',
    meta_description:
      'Verified escorts in Prague, real photos, private apartments in Nové Město, Žižkov and Anděl. From 2,000 CZK / 30 min. Incall only, cash on arrival, no hidden fees.',
  },
};

/* ============================================================
   services — obsah stránek služeb

   Fakta ověřená proti produkci: 3 apartmány (Nové Město/Praha 2,
   Žižkov/Praha 3, Anděl/Praha 5), programy 30/45/60/90/120 min za
   2 000/2 200/2 500/4 000/4 500 Kč, výhradně incall.
============================================================ */
const SERVICES = {
  erotic_massage: {
    seo_title: {
      cs: 'Erotická masáž Praha — od 2 000 Kč | LovelyGirls',
      en: 'Erotic Massage Prague — from 2,000 CZK | LovelyGirls',
      de: 'Erotische Massage Prag — ab 2.000 CZK | LovelyGirls',
      uk: 'Еротичний масаж Прага — від 2 000 Kč | LovelyGirls',
    },
    seo_description: {
      cs: 'Erotická masáž v privátním apartmánu v centru Prahy. Ověřené masérky, čisté zázemí, sprcha součástí. Programy od 30 minut, ceny od 2 000 Kč.',
      en: 'Erotic massage in a private apartment in central Prague. Verified girls, clean facilities, shower included. Programs from 30 minutes, from 2,000 CZK.',
      de: 'Erotische Massage im privaten Apartment im Zentrum von Prag. Verifizierte Masseurinnen, saubere Räume, Dusche inklusive. Ab 30 Minuten, ab 2.000 CZK.',
      uk: 'Еротичний масаж у приватних апартаментах у центрі Праги. Перевірені дівчата, чисті приміщення, душ включено. Програми від 30 хвилин, від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Hodina, ve které se nikam nespěchá</h2><p>Teplý olej, tlumené světlo a hudba někde v pozadí. Erotická masáž začíná pomalu — nejdřív povolí ramena a záda, teprve potom všechno ostatní. Je to nejčastější způsob, jak u nás lidé začínají, a má to důvod: nemusíte nic řešit, jen ležet.</p><p>Probíhá v jednom ze tří privátních apartmánů v centru Prahy — Nové Město, Žižkov nebo Anděl. Každý má vlastní koupelnu, čisté ručníky a sprchu před i po. Které společnice masáž nabízejí, poznáte v jejich profilu.</p><h2>Cena a kde se potkáme</h2><p>Samostatně od 30 minut za 2 000 Kč, ale na 60 minut za 2 500 Kč je prostoru výrazně víc — a u masáže se to pozná. Cena zahrnuje apartmán i sprchu, platí se hotově na místě. Výjezdy nenabízíme. Mezi 23:00 a 7:00 platí noční sazba, o 500–1 000 Kč vyšší.</p>`,
      en: `<h2>An hour with nowhere to be</h2><p>Warm oil, low light, music somewhere in the background. An erotic massage starts slowly — the shoulders and back let go first, everything else follows. It is how most of our guests begin, and for good reason: there is nothing to arrange, you just lie down.</p><p>It takes place in one of our three private apartments in central Prague — Nové Město, Žižkov or Anděl. Each has its own bathroom, fresh towels, and a shower before and after. Each profile says whether that companion offers massage.</p><h2>Price and where we meet</h2><p>From 30 minutes at 2,000 CZK on its own, though 60 minutes at 2,500 CZK leaves considerably more room — and with massage you feel the difference. The price covers the apartment and the shower, paid in cash on arrival. We do not do outcall. Between 11 PM and 7 AM a night rate applies, 500–1,000 CZK higher.</p>`,
      de: `<h2>Eine Stunde ohne Termin danach</h2><p>Warmes Öl, gedämpftes Licht, Musik irgendwo im Hintergrund. Eine erotische Massage beginnt langsam — zuerst lösen sich Schultern und Rücken, alles andere kommt später. Für die meisten unserer Gäste ist sie der Einstieg, und das aus gutem Grund: Es gibt nichts zu klären, Sie legen sich einfach hin.</p><p>Sie findet in einem unserer drei privaten Apartments im Zentrum von Prag statt — Nové Město, Žižkov oder Anděl. Jedes hat ein eigenes Bad, frische Handtücher und eine Dusche vor und nach dem Termin. Im Profil steht, wer Massage anbietet.</p><h2>Preis und Treffpunkt</h2><p>Einzeln ab 30 Minuten für 2.000 CZK, doch 60 Minuten für 2.500 CZK geben deutlich mehr Raum — und bei einer Massage merkt man das. Apartment und Dusche sind enthalten, bezahlt wird bar vor Ort. Kein Outcall. Zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif, 500–1.000 CZK höher.</p>`,
      uk: `<h2>Година, у якій нікуди не поспішають</h2><p>Тепла олія, приглушене світло, музика десь на тлі. Еротичний масаж починається повільно — спершу відпускають плечі й спина, усе інше приходить потім. Саме з нього починає більшість наших гостей, і не дарма: нічого не треба вирішувати, ви просто лягаєте.</p><p>Відбувається в одних із трьох приватних апартаментів у центрі Праги — Нове Місто, Жижков або Андел. У кожних власна ванна кімната, свіжі рушники й душ до і після. У профілі вказано, хто пропонує масаж.</p><h2>Ціна і де зустрічаємось</h2><p>Окремо від 30 хвилин за 2 000 Kč, але 60 хвилин за 2 500 Kč дають помітно більше простору — і на масажі це відчутно. Ціна включає апартаменти й душ, оплата готівкою на місці. Виїздів не робимо. З 23:00 до 7:00 діє нічний тариф, на 500–1 000 Kč вищий.</p>`,
    },
  },

  rimming_active: {
    seo_title: {
      cs: 'Rimming Praha — aktivní, ověřené společnice | LovelyGirls',
      en: 'Rimming Prague — active, verified companions | LovelyGirls',
      de: 'Rimming Prag — aktiv, verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Римінг Прага — активний, перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Rimming aktivní v privátním apartmánu v Praze. Které společnice službu nabízejí, je uvedeno v profilu. Hygiena a sprcha samozřejmostí, ceny od 2 000 Kč.',
      en: 'Active rimming in a private Prague apartment. Each profile states who offers it. Hygiene and shower standard, programs from 2,000 CZK.',
      de: 'Rimming aktiv im privaten Apartment in Prag. Im Profil steht, wer die Leistung anbietet. Hygiene und Dusche selbstverständlich, ab 2.000 CZK.',
      uk: 'Римінг активний у приватних апартаментах у Празі. У профілі вказано, хто пропонує послугу. Гігієна і душ — стандарт, від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Pozornost tam, kam se obvykle nedostane</h2><p>Rimming aktivní znamená, že službu poskytuje společnice. Nabízí ji jen část dívek a všechny mají jednu společnou podmínku — čistotu. Sprcha před setkáním je proto standard, ne příplatek.</p><p>Hygiena je u téhle služby zásadní a bereme ji vážně. V každém apartmánu je vlastní koupelna a sprcha před setkáním je standardní součástí, ne příplatek.</p><p>Rimming je doplňková služba — objednáváte si běžný program podle času, od 30 minut za 2 000 Kč nebo 60 minut za 2 500 Kč, a služba je jeho součástí u těch společnic, které ji nabízejí. Žádná zvláštní sazba se neúčtuje.</p><h2>Cena a kde se potkáme</h2><p>Setkáváme se výhradně v našich apartmánech v Novém Městě, na Žižkově a na Andělu. Platba hotově na místě. Mezi 23:00 a 7:00 platí noční sazba, o 500–1 000 Kč vyšší podle délky programu.</p>`,
      en: `<h2>Attention where it rarely goes</h2><p>Active rimming means the companion is the one performing. Only some girls offer it, and they all share one condition — cleanliness. A shower before the meeting is standard, not an extra.</p><p>Hygiene matters a great deal here and we treat it that way. Every apartment has its own bathroom, and a shower before the meeting is a standard part of it, not an extra.</p><p>Rimming is an add-on service: you book a normal time-based program — 30 minutes at 2,000 CZK or 60 minutes at 2,500 CZK — and it's included with the companions who offer it. There's no separate charge.</p><h2>Price and where we meet</h2><p>We meet in our apartments only, in Nové Město, Žižkov and Anděl. Payment is cash on arrival. Between 11 PM and 7 AM a night rate applies, 500–1,000 CZK higher depending on the program.</p>`,
      de: `<h2>Aufmerksamkeit dort, wo sie selten hinkommt</h2><p>Rimming aktiv bedeutet, die Begleiterin erbringt die Leistung. Nur einige Frauen bieten es an, und alle haben eine gemeinsame Bedingung — Sauberkeit. Eine Dusche vorher ist Standard, kein Aufpreis.</p><p>Hygiene ist hier besonders wichtig, und so behandeln wir sie auch. Jedes Apartment hat ein eigenes Bad, eine Dusche vor dem Treffen gehört selbstverständlich dazu und kostet nichts extra.</p><p>Rimming ist eine Zusatzleistung: Sie buchen ein normales zeitbasiertes Programm — 30 Minuten für 2.000 CZK oder 60 Minuten für 2.500 CZK — und bei den Begleiterinnen, die sie anbieten, ist sie enthalten. Es fällt kein Aufpreis an.</p><h2>Preis und Treffpunkt</h2><p>Wir treffen uns ausschließlich in unseren Apartments in Nové Město, Žižkov und Anděl. Zahlung bar vor Ort. Zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif, je nach Programm 500–1.000 CZK höher.</p>`,
      uk: `<h2>Увага там, куди зазвичай не доходить</h2><p>Римінг активний означає, що послугу надає супутниця. Пропонують її лише деякі дівчата, і всі мають одну спільну умову — чистоту. Душ перед зустріччю є стандартом, а не доплатою.</p><p>Гігієна тут особливо важлива, і ми ставимося до неї серйозно. У кожних апартаментах є власна ванна кімната, душ перед зустріччю — стандартна частина, а не доплата.</p><p>Римінг є додатковою послугою: ви замовляєте звичайну програму за часом — 30 хвилин за 2 000 Kč або 60 хвилин за 2 500 Kč — і в тих супутниць, які її пропонують, вона входить у програму. Окремої плати немає.</p><h2>Ціна і де зустрічаємось</h2><p>Зустрічаємося виключно в наших апартаментах у Новому Місті, Жижкові та на Анделі. Оплата готівкою на місці. З 23:00 до 7:00 діє нічний тариф, на 500–1 000 Kč вищий залежно від програми.</p>`,
    },
  },

  foot_fetish: {
    seo_title: {
      cs: 'Foot fetish Praha — ověřené společnice | LovelyGirls',
      en: 'Foot Fetish Prague — verified companions | LovelyGirls',
      de: 'Fußfetisch Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Футфетиш Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Foot fetish v privátním apartmánu v centru Prahy. V profilu každé společnice je uvedeno, zda službu nabízí. Programy od 30 minut, od 2 000 Kč.',
      en: 'Foot fetish in a private apartment in central Prague. Each profile shows whether she offers it. Programs from 30 minutes, from 2,000 CZK.',
      de: 'Fußfetisch im privaten Apartment im Zentrum von Prag. Im Profil steht, ob sie die Leistung anbietet. Ab 30 Minuten, ab 2.000 CZK.',
      uk: 'Футфетиш у приватних апартаментах у центрі Праги. У профілі вказано, чи пропонує вона послугу. Програми від 30 хвилин, від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Když detail rozhoduje</h2><p>Punčochy, podpatky, čerstvá pedikúra — nebo prostě jen bosé nohy. Foot fetish je o pozornosti k detailu a řada našich společnic ho nabízí ráda, protože ví, že tady jde o něco jiného než o spěch.</p><p>Řekněte při domluvě termínu, jakou představu máte. Když to dívka ví dopředu, přizpůsobí se — obuje se, upraví, připraví. Na místě už to většinou nejde. V profilu každé společnice najdete, jestli tuhle službu poskytuje.</p><h2>Cena a kde se potkáme</h2><p>Bez samostatné sazby — objednáváte běžný program podle času: 30 minut 2 000 Kč, 45 minut 2 200 Kč, 60 minut 2 500 Kč, delší varianty až po 120 minut za 4 500 Kč. Setkání probíhají v našich apartmánech v Novém Městě, na Žižkově a na Andělu. Platba hotově, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>When the detail is the point</h2><p>Stockings, heels, a fresh pedicure — or simply bare feet. Foot fetish is about attention to detail, and a good number of our companions enjoy offering it, because they know this is not something to rush.</p><p>Say what you have in mind when you arrange the time. Given notice she can prepare — the right shoes, the right look. On the spot that is usually too late. Each profile states whether she offers it.</p><h2>Price and where we meet</h2><p>No separate rate — you book a normal program by time: 30 minutes 2,000 CZK, 45 minutes 2,200 CZK, 60 minutes 2,500 CZK, and longer options up to 120 minutes at 4,500 CZK. Meetings take place in our apartments in Nové Město, Žižkov and Anděl. Cash payment, with a night rate between 11 PM and 7 AM.</p>`,
      de: `<h2>Wenn das Detail den Unterschied macht</h2><p>Strümpfe, High Heels, eine frische Pediküre — oder einfach nackte Füße. Fußfetisch lebt von der Aufmerksamkeit fürs Detail, und viele unserer Begleiterinnen bieten ihn gern an, weil sie wissen: Hier geht es nicht um Eile.</p><p>Sagen Sie bei der Terminabsprache, was Sie sich vorstellen. Mit Vorlauf kann sie sich darauf einstellen — die passenden Schuhe, das passende Bild. Vor Ort ist es dafür meist zu spät. Im Profil steht, ob sie die Leistung anbietet.</p><h2>Preis und Treffpunkt</h2><p>Kein eigener Tarif — Sie buchen ein normales Programm nach Zeit: 30 Minuten 2.000 CZK, 45 Minuten 2.200 CZK, 60 Minuten 2.500 CZK, längere Varianten bis 120 Minuten für 4.500 CZK. Treffen in unseren Apartments in Nové Město, Žižkov und Anděl. Barzahlung, zwischen 23:00 und 7:00 Uhr Nachttarif.</p>`,
      uk: `<h2>Коли вирішує деталь</h2><p>Панчохи, підбори, свіжий педикюр — або просто босі ноги. Футфетиш живе увагою до деталей, і чимало наших супутниць пропонують його залюбки, бо знають: тут ідеться не про поспіх.</p><p>Скажіть під час домовленості, що маєте на думці. Маючи запас часу, вона підготується — потрібне взуття, потрібний образ. На місці це вже зазвичай пізно. У профілі вказано, чи надає вона цю послугу.</p><h2>Ціна і де зустрічаємось</h2><p>Окремого тарифу немає — ви замовляєте звичайну програму за часом: 30 хвилин 2 000 Kč, 45 хвилин 2 200 Kč, 60 хвилин 2 500 Kč, довші варіанти аж до 120 хвилин за 4 500 Kč. Зустрічі в наших апартаментах у Новому Місті, Жижкові та на Анделі. Оплата готівкою, з 23:00 до 7:00 нічний тариф.</p>`,
    },
  },

  classic: {
    seo_title: {
      cs: 'Klasika — escort Praha od 2 000 Kč / 30 min | LovelyGirls',
      en: 'Classic — Prague escort from 2,000 CZK / 30 min | LovelyGirls',
      de: 'Klassisch — Escort Prag ab 2.000 CZK / 30 Min | LovelyGirls',
      uk: 'Класичний — ескорт Прага від 2 000 Kč / 30 хв | LovelyGirls',
    },
    seo_description: {
      cs: 'Klasika je součástí každého programu u všech společnic. Privátní apartmány Praha 2, 3 a 5. Ceny od 2 000 Kč za 30 minut, ochrana samozřejmostí.',
      en: 'Classic is included in every program with every companion. Private apartments in Prague 2, 3 and 5. From 2,000 CZK for 30 minutes, protection standard.',
      de: 'Klassisch ist in jedem Programm bei allen Begleiterinnen enthalten. Private Apartments in Prag 2, 3 und 5. Ab 2.000 CZK für 30 Minuten, Schutz selbstverständlich.',
      uk: 'Класичний входить у кожну програму в усіх супутниць. Приватні апартаменти Прага 2, 3 і 5. Від 2 000 Kč за 30 хвилин, захист — стандарт.',
    },
    content: {
      cs: `<h2>To, kvůli čemu se sem chodí</h2><p>Klasika je základ, který umí každá z našich společnic a je součástí každého programu. Nemusíte ji hledat, ptát se na ni ani ji zvlášť domlouvat — prostě tam je. Vždy s ochranou, bez výjimek.</p><p>Vždy s ochranou, bez výjimek. Je to podmínka pro obě strany a společnice ji neporušují ani na vyžádání — je zbytečné se o tom domlouvat.</p><p>Cena se odvíjí jen od času, ne od služeb. Programy začínají na 30 minutách za 2 000 Kč, nejčastěji se objednává 60 minut za 2 500 Kč, a jde jít až na 120 minut za 4 500 Kč. Cena zahrnuje apartmán i sprchu, nic dalšího se nepřipočítává.</p><h2>Cena a kde se potkáme</h2><p>Setkání probíhají v Novém Městě (Praha 2), na Žižkově (Praha 3) nebo na Andělu (Praha 5). Přesnou adresu dostanete po potvrzení termínu. Platí se hotově na místě. Mezi 23:00 a 7:00 platí noční sazba, o 500–1 000 Kč vyšší podle délky programu.</p>`,
      en: `<h2>The reason most people come</h2><p>Classic is the baseline every one of our companions offers, and it is part of every program. You do not need to look for it, ask about it or arrange it separately — it is simply there. Always with protection, no exceptions.</p><p>Always with protection, no exceptions. It's a condition on both sides and our companions won't drop it on request — there's no point negotiating it.</p><p>The price depends only on time, not on services. Programs start at 30 minutes for 2,000 CZK, 60 minutes at 2,500 CZK is the most common booking, and you can go up to 120 minutes for 4,500 CZK. The apartment and shower are included; nothing else gets added.</p><h2>Price and where we meet</h2><p>Meetings take place in Nové Město (Prague 2), Žižkov (Prague 3) or Anděl (Prague 5). You'll get the exact address once the time is confirmed. Payment is cash on arrival. Between 11 PM and 7 AM a night rate applies, 500–1,000 CZK higher depending on the program.</p>`,
      de: `<h2>Weshalb die meisten herkommen</h2><p>Klassisch ist die Basis, die jede unserer Begleiterinnen anbietet, und Teil jedes Programms. Sie müssen nicht danach suchen, nachfragen oder es gesondert absprechen — es ist einfach da. Immer mit Schutz, ohne Ausnahme.</p><p>Immer mit Schutz, ohne Ausnahme. Das ist eine Bedingung für beide Seiten, und unsere Begleiterinnen weichen auch auf Nachfrage nicht davon ab — Verhandeln ist zwecklos.</p><p>Der Preis richtet sich ausschließlich nach der Zeit, nicht nach den Leistungen. Die Programme beginnen bei 30 Minuten für 2.000 CZK, am häufigsten werden 60 Minuten für 2.500 CZK gebucht, möglich sind bis zu 120 Minuten für 4.500 CZK. Apartment und Dusche sind enthalten, es kommt nichts hinzu.</p><h2>Preis und Treffpunkt</h2><p>Treffen finden in Nové Město (Prag 2), Žižkov (Prag 3) oder Anděl (Prag 5) statt. Die genaue Adresse erhalten Sie nach der Terminbestätigung. Zahlung bar vor Ort. Zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif, je nach Programm 500–1.000 CZK höher.</p>`,
      uk: `<h2>Те, заради чого сюди приходять</h2><p>Класика — база, яку вміє кожна з наших супутниць, і вона входить у кожну програму. Не треба її шукати, питати чи окремо узгоджувати — вона просто є. Завжди із захистом, без винятків.</p><p>Завжди із захистом, без винятків. Це умова для обох сторін, і супутниці не відступають від неї навіть на прохання — домовлятися про це немає сенсу.</p><p>Ціна залежить лише від часу, а не від послуг. Програми починаються з 30 хвилин за 2 000 Kč, найчастіше замовляють 60 хвилин за 2 500 Kč, можливо й до 120 хвилин за 4 500 Kč. Апартаменти й душ входять у ціну, нічого не додається.</p><h2>Ціна і де зустрічаємось</h2><p>Зустрічі проходять у Новому Місті (Прага 2), Жижкові (Прага 3) або на Анделі (Прага 5). Точну адресу отримаєте після підтвердження часу. Оплата готівкою на місці. З 23:00 до 7:00 діє нічний тариф, на 500–1 000 Kč вищий залежно від програми.</p>`,
    },
  },

  deepthroat: {
    seo_title: {
      cs: 'Hluboký orál Praha — ověřené společnice | LovelyGirls',
      en: 'Deepthroat Prague — verified companions | LovelyGirls',
      de: 'Deepthroat Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Глибоке горло Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Hluboký orál v privátním apartmánu v centru Prahy. Které společnice ho nabízejí, je uvedeno v profilu. Programy od 30 minut, ceny od 2 000 Kč.',
      en: 'Deepthroat in a private apartment in central Prague. Each profile states who offers it. Programs from 30 minutes, from 2,000 CZK.',
      de: 'Deepthroat im privaten Apartment im Zentrum von Prag. Im Profil steht, wer es anbietet. Ab 30 Minuten, ab 2.000 CZK.',
      uk: 'Глибоке горло у приватних апартаментах у центрі Праги. У профілі вказано, хто пропонує. Програми від 30 хвилин, від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Beze spěchu a bez tlaku</h2><p>Hluboký orál nabízí část našich společnic — je to věc zkušenosti a klidu, ne výkonu. Kdo ji dělá, dělá ji ráda, a to je na tom to podstatné.</p><p>Je to doplňková služba k běžnému programu, neúčtuje se zvlášť. Vybíráte si podle času: 30 minut za 2 000 Kč, 45 minut za 2 200 Kč, 60 minut za 2 500 Kč, případně 90 nebo 120 minut.</p><p>V profilu je zvlášť uvedeno, zda společnice nabízí orál s ochranou nebo bez — jsou to samostatné položky a každá dívka má vlastní hranice. Co je v profilu, to platí; co tam není, nenabízíme.</p><h2>Cena a kde se potkáme</h2><p>Setkání probíhají výhradně v našich apartmánech — Nové Město, Žižkov, Anděl. Platba hotově, bez příplatků. Mezi 23:00 a 7:00 platí noční sazba, o 500–1 000 Kč vyšší podle délky programu.</p>`,
      en: `<h2>No rush, no pressure</h2><p>Deepthroat is offered by some of our companions — it is a matter of experience and ease, not performance. The ones who do it, enjoy it, and that is what makes the difference.</p><p>It's an add-on to a normal program and isn't billed separately. You choose by time: 30 minutes at 2,000 CZK, 45 minutes at 2,200 CZK, 60 minutes at 2,500 CZK, or 90 and 120 minutes.</p><p>Profiles list oral with and without protection as separate items, and every companion sets her own limits. What's on the profile is what's available; what isn't listed, we don't offer.</p><h2>Price and where we meet</h2><p>Meetings take place in our apartments only — Nové Město, Žižkov, Anděl. Cash payment, no surcharges. Between 11 PM and 7 AM a night rate applies, 500–1,000 CZK higher depending on the program.</p>`,
      de: `<h2>Ohne Eile, ohne Druck</h2><p>Deepthroat bieten einige unserer Begleiterinnen an — es ist eine Frage von Erfahrung und Gelassenheit, nicht von Leistung. Wer es macht, macht es gern, und genau darauf kommt es an.</p><p>Es ist eine Zusatzleistung zum normalen Programm und wird nicht separat berechnet. Sie wählen nach Zeit: 30 Minuten für 2.000 CZK, 45 Minuten für 2.200 CZK, 60 Minuten für 2.500 CZK, dazu 90 und 120 Minuten.</p><p>In den Profilen sind Oral mit und ohne Schutz getrennt aufgeführt, und jede Begleiterin setzt ihre eigenen Grenzen. Was im Profil steht, gilt; was nicht aufgeführt ist, bieten wir nicht an.</p><h2>Preis und Treffpunkt</h2><p>Treffen finden ausschließlich in unseren Apartments statt — Nové Město, Žižkov, Anděl. Barzahlung, keine Aufschläge. Zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif, je nach Programm 500–1.000 CZK höher.</p>`,
      uk: `<h2>Без поспіху й без тиску</h2><p>Глибоке горло пропонують деякі наші супутниці — це питання досвіду й спокою, а не результату. Хто це робить, робить із задоволенням, і саме в цьому річ.</p><p>Це додаткова послуга до звичайної програми, окремо не тарифікується. Обираєте за часом: 30 хвилин за 2 000 Kč, 45 хвилин за 2 200 Kč, 60 хвилин за 2 500 Kč, а також 90 і 120 хвилин.</p><p>У профілях оральний із захистом і без нього вказані окремо, і кожна супутниця встановлює власні межі. Що є в профілі — те доступне; чого немає, ми не пропонуємо.</p><h2>Ціна і де зустрічаємось</h2><p>Зустрічі проходять виключно в наших апартаментах — Нове Місто, Жижков, Андел. Оплата готівкою, без доплат. З 23:00 до 7:00 діє нічний тариф, на 500–1 000 Kč вищий залежно від програми.</p>`,
    },
  },

  threesome_fmf: {
    seo_title: {
      cs: 'Duo / bi trojka Praha (MŽŽ) — dvě společnice | LovelyGirls',
      en: 'Duo / Bi Threesome Prague (MFF) — two companions | LovelyGirls',
      de: 'Duo / Bi-Dreier Prag (MFF) — zwei Begleiterinnen | LovelyGirls',
      uk: 'Дуо / бі трійка Прага (MFF) — дві супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Duo se dvěma společnicemi v privátním apartmánu v Praze. Domlouvá se předem podle rozvrhu obou dívek. Delší programy od 60 minut, ceny v ceníku.',
      en: 'Duo with two companions in a private Prague apartment. Arranged in advance around both girls\' schedules. Longer programs from 60 minutes.',
      de: 'Duo mit zwei Begleiterinnen im privaten Apartment in Prag. Wird im Voraus nach den Zeitplänen beider Frauen abgestimmt. Längere Programme ab 60 Minuten.',
      uk: 'Дуо з двома супутницями у приватних апартаментах у Празі. Узгоджується заздалегідь за графіками обох дівчат. Довші програми від 60 хвилин.',
    },
    content: {
      cs: `<h2>Dvě, a obě u toho chtějí být</h2><p>Bi trojka je jiná liga než setkání ve dvou — a pozná se to hlavně na tom, jestli se ty dvě dívky spolu baví. Proto ji nabízí jen část společnic a proto se domlouvá dopředu.</p><p>Tohle je jediná služba, kterou je opravdu potřeba domluvit dopředu. Obě společnice musí mít směnu ve stejný čas a ve stejném apartmánu, takže volných termínů je výrazně méně než u běžného programu. Podívejte se do rozvrhu, kdo se kdy překrývá, nebo nám napište a najdeme termín za vás.</p><p>Doporučujeme si na duo vzít víc času — 30 minut je na dvě společnice krátkých. Nejčastěji se objednává 60 minut za 2 500 Kč nebo 120 minut za 4 500 Kč. Aktuální sazby pro duo najdete v ceníku.</p><h2>Cena a kde se potkáme</h2><p>Probíhá v jednom z našich apartmánů v Novém Městě, na Žižkově nebo na Andělu. Platí se hotově na místě. Mezi 23:00 a 7:00 platí noční sazba, o 500–1 000 Kč vyšší podle délky programu.</p>`,
      en: `<h2>Two of them, and both want to be there</h2><p>A bi threesome is a different league from meeting one companion — and the difference shows in whether the two of them actually enjoy each other. That is why only some offer it, and why it is arranged in advance.</p><p>This is the one service that genuinely needs arranging ahead. Both companions have to be on shift at the same time in the same apartment, so there are far fewer available slots than for a normal booking. Check the schedule to see whose shifts overlap, or message us and we'll find a time for you.</p><p>We'd suggest allowing more time for a duo — 30 minutes is short for two companions. The most common bookings are 60 minutes at 2,500 CZK or 120 minutes at 4,500 CZK. Current duo rates are on the pricing page.</p><h2>Price and where we meet</h2><p>It takes place in one of our apartments in Nové Město, Žižkov or Anděl. Payment is cash on arrival. Between 11 PM and 7 AM a night rate applies, 500–1,000 CZK higher depending on the program.</p>`,
      de: `<h2>Zwei, und beide wollen dabei sein</h2><p>Ein Bi-Dreier ist eine andere Liga als ein Treffen zu zweit — und man merkt es vor allem daran, ob die beiden Spaß miteinander haben. Deshalb bieten es nur einige an, und deshalb wird es vorher abgestimmt.</p><p>Das ist die eine Leistung, die wirklich im Voraus abgestimmt werden muss. Beide Begleiterinnen müssen zur selben Zeit im selben Apartment Schicht haben, daher gibt es deutlich weniger freie Termine als bei einer normalen Buchung. Sehen Sie im Zeitplan nach, wessen Schichten sich überschneiden, oder schreiben Sie uns — wir finden einen Termin.</p><p>Wir empfehlen, für ein Duo mehr Zeit einzuplanen — 30 Minuten sind für zwei Begleiterinnen knapp. Am häufigsten gebucht werden 60 Minuten für 2.500 CZK oder 120 Minuten für 4.500 CZK. Die aktuellen Duo-Tarife stehen in der Preisliste.</p><h2>Preis und Treffpunkt</h2><p>Es findet in einem unserer Apartments in Nové Město, Žižkov oder Anděl statt. Zahlung bar vor Ort. Zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif, je nach Programm 500–1.000 CZK höher.</p>`,
      uk: `<h2>Дві, і обидві хочуть тут бути</h2><p>Бі трійка — інша ліга, ніж зустріч удвох, і різниця видно передусім у тому, чи цим двом добре разом. Тому пропонують її лише деякі, і тому домовляються заздалегідь.</p><p>Це єдина послуга, яку справді треба узгодити заздалегідь. Обидві супутниці мають бути на зміні в один час і в тих самих апартаментах, тож вільних слотів помітно менше, ніж для звичайного замовлення. Подивіться в графік, чиї зміни збігаються, або напишіть нам — ми підберемо час.</p><p>Радимо закласти на дуо більше часу: 30 хвилин для двох супутниць — мало. Найчастіше замовляють 60 хвилин за 2 500 Kč або 120 хвилин за 4 500 Kč. Актуальні тарифи на дуо є в ціннику.</p><h2>Ціна і де зустрічаємось</h2><p>Відбувається в одних із наших апартаментів у Новому Місті, Жижкові чи на Анделі. Оплата готівкою на місці. З 23:00 до 7:00 діє нічний тариф, на 500–1 000 Kč вищий залежно від програми.</p>`,
    },
  },
  massage: {
    seo_title: {
      cs: 'Masáž Praha — součást každého programu | LovelyGirls',
      en: 'Massage Prague — included in every program | LovelyGirls',
      de: 'Massage Prag — in jedem Programm enthalten | LovelyGirls',
      uk: 'Масаж Прага — входить у кожну програму | LovelyGirls',
    },
    seo_description: {
      cs: 'Klasická masáž jako součást programu, bez příplatku. Privátní apartmány Praha 2, 3 a 5, programy od 30 minut za 2 000 Kč.',
      en: 'Ordinary massage as part of the program, at no extra charge. Private apartments in Prague 2, 3 and 5, from 30 minutes at 2,000 CZK.',
      de: 'Klassische Massage als Teil des Programms, ohne Aufpreis. Private Apartments in Prag 2, 3 und 5, ab 30 Minuten für 2.000 CZK.',
      uk: 'Класичний масаж як частина програми, без доплати. Приватні апартаменти Прага 2, 3 і 5, від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Nezaměňovat s erotickou</h2><p>Běžná masáž patří k základům — umí ji každá a je v každém programu bez příplatku. Erotická masáž je něco jiného, je vedená samostatně a nabízí ji jen část dívek.</p><p>Hodí se hlavně na začátek setkání, když se potřebujete uvolnit a nespěchat. Na 30 minut je na ni prostoru málo; kdo ji chce využít pořádně, bere si spíš 60 minut za 2 500 Kč.</p><h2>Cena a kde se potkáme</h2><p>Apartmány jsou tři — Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5), každý s vlastní koupelnou. Platí se hotově na místě.</p>`,
      en: `<h2>Not to be confused with the erotic one</h2><p>An ordinary massage is one of the basics — every companion does it and it is in every program at no extra charge. The erotic massage is a different thing, listed separately, offered by some girls only.</p><p>It works best at the start of a meeting, when you want to slow down and settle in. Thirty minutes leaves little room for it; if you actually want to use it, 60 minutes at 2,500 CZK is the better fit.</p><h2>Price and where we meet</h2><p>There are three apartments — Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5), each with its own bathroom. Payment is cash on arrival.</p>`,
      de: `<h2>Nicht mit der erotischen verwechseln</h2><p>Eine gewöhnliche Massage gehört zu den Basics — jede kann sie, und sie ist ohne Aufpreis in jedem Programm. Die erotische Massage ist etwas anderes, wird gesondert geführt und nur von einigen angeboten.</p><p>Am besten passt sie an den Anfang des Treffens, wenn Sie erst einmal ankommen wollen. In 30 Minuten bleibt dafür wenig Raum; wer sie wirklich nutzen möchte, nimmt eher 60 Minuten für 2.500 CZK.</p><h2>Preis und Treffpunkt</h2><p>Es gibt drei Apartments — Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5), jedes mit eigenem Bad. Zahlung bar vor Ort.</p>`,
      uk: `<h2>Не плутати з еротичним</h2><p>Звичайний масаж належить до базових — його вміє кожна, і він входить у кожну програму без доплати. Еротичний масаж — інша річ, вказана окремо, і пропонують її лише деякі дівчата.</p><p>Найкраще пасує на початок зустрічі, коли хочеться сповільнитися. За 30 хвилин на нього лишається мало часу; хто хоче скористатися ним по-справжньому, бере радше 60 хвилин за 2 500 Kč.</p><h2>Ціна і де зустрічаємось</h2><p>Апартаментів три — Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5), у кожних власна ванна кімната. Оплата готівкою на місці.</p>`,
    },
  },

  shared_shower: {
    seo_title: {
      cs: 'Společná sprcha — escort Praha | LovelyGirls',
      en: 'Shared Shower — Prague escort | LovelyGirls',
      de: 'Gemeinsame Dusche — Escort Prag | LovelyGirls',
      uk: 'Спільний душ — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Společná sprcha jako součást programu, bez příplatku. Každý z našich tří apartmánů v Praze má vlastní koupelnu, ručníky a kosmetiku.',
      en: 'A shared shower as part of the program, no extra charge. Each of our three Prague apartments has its own bathroom, towels and toiletries.',
      de: 'Gemeinsame Dusche als Teil des Programms, ohne Aufpreis. Jedes unserer drei Prager Apartments hat ein eigenes Bad, Handtücher und Kosmetik.',
      uk: 'Спільний душ як частина програми, без доплати. У кожних із трьох наших апартаментів у Празі є власна ванна кімната, рушники й косметика.',
    },
    content: {
      cs: `<h2>Kde to obvykle začíná</h2><p>Horká voda, pára na skle a chvíle, kdy ještě nikdo nikam nespěchá. Společná sprcha není položka na účtu — je to způsob, jak se poznat dřív, než se stihnete zamyslet. Nabízejí ji všechny společnice.</p><p>Každý z apartmánů má vlastní koupelnu s ručníky, sprchovým gelem a základní kosmetikou. Nemusíte si nic brát s sebou.</p><h2>Cena a kde se potkáme</h2><p>Nabízejí ji všechny společnice a je součástí každého programu, od 30 minut za 2 000 Kč výš. Apartmány: Nové Město, Žižkov, Anděl. Platba hotově.</p>`,
      en: `<h2>Where it usually starts</h2><p>Hot water, steam on the glass, and a moment when nobody is going anywhere yet. A shared shower is not a line on the bill — it is how you get acquainted before you have time to think about it. Every companion offers it.</p><p>Each apartment has its own bathroom with towels, shower gel and basic toiletries. You don't need to bring anything.</p><h2>Price and where we meet</h2><p>Every companion offers it and it's part of any program, from 30 minutes at 2,000 CZK upwards. Apartments: Nové Město, Žižkov, Anděl. Cash payment.</p>`,
      de: `<h2>Wo es meistens beginnt</h2><p>Heißes Wasser, beschlagenes Glas und ein Moment, in dem es noch niemand eilig hat. Die gemeinsame Dusche ist kein Posten auf der Rechnung — sie ist die Art, sich kennenzulernen, bevor man darüber nachdenkt. Alle Begleiterinnen bieten sie an.</p><p>Jedes Apartment hat ein eigenes Bad mit Handtüchern, Duschgel und grundlegender Kosmetik. Sie müssen nichts mitbringen.</p><h2>Preis und Treffpunkt</h2><p>Alle Begleiterinnen bieten es an, und es ist Teil jedes Programms, ab 30 Minuten für 2.000 CZK. Apartments: Nové Město, Žižkov, Anděl. Barzahlung.</p>`,
      uk: `<h2>Там, де це зазвичай починається</h2><p>Гаряча вода, пара на склі й мить, коли ще нікуди не поспішають. Спільний душ — не рядок у рахунку, а спосіб познайомитися раніше, ніж устигнете задуматися. Пропонують його всі супутниці.</p><p>У кожних апартаментах є власна ванна кімната з рушниками, гелем для душу та базовою косметикою. Брати з собою нічого не треба.</p><h2>Ціна і де зустрічаємось</h2><p>Пропонують усі супутниці, і він входить у будь-яку програму, від 30 хвилин за 2 000 Kč. Апартаменти: Нове Місто, Жижков, Андел. Оплата готівкою.</p>`,
    },
  },

  cuddling: {
    seo_title: {
      cs: 'Mazlení — escort Praha bez spěchu | LovelyGirls',
      en: 'Cuddling — unhurried Prague escort | LovelyGirls',
      de: 'Kuscheln — Escort Prag ohne Eile | LovelyGirls',
      uk: 'Обійми — ескорт Прага без поспіху | LovelyGirls',
    },
    seo_description: {
      cs: 'Mazlení je součástí každého programu u všech společnic. Privátní apartmány v centru Prahy, programy 30–120 minut od 2 000 Kč.',
      en: 'Cuddling is part of every program with every companion. Private apartments in central Prague, programs 30–120 minutes from 2,000 CZK.',
      de: 'Kuscheln ist bei allen Begleiterinnen Teil jedes Programms. Private Apartments im Zentrum von Prag, 30–120 Minuten ab 2.000 CZK.',
      uk: 'Обійми входять у кожну програму в усіх супутниць. Приватні апартаменти в центрі Праги, програми 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Někdy je blízkost to hlavní</h2><p>Ne každý sem chodí kvůli sexu. Spousta lidí přichází pro to, co se venku shání hůř — pro klid, dotek a hodinu, kdy po vás nikdo nic nechce. Mazlení umí a nabízí každá z našich společnic.</p><p>Na tohle je čas rozhodující. Třicet minut je krátkých, pokud nechcete spěchat — 60 minut za 2 500 Kč nebo 120 minut za 4 500 Kč dávají prostor, kde se nikam nežene.</p><h2>Cena a kde se potkáme</h2><p>Probíhá v privátním apartmánu v Novém Městě, na Žižkově nebo na Andělu. Adresu dostanete po potvrzení termínu, platí se hotově na místě.</p>`,
      en: `<h2>Sometimes closeness is the point</h2><p>Not everyone comes here for sex. Plenty of people come for what is harder to find outside — quiet, touch, and an hour where nobody wants anything from you. Every one of our companions offers cuddling.</p><p>Time is what matters for this. Thirty minutes is short if you don't want to rush — 60 minutes at 2,500 CZK or 120 minutes at 4,500 CZK give you room where nothing is hurried.</p><h2>Price and where we meet</h2><p>It takes place in a private apartment in Nové Město, Žižkov or Anděl. You get the address once the time is confirmed; payment is cash on arrival.</p>`,
      de: `<h2>Manchmal geht es vor allem um Nähe</h2><p>Nicht jeder kommt wegen Sex her. Viele kommen wegen dem, was draußen schwerer zu finden ist — Ruhe, Berührung und eine Stunde, in der niemand etwas von Ihnen will. Kuscheln bietet jede unserer Begleiterinnen an.</p><p>Entscheidend ist hier die Zeit. Dreißig Minuten sind knapp, wenn Sie es nicht eilig haben wollen — 60 Minuten für 2.500 CZK oder 120 Minuten für 4.500 CZK geben Raum, in dem nichts gehetzt wird.</p><h2>Preis und Treffpunkt</h2><p>Es findet in einem privaten Apartment in Nové Město, Žižkov oder Anděl statt. Die Adresse erhalten Sie nach der Terminbestätigung, gezahlt wird bar vor Ort.</p>`,
      uk: `<h2>Іноді головне — це близькість</h2><p>Не всі приходять сюди по секс. Багато хто приходить по те, що назовні знайти важче: спокій, дотик і годину, коли від вас нікому нічого не треба. Обійми вміє й пропонує кожна з наших супутниць.</p><p>Тут вирішує час. Тридцять хвилин — мало, якщо не хочете поспішати; 60 хвилин за 2 500 Kč або 120 хвилин за 4 500 Kč дають простір, де нікуди не квапитися.</p><h2>Ціна і де зустрічаємось</h2><p>Відбувається у приватних апартаментах у Новому Місті, Жижкові чи на Анделі. Адресу отримаєте після підтвердження часу, оплата готівкою на місці.</p>`,
    },
  },

  69: {
    seo_title: {
      cs: 'Poloha 69 — escort Praha | LovelyGirls',
      en: '69 Position — Prague escort | LovelyGirls',
      de: 'Stellung 69 — Escort Prag | LovelyGirls',
      uk: 'Поза 69 — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Poloha 69 je základní služba u všech společnic, bez příplatku. Privátní apartmány Praha 2, 3 a 5, programy od 30 minut za 2 000 Kč.',
      en: 'The 69 position is a basic service with every companion, no surcharge. Private apartments in Prague 2, 3 and 5, from 30 minutes at 2,000 CZK.',
      de: 'Die Stellung 69 ist bei allen Begleiterinnen eine Basisleistung, ohne Aufpreis. Private Apartments in Prag 2, 3 und 5, ab 2.000 CZK.',
      uk: 'Поза 69 — базова послуга в усіх супутниць, без доплати. Приватні апартаменти Прага 2, 3 і 5, від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Oba zároveň, nikdo nečeká</h2><p>Poloha 69 patří k základům — umí ji každá z našich společnic a je součástí každého programu. Jestli je při ní orál s ochranou nebo bez, se řídí tím, co má daná dívka v profilu.</p><p>Jestli je při ní orál s ochranou nebo bez, se řídí tím, co má konkrétní dívka uvedené u orálních služeb. To se mezi společnicemi liší a v profilu je to vždy rozepsané.</p><h2>Cena a kde se potkáme</h2><p>Cena je daná jen délkou programu: 30 minut 2 000 Kč, 60 minut 2 500 Kč, 120 minut 4 500 Kč. Apartmány Nové Město, Žižkov a Anděl, platba hotově na místě.</p>`,
      en: `<h2>Both at once, nobody waiting</h2><p>The 69 position is one of the basics — every one of our companions does it and it is part of every program. Whether the oral part is with or without protection follows what she lists on her profile.</p><p>Whether the oral part is with or without protection follows whatever that particular girl lists under her oral services. It varies between companions and is always spelled out on her profile.</p><h2>Price and where we meet</h2><p>The price depends only on program length: 30 minutes 2,000 CZK, 60 minutes 2,500 CZK, 120 minutes 4,500 CZK. Apartments in Nové Město, Žižkov and Anděl, cash on arrival.</p>`,
      de: `<h2>Beide zugleich, niemand wartet</h2><p>Die Stellung 69 gehört zu den Basics — jede unserer Begleiterinnen macht sie, und sie ist Teil jedes Programms. Ob der orale Teil mit oder ohne Schutz stattfindet, richtet sich nach ihrem Profil.</p><p>Ob der orale Teil mit oder ohne Schutz stattfindet, richtet sich danach, was die jeweilige Frau bei den Oralleistungen angegeben hat. Das unterscheidet sich und steht immer im Profil.</p><h2>Preis und Treffpunkt</h2><p>Der Preis hängt nur von der Programmlänge ab: 30 Minuten 2.000 CZK, 60 Minuten 2.500 CZK, 120 Minuten 4.500 CZK. Apartments in Nové Město, Žižkov und Anděl, Barzahlung.</p>`,
      uk: `<h2>Обоє водночас, ніхто не чекає</h2><p>Поза 69 належить до базових — її вміє кожна з наших супутниць, і вона входить у кожну програму. Чи буде оральна частина із захистом, залежить від того, що вказано в її профілі.</p><p>Чи буде оральна частина із захистом чи без, залежить від того, що конкретна дівчина вказала в оральних послугах. Це різниться і завжди розписано в профілі.</p><h2>Ціна і де зустрічаємось</h2><p>Ціна залежить лише від тривалості програми: 30 хвилин 2 000 Kč, 60 хвилин 2 500 Kč, 120 хвилин 4 500 Kč. Апартаменти Нове Місто, Жижков і Андел, оплата готівкою.</p>`,
    },
  },
  blowjob_condom: {
    seo_title: {
      cs: 'Orál s kondomem — escort Praha | LovelyGirls',
      en: 'Blowjob with Condom — Prague escort | LovelyGirls',
      de: 'Blowjob mit Kondom — Escort Prag | LovelyGirls',
      uk: 'Оральний із презервативом — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Orál s kondomem je základní služba u všech společnic, bez příplatku. Programy 30–120 minut od 2 000 Kč, privátní apartmány v centru Prahy.',
      en: 'Oral with a condom is a basic service with every companion, no surcharge. Programs 30–120 minutes from 2,000 CZK, private apartments in central Prague.',
      de: 'Oral mit Kondom ist bei allen Begleiterinnen eine Basisleistung, ohne Aufpreis. Programme 30–120 Minuten ab 2.000 CZK, private Apartments in Prag.',
      uk: 'Оральний із презервативом — базова послуга в усіх супутниць, без доплати. Програми 30–120 хвилин від 2 000 Kč, приватні апартаменти в центрі Праги.',
    },
    content: {
      cs: `<h2>Základ, který umí každá</h2><p>Orál s kondomem nabízejí všechny naše společnice a je součástí každého programu. Nemusíte ho hledat ani domlouvat. Varianta bez ochrany je vedená zvlášť a má ji jen část dívek.</p><p>Orál bez ochrany je vedený jako samostatná služba a nabízí ho jen část dívek — najdete ho v jejich profilu jako zvláštní položku. To, co v profilu není, se na místě nedomlouvá.</p><h2>Cena a kde se potkáme</h2><p>Cena se řídí jen časem: od 30 minut za 2 000 Kč po 120 minut za 4 500 Kč. Setkání probíhají v apartmánech Nové Město, Žižkov a Anděl, platí se hotově.</p>`,
      en: `<h2>The baseline every one of them offers</h2><p>Oral with a condom is offered by all our companions and is part of every program. Nothing to look for, nothing to arrange. The version without protection is listed separately and only some girls offer it.</p><p>Oral without protection is listed as a separate service and only some girls offer it — you'll find it on their profile as its own item. What isn't on the profile isn't negotiated on the spot.</p><h2>Price and where we meet</h2><p>The price follows time alone: from 30 minutes at 2,000 CZK to 120 minutes at 4,500 CZK. Meetings take place in the Nové Město, Žižkov and Anděl apartments, cash payment.</p>`,
      de: `<h2>Die Basis, die jede beherrscht</h2><p>Oral mit Kondom bieten alle unsere Begleiterinnen an, und es ist Teil jedes Programms. Nichts zu suchen, nichts abzusprechen. Die Variante ohne Schutz steht gesondert und wird nur von einigen angeboten.</p><p>Oral ohne Schutz wird als eigene Leistung geführt und nur von einigen Frauen angeboten — im Profil steht es als eigener Punkt. Was nicht im Profil steht, wird vor Ort nicht verhandelt.</p><h2>Preis und Treffpunkt</h2><p>Der Preis richtet sich allein nach der Zeit: von 30 Minuten für 2.000 CZK bis 120 Minuten für 4.500 CZK. Treffen in den Apartments Nové Město, Žižkov und Anděl, Barzahlung.</p>`,
      uk: `<h2>База, яку вміє кожна</h2><p>Оральний із презервативом пропонують усі наші супутниці, і він входить у кожну програму. Нічого шукати, нічого узгоджувати. Варіант без захисту вказано окремо, і він є лише в частини дівчат.</p><p>Оральний без захисту значиться окремою послугою, і пропонують його лише деякі дівчата — у профілі він стоїть окремим пунктом. Чого немає в профілі, того не узгоджують на місці.</p><h2>Ціна і де зустрічаємось</h2><p>Ціна залежить лише від часу: від 30 хвилин за 2 000 Kč до 120 хвилин за 4 500 Kč. Зустрічі в апартаментах Нове Місто, Жижков і Андел, оплата готівкою.</p>`,
    },
  },
  licking: {
    seo_title: {
      cs: 'Lízání — escort Praha | LovelyGirls',
      en: 'Licking — Prague escort | LovelyGirls',
      de: 'Lecken — Escort Prag | LovelyGirls',
      uk: 'Кунілінгус — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Lízání je základní služba u všech společnic, bez příplatku. Privátní apartmány v centru Prahy, programy od 30 minut za 2 000 Kč.',
      en: 'Licking is a basic service with every companion, no surcharge. Private apartments in central Prague, programs from 30 minutes at 2,000 CZK.',
      de: 'Lecken ist bei allen Begleiterinnen eine Basisleistung, ohne Aufpreis. Private Apartments im Zentrum von Prag, ab 30 Minuten für 2.000 CZK.',
      uk: 'Кунілінгус — базова послуга в усіх супутниць, без доплати. Приватні апартаменти в центрі Праги, програми від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Pozornost, která jde oběma směry</h2><p>Lízání patří k základním službám a nabízejí ho všechny naše společnice — bez příplatku a bez domlouvání. Hygiena je oboustranná, sprcha před setkáním je součástí programu.</p><p>Stejně jako u ostatních základních služeb platí, že hygiena je oboustranná — sprcha před setkáním je standardní součástí a v každém apartmánu je vlastní koupelna.</p><h2>Cena a kde se potkáme</h2><p>Programy: 30 minut 2 000 Kč, 45 minut 2 200 Kč, 60 minut 2 500 Kč, 90 minut 4 000 Kč, 120 minut 4 500 Kč. Apartmány Nové Město (Praha 2), Žižkov (Praha 3), Anděl (Praha 5).</p>`,
      en: `<h2>Attention that runs both ways</h2><p>Licking is one of the basics and every one of our companions offers it — no surcharge, nothing to arrange. Hygiene runs both ways, and a shower before the meeting is part of the program.</p><p>As with the other basics, hygiene runs both ways — a shower before the meeting is standard and every apartment has its own bathroom.</p><h2>Price and where we meet</h2><p>Programs: 30 minutes 2,000 CZK, 45 minutes 2,200 CZK, 60 minutes 2,500 CZK, 90 minutes 4,000 CZK, 120 minutes 4,500 CZK. Apartments in Nové Město (Prague 2), Žižkov (Prague 3), Anděl (Prague 5).</p>`,
      de: `<h2>Aufmerksamkeit in beide Richtungen</h2><p>Lecken gehört zu den Basisleistungen, und alle unsere Begleiterinnen bieten es an — ohne Aufpreis, ohne Absprache. Hygiene gilt beidseitig, eine Dusche vorher gehört zum Programm.</p><p>Wie bei den anderen Basisleistungen gilt Hygiene beidseitig — eine Dusche vor dem Treffen ist Standard, und jedes Apartment hat ein eigenes Bad.</p><h2>Preis und Treffpunkt</h2><p>Programme: 30 Minuten 2.000 CZK, 45 Minuten 2.200 CZK, 60 Minuten 2.500 CZK, 90 Minuten 4.000 CZK, 120 Minuten 4.500 CZK. Apartments in Nové Město (Prag 2), Žižkov (Prag 3), Anděl (Prag 5).</p>`,
      uk: `<h2>Увага, що йде в обидва боки</h2><p>Кунілінгус належить до базових послуг, і його пропонують усі наші супутниці — без доплати й без домовленостей. Гігієна двостороння, душ перед зустріччю входить у програму.</p><p>Як і в інших базових послугах, гігієна двостороння — душ перед зустріччю є стандартом, і в кожних апартаментах власна ванна кімната.</p><h2>Ціна і де зустрічаємось</h2><p>Програми: 30 хвилин 2 000 Kč, 45 хвилин 2 200 Kč, 60 хвилин 2 500 Kč, 90 хвилин 4 000 Kč, 120 хвилин 4 500 Kč. Апартаменти Нове Місто (Прага 2), Жижков (Прага 3), Андел (Прага 5).</p>`,
    },
  },
  cum_on_body: {
    seo_title: {
      cs: 'Výstřik na tělo — escort Praha | LovelyGirls',
      en: 'Cum on Body — Prague escort | LovelyGirls',
      de: 'Abspritzen auf den Körper — Escort Prag | LovelyGirls',
      uk: 'Фінал на тіло — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Výstřik na tělo je základní služba u všech společnic, bez příplatku. Programy 30–120 minut od 2 000 Kč, apartmány Praha 2, 3 a 5.',
      en: 'Cum on body is a basic service with every companion, no surcharge. Programs 30–120 minutes from 2,000 CZK, apartments in Prague 2, 3 and 5.',
      de: 'Abspritzen auf den Körper ist bei allen Begleiterinnen eine Basisleistung, ohne Aufpreis. 30–120 Minuten ab 2.000 CZK, Apartments in Prag 2, 3 und 5.',
      uk: 'Фінал на тіло — базова послуга в усіх супутниць, без доплати. Програми 30–120 хвилин від 2 000 Kč, апартаменти Прага 2, 3 і 5.',
    },
    content: {
      cs: `<h2>Základní varianta, kterou má každá</h2><p>Výstřik na tělo nabízejí všechny společnice a je zahrnutý v ceně programu. Ostatní varianty — do pusy, na obličej — jsou v profilu vedené zvlášť a má je jen část dívek.</p><p>Ostatní varianty jsou vedené zvlášť — výstřik do pusy i na obličej má každý svou položku a nabízí je jen část dívek. Co má konkrétní společnice uvedené v profilu, to platí; ostatní se nedomlouvá na místě.</p><h2>Cena a kde se potkáme</h2><p>Cena je jen za čas: 30 minut 2 000 Kč až 120 minut 4 500 Kč. Sprcha po je samozřejmostí, v každém apartmánu je vlastní koupelna. Platí se hotově na místě.</p>`,
      en: `<h2>The baseline, available with everyone</h2><p>Cum on body is offered by every companion and included in the program price. The other variants — in the mouth, on the face — are listed separately and only some girls offer them.</p><p>The other variants are listed separately — cum in mouth and cum on face each have their own entry and only some girls offer them. What a companion has on her profile is what applies; anything else isn't arranged on the spot.</p><h2>Price and where we meet</h2><p>The price is for time alone: 30 minutes 2,000 CZK up to 120 minutes 4,500 CZK. A shower afterwards is a given, and every apartment has its own bathroom. Cash on arrival.</p>`,
      de: `<h2>Die Basisvariante, die es bei allen gibt</h2><p>Abspritzen auf den Körper bieten alle Begleiterinnen an, und es ist im Programmpreis enthalten. Die übrigen Varianten — in den Mund, ins Gesicht — stehen gesondert und werden nur von einigen angeboten.</p><p>Die übrigen Varianten sind gesondert aufgeführt — in den Mund und ins Gesicht haben jeweils einen eigenen Eintrag und werden nur von einigen Frauen angeboten. Was im Profil steht, gilt; alles andere wird nicht vor Ort verhandelt.</p><h2>Preis und Treffpunkt</h2><p>Der Preis gilt nur der Zeit: 30 Minuten 2.000 CZK bis 120 Minuten 4.500 CZK. Eine Dusche danach ist selbstverständlich, jedes Apartment hat ein eigenes Bad. Barzahlung.</p>`,
      uk: `<h2>Базовий варіант, який є в кожної</h2><p>Фінал на тіло пропонують усі супутниці, і він входить у ціну програми. Інші варіанти — у рот, на обличчя — вказані окремо, і є лише в частини дівчат.</p><p>Інші варіанти вказані окремо — фінал у рот і на обличчя мають власні пункти, і пропонують їх лише деякі дівчата. Що вказано в профілі супутниці, те й діє; решта на місці не узгоджується.</p><h2>Ціна і де зустрічаємось</h2><p>Ціна лише за час: 30 хвилин 2 000 Kč до 120 хвилин 4 500 Kč. Душ після — само собою, у кожних апартаментах власна ванна кімната. Оплата готівкою.</p>`,
    },
  },
  kissing: {
    seo_title: {
      cs: 'Francouzské líbání — escort Praha | LovelyGirls',
      en: 'French Kissing — Prague escort | LovelyGirls',
      de: 'Zungenküsse — Escort Prag | LovelyGirls',
      uk: 'Французькі поцілунки — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Líbání nabízí část našich společnic — je uvedené v profilu. Privátní apartmány v centru Prahy, programy od 30 minut za 2 000 Kč.',
      en: 'Kissing is offered by some of our companions and is listed on the profile. Private apartments in central Prague, from 30 minutes at 2,000 CZK.',
      de: 'Küssen bieten einige unserer Begleiterinnen an, im Profil angegeben. Private Apartments im Zentrum von Prag, ab 30 Minuten für 2.000 CZK.',
      uk: 'Поцілунки пропонують деякі наші супутниці — це вказано в профілі. Приватні апартаменти в центрі Праги, від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>To, co odlišuje setkání od služby</h2><p>Francouzské líbání je pro spoustu lidí ta jediná věc, která rozhoduje. Nabízí ho ale jen část společnic — je to osobní hranice a nikoho do ní netlačíme.</p><p>Jestli konkrétní dívka líbá, najdete v seznamu služeb v jejím profilu. Ptát se na to ve zprávách nemá smysl; profil je závazný a co v něm není, na místě se nedomlouvá.</p><h2>Cena a kde se potkáme</h2><p>Jde o službu bez příplatku — platíte jen čas: 30 minut 2 000 Kč, 60 minut 2 500 Kč, 120 minut 4 500 Kč. Apartmány Nové Město, Žižkov, Anděl.</p>`,
      en: `<h2>What separates a meeting from a service</h2><p>For a lot of people French kissing is the one thing that decides it. Only some companions offer it, though — it is a personal boundary and nobody is pushed on it.</p><p>Whether a particular girl kisses is in the service list on her profile. Asking over messages doesn't help; the profile is binding, and what isn't on it isn't arranged on the spot.</p><h2>Price and where we meet</h2><p>There's no surcharge — you pay for time only: 30 minutes 2,000 CZK, 60 minutes 2,500 CZK, 120 minutes 4,500 CZK. Apartments in Nové Město, Žižkov, Anděl.</p>`,
      de: `<h2>Was ein Treffen von einer Dienstleistung unterscheidet</h2><p>Für viele ist der Zungenkuss das Einzige, worauf es ankommt. Ihn bieten aber nur einige Begleiterinnen an — das ist eine persönliche Grenze, und niemand wird dazu gedrängt.</p><p>Ob eine bestimmte Frau küsst, steht in der Leistungsliste ihres Profils. Nachfragen per Nachricht bringt nichts; das Profil ist verbindlich, und was nicht darin steht, wird vor Ort nicht vereinbart.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Zeit: 30 Minuten 2.000 CZK, 60 Minuten 2.500 CZK, 120 Minuten 4.500 CZK. Apartments in Nové Město, Žižkov, Anděl.</p>`,
      uk: `<h2>Те, що відрізняє зустріч від послуги</h2><p>Для багатьох саме французький поцілунок усе вирішує. Але пропонують його лише деякі супутниці — це особиста межа, і нікого до неї не підштовхують.</p><p>Чи цілується конкретна дівчина, вказано в переліку послуг у її профілі. Питати в повідомленнях не має сенсу: профіль є зобовʼязальним, а чого в ньому немає, на місці не узгоджують.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за час: 30 хвилин 2 000 Kč, 60 хвилин 2 500 Kč, 120 хвилин 4 500 Kč. Апартаменти Нове Місто, Жижков, Андел.</p>`,
    },
  },
  blowjob_no_condom: {
    seo_title: {
      cs: 'Orál bez kondomu Praha — ověřené společnice | LovelyGirls',
      en: 'Blowjob without Condom Prague — verified companions | LovelyGirls',
      de: 'Blowjob ohne Kondom Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Оральний без презерватива Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Orál bez ochrany nabízí jen část společnic — je uvedený v profilu jako samostatná služba. Programy od 30 minut za 2 000 Kč, bez příplatku.',
      en: 'Oral without protection is offered by some companions only and listed as a separate service on the profile. Programs from 30 minutes at 2,000 CZK, no surcharge.',
      de: 'Oral ohne Schutz bieten nur einige Begleiterinnen an, im Profil als eigene Leistung. Ab 30 Minuten für 2.000 CZK, ohne Aufpreis.',
      uk: 'Оральний без захисту пропонують лише деякі супутниці — окрема послуга в профілі. Від 30 хвилин за 2 000 Kč, без доплати.',
    },
    content: {
      cs: `<h2>Bez bariéry, s vaší i její důvěrou</h2><p>Orál bez ochrany nabízí jen část dívek a je to jejich vlastní rozhodnutí. V profilu je vedený zvlášť od orálu s kondomem, takže víte předem, na čem jste.</p><p>V profilu každé společnice jsou obě varianty rozepsané zvlášť, takže si předem ověříte, co je u ní možné. Tohle je spolehlivější než dotaz ve zprávách a nemusí se to řešit na místě.</p><h2>Cena a kde se potkáme</h2><p>Služba nemá zvláštní sazbu — účtuje se běžný program podle času, od 2 000 Kč za 30 minut. Setkání probíhají v našich apartmánech v Novém Městě, na Žižkově a na Andělu, platí se hotově.</p>`,
      en: `<h2>Nothing in between, on both sides trust</h2><p>Oral without protection is offered by some girls only, and it is entirely their own decision. It is listed separately from oral with a condom, so you know in advance where you stand.</p><p>Every companion's profile spells out both variants separately, so you can check in advance what's possible with her. That's more reliable than asking over messages and means nothing has to be settled on the spot.</p><h2>Price and where we meet</h2><p>There's no special rate — you're charged the normal time-based program, from 2,000 CZK for 30 minutes. Meetings take place in our Nové Město, Žižkov and Anděl apartments, cash payment.</p>`,
      de: `<h2>Nichts dazwischen, auf beiden Seiten Vertrauen</h2><p>Oral ohne Schutz bieten nur einige Frauen an, und das ist ihre eigene Entscheidung. Im Profil steht es getrennt von Oral mit Kondom, sodass Sie vorher wissen, woran Sie sind.</p><p>Im Profil jeder Begleiterin sind beide Varianten getrennt aufgeführt, sodass Sie vorab prüfen können, was bei ihr möglich ist. Das ist verlässlicher als eine Nachfrage per Nachricht, und vor Ort muss nichts geklärt werden.</p><h2>Preis und Treffpunkt</h2><p>Es gibt keinen Sondertarif — berechnet wird das normale zeitbasierte Programm, ab 2.000 CZK für 30 Minuten. Treffen in unseren Apartments in Nové Město, Žižkov und Anděl, Barzahlung.</p>`,
      uk: `<h2>Нічого між вами — і довіра з обох боків</h2><p>Оральний без захисту пропонують лише деякі дівчата, і це виключно їхнє рішення. У профілі він указаний окремо від орального з презервативом, тож ви знаєте заздалегідь, на що розраховувати.</p><p>У профілі кожної супутниці обидва варіанти розписані окремо, тож ви заздалегідь перевірите, що можливо саме в неї. Це надійніше за запитання в повідомленнях, і на місці нічого не треба вирішувати.</p><h2>Ціна і де зустрічаємось</h2><p>Окремого тарифу немає — рахується звичайна програма за часом, від 2 000 Kč за 30 хвилин. Зустрічі в наших апартаментах у Новому Місті, Жижкові та на Анделі, оплата готівкою.</p>`,
    },
  },
  cim: {
    seo_title: {
      cs: 'Výstřik do pusy — escort Praha | LovelyGirls',
      en: 'Cum in Mouth — Prague escort | LovelyGirls',
      de: 'Abspritzen in den Mund — Escort Prag | LovelyGirls',
      uk: 'Фінал у рот — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Výstřik do pusy nabízí část společnic, je uvedený v profilu. Bez příplatku, programy 30–120 minut od 2 000 Kč, apartmány v centru Prahy.',
      en: 'Cum in mouth is offered by some companions and is listed on the profile. No surcharge, programs 30–120 minutes from 2,000 CZK, central Prague apartments.',
      de: 'Abspritzen in den Mund bieten einige Begleiterinnen an, im Profil angegeben. Ohne Aufpreis, 30–120 Minuten ab 2.000 CZK.',
      uk: 'Фінал у рот пропонують деякі супутниці, вказано в профілі. Без доплати, програми 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Konec podle vaší představy</h2><p>Výstřik do pusy nabízí část našich společnic — v profilu je vedený zvlášť od polykání, protože to nejsou dvě jména pro totéž. Základní varianta, kterou má každá, je na tělo.</p><p>Základní varianta zahrnutá u všech je výstřik na tělo; tahle a výstřik na obličej jsou navíc a jen u těch, kdo je má uvedené.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje, platíte jen délku programu — 30 minut 2 000 Kč, 60 minut 2 500 Kč, 120 minut 4 500 Kč. Sprcha po je samozřejmostí. Apartmány Nové Město, Žižkov, Anděl.</p>`,
      en: `<h2>Finishing the way you pictured it</h2><p>Cum in mouth is offered by some of our companions — listed separately from swallowing, because those are not two names for the same thing. The baseline everyone offers is on the body.</p><p>The baseline everyone includes is cum on body; this one and cum on face are extras, available only from those who list them.</p><h2>Price and where we meet</h2><p>There's no surcharge — you pay for program length only: 30 minutes 2,000 CZK, 60 minutes 2,500 CZK, 120 minutes 4,500 CZK. A shower afterwards is a given. Apartments in Nové Město, Žižkov, Anděl.</p>`,
      de: `<h2>Der Schluss, den Sie sich vorstellen</h2><p>Abspritzen in den Mund bieten einige unserer Begleiterinnen an — im Profil getrennt vom Schlucken, denn das sind nicht zwei Namen für dasselbe. Die Basisvariante bei allen ist auf den Körper.</p><p>Die Basisvariante, die alle einschließen, ist auf den Körper; diese hier und ins Gesicht sind Zusatz und nur bei denen möglich, die sie angeben.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an, Sie zahlen nur die Programmlänge — 30 Minuten 2.000 CZK, 60 Minuten 2.500 CZK, 120 Minuten 4.500 CZK. Eine Dusche danach ist selbstverständlich.</p>`,
      uk: `<h2>Фінал таким, яким ви його уявляли</h2><p>Фінал у рот пропонують деякі наші супутниці — у профілі він указаний окремо від ковтання, бо це не дві назви того самого. Базовий варіант, який є в усіх, — на тіло.</p><p>Базовий варіант, який включають усі, — на тіло; цей і на обличчя є додатковими й доступні лише в тих, хто їх вказав.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає, ви платите лише за тривалість програми — 30 хвилин 2 000 Kč, 60 хвилин 2 500 Kč, 120 хвилин 4 500 Kč. Душ після — само собою.</p>`,
    },
  },
  cof: {
    seo_title: {
      cs: 'Výstřik na obličej — escort Praha | LovelyGirls',
      en: 'Cum on Face — Prague escort | LovelyGirls',
      de: 'Abspritzen ins Gesicht — Escort Prag | LovelyGirls',
      uk: 'Фінал на обличчя — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Výstřik na obličej nabízí část společnic, uvedeno v profilu. Bez příplatku, programy od 30 minut za 2 000 Kč, apartmány Praha 2, 3 a 5.',
      en: 'Cum on face is offered by some companions and listed on the profile. No surcharge, programs from 30 minutes at 2,000 CZK, apartments in Prague 2, 3 and 5.',
      de: 'Abspritzen ins Gesicht bieten einige Begleiterinnen an, im Profil angegeben. Ohne Aufpreis, ab 30 Minuten für 2.000 CZK.',
      uk: 'Фінал на обличчя пропонують деякі супутниці, вказано в профілі. Без доплати, від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Není to samozřejmost — a to je dobře</h2><p>Výstřik na obličej má v profilu jen část společnic. Nepředpokládejte to automaticky; základní zahrnutá varianta je na tělo. Co je v profilu, na to se můžete spolehnout.</p><p>Profil je závazný v obou směrech: co v něm je, na to se můžete spolehnout, a co v něm není, se na místě neřeší. Ušetří to nepříjemnou situaci oběma stranám.</p><h2>Cena a kde se potkáme</h2><p>Služba je bez příplatku, platí se běžná sazba za čas — od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. V každém apartmánu je vlastní koupelna, sprcha po je standard.</p>`,
      en: `<h2>Not a given — and that is the point</h2><p>Only some companions list cum on face. Do not assume it by default; the included baseline is on the body. What is on the profile, you can count on.</p><p>The profile is binding both ways: what's on it you can count on, and what isn't on it isn't dealt with on the spot. That spares both sides an awkward moment.</p><h2>Price and where we meet</h2><p>There's no surcharge; the normal time rate applies — from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Every apartment has its own bathroom and a shower afterwards is standard.</p>`,
      de: `<h2>Keine Selbstverständlichkeit — und das ist gut so</h2><p>Abspritzen ins Gesicht führen nur einige Begleiterinnen im Profil. Setzen Sie es nicht voraus; die enthaltene Basisvariante ist auf den Körper. Worauf im Profil steht, darauf ist Verlass.</p><p>Das Profil ist in beide Richtungen verbindlich: Worauf es steht, darauf können Sie sich verlassen; was fehlt, wird vor Ort nicht verhandelt. Das erspart beiden Seiten eine unangenehme Situation.</p><h2>Preis und Treffpunkt</h2><p>Kein Aufpreis, es gilt der normale Zeittarif — von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Jedes Apartment hat ein eigenes Bad, eine Dusche danach ist Standard.</p>`,
      uk: `<h2>Це не саме собою — і це добре</h2><p>Фінал на обличчя вказують у профілі лише деякі супутниці. Не припускайте це за замовчуванням: базовий включений варіант — на тіло. На те, що є в профілі, можна покластися.</p><p>Профіль зобовʼязальний в обидва боки: на те, що в ньому є, можна покластися, а чого немає — на місці не обговорюють. Це рятує обидві сторони від незручності.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає, діє звичайний тариф за час — від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. У кожних апартаментах власна ванна кімната, душ після — стандарт.</p>`,
    },
  },
  swallow: {
    seo_title: {
      cs: 'Polykání — escort Praha | LovelyGirls',
      en: 'Swallowing — Prague escort | LovelyGirls',
      de: 'Schlucken — Escort Prag | LovelyGirls',
      uk: 'Ковтання — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Polykání nabízí jen část společnic, je vedené v profilu samostatně. Bez příplatku, programy 30–120 minut od 2 000 Kč, centrum Prahy.',
      en: 'Swallowing is offered by some companions only and listed separately on the profile. No surcharge, programs 30–120 minutes from 2,000 CZK.',
      de: 'Schlucken bieten nur einige Begleiterinnen an, im Profil gesondert geführt. Ohne Aufpreis, 30–120 Minuten ab 2.000 CZK.',
      uk: 'Ковтання пропонують лише деякі супутниці, у профілі вказано окремо. Без доплати, програми 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Nabízí to méně dívek, než čekáte</h2><p>Polykání je v profilu samostatná položka, oddělená od výstřiku do pusy. Nabízí ho menší část společnic než ostatní orální služby — proto se vyplatí profil projít dopředu.</p><p>Proto se vyplatí projít si profil dopředu — máte tam přesně rozepsané, co která dívka dělá, a nemusíte nic zjišťovat na místě. Co v profilu není, nenabízíme.</p><h2>Cena a kde se potkáme</h2><p>Za službu se nepřipočítává nic navíc; platíte jen délku programu, od 2 000 Kč za 30 minut. Setkání probíhají výhradně v našich apartmánech v centru Prahy, platba hotově na místě.</p>`,
      en: `<h2>Fewer girls offer it than you would expect</h2><p>Swallowing is its own item, separate from cum in mouth. Fewer companions offer it than the other oral services — which is why it pays to read the profile beforehand.</p><p>That's why it pays to read the profile beforehand — it spells out exactly what each girl does, so nothing has to be worked out on the spot. What isn't on the profile, we don't offer.</p><h2>Price and where we meet</h2><p>Nothing is added for it; you pay the program length only, from 2,000 CZK for 30 minutes. Meetings take place in our central Prague apartments, cash on arrival.</p>`,
      de: `<h2>Weniger Frauen bieten es an, als Sie denken</h2><p>Schlucken ist ein eigener Punkt, getrennt vom Abspritzen in den Mund. Es bieten weniger Begleiterinnen an als die übrigen Oralleistungen — deshalb lohnt sich ein Blick ins Profil vorab.</p><p>Deshalb lohnt sich ein Blick ins Profil vorab — dort steht genau, was welche Frau macht, und vor Ort muss nichts geklärt werden. Was nicht im Profil steht, bieten wir nicht an.</p><h2>Preis und Treffpunkt</h2><p>Es kommt nichts hinzu; Sie zahlen nur die Programmlänge, ab 2.000 CZK für 30 Minuten. Treffen ausschließlich in unseren Apartments im Zentrum von Prag, Barzahlung.</p>`,
      uk: `<h2>Це пропонує менше дівчат, ніж ви думаєте</h2><p>Ковтання — окремий пункт, відділений від фіналу в рот. Пропонує його менше супутниць, ніж інші оральні послуги, — тому варто переглянути профіль заздалегідь.</p><p>Тому варто переглянути профіль заздалегідь — там точно розписано, що робить кожна дівчина, і на місці нічого зʼясовувати не треба. Чого немає в профілі, ми не пропонуємо.</p><h2>Ціна і де зустрічаємось</h2><p>За послугу нічого не додається; ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин. Зустрічі виключно в наших апартаментах у центрі Праги, оплата готівкою.</p>`,
    },
  },
  anal_girl: {
    seo_title: {
      cs: 'Anální sex Praha — dámský anál | LovelyGirls',
      en: 'Anal Sex Prague — anal with the girl | LovelyGirls',
      de: 'Analsex Prag — Anal bei der Frau | LovelyGirls',
      uk: 'Анальний секс Прага — анал з дівчиною | LovelyGirls',
    },
    seo_description: {
      cs: 'Dámský anál nabízí jen část společnic, vždy s ochranou. V profilu je uvedený samostatně. Programy od 30 minut za 2 000 Kč, apartmány Praha 2, 3 a 5.',
      en: 'Anal with the girl is offered by some companions only, always with protection. Listed separately on the profile. Programs from 30 minutes at 2,000 CZK.',
      de: 'Anal bei der Frau bieten nur einige Begleiterinnen an, immer mit Schutz. Im Profil gesondert aufgeführt. Ab 30 Minuten für 2.000 CZK.',
      uk: 'Анал із дівчиною пропонують лише деякі супутниці, завжди із захистом. У профілі вказано окремо. Від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Pomalu, s ohledem a bez spěchu</h2><p>Tohle není služba, kterou si odbudete za třicet minut. Dámský anál nabízí jen menšina našich společnic a všechny se shodnou na jednom: potřebuje čas, klid a někoho, kdo nespěchá. Vždy s ochranou, bez výjimky.</p><p>Vždy s ochranou, bez výjimky. Doporučujeme si na to vzít víc času než 30 minut — na spěch to není a delší program dává prostor jít pomalu. Nejčastěji se bere 60 minut za 2 500 Kč.</p><h2>Cena a kde se potkáme</h2><p>Co je v profilu, to platí; co tam není, se na místě nedomlouvá. Setkání probíhají v apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>Slowly, carefully, without rush</h2><p>This is not something you get through in thirty minutes. Only a minority of our companions offer anal, and they all agree on one thing: it needs time, calm, and someone who is not in a hurry. Always with protection, no exceptions.</p><p>Always with protection, no exceptions. We would suggest more than 30 minutes for it — this is not something to rush, and a longer program leaves room to take it slowly. Sixty minutes at 2,500 CZK is the usual choice.</p><h2>Price and where we meet</h2><p>What is on the profile applies; what is not there is not arranged on the spot. Meetings take place in the Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) apartments. Cash payment, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Langsam, achtsam, ohne Eile</h2><p>Das ist nichts, was man in dreißig Minuten hinter sich bringt. Nur eine Minderheit unserer Begleiterinnen bietet Anal an, und alle sind sich einig: Es braucht Zeit, Ruhe und jemanden, der es nicht eilig hat. Immer mit Schutz, ohne Ausnahme.</p><p>Immer mit Schutz, ohne Ausnahme. Wir empfehlen, mehr als 30 Minuten einzuplanen — das ist nichts für Eile, und ein längeres Programm lässt Raum, es langsam angehen zu lassen. Üblich sind 60 Minuten für 2.500 CZK.</p><h2>Preis und Treffpunkt</h2><p>Was im Profil steht, gilt; was nicht darin steht, wird vor Ort nicht vereinbart. Treffen in den Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Повільно, дбайливо, без поспіху</h2><p>Це не те, що встигаєш за тридцять хвилин. Анал пропонує лише меншість наших супутниць, і всі сходяться в одному: потрібен час, спокій і той, хто не квапиться. Завжди із захистом, без винятків.</p><p>Завжди із захистом, без винятків. Радимо закласти більше ніж 30 хвилин — це не для поспіху, а довша програма дає простір робити все повільно. Найчастіше беруть 60 хвилин за 2 500 Kč.</p><h2>Ціна і де зустрічаємось</h2><p>Що є в профілі — те діє; чого немає, на місці не узгоджують. Зустрічі в апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  bdsm: {
    seo_title: {
      cs: 'BDSM Praha — ověřené společnice | LovelyGirls',
      en: 'BDSM Prague — verified companions | LovelyGirls',
      de: 'BDSM Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'BDSM Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'BDSM nabízí část společnic, v profilu je uvedené samostatně od lehkého SM a svazování. Programy 30–120 minut od 2 000 Kč, centrum Prahy.',
      en: 'BDSM is offered by some companions and listed separately from light SM and bondage. Programs 30–120 minutes from 2,000 CZK, central Prague.',
      de: 'BDSM bieten einige Begleiterinnen an, im Profil getrennt von Light SM und Bondage. 30–120 Minuten ab 2.000 CZK.',
      uk: 'BDSM пропонують деякі супутниці, у профілі окремо від легкого SM і звʼязування. Програми 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Napětí, které si řídíte vy</h2><p>Kůže, provaz, přesně odměřená chvíle ticha. BDSM stojí a padá na důvěře — na tom, že obě strany vědí, kam až se jde, a že to nikdo nepřekročí. Právě proto je to služba, kde se domlouvá dopředu a nechává se jí čas.</p><p>Právě proto se vyplatí napsat dopředu, co si představujete. Hranice si určuje každá dívka sama a je lepší si je vyjasnit při domluvě termínu než na místě. Nikdo nedělá nic, co nemá v profilu.</p><h2>Cena a kde se potkáme</h2><p>Na BDSM je 30 minut málo — reálně se domlouvá spíš 60 minut za 2 500 Kč nebo 120 minut za 4 500 Kč. Apartmány Nové Město, Žižkov, Anděl, platba hotově na místě.</p>`,
      en: `<h2>Tension you set yourself</h2><p>Leather, rope, a measured moment of silence. BDSM lives or dies on trust — on both sides knowing exactly how far it goes, and neither crossing it. That is why it is a service you arrange ahead and give room to breathe.</p><p>That is exactly why it is worth writing ahead about what you have in mind. Every girl sets her own limits, and it is better to clear them up when arranging the time than on the spot. Nobody does anything that is not on her profile.</p><h2>Price and where we meet</h2><p>Thirty minutes is not much for BDSM — in practice people book 60 minutes at 2,500 CZK or 120 minutes at 4,500 CZK. Apartments in Nové Město, Žižkov, Anděl, cash on arrival.</p>`,
      de: `<h2>Spannung, die Sie bestimmen</h2><p>Leder, Seil, ein genau bemessener Moment der Stille. BDSM steht und fällt mit Vertrauen — damit, dass beide Seiten wissen, wie weit es geht, und niemand darüber hinausgeht. Deshalb wird es vorher abgesprochen und bekommt Zeit.</p><p>Genau deshalb lohnt es sich, vorab zu schreiben, was Sie sich vorstellen. Jede Frau setzt ihre eigenen Grenzen, und die klärt man besser bei der Terminabsprache als vor Ort. Niemand macht etwas, das nicht im Profil steht.</p><h2>Preis und Treffpunkt</h2><p>Für BDSM sind 30 Minuten wenig — üblich sind eher 60 Minuten für 2.500 CZK oder 120 Minuten für 4.500 CZK. Apartments Nové Město, Žižkov, Anděl, Barzahlung.</p>`,
      uk: `<h2>Напруга, яку задаєте ви</h2><p>Шкіра, мотузка, точно відміряна мить тиші. BDSM тримається на довірі — на тому, що обидві сторони знають, наскільки далеко це йде, і ніхто цього не переступає. Саме тому це послуга, яку узгоджують заздалегідь і якій дають час.</p><p>Саме тому варто написати заздалегідь, що ви маєте на увазі. Кожна дівчина встановлює власні межі, і краще зʼясувати їх під час домовленості, ніж на місці. Ніхто не робить того, чого немає в профілі.</p><h2>Ціна і де зустрічаємось</h2><p>Для BDSM 30 хвилин — мало; на практиці замовляють 60 хвилин за 2 500 Kč або 120 хвилин за 4 500 Kč. Апартаменти Нове Місто, Жижков, Андел, оплата готівкою.</p>`,
    },
  },
  rimming_passive: {
    seo_title: {
      cs: 'Rimming pasivní Praha — ověřené společnice | LovelyGirls',
      en: 'Rimming Passive Prague — verified companions | LovelyGirls',
      de: 'Rimming passiv Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Римінг пасивний Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Rimming pasivní znamená, že službu přijímá společnice. Nabízí ji část dívek, uvedeno v profilu. Hygiena a sprcha samozřejmostí, od 2 000 Kč.',
      en: 'Passive rimming means the companion receives. Offered by some girls and listed on the profile. Hygiene and shower standard, from 2,000 CZK.',
      de: 'Rimming passiv bedeutet, die Begleiterin empfängt. Von einigen Frauen angeboten, im Profil angegeben. Hygiene und Dusche selbstverständlich, ab 2.000 CZK.',
      uk: 'Римінг пасивний означає, що супутниця приймає. Пропонують деякі дівчата, вказано в профілі. Гігієна і душ — стандарт, від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Důvěra začíná u čistoty</h2><p>Tahle služba stojí na jediné věci — na tom, že se oba cítíte v pohodě. Proto je sprcha před setkáním samozřejmostí, ne příplatek, a proto ji nabízí jen část dívek. Rimming pasivní znamená, že přijímá společnice.</p><p>Hygiena je u téhle služby zásadní pro obě strany. V každém apartmánu je vlastní koupelna a sprcha před setkáním je standardní součástí programu, ne příplatek.</p><h2>Cena a kde se potkáme</h2><p>Neúčtuje se zvlášť — platíte běžný program podle času, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Apartmány Nové Město, Žižkov a Anděl, platba hotově na místě.</p>`,
      en: `<h2>Trust starts with being clean</h2><p>This one rests on a single thing — both of you being comfortable. That is why a shower before the meeting is a given, not an extra, and why only some girls offer it. Passive rimming means the companion is the one receiving.</p><p>Hygiene matters a great deal here, for both sides. Every apartment has its own bathroom, and a shower before the meeting is a standard part of the program, not an extra.</p><h2>Price and where we meet</h2><p>It is not billed separately — you pay the normal time-based program, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Apartments in Nové Město, Žižkov and Anděl, cash on arrival.</p>`,
      de: `<h2>Vertrauen beginnt bei der Sauberkeit</h2><p>Hier kommt es auf eines an — dass sich beide wohlfühlen. Deshalb ist die Dusche vorher selbstverständlich und kein Aufpreis, und deshalb bieten es nur einige Frauen an. Rimming passiv heißt, die Begleiterin empfängt.</p><p>Hygiene ist hier für beide Seiten besonders wichtig. Jedes Apartment hat ein eigenes Bad, und eine Dusche vor dem Treffen gehört zum Programm, nicht zu den Aufpreisen.</p><h2>Preis und Treffpunkt</h2><p>Es wird nicht gesondert berechnet — Sie zahlen das normale zeitbasierte Programm, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Apartments Nové Město, Žižkov und Anděl, Barzahlung.</p>`,
      uk: `<h2>Довіра починається з чистоти</h2><p>Тут усе тримається на одному — щоб обом було комфортно. Тому душ перед зустріччю є само собою зрозумілим, а не доплатою, і тому пропонують це лише деякі дівчата. Римінг пасивний означає, що приймає супутниця.</p><p>Гігієна тут особливо важлива для обох сторін. У кожних апартаментах власна ванна кімната, а душ перед зустріччю входить у програму, а не в доплати.</p><h2>Ціна і де зустрічаємось</h2><p>Окремо не тарифікується — ви платите звичайну програму за часом, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Апартаменти Нове Місто, Жижков і Андел, оплата готівкою.</p>`,
    },
  },
  threesome_mfm: {
    seo_title: {
      cs: 'Trojka MŽM Praha — dvě společnice nebo pár | LovelyGirls',
      en: 'Threesome MFM Prague | LovelyGirls',
      de: 'Dreier MFM Prag | LovelyGirls',
      uk: 'Трійка MFM Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Trojka MŽM se domlouvá předem podle rozvrhu. Nabízí ji jen část společnic, uvedeno v profilu. Delší programy od 60 minut, ceny v ceníku.',
      en: 'MFM threesome is arranged in advance around the schedule. Offered by some companions only, listed on the profile. Longer programs from 60 minutes.',
      de: 'MFM-Dreier wird im Voraus nach dem Zeitplan abgestimmt. Nur einige Begleiterinnen, im Profil angegeben. Längere Programme ab 60 Minuten.',
      uk: 'Трійка MFM узгоджується заздалегідь за графіком. Пропонують лише деякі супутниці, вказано в профілі. Довші програми від 60 хвилин.',
    },
    content: {
      cs: `<h2>Ve třech, a všichni to vědí předem</h2><p>Trojka MŽM není nic, co se dá vymyslet na místě. Musí sedět čas, apartmán i lidé — a když sedne, je to setkání, na které se dlouho vzpomíná. Nabízí ji jen část společnic.</p><p>Tohle patří mezi věci, které je nutné domluvit dopředu. Napište nám, co si představujete, a ověříme dostupnost; nedá se to vyřešit až na místě.</p><h2>Cena a kde se potkáme</h2><p>Doporučujeme delší program — 60 minut za 2 500 Kč a víc. Aktuální sazby najdete v ceníku. Setkání probíhá v jednom z našich apartmánů v centru Prahy, platí se hotově.</p>`,
      en: `<h2>Three people, all of them prepared</h2><p>An MFM threesome is not something you improvise on arrival. The time, the apartment and the people all have to line up — and when they do, it is the kind of evening people remember. Only some companions offer it.</p><p>This is one of the things that has to be arranged ahead. Write to us with what you have in mind and we will check availability; it cannot be sorted out on arrival.</p><h2>Price and where we meet</h2><p>We would suggest a longer program — 60 minutes at 2,500 CZK and up. Current rates are on the pricing page. It takes place in one of our central Prague apartments, cash payment.</p>`,
      de: `<h2>Zu dritt, und alle wissen vorher Bescheid</h2><p>Ein MFM-Dreier lässt sich nicht spontan vor Ort einfädeln. Zeit, Apartment und Menschen müssen zusammenpassen — und wenn sie das tun, ist es ein Abend, an den man sich erinnert. Nur einige Begleiterinnen bieten ihn an.</p><p>Das gehört zu den Dingen, die vorher abgestimmt werden müssen. Schreiben Sie uns, was Sie sich vorstellen, wir prüfen die Verfügbarkeit; vor Ort lässt sich das nicht klären.</p><h2>Preis und Treffpunkt</h2><p>Wir empfehlen ein längeres Programm — 60 Minuten für 2.500 CZK und mehr. Aktuelle Tarife stehen in der Preisliste. Es findet in einem unserer Apartments im Zentrum von Prag statt, Barzahlung.</p>`,
      uk: `<h2>Утрьох, і всі знають заздалегідь</h2><p>Трійка MFM — не те, що вигадаєш на місці. Мають збігтися час, апартаменти й люди — а коли збігаються, це вечір, який запамʼятовується. Пропонують її лише деякі супутниці.</p><p>Це з тих речей, які треба узгодити заздалегідь. Напишіть нам, що маєте на увазі, і ми перевіримо доступність; на місці це не вирішується.</p><h2>Ціна і де зустрічаємось</h2><p>Радимо довшу програму — 60 хвилин за 2 500 Kč і більше. Актуальні тарифи є в ціннику. Відбувається в одних із наших апартаментів у центрі Праги, оплата готівкою.</p>`,
    },
  },
  facesitting: {
    seo_title: {
      cs: 'Facesitting Praha — ověřené společnice | LovelyGirls',
      en: 'Facesitting Prague — verified companions | LovelyGirls',
      de: 'Facesitting Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Фейсситинг Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Facesitting nabízí část společnic, v profilu je uvedený samostatně. Bez příplatku, programy 30–120 minut od 2 000 Kč, apartmány v centru Prahy.',
      en: 'Facesitting is offered by some companions and listed separately on the profile. No surcharge, programs 30–120 minutes from 2,000 CZK.',
      de: 'Facesitting bieten einige Begleiterinnen an, im Profil gesondert. Ohne Aufpreis, 30–120 Minuten ab 2.000 CZK.',
      uk: 'Фейсситинг пропонують деякі супутниці, у профілі окремо. Без доплати, програми 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Kdo má navrch, je jasné</h2><p>Facesitting je o odevzdání a o tom, že na chvíli nerozhodujete vy. Nabízí ho část našich společnic a často se pojí s lehkou dominancí — ale v profilu je to vedené zvlášť, jedno neznamená druhé.</p><p>Jestli k tomu chcete konkrétní podobu nebo oblečení, zmiňte to při domluvě termínu. S předstihem se tomu dívka přizpůsobí, na místě už to nemusí jít.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje, platíte jen délku programu: 30 minut 2 000 Kč, 60 minut 2 500 Kč, 120 minut 4 500 Kč. Apartmány Nové Město, Žižkov, Anděl. Platba hotově.</p>`,
      en: `<h2>No question who is in charge</h2><p>Facesitting is about letting go and, for a while, not being the one deciding. Some of our companions offer it, often alongside light domination — but it is listed separately, one does not imply the other.</p><p>If you have a particular form or outfit in mind, mention it when arranging the time. With some notice she can prepare for it; on the spot that may no longer be possible.</p><h2>Price and where we meet</h2><p>There is no surcharge; you pay the program length only: 30 minutes 2,000 CZK, 60 minutes 2,500 CZK, 120 minutes 4,500 CZK. Apartments in Nové Město, Žižkov, Anděl. Cash payment.</p>`,
      de: `<h2>Wer oben ist, steht außer Frage</h2><p>Facesitting bedeutet loslassen und für eine Weile nicht derjenige zu sein, der entscheidet. Einige unserer Begleiterinnen bieten es an, oft zusammen mit leichter Dominanz — im Profil steht es aber gesondert, das eine bedeutet nicht das andere.</p><p>Wenn Sie eine bestimmte Form oder Kleidung im Sinn haben, erwähnen Sie das bei der Terminabsprache. Mit Vorlauf kann sie sich darauf einstellen, vor Ort geht das oft nicht mehr.</p><h2>Preis und Treffpunkt</h2><p>Kein Aufpreis; Sie zahlen nur die Programmlänge: 30 Minuten 2.000 CZK, 60 Minuten 2.500 CZK, 120 Minuten 4.500 CZK. Apartments Nové Město, Žižkov, Anděl. Barzahlung.</p>`,
      uk: `<h2>Хто зверху — питань немає</h2><p>Фейсситинг про те, щоб відпустити і на якийсь час не бути тим, хто вирішує. Пропонують його деякі наші супутниці, часто поруч із легким домінуванням — але в профілі це вказано окремо, одне не означає інше.</p><p>Якщо маєте на думці конкретну форму чи одяг, згадайте про це під час домовленості. Маючи запас часу, дівчина підлаштується; на місці це вже може не вийти.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає; ви платите лише за тривалість програми: 30 хвилин 2 000 Kč, 60 хвилин 2 500 Kč, 120 хвилин 4 500 Kč. Апартаменти Нове Місто, Жижков, Андел. Оплата готівкою.</p>`,
    },
  },
  piss_active: {
    seo_title: {
      cs: 'Piss active Praha — ověřené společnice | LovelyGirls',
      en: 'Piss Active Prague — verified companions | LovelyGirls',
      de: 'Piss aktiv Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Пісинг активний Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Piss active nabízí jen malá část společnic, v profilu je uvedený samostatně. Bez příplatku, programy od 30 minut za 2 000 Kč.',
      en: 'Piss active is offered by only a few companions and is listed separately on the profile. No surcharge, programs from 30 minutes at 2,000 CZK.',
      de: 'Piss aktiv bieten nur wenige Begleiterinnen an, im Profil gesondert. Ohne Aufpreis, ab 30 Minuten für 2.000 CZK.',
      uk: 'Пісинг активний пропонують лише кілька супутниць, у профілі окремо. Без доплати, від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Pro ty, kdo vědí, co chtějí</h2><p>Piss active nabízí jen několik našich společnic — je to specifická věc a nikoho do ní netlačíme. Když ji ale někdo hledá, ví to obvykle přesně a nechce dlouhé vysvětlování.</p><p>Vzhledem k tomu, jak málo společnic tuhle službu má, doporučujeme si termín domluvit s předstihem a ověřit dostupnost. Improvizovat na místě nemá smysl — co není v profilu, nenabízíme.</p><p>Probíhá v koupelně apartmánu, každý má vlastní. Čisté ručníky a sprcha jsou samozřejmostí.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>For those who know what they want</h2><p>Only a few of our companions offer piss active — it is a specific thing and nobody is pushed into it. But those looking for it usually know exactly what they mean and do not want a long explanation.</p><p>Given how few companions have this service, we would suggest arranging the time well ahead and checking availability. Improvising on the spot does not work — what is not on the profile, we do not offer.</p><p>It takes place in the apartment bathroom; each one has its own. Fresh towels and a shower are a given.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Für alle, die wissen, was sie wollen</h2><p>Piss aktiv bieten nur wenige unserer Begleiterinnen an — es ist eine spezielle Sache, und niemand wird dazu gedrängt. Wer danach sucht, weiß aber meist genau, was gemeint ist, und will keine langen Erklärungen.</p><p>Da nur wenige Begleiterinnen diese Leistung anbieten, empfehlen wir, den Termin früh abzustimmen und die Verfügbarkeit zu prüfen. Vor Ort zu improvisieren funktioniert nicht — was nicht im Profil steht, bieten wir nicht an.</p><p>Es findet im Bad des Apartments statt; jedes hat ein eigenes. Frische Handtücher und eine Dusche sind selbstverständlich.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Для тих, хто знає, чого хоче</h2><p>Пісинг активний пропонують лише кілька наших супутниць — це специфічна річ, і нікого до неї не підштовхують. Але хто його шукає, зазвичай знає точно і не хоче довгих пояснень.</p><p>З огляду на те, як мало супутниць мають цю послугу, радимо домовлятися заздалегідь і перевіряти доступність. Імпровізувати на місці не вийде — чого немає в профілі, ми не пропонуємо.</p><p>Відбувається у ванній кімнаті апартаментів, у кожних вона своя. Свіжі рушники й душ — само собою.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  anal_man: {
    seo_title: {
      cs: 'Pánský anál Praha — ověřené společnice | LovelyGirls',
      en: 'Anal for Men Prague — verified companions | LovelyGirls',
      de: 'Anal beim Mann Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Анал для чоловіка Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Pánský anál nabízí část společnic, v profilu je vedený odděleně od dámského análu. Bez příplatku, programy 30–120 minut od 2 000 Kč.',
      en: 'Anal for men is offered by some companions and listed separately from anal with the girl. No surcharge, programs 30–120 minutes from 2,000 CZK.',
      de: 'Anal beim Mann bieten einige Begleiterinnen an, getrennt von Anal bei der Frau. Ohne Aufpreis, 30–120 Minuten ab 2.000 CZK.',
      uk: 'Анал для чоловіка пропонують деякі супутниці, окремо від анала з дівчиною. Без доплати, 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Nová věc, na kterou je potřeba klid</h2><p>Pánský anál je pro spoustu lidí krok do neznáma — a přesně proto se nevyplatí spěchat. Nabízí ho část našich společnic a ty, které ho mají v profilu, s tím umí zacházet.</p><p>Často se objednává spolu s masáží prostaty, ale i ta je vedená zvlášť. Pokud chcete obojí, ověřte si, že má společnice v profilu obě.</p><p>Vždy s ochranou a s dostatkem času; na 30 minut to není.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>New ground, and it deserves calm</h2><p>For a lot of people anal for men is stepping into the unknown — which is exactly why rushing it does not work. Some of our companions offer it, and those who list it know how to handle it.</p><p>It is often booked together with prostate massage, but that too is listed separately. If you want both, check that the companion has both on her profile.</p><p>Always with protection and with enough time; 30 minutes is not the right fit.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Neuland, das Ruhe verdient</h2><p>Für viele ist Anal beim Mann ein Schritt ins Unbekannte — genau deshalb bringt Eile nichts. Einige unserer Begleiterinnen bieten es an, und wer es im Profil führt, kann damit umgehen.</p><p>Oft wird es zusammen mit Prostatamassage gebucht, aber auch die wird gesondert geführt. Wenn Sie beides möchten, prüfen Sie, ob die Begleiterin beides im Profil hat.</p><p>Immer mit Schutz und mit ausreichend Zeit; 30 Minuten passen dafür nicht.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Нове, для чого потрібен спокій</h2><p>Для багатьох анал для чоловіка — крок у невідоме, і саме тому поспіх тут не працює. Пропонують його деякі наші супутниці, і ті, хто вказав це в профілі, вміють із цим поводитися.</p><p>Часто замовляють разом із масажем простати, але й він вказаний окремо. Якщо хочете обидва, перевірте, що супутниця має в профілі обидва.</p><p>Завжди із захистом і з достатнім запасом часу; 30 хвилин для цього не підходять.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  light_sm: {
    seo_title: {
      cs: 'Lehké SM Praha — ověřené společnice | LovelyGirls',
      en: 'Light SM Prague — verified companions | LovelyGirls',
      de: 'Light SM Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Легке SM Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Lehké SM nabízí část společnic, v profilu je vedené odděleně od BDSM a svazování. Bez příplatku, programy od 30 minut za 2 000 Kč.',
      en: 'Light SM is offered by some companions and listed separately from BDSM and bondage. No surcharge, programs from 30 minutes at 2,000 CZK.',
      de: 'Light SM bieten einige Begleiterinnen an, getrennt von BDSM und Bondage. Ohne Aufpreis, ab 30 Minuten für 2.000 CZK.',
      uk: 'Легке SM пропонують деякі супутниці, окремо від BDSM і звʼязування. Без доплати, від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Ochutnávka, ne hluboká voda</h2><p>Lehké SM je vstupní brána — dominance, jemné plácnutí, pár pomůcek. Nic, co by vás vyděsilo, a přesně tolik, kolik si řeknete. Nabízí ho víc společnic než plné BDSM.</p><p>Typicky jde o dominanci, lehké plácání nebo drobné pomůcky — ne o tvrdé praktiky. Pokud chcete jít dál, hledejte v profilu přímo BDSM.</p><p>Napište při domluvě termínu, co si představujete; hranice si každá dívka určuje sama.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>A taste, not the deep end</h2><p>Light SM is the way in — domination, a light spank, a couple of props. Nothing that will frighten you, and exactly as much as you ask for. More companions offer it than full BDSM.</p><p>It typically means domination, light spanking or small props — not hard practices. If you want to go further, look for BDSM itself on the profile.</p><p>Mention what you have in mind when arranging the time; every girl sets her own limits.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Ein Vorgeschmack, kein Sprung ins kalte Wasser</h2><p>Light SM ist der Einstieg — Dominanz, ein leichter Klaps, ein paar Hilfsmittel. Nichts, was Sie erschreckt, und genau so viel, wie Sie sagen. Mehr Begleiterinnen bieten es an als volles BDSM.</p><p>Typisch sind Dominanz, leichtes Spanking oder kleine Hilfsmittel — keine harten Praktiken. Wer weiter gehen möchte, sucht im Profil direkt nach BDSM.</p><p>Schreiben Sie bei der Terminabsprache, was Sie sich vorstellen; jede Frau setzt ihre eigenen Grenzen.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Скуштувати, а не пірнати</h2><p>Легке SM — це вхідні двері: домінування, легкий шльопанець, кілька аксесуарів. Нічого, що вас злякає, і рівно стільки, скільки скажете. Пропонує його більше супутниць, ніж повний BDSM.</p><p>Зазвичай ідеться про домінування, легкі шльопанці чи невеликі аксесуари — не про жорсткі практики. Хто хоче далі, шукає в профілі саме BDSM.</p><p>Напишіть під час домовленості, що маєте на увазі; межі кожна дівчина встановлює сама.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  piss_passive: {
    seo_title: {
      cs: 'Piss passive Praha — ověřené společnice | LovelyGirls',
      en: 'Piss Passive Prague — verified companions | LovelyGirls',
      de: 'Piss passiv Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Пісинг пасивний Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Piss passive nabízí jen malá část společnic, v profilu je uvedený samostatně. Bez příplatku, programy od 30 minut za 2 000 Kč.',
      en: 'Piss passive is offered by only a few companions and is listed separately. No surcharge, programs from 30 minutes at 2,000 CZK.',
      de: 'Piss passiv bieten nur wenige Begleiterinnen an, im Profil gesondert. Ohne Aufpreis, ab 30 Minuten für 2.000 CZK.',
      uk: 'Пісинг пасивний пропонують лише кілька супутниць, у профілі окремо. Без доплати, від 30 хвилин за 2 000 Kč.',
    },
    content: {
      cs: `<h2>Specifické, a to je v pořádku</h2><p>Piss passive znamená pasivní roli společnice. Nabízí ho jen několik dívek, takže se vyplatí ptát dopředu — dostupnost je omezená a na místě už se to nevyřeší.</p><p>Dostupnost je omezená, takže se vyplatí ptát dopředu a domluvit termín s předstihem, ne až na místě.</p><p>Probíhá v koupelně apartmánu; každý z našich tří má vlastní, s ručníky a sprchou.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>Specific, and that is fine</h2><p>Piss passive means the companion takes the passive role. Only a few girls offer it, so it is worth asking ahead — availability is limited and it cannot be sorted out on arrival.</p><p>Availability is limited, so it is worth asking ahead and arranging the time in advance rather than on arrival.</p><p>It takes place in the apartment bathroom; each of our three has its own, with towels and a shower.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Speziell, und das ist in Ordnung</h2><p>Piss passiv bedeutet die passive Rolle der Begleiterin. Nur wenige Frauen bieten es an, daher lohnt es sich, vorher zu fragen — die Verfügbarkeit ist begrenzt und vor Ort lässt sich das nicht klären.</p><p>Die Verfügbarkeit ist begrenzt, daher lohnt es sich, vorab zu fragen und den Termin früh abzustimmen statt erst vor Ort.</p><p>Es findet im Bad des Apartments statt; jedes unserer drei hat ein eigenes, mit Handtüchern und Dusche.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Специфічно — і це нормально</h2><p>Пісинг пасивний означає пасивну роль супутниці. Пропонують його лише кілька дівчат, тож варто питати заздалегідь — доступність обмежена, і на місці це не вирішиться.</p><p>Доступність обмежена, тож варто питати заздалегідь і домовлятися завчасно, а не вже на місці.</p><p>Відбувається у ванній кімнаті апартаментів; у кожних із трьох вона своя, з рушниками й душем.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  hard_sex: {
    seo_title: {
      cs: 'Tvrdý sex Praha — PSE zkušenost | LovelyGirls',
      en: 'Hard Sex Prague — PSE experience | LovelyGirls',
      de: 'Harter Sex Prag — PSE | LovelyGirls',
      uk: 'Жорсткий секс Прага — PSE | LovelyGirls',
    },
    seo_description: {
      cs: 'Tvrdý sex (PSE) nabízí část společnic, v profilu je uvedený samostatně. Bez příplatku, programy 30–120 minut od 2 000 Kč, centrum Prahy.',
      en: 'Hard sex (PSE) is offered by some companions and listed separately on the profile. No surcharge, programs 30–120 minutes from 2,000 CZK.',
      de: 'Harter Sex (PSE) wird von einigen Begleiterinnen angeboten, im Profil gesondert. Ohne Aufpreis, 30–120 Minuten ab 2.000 CZK.',
      uk: 'Жорсткий секс (PSE) пропонують деякі супутниці, у профілі окремо. Без доплати, 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Naplno, ale pořád podle pravidel</h2><p>Tvrdý sex, někdy zkracovaný na PSE, je intenzivnější poloha — víc energie, míň opatrnosti. Nabízí ho část společnic a i tady platí, že hranice určuje ona, ne vy.</p><p>I tady platí, že hranice si určuje dívka. Napište při domluvě, co si představujete — je lepší si to vyjasnit předem, než narazit na místě.</p><p>Doporučujeme delší program než 30 minut; 60 minut za 2 500 Kč je rozumnější volba.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>Full throttle, still within the rules</h2><p>Hard sex, sometimes shortened to PSE, is the more intense register — more energy, less caution. Some companions offer it, and here too the limits are hers to set, not yours.</p><p>Here too, the girl sets the limits. Write what you have in mind when arranging the time — better to clear it up beforehand than to run into it on the spot.</p><p>We would suggest more than 30 minutes; 60 minutes at 2,500 CZK is the more sensible choice.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Volle Kraft, aber weiter nach Regeln</h2><p>Harter Sex, manchmal als PSE abgekürzt, ist die intensivere Gangart — mehr Energie, weniger Vorsicht. Einige Begleiterinnen bieten ihn an, und auch hier setzt sie die Grenzen, nicht Sie.</p><p>Auch hier setzt die Frau die Grenzen. Schreiben Sie bei der Absprache, was Sie sich vorstellen — besser vorher klären als vor Ort darauf stoßen.</p><p>Wir empfehlen mehr als 30 Minuten; 60 Minuten für 2.500 CZK sind die vernünftigere Wahl.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>На повну, але все одно за правилами</h2><p>Жорсткий секс, іноді скорочено PSE, — інтенсивніший регістр: більше енергії, менше обережності. Пропонують його деякі супутниці, і тут теж межі встановлює вона, а не ви.</p><p>Тут теж межі встановлює дівчина. Напишіть під час домовленості, що маєте на увазі — краще зʼясувати заздалегідь, ніж наштовхнутися на місці.</p><p>Радимо більше ніж 30 хвилин; 60 хвилин за 2 500 Kč — розумніший вибір.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  filming_no_face: {
    seo_title: {
      cs: 'Natáčení bez obličeje — escort Praha | LovelyGirls',
      en: 'Filming without Face — Prague escort | LovelyGirls',
      de: 'Filmen ohne Gesicht — Escort Prag | LovelyGirls',
      uk: 'Зйомка без обличчя — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Natáčení bez obličeje nabízí část společnic, v profilu je uvedené samostatně. Vždy jen s jejím výslovným souhlasem. Programy od 2 000 Kč.',
      en: 'Filming without face is offered by some companions and listed separately. Always only with her explicit consent. Programs from 2,000 CZK.',
      de: 'Filmen ohne Gesicht bieten einige Begleiterinnen an, im Profil gesondert. Nur mit ihrer ausdrücklichen Zustimmung. Ab 2.000 CZK.',
      uk: 'Зйомка без обличчя доступна в деяких супутниць, у профілі окремо. Лише з її прямої згоди. Від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Vzpomínka, která nikoho neohrozí</h2><p>Natáčení bez obličeje je kompromis, který dává smysl oběma — vy si odnesete záznam, ona zůstane anonymní. Nabízí ho část společnic a vždy až po výslovném souhlasu na místě.</p><p>Natáčet lze jen tehdy, když to má společnice v profilu, a vždy až po výslovné domluvě na místě. Bez jejího souhlasu se nenatáčí nic, ani telefonem.</p><p>Domluvte se předem, ať víte, u koho je to možné.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>A memento that puts nobody at risk</h2><p>Filming without face is the compromise that works for both — you take away the footage, she stays anonymous. Some companions offer it, and always only after explicit consent on the spot.</p><p>Filming is possible only when the companion has it on her profile, and always after explicit agreement on the spot. Nothing is filmed without her consent, phone included.</p><p>Arrange it beforehand so you know who it is possible with.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Eine Erinnerung, die niemanden gefährdet</h2><p>Filmen ohne Gesicht ist der Kompromiss, der für beide funktioniert — Sie nehmen die Aufnahme mit, sie bleibt anonym. Einige Begleiterinnen bieten es an, und immer erst nach ausdrücklicher Zustimmung vor Ort.</p><p>Gefilmt werden darf nur, wenn die Begleiterin es im Profil hat, und stets nach ausdrücklicher Absprache vor Ort. Ohne ihre Zustimmung wird nichts gefilmt, auch nicht mit dem Handy.</p><p>Klären Sie es vorher, damit Sie wissen, bei wem es möglich ist.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Спогад, який нікого не наражає</h2><p>Зйомка без обличчя — компроміс, що влаштовує обох: ви забираєте запис, вона лишається анонімною. Пропонують її деякі супутниці, і завжди лише після прямої згоди на місці.</p><p>Знімати можна лише тоді, коли супутниця має це в профілі, і завжди після прямої домовленості на місці. Без її згоди не знімається нічого, зокрема й телефоном.</p><p>Домовтеся заздалегідь, щоб знати, у кого це можливо.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  role_play: {
    seo_title: {
      cs: 'Role-play Praha — ověřené společnice | LovelyGirls',
      en: 'Role-play Prague — verified companions | LovelyGirls',
      de: 'Rollenspiel Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Рольові ігри Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Role-play nabízí část společnic, uvedeno v profilu. Kostým a scénář domluvte předem. Programy 30–120 minut od 2 000 Kč.',
      en: 'Role-play is offered by some companions and listed on the profile. Arrange the outfit and scenario in advance. Programs 30–120 minutes from 2,000 CZK.',
      de: 'Rollenspiel bieten einige Begleiterinnen an, im Profil angegeben. Kostüm und Szenario vorab absprechen. 30–120 Minuten ab 2.000 CZK.',
      uk: 'Рольові ігри пропонують деякі супутниці, вказано в профілі. Костюм і сценарій узгодьте заздалегідь. 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Napište scénář, ona ho zahraje</h2><p>Role-play je jediná služba, kde se opravdu vyplatí rozepsat se dopředu. Kostým se nedá vykouzlit na místě — ale když dívka ví, co ji čeká, přijde připravená. To je celý rozdíl.</p><p>Napište při domluvě termínu, o jakou roli a oblečení jde. Když to ví předem, dokáže se přizpůsobit; hodinu před setkáním už zpravidla ne.</p><p>V profilu je uvedené, které společnice role-play nabízejí. Sekce Styl a šatník napoví, co která má.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>Write the scene, she will play it</h2><p>Role-play is the one service where writing ahead genuinely pays off. An outfit cannot be conjured on arrival — but when she knows what is coming, she turns up prepared. That is the whole difference.</p><p>Say what role and what clothing you have in mind when arranging the time. Given notice she can adapt; an hour before the meeting, usually not.</p><p>The profile states which companions offer role-play. The Style and wardrobe section hints at what each one has.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Schreiben Sie die Szene, sie spielt sie</h2><p>Rollenspiel ist die eine Leistung, bei der es sich wirklich lohnt, vorher ausführlich zu schreiben. Ein Kostüm lässt sich vor Ort nicht herzaubern — aber wenn sie weiß, was kommt, erscheint sie vorbereitet. Das ist der ganze Unterschied.</p><p>Sagen Sie bei der Terminabsprache, um welche Rolle und Kleidung es geht. Mit Vorlauf kann sie sich einstellen, eine Stunde vorher meist nicht mehr.</p><p>Im Profil steht, welche Begleiterinnen Rollenspiel anbieten. Der Bereich Stil und Garderobe zeigt, was die Einzelne hat.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Напишіть сценарій — вона його зіграє</h2><p>Рольові ігри — єдина послуга, де справді варто розписатися заздалегідь. Костюм не зʼявиться на місці, але коли дівчина знає, що на неї чекає, вона приходить готовою. У цьому вся різниця.</p><p>Скажіть під час домовленості, про яку роль і одяг ідеться. Маючи запас часу, вона підлаштується; за годину до зустрічі — зазвичай уже ні.</p><p>У профілі вказано, які супутниці пропонують рольові ігри. Розділ «Стиль і гардероб» підкаже, що є в кожної.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  lesbi_show: {
    seo_title: {
      cs: 'Lesbi show Praha — dvě společnice | LovelyGirls',
      en: 'Lesbian Show Prague — two companions | LovelyGirls',
      de: 'Lesbi-Show Prag — zwei Begleiterinnen | LovelyGirls',
      uk: 'Лесбі шоу Прага — дві супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Lesbi show se dvěma společnicemi, domlouvá se předem podle rozvrhu obou. Uvedeno v profilu. Delší programy od 60 minut.',
      en: 'Lesbian show with two companions, arranged in advance around both schedules. Listed on the profile. Longer programs from 60 minutes.',
      de: 'Lesbi-Show mit zwei Begleiterinnen, im Voraus nach beiden Zeitplänen abgestimmt. Im Profil angegeben. Ab 60 Minuten.',
      uk: 'Лесбі шоу з двома супутницями, узгоджується заздалегідь за графіками обох. Вказано в профілі. Довші програми від 60 хвилин.',
    },
    content: {
      cs: `<h2>Vy se jen díváte</h2><p>Lesbi show je vystoupení dvou společnic — a od trojky se liší tím, že tentokrát nemusíte dělat vůbec nic. Nabízí ji jen část dívek a obě musí mít směnu ve stejný čas.</p><p>Stejně jako u dua platí, že obě dívky musí mít směnu ve stejný čas a ve stejném apartmánu. Volných termínů je proto míň; mrkněte do rozvrhu nebo nám napište.</p><p>Na 30 minut to nemá smysl, počítejte spíš s 60 minutami a víc.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>You just watch</h2><p>A lesbian show is a performance by two companions — and it differs from a threesome in that this time you do not have to do a thing. Only some girls offer it, and both have to be on shift at the same time.</p><p>As with a duo, both girls have to be on shift at the same time in the same apartment. That leaves fewer available slots; check the schedule or message us.</p><p>Thirty minutes makes little sense for it — count on 60 minutes or more.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Sie schauen einfach zu</h2><p>Eine Lesbi-Show ist eine Darbietung von zwei Begleiterinnen — und der Unterschied zum Dreier ist, dass Sie diesmal gar nichts tun müssen. Nur einige Frauen bieten sie an, und beide müssen zur selben Zeit Schicht haben.</p><p>Wie beim Duo müssen beide Frauen zur selben Zeit im selben Apartment Schicht haben. Dadurch gibt es weniger freie Termine; sehen Sie im Zeitplan nach oder schreiben Sie uns.</p><p>Für 30 Minuten lohnt es sich kaum, rechnen Sie eher mit 60 Minuten und mehr.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Ви просто дивитесь</h2><p>Лесбі шоу — виступ двох супутниць, і від трійки відрізняється тим, що цього разу вам не треба робити нічого. Пропонують його лише деякі дівчата, і обидві мають бути на зміні водночас.</p><p>Як і з дуо, обидві дівчата мають бути на зміні в один час і в тих самих апартаментах. Через це вільних слотів менше; подивіться в графік або напишіть нам.</p><p>За 30 хвилин це не має сенсу — розраховуйте радше на 60 хвилин і більше.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  filming_face: {
    seo_title: {
      cs: 'Natáčení s obličejem — escort Praha | LovelyGirls',
      en: 'Filming with Face — Prague escort | LovelyGirls',
      de: 'Filmen mit Gesicht — Escort Prag | LovelyGirls',
      uk: 'Зйомка з обличчям — ескорт Прага | LovelyGirls',
    },
    seo_description: {
      cs: 'Natáčení s obličejem nabízí jen málo společnic. Vždy jen s výslovným souhlasem, uvedeno v profilu. Programy od 2 000 Kč.',
      en: 'Filming with face is offered by very few companions. Always only with explicit consent, listed on the profile. Programs from 2,000 CZK.',
      de: 'Filmen mit Gesicht bieten sehr wenige Begleiterinnen an. Nur mit ausdrücklicher Zustimmung, im Profil angegeben. Ab 2.000 CZK.',
      uk: 'Зйомка з обличчям доступна в дуже небагатьох супутниць. Лише з прямої згоди, вказано в профілі. Від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Málokdo — a má to svůj důvod</h2><p>Natáčení s obličejem je vzácnější z obou variant, protože pro dívku znamená mnohem víc. Kdo ho nabízí, dělá to vědomě. I tak platí, že souhlas musí padnout výslovně na místě.</p><p>Když to společnice v profilu má, i tak platí, že souhlas musí padnout výslovně na místě. Bez něj se nenatáčí nic.</p><p>Ověřte si dostupnost při domluvě termínu; těch, kdo tohle nabízejí, je opravdu málo.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>Very few — and for good reason</h2><p>Filming with face is the rarer of the two, because for a girl it means far more. Those who offer it do so deliberately. Even then, consent has to be given explicitly on the spot.</p><p>Even when a companion has it on her profile, consent still has to be given explicitly on the spot. Without it, nothing is filmed.</p><p>Check availability when arranging the time; very few offer this.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Nur wenige — und das aus gutem Grund</h2><p>Filmen mit Gesicht ist die seltenere der beiden Varianten, weil es für eine Frau weit mehr bedeutet. Wer es anbietet, tut das bewusst. Auch dann muss die Zustimmung vor Ort ausdrücklich erfolgen.</p><p>Auch wenn eine Begleiterin es im Profil hat, muss die Zustimmung vor Ort ausdrücklich erfolgen. Ohne sie wird nichts gefilmt.</p><p>Prüfen Sie die Verfügbarkeit bei der Terminabsprache; wirklich wenige bieten das an.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Таких мало — і це не випадково</h2><p>Зйомка з обличчям — рідкісніший із двох варіантів, бо для дівчини вона означає значно більше. Хто її пропонує, робить це свідомо. Але й тоді згода має прозвучати прямо на місці.</p><p>Навіть якщо супутниця має це в профілі, згода все одно має бути висловлена прямо на місці. Без неї не знімається нічого.</p><p>Перевірте доступність під час домовленості; таких справді мало.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  prostate_massage: {
    seo_title: {
      cs: 'Masáž prostaty Praha — ověřené společnice | LovelyGirls',
      en: 'Prostate Massage Prague — verified companions | LovelyGirls',
      de: 'Prostatamassage Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Масаж простати Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Masáž prostaty nabízí část společnic, v profilu je uvedená samostatně. Bez příplatku, programy 30–120 minut od 2 000 Kč.',
      en: 'Prostate massage is offered by some companions and listed separately on the profile. No surcharge, programs 30–120 minutes from 2,000 CZK.',
      de: 'Prostatamassage bieten einige Begleiterinnen an, im Profil gesondert. Ohne Aufpreis, 30–120 Minuten ab 2.000 CZK.',
      uk: 'Масаж простати пропонують деякі супутниці, у профілі окремо. Без доплати, 30–120 хвилин від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Trpělivost se tady vyplácí</h2><p>Masáž prostaty je o klidných rukou a o tom, že se nikam nespěchá. Nabízí ji část našich společnic a často se objednává spolu s pánským análem — ale je vedená zvlášť.</p><p>Je to služba, kde se nevyplatí spěchat — 30 minut je krátkých. Rozumnější je 60 minut za 2 500 Kč.</p><p>Hygiena je samozřejmostí: sprcha před setkáním patří ke každému programu, koupelna je v každém apartmánu.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>Patience is what makes it work</h2><p>Prostate massage is about steady hands and going nowhere fast. Some of our companions offer it, often booked together with anal for men — but it is listed as its own service.</p><p>This is not a service to rush — 30 minutes is short. Sixty minutes at 2,500 CZK is the more sensible option.</p><p>Hygiene is a given: a shower before the meeting is part of every program, and every apartment has a bathroom.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Hier zahlt sich Geduld aus</h2><p>Prostatamassage lebt von ruhigen Händen und davon, dass es nirgendwo hingeht. Einige unserer Begleiterinnen bieten sie an, oft zusammen mit Anal beim Mann gebucht — geführt wird sie aber gesondert.</p><p>Bei dieser Leistung lohnt sich Eile nicht — 30 Minuten sind knapp. Vernünftiger sind 60 Minuten für 2.500 CZK.</p><p>Hygiene ist selbstverständlich: Eine Dusche vor dem Treffen gehört zu jedem Programm, ein Bad hat jedes Apartment.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Тут виграє терплячість</h2><p>Масаж простати — про спокійні руки й про те, що нікуди не поспішають. Пропонують його деякі наші супутниці, часто замовляють разом із аналом для чоловіка — але вказаний він окремо.</p><p>Це послуга, де не варто поспішати — 30 хвилин мало. Розумніше 60 хвилин за 2 500 Kč.</p><p>Гігієна — само собою: душ перед зустріччю входить у кожну програму, ванна кімната є в кожних апартаментах.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
  bondage: {
    seo_title: {
      cs: 'Svazování Praha — ověřené společnice | LovelyGirls',
      en: 'Bondage Prague — verified companions | LovelyGirls',
      de: 'Bondage Prag — verifizierte Begleiterinnen | LovelyGirls',
      uk: 'Звʼязування Прага — перевірені супутниці | LovelyGirls',
    },
    seo_description: {
      cs: 'Svazování nabízí část společnic, v profilu je vedené odděleně od BDSM a lehkého SM. Bez příplatku, programy od 2 000 Kč.',
      en: 'Bondage is offered by some companions and listed separately from BDSM and light SM. No surcharge, programs from 2,000 CZK.',
      de: 'Bondage bieten einige Begleiterinnen an, getrennt von BDSM und Light SM. Ohne Aufpreis, ab 2.000 CZK.',
      uk: 'Звʼязування пропонують деякі супутниці, окремо від BDSM і легкого SM. Без доплати, від 2 000 Kč.',
    },
    content: {
      cs: `<h2>Provaz, a nic víc, než si řeknete</h2><p>Svazování je o odevzdání kontroly na přesně vymezenou dobu. V profilu je vedené zvlášť od BDSM i lehkého SM — dívka může nabízet jedno a druhé ne.</p><p>Kdo je svazovaný a jak daleko to jde, se domlouvá předem. Napište to při rezervaci termínu, ať je jasno na obou stranách.</p><p>Počítejte s delším programem; na svazování je 30 minut málo.</p><h2>Cena a kde se potkáme</h2><p>Příplatek se neúčtuje — platíte jen délku programu, od 2 000 Kč za 30 minut po 4 500 Kč za 120 minut. Setkání probíhají výhradně v našich apartmánech Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5). Platí se hotově na místě, mezi 23:00 a 7:00 platí noční sazba.</p>`,
      en: `<h2>Rope, and nothing beyond what you agree</h2><p>Bondage is about handing over control for a clearly defined stretch of time. It is listed separately from BDSM and light SM — a girl may offer one and not the other.</p><p>Who is tied and how far it goes gets agreed beforehand. Put it in the message when you book, so both sides are clear.</p><p>Count on a longer program; 30 minutes is not much for bondage.</p><h2>Price and where we meet</h2><p>There is no surcharge — you pay the program length only, from 2,000 CZK for 30 minutes to 4,500 CZK for 120. Meetings take place in our apartments in Nové Město (Prague 2), Žižkov (Prague 3) and Anděl (Prague 5) only. Cash on arrival, and a night rate applies between 11 PM and 7 AM.</p>`,
      de: `<h2>Seil, und nichts darüber hinaus</h2><p>Bondage bedeutet, die Kontrolle für eine klar umrissene Zeit abzugeben. Im Profil steht es getrennt von BDSM und Light SM — eine Frau kann das eine anbieten und das andere nicht.</p><p>Wer gefesselt wird und wie weit es geht, wird vorher abgesprochen. Schreiben Sie es bei der Buchung dazu, damit beide Seiten Klarheit haben.</p><p>Rechnen Sie mit einem längeren Programm; 30 Minuten sind für Bondage wenig.</p><h2>Preis und Treffpunkt</h2><p>Es fällt kein Aufpreis an — Sie zahlen nur die Programmlänge, von 2.000 CZK für 30 Minuten bis 4.500 CZK für 120. Treffen ausschließlich in unseren Apartments Nové Město (Prag 2), Žižkov (Prag 3) und Anděl (Prag 5). Barzahlung, zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif.</p>`,
      uk: `<h2>Мотузка — і нічого понад домовлене</h2><p>Звʼязування про те, щоб віддати контроль на чітко окреслений час. У профілі воно вказане окремо від BDSM і легкого SM — дівчина може пропонувати одне й не пропонувати інше.</p><p>Кого звʼязують і наскільки далеко це йде, узгоджують заздалегідь. Напишіть про це при бронюванні, щоб обом сторонам було зрозуміло.</p><p>Розраховуйте на довшу програму; для звʼязування 30 хвилин мало.</p><h2>Ціна і де зустрічаємось</h2><p>Доплати немає — ви платите лише за тривалість програми, від 2 000 Kč за 30 хвилин до 4 500 Kč за 120. Зустрічі виключно в наших апартаментах Нове Місто (Прага 2), Жижков (Прага 3) і Андел (Прага 5). Оплата готівкою, з 23:00 до 7:00 діє нічний тариф.</p>`,
    },
  },
};

const LOCALES = ['cs', 'en', 'de', 'uk'];
const SERVICE_FIELDS = ['seo_title', 'seo_description', 'content'];

const db = createClient(isRemote ? { url, authToken } : { url });

async function main() {
  // Refuse to touch a database that is not the site's.
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('girls','seo_metadata','services')"
  );
  const found = tables.rows.map((r) => String(r.name));
  for (const t of ['girls', 'seo_metadata', 'services']) {
    if (!found.includes(t)) {
      console.error(`Tohle není produkční DB webu — chybí tabulka "${t}". Nic jsem nezapsal.`);
      process.exit(1);
    }
  }
  console.log(`Připojeno: ${isRemote ? url : 'LOKÁLNÍ ' + url}`);
  console.log(WRITE ? 'Režim: ZÁPIS\n' : 'Režim: suchý běh\n');

  const slugs = Object.keys(SERVICES);
  const placeholders = slugs.map(() => '?').join(',');

  // ---- backup first, always, even on a dry run ----
  const svcRows = await db.execute({
    sql: `SELECT * FROM services WHERE slug IN (${placeholders})`,
    args: slugs,
  });
  const metaRows = await db.execute({
    sql: `SELECT * FROM seo_metadata WHERE page_path IN (${Object.keys(META).map(() => '?').join(',')})`,
    args: Object.keys(META),
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(ROOT, 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backup = join(backupDir, `service-content-${stamp}.json`);
  writeFileSync(
    backup,
    JSON.stringify({ takenAt: stamp, url, services: svcRows.rows, seo_metadata: metaRows.rows }, null, 2)
  );
  console.log(`Záloha: ${backup}`);
  console.log(`  (${svcRows.rows.length} služeb, ${metaRows.rows.length} SEO řádků)\n`);

  if (svcRows.rows.length !== slugs.length) {
    const have = new Set(svcRows.rows.map((r) => String(r.slug)));
    const missing = slugs.filter((s) => !have.has(s));
    console.error(`V DB chybí služby: ${missing.join(', ')}. Nic nezapisuji.`);
    process.exit(1);
  }

  // ---- seo_metadata ----
  const metaByPath = new Map(metaRows.rows.map((r) => [String(r.page_path), r]));
  for (const [path, m] of Object.entries(META)) {
    const before = metaByPath.get(path);
    console.log(`seo_metadata ${path}`);
    console.log(`  teď:  ${before ? String(before.meta_title ?? '—') : '(řádek neexistuje)'}`);
    console.log(`  nově: ${m.meta_title}`);
    if (!WRITE) continue;
    if (!before) {
      console.log('  přeskočeno — řádek neexistuje, zakládat ho tímhle scriptem nebudu');
      continue;
    }
    await db.execute({
      sql: 'UPDATE seo_metadata SET meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP WHERE page_path = ?',
      args: [m.meta_title, m.meta_description, path],
    });
    console.log('  zapsáno');
  }

  // ---- services ----
  console.log('');
  for (const [slug, data] of Object.entries(SERVICES)) {
    const cols = [];
    const args = [];
    for (const field of SERVICE_FIELDS) {
      for (const loc of LOCALES) {
        const value = data[field]?.[loc];
        if (typeof value !== 'string' || !value.trim()) {
          console.error(`  ${slug}: chybí ${field}_${loc}. Nic nezapisuji.`);
          process.exit(1);
        }
        cols.push(`${field}_${loc} = ?`);
        args.push(value.trim());
      }
    }
    console.log(`services ${slug}`);
    console.log(`  titulek cs: ${data.seo_title.cs}`);
    console.log(`  obsah:      ${LOCALES.map((l) => `${l} ${data.content[l].length} zn.`).join(' · ')}`);
    if (!WRITE) continue;
    args.push(slug);
    await db.execute({
      sql: `UPDATE services SET ${cols.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE slug = ?`,
      args,
    });
    console.log('  zapsáno');
  }

  console.log(
    WRITE
      ? '\nHotovo. Cache SEO drží hodinu (lib/seo-metadata.ts:47), obsah služeb naskočí hned.'
      : '\nSuchý běh — nic se nezapsalo. Spusť s --write.'
  );
}

main().catch((e) => {
  console.error('CHYBA:', e.message);
  process.exit(1);
});
