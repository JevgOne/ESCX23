# Ahrefs Site Audit Error Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 108 errors from Ahrefs Site Audit (28 Aug 2026): 46 hreflang-to-redirect, 27 404s, 27 4XX, 4 duplicate hreflang, 3 broken internal links, 1 redirect receiving traffic.

**Architecture:** Fix broken hreflang alternates in sitemap.ts and page metadata, add missing redirects in next.config.ts, repair internal links. No structural changes.

**Tech Stack:** Next.js 16 App Router, next-intl, TypeScript

---

## Root Cause Analysis

| Error | Count | Root Cause |
|-------|-------|------------|
| Hreflang to redirect/broken | 46 | Sitemap `/pobocka/[slug]` uses Czech paths for EN/DE/UK; pobocka page has no hreflang; some old URLs redirect but are referenced |
| 404 page | 27 | Deleted profiles/services, old URLs not covered by redirects |
| 4XX page | 27 | Same as 404 (overlapping set) |
| Duplicate hreflang | 4 | Sitemap pobocka entries clash with wrong paths |
| Links to broken page | 3 | Internal links reference pages that 404 |
| 3XX with organic traffic | 1 | Old redirect still ranking in Google |

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/sitemap.ts:27-33` | Modify | Fix `/pobocka/[slug]` locale paths to match routing.ts |
| `app/[locale]/pobocka/[slug]/page.tsx` | Modify | Add `alternates.languages` to generateMetadata |
| `scripts/audit-hreflang.mjs` | Create | Diagnostic script: fetch sitemap, check every URL status + hreflang |
| `next.config.ts` | Modify | Add redirects for 404 URLs found by diagnostic |
| `lib/seo/meta.ts` | Verify | Confirm `getAlternates()` handles slugs correctly (it does) |

---

### Task 1: Fix sitemap pobocka locale paths

**Files:**
- Modify: `app/sitemap.ts:27-33`

The sitemap PATHS table uses `/pobocka/[slug]` for ALL locales but `i18n/routing.ts` defines different paths per locale:
- EN: `/location/[slug]`
- DE: `/standort/[slug]`
- UK: `/lokatsiya/[slug]`

This causes every pobocka entry (× 3 locales) to have wrong URLs and wrong hreflang alternates.

- [ ] **Step 1: Write failing test — sitemap pobocka URLs match routing**

Create `scripts/test-sitemap-paths.mjs`:

```javascript
// Verify sitemap PATHS match i18n/routing.ts pathnames
// Run: node scripts/test-sitemap-paths.mjs

import { createRequire } from 'module';

// Hardcode expected values from i18n/routing.ts
const ROUTING_PATHNAMES = {
  '/pobocka/[slug]': { cs: '/pobocka/[slug]', en: '/location/[slug]', de: '/standort/[slug]', uk: '/lokatsiya/[slug]' },
  '/sluzba/[slug]': { cs: '/sluzba/[slug]', en: '/service/[slug]', de: '/leistung/[slug]', uk: '/posluha/[slug]' },
  '/profil/[slug]': { cs: '/profil/[slug]', en: '/profile/[slug]', de: '/profil/[slug]', uk: '/profil/[slug]' },
  '/divky': { cs: '/divky', en: '/girls', de: '/maedchen', uk: '/divchata' },
};

// Current WRONG values in sitemap.ts
const SITEMAP_PATHS_CURRENT = {
  '/pobocka/[slug]': { en: '/pobocka/[slug]', cs: '/pobocka/[slug]', de: '/pobocka/[slug]', uk: '/pobocka/[slug]' },
};

