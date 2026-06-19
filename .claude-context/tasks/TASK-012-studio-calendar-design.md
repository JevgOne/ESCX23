# TASK-012: Vizuální upgrade Studio kalendáře

**Datum:** 2026-06-01
**Status:** Plán hotov — čeká na implementaci

---

## Cíl

Vylepšit design stránky `/studio/kalendar` tak, aby vizuálně zapadala do celkového dark premium designu webu LovelyGirls. Žádné API změny, žádná nová funkcionalita — čistě vizuální upgrade.

---

## Soubory k úpravě

| Soubor | Co se mění |
|--------|-----------|
| `app/globals.css` (řádky 7520–7679, sekce `STUDIO CALENDAR`) | Kompletní přepis cal-* tříd |
| `app/[locale]/studio/kalendar/page.tsx` | Drobné úpravy markup pro lepší vizuální strukturu |

---

## Analýza současného stavu

### Co funguje dobře
- 14-denní grid s 7 sloupcovým layoutem (desktop) a responsive breakpointy (3col / 2col)
- Data flow: schedule → exceptions → bookings → render (server-side, vše OK)
- Google Calendar embed je funkční
- Booking badges (pending/confirmed/done) mají dobré barevné kódování

### Co potřebuje zlepšit

1. **Header sekce** — příliš jednoduchý, chybí vizuální hierarchie
2. **Day cards** — strohé, chybí depth, málo contrastní vůči pozadí
3. **Today card** — highlight je subtilní, potřebuje výraznější akcentaci
4. **Shift time** — je zlatá (gold), měla by být výraznější se subtilním pozadím
5. **Off days** — jen opacity 0.5, měly by být vizuálně odlišnější (crosshatch/pattern nebo dimmed bg)
6. **Bookings** — příliš ploché, chybí vizuální separace a ikony
7. **Google Calendar sekce** — embed wrapper je příliš prostý, chybí polish
8. **Chybí legenda** — cal-legend třídy existují v globals.css (řádky 5349–5366), ale page.tsx je nepoužívá

---

## Implementační plán

### Krok 1: Upgrade `.cal-header` sekce

**globals.css — nahradit řádky 7522–7538:**

```css
/* Header */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-line);
}
.cal-header-name {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--color-text);
}
.cal-header-range {
  font-size: 13px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  background: var(--color-bg-elev);
  padding: 4px 12px;
  border-radius: var(--pill-radius);
  border: 1px solid var(--color-line);
}
```

**Proč:** Header dostane `font-display` (Playfair Display — konzistentní s dashboard greeting), date range bude v pill badge (konzistentní s design language webu).

---

### Krok 2: Přidat legendu pod header

**page.tsx — přidat mezi `cal-header` a `cal-grid` div:**

```tsx
<div className="cal-legend">
  <span className="cal-legend-item cal-legend-available">Pracuji</span>
  <span className="cal-legend-item cal-legend-off">Volno</span>
  <span className="cal-legend-item cal-legend-default">Dnes</span>
</div>
```

**globals.css — přidat novou třídu:**

```css
.cal-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
```

**Poznámka:** cal-legend-item, cal-legend-available, cal-legend-off, cal-legend-default již existují v globals.css (řádky 5349–5366). Dnes/today bude používat coral barvu.

Upravit existující legend třídy — přidat today variantu:
```css
.cal-legend-today::before { background: rgba(242,125,141,0.15); border: 1px solid var(--color-coral); }
```

---

### Krok 3: Vylepšit day grid a day cards

**globals.css — nahradit `.cal-grid` a `.cal-day` (řádky 7541–7570):**

