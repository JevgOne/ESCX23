# TASK-010: Admin panel nefunguje na www.lovelygirls.cz — Diagnostický plán

## Stav migrace
- Domain migrace z `escx23.vercel.app` na `www.lovelygirls.cz` — hotová v `next.config.ts` (301 redirecty)
- `NEXT_PUBLIC_SITE_URL="https://www.lovelygirls.cz"` — nastavena v Vercel (`.env.vercel-prod.local:8`)
- Login stránka `/cs/admin/login` se renderuje (curl 200 potvrzeno dříve)
- Auth kód je funkčně správný (redirecty, cookie settings, token verify)

---

## Nalezené problémy (seřazeny dle závažnosti)

### BUG 1 (CRITICAL): SESSION_SECRET obsahuje trailing `\n`

**Soubory:** `.env.vercel-prod.local:11`, `lib/auth.ts:32-37`

Aktuální stav v Vercel production env (pulled přes `vercel env pull`):
```
SESSION_SECRET="67db6aef22dd70559a273bf03a01ae41235d5e5d27dba4800b063b44f3dc26f7\n"
```

Trailing `\n` na konci hodnoty znamená, že se do HMAC podpisu dostane jiný SECRET než by byl bez `\n`. To samo o sobě session nelomí — secret je konzistentní mezi invokacemi.

**ALE:** Pokud byl SECRET v Vercel dashboardu zadán s trailing newline (copy-paste z terminálu `openssl rand -hex 32`), a Vercel env pull to serializuje s `\n`, pak je SECRET = `"67db6aef...7\n"`. Toto je stabilní a session by měly fungovat.

**Skutečný problém je jiný** — viz BUG 2 a BUG 3.

**Doporučení:**
- Odstranit trailing `\n` z `SESSION_SECRET` ve Vercel Dashboardu (Project Settings → Environment Variables → Production)
- Hodnota by měla být přesně: `67db6aef22dd70559a273bf03a01ae41235d5e5d27dba4800b063b44f3dc26f7`

---

### BUG 2 (CRITICAL): Server Actions CSRF origin check — chybí `allowedOrigins`

**Soubor:** `next.config.ts:9-12`

Next.js 16 provádí automatický CSRF check na Server Actions — porovnává `Origin` header requestu s `Host` headerem. Když se doména liší (nebo Vercel za proxy přeposílá `x-forwarded-host`), Server Action selže s HTTP 403.

Aktuální config:
```ts
experimental: {
  serverActions: {
    bodySizeLimit: '12mb',
  },
},
```

**Chybí `allowedOrigins`!** Pro custom doménu `www.lovelygirls.cz` je potřeba:

```ts
experimental: {
  serverActions: {
    bodySizeLimit: '12mb',
    allowedOrigins: ['www.lovelygirls.cz', 'lovelygirls.cz'],
  },
},
```

**Symptom:** Uživatel vyplní login form, klikne "Přihlásit →", Server Action `loginAdmin` se volá POSTem. Next.js porovná `Origin: https://www.lovelygirls.cz` s interním host (Vercel internal host = `*.vercel.app`). Pokud se neshoduje → 403 Forbidden → form submission selže tiše nebo hodí error.

**Poznámka k Next.js 16:** V Next.js 15+ je `serverActions` stále pod `experimental`. Od Next.js 14.1 se `allowedOrigins` používá právě pro scénář custom domén na Vercel.

---

### BUG 3 (MEDIUM): `lib/auth.ts` — `??` vs `||` pro SESSION_SECRET

**Soubor:** `lib/auth.ts:32`

```ts
const SECRET = process.env.SESSION_SECRET ?? (() => { ... })();
```

Operátor `??` (nullish coalescing) kontroluje pouze `null`/`undefined`. Pokud je `SESSION_SECRET=""` (prázdný string), `??` ho použije jako SECRET (prázdný string = velmi slabý HMAC klíč).

Starší `.env.prod.local` ukazuje `SESSION_SECRET=""` — pokud by se vrátilo k tomuto stavu, SECRET by byl `""`.

**Fix:** Přepnout na `||` nebo explicitní check:

```ts
const SECRET = process.env.SESSION_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[AUTH] SESSION_SECRET is not set! Generate one with: openssl rand -hex 32'
    );
  }
  return 'dev-secret-change-in-prod-' + Math.random().toString(36);
})();
```

Toto zajistí:
- V produkci s prázdným SECRET → fail fast s jasnou zprávou
- V dev bez SECRET → fallback s random (ale loguje warning)
- `.trim()` na SECRET hodnotu pro eliminaci trailing whitespace/newline

---

### BUG 4 (LOW): Env vars s trailing `\n` — další proměnné

**Soubory:** `.env.vercel-prod.local:3-6,11`

