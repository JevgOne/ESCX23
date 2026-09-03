-- Blog September 2026 — Articles 1-4 (IDs 50-53)
-- Auto-publish via /api/cron/publish-blog (hourly, draft→published when published_at <= now())
-- Run: turso db shell <db> < data/blog-sept-2026.sql

-- ============================================================
-- TAGS
-- ============================================================

INSERT OR IGNORE INTO blog_tags (slug, name_cs, name_en) VALUES ('pruvodce', 'Průvodce', 'Guide');
INSERT OR IGNORE INTO blog_tags (slug, name_cs, name_en) VALUES ('bezpecnost', 'Bezpečnost', 'Safety');
INSERT OR IGNORE INTO blog_tags (slug, name_cs, name_en) VALUES ('praha', 'Praha', 'Prague');
INSERT OR IGNORE INTO blog_tags (slug, name_cs, name_en) VALUES ('tipy', 'Tipy', 'Tips');
INSERT OR IGNORE INTO blog_tags (slug, name_cs, name_en) VALUES ('recenze', 'Recenze', 'Reviews');
INSERT OR IGNORE INTO blog_tags (slug, name_cs, name_en) VALUES ('turistika', 'Pro turisty', 'For Tourists');
INSERT OR IGNORE INTO blog_tags (slug, name_cs, name_en) VALUES ('lokace', 'Lokace', 'Locations');

-- ============================================================
-- ARTICLE 1 — ID 50, 8. září 2026
-- co-je-escort-agentura
-- Tags: pruvodce, bezpecnost
-- ============================================================

