# TASK: SEO — Opravit SEMrush Site Audit Issues

> Zdroj: SEMrush Site Audit na www.lovelygirls.cz
> Stav: 51 errors, 666 warnings, 667 notices

---

## 1. ERRORS (51)

SEMrush nespecifikoval konkrétní typ — pravděpodobně zahrnují broken links, missing resources, server errors. Potřeba:

### Akce
- [ ] **1a.** Spustit `next build` a zkontrolovat build warnings/errors
- [ ] **1b.** Crawlnout web pomocí `curl -sI` na všechny sitemap URL a najít 4xx/5xx
- [ ] **1c.** Zkontrolovat Vercel deployment logs na errory

---

## 2. WARNING: 254 pages with links to redirect (+220 nových)

### Root Cause
**`SiteFooter.tsx` (řádek 152, 166-169)** — používá raw `<a>` tagy místo next-intl `<Link>`:

```tsx
// Pobočky — řádek 152:
<a href={`${localePrefix}/pobocka/${loc.name}`}>

// Hashtag kategorie — řádky 166-169:
<a href={`${localePrefix}/hashtag/blondynky-praha`}>
<a href={`${localePrefix}/hashtag/brunetky-praha`}>
<a href={`${localePrefix}/hashtag/gfe-praha`}>
<a href={`${localePrefix}/hashtag/studentky-praha`}>
```

Pro EN locale: `localePrefix = ""`, takže link je `/pobocka/praha-2`.
Ale EN route je `/location/praha-2` (viz `i18n/routing.ts`).
Výsledek: KAŽDÁ stránka s EN footerem → 3 pobočkové + 4 hashtagové linky → redirect chain (301).

**`MobileBottomBar.tsx` (řádek 54)** — stejný problém:
```tsx
<a href={`${localePrefix(locale)}/pobocka/${loc.name}`}>
```

### Fix
Nahradit raw `<a>` tagy za next-intl `<Link>` komponenty:

**SiteFooter.tsx:**
```tsx
// Pobočky:
<Link href={{ pathname: '/pobocka/[slug]', params: { slug: loc.name } }}>

// Hashtag kategorie:
<Link href={{ pathname: '/hashtag/[slug]', params: { slug: 'blondynky-praha' } }}>
```

**MobileBottomBar.tsx:**
```tsx
import { Link } from '@/i18n/navigation';
// ...
<Link href={{ pathname: '/pobocka/[slug]', params: { slug: loc.name } }}>
```

### Dopad
- Eliminuje ~254 redirect chain warnings (7 linků × ~36 stránek v EN)
- Footer i MobileBottomBar se zobrazují na KAŽDÉ stránce → masivní dopad

### Priorita: KRITICKÁ — opravit PRVNÍ

---

## 3. WARNING: 164 slow pages (>3s load)

### Příčiny
- `force-dynamic` stránky s mnoha DB dotazy (profily, rozvrh, divky)
- Turso DB latence (Frankfurt region, round-trip pro každý query)
- No caching layer

### Fix
- [ ] **3a.** Audit `force-dynamic` stránek — které opravdu potřebují real-time data?
- [ ] **3b.** Přidat `unstable_cache` / `next/cache` na data která se mění max 1x/hodinu:
  - `getActiveLocations()` — mění se měsíčně
  - `getAllServices()` — mění se měsíčně
  - `getSiteFacts()` — mění se denně
- [ ] **3c.** Batch DB queries kde je to možné (jeden SQL s JOINy místo N+1)
- [ ] **3d.** Zvážit `revalidate: 3600` pro hashtag a service stránky (místo `force-dynamic`)

### Priorita: STŘEDNÍ

---

## 4. WARNING: 125 3XX redirect chains in crawl

### Příčina
Legitimní 301 redirecty v `next.config.ts` pro legacy URL (Secretstory, WordPress, /cz/).
SEMrush je reportuje protože je crawloval — ale tyto redirecty jsou SPRÁVNĚ.

### Fix
- [ ] **4a.** Zkontrolovat zda interní linky neodkazují na redirectované URL
- [ ] **4b.** Pokud najdeme interní linky na `/cz/*` nebo staré URL → opravit na finální URL
- [ ] **4c.** Ostatní nechat — external backlinks potřebují 301

### Priorita: NÍZKÁ (redirecty samy o sobě jsou OK)

---

## 5. WARNING: 84 pages with nofollow external links

