#!/usr/bin/env node

/**
 * Broken link crawler for lovelygirls.cz
 * 1. Fetches sitemap.xml
 * 2. Checks all sitemap URLs for 404s
 * 3. Crawls each non-404 page for internal links
 * 4. Checks linked URLs for 404s
 * 5. Reports broken links and which pages reference them
 */

const BASE = 'https://www.lovelygirls.cz';
const SITEMAP_URL = `${BASE}/sitemap.xml`;
const CONCURRENCY = 5;
const TIMEOUT_MS = 15000;

// Track results
const sitemapUrls = [];
const checkedUrls = new Map(); // url -> status code
const brokenFromSitemap = []; // urls in sitemap that are 404
const brokenLinks = new Map(); // broken url -> Set of pages that link to it
const crawledPages = new Set();

async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'BrokenLinkCrawler/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
      },
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    return { status: 0, statusText: err.message, ok: false, text: async () => '' };
  }
}

async function checkUrl(url) {
  if (checkedUrls.has(url)) return checkedUrls.get(url);
  const res = await fetchWithTimeout(url);
  const status = res.status;
  checkedUrls.set(url, status);
  return status;
}

// Run tasks with concurrency limit
async function runPool(tasks, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function normalizeUrl(href, pageUrl) {
  try {
    if (href.startsWith('//')) href = 'https:' + href;
    const url = new URL(href, pageUrl);
    // Only internal links
    if (url.hostname !== 'www.lovelygirls.cz' && url.hostname !== 'lovelygirls.cz') return null;
    // Strip hash and trailing slash for consistency, keep query
    url.hash = '';
    let normalized = url.toString();
    // Ensure www prefix
    normalized = normalized.replace('https://lovelygirls.cz', 'https://www.lovelygirls.cz');
    return normalized;
  } catch {
    return null;
  }
}

function extractLinks(html, pageUrl) {
  const links = new Set();
  // Match href attributes
  const regex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // Skip anchors, mailto, tel, javascript
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    // Skip static assets
    if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|pdf|zip|xml|json)(\?|$)/i.test(href)) continue;
    const normalized = normalizeUrl(href, pageUrl);
    if (normalized) links.add(normalized);
  }
  return links;
}

