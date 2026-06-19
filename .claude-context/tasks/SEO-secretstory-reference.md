# SEO v profilu divky — Secretstory reference + ESCX23 stav

**Datum:** 2026-06-14 | **Analyst:** planovac agent

---

## 1. Jak to delalo Secretstory

### Datovy model: `girl_seo_metadata` tabulka

Secretstory mel **samostatnou tabulku** `girl_seo_metadata` (1:N k `girls`, unikatni per `girl_id + locale`):

```sql
CREATE TABLE girl_seo_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL,
  locale TEXT NOT NULL,          -- 'cs', 'en', 'de', 'uk'
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  structured_data TEXT,          -- JSON-LD ulozeny jako string
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
  UNIQUE(girl_id, locale)
);
```

**DULEZITE:** Tabulka existovala ve schematu, ale mela **0 radku** (data export z 2026-05-09 ukazuje prazdnou tabulku). Secretstory tuto feature naplno nevyuzival — SEO profilu bylo reseno pres globalni `seo_metadata` tabulku s cestami jako `/cs/profily/niky`.

### Dualita: `seo_metadata` vs `girl_seo_metadata`

Secretstory mel **dva systemy** pro SEO profilu:
1. **`seo_metadata`** — per-page, cesta-based (`page_path = '/cs/profily/niky'`). Mela data (288 radku celkem, z toho ~52 pro profily).
2. **`girl_seo_metadata`** — per-girl, locale-based. Prazdna (0 radku). Nikdy nebyla plnena.

V praxi Secretstory pouzival pouze `seo_metadata` — girl-specificka tabulka byla pripravena ale nenaplnena.

---

## 2. Jak to dela ESCX23 (soucasny stav)

ESCX23 zvolil **LEPSI pristup** nez Secretstory — SEO pole jsou primo ve sloupcich tabulky `girls`:

### DB sloupce v `girls` tabulce

```
meta_title_cs, meta_title_en, meta_title_de, meta_title_uk
meta_description_cs, meta_description_en, meta_description_de, meta_description_uk
og_title_cs, og_title_en, og_title_de, og_title_uk
og_description_cs, og_description_en, og_description_de, og_description_uk
```

**16 sloupcu** — 4 pole x 4 jazyky. Primo v `girls` tabulce, zadna separatni tabulka.

### Admin UI — HOTOVO

Soubor: `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` (radky 780-835)

Sekce "SEO & Socialni site" (sekce 9 v admin edit formulari) zobrazuje pro kazdy jazyk (CS, EN, DE, UK):
- **Podtitul** (subtitle) — kratky text na profilu
- **Meta Title** — max 60 znaku, input
- **Meta Description** — max 160 znaku, textarea
- **OG Title** — social share titulek, input
- **OG Description** — social share popis, textarea

Tab prepinani mezi jazyky (CS/EN/DE/UK).

### Server Action — HOTOVO

Soubor: `lib/admin-actions.ts` (radky 84-99)

`updateGirlAction()` extrahuje vsechna SEO pole z FormData a predava do `updateGirlById()`.

### DB update query — HOTOVO

Soubor: `lib/queries.ts` (radky 881-913)

`updateGirlById()` zapisuje vsechna SEO pole vcetne `meta_title_cs/en/de/uk`, `meta_description_cs/en/de/uk`, `og_title_cs/en/de/uk`, `og_description_cs/en/de/uk`.

### Profile generateMetadata — HOTOVO

Soubor: `app/[locale]/profil/[slug]/page.tsx` (radky 71-136)

`generateMetadata()` pouziva sofistikovanou fallback chain:
- **Title:** `meta_title_{locale}` → `meta_title_en` → pattern `"{Name}, {Age} — Spolecnice Praha"`
- **Meta desc:** `meta_description_{locale}` → `og_description_{locale}` → `description_{locale}` → EN fallback → bio → generic
- **OG title:** `og_title_{locale}` → `og_title_en` → same as page title
- **OG desc:** `og_description_{locale}` → `meta_description_{locale}` → `description_{locale}` → EN fallback → bio
- **OG image:** primarni fotka divky z `girl_photos`
- Na konci jeste vola `applyDBOverride()` pro merge s `seo_metadata` tabulkou

### Aktualni data v DB (priklad: anetta)

```
meta_title_cs:      "Anetta – mlada Praha, jemna a pod vedenim ✨19! | LovelyGirls"
meta_description_cs: "Mlada a jemna, trochu chladna—miluje, kdyz muz vede..."
og_title_cs:        "Anetta – mlada Praha, jemna a pod vedenim ✨19! | LovelyGirls"
og_description_cs:  "Mlada a jemna, trochu chladna—miluje, kdyz muz vede..."
```

