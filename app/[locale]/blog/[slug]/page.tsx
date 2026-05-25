import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getBlogPostBySlug, getBlogPosts } from '@/lib/queries';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

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
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  const brand = BRAND[locale] ?? BRAND.en;
  return {
    title: `${post.title} — ${brand}`,
    description: post.excerpt ?? undefined,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = (await getBlogPosts(4, 0)).filter((p) => p.slug !== slug).slice(0, 3);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : locale, {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return iso.slice(0, 10);
    }
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    author: { '@type': 'Organization', name: post.author },
    datePublished: post.createdAt,
    publisher: {
      '@type': 'Organization',
      name: BRAND[locale] ?? BRAND.en,
      url: 'https://lovelygirls.cz',
    },
    ...(post.coverUrl ? { image: post.coverUrl } : {}),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Breadcrumbs
        items={[
          { label: t('h1'), href: `/${locale}/blog` },
          { label: post.title },
        ]}
        locale={locale}
      />
      <div className="container">
        <div className="blog-detail">
          {post.coverUrl && (
            <div className="blog-detail-cover">
              <img src={post.coverUrl} alt={post.title} />
            </div>
          )}

          <h1 className="blog-detail-h1">{post.title}</h1>
          <div className="blog-detail-meta">
            <span>{t('by')}: <strong>{post.author}</strong></span>
            <span>{t('published')}: {formatDate(post.createdAt)}</span>
          </div>

          {post.content && (
            <div
              className="blog-detail-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

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
                    <div className="blog-card-body">
                      <div className="blog-card-title">{p.title}</div>
                      {p.excerpt && <div className="blog-card-excerpt">{p.excerpt}</div>}
                      <div className="blog-read-more" style={{ marginTop: 12 }}>{t('read_more')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
