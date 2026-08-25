# TASKS — recenze, layout, blog

Zadání od uživatele, doslovně. Stav: `[ ]` čeká · `[~]` rozpracované (necommitnuto) · `[x]` hotovo a ověřeno

---

## 1. [~] „co to je tohle???"
Profil: souhrn `0.0 ☆☆☆☆☆ · based on 0 reviews · 100% recommend`, ale hned pod tím reálná 5★ recenze od DAVID_69 a v histogramu 5★ = 1.
- Příčina: souhrn čte `girls.rating` / `girls.reviews_count`, které přepisuje jen noční cron `/api/cron/recalc-stats` (`vercel.json`, 0 1 * * *). Seznam recenzí se čte živě.
- Změněno: `lib/queries.ts` getReviewStatsForGirl (živý výpočet), `app/[locale]/profil/[slug]/page.tsx`, `lib/admin-actions.ts` přepočet hned při approve/reject.

## 2. [~] „vypada to uplne napíču cely vole ma to bejt cely a ne jen pod temi službami"
Sekce Reviews a vše pod ní zúžené do pravého sloupce pod službami. Má být přes celou šířku.
- Příčina: `app/globals.css` `.profile-right-extra { grid-column: 2 }` → změněno na `1 / -1`.

## 3. [~] „vypada to nezarovnané"
Souvisí s bodem 2. Ověřeno měřením: blok teď začíná na x=104 stejně jako fotka, šířka 1232 přes oba sloupce.

## 4. [~] „100% recomended z ceho?? KAMO DOPICI"
- Příčina: formulář recenze se ptá 👍/👎 (`input name="recommends"`), ale `INSERT INTO reviews` sloupec `recommends` neukládal. Procento se dopočítávalo z počtu 4★+5★ nad načtenými recenzemi.
- Změněno: odpověď se ukládá, procento se počítá z ní, pod 3 recenze se nezobrazuje.

## 5. [~] „Nahoře je 0 reviews když ma 1"
Hlavička profilu Nina: `✓ PHOTOS VERIFIED · ☆☆☆☆☆ · 0 REVIEWS`, přitom recenzi má. Stejná příčina jako bod 1, hlavička dostává živá čísla.

## 6. [ ] „v ty karte je taky počet hodnocení ne ?"
Karta dívky ve výpisu i na homepage — Nina bez hodnocení, Katy `★ 4.2 · 19`. Karty čtou stejné zastaralé sloupce. Ověřit, že přepočet při approve + revalidace pokryjí všechny cesty, kde se karta zobrazuje.

## 7. [ ] „katy to tam ma" / „katy ma dobre i hodnocení"
Vysvětlit a sjednotit rozdíl Katy vs Nina (u Katy už cron doběhl, u Niny ne). Zároveň: histogram u Katy sedí jen na 6 pruhů (3+1+1+1) proti „based on 19 reviews" — počítal se jen z načtených recenzí, opraveno na všechny schválené.

## 8. [ ] „translate překryva hvezdičky"
`/recenze`: ikona 🌐 Translate leží přes hvězdičky v kartě recenze. `.rev-translate-wrap` je `position:absolute; top:14px; right:14px`. První pokus (`padding-right` na `.rev-item-head`) překryv neodstranil — ověřeno měřením.

## 9. [ ] „KDYZ KLIKNU NA KATY OSTATNI RECENZE ... TAM BY MELA BEJT JENOM KATY NE NEBO MINIMALNE JEJI PROFIL NEJAK ABY TO SLO POZNAT TOHLE JE ODFLAKNUTE"
`/recenze?girl=katy` ukazuje globální hlavičku „Reviews / What our clients say" a globální statistiky 94 / 4.8 / 11. Má být jasně Katyina stránka: foto, jméno, její statistiky, breadcrumb, title, odkaz na profil.
Navíc: filtrace běží v JS nad posledními 200 recenzemi → přepsat na filtr v SQL.

## 10. [ ] „BLOG JE JENOM V CESTINE" + „Všechny clanky musí bejt přeložené s durazem na SEO KLICOVA SLOVA V DANEM JAZYKU"
**Blog CZ/EN.** Sloupce `title_cs/_en`, `excerpt_cs/_en`, `content_cs/_en`, `meta_description_cs/_en` existují, ale EN je prázdné → fallback na češtinu. Všechny články musí mít reálnou anglickou verzi lokalizovanou na anglická klíčová slova, ne doslovný překlad. Vyřešit i hreflang cs+en, sitemap a co s /de a /uk blogem.

## 11. [ ] „tohle je co proč je to křivé ???"
Sekce „Other girls online": jediná karta vlevo v gridu `repeat(4, 1fr)`, nadpis jinde. Při 1–3 kartách vycentrovat, při 4 nechat jak je. `.girls-grid` se používá i na /divky a homepage — nesmí se to tam rozbít.

## 12. [ ] „NADPIS JE VYCENTROVANY????????"
Nadpis „Other girls online" není vycentrovaný vůči stránce, jen vůči pravému sloupci (střed ≈1190 vs střed stránky 1000). Následek bodu 2, po roztažení na celou šířku musí sedět nadpis i karty.

---

## Workflow
Fáze 2 LOGIKA (`logika-policka`) → Fáze 3 REVIEW (`logicky-uvazujici`) → **schválení uživatelem** → Fáze 4 IMPLEMENTACE → Fáze 5 TESTY → Fáze 6 BROWSER TEST → Fáze 7 REPORT