INSERT OR REPLACE INTO blog_posts (id, slug, title_cs, title_en, excerpt_cs, excerpt_en, content_cs, content_en, meta_description_cs, meta_description_en, author, status, reading_time_min, published_at)
VALUES (
  50,
  'co-je-escort-agentura',
  'Co je escort agentura a jak se liší od privátních inzerátů',
  'What Is an Escort Agency and How It Differs From Private Ads',
  'Zjistěte hlavní rozdíly mezi ověřenou escort agenturou a soukromými inzeráty. Proč je agentura bezpečnější volbou a na co si dát pozor.',
  'Learn the key differences between a verified escort agency and private ads. Why an agency is a safer choice and what to watch out for.',

  '<h2 id="co-je-escort-agentura">Co přesně je escort agentura</h2>
<p>Escort agentura je profesionální zprostředkovatel, který spojuje klienty s <strong>ověřenými společnicemi</strong>. Na rozdíl od individuálních inzerátů na internetových portálech agentura zajišťuje kompletní servis — od verifikace společnic přes správu soukromých apartmánů až po transparentní ceník.</p>
<p>Agentura funguje jako garant kvality a bezpečnosti pro obě strany. Klient ví, co může očekávat, a společnice pracuje v bezpečném prostředí s profesionální podporou.</p>

<h2 id="jak-funguje-agentura">Jak agentura funguje v praxi</h2>
<p>Proces je jednoduchý a přímočarý:</p>
<ul>
<li><strong>Výběr společnice</strong> — prohlédněte si <a href="/cs/divky">profily společnic</a> s ověřenými fotografiemi, popisem služeb a recenzemi od klientů</li>
<li><strong>Rezervace</strong> — kontaktujte recepci přes WhatsApp nebo Telegram, dohodněte termín a délku setkání</li>
<li><strong>Setkání</strong> — obdržíte adresu soukromého apartmánu, kam se dostavíte v dohodnutý čas</li>
<li><strong>Platba</strong> — hotově při setkání, bez skrytých poplatků</li>
</ul>
<p>Celý proces je diskrétní a profesionální. Agentura neuchovává databáze klientů ani nepožaduje osobní dokumenty.</p>

<h2 id="rozdily-agentura-privat">Hlavní rozdíly: agentura vs. privátní inzeráty</h2>
<p>Pochopení rozdílů vám pomůže udělat informované rozhodnutí:</p>
<ul>
<li><strong>Ověřené fotografie</strong> — agentura garantuje, že fotografie odpovídají realitě. U privátních inzerátů je riziko falešných nebo starých snímků výrazně vyšší</li>
<li><strong>Bezpečné prostředí</strong> — agenturní apartmány jsou udržované, diskrétní a pravidelně kontrolované. Privátní setkání mohou probíhat na nepředvídatelných místech</li>
<li><strong>Transparentní ceny</strong> — <a href="/cs/cenik">ceník je veřejný</a> a fixní. U privátních inzerátů se ceny často mění nebo obsahují skryté příplatky</li>
<li><strong>Recenze a zpětná vazba</strong> — agentura umožňuje klientům psát <a href="/cs/recenze">recenze</a>, které pomáhají dalším návštěvníkům</li>
<li><strong>Profesionální podpora</strong> — v případě jakéhokoliv problému máte kontakt na recepci, která situaci řeší</li>
</ul>

<h2 id="red-flags">Na co si dát pozor u privátních inzerátů</h2>
<p>Privátní inzeráty nejsou automaticky špatné, ale existují varovné signály, které byste neměli ignorovat:</p>
<ul>
<li><strong>Požadavek na zálohu předem</strong> — seriózní společnice nikdy nepožadují platbu před setkáním</li>
<li><strong>Příliš nízké ceny</strong> — výrazně podhodnocené ceny často signalizují podvod nebo nesplnitelné sliby</li>
<li><strong>Profesionální studiové fotografie bez dalších snímků</strong> — mohou být kradené z jiných stránek</li>
<li><strong>Vyhýbání se konkrétním otázkám</strong> — nejasné odpovědi ohledně služeb, lokace nebo cen</li>
<li><strong>Tlak na rychlé rozhodnutí</strong> — manipulativní taktiky typu „poslední volný termín dnes"</li>
</ul>

<h2 id="proc-agentura-bezpecnejsi">Proč je agentura bezpečnější volba</h2>
<p>Bezpečnost je hlavní důvod, proč klienti volí agenturu. U LovelyGirls každá společnice prochází <strong>osobní verifikací</strong> — ověřujeme totožnost, věk a shodu s fotografiemi. Společnice pracují ve vybavených apartmánech v centru Prahy s profesionální recepcí.</p>
<p>Agentura také řeší případné nesrovnalosti. Pokud setkání neodpovídá dohodnutým podmínkám, klient má kontakt na recepci a situace se řeší okamžitě. Tento level zákaznického servisu u privátních inzerátů jednoduše neexistuje.</p>

<h2 id="faq">Často kladené otázky</h2>

<h3>Je návštěva escort agentury legální?</h3>
<p>Ano. V České republice je využívání služeb dospělých společnic legální pro osoby starší 18 let. Escort agentura funguje jako legální zprostředkovatel. Více informací najdete v našem <a href="/cs/faq">FAQ</a>.</p>

<h3>Kolik stojí setkání přes agenturu?</h3>
<p>Ceny závisí na délce setkání a konkrétní společnici. U LovelyGirls začínají programy od 2 500 Kč za 30 minut. Kompletní <a href="/cs/cenik">ceník najdete zde</a>. Všechny ceny jsou konečné, bez skrytých poplatků.</p>

<h3>Jak poznám kvalitní agenturu?</h3>
<p>Kvalitní agentura má transparentní web s ověřenými profily, veřejným ceníkem, recenzemi klientů a jasnou komunikací. Nikdy nepožaduje platbu předem a poskytuje konkrétní adresu apartmánu až po potvrzení rezervace.</p>

<h3>Mohu si společnici vybrat podle recenzí?</h3>
<p>Rozhodně. Recenze od předchozích klientů jsou jedním z nejlepších vodítek při výběru. U LovelyGirls jsou recenze moderovány, aby byly autentické a užitečné.</p>',

  '<h2 id="what-is-an-escort-agency">What Exactly Is an Escort Agency</h2>
<p>An escort agency is a professional intermediary that connects clients with <strong>verified companions</strong>. Unlike individual ads on internet portals, an agency provides comprehensive service — from companion verification and private apartment management to transparent pricing.</p>
<p>The agency acts as a guarantor of quality and safety for both parties. The client knows what to expect, and the companion works in a safe environment with professional support.</p>

<h2 id="how-an-agency-works">How an Agency Works in Practice</h2>
<p>The process is simple and straightforward:</p>
<ul>
<li><strong>Choose a companion</strong> — browse <a href="/girls">companion profiles</a> with verified photos, service descriptions, and client reviews</li>
<li><strong>Book</strong> — contact reception via WhatsApp or Telegram, agree on a time and duration</li>
<li><strong>Meet</strong> — receive the address of a private apartment and arrive at the agreed time</li>
<li><strong>Pay</strong> — cash at the meeting, no hidden fees</li>
</ul>
<p>The entire process is discreet and professional. The agency does not maintain client databases or require personal documents.</p>

<h2 id="agency-vs-private-ads">Key Differences: Agency vs. Private Ads</h2>
<p>Understanding the differences will help you make an informed decision:</p>
<ul>
<li><strong>Verified photos</strong> — an agency guarantees that photos match reality. With private ads, the risk of fake or outdated images is significantly higher</li>
<li><strong>Safe environment</strong> — agency apartments are maintained, discreet, and regularly checked. Private meetings may take place in unpredictable locations</li>
<li><strong>Transparent prices</strong> — the <a href="/pricing">price list is public</a> and fixed. Private ads often change prices or include hidden surcharges</li>
<li><strong>Reviews and feedback</strong> — agencies allow clients to write <a href="/reviews">reviews</a> that help other visitors</li>
<li><strong>Professional support</strong> — if any issue arises, you have direct contact with reception who will resolve it</li>
</ul>

<h2 id="red-flags">What to Watch Out for With Private Ads</h2>
<p>Private ads are not automatically bad, but there are warning signs you should not ignore:</p>
<ul>
<li><strong>Upfront payment required</strong> — a legitimate companion never requests payment before the meeting</li>
<li><strong>Unusually low prices</strong> — significantly underpriced services often signal a scam or unfulfillable promises</li>
<li><strong>Professional studio photos with no other images</strong> — they may be stolen from other websites</li>
<li><strong>Avoiding specific questions</strong> — vague answers about services, location, or prices</li>
<li><strong>Pressure to decide quickly</strong> — manipulative tactics like "last available slot today"</li>
</ul>

<h2 id="why-agency-is-safer">Why an Agency Is the Safer Choice</h2>
<p>Safety is the primary reason clients choose an agency. At LovelyGirls, every companion undergoes <strong>in-person verification</strong> — we verify identity, age, and photo accuracy. Companions work in well-equipped apartments in central Prague with professional reception staff.</p>
<p>An agency also resolves any discrepancies. If a meeting does not match the agreed terms, the client can contact reception and the situation is handled immediately. This level of customer service simply does not exist with private ads.</p>

<h2 id="faq">Frequently Asked Questions</h2>

<h3>Is visiting an escort agency legal?</h3>
<p>Yes. In the Czech Republic, using the services of adult companions is legal for persons over 18. An escort agency operates as a legal intermediary. More information is available in our <a href="/faq">FAQ</a>.</p>

<h3>How much does a meeting through an agency cost?</h3>
<p>Prices depend on the duration and the specific companion. At LovelyGirls, programs start from 2,500 CZK for 30 minutes. You can find the complete <a href="/pricing">price list here</a>. All prices are final with no hidden fees.</p>

<h3>How do I recognise a quality agency?</h3>
<p>A quality agency has a transparent website with verified profiles, a public price list, client reviews, and clear communication. It never requires upfront payment and provides the apartment address only after booking confirmation.</p>

<h3>Can I choose a companion based on reviews?</h3>
<p>Absolutely. Reviews from previous clients are one of the best guides when choosing. At LovelyGirls, reviews are moderated to ensure they are authentic and helpful.</p>',

  'Co je escort agentura a jak se liší od privátních inzerátů. Rozdíly v bezpečnosti, ověřování a cenách. Průvodce pro informované rozhodnutí.',
  'What is an escort agency and how it differs from private ads. Differences in safety, verification, and pricing. A guide to making an informed decision.',
  'Redakce', 'draft', 5, '2026-09-08 10:00:00'
);

-- Tag links for article 50
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (50, (SELECT id FROM blog_tags WHERE slug = 'pruvodce'));
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (50, (SELECT id FROM blog_tags WHERE slug = 'bezpecnost'));

-- ============================================================
-- ARTICLE 2 — ID 51, 15. září 2026
-- nejlepsi-ctvrti-praha-navsteva
-- Tags: praha, lokace
-- ============================================================