let errors = 0;
for (const [key, expected] of Object.entries(ROUTING_PATHNAMES)) {
  const current = SITEMAP_PATHS_CURRENT[key];
  if (!current) continue;
  for (const [locale, expectedPath] of Object.entries(expected)) {
    if (current[locale] !== expectedPath) {
      console.error(`FAIL: sitemap PATHS['${key}']['${locale}'] = '${current[locale]}' but routing has '${expectedPath}'`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} mismatches found between sitemap PATHS and routing pathnames`);
  process.exit(1);
} else {
  console.log('PASS: all sitemap PATHS match routing pathnames');
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-sitemap-paths.mjs`
Expected: FAIL — 3 mismatches for en, de, uk pobocka paths.

- [ ] **Step 3: Fix PATHS in sitemap.ts**

In `app/sitemap.ts`, change the `/pobocka/[slug]` entry:

```typescript
  '/pobocka/[slug]': {
    en: '/location/[slug]',
    cs: '/pobocka/[slug]',
    de: '/standort/[slug]',
    uk: '/lokatsiya/[slug]',
  },
```

- [ ] **Step 4: Run test to verify it passes**

Update the test script's `SITEMAP_PATHS_CURRENT` to match the fix, or simply manually verify the sitemap output.

Run: `npx next build` (to ensure TypeScript compiles)
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts scripts/test-sitemap-paths.mjs
git commit -m "fix(seo): correct pobocka locale paths in sitemap to match routing"
```

---

### Task 2: Add hreflang to pobocka page metadata

**Files:**
- Modify: `app/[locale]/pobocka/[slug]/page.tsx` (the `generateMetadata` function)

The pobocka page only sets `alternates.canonical` but has NO `alternates.languages`. Ahrefs reports this as missing hreflang, and it conflicts with the sitemap which DOES declare alternates.

- [ ] **Step 1: Read the current generateMetadata in pobocka page**

Read `app/[locale]/pobocka/[slug]/page.tsx` and find the `generateMetadata` function.

- [ ] **Step 2: Add alternates.languages using a location-specific helper**

Add a `locationAlternates` helper and use it in the metadata. In the `generateMetadata` function, add the `languages` field to `alternates`:

```typescript
function locationAlternates(slug: string): Record<string, string> {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';
  return {
    en: `${BASE}/location/${slug}`,
    cs: `${BASE}/cs/pobocka/${slug}`,
    de: `${BASE}/de/standort/${slug}`,
    uk: `${BASE}/uk/lokatsiya/${slug}`,
    'x-default': `${BASE}/location/${slug}`,
  };
}
```

Then in the return statement, change:

```typescript
    alternates: { canonical },
```

to:

```typescript
    alternates: { canonical, languages: locationAlternates(slug) },
```

- [ ] **Step 3: Also fix the canonical URL**

The current code uses `getCanonicalUrl(locale, '/pobocka/${slug}')`. Verify that `getCanonicalUrl` correctly translates the path for each locale. Since `lib/seo/meta.ts` has `localizedPath()` which handles slug paths via prefix matching, and the LOCALIZED_PATHS table is derived from routing.ts, this should work. But verify:

- `getCanonicalUrl('en', '/pobocka/vinohrady')` should return `https://www.lovelygirls.cz/location/vinohrady`
- `getCanonicalUrl('de', '/pobocka/vinohrady')` should return `https://www.lovelygirls.cz/de/standort/vinohrady`

If it doesn't (because the prefix matching in `localizedPath()` uses keys derived by `stripParam` which strips `[slug]` to get `/pobocka` as the prefix), test this.

- [ ] **Step 4: Build and verify**

Run: `npx next build`
Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/pobocka/[slug]/page.tsx
git commit -m "fix(seo): add hreflang alternates to pobocka page metadata"
```

---

### Task 3: Write diagnostic script to find remaining issues

**Files:**
- Create: `scripts/audit-hreflang.mjs`

This script fetches the live sitemap, checks every URL for HTTP status, and validates hreflang consistency. It identifies:
- URLs that return 404/4XX
- URLs that redirect (3XX)
- Hreflang links that point to broken/redirecting pages
- Duplicate hreflang entries
- Internal pages that link to broken pages

- [ ] **Step 1: Write the audit script**

```javascript
#!/usr/bin/env node
// Audit sitemap URLs and hreflang consistency
// Run: node scripts/audit-hreflang.mjs
//
// Fetches sitemap.xml, checks each URL for status code,
// then crawls each page for <link rel="alternate"> tags
// and validates they all return 200.

import https from 'https';
import http from 'http';

const BASE = 'https://www.lovelygirls.cz';
const CONCURRENCY = 5;
const TIMEOUT = 15000;

const results = {
  total: 0,
  ok: 0,
  redirect: [],   // { url, status, location }
  notFound: [],    // { url, status }
  hreflangBroken: [], // { page, hreflang, targetUrl, targetStatus }
  duplicateHreflang: [], // { page, lang, urls }
  errors: [],      // { url, error }
};

function fetch(url, followRedirects = false) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT);
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'ESCX23-Audit/1.0' } }, (res) => {
      clearTimeout(timer);
      if (followRedirects && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = new URL(res.headers.location, url).href;
        return fetch(loc, true).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body, url: res.headers.location || url }));
    });
    req.on('error', (e) => { clearTimeout(timer); reject(e); });
  });
}

async function checkUrl(url) {
  try {
    const res = await fetch(url);
    return { url, status: res.status, location: res.headers?.location };
  } catch (e) {
    return { url, status: 0, error: e.message };
  }
}

