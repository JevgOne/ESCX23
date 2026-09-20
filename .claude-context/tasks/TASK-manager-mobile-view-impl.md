# IMPL: Manager Mobile Booking View

**Datum:** 2026-09-20
**Status:** Hotovo

## Provedené změny

### 1. `app/booking/dashboard/page.tsx`
- Přidán nový SQL dotaz do `Promise.all` — tahá VŠECHNY dnešní bookings s JOIN na locations
- Nová sekce "Dnešní přehled" přidána NAD KPI karty
- Chronologický seznam: ČAS | STATUS DOT | SLEČNA | KLIENT | LOKACE
- Aktuální/probíhající rezervace zvýrazněná (modrý border+background)
- Minulé rezervace ztlumené (opacity 0.5)
- Každý řádek klikatelný → detail v kalendáři
- Mobile-first CSS: velký čas (17px), tabular-nums, kompaktní řádky

### 2. `app/booking/layout.tsx`
- Přidán "Dnes" jako PRVNÍ položka v bottom nav (ikona 📊)
- Směřuje na `/booking/dashboard`

## Vizuální pravidla
- Zelená tečka = potvrzeno, žlutá = čeká, modrá = probíhá, teal = dokončeno
- Lokace zobrazena jako malý badge vpravo (margin-left: auto)
- Na mobilu (<768px) větší čas a jména pro snadné čtení
