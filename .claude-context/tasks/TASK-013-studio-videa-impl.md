# TASK-013: Implementace — Studio video self-service stranka

## Datum: 2026-06-21

## Nove soubory

### 1. `app/[locale]/studio/videa/page.tsx`
- Server Component, `force-dynamic`
- `requireGirl()` auth guard
- Formular pro pridani Vimeo videa (URL nebo ID)
- Seznam existujicich videi s Vimeo embed iframe
- Tlacitko "Smazat" pro kazde video
- Success/error messages z URL params
- Inline `<style>` se `gv-*` tridy (stejna struktura jako admin verze)
- Responsivni: mobile-first layout na malych obrazovkach

### 2. `lib/vimeo.ts`
- Sdilena funkce `extractVimeoId()` — parsuje Vimeo URL i ciste ID
- Pouziva se v `admin-actions.ts` i `studio-actions.ts`

## Upravene soubory

### 3. `lib/studio-actions.ts`
- `addStudioVideo()` — vlozi video do `girl_videos` s auth guardem `requireGirl()`
- `removeStudioVideo()` — smaze video s `AND girl_id = ?` (ownership guard)
- Import `extractVimeoId` ze sdileneho `lib/vimeo.ts`

### 4. `lib/admin-actions.ts`
- Odstranen lokalni `extractVimeoId()` — nahrazen importem z `lib/vimeo.ts`

### 5. `components/studio/StudioSidebar.tsx`
- Pridan odkaz "Videa" (emoji: filmova klapka) za "Fotky" v NAV poli

## Bezpecnost
- `requireGirl()` na strance i v actions
- DELETE query: `WHERE id = ? AND girl_id = ?` — divka nemuze smazat cizi video
- `extractVimeoId()` sanitizuje vstup — jen cislo se ulozi
- Zadny file upload — pouze Vimeo URL

## Overeni
- TypeScript kompilace: OK (tsc --noEmit bez chyb)
- Server Components (bez `'use client'`)
- Funguje bez JS (Server Actions + form submit)
