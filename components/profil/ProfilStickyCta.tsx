import { prettyDistrict } from '@/lib/utils';

interface Girl {
  name: unknown;
  age: unknown;
  phone: unknown;
  location?: unknown;
}

interface ProfilStickyCtaProps {
  girl: Girl;
  labels: {
    ctaWhatsapp: string;
    ctaTelegram: string;
    ctaCall: string;
  };
  shiftFrom?: string | null;
  shiftTo?: string | null;
  locale?: string;
}

const STICKY_LABELS: Record<string, { today: string; appt: string }> = {
  cs: { today: 'Dnes', appt: 'Dnes — domluva' },
  en: { today: 'Today', appt: 'Today — by appointment' },
  de: { today: 'Heute', appt: 'Heute — nach Absprache' },
  uk: { today: 'Сьогодні', appt: 'Сьогодні — за домовленістю' },
};

export default function ProfilStickyCta({ girl, labels, shiftFrom, shiftTo, locale = 'cs' }: ProfilStickyCtaProps) {
  const name = String(girl.name ?? '');
  const age = String(girl.age ?? '');
  const phone = girl.phone ? String(girl.phone) : null;
  const location = girl.location ? String(girl.location) : 'Praha';
  const district = prettyDistrict(location) ?? 'Praha';

  const waPhone = phone ? phone.replace(/\s+/g, '').replace(/^\+/, '') : null;
  const WA_GREETING: Record<string, (n: string) => string> = {
    cs: (n) => `Dobrý den, zajímá mě ${n}`,
    en: (n) => `Hello, I'm interested in ${n}`,
    de: (n) => `Guten Tag, ich interessiere mich für ${n}`,
    uk: (n) => `Доброго дня, мене цікавить ${n}`,
  };
  const waText = (WA_GREETING[locale] ?? WA_GREETING.en)(name);
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`
    : '#';
  const tgUrl = phone
    ? `https://t.me/${phone.replace(/\s+/g, '')}`
    : 'https://t.me/lovelygirls_prague';

  return (
    <div className="profile-sticky-bar-desktop">
      <div className="container profile-sticky-inner">
        <div className="profile-sticky-info">
          <span className="sticky-dot" />
          <strong>{name}</strong>
          <span>·</span>
          <span>{age}</span>
          <span>·</span>
          <span>{district}</span>
          <span>·</span>
          <span>{(() => {
            const L = STICKY_LABELS[locale] ?? STICKY_LABELS.en;
            return shiftFrom && shiftTo ? `${L.today} ${shiftFrom}–${shiftTo}` : L.appt;
          })()}</span>
        </div>
        <div className="profile-sticky-actions">
          <a href={waUrl} className="btn btn-whatsapp">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {labels.ctaWhatsapp}
          </a>
          <a href={tgUrl} className="btn btn-telegram">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="m9.78 18.65.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.24 3.64 11.95c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.27 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            {labels.ctaTelegram}
          </a>
          {phone && (
            <a href={`tel:${phone}`} className="btn btn-ghost">
              📞 {labels.ctaCall}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
