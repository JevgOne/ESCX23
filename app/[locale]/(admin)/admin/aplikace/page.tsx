import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { getApplications, getApplicationCounts, type ApplicationRow } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Status = 'pending' | 'approved' | 'rejected';

const TAB_LABELS: Record<Status | 'all', string> = {
  all: 'Vše',
  pending: 'Čekající',
  approved: 'Schválené',
  rejected: 'Zamítnuté',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string; label: string }> = {
    pending:  { bg: 'rgba(245,158,11,0.18)',  fg: '#f59e0b', label: 'Čekající' },
    approved: { bg: 'rgba(34,197,94,0.18)',   fg: '#22c55e', label: 'Schváleno' },
    rejected: { bg: 'rgba(239,68,68,0.18)',   fg: '#ef4444', label: 'Zamítnuto' },
  };
  const c = colors[status] ?? { bg: 'rgba(255,255,255,0.08)', fg: '#aaa', label: status };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      background: c.bg,
      color: c.fg,
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>{c.label}</span>
  );
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminAplikacePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const statusFilter: Status | undefined =
    sp.status === 'pending' || sp.status === 'approved' || sp.status === 'rejected'
      ? sp.status
      : undefined;

  const [apps, counts] = await Promise.all([
    getApplications(statusFilter),
    getApplicationCounts(),
  ]);

  const tabs: Array<{ key: 'all' | Status; count: number }> = [
    { key: 'all', count: counts.pending + counts.approved + counts.rejected },
    { key: 'pending', count: counts.pending },
    { key: 'approved', count: counts.approved },
    { key: 'rejected', count: counts.rejected },
  ];
  const activeKey: 'all' | Status = statusFilter ?? 'all';

  return (
    <>
      <AdminTopbar title="Aplikace" />

      <style dangerouslySetInnerHTML={{ __html: `
        .apl-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .apl-tab {
          padding: 8px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s;
        }
        .apl-tab:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .apl-tab.active {
          background: linear-gradient(135deg, var(--color-magenta) 0%, #5c1c2e 100%);
          border-color: transparent;
          color: #fff;
        }
        .apl-tab-count {
          background: rgba(0,0,0,0.25);
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }
        .apl-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 10px;
          overflow: hidden;
        }
        .apl-table thead th {
          text-align: left;
          padding: 12px 14px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--color-line);
        }
        .apl-table tbody tr { transition: background 0.12s; }
        .apl-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .apl-table tbody td {
          padding: 14px;
          font-size: 13px;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-line);
        }
        .apl-table tbody tr:last-child td { border-bottom: none; }
        .apl-name { font-weight: 600; }
        .apl-meta { font-size: 11px; color: var(--color-text-dim); font-family: monospace; }
        .apl-row-link { color: var(--color-coral); text-decoration: none; font-size: 12px; font-weight: 500; }
        .apl-row-link:hover { text-decoration: underline; }
        .apl-empty { padding: 60px 24px; text-align: center; color: var(--color-text-muted); }
      `}} />

      <div className="apl-tabs">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={t.key === 'all' ? '/cs/admin/aplikace' : `/cs/admin/aplikace?status=${t.key}`}
            className={`apl-tab${t.key === activeKey ? ' active' : ''}`}
          >
            {TAB_LABELS[t.key]}
            <span className="apl-tab-count">{t.count}</span>
          </a>
        ))}
      </div>

      {apps.length === 0 ? (
        <div className="apl-empty">
          {statusFilter
            ? `Žádné aplikace ve stavu „${TAB_LABELS[statusFilter]}".`
            : 'Zatím žádné aplikace.'}
        </div>
      ) : (
        <table className="apl-table">
          <thead>
            <tr>
              <th>Jméno</th>
              <th>Kontakt</th>
              <th>Údaje</th>
              <th>Status</th>
              <th>Přijato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <ApplicationListRow key={a.id} app={a} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function ApplicationListRow({ app }: { app: ApplicationRow }) {
  const measures = [
    app.height ? `${app.height} cm` : null,
    app.weight ? `${app.weight} kg` : null,
    app.bust ? `prsa ${app.bust}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <tr>
      <td>
        <div className="apl-name">{app.name}</div>
        <div className="apl-meta">#{app.id} · {app.age} let</div>
      </td>
      <td>
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{app.phone}</div>
        {app.email && <div className="apl-meta">{app.email}</div>}
      </td>
      <td>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{measures || '—'}</div>
      </td>
      <td><StatusBadge status={app.status} /></td>
      <td>
        <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
          {app.created_at ? relativeTime(app.created_at) : '—'}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <a href={`/cs/admin/aplikace/${app.id}`} className="apl-row-link">Detail →</a>
      </td>
    </tr>
  );
}
