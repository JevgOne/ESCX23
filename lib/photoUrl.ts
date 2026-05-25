const PLACEHOLDER = 'https://placehold.co/600x750/1c1420/F27D8D?text=No+photo';

export function photoUrl(raw: string | null | undefined): string {
  if (!raw) return PLACEHOLDER;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${raw.startsWith('/') ? raw : `/${raw}`}`;
}
