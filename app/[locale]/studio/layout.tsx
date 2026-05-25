import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import StudioSidebar from '@/components/studio/StudioSidebar';
import { requireGirl } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StudioLayout({
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
  const isLogin = pathname.endsWith('/studio/login');

  if (!isLogin) {
    await requireGirl();
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
      <div className="studio-shell">
        <StudioSidebar />
        <div className="studio-main">{children}</div>
      </div>
    </>
  );
}
