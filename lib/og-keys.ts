/** Page keys for OG images that can be customized in admin. */
export const OG_PAGE_KEYS = [
  { key: 'home', label: 'Homepage' },
  { key: 'divky', label: 'Dívky (listing)' },
  { key: 'cenik', label: 'Ceník' },
  { key: 'rozvrh', label: 'Rozvrh' },
  { key: 'slevy', label: 'Slevy' },
  { key: 'faq', label: 'FAQ' },
  { key: 'blog', label: 'Blog' },
  { key: 'o-nas', label: 'O nás' },
  { key: 'kontakt', label: 'Kontakt' },
  { key: 'pobocka', label: 'Pobočka (default)' },
  { key: 'profil', label: 'Profil dívky (default fallback)' },
  { key: 'default', label: 'Default OG (fallback)' },
] as const;

export type OgPageKey = typeof OG_PAGE_KEYS[number]['key'];
