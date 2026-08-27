---
description: Spustí SEO tým — pět specializovaných auditů (technický, mezinárodní, on-page, interní odkazy, off-page), lead je spojí do jednoho reportu TOP 10 podle dopadu.
---

# ESCX TEAM SEO

Audit lovelygirls.cz pěti specializovanými rolemi místo jednoho univerzálního agenta. Důvod je praktický: jeden agent míchá technické chyby, obsah a dojmy z backlinků dohromady a výsledek se nedá opravovat.

Zadání: **$ARGUMENTS**

Když je zadání prázdné, proveď kompletní audit.

---

## Pravidla, která platí pro všechny role

Předej je každému agentovi v promptu:

> Auditluj lovelygirls.cz **pouze na základě skutečných dat. Nevymýšlej chyby.**
> U každého problému uveď: **URL**, **důkaz** (naměřený výstup, kus HTML, řádek kódu), **proč je to problém** (mechanismus, ne fráze), **konkrétní opravu**, **jestli může změna ovlivnit současné pozice**, a **závažnost** Critical / High / Medium / Low.
> **Neopakuj doporučení, které patří jinému typu auditu.**
> **Nedoporučuj změnu canonical, redirectu, noindexu, URL struktury ani hreflangu bez jasného důkazu** — právě tyhle změny nadělají největší škodu, když se jen tipnou.

---

## Průběh

Fáze 1 běží paralelně — role na sobě nezávisí:

```
seo-technical        crawl, canonical, hreflang, robots, sitemap, stavy,
                     redirecty, duplicity, rendering, structured data, CWV
seo-international    jazykové clustery EN/CS/DE/UK, kanibalizace, reciprocita
seo-onpage           intent, Title, H1/H2, entity, kanibalizace, konkurence
seo-internal-links   mapa autority, anchor texty, osiřelé stránky, hloubka
seo-offpage          referring domains, anchory, link intersect
        ↓
seo-lead             spojí, odstraní rozpory, seřadí podle dopadu
        ↓
TOP 10 — ne 200 „SEO errors"
```

Spusť všech pět **v jedné zprávě**, ať běží současně. Až doběhnou, předej jejich výstupy leadovi.

---

## Co má tým k dispozici

**Vlastní nástroj v repu** — nezačínejte od nuly:

```bash
node scripts/audit-seo.mjs                 # celý sitemap
node scripts/audit-seo.mjs --json out.json # všechny nálezy pro seskupení
node scripts/audit-seo.mjs --filter sluzba # jen část
```

Kontroluje stavy, canonical, hreflang, noindex v sitemap, titulky a popisky, JSON-LD, interní odkazy, obrázky bez alt. Běží i v CI každé pondělí (`.github/workflows/seo-audit.yml`).

**Reálná data ze Search Console** (3 měsíce, srpen 2026):

```
docs/gsc-export-2026-08/     syrový export — dotazy, stránky, země, zařízení
docs/SEO-baseline-2026-08.md výchozí čísla a co z nich plyne
```

Priority ber odsud, ne z odhadu.

**Produkční databáze** — jen ke čtení: `turso db shell lg "SELECT …"`. Je **sdílená s živým webem**, nikdy do ní nezapisuj.

---

## Co tým změřit nedokáže

Řekni to nahlas v reportu, ať to nikdo nepodá jako jistotu:

- **Co Google reálně udělal** — jestli stránku zaindexoval, který canonical si vybral. To řekne jen Search Console → Kontrola URL.
- **Backlinkový profil** — bez Ahrefs nebo Semrush ho nevidíš. Odhad nepiš.
- **Core Web Vitals z terénu** — jen laboratorní měření, ne data od uživatelů.

---

## Výstup

Jeden report od leada:

1. **TOP 10 podle dopadu** — u každého dopad, důkaz, oprava, riziko, zdroj
2. **Nedořešené otázky** — co nešlo rozhodnout a jaká data by to rozhodla
3. **Vědomě neděláme** — co bylo navrženo a proč zamítnuto

Nic z toho se **nezavádí bez souhlasu uživatele**. Report navrhuje, neopravuje.
