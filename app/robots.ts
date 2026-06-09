import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function resolveBaseUrl(host: string): string {
  // Strip any port (already won't have scheme since we're reading raw host)
  return `https://${host}`;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const hdrs = await headers();
  const host = hdrs.get('host') ?? 'www.lovelygirls.cz';
  const base = resolveBaseUrl(host);

  // Preview deploys (Vercel branch/PR URLs) — block indexing of preview content
  // Vercel preview URLs always look like *-projectname-team.vercel.app
  const isPreview =
    process.env.VERCEL_ENV === 'preview' ||
    (host.includes('vercel.app') && host !== 'www.lovelygirls.cz');

  if (isPreview) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      sitemap: `${base}/sitemap.xml`,
    };
  }

  const blockedPaths = ['/admin/', '/studio/', '/api/', '/clen/', '/clen-prihlaseni/'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...blockedPaths, '/*?*sort=', '/*?*filter='],
        crawlDelay: 1,
      },
      { userAgent: 'Seznambot', allow: '/', disallow: ['/admin/', '/studio/', '/api/'] },
      { userAgent: 'SklikBot', allow: '/' },

      // AI search/citation crawlers — ALLOW
      { userAgent: 'GPTBot', allow: '/', disallow: blockedPaths, crawlDelay: 2 },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/admin/', '/studio/', '/api/'] },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin/', '/studio/', '/api/', '/clen/'] },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Claude-User', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin/', '/studio/', '/api/'] },
      { userAgent: 'Perplexity-User', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'GoogleOther', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/', disallow: ['/admin/', '/studio/'] },

      // Training-only scrapers — BLOCK
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'Diffbot', disallow: '/' },
      { userAgent: 'cohere-ai', disallow: '/' },
      { userAgent: 'Meta-ExternalAgent', disallow: '/' },
      { userAgent: 'FacebookBot', disallow: '/' },
      { userAgent: 'Omgilibot', disallow: '/' },

      // SEO audit tools — BLOCK
      { userAgent: 'SemrushBot', disallow: '/' },
      { userAgent: 'AhrefsBot', disallow: '/' },
      { userAgent: 'MJ12bot', disallow: '/' },
      { userAgent: 'DotBot', disallow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
