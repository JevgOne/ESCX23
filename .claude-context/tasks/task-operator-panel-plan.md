# Operátorský panel — Rychlé vkládání rezervací během hovoru

## Status: PLAN (čeká na schválení)

---

## 1. Problém

Stávající `NewBookingForm` (v `app/booking/calendar/new/`) je 4-krokový modal:
1. Hledej klienta → 2. Vyber dívku → 3. Vyber čas → 4. Souhrn + potvrdit

To je pro operátorku **příliš mnoho kroků během telefonátu**. Klient zavolá, řekne "chci Katy v pátek odpoledne" — operátorka musí stihnout 4 kliknutí + hledání klienta + čekání na načtení.

---

## 2. Řešení: Jednoobrazovkový formulář

**Jedna stránka, všechno viditelné najednou.** Žádné kroky, žádný modal. Klient říká → operátorka kliká.

### Nová stránka: `app/booking/quick/page.tsx`

**URL:** `/booking/quick`

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  RYCHLA REZERVACE                                [Kalendar] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DIVKA                          KLIENT                      │
│  [Katy] [Sara] [Vanessa]        [_________] [Hledat]        │
│  [Mia] [Bella] [Luna] ...       Petr (KLIENT0042) Staly    │
│                                 nebo: [Vytvorit noveho]     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SMENY — Katy                                               │
│                                                             │
│  [14.9 NEDELE  —]   [15.9 PONDELI  10:00-18:00]            │
│  [16.9 UTERY   —]   [17.9 STREDA  14:00-22:00] ← selected │
│  [18.9 CTVRTEK —]   [19.9 PATEK   10:00-18:00]             │
│  [20.9 SOBOTA  12:00-20:00]                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CAS — 17.9 STREDA (14:00-22:00)         PROGRAM           │
│                                           [60 min] selected │
│  [14:00] [14:30] [15:00] [15:30]          [30] [45] [90]   │
│  [16:00] [16:30] [17:00] [17:30]          [120]             │
│  [18:00] [18:30] [19:00] [19:30]                            │
│  [20:00] [20:30] [21:00]                  Poznamka:         │
│                                           [____________]    │
│           ↑ selected: 17:00                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ POTVRDIT: Katy · 17.9 St · 17:00-18:00 · 60min · Petr │
│  [===================== VYTVORIT ========================]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Klíčové UX principy

1. **Všechno na jedné obrazovce** — žádné kroky, žádné modaly
2. **Dívka první** — operátorka klikne na jméno, směny se objeví okamžitě
3. **Datum ve formátu "14.9 SOBOTA"** — velké, jasné, české dny v týdnu VELKÝMI PÍSMENY
4. **Nepracující dny šedé s "—"** — okamžitě viditelné, nelze kliknout
5. **Časy jako velké tlačítka** — klik na čas, klik na program, klik VYTVORIT → hotovo
6. **Klient nepovinný zpočátku** — operátorka může nejdřív kliknout dívku/čas a klienta dohledat později (před potvrzením)
7. **Shrnutí vždy dole** — živý preview co se vytvoří
8. **3 kliky minimum:** Dívka → Den/Čas → VYTVORIT (klient + program mají defaults)

---

## 3. Technické detaily

### 3.1 Nová stránka: `app/booking/quick/page.tsx`

**Server Component** — načte seznam dívek a aktuální týden rozvrh.

```typescript
// Server-side data:
// 1. Všechny aktivní dívky (id, name, photoUrl)
// 2. Rozvrh pro aktuální týden (dnes + 6 dní) pro VŠECHNY dívky najednou
//    → Map<girlId, Array<{ date, dayName, shiftStart, shiftEnd }>>
// 3. Pricing plans (pro zobrazení cen u programů)

// Předá data do client componentu:
<QuickBookingPanel 
  girls={girls} 
  weekSchedules={weekSchedules}
  pricingPlans={plans}
  today={today}
/>
```

### 3.2 Nový component: `components/booking/QuickBookingPanel.tsx`

**'use client'** — interaktivní panel.

**State:**
```typescript
const [selectedGirlId, setSelectedGirlId] = useState<number | null>(null);
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [selectedTime, setSelectedTime] = useState<string | null>(null);
const [duration, setDuration] = useState(60);  // default 60 min
const [clientQuery, setClientQuery] = useState('');
const [client, setClient] = useState<ClientSearchResult | null>(null);
const [notes, setNotes] = useState('');
const [channel, setChannel] = useState<Channel>('phone');  // default telefon
```

