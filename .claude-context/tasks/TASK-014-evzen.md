# TASK-014: Evžen Review — Auth security plán

## Verdikt: SCHVALENO

## Kontrola proti zadani

**Zadani uzivatele:** "na jednom a tom samem PC jsem neustale prihlaseny, musi to vyzadovat casteji heslo"

### Bod po bodu:

| # | Aspekt | Zadani | Plan | Shoda |
|---|--------|--------|------|-------|
| 1 | Problem identifikovan | Uzivatel je neustale prihlaseny | Plan spravne identifikuje pricinu: session maxAge 30 dni, zadny idle timeout, cookie prezije zavreni prohlizece | OK |
| 2 | Reseni: castejsi prihlaseni | Musi to vyzadovat casteji heslo | Snizeni session na 8h (admin/manager), 3 dny (girl) | OK |
| 3 | UX: remember me | Implicitne — aby to nebylo prilis agresivni | Checkbox "Zapamatovat si me" (7 dni vs browser session) | OK — dobra UX varianta |
| 4 | Scope | Minimalni zasah | 4 soubory, ~30 radku | OK — primerane |

### Overeni aktualniho stavu kodu:

- `lib/auth.ts:15` — potvrzeno: `SESSION_MAX_AGE_DAYS = 30`
- `lib/auth.ts:64` — potvrzeno: `setSession(userId, role)` bez remember parametru
- `lib/auth.ts:72` — potvrzeno: `maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60` (30 dni)
- `lib/auth-actions.ts:14-27` — potvrzeno: `loginAdmin` nepracuje s remember
- `lib/auth-actions.ts:29-42` — potvrzeno: `loginGirl` nepracuje s remember
- `app/[locale]/(admin)/admin/login/page.tsx` — existuje
- `app/[locale]/studio/login/page.tsx` — existuje

### Analyza:

1. **Plan presne odpovida zadani.** Uzivatel chce casteji heslo — plan snizuje session z 30 dni na 8h/3 dny.
2. **Remember me je bonus, ne nadprace.** Bez nej by 8h session mohla byt pro uzivatele neprijemna (odhlasi se behem dne). Checkbox dava kontrolu uzivateli.
3. **Plan spravne popisuje aktualni stav.** Overil jsem proti skutecnemu kodu — vsechny popisy (maxAge, token format, zadny idle timeout) odpovidaji.
4. **Soubory k uprave existuji** na uvedenych cestach.
5. **Zadne skryte zmeny** — plan neschovava nic, nemaze nic, nepridava zbytecne funkce.
6. **Zmena 2 (idle timeout) a Zmena 4 (session invalidation) jsou spravne oznaceny jako volitelne/low priority** — plan doporucuje jen Zmenu 1 + 3.

### Poznamka:

Plan zminuje ze "bez maxAge = session cookie = zavreni prohlizece = odhlaseni". To je spravne chovani: kdyz uzivatel nezaskrtne "remember me", zavreni prohlizece ho odhlasi, coz presne odpovida pozadavku "musi to vyzadovat casteji heslo".

---

**Evzen the King — SCHVALENO k implementaci.**
