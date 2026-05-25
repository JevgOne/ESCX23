import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  items: Crumb[];
  locale?: string;
}

export default function Breadcrumbs({ items, locale = 'cs' }: Props) {
  if (items.length === 0) return null;

  const homeLabel =
    locale === 'cs' ? 'Domů'
    : locale === 'de' ? 'Start'
    : locale === 'uk' ? 'Головна'
    : 'Home';

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <div className="container breadcrumbs-inner">
        <ol className="breadcrumbs-list">
          <li className="breadcrumb-item">
            <Link href={`/${locale}`} className="breadcrumb-link">{homeLabel}</Link>
          </li>
          {items.map((it, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="breadcrumb-item">
                <span className="breadcrumb-sep">/</span>
                {!isLast && it.href ? (
                  <Link href={it.href} className="breadcrumb-link">{it.label}</Link>
                ) : (
                  <span className="breadcrumb-current" aria-current={isLast ? 'page' : undefined}>{it.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
