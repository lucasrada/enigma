# Milestone reviews

A log of each milestone in [SPEC.md §6](../SPEC.md#6-milestones): what was
checked against [RESEARCH.md](../RESEARCH.md), what didn't match, and what
was fixed.

## M1: Engine proven

* `npm test`: **67/67 pass**. That covers the component tables, V1–V3, all
  nine historical messages H1–H9 (with indicator procedures, U-264's final
  display `VJWY`, and both published Dönitz settings), all nine synthetic
  vectors S1–S9, the API and validation contract, and properties P1–P9 over
  randomised Enigma I, M3 and M4 machines (seed printed; `ENIGMA_SEED` and
  `ENIGMA_RUNS` to vary).
* Every historical message passed on the first engine run. The engine was
  written from the rules in RESEARCH.md §1, not ported from the prototype or
  another implementation.
* **Mutation check** (`npm run test:mutants`): 12 classic implementation bugs
  were injected into a copy of the page. They were: no double step, the wrong
  rotor carrying the left, the ring setting applied to the notch, the ring
  applied in the wrong direction, stepping after encipherment, a stepping Greek
  wheel, the plugboard applied only on the way in, a single transposed letter in
  rotor VIII or in UKW C thin, a single-notch rotor VI, the forward wiring on
  the return path, and a thumbwheel that carries.
  * First run: **11/12 killed**. The thumbwheel test only turned wheels away
    from turnover letters, so a carry bug went unnoticed. The test now turns
    wheels onto, past and all the way round their turnover letters, and the
    rerun kills **12/12**.
* Test harness note: loading the engine in a separate `vm` realm made
  `deepStrictEqual` fail on arrays from the other realm (a harness problem,
  not an engine bug). The loader now runs the script in the test realm with a
  shadowed `globalThis`.

## M2: Static machine

![Machine close-up](screenshots/m2-static/machine.jpg)

The machine is drawn from the millimetre table in RESEARCH §4.8 and placed
with CSS 3D under one camera (eye above and in front, vertical image plane),
so the top plate recedes and the plugboard faces the viewer as in museum
photographs. The textures are procedural: plain-sawn oak with ray flecks,
wrinkle paint, ebonite and paper.

Checked against RESEARCH §4:

| Research point | Rendered | Result |
|---|---|---|
| Oak case, hinged lid, fall-front flap (§4.1) | oak rim, open lid leaning 10° back, flap lying forward stamped "Klappe schließen!" | ✔ |
| Black crackle paint (§4.2) | procedural wrinkle texture on the top plate | ✔ |
| Rotor windows with the thumbwheel to the **right** of each (§4.2) | 3 windows, a knurled wheel right of each | ✔ |
| Enigma I rings numbered 01–26 (§1.7) | windows read `01 01 01` | ✔ (after fix) |
| Power switch, 4 positions left→right (§4.2) | `hell Batterie · dkl. Batterie · aus · Sammler 4V` around a pointer knob | ✔ (after fix) |
| Fixing nuts either side of the cover (Powerhouse) | two knurled nuts | ✔ |
| Lampboard in QWERTZ, cream windows, black letters (§4.3) | 3 rows, 9/8/9 | ✔ |
| Keys: white on black, metal rim, raised on stems (§4.4) | 3D caps on stems, nickel rims | ✔ (after fix) |
| Plugboard: 26 sockets in keyboard layout, thick hole above thin (§4.5) | 9/8/9 sockets, letter labels, two holes each | ✔ |
| Lid: "Zur Beachtung!" plate, spare bulbs, green filter (§4.6) | plate (marked as a paraphrase), 3 bulbs, filter (cropped off by the lid framing) | ✔ |
| Serial plate, no logo (§4.2) | brass plate `A 17 562 / jla 43` | ✔ |

Mismatches found in the screenshots, and the fixes:

1. **Keys hid the bottom lamp row.** The camera keeps vertical distances at
   full height, unlike a tilted photographic camera, so the 18 mm stems
   towered over the plate. Stems are now 9 mm, and the lamp and key rows are
   3–4 mm further apart. All three lamp rows are visible.
2. **Rotor windows were illegible.** They showed "26/01/02" stacked, because
   the ring's label spacing on the drawn cylinder (≈11 px) was smaller than the
   glyph height. On the real ring it is ~12 mm for ~7 mm glyphs. The radius
   now matches that ratio, so a window shows one label and neighbours appear
   only while rolling.
3. **Power-switch labels overlapped each other and the knob.** The plate is
   larger, the labels sit further out on an arc, and the knob is lower.
4. **A fixing nut overlapped the switch plate**, so both were moved apart.
5. **"GEHEIM" stamp collided with the sheet title**, so it moved to the sheet's
   lower corner.
6. Uppercasing turned "Klappe schließen!" into "SCHLIESSEN". The stamp is now
   in mixed case and keeps the ß.
7. The machine sat below the fold on a 1440 × 900 desktop. The lid is cropped
   tighter and the side papers are narrower, so rotors, lamps, keys and
   plugboard all show without scrolling.