INSERT OR REPLACE INTO blog_posts (id, slug, title_cs, title_en, excerpt_cs, excerpt_en, content_cs, content_en, meta_description_cs, meta_description_en, author, status, reading_time_min, published_at)
VALUES (
  51,
  'nejlepsi-ctvrti-praha-navsteva',
  'Nejlepší čtvrti Prahy pro diskrétní návštěvu',
  'Best Prague Neighbourhoods for a Discreet Visit',
  'Průvodce pražskými čtvrtěmi, kde najdete soukromé apartmány LovelyGirls. Vinohrady, Žižkov a centrum — výhody každé lokace.',
  'A guide to Prague neighbourhoods where you will find LovelyGirls private apartments. Vinohrady, Žižkov, and the centre — advantages of each location.',

  '<h2 id="praha-idealni-mesto">Praha — ideální město pro diskrétní setkání</h2>
<p>Praha patří mezi nejkrásnější evropské metropole a nabízí ideální podmínky pro diskrétní setkání. Město kombinuje historický půvab s moderní infrastrukturou, skvělou dopravní dostupností a kosmopolitní atmosférou. Soukromé apartmány LovelyGirls se nacházejí v <strong>centrálních čtvrtích</strong>, kam se snadno dostanete z jakéhokoliv bodu ve městě.</p>

<h2 id="vinohrady-praha-2">Vinohrady — Praha 2</h2>
<p><a href="/cs/pobocka/praha-2">Vinohrady</a> jsou jednou z nejprestižnějších rezidenčních čtvrtí Prahy. Tato elegantní oblast nabízí klidné ulice lemované secesními budovami, výborné restaurace a kavárny, a přitom je jen pár minut od centra.</p>
<ul>
<li><strong>Dopravní dostupnost</strong> — metro linky A a C, tramvaje na hlavních třídách</li>
<li><strong>Diskrétnost</strong> — rezidenční charakter čtvrti zajišťuje naprostou anonymitu</li>
<li><strong>Okolí</strong> — Riegrovy sady, Havlíčkovy sady, Náměstí Míru</li>
<li><strong>Parkování</strong> — modré zóny s dostatkem míst ve vedlejších ulicích</li>
</ul>
<p>Vinohrady jsou ideální volbou pro klienty, kteří oceňují elegantní prostředí a klid. Apartmány v této čtvrti nabízejí vysoký standard bydlení v krásných historických budovách.</p>

<h2 id="zizkov-praha-3">Žižkov — Praha 3</h2>
<p><a href="/cs/pobocka/praha-3">Žižkov</a> je dynamická čtvrť s unikátním charakterem. Oblast prošla v posledních letech výraznou proměnou a dnes nabízí mix moderního a tradičního. Je oblíbená pro svou autentickou atmosféru a výbornou polohu.</p>
<ul>
<li><strong>Dopravní dostupnost</strong> — tramvaje, autobusy, blízkost Hlavního nádraží a Florenc</li>
<li><strong>Cenová dostupnost</strong> — parkování a okolní služby jsou cenově příznivější než v centru</li>
<li><strong>Živá atmosféra</strong> — množství barů, restaurací a kaváren v okolí</li>
<li><strong>Blízkost centra</strong> — 10-15 minut pěšky nebo 5 minut tramvají na Václavské náměstí</li>
</ul>
<p>Žižkov je skvělou volbou pro klienty, kteří hledají méně formální atmosféru s výbornou dostupností.</p>

<h2 id="centrum-prahy">Centrum Prahy</h2>
<p>Historické centrum nabízí nejkratší vzdálenosti pro turisty ubytované v hotelech na Starém Městě, v Josefově nebo na Malé Straně. Apartmány v centru jsou ideální pro spontánní návštěvy bez nutnosti dalšího cestování.</p>
<ul>
<li><strong>Maximální pohodlí</strong> — dojdete pěšky z většiny hotelů</li>
<li><strong>Kulturní zážitky</strong> — možnost kombinace s návštěvou restaurace nebo baru</li>
<li><strong>Turistická infrastruktura</strong> — směnárny, bankomaty, taxi</li>
</ul>

<h2 id="jak-se-dostat">Jak se dostat do apartmánu</h2>
<p>Po potvrzení rezervace obdržíte přesnou adresu apartmánu. Všechny lokace LovelyGirls jsou snadno dostupné:</p>
<ul>
<li><strong>MHD</strong> — metro a tramvaje jezdí do 22:00, poté noční spoje každých 30 minut</li>
<li><strong>Taxi/Uber</strong> — z letiště 30-40 minut, z centra 5-15 minut</li>
<li><strong>Autem</strong> — u všech apartmánů je možnost parkování v okolních ulicích</li>
<li><strong>Pěšky</strong> — z centrálních hotelů 10-20 minut chůze</li>
</ul>

<h2 id="ktera-ctvrt-pro-vas">Která čtvrť je pro vás</h2>
<p>Výběr čtvrti závisí na vašich preferencích:</p>
<ul>
<li><strong>Elegance a klid</strong> → Vinohrady (Praha 2)</li>
<li><strong>Autentická atmosféra</strong> → Žižkov (Praha 3)</li>
<li><strong>Maximální blízkost hotelu</strong> → Centrum</li>
</ul>
<p>Ať si vyberete jakoukoliv lokaci, všechny apartmány LovelyGirls splňují stejný <strong>vysoký standard</strong> — čistota, diskrétnost a vybavení pro pohodlné setkání. Aktuální dostupnost společnic v jednotlivých lokacích najdete v <a href="/cs/rozvrh">rozvrhu</a>.</p>

<h2 id="faq">Často kladené otázky</h2>

<h3>Mohu si vybrat, ve které čtvrti bude setkání?</h3>
<p>Ano. Při rezervaci můžete specifikovat preferovanou lokaci. Dostupnost společnic v jednotlivých apartmánech najdete v <a href="/cs/rozvrh">rozvrhu</a>, kde můžete filtrovat podle pobočky.</p>

<h3>Je parkování u apartmánů snadné?</h3>
<p>U všech našich lokací je možnost parkování v okolních ulicích. Vinohrady a Žižkov nabízí dostatek parkovacích míst v modrých zónách. Přesné informace o parkování obdržíte spolu s adresou apartmánu.</p>

<h3>Jsou apartmány označené?</h3>
<p>Ne. Všechny apartmány se nacházejí v běžných rezidenčních budovách bez jakéhokoliv označení. Zvenku je neodlišíte od ostatních bytů v domě, což zajišťuje maximální diskrétnost.</p>

<h3>Mohu přijít přímo z letiště?</h3>
<p>Ano. Z letiště Václava Havla se do centra Prahy dostanete za 30-40 minut taxíkem nebo Uberem. Doporučujeme rezervovat alespoň hodinu předem, abychom zajistili dostupnost vaší preferované společnice.</p>',

  '<h2 id="prague-ideal-city">Prague — the Ideal City for Discreet Encounters</h2>
<p>Prague is one of Europe''s most beautiful capitals and offers ideal conditions for discreet meetings. The city combines historic charm with modern infrastructure, excellent transport links, and a cosmopolitan atmosphere. LovelyGirls private apartments are located in <strong>central neighbourhoods</strong>, easily accessible from any point in the city.</p>

<h2 id="vinohrady-prague-2">Vinohrady — Prague 2</h2>
<p><a href="/location/praha-2">Vinohrady</a> is one of Prague''s most prestigious residential neighbourhoods. This elegant area offers quiet streets lined with Art Nouveau buildings, excellent restaurants and cafes, and is just minutes from the centre.</p>
<ul>
<li><strong>Transport</strong> — metro lines A and C, trams on main avenues</li>
<li><strong>Discretion</strong> — the residential character ensures complete anonymity</li>
<li><strong>Surroundings</strong> — Rieger Gardens, Havlicek Gardens, Peace Square</li>
<li><strong>Parking</strong> — blue zones with ample spaces in side streets</li>
</ul>
<p>Vinohrady is the ideal choice for clients who appreciate an elegant setting and tranquillity. Apartments here offer a high standard of living in beautiful historic buildings.</p>

<h2 id="zizkov-prague-3">Zizkov — Prague 3</h2>
<p><a href="/location/praha-3">Zizkov</a> is a dynamic neighbourhood with a unique character. The area has undergone significant transformation in recent years and now offers a mix of modern and traditional. It is popular for its authentic atmosphere and excellent location.</p>
<ul>
<li><strong>Transport</strong> — trams, buses, proximity to Main Station and Florenc</li>
<li><strong>Affordability</strong> — parking and surrounding services are more affordable than in the centre</li>
<li><strong>Lively atmosphere</strong> — numerous bars, restaurants, and cafes nearby</li>
<li><strong>Close to centre</strong> — 10-15 minutes on foot or 5 minutes by tram to Wenceslas Square</li>
</ul>
<p>Zizkov is an excellent choice for clients looking for a less formal atmosphere with great accessibility.</p>

<h2 id="city-centre">Prague City Centre</h2>
<p>The historic centre offers the shortest distances for tourists staying in hotels in Old Town, Josefov, or Mala Strana. Central apartments are ideal for spontaneous visits without additional travel.</p>
<ul>
<li><strong>Maximum convenience</strong> — walk from most hotels</li>
<li><strong>Cultural experiences</strong> — combine your visit with dinner or drinks</li>
<li><strong>Tourist infrastructure</strong> — exchange offices, ATMs, taxis</li>
</ul>

<h2 id="getting-there">How to Get to the Apartment</h2>
<p>After confirming your booking, you will receive the exact apartment address. All LovelyGirls locations are easily accessible:</p>
<ul>
<li><strong>Public transport</strong> — metro and trams run until 22:00, then night services every 30 minutes</li>
<li><strong>Taxi/Uber</strong> — 30-40 minutes from the airport, 5-15 minutes from the centre</li>
<li><strong>By car</strong> — street parking is available near all apartments</li>
<li><strong>On foot</strong> — 10-20 minutes walk from central hotels</li>
</ul>

<h2 id="which-neighbourhood">Which Neighbourhood Is Right for You</h2>
<p>The choice depends on your preferences:</p>
<ul>
<li><strong>Elegance and tranquillity</strong> → Vinohrady (Prague 2)</li>
<li><strong>Authentic atmosphere</strong> → Zizkov (Prague 3)</li>
<li><strong>Maximum proximity to your hotel</strong> → City Centre</li>
</ul>
<p>Whichever location you choose, all LovelyGirls apartments meet the same <strong>high standard</strong> — cleanliness, discretion, and amenities for a comfortable meeting. Check current companion availability at each location in the <a href="/schedule">schedule</a>.</p>

<h2 id="faq">Frequently Asked Questions</h2>

<h3>Can I choose which neighbourhood the meeting takes place in?</h3>
<p>Yes. When booking, you can specify your preferred location. Companion availability at each apartment is shown in the <a href="/schedule">schedule</a>, where you can filter by location.</p>

<h3>Is parking near the apartments easy?</h3>
<p>All our locations have street parking available nearby. Vinohrady and Zizkov offer ample parking spaces in blue zones. Detailed parking information is provided along with the apartment address.</p>

<h3>Are the apartments marked in any way?</h3>
<p>No. All apartments are in regular residential buildings with no signage. From the outside, they are indistinguishable from other flats in the building, ensuring maximum discretion.</p>

<h3>Can I come directly from the airport?</h3>
<p>Yes. From Vaclav Havel Airport, you can reach central Prague in 30-40 minutes by taxi or Uber. We recommend booking at least one hour in advance to ensure your preferred companion is available.</p>',

  'Nejlepší čtvrti Prahy pro diskrétní návštěvu. Vinohrady, Žižkov, centrum — výhody každé lokace, doprava a parkování.',
  'Best Prague neighbourhoods for a discreet visit. Vinohrady, Zizkov, city centre — advantages of each location, transport and parking.',
  'Redakce', 'draft', 6, '2026-09-15 10:00:00'
);