```css
/* Day grid — 7 columns desktop */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}
@media (max-width: 900px) {
  .cal-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 540px) {
  .cal-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Day card */
.cal-day {
  background: var(--color-bg-card);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  position: relative;
}
.cal-day:hover {
  border-color: rgba(255,255,255,0.12);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  transform: translateY(-1px);
}

/* Today highlight — strong coral accent */
.cal-day-today {
  border-color: var(--color-coral);
  background: linear-gradient(135deg, rgba(242,125,141,0.10), rgba(200,75,139,0.06));
  box-shadow: 0 0 20px rgba(242,125,141,0.08);
}
.cal-day-today::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-coral), var(--color-magenta));
  border-radius: 12px 12px 0 0;
}

/* Off day — dimmed with subtle pattern */
.cal-day-off {
  opacity: 0.55;
  background: repeating-linear-gradient(
    -45deg,
    var(--color-bg-card),
    var(--color-bg-card) 4px,
    rgba(255,255,255,0.015) 4px,
    rgba(255,255,255,0.015) 8px
  );
}
```

**Proč:**
- Karty dostanou hover efekt (shadow + lift) — konzistentní s discount-card, studio-stat-card
- Today karta dostane top gradient bar (coral→magenta) — silný vizuální indikátor
- Off day dostane subtle diagonal stripe pattern — lepší než jen opacity

---

### Krok 4: Vylepšit day head

**globals.css — nahradit `.cal-day-head` až `.cal-day-num` (řádky 7573–7590):**

```css
/* Day head */
.cal-day-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cal-day-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}
.cal-day-today .cal-day-name {
  color: var(--color-coral);
  font-weight: 800;
}
.cal-day-num {
  font-size: 11px;
  color: var(--color-text-dim);
  font-variant-numeric: tabular-nums;
  background: var(--color-bg-elev);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.cal-day-today .cal-day-num {
  background: var(--color-coral);
  color: #fff;
  font-weight: 700;
}
```

**Proč:** Day number dostane circular badge — standardní kalendářový pattern. Dnes má coral filled circle (silný indicator).

**page.tsx — změnit day num rendering:**

Současný markup:
```tsx
<span className="cal-day-num">{day.dayNum}.{day.monthNum}.</span>
```

Nový markup (jen číslo dne bez měsíce — měsíc je v headeru range, day name stačí):
```tsx
<span className="cal-day-num">{day.dayNum}</span>
```

---

### Krok 5: Vylepšit off label a shift block

**globals.css — nahradit `.cal-day-off-label` a `.cal-day-shift` (řádky 7593–7615):**

```css
/* Off label */
.cal-day-off-label {
  font-size: 12px;
  color: var(--color-text-dim);
  font-style: italic;
  margin-top: auto;
  text-align: center;
  padding: 4px 0;
}

/* Shift time block */
.cal-day-shift {
  margin-top: auto;
  background: rgba(212, 175, 55, 0.06);
  border-radius: 8px;
  padding: 6px 8px;
}
.cal-shift-time {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-gold);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
.cal-shift-loc {
  font-size: 10px;
  color: var(--color-text-dim);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cal-shift-loc::before {
  content: '📍';
  font-size: 10px;
}
```

**Proč:** Shift block dostane subtle gold background — vizuálně oddělí čas od zbytku karty. Location pin emoji pro jasný kontext.

---

### Krok 6: Vylepšit bookings

**globals.css — nahradit `.cal-day-bookings` až `.cal-badge-done` (řádky 7618–7651):**

```css
/* Bookings inside day */
.cal-day-bookings {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.cal-booking {
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  border-left: 2px solid transparent;
}
.cal-booking-time {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.cal-booking-dur {
  font-size: 10px;
  color: var(--color-text-dim);
}
.cal-booking-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
}
.cal-badge-pending {
  background: rgba(245,158,11,0.15);
  color: #f59e0b;
}
.cal-booking.cal-badge-pending {
  border-left-color: #f59e0b;
}
.cal-badge-confirmed {
  background: rgba(34,197,94,0.15);
  color: #22c55e;
}
.cal-booking.cal-badge-confirmed {
  border-left-color: #22c55e;
}
.cal-badge-done {
  background: rgba(107,114,128,0.15);
  color: #9ca3af;
}
.cal-booking.cal-badge-done {
  border-left-color: #9ca3af;
}
```

**Proč:** Bookings dostanou color-coded left border (pending=amber, confirmed=green, done=gray) — instant visual scanning. Badge font-size zmenšena a uppercase pro profesionální look.

