# TASK-7 — Chrome test report

**Datum:** 2026-06-01  
**Tester:** test-chrome  
**Stav:** PASS s poznamkou

---

## Studio Kalendar — /cs/studio/kalendar

**Vysledek: PASS**

- URL se nacte: OK (http://localhost:3000/cs/studio/kalendar)
- Legenda: 1 container, 3 polozky (Pracuji / Volno / Dnes) — OK
- Dnešní den zvyraznen: 1 karta s .cal-day-today — OK
- Border color dnešního dne: rgb(242, 125, 141) = coral — OK
- Hover efekt transition: `border-color 0.15s, box-shadow 0.15s, transform 0.15s` — OK
- Grid: 14 karet (14 dni) — OK
- Vsechny karty zobrazuji "Volno" (holka nema nastaveny rozvrh v DB) — ocekavane

**Screenshot:** /tmp/studio-kalendar-full.png

---

## Admin Rezervace — /cs/admin/rezervace

**Vysledek: PASS s poznamkou o datech**

- URL se nacte: OK (http://localhost:3000/cs/admin/rezervace)
- Strana se renderuje spravne v dark mode
- Status filtry (Vse / Ceka / Potvrzena / Dokoncena / Zrusena) — OK
- Placeholder "Žádné rezervace" se zobrazuje — OK
- **Google Calendar iframe: CHYBI** — ale pouze protoze v DB neni zadna holka s `calendar_embed_url`
  - CSS `.cal-google-iframe` je spravne definovano s `filter: invert() hue-rotate(180deg)`
  - Admin page.tsx ma spravny inline style `filter: 'invert(1) hue-rotate(180deg)'`
  - Kod je funkcni, jen neni testovaci data v DB

**Screenshot:** /tmp/admin-rezervace-full.png

---

## Zavery

| Test | Vysledek |
|------|---------|
| Studio kalendar se nacte | PASS |
| Legenda (3 polozky) | PASS |
| Dnešní den coral border | PASS |
| Hover transition na kartach | PASS |
| 14-denni grid | PASS |
| Admin rezervace se nacte | PASS |
| Admin dark mode | PASS |
| Google Calendar iframe viditelny | N/A — zadna data v DB |
| CSS dark filter definovan | PASS (v CSS) |
| Inline filter v admin page | PASS (v JSX kodu) |

**Datovy problem:** Zadna holka v DB nema `calendar_embed_url` nastaven, takze iframe sekce se nezobrazi. Toto neni chyba kodu ale chybejici testovaci data.