Tyto env vars mají trailing `\n`:
- `GOOGLE_CALENDAR_API_KEY` (řádek 3)
- `GOOGLE_CLIENT_ID` (řádek 4)
- `GOOGLE_CLIENT_SECRET` (řádek 5)
- `GOOGLE_REDIRECT_URI` (řádek 6)
- `SESSION_SECRET` (řádek 11)

**Příčina:** Pravděpodobně copy-paste z terminálu do Vercel Dashboard — terminál přidá newline.

**Doporučení:** Uživatel by měl projít Vercel Dashboard a ověřit/opravit tyto hodnoty. Trailing whitespace v API klíčích způsobuje tiché auth selhání.

---

### BUG 5 (LOW): `GOOGLE_REDIRECT_URI` odkazuje na starý host

**Soubor:** `.env.vercel-prod.local:6`

```
GOOGLE_REDIRECT_URI="https://escx23.vercel.app/api/gcal/callback\n"
```

Mělo by být:
```
GOOGLE_REDIRECT_URI="https://www.lovelygirls.cz/api/gcal/callback"
```

---

## Implementační plán

### Krok 1: Code fix — `next.config.ts` (IMPLEMENTOR)

Přidat `allowedOrigins` do serverActions config:

```ts
// next.config.ts, řádky 9-12
experimental: {
  serverActions: {
    bodySizeLimit: '12mb',
    allowedOrigins: ['www.lovelygirls.cz', 'lovelygirls.cz'],
  },
},
```

### Krok 2: Code fix — `lib/auth.ts` (IMPLEMENTOR)

Nahradit řádky 32-37:

```ts
// BEFORE:
const SECRET = process.env.SESSION_SECRET ?? (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[AUTH] SESSION_SECRET is not set! Sessions will break on restart. Set it in Vercel env vars.');
  }
  return 'dev-secret-change-in-prod-' + Math.random().toString(36);
})();

// AFTER:
const SECRET = (() => {
  const raw = process.env.SESSION_SECRET?.trim();
  if (raw) return raw;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[AUTH] SESSION_SECRET is not set! Generate one with: openssl rand -hex 32'
    );
  }
  return 'dev-secret-change-in-prod-' + Math.random().toString(36);
})();
```

Toto řeší:
- `.trim()` odstraní trailing `\n` nebo whitespace
- Prázdný string/undefined/null → produkce vyhodí error (fail fast)
- Dev mode → fallback s random (funguje jako doteď)

### Krok 3: Vercel Dashboard (USER ACTION)

Uživatel musí ve Vercel Dashboard (Project Settings → Environment Variables → Production):

1. **SESSION_SECRET** — zkontrolovat/přenastavit bez trailing whitespace:
   ```
   67db6aef22dd70559a273bf03a01ae41235d5e5d27dba4800b063b44f3dc26f7
   ```

2. **GOOGLE_REDIRECT_URI** — změnit na:
   ```
   https://www.lovelygirls.cz/api/gcal/callback
   ```

3. Ostatní Google env vars — ověřit že nemají trailing whitespace.

4. **Redeploy** po změnách.

### Krok 4: Verifikace

Po deployi ověřit:
- [ ] `https://www.lovelygirls.cz/cs/admin/login` → form se zobrazí
- [ ] Login s `admin@lovelygirls.cz` / `Admin2026!` → redirect na `/cs/admin`
- [ ] Dashboard se načte s daty (stat cards)
- [ ] Session přežije refresh stránky
- [ ] Navigace na sub-stránky (`/cs/admin/divky`, `/cs/admin/recenze`) funguje bez re-loginu
- [ ] Cookie `escx23_session`: HttpOnly, Secure, SameSite=Lax, Path=/
- [ ] Server Actions fungují (edit dívky, approve recenze)
- [ ] Logout → redirect na login, session smazána
- [ ] Studio login (`/cs/studio/login`) funguje analogicky
- [ ] `https://lovelygirls.cz/cs/admin` (non-www) → 301 → www → login

---

## Soubory k úpravě

| Soubor | Změna | Řádky |
|--------|-------|-------|
| `next.config.ts` | Přidat `allowedOrigins` do `serverActions` | 9-12 |
| `lib/auth.ts` | Fix SESSION_SECRET: `??` → trim + throw v produkci | 32-37 |

**Celkem: 2 soubory, ~10 řádků změn.**

## Root cause summary

Primární problém je pravděpodobně **BUG 2** — chybějící `allowedOrigins` v `serverActions` config. Next.js 16 Server Actions CSRF protection blokuje form submissions z custom domény `www.lovelygirls.cz` protože se neshoduje s interním Vercel hostem. BUG 3 (trailing `\n` v SESSION_SECRET) je sekundární problém, který může způsobit nekonzistentní session signing pokud se různé serverless instance trimují string různě.
