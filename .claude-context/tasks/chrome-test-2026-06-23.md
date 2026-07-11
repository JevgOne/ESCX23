# Chrome Test — Produkce www.lovelygirls.cz
**Tester:** test-chrome  
**Datum:** 2026-06-23  
**Prostředí:** PRODUKCE (www.lovelygirls.cz)

---

## 1. /cs/rozvrh?day=2026-06-26 — Šedý badge Katy a Kim

**Výsledek: PASS**

- **Katy** se zobrazuje: badge `girl-photo-time-future` s časem **10:00–16:00**
- **Kim** se zobrazuje: badge `girl-photo-time-future` s časem **16:30–22:30**
- CSS třída `girl-photo-time-future` = šedá barva `#94a3b8` (slate)
- **NENÍ zelený** — správně šedý proužek dole na fotce
- Obě dívky mají `data-status="available"` (karta je klikatelná)

---

## 2. Favicon v tabu prohlížeče

**Výsledek: PASS**

- Favicon links v `<head>`:
  - `<link rel="icon" href="/favicon.ico" sizes="48x48" type="image/x-icon"/>` — PNG 48×48
  - `<link rel="icon" href="/icon.svg" sizes="any" type="image/svg+xml"/>` — SVG ženská silueta
- SVG obsahuje kompletní path ženské siluety (LovelyGirls logo)
- **Není tam "L"** — je ženská silueta na tmavém pozadí

---

## 3. /cs/profil/nika — Sekce Styl & Šatník

**Výsledek: PASS — sekce se zobrazuje s chipy**

Nika má vyplněná data v `style_wardrobe`. Nalezeny chipy:
- **Styl:** Elegantní, Glamour, Romantický
- **Šatník:** Spodní prádlo, Punčochy, Vysoké podpatky, Korzet, Kostým, Plavky

Sekce je viditelná na profilu jako čipy/tagy. FUNGUJE.

---

## 4. /cs/podminky — meta robots noindex

**Výsledek: PASS**

```html
<meta name="robots" content="noindex, follow"/>
```

Potvrzen v HTML `<head>` (ověřeno curl, odpovídá DevTools Elements).

---

## 5. /cs/faq — Language switcher EN → musí zůstat na /faq

**Výsledek: PASS**

- Language switcher na `/cs/faq` obsahuje odkaz `href="/faq"` pro EN
- `/faq` (EN default) vrací HTTP 200, page title: **"FAQ – Prague companions: quick answers"**
- H1: **"Frequently Asked Questions"**
- **NEZOBRAZUJE /schedule** — je to FAQ stránka
- `/en/faq` dělá 307 → `/faq` (EN default bez prefixu) — správné chování
- hreflang: `<link rel="alternate" hrefLang="en" href="https://www.lovelygirls.cz/faq"/>`

---

## Shrnutí

| # | Test | Status |
|---|------|--------|
| 1 | Šedý badge Katy + Kim na 2026-06-26 | **PASS** |
| 2 | Favicon — ženská silueta (ne "L") | **PASS** |
| 3 | Šatník sekce na /profil/nika | **PASS** |
| 4 | /podminky noindex meta tag | **PASS** |
| 5 | FAQ lang switcher EN → /faq (ne /schedule) | **PASS** |

**Všechny testy prošly. Produkce OK.**
