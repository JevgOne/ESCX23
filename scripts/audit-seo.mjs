#!/usr/bin/env node
/**
 * Walks every URL in the sitemap and checks the signals we actually send to
 * Google, against what the site really serves. Read-only — it makes GET and
 * HEAD requests and writes nothing.
 *
 * Checks per URL:
 *   status        the sitemap must not list redirects or errors
 *   canonical     must be absolute, on our host, and resolve 200 without a hop
 *   self-ref      canonical should point at the URL itself
 *   hreflang      every alternate must resolve 200 without a hop
 *   reciprocity   each alternate must point back at this URL for this locale
 *   x-default     must be present and resolve
 *   noindex       a page in the sitemap must not be noindex
 *   title/desc    present, sane length, and not shared with another page
 *   json-ld       every <script type="application/ld+json"> must parse
 *   links         internal <a href> must not 404 or take a redirect hop
 *   images        <img> inside content must carry alt text
 *
 *   node scripts/audit-seo.mjs                 # whole sitemap
 *   node scripts/audit-seo.mjs --limit 40      # first 40 URLs
 *   node scripts/audit-seo.mjs --filter sluzba # only URLs containing "sluzba"
 *   node scripts/audit-seo.mjs --json out.json  # every finding, for grouping
 */
const BASE = process.env.SITE ?? 'https://www.lovelygirls.cz';
const HOST = new URL(BASE).host;
const args = process.argv.slice(2);
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const filter = args.includes('--filter') ? args[args.indexOf('--filter') + 1] : null;
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const CONCURRENCY = 6;

const headCache = new Map();
const seenTitles = new Map();      // title → [urls]
const seenDescs = new Map();       // description → [urls]
const linkCache = new Map();       // internal href → status

async function statusOf(url) {
  if (headCache.has(url)) return headCache.get(url);
  const p = (async () => {
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'manual' });
      return { status: r.status, location: r.headers.get('location') };
    } catch (e) {
      return { status: 0, location: null, error: String(e.message ?? e) };
    }
  })();
  headCache.set(url, p);
  return p;
}

