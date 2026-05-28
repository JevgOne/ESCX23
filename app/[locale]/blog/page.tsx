import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getBlogPosts } from '@/lib/queries';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  return {
    title: t('h1'),
    description: t('sub'),
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const posts = await getBlogPosts(20, 0);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : locale, {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return iso.slice(0, 10);
    }
  }

  return (
    <main>
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
            {posts.map((post) => (
              <Link
                key={post.id}
                href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                className="blog-card"
              >
                {post.coverUrl && (
                  <div className="blog-card-cover">
                    <img src={post.coverUrl} alt={post.title} loading="lazy" />
                  </div>
                )}
                <div className="blog-card-body">
                  <div className="blog-card-title">{post.title}</div>
                  {post.excerpt && (
                    <div className="blog-card-excerpt">{post.excerpt}</div>
                  )}
                  <div className="blog-card-meta">
                    <span className="blog-card-author">{post.author}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="blog-read-more" style={{ marginTop: 12 }}>{t('read_more')}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
