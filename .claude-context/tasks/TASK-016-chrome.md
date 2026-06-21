# TASK-016: Chrome test — Video tab na profilu

**Datum:** 2026-06-21
**Tester:** test-chrome

## Testováno: http://localhost:3000/cs/profil/anetta

### Výsledky

**Implementace video tabu v kódu:**
- [x] `ProfilHero.tsx` line 486: Video tab se renderuje podmínečně — `{videos.length > 0 && <a ...>}`
- [x] URL parametr pro video: `?media=video` (NE `?tab=video`)
- [x] Photo tab href: `/cs/profil/anetta`
- [x] Video tab href: `/cs/profil/anetta?media=video`
- [x] `activeMedia` prop: `sp.media === 'video' ? 'video' : 'photo'` (page.tsx line 149)
- [x] Video obsah se renderuje: `{activeMedia === 'video' && videos.length > 0 && <div class="profile-videos">...}`
- [x] Vimeo iframe: `https://player.vimeo.com/video/{vimeo_id}`

**Proč VIDEO tab není vidět na Anettě:**
- `girl_videos` tabulka je prázdná (0 záznamů v celé DB)
- Správné chování — tab se skryje když není obsah
- `?media=video` URL param ignorován když videos = [] (strana zůstane na FOTO)

**Vizuální stav profilu:**
- [x] FOTO tab "Foto 7" se zobrazuje, je aktivní (class="media-tab active")
- [x] Profil Anetty vypadá dobře: foto, věk/výška/váha box, bio, recenze badge (3.0 · 1 recenzí)
- [x] Age gate funguje správně

## PROBLÉM: nelze plně otestovat VIDEO tab přepínání

**Důvod:** Žádná dívka v DB nemá videa (`girl_videos` je prázdná).

**Doporučení:**
1. Přidat testovací video záznam do DB pro Anettu
2. NEBO: seeder s testovacím Vimeo ID (i neexistující pro vizuální test tabu)
3. Implementace je správná — jen chybí testovací data

## Implementační kód — PASS (code review)
Implementace video tabu je správná. Přepínání Foto↔Video funguje přes URL param `?media=video`.

## Status: PODMÍNĚNÝ PASS (implementace OK, testovací data chybí)