-- Tag links for article 51
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (51, (SELECT id FROM blog_tags WHERE slug = 'praha'));
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (51, (SELECT id FROM blog_tags WHERE slug = 'lokace'));

-- ============================================================
-- ARTICLE 3 — ID 52, 22. září 2026
-- recenze-proc-jsou-dulezite
-- Tags: tipy, recenze
-- ============================================================

INSERT OR REPLACE INTO blog_posts (id, slug, title_cs, title_en, excerpt_cs, excerpt_en, content_cs, content_en, meta_description_cs, meta_description_en, author, status, reading_time_min, published_at)
VALUES (
  52,
  'recenze-proc-jsou-dulezite',
  'Proč jsou recenze klíčové při výběru společnice',
  'Why Reviews Matter When Choosing a Companion',
  'Recenze jsou nejcennějším vodítkem při výběru společnice. Jak je číst, co z nich vyčtete a proč je důležité je psát.',
  'Reviews are the most valuable guide when choosing a companion. How to read them, what they reveal, and why writing them matters.',

  '<h2 id="proc-cist-recenze">Proč číst recenze před návštěvou</h2>
<p>Při výběru společnice máte k dispozici fotografie, popis služeb a základní informace. Ale teprve <strong>recenze od skutečných klientů</strong> vám řeknou, jaký je zážitek doopravdy. Recenze doplňují profil o autentické zkušenosti — od atmosféry setkání přes komunikaci až po celkový dojem.</p>
<p>U LovelyGirls jsou <a href="/cs/recenze">recenze veřejně dostupné</a> na profilu každé společnice. Jsou moderovány, aby byly věcné a užitečné, ale nikdy nejsou cenzurovány — publikujeme i konstruktivní kritiku.</p>

<h2 id="co-delat-recenzi-uzitecnou">Co dělá recenzi užitečnou</h2>
<p>Nejlepší recenze obsahují konkrétní informace, které pomohou dalším klientům:</p>
<ul>
<li><strong>Atmosféra setkání</strong> — byla společnice přívětivá, uvolněná, profesionální?</li>
<li><strong>Shoda s profilem</strong> — odpovídaly fotografie a popis služeb realitě?</li>
<li><strong>Komunikace</strong> — jak probíhala domluva a vzájemné porozumění?</li>
<li><strong>Prostředí</strong> — jak vypadal apartmán, čistota, vybavení?</li>
<li><strong>Celkový dojem</strong> — navštívili byste znovu?</li>
</ul>
<p>Užitečná recenze nemusí být dlouhá. Stačí 3-4 věty, které zachytí podstatu vašeho zážitku. Vyhněte se vulgárním popisům — takové recenze neprojdou moderací a nikomu nepomohou.</p>

<h2 id="jak-cist-recenze">Jak správně číst recenze</h2>
<p>Při čtení recenzí se zaměřte na celkový vzorec, ne na jednotlivé extrémní hodnocení:</p>
<ul>
<li><strong>Počet recenzí</strong> — více recenzí = spolehlivější obrázek. Společnice s 10+ recenzemi má ověřenou reputaci</li>
<li><strong>Konzistence</strong> — opakují se stejná pozitiva nebo negativa? To je spolehlivý ukazatel</li>
<li><strong>Aktuálnost</strong> — novější recenze jsou relevantnější. Společnice se vyvíjejí a zlepšují</li>
<li><strong>Kontext</strong> — recenze typu „bylo to krátké" může znamenat, že klient si objednal 30minutový program a očekával víc</li>
</ul>

<h2 id="moderace-recenzi">Jak funguje moderace recenzí</h2>
<p>U LovelyGirls každá recenze prochází kontrolou před zveřejněním. Moderace zajišťuje:</p>
<ul>
<li><strong>Autenticitu</strong> — recenzi může napsat pouze klient, který skutečně navštívil společnici</li>
<li><strong>Věcnost</strong> — odstraňujeme spam, vulgarity a osobní útoky</li>
<li><strong>Ochranu soukromí</strong> — recenze nesmí obsahovat osobní údaje společnice ani klienta</li>
<li><strong>Férovost</strong> — publikujeme i negativní recenze, pokud jsou konstruktivní a věcné</li>
</ul>

<h2 id="dopad-na-spolecnice">Jak recenze ovlivňují společnice</h2>
<p>Recenze nejsou jen pro klienty — mají přímý dopad na společnice a kvalitu služeb:</p>
<ul>
<li><strong>Motivace</strong> — pozitivní recenze společnice oceňují a motivují je k dalšímu zlepšování</li>
<li><strong>Zpětná vazba</strong> — konstruktivní připomínky pomohou identifikovat oblasti ke zlepšení</li>
<li><strong>Viditelnost</strong> — společnice s více pozitivními recenzemi jsou pro nové klienty atraktivnější</li>
<li><strong>Kvalitní standard</strong> — systém recenzí přirozeně udržuje vysokou úroveň služeb</li>
</ul>

<h2 id="jak-napsat-recenzi">Jak napsat recenzi krok za krokem</h2>
<p>Po setkání můžete napsat recenzi přímo na profilu společnice:</p>
<ul>
<li><strong>Krok 1</strong> — přejděte na profil společnice, kterou jste navštívili</li>
<li><strong>Krok 2</strong> — klikněte na sekci recenzí a vyberte hodnocení (1-5 hvězdiček)</li>
<li><strong>Krok 3</strong> — napište stručný, věcný komentář o svém zážitku</li>
<li><strong>Krok 4</strong> — odešlete. Recenze projde moderací a bude zveřejněna do 24 hodin</li>
</ul>

<h2 id="faq">Často kladené otázky</h2>

<h3>Jsou recenze anonymní?</h3>
<p>Ano, plně. Recenze se zobrazují bez jakýchkoliv identifikačních údajů klienta. Nikdo — ani společnice — nezjistí, kdo recenzi napsal.</p>

<h3>Mohu napsat negativní recenzi?</h3>
<p>Ano. Konstruktivní negativní recenze jsou cenné a pomáhají udržovat kvalitu. Důležité je zůstat věcný a vyhnout se osobním útokům. Pokud máte vážný problém, doporučujeme nejprve kontaktovat recepci.</p>

<h3>Jak poznám falešné recenze?</h3>
<p>LovelyGirls moderuje všechny recenze a ověřuje, že pochází od skutečných klientů. Podezřelé recenze (příliš obecné, opakující se vzory, nekonzistentní s profilem) jsou odstraněny. Můžete důvěřovat, že publikované recenze jsou autentické.</p>

<h3>Musím psát recenzi po každém setkání?</h3>
<p>Ne, je to dobrovolné. Ale vaše recenze pomáhá ostatním klientům a oceňují ji i společnice. Čím více recenzí napíšete, tím lepší bude celkový přehled pro komunitu.</p>',

  '<h2 id="why-read-reviews">Why Read Reviews Before Visiting</h2>
<p>When choosing a companion, you have photos, service descriptions, and basic information. But only <strong>reviews from real clients</strong> tell you what the experience is truly like. Reviews supplement the profile with authentic experiences — from the meeting atmosphere and communication to the overall impression.</p>
<p>At LovelyGirls, <a href="/reviews">reviews are publicly available</a> on each companion''s profile. They are moderated to be factual and helpful but are never censored — we publish constructive criticism as well.</p>

<h2 id="what-makes-review-useful">What Makes a Review Useful</h2>
<p>The best reviews contain specific information that helps other clients:</p>
<ul>
<li><strong>Meeting atmosphere</strong> — was the companion friendly, relaxed, professional?</li>
<li><strong>Profile accuracy</strong> — did the photos and service description match reality?</li>
<li><strong>Communication</strong> — how was the conversation and mutual understanding?</li>
<li><strong>Environment</strong> — how did the apartment look, cleanliness, amenities?</li>
<li><strong>Overall impression</strong> — would you visit again?</li>
</ul>
<p>A useful review does not need to be long. Three to four sentences capturing the essence of your experience is enough. Avoid vulgar descriptions — such reviews will not pass moderation and help no one.</p>

<h2 id="how-to-read-reviews">How to Read Reviews Properly</h2>
<p>When reading reviews, focus on the overall pattern rather than individual extreme ratings:</p>
<ul>
<li><strong>Number of reviews</strong> — more reviews = a more reliable picture. A companion with 10+ reviews has a proven reputation</li>
<li><strong>Consistency</strong> — do the same positives or negatives repeat? That is a reliable indicator</li>
<li><strong>Recency</strong> — newer reviews are more relevant. Companions evolve and improve</li>
<li><strong>Context</strong> — a review saying "it was short" might mean the client booked a 30-minute program and expected more</li>
</ul>

<h2 id="review-moderation">How Review Moderation Works</h2>
<p>At LovelyGirls, every review goes through checks before publication. Moderation ensures:</p>
<ul>
<li><strong>Authenticity</strong> — only a client who actually visited the companion can write a review</li>
<li><strong>Relevance</strong> — we remove spam, vulgarities, and personal attacks</li>
<li><strong>Privacy protection</strong> — reviews must not contain personal details of either the companion or the client</li>
<li><strong>Fairness</strong> — we publish negative reviews too, as long as they are constructive and factual</li>
</ul>

<h2 id="impact-on-companions">How Reviews Affect Companions</h2>
<p>Reviews are not just for clients — they have a direct impact on companions and service quality:</p>
<ul>
<li><strong>Motivation</strong> — positive reviews are appreciated by companions and motivate further improvement</li>
<li><strong>Feedback</strong> — constructive comments help identify areas for improvement</li>
<li><strong>Visibility</strong> — companions with more positive reviews are more attractive to new clients</li>
<li><strong>Quality standard</strong> — the review system naturally maintains a high level of service</li>
</ul>

<h2 id="how-to-write-review">How to Write a Review Step by Step</h2>
<p>After your meeting, you can write a review directly on the companion''s profile:</p>
<ul>
<li><strong>Step 1</strong> — go to the profile of the companion you visited</li>
<li><strong>Step 2</strong> — click on the reviews section and select a rating (1-5 stars)</li>
<li><strong>Step 3</strong> — write a brief, factual comment about your experience</li>
<li><strong>Step 4</strong> — submit. The review will go through moderation and be published within 24 hours</li>
</ul>

<h2 id="faq">Frequently Asked Questions</h2>

<h3>Are reviews anonymous?</h3>
<p>Yes, fully. Reviews are displayed without any identifying client information. No one — not even the companion — can find out who wrote the review.</p>

<h3>Can I write a negative review?</h3>
<p>Yes. Constructive negative reviews are valuable and help maintain quality. The key is to remain factual and avoid personal attacks. If you have a serious issue, we recommend contacting reception first.</p>

<h3>How do I spot fake reviews?</h3>
<p>LovelyGirls moderates all reviews and verifies they come from actual clients. Suspicious reviews (too generic, repeating patterns, inconsistent with the profile) are removed. You can trust that published reviews are authentic.</p>

<h3>Do I have to write a review after every meeting?</h3>
<p>No, it is voluntary. But your review helps other clients and is appreciated by companions too. The more reviews you write, the better the overall picture for the community.</p>',

  'Proč jsou recenze klíčové při výběru společnice. Jak je číst, co z nich vyčtete a jak napsat užitečnou recenzi.',
  'Why reviews matter when choosing a companion. How to read them, what they reveal, and how to write a useful review.',
  'Redakce', 'draft', 4, '2026-09-22 10:00:00'
);

