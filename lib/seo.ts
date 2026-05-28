import { db } from './db';
import { Metadata } from 'next';

// Re-export types and utils for backward compatibility
export type { SEOMetadata } from './seo-types';
export { calculateSEOScore } from './seo-utils';
export { getAllPages } from './pages';

import type { SEOMetadata } from './seo-types';

/**
 * Get SEO metadata from database for a specific page
 * @param pagePath - e.g., '/cs/divky', '/en/blog/article-slug'
 * @returns SEO metadata or null if not found
 */
export async function getSEOMetadata(pagePath: string): Promise<SEOMetadata | null> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM seo_metadata WHERE page_path = ?',
      args: [pagePath]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as unknown as SEOMetadata;
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return null;
  }
}

/**
 * Convert SEO metadata from database to Next.js Metadata object
 * @param seo - SEO metadata from database
 * @param fallback - Fallback metadata if database values are empty
 * @returns Next.js Metadata object
 */
export function toNextMetadata(
  seo: SEOMetadata | null,
  fallback: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  } = {}
): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.lovelygirls.cz';

  // Use database values or fallback
  const title = seo?.meta_title || fallback.title || 'LovelyGirls Prague';
  const description = seo?.meta_description || fallback.description || 'Premium escort services in Prague';
  const keywords = seo?.meta_keywords || fallback.keywords;
  const ogImage = seo?.og_image || fallback.ogImage || '/og-image.jpg';

  // Build robots directive
  const robotsIndex = seo?.robots_index ?? 1;
  const robotsFollow = seo?.robots_follow ?? 1;
  const robots = {
    index: robotsIndex === 1,
    follow: robotsFollow === 1,
    googleBot: {
      index: robotsIndex === 1,
      follow: robotsFollow === 1,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  };

  return {
    title,
    description,
    keywords,
    robots,
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      type: (seo?.og_type as any) || 'website',
      url: seo?.canonical_url || (seo ? `${baseUrl}${seo.page_path}` : baseUrl),
      siteName: 'LovelyGirls Prague',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo?.og_title || title,
        }
      ],
    },
    twitter: {
      card: (seo?.twitter_card as any) || 'summary_large_image',
      title: seo?.twitter_title || seo?.og_title || title,
      description: seo?.twitter_description || seo?.og_description || description,
      images: [seo?.twitter_image || ogImage],
    },
    alternates: seo?.canonical_url ? {
      canonical: seo.canonical_url
    } : undefined,
  };
}

