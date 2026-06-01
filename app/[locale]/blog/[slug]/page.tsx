import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/queries';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const BRAND: Record<string, string> = {
  cs: 'LovelyGirls Praha',
  en: 'LovelyGirls Prague',
  de: 'LovelyGirls Prag',
  uk: 'LovelyGirls Прага',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getBlogPostBySlug(slug, locale);
  if (!post) return {};
  const brand = BRAND[locale] ?? BRAND.en;
  const canonical = locale === 'en'
    ? `${BASE}/blog/${slug}`
    : `${BASE}/${locale}/blog/${slug}`;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  const publishDate = post.publishedAt ?? post.createdAt;
  const ogImages = post.coverUrl
    ? [{ url: post.coverUrl, width: 1200, height: 630, alt: post.title }]
    : [{ url: `${BASE}/api/og/blog/${slug}`, width: 1200, height: 630, alt: post.title }];

  return {
    title: `${post.title} — ${brand}`,
    description,
    keywords: post.tags.map((t) => t.name).join(', ') || undefined,
    authors: [{ name: post.author }],
    alternates: {
      canonical,
      languages: {
        cs: `${BASE}/cs/blog/${slug}`,
        en: `${BASE}/blog/${slug}`,
        'x-default': `${BASE}/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: canonical,
      siteName: brand,
      locale: locale === 'cs' ? 'cs_CZ' : locale === 'de' ? 'de_DE' : locale === 'uk' ? 'uk_UA' : 'en_US',
      publishedTime: publishDate,
      modifiedTime: publishDate,
      authors: [post.author],
      section: post.tags[0]?.name ?? 'Blog',
      tags: post.tags.map((t) => t.name),
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large' as const,
      'max-video-preview': -1,
    },
  };
}

/** Extract h2 headings from HTML content for auto-generated TOC. */
function extractHeadings(html: string): { id: string; text: string }[] {
  const headings: { id: string; text: string }[] = [];
  const regex = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({ id: match[1], text: match[2].replace(/<[^>]+>/g, '') });
  }
  const regexNoId = /<h2[^>]*>(.*?)<\/h2>/gi;
  let matchNoId;
  while ((matchNoId = regexNoId.exec(html)) !== null) {
    const text = matchNoId[1].replace(/<[^>]+>/g, '');
    const hasId = headings.some((h) => h.text === text);
    if (!hasId) {
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      headings.push({ id, text });
    }
  }
  return headings;
}

/** Inject id attributes into h2 tags that don't have them. */
function injectHeadingIds(html: string): string {
  return html.replace(/<h2(?![^>]*id=)([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, text) => {
    const plainText = text.replace(/<[^>]+>/g, '');
    const id = plainText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `<h2${attrs} id="${id}">${text}</h2>`;
  });
}

/** Extract FAQ items from content — looks for h3 questions followed by p answers. */
function extractFaqFromContent(html: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const regex = /<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const question = match[1].replace(/<[^>]+>/g, '').trim();
    const answer = match[2].replace(/<[^>]+>/g, '').trim();
    if (question.includes('?') && answer.length > 10) {
      faqs.push({ question, answer });
    }
  }
  return faqs;
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const post = await getBlogPostBySlug(slug, locale);
  if (!post) notFound();

  const related = await getRelatedBlogPosts(post.id, locale, 3);
  const brand = BRAND[locale] ?? BRAND.en;

  const processedContent = post.content ? injectHeadingIds(post.content) : '';
  const headings = processedContent ? extractHeadings(processedContent) : [];
  const faqs = processedContent ? extractFaqFromContent(processedContent) : [];

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return iso.slice(0, 10);
    }
  }

  const publishDate = post.publishedAt ?? post.createdAt;
  const canonicalUrl = locale === 'en'
    ? `${BASE}/blog/${slug}`
    : `${BASE}/${locale}/blog/${slug}`;

  const wordCount = processedContent
    ? processedContent.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
    : 0;

  const LANG_MAP: Record<string, string> = { cs: 'cs-CZ', en: 'en-US', de: 'de-DE', uk: 'uk-UA' };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonicalUrl}#article`,
    headline: post.title,
    alternativeHeadline: post.excerpt ?? undefined,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    author: { '@type': 'Organization', name: post.author, url: BASE },
    datePublished: publishDate,
    dateModified: publishDate,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    publisher: {
      '@type': 'Organization',
      name: brand,
      url: BASE,
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
    },
    inLanguage: LANG_MAP[locale] ?? 'en-US',
    isAccessibleForFree: true,
    wordCount,
    timeRequired: `PT${post.readingTime}M`,
    ...(post.coverUrl ? {
      image: {
        '@type': 'ImageObject',
        url: post.coverUrl,
        width: 1200,
        height: 630,
      },
      thumbnailUrl: post.coverUrl,
    } : {}),
    ...(post.tags.length > 0 ? {
      keywords: post.tags.map((t) => t.name).join(', '),
      articleSection: post.tags[0].name,
      about: post.tags.map((t) => ({ '@type': 'Thing', name: t.name })),
    } : {}),
    ...(headings.length > 0 ? {
      hasPart: headings.map((h) => ({
        '@type': 'WebPageElement',
        name: h.text,
        url: `${canonicalUrl}#${h.id}`,
      })),
    } : {}),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.blog-detail-h1', '.blog-detail-content p:first-of-type'],
    },
    potentialAction: {
      '@type': 'ReadAction',
      target: canonicalUrl,
    },
  };

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: brand,
        item: BASE,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: locale === 'en' ? `${BASE}/blog` : `${BASE}/${locale}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };

  // WebPage schema with speakable + related links
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    inLanguage: LANG_MAP[locale] ?? 'en-US',
    isPartOf: { '@type': 'WebSite', name: brand, url: BASE },
    breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
    primaryImageOfPage: post.coverUrl ? { '@type': 'ImageObject', url: post.coverUrl } : undefined,
    ...(related.length > 0 ? {
      relatedLink: related.map((p) =>
        locale === 'en' ? `${BASE}/blog/${p.slug}` : `${BASE}/${locale}/blog/${p.slug}`
      ),
    } : {}),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Breadcrumbs
        items={[
          { label: t('h1'), href: `/${locale}/blog` },
          { label: post.title },
        ]}
        locale={locale}
      />
      {/* Full-width cinematic hero */}
      <div className="blog-detail-hero">
        {post.coverUrl && <img src={post.coverUrl} alt="" className="blog-detail-hero-bg" />}
        <div className="blog-detail-hero-overlay" />
        <div className="blog-detail-hero-inner">
          {post.tags.length > 0 && (
            <div className="blog-detail-tags">
              {post.tags.map((tag) => (
                <span key={tag.slug} className="blog-tag blog-tag-hero">{tag.name}</span>
              ))}
            </div>
          )}
          <h1 className="blog-detail-h1">{post.title}</h1>
          <div className="blog-detail-meta">
            <span className="blog-detail-meta-item">{post.readingTime} min {locale === 'cs' ? 'čtení' : 'read'}</span>
            <span className="blog-detail-meta-dot" />
            <span className="blog-detail-meta-item">{formatDate(publishDate)}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <article className="blog-detail">
          {post.coverUrl && (
            <div className="blog-detail-cover">
              <img src={post.coverUrl} alt={post.title} />
            </div>
          )}

          {/* TOC */}
          {headings.length >= 3 && (
            <nav className="blog-toc" aria-label="Table of contents">
              <div className="blog-toc-title">{locale === 'cs' ? 'Obsah článku' : 'Table of contents'}</div>
              <ol>
                {headings.map((h) => (
                  <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ol>
            </nav>
          )}

          {/* Content */}
          {processedContent && (
            <div
              className="blog-detail-content"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          )}

          {/* Back link */}
          <Link href="/blog" className="blog-back-link">
            ← {locale === 'cs' ? 'Zpět na blog' : 'Back to blog'}
          </Link>

          {/* Related */}
          {related.length > 0 && (
            <div className="blog-related">
              <div className="blog-related-h2">{t('related')}</div>
              <div className="blog-grid" style={{ paddingTop: 0, paddingBottom: 0 }}>
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={{ pathname: '/blog/[slug]', params: { slug: p.slug } }}
                    className="blog-card"
                  >
                    {p.coverUrl && (
                      <div className="blog-card-cover">
                        <img src={p.coverUrl} alt={p.title} loading="lazy" />
                      </div>
                    )}
                    <div className="blog-card-body">
                      <div className="blog-card-title">{p.title}</div>
                      {p.excerpt && <div className="blog-card-excerpt">{p.excerpt}</div>}
                      <div className="blog-card-footer">
                        <div className="blog-card-meta">
                          <span>{p.readingTime} min</span>
                        </div>
                        <div className="blog-read-more">{t('read_more')} →</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