**Flow přes state changes:**
1. Klik na dívku → `setSelectedGirlId` → směny se zobrazí z `weekSchedules[girlId]`
2. Klik na den → `setSelectedDate` → volné časy se načtou (server action `getAvailableSlots`)
3. Klik na čas → `setSelectedTime`
4. Klik VYTVORIT → `createBooking` server action

### 3.3 Server-side query pro směny

**Nová funkce v `lib/booking-actions.ts`:**

```typescript
export async function getWeekSchedulesForAll(): Promise<
  Map<number, Array<{
    date: string;       // "2026-09-14"
    dayOfWeek: number;
    dayName: string;    // "NEDELE"
    dateLabel: string;  // "14.9 NEDELE"
    shiftStart: string | null;  // "10:00" nebo null = nepracuje
    shiftEnd: string | null;
  }>>
>
```

**SQL:** Pro každou aktivní dívku, pro každý den aktuálního týdne (dnes + 6 dní):
- JOIN girl_schedules ON day_of_week
- LEFT JOIN schedule_exceptions ON date
- Výsledek: 7 dní × N dívek

**ALTERNATIVA (efektivnější):** Načíst na serveru a předat jako props. Stránka se načte jednou, data pro celý týden jsou v HTML.

### 3.4 Formát datumu

```typescript
const CZECH_DAYS = ['NEDELE', 'PONDELI', 'UTERY', 'STREDA', 'CTVRTEK', 'PATEK', 'SOBOTA'];

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T12:00:00');
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${day}.${month} ${CZECH_DAYS[d.getDay()]}`;
}
// Výsledek: "14.9 SOBOTA"
```

### 3.5 Existující kód k znovupoužití

| Co | Odkud | Jak |
|----|-------|-----|
| `searchClient()` | `lib/booking-actions.ts` | Beze změny — hledá klienta |
| `createClient()` | `lib/booking-actions.ts` | Beze změny — vytvoří nového klienta |
| `getAvailableSlots()` | `lib/booking-actions.ts` | Beze změny — vrací volné časy |
| `createBooking()` | `lib/booking-actions.ts` | Beze změny — vytvoří booking |
| CSS proměnné | Existující dark theme | Stejný design system |
| Auth | `requireBooking()` | Stejný guard (admin + operator) |

**NOVÝ kód:**
- `app/booking/quick/page.tsx` — server component (~50 řádků)
- `components/booking/QuickBookingPanel.tsx` — client component (~300 řádků)
- `getWeekSchedulesForAll()` v `lib/booking-actions.ts` (~60 řádků)

---

## 4. Routing & Navigace

- **Přidat odkaz** do booking layoutu/navigace: "Rychla rezervace" → `/booking/quick`
- **Operátorka po přihlášení** (`app/booking/page.tsx` line 139): redirect na `/booking/quick` místo `/booking/calendar`
  - Nebo lépe: ponechat calendar jako default, ale přidat výrazný "RYCHLA REZERVACE" button

---

## 5. Edge Cases

| Situace | Řešení |
|---------|--------|
| Klient nezadán a klik VYTVORIT | Button disabled dokud není klient vybraný/vytvořený |
| Dívka nepracuje žádný den tento týden | Všechny dny šedé s "—", nelze kliknout |
| Slot obsazen mezi výběrem a potvrzením | createBooking vrátí conflict error → červený box |
| Klient je nový (< 3 návštěvy) → max 60 min | Filtrovat dostupné programy (30/45/60 only) |
| Operátorka změní dívku po výběru data | Reset selectedDate, selectedTime |
| Operátorka změní délku programu po výběru času | Reload slotů pro novou délku |

---

## 6. Implementační pořadí

1. **`getWeekSchedulesForAll()`** v `lib/booking-actions.ts` — nová server action
2. **`app/booking/quick/page.tsx`** — server component, načte data
3. **`components/booking/QuickBookingPanel.tsx`** — hlavní client component
4. **Navigace** — přidat link na `/booking/quick` do booking layoutu

---

## 7. Odhad

- **2 nové soubory** + 1 nová funkce v existujícím souboru
- ~400 řádků nového kódu
- **0 DB migrací** — používá existující tabulky a actions
- Existující `NewBookingForm` zůstává beze změny (pro detailnější flow)
