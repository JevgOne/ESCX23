# Zbývající 404 z Google Search Console

Export: `~/Downloads/lovelygirls-3/Tabulka.csv` (349 URL, poslední crawl 21.–22. 8. 2026)
Otestováno proti produkci 26. 8. 2026: **264 už funguje, 85 pořád 404uje.**

Redirecty v `next.config.ts` (blok G) pokrývají `/sluzby/*`, `/praktiky/*`, `/profily/*`,
`/landing/*` pro všechny čtyři jazyky a fungují. Zbytek se dělí takto:

## 1. Odstraněné dívky (~45 URL) — řeší automatický redirect
Slugy: `anhel anna christina diana ema jessica karin lara lucka marie nikol niky rebeca sammy sophie`
Automatika (tabulka `removed_girl_slugs`) je implementovaná zvlášť. Tyhle slugy se do ní
musí naseedovat, protože byly smazané dřív, než mechanismus vznikl.

## 2. Vzorec `/girls/{slug}` a `/girls-cz/{slug}` — ŽIVÁ ZTRÁTA
`/girls/emily`, `/girls/nika`, `/girls-cz/lyra` — tyhle dívky na webu **jsou**, jen ten
vzorec nemá redirect. Doplnit:
- `/girls/:slug` → `/profile/:slug`
- `/girls-cz/:slug` → `/cs/profil/:slug`
Odstraněné dívky (`linda`, `lucka`, `samantha`, `bibi`, `jennifer`) pak spadnou do bodu 1.

## 3. Mrtvé hashtagy (~7 URL)
`atleticke-telo bujne-tvary latinky polykani tipy vystrik-na-telo`
V `next.config.ts` už seznam mrtvých hashtagů existuje — doplnit do něj tyhle.

## 4. České slugy služeb pod NOVOU cestou (~8 URL)
`/cs/sluzba/eroticka-masaz`, `mazleni`, `masaz-prostaty`, `nataceni-bez-obliceje`,
`pansky-anal`, `piss-active`, `rimming-passive`, `/de/leistung/rollenspiel`
Mapování `SERVICE_SLUG` v `next.config.ts` platí jen pro starou cestu `/sluzby/`.
Buď ho rozšířit i na `/sluzba/` `/service/` `/leistung/` `/posluha/`, nebo tyhle slugy
poslat na výpis služeb. Ověřit proti katalogu, které z nich mají dnešní protějšek.

## 5. Staré články — PŘÍLEŽITOST, ne jen redirect
Tyhle URL kdysi fungovaly a Google si je pamatuje. Témata na webu dnes chybí:
- `/blog-cs/ceny-escortu-v-praze-co-ovlivnuje-cenu` — vysoký komerční záměr
- `/blog-cs/outcall-do-hotelu-v-praze-prakticky-pruvodce`
- `/blog-cs/kalendar-dostupnosti-jak-ho-cist-a-rychle-domluvit`
- `/blog-cs/eroticka-povidka-vytah-za-soumraku`, `eroticke-povidky-balkon-nad-vltavou`,
  `eroticke-pribehy-hodina-navic-u-staromaku`
- `/blog/discreet-incall-prague-how-it-works`, `escort-outcall-prague-a-calm-hotel-guide`,
  `escort-prague-availability-how-to-read-todays-shifts`, `erotic-stories-elevator-at-dusk`
- `/interview-cs/*` (3×), `/interview/*` (1×) — rozhovory s dívkami, které už nejsou
- `/blog-cs/jak-si-vybrat-spolecnici-v-praze-elegantne-a-bez-stresu` → dnes existuje jako
  `jak-vybrat-spolecnici-praha`, tady stačí redirect
**Rozhodnutí uživatele:** obnovit jako články (CZ i EN, viz pravidlo o lokalizovaných
klíčových slovech), nebo jen přesměrovat na výpis blogu.

## 6. Drobnosti (~7 URL)
`/home` → `/`, staré OG cesty `/profily/luna/opengraph-image`, `/uk/soukromi/opengraph-image`,
tři staré `_next/static` assety (zmizí samy, ty neřešit).

---
Po nasazení znovu odeslat sitemap v GSC a nechat report doběhnout — 264 URL zmizí z reportu
samo, jde jen o staré crawly.
