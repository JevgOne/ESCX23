interface Props {
  locale?: string;
}

interface Extra { name: string; desc: string | null; price: string }

const T: Record<string, Extra[]> = {
  cs: [
    { name: 'OB', desc: 'oral bez ochrany', price: '+ 500 Kč' },
    { name: 'CIM', desc: 'completion in mouth', price: '+ 1 000 Kč' },
    { name: 'Anální', desc: null, price: '+ 2 000 Kč' },
    { name: '2 dívky', desc: 'v jednom programu', price: '2× cena' },
    { name: 'GFE režim', desc: 'polibky, něha, čas', price: '+ 500 Kč' },
    { name: 'Lesbická show', desc: null, price: 'na dotaz' },
    { name: 'Dominace / submise', desc: null, price: 'na dotaz' },
  ],
  en: [
    { name: 'OWO', desc: 'oral without condom', price: '+ 500 CZK' },
    { name: 'CIM', desc: 'completion in mouth', price: '+ 1 000 CZK' },
    { name: 'Anal', desc: null, price: '+ 2 000 CZK' },
    { name: 'Duo', desc: 'two companions in one program', price: '2× price' },
    { name: 'GFE mode', desc: 'kissing, tenderness, time', price: '+ 500 CZK' },
    { name: 'Lesbian show', desc: null, price: 'on request' },
    { name: 'Domination / submission', desc: null, price: 'on request' },
  ],
  de: [
    { name: 'OWO', desc: 'Oralverkehr ohne Kondom', price: '+ 500 CZK' },
    { name: 'CIM', desc: 'Beendigung im Mund', price: '+ 1 000 CZK' },
    { name: 'Anal', desc: null, price: '+ 2 000 CZK' },
    { name: 'Duo', desc: 'zwei Begleiterinnen im Programm', price: '2× Preis' },
    { name: 'GFE-Modus', desc: 'Küsse, Zärtlichkeit, Zeit', price: '+ 500 CZK' },
    { name: 'Lesbenshow', desc: null, price: 'auf Anfrage' },
    { name: 'Dominanz / Unterwerfung', desc: null, price: 'auf Anfrage' },
  ],
  uk: [
    { name: 'OWO', desc: 'оральний без захисту', price: '+ 500 CZK' },
    { name: 'CIM', desc: 'фінал у рот', price: '+ 1 000 CZK' },
    { name: 'Анальний', desc: null, price: '+ 2 000 CZK' },
    { name: 'Дует', desc: 'дві супутниці в одній програмі', price: '2× ціна' },
    { name: 'Режим GFE', desc: 'поцілунки, ніжність, час', price: '+ 500 CZK' },
    { name: 'Лесбі-шоу', desc: null, price: 'за запитом' },
    { name: 'Домінація / підкорення', desc: null, price: 'за запитом' },
  ],
};

export default function ExtrasGrid({ locale = 'cs' }: Props) {
  const list = T[locale] ?? T.en;
  return (
    <div className="extras-table">
      {list.map((e) => (
        <div key={e.name} className="extras-row">
          <div className="extras-row-name">
            {e.name}
            {e.desc && <small> {e.desc}</small>}
          </div>
          <div className="extras-row-price">{e.price}</div>
        </div>
      ))}
    </div>
  );
}
