# QA Report — Task #2: Phone Decryption pro admin

**Datum:** 2026-09-15  
**Kontrolor:** kontrolor  
**Soubory:** `lib/client-queries.ts`, `app/booking/clients/[id]/page.tsx`, `lib/crypto.ts`, `lib/auth.ts`  
**Commit:** `fb7ddea`

---

## 1. Simplify — kvalita kódu

**PASS** — Kód je čistý a správně strukturovaný.

Poznámky:
- Decrypt probíhá v `getClientDetail()` v `lib/client-queries.ts` (server-side). Funkce vrací `phoneDecrypted` i `phoneEncrypted` jako součást `ClientDetail` interface — správně, umožňuje page komponentě rozlišit "šifrováno, ale selhalo" vs "neexistuje".
- `isEncrypted()` guard před `decrypt()` zabraňuje pokusu o dešifrování prostého textu — správně.
- `try { phoneDecrypted = decrypt(phoneRaw); } catch { /* decryption failed */ }` — fallback na `null` při chybě, zobrazí "sifrovano" místo pádu.
- Page komponenta (`page.tsx`) správně odděluje decryption (server-side v `client-queries.ts`) od role-based display (page level s `isAdmin`).

---

## 2. Debug — bezpečnostní a logické chyby

**PASS s 1 důležitou poznámkou**

**Kritická bezpečnostní poznámka:**  
`getClientDetail()` v `lib/client-queries.ts` provádí decrypt **vždy**, bez ohledu na roli volajícího. Funkce vrací `phoneDecrypted` v plain textu do `ClientDetail` objektu. Role-check (`isAdmin`) nastává **až v page.tsx** (řádky 75–78), kde se `phone = isAdmin ? client.phoneDecrypted : null`.

To znamená:
- Pokud by někdo zavolal `getClientDetail()` z jiného místa (API route, jiná stránka) bez role-checku v page.tsx, dostane dešifrovaná data.
- Decrypt v `client-queries.ts` je tedy "zbytečně provedený" pro non-admin uživatele — výsledek se zahodí v page.tsx, ale CPU a paměť se použijí.

**Doporučení pro budoucí refactor** (není blocker pro tuto implementaci): přidat `role` parametr do `getClientDetail()` a decryptovat pouze pro admin — nebo přesunout decrypt přímo do page.tsx. Aktuální implementace je bezpečná díky Server Component (žádný leak do clienta), ale není ideální z hlediska principu least privilege v kódu.

Ostatní kontroly:
- **Plaintext v klientu:** page.tsx je Server Component (`export default async function`), žádný `'use client'`. Decrypted data se neposílají do klientského JavaScript bundlu — OK.
- **Audit log:** `auditClientDecrypt()` volán pro každé zobrazení dešifrovaného telefonu/emailu, severity 'warn' — OK.
- **Klikací odkaz:** `<a href="tel:${phone}">` — správně, přímý tel: link.

---

## 3. Reverzní kontrola — porovnání se zadáním

Zadání: "admin vidí dešifrovaný telefon jako klikací odkaz, ostatní vidí 'šifrovano'"

| Požadavek | Stav | Poznámka |
|-----------|------|----------|
| Admin vidí dešifrovaný telefon | PASS | `isAdmin ? client.phoneDecrypted : null`, zobrazí se jako `<a href="tel:...">` |
| Telefon jako klikací odkaz | PASS | `<a href={\`tel:${phone}\`}>` v page.tsx řádek 142 |
| Non-admin vidí "šifrovano" | PASS | fallback na `client.phoneEncrypted` → `<span className="cd-encrypted">sifrovano</span>` |
| Email stejná logika | PASS | stejný pattern pro email (řádky 172–179) |
| Decrypt jen na serveru | PASS | Server Component + decrypt v server-side query funkci |
| try/catch fallback | PASS | catch v client-queries.ts → `phoneDecrypted = null` → zobrazí "sifrovano" |
| Žádný plaintext v klientu | PASS | Server Component, žádný 'use client' |
| Audit log | PASS (bonus) | `auditClientDecrypt()` voláno při každém zobrazení |
| AES-256-GCM šifrování | PASS | lib/crypto.ts — robustní implementace s auth tag |

---

## Verdikt

**APPROVED s poznámkou**

Implementace splňuje všechny požadavky zadání. Kód je funkční a bezpečný pro aktuální use case (Server Component).

Slabé místo k adresování v budoucnu: `getClientDetail()` vždy decryptuje bez ohledu na roli. Pro Task #3 (Client card redesign) nebo refactor doporučuji zvážit přesun role-based decrypt logisky do samotné query funkce.
