# TASK-015: Evžen Review — Apartment reviews plán

## Verdikt: SCHVALENO

## Kontrola proti zadani

**Zadani uzivatele:** "k pobočkám přidat rate the apartment nebo něco v tom smyslu kde můžou lidi hodnotit apartmán"

### Bod po bodu:

| # | Aspekt | Zadani | Plan | Shoda |
|---|--------|--------|------|-------|
| 1 | Hodnoceni apartmanu | Lidi mohou hodnotit apartman | Rating 1-5 + sub-ratings (cistota/diskretnost/komfort) + textovy komentar | OK |
| 2 | Vazba na pobocky | "k pobockam pridat" | Tabulka `apartment_reviews` s FK na `locations(id)`, formular na strance pobocky | OK |
| 3 | Zobrazeni hodnoceni | Implicitne — lidi chteji videt hodnoceni | Prehled prumerneho ratingu + seznam schvalenych recenzi na strance pobocky | OK |
| 4 | Admin moderace | Implicitne — nutne pro anti-spam | Admin stranka `/admin/recenze-apartmanu`, pending/approved/rejected workflow | OK |
| 5 | Server-side | Pravidlo z CLAUDE.md | Formular pres Server Actions, zadny `'use client'` | OK |
| 6 | Funguje bez JS | Pravidlo z CLAUDE.md | `<select>` pro rating (nebo CSS-only radio), `<form action={...}>` | OK |

### Overeni aktualniho stavu kodu:

- `app/[locale]/pobocka/[slug]/page.tsx` — **EXISTUJE** (stranka pobocky kam se pridava)
- `lib/seo/jsonld.ts:338` — **EXISTUJE** funkce `localBusinessJsonLd()` (kam se prida aggregateRating)
- `lib/admin-notifications.ts` — **EXISTUJE** (pro `createAdminNotification`)
- `components/admin/AdminSidebar.tsx` — **EXISTUJE** (kam se prida odkaz na novou admin stranku)
- `lib/db.ts:30` — **EXISTUJE** funkce `runMigrations()` (kam se prida CREATE TABLE)
- `lib/queries.ts` — **EXISTUJE** (kam se pridaji nove query funkce)
- Tabulka `apartment_reviews` — **NEEXISTUJE** zatim (spravne, bude vytvorena)

### Analyza:

1. **Plan presne odpovida zadani.** Uzivatel chce aby lidi mohli hodnotit apartman — plan pridava formular na stranku pobocky s ratingem a komentarem.
2. **Separatni tabulka je spravne rozhodnuti.** Existujici `reviews` ma `girl_id NOT NULL` a jine sub-ratings — musi byt oddelena.
3. **Sub-ratings (cistota, diskretnost, komfort) jsou relevantni** pro escort apartman — dobry navrh.
4. **Anti-spam je primereny** — honeypot + rate limiting + admin moderace. Zadny CAPTCHA neni potreba.
5. **SEO AggregateRating je bonus** ale logicky — Google zobrazuje hvezdicky ve vysledcich, coz je pro business pridana hodnota.
6. **Scope je primereny** — 2 nove soubory + 6 upravenych, ~260 radku. Zadna nadprace.
7. **Vsechny referencovane soubory existuji** na uvedenych cestach.
8. **Plan nezavadi zadne 'use client' komponenty** — dodrzuje pravidlo server-side rendering.

### Drobna poznamka (NE blokujici):

Plan zminuje "CSS-only star rating" s radio pattern NEBO `<select>`. Doporucuji implementatorovi pouzit `<select>` — je jednodussi, vzdy funguje bez JS, a pro sub-ratings (cistota, diskretnost, komfort) je `<select>` prirozeny. Hvezdicky CSS pattern je hezky ale zbytecne slozity.

---

**Evzen the King — SCHVALENO k implementaci.**
