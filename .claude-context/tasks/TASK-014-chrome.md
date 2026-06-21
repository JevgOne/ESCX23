# TASK-014: Chrome test — Auth login (aktualizace)

**Datum:** 2026-06-21
**Tester:** test-chrome

## Výsledky

### Admin login (http://localhost:3000/cs/admin/login)
- [x] Checkbox "Zapamatovat si mě (7 dní)" je viditelný a unchecked by default
- [x] Login BEZ checkboxu funguje
- [x] Redirect po přihlášení: `/cs/admin` (Dashboard)
- [x] "Recenze apartmanu" je v sidebaru adminu
- [x] `/cs/admin/recenze-apartmanu` strana existuje, funguje (zobrazuje "0 recenzí čeká")
- Poznámka: email v DB je `info@lovelygirls.cz` (ne admin@)

### Studio login (http://localhost:3000/cs/studio/login)
- [x] Checkbox "Zapamatovat si mě (7 dní)" viditelný
- [x] Login funguje → redirect na `/cs/studio` ("Ahoj Anetta")
- [x] Studio dashboard: profil 100%, dostupnost, statistiky — OK

## PASS

## Vedlejší nalezy
- middleware.ts deprecated v Next.js 16 → treba prejmenovat na proxy.ts (500 chyby při zátěži)
- Email admina je info@lovelygirls.cz, ne admin@lovelygirls.cz
