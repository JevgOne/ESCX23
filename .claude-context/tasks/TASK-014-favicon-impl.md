# TASK-014: Favicon — Implementace hotová

## Co bylo implementováno

### Krok 1: Generování rasterizovaných variant
**Soubor vytvořen:** `scripts/generate-favicons.mjs`
- Používá `sharp` (již nainstalovaný jako dependency Next.js)
- Generuje 3 soubory z `app/icon.svg`:

| Soubor | Rozměr | Účel |
|--------|--------|------|
| `app/icon.png` | 192x192 | Chrome/Android tabs, Google Favicon API |
| `app/apple-icon.png` | 180x180 | iOS home screen |
| `app/favicon.ico` | 48x48 | Starší browsery, bookmarky |

### Krok 2: Vyčištění SVG fallbacků
- **Smazáno:** `app/apple-icon.svg` (nahrazeno `apple-icon.png`)
- **Ponecháno:** `app/icon.svg` (moderní browsery preferují SVG, Next.js servíruje oba)

### Krok 3: Ověření
- Build úspěšný — Next.js detekuje:
  - `○ /apple-icon.png` (static)
  - `○ /icon.png` (static)
  - `○ /icon.svg` (static)
- `favicon.ico` servírován automaticky z `app/favicon.ico`

## Soubory
| Soubor | Akce |
|--------|------|
| `scripts/generate-favicons.mjs` | VYTVOŘEN |
| `app/icon.png` | VYTVOŘEN (12.5 KB) |
| `app/apple-icon.png` | VYTVOŘEN (11.5 KB) |
| `app/favicon.ico` | VYTVOŘEN (2 KB) |
| `app/apple-icon.svg` | SMAZÁN |
