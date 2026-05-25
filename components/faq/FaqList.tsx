import type { Row } from '@libsql/client';

interface FaqListProps {
  items: Row[];
  locale: string;
}

function getQuestion(row: Row, locale: string): string {
  const key = `question_${locale}` as keyof typeof row;
  return String(row[key] ?? row.question_cs ?? row.question_en ?? row.question ?? '');
}

function getAnswer(row: Row, locale: string): string {
  const key = `answer_${locale}` as keyof typeof row;
  return String(row[key] ?? row.answer_cs ?? row.answer_en ?? row.answer ?? '');
}

export default function FaqList({ items, locale }: FaqListProps) {
  const generalLabel =
    locale === 'cs' ? 'Obecné'
    : locale === 'de' ? 'Allgemein'
    : locale === 'uk' ? 'Загальне'
    : 'General';
  const grouped = new Map<string, Row[]>();
  for (const item of items) {
    const cat = String(item.category ?? generalLabel);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return (
    <div className="faq-list">
      {Array.from(grouped.entries()).map(([category, rows]) => (
        <div key={category} className="faq-group">
          {grouped.size > 1 && (
            <div className="faq-group-title">{category}</div>
          )}
          {rows.map((item) => {
            const q = getQuestion(item, locale);
            const a = getAnswer(item, locale);
            if (!q) return null;
            return (
              <details key={String(item.id)} className="faq-item">
                <summary>{q}</summary>
                <div
                  className="faq-item-body"
                  dangerouslySetInnerHTML={{ __html: a }}
                />
              </details>
            );
          })}
        </div>
      ))}
    </div>
  );
}
