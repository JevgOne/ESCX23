#!/usr/bin/env node
/**
 * Hreflang Audit Script
 * Fetches live sitemap, checks all URL statuses, validates hreflang targets.
 * Usage: node scripts/audit-hreflang.mjs
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { writeFileSync } from 'fs';
import { parseArgs } from 'util';

const SITEMAP_URL = 'https://www.lovelygirls.cz/sitemap.xml';
const USER_AGENT = 'ESCX23-Audit/1.0';
const TIMEOUT_MS = 15000;
const CONCURRENCY = 5;
const RESULTS_FILE = '/Users/zen/Projects/ESCX23/audit-hreflang-results.json';

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchRaw(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.request(
      urlStr,
      {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
        // Do NOT follow redirects (we want raw 3xx)
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () =>
          resolve({ status: res.statusCode, headers: res.headers, body })
        );
      }
    );

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${TIMEOUT_MS}ms`));
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

function headRequest(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const lib = parsed.protocol === 'https:' ? https : http;

      const req = lib.request(
        urlStr,
        {
          method: 'HEAD',
          headers: { 'User-Agent': USER_AGENT },
          // No redirect following
        },
        (res) => {
          resolve({
            url: urlStr,
            status: res.statusCode,
            location: res.headers['location'] || null,
            error: null,
          });
        }
      );

      req.setTimeout(TIMEOUT_MS, () => {
        req.destroy(new Error(`Timeout after ${TIMEOUT_MS}ms`));
      });

      req.on('error', (err) => {
        resolve({ url: urlStr, status: null, location: null, error: err.message });
      });

      req.end();
    } catch (err) {
      resolve({ url: urlStr, status: null, location: null, error: err.message });
    }
  });
}

// ── Concurrency limiter ───────────────────────────────────────────────────────

async function runConcurrent(tasks, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

// ── XML parsing (native, no external deps) ───────────────────────────────────

function extractTagContent(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  const matches = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

function extractSelfClosing(xml, tag) {
  // e.g. <xhtml:link rel="alternate" hreflang="de" href="https://..."/>
  const re = new RegExp(`<${tag}[^/]*/?>`, 'g');
  const matches = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

function attrValue(tag, attr) {
  const re = new RegExp(`${attr}="([^"]*)"`, 'i');
  const m = re.exec(tag);
  return m ? m[1] : null;
}

