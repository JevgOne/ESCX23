/**
 * Noun phrases that agree with a count.
 *
 * Needed because the agency numbers became dynamic (see lib/site-facts.ts):
 * a hardcoded "13 ověřených společnic" was always in the 5+ genitive form,
 * but a live count can land in any category and "2 ověřených společnic" or
 * "1 companions" is broken Czech / English.
 *
 * Czech and Ukrainian share the 1 / 2–4 / 5+ split; English and German only
 * split singular vs plural.
 */
export type CopyLocale = 'cs' | 'en' | 'de' | 'uk';

function slavicForm(n: number): 0 | 1 | 2 {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 2; // 11–14 take the genitive plural
  const mod10 = n % 10;
  if (mod10 === 1) return 0;
  if (mod10 >= 2 && mod10 <= 4) return 1;
  return 2;
}

/** "ověřená společnice" / "ověřené společnice" / "ověřených společnic" */
export function verifiedCompanions(n: number, locale: string): string {
  switch (locale as CopyLocale) {
    case 'cs':
      return ['ověřená společnice', 'ověřené společnice', 'ověřených společnic'][slavicForm(n)];
    case 'uk':
      return ['перевірена супутниця', 'перевірені супутниці', 'перевірених супутниць'][slavicForm(n)];
    case 'de':
      return n === 1 ? 'verifizierte Begleiterin' : 'verifizierte Begleiterinnen';
    default:
      return n === 1 ? 'verified companion' : 'verified companions';
  }
}