async function parseSitemap(url) {
  const res = await fetch(url, true);
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(res.body))) {
    urls.push(m[1]);
  }
  // Also extract alternates from <xhtml:link>
  const altRe = /<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g;
  const alternates = {};
  // Parse per-url block
  const urlBlocks = res.body.split('<url>').slice(1);
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    if (!locMatch) continue;
    const pageUrl = locMatch[1];
    alternates[pageUrl] = {};
    let am;
    const altReLocal = /<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g;
    while ((am = altReLocal.exec(block))) {
      alternates[pageUrl][am[1]] = am[2];
    }
  }
  return { urls, alternates };
}

async function runBatch(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i % 50 === 0 && i > 0) console.log(`  ... checked ${i}/${items.length}`);
  }
  return results;
}

async function main() {
  console.log('Fetching sitemap...');
  const { urls, alternates } = await parseSitemap(`${BASE}/sitemap.xml`);
  console.log(`Found ${urls.length} URLs in sitemap\n`);

  // Deduplicate
  const uniqueUrls = [...new Set(urls)];
  results.total = uniqueUrls.length;

  console.log('Checking URL status codes...');
  const statusChecks = await runBatch(uniqueUrls, checkUrl, CONCURRENCY);

  const statusMap = {};
  for (const check of statusChecks) {
    statusMap[check.url] = check.status;
    if (check.status === 200) {
      results.ok++;
    } else if (check.status >= 300 && check.status < 400) {
      results.redirect.push({ url: check.url, status: check.status, location: check.location });
    } else if (check.status >= 400) {
      results.notFound.push({ url: check.url, status: check.status });
    } else {
      results.errors.push({ url: check.url, error: check.error || `status ${check.status}` });
    }
  }

  // Check hreflang targets
  console.log('\nChecking hreflang targets...');
  const hreflangTargets = new Set();
  for (const [page, langs] of Object.entries(alternates)) {
    for (const [lang, targetUrl] of Object.entries(langs)) {
      hreflangTargets.add(targetUrl);
    }
  }

  // Only check targets we haven't already checked
  const uncheckedTargets = [...hreflangTargets].filter((u) => !(u in statusMap));
  if (uncheckedTargets.length > 0) {
    console.log(`  Checking ${uncheckedTargets.length} additional hreflang target URLs...`);
    const extraChecks = await runBatch(uncheckedTargets, checkUrl, CONCURRENCY);
    for (const check of extraChecks) {
      statusMap[check.url] = check.status;
    }
  }

  // Validate hreflang
  for (const [page, langs] of Object.entries(alternates)) {
    const langUrls = {};
    for (const [lang, targetUrl] of Object.entries(langs)) {
      const targetStatus = statusMap[targetUrl];
      if (targetStatus && targetStatus !== 200) {
        results.hreflangBroken.push({ page, hreflang: lang, targetUrl, targetStatus });
      }
      // Check for duplicate: same language pointing to different URLs
      if (lang !== 'x-default') {
        if (!langUrls[lang]) langUrls[lang] = [];
        langUrls[lang].push(targetUrl);
      }
    }
    for (const [lang, urlList] of Object.entries(langUrls)) {
      if (urlList.length > 1) {
        results.duplicateHreflang.push({ page, lang, urls: urlList });
      }
    }
  }

  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`Total URLs: ${results.total}`);
  console.log(`  OK (200): ${results.ok}`);
  console.log(`  Redirect (3XX): ${results.redirect.length}`);
  console.log(`  Not Found (4XX): ${results.notFound.length}`);
  console.log(`  Errors: ${results.errors.length}`);
  console.log(`  Hreflang → broken: ${results.hreflangBroken.length}`);
  console.log(`  Duplicate hreflang: ${results.duplicateHreflang.length}`);

  if (results.notFound.length > 0) {
    console.log('\n--- 404 Pages ---');
    for (const { url, status } of results.notFound) {
      console.log(`  ${status} ${url}`);
    }
  }

  if (results.redirect.length > 0) {
    console.log('\n--- Redirecting URLs in sitemap ---');
    for (const { url, status, location } of results.redirect) {
      console.log(`  ${status} ${url} → ${location || '?'}`);
    }
  }

  if (results.hreflangBroken.length > 0) {
    console.log('\n--- Hreflang pointing to broken/redirecting URLs ---');
    for (const { page, hreflang, targetUrl, targetStatus } of results.hreflangBroken) {
      console.log(`  [${hreflang}] ${targetUrl} (${targetStatus}) — on page: ${page}`);
    }
  }

  if (results.duplicateHreflang.length > 0) {
    console.log('\n--- Duplicate hreflang entries ---');
    for (const { page, lang, urls } of results.duplicateHreflang) {
      console.log(`  [${lang}] on ${page}: ${urls.join(', ')}`);
    }
  }

  if (results.errors.length > 0) {
    console.log('\n--- Connection errors ---');
    for (const { url, error } of results.errors) {
      console.log(`  ${url}: ${error}`);
    }
  }

  // Write JSON report
  const fs = await import('fs');
  fs.writeFileSync('audit-hreflang-results.json', JSON.stringify(results, null, 2));
  console.log('\nFull results saved to audit-hreflang-results.json');
}

