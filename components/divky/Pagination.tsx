interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  searchParams: { status?: string; q?: string; sort?: string };
  locale?: string;
}

const LABELS: Record<string, { prev: string; next: string; page: string }> = {
  cs: { prev: '← Předchozí', next: 'Další →', page: 'Strana' },
  en: { prev: '← Previous', next: 'Next →', page: 'Page' },
  de: { prev: '← Zurück', next: 'Weiter →', page: 'Seite' },
  uk: { prev: '← Назад', next: 'Далі →', page: 'Сторінка' },
};

function buildUrl(
  page: number,
  sp: { status?: string; q?: string; sort?: string }
): string {
  const params = new URLSearchParams();
  if (sp.status) params.set('status', sp.status);
  if (sp.q) params.set('q', sp.q);
  if (sp.sort) params.set('sort', sp.sort);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : '?';
}

export default function Pagination({ currentPage, hasMore, searchParams, locale = 'cs' }: PaginationProps) {
  if (currentPage === 1 && !hasMore) return null;
  const L = LABELS[locale] ?? LABELS.en;

  return (
    <div className="pagination">
      {currentPage > 1 && (
        <a href={buildUrl(currentPage - 1, searchParams)} className="pagination-link">
          {L.prev}
        </a>
      )}
      <span className="pagination-current">{L.page} {currentPage}</span>
      {hasMore && (
        <a href={buildUrl(currentPage + 1, searchParams)} className="pagination-link">
          {L.next}
        </a>
      )}
    </div>
  );
}
