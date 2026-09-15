# TASK-019: Hybridní booking flow — DEFINITIVNÍ SPECIFIKACE OD UŽIVATELE

## Princip: stavový, NE počítadlo zpráv

Robot NESLEDUJE počet zpráv. Sleduje STAV konverzace:
1. Zná vybranou dívku?
2. Zná požadovaný den?
3. Zná požadovaný čas?

Dokud chybí zásadní informace → přirozená AI konverzace.
Jakmile má dostatek info → přepne na tlačítka.

---

## Fáze 1: Přirozená konverzace (AI)

- Žádná tlačítka, žádné menu, žádné nucené volby
- Robot komunikuje jako člověk
- DŮLEŽITÉ: Klienti většinou VÍ koho chtějí. Konverzace je typicky 2-3 zprávy.
- Bot se NEMÁ aktivně vyptávat na preference ("jemnější nebo temperamentnější?" — NE!)
- Bot odpovídá přirozeně a pokud klient SÁM chce poradit, poradí mu
- Žádné vedení rozhovoru směrem k dotazníku — prostě normální komunikace

Typický flow (většina klientů):
```
Klient: "Ahoj."
Bot: "Ahoj 😊 Na jakou slečnu si přejete rezervaci? Nebo vám můžu s výběrem pomoct."
Klient: "Chci Katy."
→ Bot rovnou přejde na booking flow (tlačítka s dny/časy)
```

Flow pro nerozhodnutého klienta (menšina):
```
Klient: "Ahoj."
Bot: "Ahoj 😊 Na jakou slečnu si přejete rezervaci? Nebo vám můžu s výběrem pomoct."
Klient: "Nevím, chtěl bych spíš brunetku."
Bot: "Dnes pracuje Valerie a Samantha, obě brunetky 😊 Chcete se na ně podívat?"
→ Tlačítka [Valerie] [Samantha] nebo fotky
```

## Fáze 2: Přechod na tlačítka

Jakmile je z konverzace jasné:
- kterou dívku klient chce, NEBO
- mezi kterými dívkami vybírá, NEBO
- jaký den chce rezervaci

Robot přejde na strukturovaný flow:

```
Bot: "Super 😊 Koho chcete vybrat?"
[Tlačítko: Valeria]
[Tlačítko: Samantha]

Bot: "Na který den se chcete podívat?"
[Tlačítko: Dnes]
[Tlačítko: Zítra]
[Tlačítko: Jiný den]

Bot: "Valeria má zítra volno v těchto časech:"
[Tlačítko: 14:00]
[Tlačítko: 16:30]
[Tlačítko: 19:00]

→ Klikne na čas → dokončení rezervace
```

## Důležité pravidlo: NE pevný počet zpráv

- Pokud klient ve 2. zprávě napíše "Chci Niku dnes v 18:00" → rovnou ověřit dostupnost a do booking flow
- Pokud klient po 10 zprávách neví koho → dál normálně komunikovat a pomáhat

## Ideální UX

1. Klient má pocit že si píše s člověkem
2. Ve chvíli kdy je rozhodnutý → komunikace se automaticky zjednoduší
3. Nemusí vypisovat "zítra", "v šest", "ano", "potvrzuji" — místo toho kliká

## Logika přechodu

```
přirozená konverzace → klient je rozhodnutý → strukturované tlačítka → potvrzení rezervace
```

NE: `6 zpráv → tlačítka`
ANO: `stav konverzace → rozhodnutí → tlačítka`