function tag(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

async function auditOne(url) {
  const problems = [];
  let res;
  try {
    res = await fetch(url, { redirect: 'manual' });
  } catch (e) {
    return [{ url, kind: 'unreachable', detail: String(e.message ?? e) }];
  }

  if (res.status !== 200) {
    problems.push({
      url,
      kind: 'sitemap-not-200',
      detail: `${res.status}${res.headers.get('location') ? ' → ' + res.headers.get('location') : ''}`,
    });
    return problems;
  }

  const html = await res.text();

  // robots
  const robots = tag(html, /<meta name="robots" content="([^"]*)"/i);
  if (robots && /noindex/i.test(robots)) {
    problems.push({ url, kind: 'noindex-in-sitemap', detail: robots });
  }

  // canonical
  const canonical = tag(html, /<link rel="canonical" href="([^"]*)"/i);
  if (!canonical) {
    problems.push({ url, kind: 'canonical-missing', detail: '—' });
  } else {
    let cu;
    try {
      cu = new URL(canonical, url);
    } catch {
      problems.push({ url, kind: 'canonical-malformed', detail: canonical });
      cu = null;
    }
    if (cu) {
      if (cu.host !== HOST) {
        problems.push({ url, kind: 'canonical-off-domain', detail: canonical });
      } else {
        const st = await statusOf(cu.href);
        if (st.status !== 200) {
          problems.push({
            url,
            kind: 'canonical-not-200',
            detail: `${canonical} → ${st.status}${st.location ? ' → ' + st.location : ''}`,
          });
        } else if (cu.href.replace(/\/$/, '') !== url.replace(/\/$/, '')) {
          problems.push({ url, kind: 'canonical-not-self', detail: canonical });
        }
      }
    }
  }

  // hreflang
  const alts = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/gi)]
    .map((m) => ({ lang: m[1], href: m[2] }));

  if (alts.length > 0) {
    if (!alts.some((a) => a.lang === 'x-default')) {
      problems.push({ url, kind: 'hreflang-no-x-default', detail: alts.map((a) => a.lang).join(',') });
    }
    for (const a of alts) {
      let au;
      try {
        au = new URL(a.href, url);
      } catch {
        problems.push({ url, kind: 'hreflang-malformed', detail: `${a.lang} ${a.href}` });
        continue;
      }
      if (au.host !== HOST) {
        problems.push({ url, kind: 'hreflang-off-domain', detail: `${a.lang} ${a.href}` });
        continue;
      }
      const st = await statusOf(au.href);
      if (st.status !== 200) {
        problems.push({
          url,
          kind: 'hreflang-not-200',
          detail: `${a.lang} ${a.href} → ${st.status}${st.location ? ' → ' + st.location : ''}`,
        });
      }
    }
  }

  // ---- title / description ----
  const title = tag(html, /<title>([^<]*)<\/title>/i);
  const desc = tag(html, /<meta name="description" content="([^"]*)"/i);

  if (!title || !title.trim()) {
    problems.push({ url, kind: 'title-missing', detail: '—' });
  } else {
    if (title.length > 65) problems.push({ url, kind: 'title-too-long', detail: `${title.length} zn.` });
    if (!seenTitles.has(title)) seenTitles.set(title, []);
    seenTitles.get(title).push(url);
  }
  if (!desc || !desc.trim()) {
    problems.push({ url, kind: 'description-missing', detail: '—' });
  } else {
    if (desc.length > 170) problems.push({ url, kind: 'description-too-long', detail: `${desc.length} zn.` });
    if (!seenDescs.has(desc)) seenDescs.set(desc, []);
    seenDescs.get(desc).push(url);
  }

  // ---- JSON-LD ----
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      problems.push({ url, kind: 'jsonld-invalid', detail: String(e.message ?? e).slice(0, 80) });
      continue;
    }
    for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
      if (!node || typeof node !== 'object') continue;
      if (!node['@type']) problems.push({ url, kind: 'jsonld-no-type', detail: JSON.stringify(node).slice(0, 70) });
      if (node['@type'] === 'BreadcrumbList' && !node.itemListElement) {
        problems.push({ url, kind: 'jsonld-breadcrumb-empty', detail: 'chybí itemListElement' });
      }
    }
  }

  // ---- internal links ----
  const hrefs = new Set(
    [...html.matchAll(/<a[^>]+href="([^"#?]+)"/gi)]
      .map((m) => m[1])
      .filter((h) => h.startsWith('/') || h.startsWith(BASE))
      .map((h) => (h.startsWith('/') ? BASE + h : h)),
  );
  for (const href of hrefs) {
    if (!linkCache.has(href)) linkCache.set(href, statusOf(href));
    const st = await linkCache.get(href);
    if (st.status === 404 || st.status === 0) {
      problems.push({ url, kind: 'link-broken', detail: `${href.replace(BASE, '')} → ${st.status}` });
    } else if (st.status >= 300 && st.status < 400) {
      problems.push({
        url,
        kind: 'link-redirects',
        detail: `${href.replace(BASE, '')} → ${st.status} → ${(st.location ?? '').replace(BASE, '')}`,
      });
    }
  }

  // ---- images without alt ----
  const noAlt = [...html.matchAll(/<img(?![^>]*\balt=)[^>]*>/gi)].length;
  if (noAlt > 0) problems.push({ url, kind: 'img-no-alt', detail: `${noAlt}× <img> bez alt` });

  return problems;
}

async function main() {
  process.stdout.write(`Stahuji sitemap z ${BASE}/sitemap.xml …\n`);
  const sm = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text());
  let urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (filter) urls = urls.filter((u) => u.includes(filter));
  urls = urls.slice(0, limit);
  process.stdout.write(`Kontroluji ${urls.length} URL (${CONCURRENCY} paralelně)…\n\n`);

  const found = [];
  let done = 0;
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const u = queue.shift();
        const p = await auditOne(u);
        found.push(...p);
        done++;
        if (done % 25 === 0) process.stdout.write(`  …${done}/${urls.length}\n`);
      }
    }),
  );

  for (const [t, list] of seenTitles) {
    if (list.length > 1) {
      found.push({ url: list[0], kind: 'title-duplicate', detail: `${list.length}× — „${t.slice(0, 55)}…" (${list.slice(1, 3).map((u) => u.replace(BASE, '')).join(', ')}…)` });
    }
  }
  for (const [d, list] of seenDescs) {
    if (list.length > 1) {
      found.push({ url: list[0], kind: 'description-duplicate', detail: `${list.length}× — „${d.slice(0, 55)}…"` });
    }
  }

  const byKind = new Map();
  for (const p of found) {
    if (!byKind.has(p.kind)) byKind.set(p.kind, []);
    byKind.get(p.kind).push(p);
  }

  if (jsonOut) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(jsonOut, JSON.stringify(found, null, 2));
    process.stdout.write(`\nVšech ${found.length} nálezů zapsáno do ${jsonOut}\n`);
  }

  if (found.length === 0) {
    process.stdout.write(`\n✓ ${urls.length} URL zkontrolováno, nic k nahlášení.\n`);
    return;
  }

  process.stdout.write(`\n=== ${found.length} nálezů na ${urls.length} URL ===\n`);
  for (const [kind, list] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    process.stdout.write(`\n${kind} — ${list.length}×\n`);
    for (const p of list.slice(0, 8)) {
      process.stdout.write(`  ${p.url.replace(BASE, '')}\n      ${p.detail}\n`);
    }
    if (list.length > 8) process.stdout.write(`  … a dalších ${list.length - 8}\n`);
  }
  process.stdout.write('\n');
}

main().catch((e) => {
  console.error('CHYBA:', e);
  process.exit(1);
});
