import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';

export default async function AdminDenEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; date: string }>;
}) {
  const { locale, id, date } = await params;
  setRequestLocale(locale);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  const girlId = Number(girl.id);
  const girlName = String(girl.name);

  const [year, mon, day] = date.split('-');
  const dateLabel = `${Number(day)}. ${Number(mon)}. ${year}`;

  return (
    <>
      <AdminTopbar title={`${girlName} — ${dateLabel}`} />

      <div className="schedule-page">
        <div className="schedule-back-row">
          <a
            href={`/${locale}/admin/divky/${girlId}/dostupnost`}
            className="schedule-back-link"
          >
            ← Zpět na dostupnost
          </a>
        </div>

        <div className="phase2-placeholder">
          <div className="phase2-icon">📅</div>
          <h2 className="phase2-title">Override editor pro {dateLabel}</h2>
          <p className="phase2-sub">
            Editace konkrétního dne — Phase 2. Bude implementováno brzy.
          </p>
          <p className="phase2-hint">
            Zde bude formulář pro nastavení statusu (Online / Na domluvě / Volno),
            hodin a pobočky pro tento konkrétní den.
          </p>
        </div>
      </div>
    </>
  );
}
