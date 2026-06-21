import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getGirlsWithToday, getAllGirlsForAdmin } from '@/lib/queries';
import GirlCardGrid from '@/components/girl/GirlCardGrid';

interface GirlsGridSectionProps {
  locale: string;
}

export default async function GirlsGridSection({ locale }: GirlsGridSectionProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.girlsGrid' });
  const [girls, allActive] = await Promise.all([
    getGirlsWithToday(),
    getAllGirlsForAdmin(undefined, 'active').catch(() => []),
  ]);
  const shown = girls.filter((g) => !g.isPaused).slice(0, 8);
  // "Show all N companions" — use total active count, not just today's working count
  const totalCount = allActive.length || girls.length;

  return (
    <section className="section" id="girls">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">{t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>

        <GirlCardGrid girls={shown} priorityCount={4} />

        <div className="show-all-row">
          <Link href="/divky" className="show-all-btn">
            {t('show_all', { count: totalCount })} →
          </Link>
        </div>
      </div>
    </section>
  );
}
