# QA Report: Operátorka Chrome Test — 2026-09-15

**Testoval:** test-chrome  
**Produkce:** https://www.lovelygirls.cz/booking/  
**Účet:** operator@lovelygirls.cz / Operator2026!  
**Výsledek: 13 PASS | 0 FAIL | 3 WARN**

---

## Výsledky

### 1. Login (PASS)
Přihlášení OK, redirect na `/booking/calendar` (správně — operátorka jde na kalendář, ne dashboard).

### 2. Sidebar operátorky (vše PASS)
- Uživatelé: NENI vidět (správně)
- Audit: NENI vidět (správně)
- Nastavení: NENI vidět (správně)
- Kalendář: JE v sidebaru
- Klienti: JE v sidebaru
- Rozvrh směn: JE v sidebaru
- Locked sekce: Zobrazena zpráva "Sekce Správa a Systém nejsou dostupné pro operátorku"

### 3. Kalendář (PASS + WARN)
- Stránka existuje a funguje
- Text "GCal Import" se NEVYSKYTUJE (správně — jména místo GCal importů)
- Kalendář zobrazuje týdenní grid s dívkami a rezervacemi (jména klientů viditelná)
- WARN: Playwright nenašel event element selektorem — kalendář má vlastní CSS třídy, ale visuálně zobrazuje rezervace (ověřeno z textu stránky)

### 4. Rozvrh směn (PASS)
- Stránka `/booking/schedule` existuje
- Zobrazuje týdenní rozvrh s dívkami a časovými bloky
- Ukázka: Emily → 10:00–16:00 ŽIŽKOV, PRAHA 3

### 5. Klienti (PASS + WARN)
- Stránka `/booking/clients` funguje, 7583 klientů
- Klienta lze rozkliknout → detail stránka `/booking/clients/15` funguje
- Detail obsahuje: LG ID, typ (STÁLÝ KLIENT), počet návštěv, kontakt (telefon šifrovaný), telegram, deep-link, interní poznámky, historii rezervací, správu klienta
- WARN: CSS selektor pro 2-column layout nenalezen automaticky — zkontrolovat vizuálně

### 6. Favicon (PASS + WARN)
- Favicon link tagy existují v HTML: `/booking/icon.svg`, `/apple-icon.png`
- WARN: `favicon.ico` vrací 404, SF specifický název nenalezen automaticky
- Vizuálně zkontrolovat v prohlížeči (Chrome tab zobrazuje ikonu)

---

## Problémy k řešení

### Menší (WARN):
1. **Kalendář modal** — Playwright nenalezl klikatelný event selektor. Kalendář zobrazuje data správně, ale kliknutí na rezervaci nebylo automaticky testováno. Doporučit manuální ověření.
2. **Klienti 2-column layout** — CSS třídy nenalezeny selektorem, ale stránka obsahuje správné sekce (kontakt, statistiky, správa). Možná inline styles nebo jiné CSS třídy.
3. **favicon.ico 404** — `/favicon.ico` vrací 404, ale `/booking/icon.svg` existuje. Next.js může servírovat favicon přes jiný path.
