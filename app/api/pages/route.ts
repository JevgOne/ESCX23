import { NextResponse } from 'next/server';
import { getAllPages } from '@/lib/pages';
import { HASHTAGS } from '@/lib/hashtags';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const isAuth = await requireAdmin().catch(() => null);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const locales = ['cs', 'en', 'de', 'uk'];
    const allPages = [];

    // 1. Static pages from getAllPages()
    const staticPages = getAllPages();
    allPages.push(...staticPages);

    // 2. Girl profile pages from DB
    const girlsResult = await db.execute(
      `SELECT slug, name FROM girls WHERE status IN ('active','inactive') ORDER BY name`
    );
    for (const girl of girlsResult.rows) {
      for (const locale of locales) {
        allPages.push({
          path: `/${locale}/profil/${girl.slug}`,
          type: 'girl',
          name: `${girl.name} (${locale.toUpperCase()})`,
        });
      }
    }

    // 3. Service pages from DB
    const servicesResult = await db.execute(
      `SELECT slug, name_cs FROM services ORDER BY name_cs`
    );
    for (const svc of servicesResult.rows) {
      for (const locale of locales) {
        allPages.push({
          path: `/${locale}/sluzba/${svc.slug}`,
          type: 'service',
          name: `${svc.name_cs} (${locale.toUpperCase()})`,
        });
      }
    }

    // 4. Location pages from DB
    const locationsResult = await db.execute(
      `SELECT name, display_name FROM locations WHERE is_active = 1 ORDER BY name`
    );
    for (const loc of locationsResult.rows) {
      for (const locale of locales) {
        allPages.push({
          path: `/${locale}/pobocka/${loc.name}`,
          type: 'location',
          name: `${loc.display_name} (${locale.toUpperCase()})`,
        });
      }
    }

    // 5. Blog post pages from DB
    const blogResult = await db.execute(
      `SELECT slug, title_cs FROM blog_posts WHERE status = 'published' ORDER BY slug`
    );
    for (const post of blogResult.rows) {
      for (const locale of locales) {
        allPages.push({
          path: `/${locale}/blog/${post.slug}`,
          type: 'blog',
          name: `${post.title_cs} (${locale.toUpperCase()})`,
        });
      }
    }

    // 6. Hashtag pages
    for (const hashtag of HASHTAGS) {
      for (const locale of locales) {
        allPages.push({
          path: `/${locale}/hashtag/${hashtag.id}`,
          type: 'hashtag',
          name: `Hashtag - ${hashtag.translations[locale as keyof typeof hashtag.translations]} (${locale.toUpperCase()})`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      pages: allPages,
      count: allPages.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching all pages:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