### Příčina
Pravděpodobně `rel="noopener noreferrer"` na externích odkazech interpretováno SEMrushem.
Plus WhatsApp/Telegram/tel: linky na MobileBottomBar.

### Fix
- Není potřeba fix. `noopener noreferrer` je security best practice.
- SEMrush to reportuje jako warning, ale je to false positive pro naše use case.

### Priorita: IGNOROVAT

---

## 6. WARNING: 50 pages with short meta description (<120 chars)

### Root Cause
DB tabulka `seo_metadata` (488 záznamů) — mnoho stránek má krátké popisy.

### Dotčené stránky (z analýzy DB)
- `/podminky` — všechny 4 locale (ale noindex, takže irelevantní)
- `/soukromi` — všechny 4 locale (ale noindex, takže irelevantní)
- `/clenstvi/*` — noindex
- Blog posty — některé mají krátké descriptions
- Hashtag stránky — mohou mít generické krátké popisy
- Service stránky — mohou mít krátké popisy

### Fix
- [ ] **6a.** SQL query: najít všechny seo_metadata záznamy kde `length(description) < 120` AND stránka JE indexable
- [ ] **6b.** Pro každou indexable stránku s krátkým description: napsat 120-160 char popis
- [ ] **6c.** UPDATE seo_metadata SET description = '...' WHERE path = '...'
- [ ] **6d.** Noindex stránky (podminky, soukromi) ignorovat — SEMrush by je neměl počítat

### Priorita: STŘEDNÍ

---

## 7. WARNING: 7 slow AI crawler response

### Příčina
`robots.ts` nastavuje `crawlDelay: 2` pro GPTBot. To je záměrné — chrání server.

### Fix
- Žádný. Crawl delay je záměrný.
- Pokud crawlers timeout, zvážit optimalizaci page rendering speed (viz bod 3).

### Priorita: IGNOROVAT

---

## 8. NOTICE: 174 pages not submitted to IndexNow

### Příčina
IndexNow NENÍ implementováno. Žádný API endpoint, žádná integrace.

### Fix — implementovat IndexNow
- [ ] **8a.** Vytvořit `public/{key}.txt` soubor s IndexNow API klíčem
- [ ] **8b.** Vytvořit `app/api/indexnow/route.ts`:
  ```ts
  // POST /api/indexnow — trigger IndexNow ping
  // Body: { urls: string[] }
  // Auth: Bearer CRON_SECRET
  ```
- [ ] **8c.** Po každém content change (blog publish, girl activate/deactivate, schedule update) → trigger IndexNow
- [ ] **8d.** Vercel cron job: denní IndexNow batch ping pro změněné stránky
- [ ] **8e.** Alternativa: použít Bing/Yandex IndexNow endpoint (`https://api.indexnow.org/indexnow`)

### IndexNow API formát
```
POST https://api.indexnow.org/indexnow
Content-Type: application/json

{
  "host": "www.lovelygirls.cz",
  "key": "{api-key}",
  "keyLocation": "https://www.lovelygirls.cz/{api-key}.txt",
  "urlList": [
    "https://www.lovelygirls.cz/blog/novy-clanek",
    "https://www.lovelygirls.cz/profile/sara"
  ]
}
```

### Priorita: STŘEDNÍ-VYSOKÁ (pomůže s rychlejší indexací nového obsahu)

---

## 9. NOTICE: 20 indexable pages not in sitemap

### Příčina
`sitemap.ts` negeneruje tyto routes:
- `/clenstvi/zadost` — 4 locale = ale je to formulář, noindex by bylo lepší? Teď NEMÁ noindex a NENÍ v sitemapu
- `/join` — 4 locale = noindex v kódu ✓ (ale SEMrush může říkat něco jiného)
- `/stories/[id]` — dynamické, noindex ✓
- `/recenze/nova/[slug]` — formulář, noindex ✓

### Fix
- [ ] **9a.** Rozhodnout: má `/clenstvi/zadost` být indexable? ANO → přidat do sitemap. NE → přidat noindex.
  - Doporučení: přidat noindex — je to formulář pro členy, nemá SEO hodnotu
- [ ] **9b.** Ověřit zda SEMrush reportované stránky odpovídají těmto routes
- [ ] **9c.** Pro routes které MAJÍ být v sitemapu: přidat do `sitemap.ts` STATIC_KEYS nebo PATHS

### Priorita: NÍZKÁ

---

## 10. NOTICE: 28 meta descriptions changed

### Příčina
DB-based SEO metadata se updatuje — SEMrush detekuje změny mezi crawly.

