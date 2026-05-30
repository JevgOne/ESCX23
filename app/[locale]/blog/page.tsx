import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
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
  return {
    title: `${t('h1')} — LovelyGirls Praha`,
    description: t('sub'),
    alternates: {
      canonical,
      languages: {
        cs: `${BASE}/cs/blog`,
        en: `${BASE}/blog`,
      },
    },
  };
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

  const blogListSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${t('h1')} — LovelyGirls Praha`,
    description: t('sub'),
    url: locale === 'en' ? `${BASE}/blog` : `${BASE}/${locale}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'LovelyGirls Praha',
      url: BASE,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt ?? undefined,
      url: locale === 'en' ? `${BASE}/blog/${post.slug}` : `${BASE}/${locale}/blog/${post.slug}`,
      datePublished: post.publishedAt ?? post.createdAt,
      author: { '@type': 'Organization', name: post.author },
      ...(post.coverUrl ? { image: post.coverUrl } : {}),
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
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
                <div className="blog-card-accent" />
                {post.coverUrl && (
                  <div className="blog-card-cover">
                    <img src={post.coverUrl} alt={post.title} loading="lazy" />
                  </div>
                )}
                <div className="blog-card-body">
                  <div className="blog-card-number">{String(i + 1).padStart(2, '0')}</div>
                  {post.tags.length > 0 && (
                    <div className="blog-card-tags">
                      {post.tags.map((tag) => (
                        <span key={tag.slug} className="blog-tag">{tag.name}</span>
                      ))}
                    </div>
                  )}
                  <div className="blog-card-title">{post.title}</div>
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
