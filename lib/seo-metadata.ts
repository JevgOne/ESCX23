import { Metadata } from 'next';
import { db } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { getHashtagById, getHashtagName } from '@/lib/hashtags';
import { getServiceById, getServiceName } from '@/lib/services';

interface SEOData {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots_index?: boolean;
  robots_follow?: boolean;
}

/**
 * Fetch SEO metadata from database for a given page path (cached)
 */
const getCachedSEOMetadata = unstable_cache(
  async (pagePath: string): Promise<SEOData | null> => {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM seo_metadata WHERE page_path = ? LIMIT 1',
        args: [pagePath]
      });

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as SEOData;
    } catch (error) {
      console.error('Error fetching SEO metadata:', error);
      return null;
    }
  },
  ['seo-metadata'],
  { revalidate: 3600, tags: ['seo'] } // Cache for 1 hour
);

export async function getSEOMetadata(pagePath: string): Promise<SEOData | null> {
  return getCachedSEOMetadata(pagePath);
}

/**
 * Generate Next.js Metadata object from database SEO data
 * Returns noindex if no SEO data found in database
 */
export async function generatePageMetadata(pagePath: string): Promise<Metadata> {
  const seoData = await getSEOMetadata(pagePath);

  // If no SEO data in database -> use smart fallbacks based on page path
  if (!seoData || !seoData.meta_title || !seoData.meta_description) {
    // Extract locale from path
    const locale = pagePath.split('/')[1] || 'cs';
    const defaults = getDefaultSEO(locale);

    // Generate smart fallback based on page type
    let fallbackTitle = defaults.title;
    let fallbackDescription = defaults.description;
    let fallbackKeywords = defaults.keywords;

    // Check if it's a profile page
    if (pagePath.includes('/profily/')) {
      const slug = pagePath.split('/profily/')[1];
      fallbackTitle = `${slug.charAt(0).toUpperCase() + slug.slice(1)} | ${defaults.title}`;
      fallbackDescription = `Profil ${slug}. ${defaults.description}`;
    }
    // Check if it's a hashtag page
    else if (pagePath.includes('/hashtag/')) {
      const hashtagId = pagePath.split('/hashtag/')[1];
      const hashtag = getHashtagById(hashtagId);
      if (hashtag) {
        const hashtagDisplayName = getHashtagName(hashtagId, locale);
        const capitalizedName = hashtagDisplayName.replace(/\b\w/g, l => l.toUpperCase());
        const fallbacks = getHashtagFallback(locale, capitalizedName);
        fallbackTitle = fallbacks.title;
        fallbackDescription = fallbacks.description;
        fallbackKeywords = `${hashtagDisplayName}, ${fallbackKeywords}`;
      } else {
        const readableHashtag = hashtagId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        fallbackTitle = `${readableHashtag} | ${defaults.title}`;
        fallbackDescription = `Najděte ${readableHashtag.toLowerCase()} v Praze. ${defaults.description}`;
      }
    }
    // Check if it's a divky page
    else if (pagePath.endsWith('/divky')) {
      const divkyFallbacks = getDivkyFallback(locale);
      fallbackTitle = divkyFallbacks.title;
      fallbackDescription = divkyFallbacks.description;
      fallbackKeywords = divkyFallbacks.keywords;
    }
    // Check if it's a praktiky/service page
    else if (pagePath.includes('/praktiky/')) {
      const serviceId = pagePath.split('/praktiky/')[1];
      const service = getServiceById(serviceId);
      if (service) {
        const serviceDisplayName = getServiceName(serviceId, locale);
        const fallbacks = getPraktikyFallback(locale, serviceDisplayName);
        fallbackTitle = fallbacks.title;
        fallbackDescription = fallbacks.description;
        fallbackKeywords = `${serviceDisplayName}, escort praha, ${fallbackKeywords}`;
      } else {
        const readableService = serviceId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        fallbackTitle = `${readableService} | ${defaults.title}`;
        fallbackDescription = `Profesionální ${readableService.toLowerCase()} v Praze. ${defaults.description}`;
      }
    }
    // Check if it's a sluzby page
    else if (pagePath.includes('/sluzby/')) {
      const service = pagePath.split('/sluzby/')[1];
      const readableService = service.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      fallbackTitle = `${readableService} | ${defaults.title}`;
      fallbackDescription = `Profesionální ${readableService.toLowerCase()} v Praze. ${defaults.description}`;
    }

    const canonicalUrl = `https://www.lovelygirls.cz${pagePath}`;

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      keywords: fallbackKeywords,
      alternates: {
        canonical: canonicalUrl
      },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: canonicalUrl,
        siteName: 'LovelyGirls Prague',
        type: 'website',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      }
    };
  }

  // Use database SEO data
  const title = seoData.meta_title;
  const description = seoData.meta_description;
  const keywords = seoData.meta_keywords;
  const ogImage = seoData.og_image || 'https://www.lovelygirls.cz/og-image.jpg';
  const canonicalUrl = seoData.canonical_url || `https://www.lovelygirls.cz${pagePath}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: seoData.og_title || title,
      description: seoData.og_description || description,
      url: canonicalUrl,
      siteName: 'LovelyGirls Prague',
      type: (seoData.og_type as any) || 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: (seoData.twitter_card as any) || 'summary_large_image',
      title: seoData.twitter_title || title,
      description: seoData.twitter_description || description,
      images: [seoData.twitter_image || ogImage]
    },
    robots: {
      index: seoData.robots_index !== false,
      follow: seoData.robots_follow !== false,
      googleBot: {
        index: seoData.robots_index !== false,
        follow: seoData.robots_follow !== false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

/**
 * Get default SEO values by locale
 */
export function getDefaultSEO(locale: string) {
  const defaults: Record<string, { title: string; description: string; keywords: string }> = {
    cs: {
      title: 'Luxusní Escort Praha | Ověřené Dívky | LovelyGirls',
      description: 'Prémiové escort služby v Praze. Ověřené profily, diskrétní setkání, rychlá rezervace přes WhatsApp. Elegantní společnice pro náročné gentlemany.',
      keywords: 'escort praha, escort služby praha, luxusní escort, ověřené dívky, společnice praha, diskrétní escort'
    },
    en: {
      title: 'Luxury Escort Prague | Verified Girls | LovelyGirls',
      description: 'Premium escort services in Prague. Verified profiles, discreet meetings, fast booking via WhatsApp. Elegant companions for discerning gentlemen.',
      keywords: 'escort prague, escort services prague, luxury escort, verified girls, companions prague, discreet escort'
    },
    de: {
      title: 'Luxus-Escort Prag | Verifizierte Mädchen | LovelyGirls',
      description: 'Premium-Escort-Services in Prag. Verifizierte Profile, diskrete Treffen, schnelle Buchung über WhatsApp. Elegante Begleiterinnen für anspruchsvolle Gentlemen.',
      keywords: 'escort prag, escort-services prag, luxus-escort, verifizierte mädchen, begleiterinnen prag'
    },
    uk: {
      title: 'Люксовий Ескорт Прага | Перевірені Дівчата | LovelyGirls',
      description: 'Преміум ескорт послуги в Празі. Перевірені профілі, дискретні зустрічі, швидке бронювання через WhatsApp. Елегантні супутниці для вимогливих джентльменів.',
      keywords: 'ескорт прага, ескорт послуги прага, люксовий ескорт, перевірені дівчата'
    }
  };

  return defaults[locale] || defaults.cs;
}

/**
 * Locale-specific fallback titles for /divky page
 */
function getDivkyFallback(locale: string): { title: string; description: string; keywords: string } {
  const fallbacks: Record<string, { title: string; description: string; keywords: string }> = {
    cs: {
      title: 'Escort dívky Praha – ověřené společnice | LovelyGirls',
      description: 'Prohlédněte si profily ověřených escort dívek v Praze. Luxusní společnice, diskrétní služby, rychlá rezervace přes WhatsApp.',
      keywords: 'escort dívky praha, společnice praha, escort služby, ověřené profily, luxusní escort praha'
    },
    en: {
      title: 'Escort Girls Prague – Verified Companions | LovelyGirls',
      description: 'Browse verified escort girl profiles in Prague. Luxury companions, discreet services, fast booking via WhatsApp.',
      keywords: 'escort girls prague, companions prague, escort services, verified profiles, luxury escort prague'
    },
    de: {
      title: 'Escort Mädchen Prag – Verifizierte Begleiterinnen | LovelyGirls',
      description: 'Durchsuchen Sie verifizierte Escort-Profile in Prag. Luxus-Begleiterinnen, diskrete Dienste, schnelle Buchung.',
      keywords: 'escort mädchen prag, begleiterinnen prag, escort-services, verifizierte profile'
    },
    uk: {
      title: 'Ескорт дівчата Прага – перевірені супутниці | LovelyGirls',
      description: 'Переглядайте профілі перевірених ескорт дівчат у Празі. Розкішні супутниці, дискретні послуги.',
      keywords: 'ескорт дівчата прага, супутниці прага, ескорт послуги, перевірені профілі'
    }
  };
  return fallbacks[locale] || fallbacks.cs;
}

/**
 * Locale-specific fallback titles for /hashtag/[slug] pages
 */
function getHashtagFallback(locale: string, hashtagName: string): { title: string; description: string } {
  const templates: Record<string, { title: string; description: string }> = {
    cs: {
      title: `${hashtagName} – escort společnice Praha | LovelyGirls`,
      description: `${hashtagName} v Praze. Ověřené escort dívky, luxusní služby, diskrétní setkání. Rezervujte přes WhatsApp.`
    },
    en: {
      title: `${hashtagName} – Escort Companions Prague | LovelyGirls`,
      description: `${hashtagName} in Prague. Verified escort girls, luxury services, discreet meetings. Book via WhatsApp.`
    },
    de: {
      title: `${hashtagName} – Escort Begleiterinnen Prag | LovelyGirls`,
      description: `${hashtagName} in Prag. Verifizierte Escort-Mädchen, Luxus-Services, diskrete Treffen.`
    },
    uk: {
      title: `${hashtagName} – ескорт супутниці Прага | LovelyGirls`,
      description: `${hashtagName} у Празі. Перевірені ескорт дівчата, розкішні послуги, дискретні зустрічі.`
    }
  };
  return templates[locale] || templates.cs;
}

/**
 * Locale-specific fallback titles for /praktiky/[slug] pages
 */
function getPraktikyFallback(locale: string, serviceName: string): { title: string; description: string } {
  const templates: Record<string, { title: string; description: string }> = {
    cs: {
      title: `${serviceName} Praha – escort společnice | LovelyGirls`,
      description: `${serviceName} – escort dívky nabízející tuto službu v Praze. Ověřené profily, diskrétní setkání, rezervace přes WhatsApp.`
    },
    en: {
      title: `${serviceName} Prague – Escort Companions | LovelyGirls`,
      description: `${serviceName} – escort girls offering this service in Prague. Verified profiles, discreet meetings, book via WhatsApp.`
    },
    de: {
      title: `${serviceName} Prag – Escort Begleiterinnen | LovelyGirls`,
      description: `${serviceName} – Escort-Mädchen, die diesen Service in Prag anbieten. Verifizierte Profile, diskrete Treffen.`
    },
    uk: {
      title: `${serviceName} Прага – ескорт супутниці | LovelyGirls`,
      description: `${serviceName} – ескорт дівчата, які пропонують цю послугу в Празі. Перевірені профілі, дискретні зустрічі.`
    }
  };
  return templates[locale] || templates.cs;
}
