import { formatPrice } from '@/lib/utils';

interface PricingPlan {
  id: unknown;
  duration: unknown;
  price: unknown;
  is_popular: unknown;
  title_cs: unknown;
  title_en: unknown;
  title_de: unknown;
  title_uk: unknown;
}

interface ProfilPricingProps {
  plans: PricingPlan[];
  locale: string;
  heading: string;
}

export default function ProfilPricing({ plans, locale, heading }: ProfilPricingProps) {
  if (plans.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section-title">{heading}</div>
      <div className="profile-prices">
        {plans.map((plan) => {
          const title =
            locale === 'cs'
              ? String(plan.title_cs ?? '')
              : locale === 'de'
                ? String(plan.title_de ?? plan.title_en ?? '')
                : locale === 'uk'
                  ? String(plan.title_uk ?? plan.title_en ?? '')
                  : String(plan.title_en ?? '');
          const isPopular = Boolean(plan.is_popular);
          return (
            <div
              key={String(plan.id)}
              className={`profile-price-tile${isPopular ? ' featured' : ''}`}
            >
              <div className="profile-price-tile-time">{String(plan.duration)} min</div>
              <div className="profile-price-tile-name">{title}</div>
              <div className="profile-price-tile-cost">
                {formatPrice(Number(plan.price))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
