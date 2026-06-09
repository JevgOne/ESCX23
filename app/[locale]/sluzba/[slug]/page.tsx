import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getServiceBySlug, getRelatedServices, getGirlsForService } from '@/lib/queries';
import { Link } from '@/i18n/navigation';
import GirlCardGrid from '@/components/girl/GirlCardGrid';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

function localizedField(row: Record<string, unknown>, base: string, locale: string): string {
  return (row[`${base}_${locale}`] as string | null | undefined)
    ?? (row[`${base}_en`] as string | null | undefined)
    ?? (row[base] as string | null | undefined)
    ?? '';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const svc = await getServiceBySlug(slug);
  if (!svc) return {};
  const row = svc as unknown as Record<string, unknown>;
  const title = localizedField(row, 'seo_title', locale) || localizedField(row, 'name', locale);
  const description = localizedField(row, 'seo_description', locale) || localizedField(row, 'description', locale);
  return applyDBOverride(`/${locale}/sluzba/${slug}`, { title, description });

}

export default async function ServicePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const svc = await getServiceBySlug(slug);
  if (!svc) notFound();

  const row = svc as unknown as Record<string, unknown>;
  const name = localizedField(row, 'name', locale);
  const description = localizedField(row, 'description', locale);
  const content = localizedField(row, 'content', locale);
  const related = await getRelatedServices(slug, svc.category, 6);

  const allGirls = await getGirlsForService(slug);

  const labelByCat: Record<string, Record<string, string>> = {
    basic: { cs: 'V ceně', en: 'Included', de: 'Inklusive', uk: 'У ціні' },
    oral: { cs: 'Domluva', en: 'On request', de: 'Anfrage', uk: 'Домовленість' },
    special: { cs: 'Domluva', en: 'On request', de: 'Anfrage', uk: 'Домовленість' },
    massage: { cs: 'Příplatek', en: 'Extra', de: 'Aufpreis', uk: 'Доплата' },
    extras: { cs: 'Příplatek', en: 'Extra', de: 'Aufpreis', uk: 'Доплата' },
    types: { cs: 'Příplatek', en: 'Extra', de: 'Aufpreis', uk: 'Доплата' },
  };
  const badge = labelByCat[svc.category]?.[locale as 'cs' | 'en' | 'de' | 'uk'] ?? '';

  const iconByCat: Record<string, string> = {
    basic: '♥', oral: '✦', special: '✺', massage: '❋', extras: '◆', types: '✧',
  };
  const icon = iconByCat[svc.category] ?? '◆';

  const backLabel =
    locale === 'cs' ? 'Zpět na dívky'
    : locale === 'de' ? 'Zurück zu Mädchen'
    : locale === 'uk' ? 'Назад'
    : 'Back';

  const girlsLabel =
    locale === 'cs' ? 'Společnice nabízející tuto službu'
    : locale === 'de' ? 'Begleiterinnen mit diesem Service'
    : locale === 'uk' ? 'Супутниці з цією послугою'
    : 'Companions offering this service';

  const companionsWord =
    locale === 'cs' ? 'dívek'
    : locale === 'de' ? 'Begleiterinnen'
    : locale === 'uk' ? 'дівчат'
    : 'companions';

  const relatedLabel =
    locale === 'cs' ? 'Podobné služby'
    : locale === 'de' ? 'Ähnliche Leistungen'
    : locale === 'uk' ? 'Подібні послуги'
    : 'Related services';

  const servicesLabel = locale === 'cs' ? 'Služby' : locale === 'de' ? 'Leistungen' : locale === 'uk' ? 'Послуги' : 'Services';

  return (
    <main className="service-page">
      <Breadcrumbs
        items={[
          { label: servicesLabel, href: `/${locale}/cenik` },
          { label: name },
        ]}
        locale={locale}
      />
      <section className="service-hero">
        <div className="container">
          <Link href="/divky" className="service-back">← {backLabel}</Link>
          <div className="service-hero-card">
            <div className="service-hero-icon">{icon}</div>
            <div className="service-hero-body">
              <span className={`service-hero-badge service-hero-badge-${svc.category}`}>{badge}</span>
              <h1 className="service-hero-h1">{name}</h1>
              {description && <p className="service-hero-desc">{description}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="service-girls section">
        <div className="container">
          <div className="section-head">
            <div className="section-eyebrow">— {girlsLabel}</div>
            <h2 className="section-h2">{allGirls.length} {companionsWord}</h2>
          </div>
          <GirlCardGrid girls={allGirls} />
        </div>
      </section>

      {content && (
        <section className="service-content section">
          <div className="container container-narrow">
            <article
              className="service-prose"
              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }}
            />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="service-related section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-h2">{relatedLabel}</h2>
            </div>
            <div className="service-related-row">
              {related.map((r) => {
                const relRow = r as unknown as Record<string, unknown>;
                return (
                  <Link
                    key={r.id}
                    href={{ pathname: '/sluzba/[slug]' as any, params: { slug: String(r.slug) } }}
                    className="service-related-chip"
                  >
                    {iconByCat[r.category] ?? '◆'} {localizedField(relRow, 'name', locale)}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
