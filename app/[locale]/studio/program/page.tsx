import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById, getActivePricingPlans } from '@/lib/queries';
import { updatePreferredProgram } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;
  const [girl, plans] = await Promise.all([
    getGirlById(girlId),
    getActivePricingPlans(),
  ]);

  const currentProgramId = girl?.preferred_program_id != null ? Number(girl.preferred_program_id) : null;

  type PlanRow = { id: unknown; duration: unknown; price: unknown; title_cs: unknown };
  const planTyped = plans as unknown as PlanRow[];

  return (
    <>
      <StudioTopbar title="Doporučený program" />

      <div className="studio-content">
        {sp.saved === '1' && (
          <div className="studio-alert studio-alert-ok">Doporučený program uložen!</div>
        )}

        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20, maxWidth: 520 }}>
          Vyber program, který doporučuješ klientům. Zobrazí se jako &quot;Doporučuje&quot; na tvém profilu.
        </p>

        <form action={updatePreferredProgram}>
          <div className="studio-program-list">
            <label className={`studio-program-option${currentProgramId === null ? ' selected' : ''}`}>
              <input type="radio" name="program_id" value="" defaultChecked={currentProgramId === null} />
              <div className="studio-program-info">
                <span className="studio-program-name">Žádný</span>
                <span className="studio-program-sub">Nezobrazovat doporučení</span>
              </div>
            </label>
            {planTyped.map((plan) => {
              const id = Number(plan.id);
              const duration = Number(plan.duration);
              const price = Number(plan.price);
              const title = String(plan.title_cs ?? `${duration} min`);
              return (
                <label key={id} className={`studio-program-option${currentProgramId === id ? ' selected' : ''}`}>
                  <input type="radio" name="program_id" value={id} defaultChecked={currentProgramId === id} />
                  <div className="studio-program-info">
                    <span className="studio-program-name">{title}</span>
                    <span className="studio-program-sub">{duration} min — {price.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                </label>
              );
            })}
          </div>
          <button type="submit" className="btn btn-pink" style={{ marginTop: 20 }}>
            Uložit
          </button>
        </form>
      </div>
    </>
  );
}