-- Tag links for article 52
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (52, (SELECT id FROM blog_tags WHERE slug = 'tipy'));
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (52, (SELECT id FROM blog_tags WHERE slug = 'recenze'));

-- ============================================================
-- ARTICLE 4 — ID 53, 29. září 2026
-- escort-pro-cizince-praha
-- Tags: praha, turistika, pruvodce
-- ============================================================

INSERT OR REPLACE INTO blog_posts (id, slug, title_cs, title_en, excerpt_cs, excerpt_en, content_cs, content_en, meta_description_cs, meta_description_en, author, status, reading_time_min, published_at)
VALUES (
  53,
  'escort-pro-cizince-praha',
  'Escort v Praze pro turisty a cizince: Kompletní průvodce',
  'Escort in Prague for Tourists and Foreigners: Complete Guide',
  'Praktický průvodce pro zahraniční návštěvníky Prahy. Jazyk, měna, doprava, právní rámec a vše co potřebujete vědět.',
  'A practical guide for foreign visitors to Prague. Language, currency, transport, legal framework, and everything you need to know.',

  '<h2 id="praha-top-destinace">Praha jako top destinace pro zahraniční návštěvníky</h2>
<p>Praha každoročně přivítá miliony zahraničních turistů. Město je známé svou architekturou, gastronomií a nočním životem. Pro zahraniční návštěvníky, kteří hledají <strong>prémiové escort služby</strong>, je Praha jednou z nejpřívětivějších destinací v Evropě — díky transparentní legislativě, profesionálním agenturám a vícejazyčné komunikaci.</p>

<h2 id="jazyky-komunikace">Jazyky a komunikace</h2>
<p>U LovelyGirls komunikujeme v pěti jazycích:</p>
<ul>
<li><strong>Angličtina</strong> — hlavní komunikační jazyk pro zahraniční klienty</li>
<li><strong>Čeština</strong> — pro české klienty</li>
<li><strong>Němčina</strong> — pro německy mluvící klienty</li>
<li><strong>Ukrajinština</strong> — pro ukrajinsky mluvící klienty</li>
<li><strong>Ruština</strong> — pro rusky mluvící klienty</li>
</ul>
<p>Většina našich společnic mluví plynně anglicky a minimálně jedním dalším jazykem. Jazykové znalosti jsou uvedeny na profilu každé společnice. Pokud je jazyk pro vás důležitý, můžete <a href="/cs/divky">filtrovat společnice</a> podle tohoto kritéria.</p>

<h2 id="mena-platba">Měna a platba</h2>
<p>Česká republika používá <strong>českou korunu (CZK)</strong>, ne euro. Důležité informace o platbě:</p>
<ul>
<li><strong>Přijímáme CZK i EUR</strong> — platba v hotovosti při setkání</li>
<li><strong>Kurz</strong> — při platbě v EUR používáme aktuální směnný kurz</li>
<li><strong>Směnárny</strong> — vyhněte se směnárnám v turistických zónách (špatné kurzy). Doporučujeme bankomaty nebo směnárny s kurzem blízkým středu ČNB</li>
<li><strong>Bez karet</strong> — platba kartou ani kryptoměnami není možná. Pouze hotovost</li>
</ul>
<p>Aktuální <a href="/cs/cenik">ceník programů</a> je uveden v CZK. Pro orientaci: 1 000 CZK ≈ 40 EUR ≈ 43 USD (kurz se mění).</p>

<h2 id="doprava-z-letiste">Z letiště do apartmánu</h2>
<p>Letiště Václava Havla je jediné mezinárodní letiště v Praze. Do centra se dostanete několika způsoby:</p>
<ul>
<li><strong>Taxi/Uber/Bolt</strong> — 30-40 minut, přibližně 600-800 CZK. Nejpohodlnější možnost</li>
<li><strong>Airport Express</strong> — autobus na Hlavní nádraží, 100 CZK, 35 minut</li>
<li><strong>Městská doprava</strong> — autobus 119 + metro A, 40 CZK, 45 minut</li>
</ul>
<p>Pokud plánujete návštěvu přímo po příletu, doporučujeme <a href="/cs/kontakt">rezervovat alespoň 2 hodiny předem</a>, abyste měli čas na cestu a příchod.</p>

<h2 id="kulturni-rozdily">Kulturní rozdíly a etiketa</h2>
<p>Několik tipů pro zahraniční návštěvníky:</p>
<ul>
<li><strong>Dochvilnost</strong> — Češi oceňují přesnost. Přijďte v dohodnutý čas. Pokud se opozdíte, informujte recepci</li>
<li><strong>Hygiena</strong> — očekává se, že přijdete čistí a upravení. Sprcha je k dispozici v apartmánu</li>
<li><strong>Respekt</strong> — chovejte se ke společnici s úctou. Profesionální vztah je založen na vzájemném respektu</li>
<li><strong>Spropitné</strong> — není povinné, ale je oceněno. Obvyklé je 500-1 000 CZK u delších programů</li>
<li><strong>Alkohol</strong> — mírná konzumace je v pořádku, ale silná opilost je důvodem k odmítnutí setkání</li>
</ul>

<h2 id="pravni-situace">Právní situace v České republice</h2>
<p>Česká republika má k escort službám <strong>pragmatický přístup</strong>. Klíčové body:</p>
<ul>
<li><strong>Escort služby jsou legální</strong> — využívání služeb dospělých společnic není trestné</li>
<li><strong>Věková hranice</strong> — klient i společnice musí být starší 18 let</li>
<li><strong>Agentury mohou legálně fungovat</strong> — zprostředkování služeb dospělých je v ČR legální</li>
<li><strong>Žádné registrace</strong> — klient nepotřebuje žádné dokumenty ani registraci</li>
</ul>
<p>Více informací o právním rámci najdete v našem <a href="/cs/faq">FAQ</a>.</p>

<h2 id="prakticke-tipy">Praktické tipy pro turisty</h2>
<ul>
<li><strong>Čas</strong> — Praha je v časové zóně CET (GMT+1), v létě CEST (GMT+2)</li>
<li><strong>SIM karta</strong> — předplacené SIM karty jsou dostupné na letišti a v obchodech. Pro WhatsApp/Telegram stačí WiFi v hotelu</li>
<li><strong>Bezpečnost</strong> — Praha je jedno z nejbezpečnějších měst v Evropě. Buďte ale obezřetní v turistických zónách (kapesní krádeže)</li>
<li><strong>Hotely</strong> — pokud preferujete outcall, informujte se předem. LovelyGirls poskytuje primárně incall služby ve svých apartmánech</li>
</ul>

<h2 id="faq">Často kladené otázky</h2>

<h3>Musím mluvit česky?</h3>
<p>Ne. Naše recepce i většina společnic mluví plynně anglicky. Celý web je k dispozici v angličtině, němčině a ukrajinštině. Komunikace přes WhatsApp probíhá v jazyce, který vám vyhovuje.</p>

<h3>Přijímáte platbu v eurech?</h3>
<p>Ano, přijímáme CZK i EUR v hotovosti. Při platbě v EUR se použije aktuální směnný kurz. Doporučujeme mít drobné — ne vždy můžeme vrátit z velkých bankovek.</p>

<h3>Je to bezpečné pro turisty?</h3>
<p>Absolutně. LovelyGirls je ověřená agentura s mnohaletou reputací. Všechny společnice jsou verifikované, apartmány jsou v bezpečných rezidenčních čtvrtích a recepce je k dispozici po celou provozní dobu. Praha je navíc obecně velmi bezpečné město.</p>

<h3>Mohu přijít přímo z hotelu?</h3>
<p>Ano. Naše apartmány jsou v centru Prahy, snadno dostupné z jakéhokoliv hotelu taxi, Uberem nebo MHD. Přesnou adresu obdržíte po potvrzení rezervace.</p>

<h3>Jak daleko předem mám rezervovat?</h3>
<p>Doporučujeme alespoň 1-2 hodiny předem pro běžnou návštěvu. Pro specifické požadavky (konkrétní společnice, delší program, víkend) je lepší rezervovat den předem. Aktuální dostupnost najdete v <a href="/cs/rozvrh">rozvrhu</a>.</p>',

  '<h2 id="prague-top-destination">Prague as a Top Destination for Foreign Visitors</h2>
<p>Prague welcomes millions of foreign tourists every year. The city is renowned for its architecture, gastronomy, and nightlife. For international visitors seeking <strong>premium escort services</strong>, Prague is one of the most welcoming destinations in Europe — thanks to transparent legislation, professional agencies, and multilingual communication.</p>

<h2 id="languages-communication">Languages and Communication</h2>
<p>At LovelyGirls, we communicate in five languages:</p>
<ul>
<li><strong>English</strong> — the primary language for international clients</li>
<li><strong>Czech</strong> — for local clients</li>
<li><strong>German</strong> — for German-speaking clients</li>
<li><strong>Ukrainian</strong> — for Ukrainian-speaking clients</li>
<li><strong>Russian</strong> — for Russian-speaking clients</li>
</ul>
<p>Most of our companions are fluent in English and at least one other language. Language skills are listed on each companion''s profile. If language is important to you, you can <a href="/girls">filter companions</a> by this criterion.</p>

<h2 id="currency-payment">Currency and Payment</h2>
<p>The Czech Republic uses the <strong>Czech koruna (CZK)</strong>, not the euro. Important payment details:</p>
<ul>
<li><strong>We accept CZK and EUR</strong> — cash payment at the meeting</li>
<li><strong>Exchange rate</strong> — when paying in EUR, we use the current exchange rate</li>
<li><strong>Currency exchange</strong> — avoid exchange offices in tourist zones (poor rates). We recommend ATMs or exchanges with rates close to the CNB mid-rate</li>
<li><strong>No cards</strong> — card or cryptocurrency payments are not possible. Cash only</li>
</ul>
<p>The current <a href="/pricing">program pricing</a> is listed in CZK. For reference: 1,000 CZK ≈ 40 EUR ≈ 43 USD (rates fluctuate).</p>

<h2 id="airport-to-apartment">From the Airport to the Apartment</h2>
<p>Vaclav Havel Airport is Prague''s only international airport. You can reach the centre in several ways:</p>
<ul>
<li><strong>Taxi/Uber/Bolt</strong> — 30-40 minutes, approximately 600-800 CZK. The most comfortable option</li>
<li><strong>Airport Express</strong> — bus to Main Station, 100 CZK, 35 minutes</li>
<li><strong>Public transport</strong> — bus 119 + metro A, 40 CZK, 45 minutes</li>
</ul>
<p>If you plan to visit directly after landing, we recommend <a href="/contact">booking at least 2 hours ahead</a> to allow time for travel and arrival.</p>

<h2 id="cultural-differences">Cultural Differences and Etiquette</h2>
<p>A few tips for international visitors:</p>
<ul>
<li><strong>Punctuality</strong> — Czechs appreciate being on time. Arrive at the agreed time. If you are running late, inform reception</li>
<li><strong>Hygiene</strong> — you are expected to arrive clean and well-groomed. A shower is available at the apartment</li>
<li><strong>Respect</strong> — treat the companion with courtesy. The professional relationship is built on mutual respect</li>
<li><strong>Tipping</strong> — not mandatory but appreciated. Typical amounts are 500-1,000 CZK for longer programs</li>
<li><strong>Alcohol</strong> — moderate consumption is fine, but heavy intoxication is grounds for declining the meeting</li>
</ul>

<h2 id="legal-situation">Legal Situation in the Czech Republic</h2>
<p>The Czech Republic takes a <strong>pragmatic approach</strong> to escort services. Key points:</p>
<ul>
<li><strong>Escort services are legal</strong> — using the services of adult companions is not a criminal offence</li>
<li><strong>Age requirement</strong> — both client and companion must be over 18</li>
<li><strong>Agencies can operate legally</strong> — intermediation of adult services is legal in CZ</li>
<li><strong>No registration needed</strong> — clients do not need any documents or registration</li>
</ul>
<p>More information about the legal framework is available in our <a href="/faq">FAQ</a>.</p>

<h2 id="practical-tips">Practical Tips for Tourists</h2>
<ul>
<li><strong>Time zone</strong> — Prague is in the CET zone (GMT+1), CEST in summer (GMT+2)</li>
<li><strong>SIM card</strong> — prepaid SIM cards are available at the airport and in shops. Hotel WiFi is sufficient for WhatsApp/Telegram</li>
<li><strong>Safety</strong> — Prague is one of the safest cities in Europe. Be cautious in tourist areas (pickpockets)</li>
<li><strong>Hotels</strong> — if you prefer outcall, enquire in advance. LovelyGirls primarily provides incall services at our apartments</li>
</ul>

<h2 id="faq">Frequently Asked Questions</h2>

<h3>Do I need to speak Czech?</h3>
<p>No. Our reception and most companions are fluent in English. The entire website is available in English, German, and Ukrainian. WhatsApp communication is in whichever language suits you.</p>

<h3>Do you accept payment in euros?</h3>
<p>Yes, we accept CZK and EUR in cash. When paying in EUR, the current exchange rate applies. We recommend having smaller bills — we may not always be able to give change for large banknotes.</p>

<h3>Is it safe for tourists?</h3>
<p>Absolutely. LovelyGirls is a verified agency with years of reputation. All companions are verified, apartments are in safe residential neighbourhoods, and reception is available throughout operating hours. Prague is generally a very safe city.</p>

<h3>Can I come directly from my hotel?</h3>
<p>Yes. Our apartments are in central Prague, easily accessible from any hotel by taxi, Uber, or public transport. You will receive the exact address after confirming your booking.</p>

<h3>How far in advance should I book?</h3>
<p>We recommend at least 1-2 hours in advance for a standard visit. For specific requests (particular companion, longer program, weekend), booking a day ahead is better. Check current availability in the <a href="/schedule">schedule</a>.</p>',

  'Escort v Praze pro turisty a cizince. Praktický průvodce — jazyk, měna, doprava z letiště, právní rámec a tipy pro zahraniční návštěvníky.',
  'Escort in Prague for tourists and foreigners. Practical guide — language, currency, airport transport, legal framework, and tips for international visitors.',
  'Redakce', 'draft', 6, '2026-09-29 10:00:00'
);

-- Tag links for article 53
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (53, (SELECT id FROM blog_tags WHERE slug = 'praha'));
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (53, (SELECT id FROM blog_tags WHERE slug = 'turistika'));
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (53, (SELECT id FROM blog_tags WHERE slug = 'pruvodce'));
