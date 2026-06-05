import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { Link } from '@/i18n/navigation';
import { getBlogPosts } from '@/lib/queries';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const canonical = locale === 'en' ? `${BASE}/blog` : `${BASE}/${locale}/blog`;
  const title = `${t('h1')} — LovelyGirls Praha`;
  const description = t('sub');
  return applyDBOverride(`/${locale}/blog`, {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        cs: `${BASE}/cs/blog`,
        en: `${BASE}/blog`,
        'x-default': `${BASE}/blog`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: 'LovelyGirls Praha',
      locale: locale === 'cs' ? 'cs_CZ' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large' as const,
      'max-video-preview': -1,
    },
  });

}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const posts = await getBlogPosts(locale, 20, 0);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return iso.slice(0, 10);
    }
  }

  const blogUrl = locale === 'en' ? `${BASE}/blog` : `${BASE}/${locale}/blog`;
  const blogListSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${blogUrl}#blog`,
    name: `${t('h1')} — LovelyGirls Praha`,
    description: t('sub'),
    url: blogUrl,
    inLanguage: locale === 'cs' ? 'cs-CZ' : 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'LovelyGirls Praha',
      url: BASE,
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt ?? undefined,
      url: locale === 'en' ? `${BASE}/blog/${post.slug}` : `${BASE}/${locale}/blog/${post.slug}`,
      datePublished: post.publishedAt ?? post.createdAt,
      author: { '@type': 'Organization', name: post.author },
      timeRequired: `PT${post.readingTime}M`,
      ...(post.coverUrl ? {
        image: { '@type': 'ImageObject', url: post.coverUrl, width: 1200, height: 630 },
      } : {}),
      ...(post.tags.length > 0 ? {
        keywords: post.tags.map((tg) => tg.name).join(', '),
        articleSection: post.tags[0].name,
      } : {}),
    })),
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': blogUrl,
    name: `${t('h1')} — LovelyGirls Praha`,
    description: t('sub'),
    url: blogUrl,
    isPartOf: { '@type': 'WebSite', name: 'LovelyGirls Praha', url: BASE },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LovelyGirls Praha', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: blogUrl },
      ],
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Breadcrumbs items={[{ label: tNav('blog') }]} locale={locale} />
      <div className="container">
        <div className="blog-hero">
          <div className="blog-hero-eyebrow">{t('eyebrow')}</div>
          <h1 className="blog-hero-h1">{t('h1')}</h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 560, margin: '0 auto' }}>{t('sub')}</p>
        </div>

        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-dim)', padding: '80px 0' }}>
            {t('empty')}
          </p>
        ) : (
          <div className="blog-grid">
            {posts.map((post, i) => (
              <Link
                key={post.id}
                href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                className="blog-card"
              >
                <div className={`blog-card-visual blog-card-visual-${(i % 5) + 1}`}>
                  {post.coverUrl ? (
                    <img src={post.coverUrl} alt={post.title} loading="lazy" className="blog-card-visual-img" />
                  ) : null}
                  <div className="blog-card-visual-overlay" />
                  <div className="blog-card-visual-content">
                    {post.tags.length > 0 && (
                      <div className="blog-card-vtags">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag.slug} className="blog-card-vtag">{tag.name}</span>
                        ))}
                      </div>
                    )}
                    <div className="blog-card-vtitle">{post.title}</div>
                  </div>
                  <div className="blog-card-vnum">{String(i + 1).padStart(2, '0')}</div>
                </div>
                <div className="blog-card-body">
                  {post.excerpt && (
                    <div className="blog-card-excerpt">{post.excerpt}</div>
                  )}
                  <div className="blog-card-footer">
                    <div className="blog-card-meta">
                      <span>{post.readingTime} min {locale === 'cs' ? 'čtení' : 'read'}</span>
                      <span className="blog-card-meta-sep">·</span>
                      <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                    </div>
                    <div className="blog-read-more">{t('read_more')} →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
