import { getSEOMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';

/**
 * Merge DB SEO overrides onto inline metadata.
 * If admin has edited SEO fields in the dashboard, those values
 * override the hardcoded inline values. Otherwise inline stays.
 */
export async function applyDBOverride(
  pagePath: string,
  inlineMetadata: Metadata,
): Promise<Metadata> {
  const dbSeo = await getSEOMetadata(pagePath);
  if (!dbSeo || (!dbSeo.meta_title && !dbSeo.meta_description)) {
    return inlineMetadata;
  }

  const ogBase = (inlineMetadata.openGraph ?? {}) as Record<string, unknown>;

  return {
    ...inlineMetadata,
    ...(dbSeo.meta_title ? { title: dbSeo.meta_title } : {}),
    ...(dbSeo.meta_description ? { description: dbSeo.meta_description } : {}),
    ...(dbSeo.meta_keywords ? { keywords: dbSeo.meta_keywords } : {}),
    openGraph: {
      ...ogBase,
      ...(dbSeo.og_title
        ? { title: dbSeo.og_title }
        : dbSeo.meta_title
          ? { title: dbSeo.meta_title }
          : {}),
      ...(dbSeo.og_description
        ? { description: dbSeo.og_description }
        : dbSeo.meta_description
          ? { description: dbSeo.meta_description }
          : {}),
      ...(dbSeo.og_image ? { images: [{ url: dbSeo.og_image, width: 1200, height: 630 }] } : {}),
    },
    ...(dbSeo.canonical_url
      ? { alternates: { ...(inlineMetadata.alternates ?? {}), canonical: dbSeo.canonical_url } }
      : {}),
  };
}
