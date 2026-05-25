const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';

export function homepageLocalBusiness(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': `${BASE}/#business`,
    name: 'LovelyGirls Prague',
    url: BASE,
    image: `${BASE}/og/default.jpg`,
    logo: `${BASE}/logo.png`,
    telephone: '+420734332131',
    priceRange: '€€€',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Prague',
      addressRegion: 'Praha 2',
      postalCode: '120 00',
      addressCountry: 'CZ',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 50.0755, longitude: 14.4378 },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '10:00',
        closes: '22:30',
      },
    ],
    sameAs: [
      'https://t.me/lovelygirlsprague',
      'https://www.instagram.com/lovelygirlsprague',
    ],
    inLanguage: locale,
    areaServed: { '@type': 'City', name: 'Prague' },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE}/#organization`,
    name: 'LovelyGirls Prague',
    url: BASE,
    logo: `${BASE}/logo.png`,
    sameAs: [
      'https://t.me/lovelygirlsprague',
      'https://wa.me/420734332131',
      'https://www.instagram.com/lovelygirlsprague',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+420734332131',
        contactType: 'reservations',
        availableLanguage: ['en', 'cs', 'de', 'uk', 'ru'],
        areaServed: 'CZ',
      },
    ],
  };
}

export function websiteJsonLd(locale = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE}/#website`,
    url: BASE,
    name: 'LovelyGirls Prague',
    inLanguage: locale,
    publisher: { '@id': `${BASE}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE}/divky?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function aggregateRatingJsonLd(avg: number, count: number) {
  if (!count || !avg) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: { '@id': `${BASE}/#business` },
    ratingValue: Number(avg).toFixed(1),
    reviewCount: count,
    bestRating: 5,
    worstRating: 1,
  };
}

export function breadcrumbListJsonLd(items: { name: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

interface GirlForSchema {
  slug: unknown;
  name: unknown;
  age?: unknown;
  height?: unknown;
  bio?: unknown;
  description_en?: unknown;
  description_cs?: unknown;
  languages?: unknown;
  nationality?: unknown;
  rating?: unknown;
  reviews_count?: unknown;
  verified?: unknown;
}

interface PhotoForSchema {
  url: unknown;
  is_primary: unknown;
}

interface ReviewForSchema {
  id: unknown;
  rating: unknown;
  content: unknown;
  author_name: unknown;
  created_at: unknown;
}

export function profilePersonJsonLd(
  g: GirlForSchema,
  photos: PhotoForSchema[],
  reviews: ReviewForSchema[]
) {
  const slug = String(g.slug ?? '');
  const name = String(g.name ?? '');
  const bio = g.description_en
    ? String(g.description_en).slice(0, 200)
    : g.bio
      ? String(g.bio).slice(0, 200)
      : undefined;
  const primaryImages = photos
    .filter((p) => p.is_primary)
    .map((p) => String(p.url));
  const height = g.height ? `${Number(g.height)} cm` : undefined;
  const verifiedAt = g.verified ? String(g.verified) : undefined;
  const ratingValue = g.rating != null ? Number(g.rating) : null;
  const reviewCount = g.reviews_count != null ? Number(g.reviews_count) : 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${BASE}/profil/${slug}#person`,
    name,
    url: `${BASE}/profil/${slug}`,
    image: primaryImages.length ? primaryImages : undefined,
    description: bio,
    height,
    knowsLanguage: g.languages ?? undefined,
    nationality: g.nationality ?? undefined,
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Adult companion',
      occupationLocation: { '@type': 'City', name: 'Prague' },
      qualifications: verifiedAt ? `Verified in person on ${verifiedAt}` : 'Verified in person',
    },
    worksFor: { '@id': `${BASE}/#business` },
    aggregateRating:
      reviewCount > 0 && ratingValue != null
        ? {
            '@type': 'AggregateRating',
            ratingValue: ratingValue.toFixed(1),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}

export function faqPageJsonLd(
  items: { q: string; a: string; updated?: string }[],
  locale = 'en'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    dateModified: new Date().toISOString().slice(0, 10),
    mainEntity: items.map(({ q, a, updated }) => ({
      '@type': 'Question',
      name: q,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
        dateCreated: updated ?? new Date().toISOString().slice(0, 10),
        upvoteCount: 0,
        author: { '@type': 'Organization', name: 'LovelyGirls Prague' },
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function offerListJsonLd(
  programs: { title_cs: unknown; price: unknown; duration: unknown; is_popular: unknown }[],
  locale = 'cs'
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'LovelyGirls Praha — Ceník programů',
    inLanguage: locale,
    url: `${BASE}/cenik`,
    itemListElement: programs.map((p, i) => ({
      '@type': 'Offer',
      position: i + 1,
      name: String(p.title_cs ?? `Program ${p.duration} min`),
      description: `${p.duration} minutový program`,
      price: Number(p.price),
      priceCurrency: 'CZK',
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${BASE}/#business` },
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: Number(p.price),
        priceCurrency: 'CZK',
        minPrice: Number(p.price),
      },
    })),
  };
}

export function discountOffersJsonLd(
  discounts: { name_cs?: unknown; name_en?: unknown; description?: unknown; amount_value?: unknown; amount_type?: unknown }[]
): Record<string, unknown>[] {
  return discounts.map((d) => ({
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: String(d.name_cs ?? d.name_en ?? 'Sleva'),
    description: d.description ? String(d.description) : undefined,
    seller: { '@id': `${BASE}/#business` },
    priceSpecification: d.amount_value != null
      ? {
          '@type': 'PriceSpecification',
          price: Number(d.amount_value),
          priceCurrency: d.amount_type === 'PERCENT' ? undefined : 'CZK',
          description: d.amount_type === 'PERCENT' ? `${d.amount_value}% sleva` : `${d.amount_value} Kč sleva`,
        }
      : undefined,
  }));
}

export function collectionPageJsonLd(
  name: string,
  url: string,
  slugs: string[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    hasPart: slugs.map((slug) => ({
      '@type': 'WebPage',
      url: `${BASE}/profil/${slug}`,
    })),
  };
}
