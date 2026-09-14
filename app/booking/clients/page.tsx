/**
 * STUDIOFLOW — Client List
 * Server Component: search + trust level filtering via URL params.
 * Matches mockup 04-client-card.html (list section).
 */

import { getClientList } from '@/lib/client-queries';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}

const TRUST_BADGES: Record<string, { label: string; cls: string }> = {
  vip: { label: 'VIP', cls: 'cl-badge-vip' },
  regular: { label: 'Staly', cls: 'cl-badge-regular' },
  verified: { label: 'Overeny', cls: 'cl-badge-verified' },
  new: { label: 'Novy', cls: 'cl-badge-new' },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'Vsichni' },
  { key: 'vip', label: 'VIP' },
  { key: 'regular', label: 'Stali' },
  { key: 'new', label: 'Novi' },
  { key: 'banned', label: 'Neduveryh.' },
];

function formatDateCS(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export default async function ClientListPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.q ?? '';
  const filter = params.filter ?? 'all';
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const { clients, total } = await getClientList({
    search: search || undefined,
    filter,
    page,
    pageSize: 50,
  });

  const totalPages = Math.ceil(total / 50);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Top bar */}
      <div className="cl-topbar">
        <span className="cl-topbar-title">Klienti</span>
        <div className="cl-topbar-right">
          <span className="cl-topbar-count">{total} klientu</span>
          <a href="/booking/calendar/new" className="cl-btn-new">+ Novy klient</a>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="cl-search-bar">
        <form method="GET" action="/booking/clients" className="cl-search-form">
          <input type="hidden" name="filter" value={filter} />
          <input
            className="cl-search-input"
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Hledat podle jmena, kodu..."
          />
          <button type="submit" className="cl-search-btn">Hledat</button>
        </form>
        <div className="cl-filters">
          {FILTER_OPTIONS.map((f) => {
            const href = `/booking/clients?filter=${f.key}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
            return (
              <a
                key={f.key}
                href={href}
                className={`cl-filter-chip${filter === f.key ? ' active' : ''}`}
              >
                {f.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Client rows */}
      <div className="cl-list">
        {clients.length === 0 && (
          <div className="cl-empty">Zadni klienti nenalezeni.</div>
        )}
        {clients.map((client) => {
          const initial = client.nickname.charAt(0).toUpperCase();
          const badge = TRUST_BADGES[client.trustLevel] ?? TRUST_BADGES.new;
          const isBanned = client.isBanned;
          const highNoShows = client.noShowCount >= 3;

          return (
            <a
              key={client.id}
              href={`/booking/clients/${client.id}`}
              className="cl-row"
            >
              <div className={`cl-avatar${isBanned ? ' banned' : ''}`}>{initial}</div>
              <div className="cl-main">
                <div className="cl-name">{client.nickname}</div>
                <div className="cl-code">{client.clientNumber}</div>
              </div>
              <div className="cl-stats">
                <span>
                  <span className="cl-hl">{client.totalVisits}</span>{' '}
                  {client.totalVisits === 1 ? 'navsteva' : client.totalVisits < 5 ? 'navstevy' : 'navstev'}
                </span>
                <span className={highNoShows ? 'cl-danger' : ''}>
                  <span className={`cl-hl${highNoShows ? ' cl-danger' : ''}`}>{client.noShowCount}</span>{' '}
                  no-show{client.noShowCount !== 1 ? 's' : ''}
                  {highNoShows ? '!' : ''}
                </span>
              </div>
              {isBanned ? (
                <span className="cl-badge cl-badge-banned">Banovany</span>
              ) : (
                <span className={`cl-badge ${badge.cls}`}>{badge.label}</span>
              )}
              <div className="cl-last">
                {client.lastVisitDate ? formatDateCS(client.lastVisitDate) : '--'}
              </div>
            </a>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="cl-pagination">
          {page > 1 && (
            <a
              href={`/booking/clients?filter=${filter}${search ? `&q=${encodeURIComponent(search)}` : ''}&page=${page - 1}`}
              className="cl-page-btn"
            >
              &lt; Predchozi
            </a>
          )}
          <span className="cl-page-info">
            Strana {page} z {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/booking/clients?filter=${filter}${search ? `&q=${encodeURIComponent(search)}` : ''}&page=${page + 1}`}
              className="cl-page-btn"
            >
              Dalsi &gt;
            </a>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
const STYLES = `
.cl-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: -24px -24px 0;
  padding: 12px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
}
.cl-topbar-title { font-size: 18px; font-weight: 700; }
.cl-topbar-right { display: flex; align-items: center; gap: 10px; }
.cl-topbar-count { font-size: 13px; color: var(--muted); }
.cl-btn-new {
  padding: 8px 16px; border-radius: 8px;
  background: var(--coral); color: #fff;
  font-size: 13px; font-weight: 600;
  text-decoration: none;
}
.cl-btn-new:hover { opacity: 0.9; }

/* Search */
.cl-search-bar {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  margin: 0 -24px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--line);
}
.cl-search-form { display: flex; gap: 8px; flex: 1; min-width: 200px; }
.cl-search-input {
  flex: 1; padding: 10px 14px;
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 8px; color: var(--text); font-size: 14px;
  outline: none; font-family: inherit;
}
.cl-search-input:focus { border-color: var(--coral); }
.cl-search-btn {
  padding: 10px 16px; border-radius: 8px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
.cl-search-btn:hover { color: var(--coral); border-color: var(--coral); }

/* Filters */
.cl-filters { display: flex; gap: 6px; }
.cl-filter-chip {
  padding: 8px 14px; border-radius: 20px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); font-size: 12px; font-weight: 600;
  text-decoration: none;
}
.cl-filter-chip:hover { border-color: var(--coral); color: var(--coral); }
.cl-filter-chip.active { border-color: var(--coral); color: var(--coral); }

/* List */
.cl-list { margin: 0 -24px; }
.cl-empty {
  padding: 40px 20px; text-align: center;
  color: var(--dim); font-size: 14px;
}
.cl-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--line);
  text-decoration: none; color: inherit;
}
.cl-row:hover { background: rgba(242,125,141,0.04); }
.cl-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--bg-elev); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--coral); font-size: 14px;
  flex-shrink: 0;
}
.cl-avatar.banned { border-color: var(--red); color: var(--red); }
.cl-main { flex: 1; min-width: 0; }
.cl-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cl-code { font-size: 12px; color: var(--muted); }
.cl-stats { display: flex; gap: 16px; font-size: 12px; color: var(--dim); }
.cl-hl { color: var(--text); font-weight: 600; }
.cl-danger { color: var(--red) !important; }
.cl-badge {
  padding: 3px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  flex-shrink: 0;
}
.cl-badge-vip { background: rgba(251,191,36,0.2); color: var(--yellow); }
.cl-badge-regular { background: rgba(74,222,128,0.2); color: var(--green); }
.cl-badge-verified { background: rgba(96,165,250,0.2); color: var(--blue); }
.cl-badge-new { background: rgba(96,165,250,0.2); color: var(--blue); }
.cl-badge-banned { background: rgba(239,68,68,0.2); color: var(--red); }
.cl-last { font-size: 11px; color: var(--dim); text-align: right; min-width: 80px; flex-shrink: 0; }

/* Pagination */
.cl-pagination {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 16px 20px;
  font-size: 13px; color: var(--muted);
}
.cl-page-btn {
  padding: 6px 14px; border-radius: 6px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); text-decoration: none; font-size: 12px; font-weight: 600;
}
.cl-page-btn:hover { border-color: var(--coral); color: var(--coral); }
.cl-page-info { font-size: 12px; color: var(--dim); }
`;