**page.tsx — upravit booking className tak, aby status class šel i na parent:**

Současný:
```tsx
<div key={b.id} className={`cal-booking ${st.cls}`}>
```
Toto už funguje — `st.cls` (např. `cal-badge-pending`) se přidá i na `.cal-booking`, takže left-border selector `.cal-booking.cal-badge-pending` bude matchovat. Žádná změna TSX nutná.

---

### Krok 7: Vylepšit Google Calendar embed

**globals.css — nahradit `.cal-google` sekci (řádky 7654–7679):**

```css
/* Google Calendar embed */
.cal-google {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--color-line);
}
.cal-google-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cal-google-title::before {
  content: '';
  display: inline-block;
  width: 18px;
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a99ba5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  flex-shrink: 0;
}
.cal-google-wrap {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--color-line-mid);
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.cal-google-iframe {
  width: 100%;
  height: 500px;
  border: 0;
  display: block;
}
@media (max-width: 540px) {
  .cal-google-iframe { height: 400px; }
}
```

**Proč:** 
- Sekce dostane top border pro vizuální separaci od gridu
- Title dostane inline SVG calendar icon (consistent with no-JS approach — SVG as data URI)
- Embed wrap dostane box-shadow pro depth
- Wrap border zvýšen na `line-mid` pro viditelnost

---

### Krok 8: Drobné úpravy page.tsx

**A) Přidat legendu** (viz Krok 2 výše)

**B) Zjednodušit day-num** — odebrat `.monthNum` z `cal-day-num` span (viz Krok 4)

**C) Žádné další TSX změny** — vše ostatní je čistě CSS.

---

## Pořadí implementace

1. **CSS first** — kompletní přepis sekce `/* ===== STUDIO CALENDAR ===== */` v globals.css (řádky 7520–7679)
2. **Přidat cal-legend-today** do existující legend sekce (kolem řádku 5366)
3. **TSX úpravy** — přidat legendu, zjednodušit day-num
4. **Vizuální kontrola** v browseru

---

## Kontrolní checklist

- [ ] Header: Playfair Display font, pill badge pro date range, border-bottom separator
- [ ] Legenda: zobrazena pod headerem, 3 položky (Pracuji / Volno / Dnes)
- [ ] Day cards: 12px padding, 12px radius, hover lift effect
- [ ] Today card: coral border, gradient bg, top gradient bar (coral→magenta), coral filled day number circle
- [ ] Off days: striped pattern background, dimmed opacity 0.55
- [ ] Day numbers: circular badges, coral filled circle for today
- [ ] Shift block: subtle gold background, location pin
- [ ] Bookings: color-coded left border per status
- [ ] Booking badges: uppercase, smaller font
- [ ] Google Calendar: top separator, SVG icon in title, shadow on embed wrap
- [ ] Responsive: 3-col @ 900px, 2-col @ 540px stále funguje
- [ ] No-JS: vše funguje bez JavaScriptu (žádné `'use client'` přidáno)

---

## Design tokens použité (z globals.css @theme)

| Token | Hodnota | Použití |
|-------|---------|---------|
| `--color-bg-card` | `#1c1420` | Day card background |
| `--color-bg-elev` | `#251828` | Day num circle bg, range pill bg |
| `--color-coral` | `#f27d8d` | Today accent |
| `--color-magenta` | `#9a1d51` | Today top bar gradient end |
| `--color-gold` | `#d4af37` | Shift time color, shift bg tint |
| `--color-text` | `#faf5f8` | Primary text |
| `--color-text-muted` | `#a99ba5` | Day names, section titles |
| `--color-text-dim` | `#756270` | Secondary info |
| `--color-line` | `rgba(255,255,255,0.06)` | Card borders |
| `--color-line-mid` | `rgba(255,255,255,0.10)` | Stronger borders |
| `--font-display` | `Playfair Display` | Header name |
| `--card-radius` | `14px` | Reference (using 12px for smaller cards) |
