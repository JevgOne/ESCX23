import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { requireAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Routes a manager can access. Anything else under /admin/ is admin-only.
const MANAGER_ALLOWED_PATHS = [
  '/admin',
  '/admin/divky',
  '/admin/schedules',
  '/admin/recenze',
  '/admin/rezervace',
  '/admin/stories',
];

function isManagerAllowed(pathname: string): boolean {
  // Strip locale prefix if present (e.g. /cs/admin/divky → /admin/divky)
  const stripped = pathname.replace(/^\/(cs|en|de|uk)/, '');
  return MANAGER_ALLOWED_PATHS.some((p) => stripped === p || stripped.startsWith(p + '/'));
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';
  const isLogin = pathname.endsWith('/admin/login');

  let user: AuthUser | null = null;
  if (!isLogin) {
    user = await requireAdmin();
    if (user?.role === 'manager' && !isManagerAllowed(pathname)) {
      redirect(`/${locale}/admin`);
    }
  }

  if (isLogin) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: '.topbar, header.header, footer.footer { display: none !important; }' }} />
        {children}
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: '.topbar, header.header, footer.footer { display: none !important; }' }} />
      <input type="checkbox" id="admin-sidebar-toggle" className="admin-sidebar-toggle-input" />
      <div className="admin-shell">
        <label htmlFor="admin-sidebar-toggle" className="admin-sidebar-overlay" aria-hidden="true" />
        <AdminSidebar />
        <div className="admin-main">{children}</div>
      </div>
    </>
  );
}
