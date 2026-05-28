import { NextResponse } from 'next/server';
import { getAllPages } from '@/lib/pages';
import { HASHTAGS } from '@/lib/hashtags';

export async function GET() {
  try {
    const locales = ['cs', 'en', 'de', 'uk'];
    const allPages = [];

    // 1. Get static pages from getAllPages()
    const staticPages = getAllPages();
    allPages.push(...staticPages);

    // 2. Add JOIN pages for each locale
    for (const locale of locales) {
      allPages.push({
        path: `/${locale}/join`,
        type: 'static',
        name: `JOIN (${locale.toUpperCase()})`
      });
    }

    // 3. Add RECENZE/REVIEWS pages for each locale
    for (const locale of locales) {
      allPages.push({
        path: `/${locale}/reviews`,
        type: 'static',
        name: `Reviews (${locale.toUpperCase()})`
      });
    }

    // 4. Add hashtag pages for each hashtag and locale
    for (const hashtag of HASHTAGS) {
      for (const locale of locales) {
        allPages.push({
          path: `/${locale}/hashtag/${hashtag.id}`,
          type: 'hashtag',
          name: `Hashtag - ${hashtag.translations[locale as keyof typeof hashtag.translations]} (${locale.toUpperCase()})`
        });
      }
    }

    return NextResponse.json({
      success: true,
      pages: allPages,
      count: allPages.length
    });
  } catch (error: any) {
    console.error('Error fetching all pages:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
