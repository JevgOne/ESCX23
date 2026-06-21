import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'cs', 'de', 'uk'],
  defaultLocale: 'en',
  localePrefix: {
    mode: 'as-needed',
  },
  localeDetection: false,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
  },
  pathnames: {
    '/': '/',
    '/divky': {
      cs: '/divky',
      en: '/girls',
      de: '/maedchen',
      uk: '/divchata',
    },
    '/profil/[slug]': {
      cs: '/profil/[slug]',
      en: '/profile/[slug]',
      de: '/profil/[slug]',
      uk: '/profil/[slug]',
    },
    '/cenik': {
      cs: '/cenik',
      en: '/pricing',
      de: '/preise',
      uk: '/tsiny',
    },
    '/rozvrh': {
      cs: '/rozvrh',
      en: '/schedule',
      de: '/zeitplan',
      uk: '/rozklad',
    },
    '/slevy': {
      cs: '/slevy',
      en: '/discounts',
      de: '/rabatte',
      uk: '/znyzhky',
    },
    '/faq': '/faq',
    '/recenze': {
      cs: '/recenze',
      en: '/reviews',
      de: '/rezensionen',
      uk: '/vidhuky',
    },
    '/recenze/nova/[slug]': '/recenze/nova/[slug]',
    '/kontakt': {
      cs: '/kontakt',
      en: '/contact',
      de: '/kontakt',
      uk: '/kontakt',
    },
    '/o-nas': {
      cs: '/o-nas',
      en: '/about',
      de: '/ueber-uns',
      uk: '/pro-nas',
    },
    '/join': {
      cs: '/pridat-se',
      en: '/join',
      de: '/bewerben',
      uk: '/dodaty-sia',
    },
    '/join/success': {
      cs: '/pridat-se/uspech',
      en: '/join/success',
      de: '/bewerben/erfolg',
      uk: '/dodaty-sia/uspikh',
    },
    '/clenstvi/zadost': {
      cs: '/clenstvi/zadost',
      en: '/membership/apply',
      de: '/mitgliedschaft/bewerben',
      uk: '/chlenstvo/zaiavka',
    },
    '/clenstvi/zadost/odeslano': {
      cs: '/clenstvi/zadost/odeslano',
      en: '/membership/apply/sent',
      de: '/mitgliedschaft/bewerben/gesendet',
      uk: '/chlenstvo/zaiavka/nadislano',
    },
    '/sluzba/[slug]': {
      cs: '/sluzba/[slug]',
      en: '/service/[slug]',
      de: '/leistung/[slug]',
      uk: '/posluha/[slug]',
    },
    '/novinky': {
      cs: '/novinky',
      en: '/whats-new',
      de: '/neuigkeiten',
      uk: '/novynky',
    },
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/podminky': {
      cs: '/podminky',
      en: '/terms',
      de: '/agb',
      uk: '/umovy',
    },
    '/soukromi': {
      cs: '/soukromi',
      en: '/privacy',
      de: '/datenschutz',
      uk: '/konfidentsiinist',
    },
  },
});

export type Locale = (typeof routing.locales)[number];
