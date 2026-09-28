/**
 * STUDIOFLOW — Client List
 * Server Component: search + trust level filtering via URL params.
 * Matches mockup 04-client-card.html (list section).
 */

import { getClientList } from '@/lib/client-queries';
import ClientSearchAutocomplete from '@/components/booking/ClientSearchAutocomplete';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; filter?: string; sort?: string; page?: string }>;
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

const SORT_OPTIONS = [
  { key: '', label: 'Vychozi' },
  { key: 'name', label: 'Jmeno' },
  { key: 'visits', label: 'Navstevy' },
  { key: 'last_visit', label: 'Posledni' },
  { key: 'spent', label: 'Utrata' },
];

const CHANNEL_ICONS: Record<string, string> = {
  phone: 'T',
  whatsapp: 'WA',
  telegram: 'TG',
  email: '@',
};

export default async function ClientListPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.q ?? '';
  const filter = params.filter ?? 'all';
  const sort = params.sort ?? '';
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const { clients, total } = await getClientList({
    search: search || undefined,
    filter,
    sort: sort || undefined,
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
        <ClientSearchAutocomplete defaultValue={search} filter={filter} sort={sort} />
        <div className="cl-filters">
          {FILTER_OPTIONS.map((f) => {
            const href = `/booking/clients?filter=${f.key}${search ? `&q=${encodeURIComponent(search)}` : ''}${sort ? `&sort=${sort}` : ''}`;
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
        <div className="cl-sort">
          <span className="cl-sort-label">Razeni:</span>
          {SORT_OPTIONS.map((s) => {
            const href = `/booking/clients?filter=${filter}${search ? `&q=${encodeURIComponent(search)}` : ''}${s.key ? `&sort=${s.key}` : ''}`;
            return (
              <a
                key={s.key}
                href={href}
                className={`cl-sort-chip${sort === s.key ? ' active' : ''}`}
              >
                {s.label}
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
              {client.channels.length > 0 && (
                <div className="cl-channels">
                  {client.channels.map((ch) => (
                    <span key={ch} className={`cl-ch-icon cl-ch-${ch}`}>
                      {CHANNEL_ICONS[ch] ?? ch}
                    </span>
                  ))}
                </div>
              )}
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
              href={`/booking/clients?filter=${filter}${search ? `&q=${encodeURIComponent(search)}` : ''}${sort ? `&sort=${sort}` : ''}&page=${page - 1}`}
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
              href={`/booking/clients?filter=${filter}${search ? `&q=${encodeURIComponent(search)}` : ''}${sort ? `&sort=${sort}` : ''}&page=${page + 1}`}
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

/* Sort */
.cl-sort {
  display: flex; gap: 4px; align-items: center;
}
.cl-sort-label {
  font-size: 11px; color: var(--dim); margin-right: 4px; white-space: nowrap;
}
.cl-sort-chip {
  padding: 6px 10px; border-radius: 6px;
  background: var(--bg-elev); border: 1px solid transparent;
  color: var(--dim); font-size: 11px; font-weight: 600;
  text-decoration: none;
}
.cl-sort-chip:hover { color: var(--coral); }
.cl-sort-chip.active { color: var(--coral); border-color: var(--coral); }

/* Channel icons in list */
.cl-channels {
  display: flex; gap: 3px; align-items: center; flex-shrink: 0;
}
.cl-ch-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 18px; border-radius: 3px;
  font-size: 8px; font-weight: 800;
  letter-spacing: -0.02em;
}
.cl-ch-phone { background: rgba(74,222,128,0.12); color: #4ade80; }
.cl-ch-whatsapp { background: rgba(37,211,102,0.12); color: #25D366; }
.cl-ch-telegram { background: rgba(34,158,217,0.12); color: #229ED9; }
.cl-ch-email { background: rgba(96,165,250,0.12); color: #60a5fa; }

/* Autocomplete wrapper */
.cl-search-wrap { position: relative; display: flex; flex: 1; min-width: 200px; }
.cl-search-wrap .cl-search-form { display: flex; gap: 8px; flex: 1; }
.cl-search-spinner {
  position: absolute; right: 100px; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px; border: 2px solid var(--line);
  border-top-color: var(--coral); border-radius: 50%;
  animation: cl-spin 0.6s linear infinite;
}
@keyframes cl-spin { to { transform: translateY(-50%) rotate(360deg); } }

/* Autocomplete dropdown */
.cl-autocomplete-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
  margin-top: 4px;
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  max-height: 360px; overflow-y: auto;
}
.cl-ac-row {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  background: none; border: none; border-bottom: 1px solid var(--line);
  color: inherit; cursor: pointer; text-align: left; font-family: inherit;
}
.cl-ac-row:last-child { border-bottom: none; }
.cl-ac-row:hover { background: rgba(242,125,141,0.06); }
.cl-ac-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-soft); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--coral); font-size: 12px;
  flex-shrink: 0;
}
.cl-ac-avatar.banned { border-color: var(--red); color: var(--red); }
.cl-ac-info { flex: 1; min-width: 0; }
.cl-ac-name { font-weight: 600; font-size: 13px; margin-right: 6px; }
.cl-ac-code { font-size: 11px; color: var(--muted); }
.cl-ac-visits { font-size: 11px; color: var(--dim); flex-shrink: 0; }
.cl-ac-more {
  display: block; width: 100%; padding: 10px;
  background: none; border: none; border-top: 1px solid var(--line);
  color: var(--coral); font-size: 12px; font-weight: 600;
  cursor: pointer; text-align: center; font-family: inherit;
}
.cl-ac-more:hover { background: rgba(242,125,141,0.06); }
.cl-ac-empty {
  padding: 16px; text-align: center;
  color: var(--dim); font-size: 13px;
}
`;