### Fix
- Žádný. Toto je normální chování.

### Priorita: IGNOROVAT

---

## 11. NOTICE: 20 noindex pages became indexable

### Příčina
Stránky které dříve měly noindex teď nemají. Možné scénáře:
- Dívky které byly `inactive` (noindex) se staly `active` (index) — normální
- Code change odstranil noindex z nějaké stránky

### Aktuální noindex stránky (z kódu)
| Stránka | noindex | Správně? |
|---------|---------|----------|
| `/podminky` | ✅ hardcoded | ✅ |
| `/soukromi` | ✅ hardcoded | ✅ |
| `/join` | ✅ hardcoded | ✅ |
| `/join/success` | ✅ hardcoded | ✅ |
| `/clenstvi/zadost/odeslano` | ✅ hardcoded | ✅ |
| `/recenze/nova/[slug]` | ✅ hardcoded | ✅ |
| `/stories/[id]` | ✅ hardcoded | ✅ |
| `/admin/*` | ✅ X-Robots-Tag header | ✅ |
| `/studio/*` | ✅ X-Robots-Tag header | ✅ |
| Inactive girls `/profil/[slug]` | ✅ conditional | ✅ |

### Fix
- [ ] **11a.** Potvrdit že 20 stránek které "became indexable" jsou reálně aktivované profily dívek
- [ ] **11b.** Pokud ano → OK, žádný fix
- [ ] **11c.** Přidat noindex na `/clenstvi/zadost` (chybí tam!)

### Priorita: NÍZKÁ

---

## 12. NOTICE: 1 page SERP title changed by Google

### Fix: Žádný. Google si přepisuje tituly — nelze ovlivnit přímo.

---

## Implementační pořadí (task breakdown)

### Fáze 1 — KRITICKÉ (okamžitý dopad)
| Task | Popis | Odhad |
|------|-------|-------|
| **SEO-A** | Fix SiteFooter.tsx — nahradit raw `<a>` za next-intl `<Link>` pro pobočky + hashtag | S |
| **SEO-B** | Fix MobileBottomBar.tsx — nahradit raw `<a>` za `<Link>` pro pobočky | S |

### Fáze 2 — STŘEDNÍ priorita
| Task | Popis | Odhad |
|------|-------|-------|
| **SEO-C** | Aktualizovat krátké meta descriptions v seo_metadata DB | M |
| **SEO-D** | Implementovat IndexNow API endpoint + trigger na content change | M |
| **SEO-E** | Přidat noindex na `/clenstvi/zadost` | XS |

### Fáze 3 — NICE TO HAVE
| Task | Popis | Odhad |
|------|-------|-------|
| **SEO-F** | Optimalizovat slow pages — cache layer pro statické DB queries | L |
| **SEO-G** | Audit interních linků na redirectované URL | S |
| **SEO-H** | Přidat chybějící stránky do sitemap (pokud mají být indexable) | XS |

### Dependency graph
```
SEO-A ─┐
SEO-B ─┤── (nezávislé, paralelně)
SEO-E ─┘
       ↓
     BUILD TEST
       ↓
SEO-C ─┐
SEO-D ─┤── (nezávislé, paralelně)
       ↓
SEO-F ─┐
SEO-G ─┤── (nezávislé, paralelně)
SEO-H ─┘
```

---

## Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `components/layout/SiteFooter.tsx` | Raw `<a>` → next-intl `<Link>` (řádky 152, 166-169) |
| `components/layout/MobileBottomBar.tsx` | Raw `<a>` → next-intl `<Link>` + import (řádek 54) |
| `app/[locale]/clenstvi/zadost/page.tsx` | Přidat `robots: { index: false, follow: true }` |
| `app/api/indexnow/route.ts` | NOVÝ — IndexNow API endpoint |
| `public/{key}.txt` | NOVÝ — IndexNow verifikační soubor |
| `lib/seo-metadata.ts` nebo DB | Update krátkých meta descriptions |
| `app/sitemap.ts` | Přidat chybějící routes (pokud indexable) |

---

## Open Questions

1. **Které z 51 errors jsou konkrétně?** — Potřeba SEMrush report detail nebo crawl webu
2. **Má `/clenstvi/zadost` být indexable?** — Doporučení: NE (přidat noindex)
3. **Které blog posty mají krátké descriptions?** — SQL query potřeba
4. **Chce uživatel IndexNow integraci?** — Není povinná, ale zrychlí indexaci