function parseSitemap(xml) {
  // Split into <url>...</url> blocks
  const urlBlocks = [];
  const urlRe = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = urlRe.exec(xml)) !== null) {
    urlBlocks.push(m[1]);
  }

  return urlBlocks.map((block) => {
    // Extract <loc>
    const locMatch = /<loc>([\s\S]*?)<\/loc>/.exec(block);
    const loc = locMatch ? locMatch[1].trim() : null;

    // Extract all hreflang alternates
    const hreflangs = [];
    // Matches <xhtml:link ... /> or <xhtml:link ... > (self-closing or not)
    const linkRe = /<xhtml:link\b[^>]*>/g;
    let lm;
    while ((lm = linkRe.exec(block)) !== null) {
      const tag = lm[0];
      const rel = attrValue(tag, 'rel');
      if (rel !== 'alternate') continue;
      const hreflang = attrValue(tag, 'hreflang');
      const href = attrValue(tag, 'href');
      if (hreflang && href) {
        hreflangs.push({ hreflang, href });
      }
    }

    return { loc, hreflangs };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  let sitemapXml;
  try {
    const res = await fetchRaw(SITEMAP_URL);
    if (res.status !== 200) {
      console.error(`Sitemap returned HTTP ${res.status}. Aborting.`);
      process.exit(1);
    }
    sitemapXml = res.body;
  } catch (err) {
    console.error(`Failed to fetch sitemap: ${err.message}`);
    process.exit(1);
  }

  const entries = parseSitemap(sitemapXml);
  console.log(`Parsed ${entries.length} <url> entries from sitemap.`);

  // Collect all unique URLs to check
  // Map: url → { isLoc: bool, sources: [{sourceUrl, hreflang}] }
  const urlMap = new Map();

  function registerUrl(url, isLoc, sourceUrl = null, hreflang = null) {
    if (!url) return;
    if (!urlMap.has(url)) {
      urlMap.set(url, { isLoc, hreflangSources: [] });
    }
    const entry = urlMap.get(url);
    if (isLoc) entry.isLoc = true;
    if (sourceUrl && hreflang) {
      entry.hreflangSources.push({ sourceUrl, hreflang });
    }
  }

  for (const entry of entries) {
    registerUrl(entry.loc, true);
    for (const alt of entry.hreflangs) {
      registerUrl(alt.href, false, entry.loc, alt.hreflang);
    }
  }

  const allUrls = Array.from(urlMap.keys());
  console.log(`Checking ${allUrls.length} unique URLs (concurrency=${CONCURRENCY})...`);

  const tasks = allUrls.map((url) => () => headRequest(url));
  const rawResults = await runConcurrent(tasks, CONCURRENCY);

  // Build a status lookup: url → result
  const statusMap = new Map();
  for (const r of rawResults) {
    statusMap.set(r.url, r);
  }

  // ── Analysis ──

  const loc404 = [];
  const locRedirects = [];
  const locErrors = [];
  const locOk = [];
  const hreflangBroken = []; // hreflang targets that are not 200

  // Check LOC URLs
  for (const entry of entries) {
    if (!entry.loc) continue;
    const r = statusMap.get(entry.loc);
    if (!r) continue;
    if (r.error) {
      locErrors.push({ url: entry.loc, error: r.error });
    } else if (r.status >= 200 && r.status < 300) {
      locOk.push({ url: entry.loc, status: r.status });
    } else if (r.status >= 300 && r.status < 400) {
      locRedirects.push({ url: entry.loc, status: r.status, location: r.location });
    } else if (r.status >= 400) {
      loc404.push({ url: entry.loc, status: r.status });
    } else {
      locErrors.push({ url: entry.loc, error: `Unexpected status ${r.status}` });
    }
  }

  // Check hreflang target URLs
  for (const entry of entries) {
    for (const alt of entry.hreflangs) {
      const r = statusMap.get(alt.href);
      if (!r) continue;
      const isBad =
        r.error ||
        r.status === null ||
        r.status < 200 ||
        r.status >= 300;
      if (isBad) {
        hreflangBroken.push({
          hreflang: alt.hreflang,
          href: alt.href,
          status: r.status,
          location: r.location,
          error: r.error,
          sourceUrl: entry.loc,
        });
      }
    }
  }

  // ── Print Report ──

  const totalUrls = entries.length;
  const okCount = locOk.length;
  const redirectCount = locRedirects.length;
  const notFoundCount = loc404.length;
  const errorCount = locErrors.length;
  const hreflangBrokenCount = hreflangBroken.length;

  console.log('\n=== AUDIT REPORT ===');
  console.log(`Total URLs:          ${totalUrls}`);
  console.log(`OK (200):            ${okCount}`);
  console.log(`Redirect (3XX):      ${redirectCount}`);
  console.log(`Not Found (4XX):     ${notFoundCount}`);
  console.log(`Errors:              ${errorCount}`);
  console.log(`Hreflang → broken:   ${hreflangBrokenCount}`);

  if (loc404.length > 0) {
    console.log('\n--- 404 Pages ---');
    for (const item of loc404) {
      console.log(`  ${item.status} ${item.url}`);
    }
  } else {
    console.log('\n--- 404 Pages --- (none)');
  }

  if (locRedirects.length > 0) {
    console.log('\n--- Redirecting URLs in sitemap ---');
    for (const item of locRedirects) {
      console.log(`  ${item.status} ${item.url} → ${item.location || '(no Location header)'}`);
    }
  } else {
    console.log('\n--- Redirecting URLs in sitemap --- (none)');
  }

  if (locErrors.length > 0) {
    console.log('\n--- Connection Errors ---');
    for (const item of locErrors) {
      console.log(`  ERROR ${item.url}: ${item.error}`);
    }
  }

  if (hreflangBroken.length > 0) {
    console.log('\n--- Hreflang pointing to broken/redirecting URLs ---');
    for (const item of hreflangBroken) {
      const statusStr = item.error
        ? `ERR: ${item.error}`
        : item.location
        ? `${item.status} → ${item.location}`
        : `${item.status}`;
      console.log(`  [${item.hreflang}] ${item.href} (${statusStr}) — on page: ${item.sourceUrl}`);
    }
  } else {
    console.log('\n--- Hreflang pointing to broken/redirecting URLs --- (none)');
  }

  // ── Save JSON results ──

  const jsonResults = {
    auditedAt: new Date().toISOString(),
    sitemapUrl: SITEMAP_URL,
    summary: {
      totalUrls,
      ok: okCount,
      redirects: redirectCount,
      notFound: notFoundCount,
      errors: errorCount,
      hreflangBroken: hreflangBrokenCount,
    },
    details: {
      ok: locOk,
      redirects: locRedirects,
      notFound: loc404,
      errors: locErrors,
      hreflangBroken,
    },
    allCheckedUrls: rawResults,
  };

  writeFileSync(RESULTS_FILE, JSON.stringify(jsonResults, null, 2), 'utf8');
  console.log(`\nFull results saved to: ${RESULTS_FILE}`);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
