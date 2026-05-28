/**
 * Site structure and page definitions
 * This file contains no database imports and can be used on both client and server
 */

export interface PageDefinition {
  path: string;
  type: string;
  name: string;
}

/**
 * Get all pages that need SEO metadata
 * Returns a list of pages from the site structure
 */
export function getAllPages(): PageDefinition[] {
  const locales = ['cs', 'en', 'de', 'uk'];
  const pages: PageDefinition[] = [];

  // Static pages for each locale
  const staticPages = [
    { slug: '', name: 'Homepage' },
    { slug: '/divky', name: 'Girls' },
    { slug: '/cenik', name: 'Pricing' },
    { slug: '/schedule', name: 'Schedule' },
    { slug: '/discounts', name: 'Discounts' },
    { slug: '/faq', name: 'FAQ' },
    { slug: '/blog', name: 'Blog' },
    { slug: '/sluzby', name: 'Services' },
    { slug: '/podminky', name: 'Terms' },
    { slug: '/soukromi', name: 'Privacy' },
  ];

  for (const locale of locales) {
    for (const page of staticPages) {
      pages.push({
        path: `/${locale}${page.slug}`,
        type: 'static',
        name: `${page.name} (${locale.toUpperCase()})`
      });
    }
  }

  return pages;
}
