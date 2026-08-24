# SEO výchozí stav — srpen 2026

Zdroj: Google Search Console, export **22. 8. 2026**, období posledních 3 měsíců.
Syrová data: [`docs/gsc-export-2026-08/`](./gsc-export-2026-08/).

Tenhle dokument existuje kvůli jediné věci — aby se za pár měsíců dalo změřit,
jestli naplnění stránek služeb obsahem (commit `be548ab`, 24. 8. 2026) něco
udělalo. Bez čísel před zásahem je jakékoli „zdá se, že to pomohlo" k ničemu.

---

## Celkově

| | prokliky | zobrazení | CTR |
|---|---|---|---|
| **celkem** | 19 789 | 131 501 | 15,0 % |

Rozdělení podle typu dotazu je podstatnější než souhrn:

| | prokliky | zobrazení | CTR |
|---|---|---|---|
| **brand** („lovelygirls…", 49 dotazů) | 8 887 | 10 502 | **84,6 %** |
| **nebrand** (951 dotazů) | 2 997 | 28 685 | **10,4 %** |

Brand je vyhraný a nemá kam růst. Veškerý prostor je v nebrandu.

> Součet nesedí s celkem, protože GSC ořezává export dotazů na 1 000 řádků.
> Poměry platí, absolutní čísla u dotazů ne.

## Nejsilnější téma

Jeden cluster převyšuje všechno ostatní:

| dotaz | prokliky | zobrazení | pozice |
|---|---|---|---|
| prague escort | 624 | 7 094 | 10,1 |
| escort prague | 254 | 2 554 | 15,0 |
| prague escorts | 120 | 1 010 | 14,9 |

**10 658 zobrazení na jednom tématu, celé na konci první a na druhé straně.**
Titulek anglické homepage tou frází nezačínal — opraveno 24. 8.

## Jádro problému: staré URL drží provoz, nové jsou prázdné

| sekce | URL | zobrazení |
|---|---|---|
| `/sluzby/` (legacy) | 83 | 6 938 |
| `/praktiky/` (legacy) | 73 | 3 680 |
| `/profily/` (legacy) | 28 | 1 668 |
| `/landing/` (legacy) | 19 | 1 813 |
| — | | |
| `/sluzba/` (aktuální, CS) | 18 | **442** |
| `/service/` (aktuální, EN) | 25 | **193** |
| `/leistung/` + `/posluha/` | 8 | **12** |

Redirecty ze starých adres fungovaly správně už předtím. Google ale neměl důvod
přepnout na stránku, na které nebyla ani věta — všech 34 řádků v `services`
mělo prázdný `content_*`, `seo_title_*` i `seo_description_*` ve všech čtyřech
jazycích, takže `app/[locale]/sluzba/[slug]/page.tsx` sekci `.service-content`
vůbec nevykreslil. 136 URL v sitemap, na všech nic.

## Poptávka po jednotlivých službách

Staré `/praktiky/<slug>` používaly **stejné slugy jako dnešní databáze**, takže
se mapují 1:1 a jejich zobrazení jsou nejlepší dostupný odhad poptávky po
konkrétní službě:

| slug | zobrazení | | slug | zobrazení |
|---|---|---|---|---|
| foot_fetish | 450 | | light_sm | 103 |
| anal_girl | 315 | | rimming_active | 93 |
| bdsm | 306 | | piss_passive | 82 |
| piss_active | 283 | | cim | 81 |
| rimming_passive | 259 | | hard_sex | 80 |
| erotic_massage | 206 | | 69 | 72 |
| threesome_mfm | 176 | | blowjob_no_condom | 66 |
| deepthroat | 172 | | cof | 61 |
| threesome_fmf | 170 | | filming_no_face | 59 |
| facesitting | 169 | | role_play | 48 |
| blowjob_condom | 108 | | lesbi_show | 42 |
| anal_man | 104 | | zbytek | < 40 |

**Ponaučení:** odhad podle textu dotazů je zavádějící. První výběr „šesti služeb
s poptávkou" padl na `classic` (35 zobrazení) a `licking` (25), zatímco
`anal_girl` (315) a `bdsm` (306) v něm nebyly. Prioritu dělej z týhle tabulky.

## Zařízení a země

Mobil 15 327 prokliků (77 %, pozice 7,8), desktop 3 604 (pozice 10,6).

Česko 14 864 prokliků / 44 705 zobrazení / CTR 33,2 %. Zahraničí 4 925 / 86 796
/ CTR 5,7 %. Vypadá to jako obrovská ztráta, ale **je to zkreslené brandem** —
české dotazy jsou z velké části navigační („lovelygirls privat" má 194 prokliků
na pozici 1,0). Nebrandová CTR 10,4 % je realističtější měřítko.

---

## Co porovnat při příštím exportu

Stáhni stejný export (Web, poslední 3 měsíce) a podívej se na tři věci:

1. **Rostou `/sluzba/` a `/service/` na úkor `/sluzby/` a `/praktiky/`?**
   To je ten přesun 10 618 zobrazení, o který celý zásah šel. Je to pomalé —
   počítej v měsících, ne týdnech.
2. **Pozice u dotazů na konkrétní služby.** Výchozí body: „rimming praha"
   pozice 11,8 / CTR 1,8 %, „footfetish praha" pozice 15,1.
3. **CTR na homepage.** Nový titulek by měl zvednout proklikovost u clusteru
   „prague escort“; z 8,8 % je realistický posun o pár bodů, ne skok.

## Co zůstalo nedodělané

Z [`.claude-context/tasks/TASK-022-gsc-plan.md`](../.claude-context/tasks/TASK-022-gsc-plan.md)
zbývají dvě P1 položky, ani jedna není urgentní:

- prázdný stav hashtagových stránek, když na daný tag nesedí žádná dívka
- ověření, jestli aliasy u `/pobocka/` nedělají duplicity

Dál: `/sluzby/vip-escort` (131 prokliků, 1 148 zobrazení) a `/sluzby/outcall`
padají na obecný výpis. VIP nemá vlastní stránku a `girls.vip=1` má jednu dívku,
takže výpis by byl prázdný. **Outcall se nenabízí** (`lib/seo/landing-content.ts`),
takže stránka na něj by lhala — ta poptávka patří do FAQ, ne na landing page.
