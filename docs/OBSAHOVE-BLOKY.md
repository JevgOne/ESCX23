# Obsahové bloky

Reusable vizuální bloky vzniklé při práci na ceníku a blogu. Aktuálně jsou zapojené na
`/cenik`, ale jsou psané obecně (CSS třídy nejsou vázané na konkrétní stránku), takže je
lze zkopírovat i jinam — jiné landing page, případně budoucí obsah blogu.

Barevný přízvuk `--gradient-ember` (tmavá karmínová → korálová → jantarová), definovaný v
`:root` v `app/globals.css`, je společný podklad všech bloků níže — nemusíš ho nikam
vkládat, jen o něm vědět, pokud budeš bloky ladit dál.

---

## 1. Experience flow — pulzující časová osa zážitku

Soubor: `components/cenik/ExperienceFlow.tsx` (React komponenta, obsah je zatím napsaný
přímo v komponentě jako `Record<locale, ...>`, ne v DB). CSS: `.experience-flow*` v
`app/globals.css`.

Princip: každý krok setkání má emoji, popis a ukazatel tepu (bpm), který v průběhu
setkání stoupá a zase klesá. Krok s nejvyšším tepem se automaticky označí jako vrchol
(`experience-flow-step-peak`) — v komponentě se počítá jako `Math.max()` přes všechny
kroky, není potřeba ho nastavovat ručně.

Použití mimo `ExperienceFlow.tsx` (např. v budoucím obsahu blogu) — čisté HTML:

```html
<div class="experience-flow">
  <div class="experience-flow-step">
    <div class="experience-flow-icon">🥂</div>
    <div class="experience-flow-pulse"><span class="experience-flow-pulse-num">75</span><span class="experience-flow-pulse-unit">bpm</span></div>
    <div class="experience-flow-text">Přivítání v soukromém apartmánu — sklenka na uvolnění a chvíle na sebe.</div>
  </div>
  <div class="experience-flow-step">
    <div class="experience-flow-icon">🚿</div>
    <div class="experience-flow-pulse"><span class="experience-flow-pulse-num">90</span><span class="experience-flow-pulse-unit">bpm</span></div>
    <div class="experience-flow-text">Společná sprcha, čas na sblížení, žádný spěch.</div>
  </div>
  <div class="experience-flow-step experience-flow-step-peak">
    <div class="experience-flow-icon">🔥</div>
    <div class="experience-flow-pulse"><span class="experience-flow-pulse-num">130</span><span class="experience-flow-pulse-unit">bpm</span></div>
    <div class="experience-flow-text">Masáž a blízkost naplno, v tempu, které vám sedí.</div>
  </div>
  <div class="experience-flow-step">
    <div class="experience-flow-icon">🌙</div>
    <div class="experience-flow-pulse"><span class="experience-flow-pulse-num">80</span><span class="experience-flow-pulse-unit">bpm</span></div>
    <div class="experience-flow-text">Klidné doznění a rozloučení bez spěchu.</div>
  </div>
</div>
```

Pravidla: 3–6 kroků, přesně jeden `experience-flow-step-peak` (nejvyšší tep), formulace
kultivované, bez explicitních popisů — jde o veřejnou stránku.

Kdy použít: kdekoliv chceš čtenáři ukázat "křivku zážitku" jedním pohledem místo
souvislého odstavce (ceník, případně budoucí landing page konkrétní služby).

---

## 2. Cenové karty — `.program-card`

Soubor: `components/cenik/ProgramsGrid.tsx` + `.program-card*` v `app/globals.css`.
Na rozdíl od flow bloku tenhle blok čte reálná data z DB (`getActivePricingPlans()` →
tabulka `pricing_plans`) — není to statický HTML blok pro vkládání do obsahu, ale
komponenta. Dokumentuju ho tu, protože vzorec "zvýrazněná doporučená varianta + CZK/EUR +
denní/noční sazba + co je v ceně + CTA" je znovupoužitelný vzor pro jakoukoli budoucí
cenovou nabídku na webu.

Co obsahuje jedna karta:
- `program-card-duration` — délka programu (velké číslo + jednotka)
- `program-card-name` — název programu
- `program-card-price` + `program-card-price-eur` — cena v Kč, pod ní přibližná cena v
  EUR menším písmem (kurz je zaokrouhlený, `CZK_PER_EUR = 25` v `ProgramsGrid.tsx` — česká
  cena je vždy ta závazná, EUR je jen orientační pro platbu na místě)
- `program-card-night` — noční přirážka (od 23:00), odlišená ikonou měsíce a jinou barvou
- `program-card-incl` — co je v ceně (zelený pilulkový štítek)
- `program-card-cta` — tlačítko, které vede rovnou na WhatsApp s předvyplněnou zprávou
  obsahující název a délku programu (`https://wa.me/420734332131?text=...`)

Doporučená varianta (`is_popular = 1` v DB, aktuálně 60minutový program "Plný vibe") má
třídu `program-card-popular` — vizuálně povýšená (mírně větší, ember gradient na štítku
"Nejoblíbenější", na čísle délky i na CTA tlačítku), aby padla do oka jako první volba.

Kdyby bylo v budoucnu potřeba podobnou cenovou nabídku bez napojení na `pricing_plans`
(např. balíček služeb jinde na webu), dá se stejná sada tříd použít i na ručně psané
HTML karty — jen bez reálného React komponentu okolo.

---

## 3. Černobílá fotka s návratem barvy — `.bw-photo`

Utility třída v `app/globals.css`. Pokud do obsahu (ceník, případně budoucí blog) přidáš
fotku a chceš stejnou atmosféru jako na referenci (černobílá, elegantní, barva se vrátí
při najetí myší):

```html
<img src="/cenik/atmosfera.jpg" alt="..." class="bw-photo">
```

Aktuálně na `/cenik` není zapojená žádná fotka (na webu nejsou k dispozici vhodné obecné
atmosférické fotky mimo profily společnic, kterých se tento úkol netýkal) — třída je
připravená pro až se nějaká fotka přidá.

---

## Poznámka k blogu

Na blogu (`/blog/[slug]`) zůstaly z původního zadání jen dvě věci, obě čistě o
čitelnosti, ne o nových blocích:
- `.blog-card-vtag` / `.blog-tag-hero` — neprůhledné tmavé sklo místo průsvitného
  korálového, aby byl štítek čitelný na jakékoli fotce.
- `.blog-toc` (nižší průhlednost pozadí/rámečku), `.blog-detail-content h2` (výraznější
  ember pruh se září) a první odstavec článku jako lead (`p:first-of-type`) — typografický
  rytmus, žádné efekty navíc.

Časová osa s tepem, boční sloupec, cenové bloky a černobílé fotky v článku byly z blogu
odstraněny — podle zpětné vazby má být článek na blogu čistě čitelný text (banner, nadpis,
odstavce, odrážky, podnadpisy), bez dalších efektů. Tahle bohatší vizuální vrstva teď patří
na `/cenik` (viz bloky výše).