SEO pole jsou **jiz naplnena** pro Anettu (a pravdepodobne i dalsi divky).

---

## 3. Srovnani Secretstory vs ESCX23

| Aspekt | Secretstory | ESCX23 |
|--------|-------------|--------|
| Datovy model | Separatni `girl_seo_metadata` tabulka (1:N) | Sloupce primo v `girls` tabulce |
| Pouziti | Tabulka existovala ale nebyla naplnena (0 radku) | Pole aktivne pouzivana, data naplnena |
| Admin UI | Nepotvrzeno (Secretstory kod nedostupny) | HOTOVO — sekce 9 v edit formulari |
| Fallback chain | Nepotvrzeno | Sofistikovana: admin → locale → EN → bio → generic |
| Locale handling | Separatni radek per locale | Sloupce `_{locale}` (flat denormalizace) |
| OG image | V `girl_seo_metadata.og_image` (nikdy naplneno) | Automaticky z `girl_photos.is_primary` |
| JSON-LD | V `girl_seo_metadata.structured_data` (nikdy naplneno) | Generovany dynamicky v `profilePersonJsonLd()` |

**Zaver:** ESCX23 implementace je **kompletnejsi a funkcnejsi** nez co Secretstory mel. Uzivatelovo pozadavek "SEO se ma nastavovat v profilu divky, tak jak to bylo v Secret Story" je **jiz splnen** — a to lepe nez v originalu.

---

## 4. Mozne dalsi vylepseni

### 4a. Dualita `seo_metadata` vs `girls` sloupce

Profil page vola `applyDBOverride('/${locale}/profil/${slug}', ...)` po tom co uz pouzil `girls.*` SEO pole. Tabulka `seo_metadata` ma nektere profil zaznamy (z importu Secretstory). To znamena:

- Pokud `seo_metadata` ma zaznam pro `/cs/profil/anetta` s `meta_title`, **prepise** to co uz nastavila `generateMetadata()` z `girls.meta_title_cs`.
- Dva zdroje pravdy pro stejnou stranku = potencialni zmatky.

**Doporuceni:** Odstranit profil zaznamy z `seo_metadata` tabulky (vsechny `page_path LIKE '%/profil/%'`). Profil SEO je plne reseno pres `girls.*` sloupce, `seo_metadata` je pro staticke stranky (homepage, cenik, FAQ, etc.).

SQL pro cleanup:
```sql
DELETE FROM seo_metadata WHERE page_path LIKE '%/profil/%';
DELETE FROM seo_metadata WHERE page_path LIKE '%/profily/%';  -- stare Secretstory cesty
```

### 4b. Chybejici pole oproti Secretstory schematu

Secretstory schema mela tyto pole ktere ESCX23 nema:
- `twitter_title` — ESCX23 pouziva OG title jako fallback (spravne, Twitter akceptuje OG tagy)
- `twitter_description` — dtto
- `twitter_image` — ESCX23 pouziva primarni fotku (spravne)
- `structured_data` — ESCX23 generuje JSON-LD dynamicky (LEPSI pristup)

**Zadne z techto poli neni potreba pridavat.** ESCX23 je resi lepe automaticky.

### 4c. Studio self-service SEO (budouci sprint)

Divky by mohly mit moznost nastavit vlastni meta_description v Studio panelu (sekce "Muj profil"). To by umoznilo personalizovany SEO text bez zasahu admina.

**Pozor:** OG title a meta_title by nemely byt editovatelne divkami (riziko keyword stuffing). Pouze `meta_description` a `og_description` s limitem 160/200 znaku.

---

## 5. Odpoved na uzivateluv dotaz

> "SEO se ma nastavovat v profilu divky, tak jak to bylo v Secret Story"

**Odpoved:** Tato funkcionalita **jiz existuje** v ESCX23 a je **lepsi nez v Secretstory**:

1. Admin ma v editaci divky (sekce 9) pole pro Meta Title, Meta Description, OG Title, OG Description — ve vsech 4 jazycich
2. Pole jsou v DB jako sloupce `girls.meta_title_cs`, `girls.og_description_en` atd.
3. `generateMetadata()` na profil strance je pouziva s fallback chainem
4. Data jsou jiz naplnena (napr. Anetta ma custom meta_title i og_description)

**Jedina akce k provedeni:** Vycistit duplicitni `seo_metadata` zaznamy pro profil stranky (viz 4a).
