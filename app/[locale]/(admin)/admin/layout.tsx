import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { requireAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