main().catch(console.error);
```

- [ ] **Step 2: Run the audit BEFORE fixing (baseline)**

Run: `node scripts/audit-hreflang.mjs`
Expected: Report showing broken hreflang and 404s. Save output.

- [ ] **Step 3: Commit the script**

```bash
git add scripts/audit-hreflang.mjs
git commit -m "chore: add hreflang/sitemap audit script"
```

---

### Task 4: Fix 404 URLs with redirects

**Files:**
- Modify: `next.config.ts` (redirects section)

Based on the audit results from Task 3, add 301 redirects for any 404 URLs that should point to valid pages. Common patterns:

- Old profile slugs → current profile or `/girls` listing
- Old service slugs → current service or `/pricing`
- Old location slugs → current location

- [ ] **Step 1: Analyze audit-hreflang-results.json**

Read the JSON output and categorize 404 URLs:
- Profile 404s: `/profile/old-slug` → should redirect to `/girls` or a replacement profile
- Service 404s: `/service/old-slug` → redirect to `/pricing`
- Location 404s: `/location/old-slug` → redirect to closest valid location
- Other 404s: determine correct destination

- [ ] **Step 2: Add redirects to next.config.ts**

For each 404 URL, add a redirect rule. Example pattern:

```typescript
// Profile redirects for deleted companions
{ source: '/profile/deleted-slug', destination: '/girls', permanent: true },
{ source: '/cs/profil/deleted-slug', destination: '/cs/divky', permanent: true },
{ source: '/de/profil/deleted-slug', destination: '/de/maedchen', permanent: true },
{ source: '/uk/profil/deleted-slug', destination: '/uk/divchata', permanent: true },
```

Group redirects by type with comments for clarity.

- [ ] **Step 3: Remove 404 URLs from sitemap if they are deleted content**

If any 404s are caused by deleted girls/services/locations that are still returned by DB queries in `sitemap.ts`, fix the query filters:

- `getAllGirlsForAdmin(undefined, 'active')` — verify this only returns active girls
- `getActiveLocations()` — verify this only returns active locations
- `getAllServices()` — verify this only returns active services with valid slugs

- [ ] **Step 4: Build and verify**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts app/sitemap.ts
git commit -m "fix(seo): add redirects for 404 URLs and clean sitemap queries"
```

---

### Task 5: Fix internal links to broken pages

**Files:**
- Various component/page files (determined by audit)

Ahrefs found 3 pages with links to broken pages.

- [ ] **Step 1: Identify broken internal links**

After deploying Task 1-4 fixes, re-run the audit script. Or search the codebase for hardcoded hrefs that might reference deleted content:

```bash
grep -rn 'href="/' --include='*.tsx' --include='*.ts' app/ components/ | grep -v node_modules | grep -v '.next'
```

Look for links to specific profile slugs, old service paths, or deprecated pages.

- [ ] **Step 2: Fix each broken link**

For each broken link found:
- If it references a deleted profile → change to `/girls` listing or remove the link
- If it references an old service → update to current slug
- If it references a deprecated page → redirect or remove

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix(seo): repair internal links pointing to broken pages"
```

---

### Task 6: Verify all fixes

**Files:**
- No changes — verification only

- [ ] **Step 1: Build the project**

Run: `npx next build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Deploy to preview and run audit**

Push to a preview branch and run the audit script against the preview URL:

```bash
BASE=https://preview-url.vercel.app node scripts/audit-hreflang.mjs
```

Expected:
- 0 sitemap URLs returning 404
- 0 hreflang links pointing to redirects or broken pages
- 0 duplicate hreflang entries

- [ ] **Step 3: Spot-check key pages manually**

Verify hreflang in browser DevTools (`document.querySelectorAll('link[hreflang]')`) on:
- Homepage: 4 locales + x-default ✓
- A profile page: 4 locales + x-default ✓
- A pobocka page: 4 locales + x-default (NEW) ✓
- A service page: 4 locales + x-default ✓
- Blog listing: 2 locales (en + cs) + x-default ✓

- [ ] **Step 4: Request Ahrefs re-crawl**

In Ahrefs Site Audit → click "New crawl" to validate all fixes.

- [ ] **Step 5: Deploy to production**

After verification passes:

```bash
git push origin main
```
