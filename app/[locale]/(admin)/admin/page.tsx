import { setRequestLocale } from 'next-intl/server';
import { getAdminDashboardStats } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';
import StatCard from '@/components/admin/StatCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const stats = await getAdminDashboardStats();

  return (
    <>
      <AdminTopbar title="Dashboard" />

      <div className="stat-cards-grid">
        <StatCard
          icon="👩"
          title="Aktivní dívky"
          value={stats.activeGirls}
          subtitle={stats.newGirls > 0 ? `+${stats.newGirls} nové za 30 dní` : undefined}
          tone="default"
        />
        <StatCard
          icon="⭐"
          title="Pending recenze"
          value={stats.pendingReviews}
          subtitle={`Celkem ${stats.totalReviews} recenzí`}
          tone={stats.pendingReviews > 0 ? 'warn' : 'good'}
        />
        <StatCard
          icon="📋"
          title="Member applications"
          value={stats.pendingApplications}
          subtitle="Čekají na schválení"
          tone={stats.pendingApplications > 0 ? 'warn' : 'default'}
        />
        <StatCard
          icon="👥"
          title="Celkem dívek"
          value={stats.totalGirls}
          subtitle="Všechny statusy"
        />
        <StatCard
          icon="📷"
          title="Celkem fotek"
          value={stats.totalPhotos}
          subtitle="Ve všech galeriích"
        />
        <StatCard
          icon="💬"
          title="Celkem recenzí"
          value={stats.totalReviews}
          subtitle="Schválené i pending"
          tone="good"
        />
      </div>

      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-muted)' }}>
        Rychlé akce
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <a href={`/${locale}/admin/verifikace`} className="admin-quick-card">
          <div className="admin-quick-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Schvalování fotek</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Verifikace nových fotografií</div>
          </div>
        </a>
        <a href={`/${locale}/admin/recenze`} className="admin-quick-card">
          <div className="admin-quick-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              Pending recenze
              {stats.pendingReviews > 0 && (
                <span className="admin-badge-warn">{stats.pendingReviews}</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Schválit nebo zamítnout</div>
          </div>
        </a>
        <a href={`/${locale}/admin/clenove`} className="admin-quick-card">
          <div className="admin-quick-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              Member applications
              {stats.pendingApplications > 0 && (
                <span className="admin-badge-warn">{stats.pendingApplications}</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Žádosti o členství</div>
          </div>
        </a>
      </div>
    </>
  );
}
