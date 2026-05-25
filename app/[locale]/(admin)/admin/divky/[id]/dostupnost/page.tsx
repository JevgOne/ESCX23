import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGirlById } from '@/lib/queries';
import { pragueDateISO } from '@/lib/utils';
import AdminTopbar from '@/components/admin/AdminTopbar';
import TodayPanel from '@/components/admin/schedule/TodayPanel';
import WeeklyScheduleForm from '@/components/admin/schedule/WeeklyScheduleForm';
import CalendarOverride from '@/components/admin/schedule/CalendarOverride';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminGirlDostupnostPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale, id } = await params;
  const { month: monthParam } = await searchParams;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  const girlId = Number(girl.id);
  const girlName = String(girl.name);

  const today = pragueDateISO();
  const currentMonth = monthParam?.match(/^\d{4}-\d{2}$/)
    ? monthParam
    : today.substring(0, 7);

  return (
    <>
      <AdminTopbar title={`${girlName} — Dostupnost`} />

      <div className="schedule-page">
        <div className="schedule-back-row">
          <a href={`/${locale}/admin/divky/${girlId}`} className="schedule-back-link">
            ← Zpět na profil {girlName}
          </a>
        </div>

        <TodayPanel girlId={girlId} locale={locale} />

        <WeeklyScheduleForm girlId={girlId} />

        <CalendarOverride girlId={girlId} locale={locale} month={currentMonth} />
      </div>
    </>
  );
}