function parseSitemap(xml) {
  const urls = [];
  const regex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

async function main() {
  console.log(`\n=== Broken Link Crawler for lovelygirls.cz ===\n`);

  // Step 1: Fetch sitemap
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  const sitemapRes = await fetchWithTimeout(SITEMAP_URL);
  if (!sitemapRes.ok) {
    console.error(`Failed to fetch sitemap: ${sitemapRes.status} ${sitemapRes.statusText}`);
    process.exit(1);
  }
  const sitemapXml = await sitemapRes.text();
  const urls = parseSitemap(sitemapXml);

  // Check if this is a sitemap index (contains other sitemaps)
  if (sitemapXml.includes('<sitemapindex')) {
    console.log(`Sitemap index found with ${urls.length} sub-sitemaps. Fetching...`);
    for (const subUrl of urls) {
      console.log(`  Fetching sub-sitemap: ${subUrl}`);
      const subRes = await fetchWithTimeout(subUrl);
      if (subRes.ok) {
        const subXml = await subRes.text();
        const subUrls = parseSitemap(subXml);
        sitemapUrls.push(...subUrls);
      } else {
        console.error(`  Failed to fetch sub-sitemap: ${subRes.status}`);
      }
    }
  } else {
    sitemapUrls.push(...urls);
  }

  // Dedupe
  const uniqueSitemapUrls = [...new Set(sitemapUrls)];
  console.log(`\nFound ${uniqueSitemapUrls.length} URLs in sitemap(s)\n`);

  // Step 2: Check all sitemap URLs
  console.log(`Checking sitemap URLs for 404s...`);
  let checked = 0;
  const sitemapTasks = uniqueSitemapUrls.map((url) => async () => {
    const status = await checkUrl(url);
    checked++;
    if (checked % 20 === 0 || checked === uniqueSitemapUrls.length) {
      process.stdout.write(`  Checked ${checked}/${uniqueSitemapUrls.length}\r`);
    }
    if (status === 404) {
      brokenFromSitemap.push(url);
    }
    return { url, status };
  });

  const sitemapResults = await runPool(sitemapTasks, CONCURRENCY);
  console.log(`\n`);

  // Step 3: Crawl non-404 pages for internal links
  const pagesToCrawl = sitemapResults.filter((r) => r.status >= 200 && r.status < 400).map((r) => r.url);
  console.log(`Crawling ${pagesToCrawl.length} pages for internal links...`);

  const allDiscoveredLinks = new Map(); // url -> Set of source pages

  let crawled = 0;
  const crawlTasks = pagesToCrawl.map((pageUrl) => async () => {
    crawledPages.add(pageUrl);
    const res = await fetchWithTimeout(pageUrl);
    crawled++;
    if (crawled % 20 === 0 || crawled === pagesToCrawl.length) {
      process.stdout.write(`  Crawled ${crawled}/${pagesToCrawl.length}\r`);
    }
    if (!res.ok) return;
    let html;
    try {
      html = await res.text();
    } catch {
      return;
    }
    const links = extractLinks(html, pageUrl);
    for (const link of links) {
      if (!allDiscoveredLinks.has(link)) {
        allDiscoveredLinks.set(link, new Set());
      }
      allDiscoveredLinks.get(link).add(pageUrl);
    }
  });

  await runPool(crawlTasks, CONCURRENCY);
  console.log(`\n`);

  // Step 4: Check discovered links that haven't been checked yet
  const uncheckedLinks = [...allDiscoveredLinks.keys()].filter((url) => !checkedUrls.has(url));
  console.log(`Found ${allDiscoveredLinks.size} unique internal links, ${uncheckedLinks.length} not yet checked`);
  console.log(`Checking unchecked links...`);

  let linkChecked = 0;
  const linkTasks = uncheckedLinks.map((url) => async () => {
    await checkUrl(url);
    linkChecked++;
    if (linkChecked % 20 === 0 || linkChecked === uncheckedLinks.length) {
      process.stdout.write(`  Checked ${linkChecked}/${uncheckedLinks.length}\r`);
    }
  });

  await runPool(linkTasks, CONCURRENCY);
  console.log(`\n`);

  // Step 5: Collect broken links with their source pages
  for (const [url, sources] of allDiscoveredLinks) {
    const status = checkedUrls.get(url);
    if (status === 404) {
      brokenLinks.set(url, sources);
    }
  }

  // === REPORT ===
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  BROKEN LINK REPORT`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`Total URLs in sitemap: ${uniqueSitemapUrls.length}`);
  console.log(`Total pages crawled: ${crawledPages.size}`);
  console.log(`Total unique internal links found: ${allDiscoveredLinks.size}`);
  console.log(`Total unique URLs checked: ${checkedUrls.size}`);
  console.log();

  // Sitemap 404s
  console.log(`--- SITEMAP 404s (URLs in sitemap that return 404) ---`);
  if (brokenFromSitemap.length === 0) {
    console.log(`  None! All sitemap URLs are valid.\n`);
  } else {
    console.log(`  Found ${brokenFromSitemap.length} broken URLs in sitemap:\n`);
    for (const url of brokenFromSitemap.sort()) {
      console.log(`  404: ${url}`);
    }
    console.log();
  }

  // Broken internal links
  console.log(`--- BROKEN INTERNAL LINKS (linked from pages, return 404) ---`);
  if (brokenLinks.size === 0) {
    console.log(`  None! All internal links are valid.\n`);
  } else {
    console.log(`  Found ${brokenLinks.size} broken internal links:\n`);
    const sortedBroken = [...brokenLinks.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [url, sources] of sortedBroken) {
      const inSitemap = uniqueSitemapUrls.includes(url) ? ' [also in sitemap]' : '';
      console.log(`  404: ${url}${inSitemap}`);
      console.log(`    Linked from:`);
      for (const src of [...sources].sort()) {
        console.log(`      - ${src}`);
      }
      console.log();
    }
  }

  // Non-404 errors
  const otherErrors = [];
  for (const [url, status] of checkedUrls) {
    if (status === 0 || (status >= 400 && status !== 404)) {
      otherErrors.push({ url, status });
    }
  }
  if (otherErrors.length > 0) {
    console.log(`--- OTHER ERRORS (non-404) ---`);
    for (const { url, status } of otherErrors.sort((a, b) => a.url.localeCompare(b.url))) {
      console.log(`  ${status}: ${url}`);
      const sources = allDiscoveredLinks.get(url);
      if (sources && sources.size > 0) {
        console.log(`    Linked from:`);
        for (const src of [...sources].sort()) {
          console.log(`      - ${src}`);
        }
      }
    }
    console.log();
  }

  console.log(`${'='.repeat(70)}`);
  console.log(`  Crawler finished.`);
  console.log(`${'='.repeat(70)}\n`);
}

main().catch((err) => {
  console.error('Crawler failed:', err);
  process.exit(1);
});
