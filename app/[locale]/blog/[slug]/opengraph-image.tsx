import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';
import { getBlogPostBySlug } from '@/lib/queries';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Blog';
export const size = OG_SIZE;
export const contentType = 'image/png';

const EYEBROW: Record<string, string> = {
  cs: 'Blog & průvodci',
  en: 'Blog & Guides',
};

export default async function OgImage({ params }: { params: { locale: string; slug: string } }) {
  const locale = params?.locale ?? 'en';
  const slug = params?.slug ?? '';

  const post = await getBlogPostBySlug(slug, locale).catch(() => null);
  const headline = post?.title ?? 'LovelyGirls Prague';
  const tagline = post?.excerpt ?? undefined;

  return renderOgImage({
    eyebrow: EYEBROW[locale] ?? EYEBROW.en,
    headline,
    tagline,
  });
}
