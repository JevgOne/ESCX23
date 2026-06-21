# TASK-014: QA — Auth session expirace + remember me

**Datum:** 2026-06-21
**Kontrolor:** kontrolor

---

## 1. Simplify kontrola

### lib/auth.ts

**Pozitivní:**
- Konstanty jsou pojmenované přehledně (`SESSION_MAX_AGE_SECONDS`, `REMEMBER_ME_MAX_AGE`)
- `setSession()` má čistou logiku: `remember=true` → persistent cookie, `remember=false` → session cookie (bez `maxAge`)
- `verifyToken()` kontroluje expiraci uvnitř tokenu (`Number(exp) < Date.now()`) — správně

**Nalezena 1 potenciální chyba — logic inconsistency:**

```ts
// lib/auth.ts:70-82
export async function setSession(userId: number, role: string, remember = false) {
  const maxAge = remember
    ? REMEMBER_ME_MAX_AGE
    : SESSION_MAX_AGE_SECONDS[role] ?? 8 * 60 * 60;
  const token = createToken(userId, role, maxAge);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    ...
    ...(remember ? { maxAge } : {}),  // <-- cookie nemá maxAge bez remember
  });
}
```

**Problem:** Když `remember=false`, cookie nemá `maxAge` (= session cookie, vyprší po zavření browseru). ALE token uvnitř cookie má expiration nastavenou na 8h (resp. 72h pro girl). To znamená:

- Cookie: přežije pouze do zavření browseru → OK
- Token v cookie: expiruje za 8h/72h → OK

Tyto dvě věci jsou **konzistentní** — token i cookie expirují, jen různým mechanismem. **Není to bug, ale stojí za zmínku:** pokud user zavře browser po 1h a znovu otevře za 2h (do 8h okna), cookie nebude přítomna (session cookie zmizela). Chování je tedy správné.

**Duplicita `getLocale()`:**

Funkce `getLocale()` je definována **dvakrát** — v `lib/auth.ts` (řádek 7-12) i v `lib/auth-actions.ts` (řádek 7-12). Jde o zjevnou duplicitu, která by měla být extrahována do sdílené utility. Nicméně toto není nová chyba zavedená v TASK-014 — byla přítomna i dříve. Netýká se přímo scope tohoto tasku.

### lib/auth-actions.ts

Čistý kód. `loginAdmin` a `loginGirl` jsou symetrické, logika je přehledná.

### admin/login/page.tsx

Kód je čistý. CSS je v `LOGIN_STYLES` stringu (inline `<style>`), checkbox má správný `name="remember"`.

### studio/login/page.tsx

**Nalezen problém — inkonsistentní styling:**

Studio login page (`studio/login/page.tsx`) používá **inline styly** místo CSS tříd:

```tsx
<label style={{ display: 'flex', alignItems: 'center', gap: '8px', ... }}>
  <input type="checkbox" name="remember" style={{ accentColor: '#f27d8d', ... }} />
```

Admin login page má pro remember me čistý CSS class `.escx-login-remember`.

Studio login je obecně vizuálně chudší (žádný background gradient, žádné karty, žádné efekty) — ale toto je existující technický dluh, ne nová regrese z TASK-014.

---

## 2. Debug kontrola

### TypeScript
```
npx tsc --noEmit → 0 chyb
```

### Build
```
npm run build → SUCCESS
/[locale]/studio/login — ƒ (Dynamic)
/[locale]/admin/login — ƒ (Dynamic)
```
Oba jsou `force-dynamic`, build prošel bez chyb.

### Lint
ESLint **není nakonfigurován** (chybí `eslint.config.js` pro ESLint v9). Toto je existující problém projektu, ne regrese z TASK-014.

---

## 3. Reverzní kontrola vs zadání

### Původní požadavek
> "Na jednom a tom samém PC jsem neustále přihlášený, musí to vyžadovat častěji heslo"

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Admin session se zkrátí (nebude 30 dní) | ✅ | Implementováno: 8h bez remember me |
| 2 | Manager session se zkrátí | ✅ | Implementováno: 8h |
| 3 | Studio (girl) session — rozumná délka | ✅ | 72h (3 dny) — přiměřené pro girl |
| 4 | Remember me checkbox na admin login | ✅ | Checkbox s labelem "Zapamatovat si mě (7 dní)" |
| 5 | Remember me checkbox na studio login | ✅ | Checkbox přítomen |
| 6 | Bez remember me: session cookie (zmizí po zavření browseru) | ✅ | `...(remember ? { maxAge } : {})` — cookie bez maxAge |
| 7 | S remember me: persistent 7 dní | ✅ | `REMEMBER_ME_MAX_AGE = 7 * 24 * 60 * 60` |
| 8 | Token expiration odpovídá cookie | ✅ | Token i cookie mají konzistentní expirace |

### Vyšší nároky z plánu (TASK-014-plan.md)

| Položka z plánu | Status | Poznámka |
|-----------------|--------|----------|
| Idle timeout | ⚠️ NENÍ | Záměrně vynecháno — plán označil jako "volitelné", scope byl Změna 1 + Změna 3 |
| Session invalidation při změně hesla | ⚠️ NENÍ | Záměrně vynecháno — plán označil jako "low priority" |
| Concurrent session limit | ⚠️ NENÍ | Záměrně vynecháno — nebyl součástí doporučené implementace |
| CSRF ochrana | ⚠️ Existující | Next.js Server Actions mají Origin check; `allowedOrigins` pro custom doménu je jiný task |

---

## Závěr

### Blocker
Žádný.

### Doporučení (non-blocker)
1. **Duplikace `getLocale()`** — extrahovat do `lib/locale-utils.ts`, použít v obou souborech. Nevzniklo v TASK-014, ale je to vhodný refactor.
2. **Studio login styling** — stránka vizuálně neodpovídá admin loginu (žádný design). Měla by dostat stejnou úroveň designu. Kandidát na samostatný task.

### Verdikt
**PASS** — implementace splňuje původní zadání ("vyžadovat častěji heslo") i doporučený scope z plánu (Změna 1 + Změna 3). Build a typecheck bez chyb.
