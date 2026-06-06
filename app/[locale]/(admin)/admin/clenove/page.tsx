import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updateApplicationStatus } from './actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Application {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

async function getApplications(status?: string): Promise<Application[]> {
  const where = status && status !== 'all' ? `WHERE status = ?` : '';
  const args = status && status !== 'all' ? [status] : [];

  const result = await db.execute({
    sql: `SELECT id, email, name, phone, reason, status, created_at
          FROM member_applications
          ${where}
          ORDER BY created_at DESC`,
    args,
  });

  return result.rows.map((r) => ({
    id: Number(r.id),
    email: String(r.email),
    name: r.name != null ? String(r.name) : null,
    phone: r.phone != null ? String(r.phone) : null,
    reason: r.reason != null ? String(r.reason) : null,
    status: String(r.status),
    created_at: String(r.created_at),
  }));
}

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--color-gold)',
  approved: 'var(--color-green)',
  rejected: 'var(--color-red)',
};

export default async function AdminClenove({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  await requireFullAdmin();

  const activeStatus = sp.status ?? 'pending';
  const applications = await getApplications(activeStatus);

  return (
    <>
      <AdminTopbar title="Členové — Žádosti" />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STATUS_TABS.map((s) => (
          <a
            key={s}
            href={s === 'all' ? '/cs/admin/clenove' : `/cs/admin/clenove?status=${s}`}
            className={`admin-filter-pill${activeStatus === s ? ' active' : ''}`}
          >
            {s === 'all' ? 'Vše' : s === 'pending' ? 'Čekající' : s === 'approved' ? 'Schválené' : 'Zamítnuté'}
          </a>
        ))}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
        {applications.length} {applications.length === 1 ? 'žádost' : applications.length < 5 ? 'žádosti' : 'žádostí'}
      </div>

      {applications.length === 0 ? (
        <div style={{ color: 'var(--color-text-dim)', padding: '40px', textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-line)' }}>
          Žádné žádosti v tomto stavu.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.map((app) => (
            <div key={app.id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{app.email}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_COLORS[app.status] ?? 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {app.status}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                    #{app.id} · {new Date(app.created_at).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
                {app.name && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Jméno: {app.name}
                  </div>
                )}
                {app.phone && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Tel: {app.phone}
                  </div>
                )}
                {app.reason && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px', fontStyle: 'italic', maxWidth: '600px' }}>
                    &ldquo;{app.reason}&rdquo;
                  </div>
                )}
              </div>

              {app.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <form action={updateApplicationStatus}>
                    <input type="hidden" name="id" value={app.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className="admin-btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Schválit
                    </button>
                  </form>
                  <form action={updateApplicationStatus}>
                    <input type="hidden" name="id" value={app.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" className="admin-btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Zamítnout
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
