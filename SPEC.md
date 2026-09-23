# Enigma simulator: specification and milestones

Written from [RESEARCH.md](RESEARCH.md) before any code. Section numbers like
"R§1.5" point into the research notes.

## 1. Goals

1. **Cryptographically exact** Enigma I (default), with M3 and M4 as optional
   modes. Every published vector in R§2 must reproduce exactly.
2. **Strongly skeuomorphic.** An oak transit case, black crackle-painted metal,
   raised bakelite keys, a glowing lampboard, knurled thumbwheels turning
   behind small windows, and a bakelite plugboard with fabric cables that sag,
   swing and can be dragged. Proportions and details follow R§4.
3. **Synthesized mechanical sound** (Web Audio, no samples): key clack, pawl
   and ratchet ticks (the double step is audible), thumbwheel detents, plug
   insertion, switch clicks.
4. **One self-contained HTML file** (`enigma.html`). No network requests at
   runtime: fonts are embedded subsets and textures are generated
   procedurally.
5. **Proof before polish.** The engine is tested first, against published
   vectors (R§2) and properties (R§1.4–1.7). The UI is then tested end to end
   against the same engine.

Non-goals: UKW-D, commercial or Abwehr models, Schreibmax printing mechanics,
Uhr, and the Kriegsmarine bigram indicator tables (R§1.8).

## 2. Historical scope per model (R§1.7)

| | Enigma I | M3 | M4 |
|---|---|---|---|
| Rotor slots (L→R) | 3 of I–V | 3 of I–VIII | Greek (β/γ) + 3 of I–VIII |
| Reflector | A, B (default), C | B (default), C | B thin (default), C thin |
| Window / ring labels | numbers 01–26 | letters A–Z | letters A–Z |
| Default key | UKW B, I-II-III, rings 01 01 01, start 01 01 01, no plugs | UKW B, I-II-III, AAA, AAA | B thin, β-I-II-III, AAAA, AAAA |
| Paint | black crackle | black crackle | grey-black crackle |
| Windows | 3 | 3 | 4 (Greek wheel leftmost) |

Rotors must be distinct within a machine. Up to 13 plug pairs are allowed.
Presets use 10 pairs, which was 1939+ practice.

## 3. Engine specification

### 3.1 Location and form

The engine lives inside `enigma.html` in `<script id="enigma-engine">`. It is
pure (no DOM access) and defines `globalThis.EnigmaEngine`. Tests pull out
that exact script text and run it in a Node `vm` context, so **the shipped code
is the tested code**. No build step and no copy is involved.

### 3.2 Data

Wirings, turnovers (window letters) and physical notch letters (kept for
documentation) come verbatim from R§1.2–1.3. Reflector names: `A`, `B`, `C`,
`B-thin`, `C-thin`. Greek wheels: `Beta`, `Gamma`.

### 3.3 Algorithms

* Letters are indices 0–25.
* **Rotor substitution** (R§1.4), with shift `s = (p − r) mod 26`:
  `fwd(c) = (W[(c+s) mod 26] − s) mod 26`, and `bwd` uses `W⁻¹`.
* **Stepping** (R§1.5), before encipherment on each key press:
  `mid = R.atTurnover || M.atTurnover`, `left = M.atTurnover`, and the right
  rotor always steps. The Greek wheel never steps. `atTurnover` compares the
  **window** letter with the rotor's turnover letters.
* **Manual turning** (thumbwheel) changes one rotor's position with no carry.
* **Path:** plug → R → M → L → [G] → UKW → [G] → L → M → R → plug.
* **Plugboard.** Reciprocal pairs, plus an optional set of **open** sockets (a
  cable plugged in at only one end). A plug lifts the socket's shorting bar,
  so the contact goes nowhere and no lamp lights if the current enters or
  leaves through an open socket. The rotors still step, because stepping is
  mechanical. This models a real, half-plugged cable.

### 3.4 API (`EnigmaEngine`)

```js
EnigmaEngine.ALPHABET, .ROTORS, .REFLECTORS, .MODELS
new EnigmaEngine.Machine({ model, reflector, rotors, rings, positions, plugboard })
  // rotors: names left→right (M4: [greek, L, M, R]); rings/positions: 'ABC',
  // 'A B C', '01 02 03', [1,2,3] or ['A','B','C']; plugboard: 'AB CD' or [['A','B'],…]
m.press(letter)      → { input, output|null, stepped:[bool…], positions, path:[…] }
m.encrypt(text)      → string (non-letters ignored; open circuit → '?')
m.step()             → stepped flags (mechanics only)
m.permutation()      → 26-char current substitution without stepping ('?' = open)
m.getPositions()/setPositions(v), m.rotate(slot, delta)
m.windowLabels()     → ['01','17','03'] (Enigma I) or ['A','Q','C']
m.setPlugboard(v), m.plug(a,b), m.unplug(a), m.setOpen(letters)
m.clone(), m.config()
EnigmaEngine.parsePairs / parseSettings / labelFor(model, index)
```

Invalid configurations (a wrong component for the model, duplicate rotors, a
letter plugged twice, more than 13 pairs, a bad ring or position) throw
`EnigmaEngine.EnigmaError` with a readable message.

## 4. Test plan

`npm test` uses Node's built-in `node:test` and needs no dependencies.

**Vectors** (`tests/vectors.mjs`, IDs from R§2):
V1 `AAAAA→BDZGO`; V2 and V3 double-step sequences; H1 1930 manual (text plus
`ABLABL@FOL→PKPJXI`); H2 and H3 Barbarossa (indicator decrypts plus text);
H4 Scharnhorst; H5 U-264 (text plus final display `VJWY`); H6 second break;
H7 Rasch; H8 Dönitz under **both** published settings; H9 P1030662; S1–S9
synthetic vectors verified on two simulators.

**Properties** (`tests/properties.test.mjs`) use a seeded PRNG (mulberry32).
The seed is printed and can be overridden with `ENIGMA_SEED`. Configurations
are random over all three models:

| ID | Property |
|---|---|
| P1 | Reciprocity: resetting and re-encrypting the ciphertext returns the plaintext |
| P2 | No letter ever enciphers to itself, at every visited state |
| P3 | Each position's substitution is a fixed-point-free involution |
| P4 | M4(β@A/A, B thin) ≡ M3(UKW B) and M4(γ@A/A, C thin) ≡ M3(UKW C) over long messages |
| P5 | Ring/position shift equivalence: the Greek and left wheels are exactly equivalent under (r+k, p+k); any rotor has an identical instantaneous substitution |
| P6 | Period: single-notch rotor orders return to the start after exactly 16 900 presses and not before |
| P7 | Stepping invariants: the right wheel always moves, the left only with the middle, a middle at turnover always leaves on the next press (double step), the Greek wheel never moves |
| P8 | The plugboard is a reciprocal involution; open sockets never light a lamp |
| P9 | Rotor wirings are permutations; reflectors are fixed-point-free involutions |

**End-to-end** (`tests/e2e.test.mjs`, Playwright + Chromium, `npm run test:e2e`):
no console errors and no network requests besides the file itself; typing
through the physical keyboard matches the engine; a lamp is lit only while its
key is held; thumbwheels change positions and labels (numbers or letters per
model); dragging a cable end changes the plugboard and the key sheet;
switching models changes the window count; loading and auto-typing
historical messages (1930, Barbarossa, U-264) yields the published plaintext.

## 5. Interface specification

### 5.1 Composition

The scene is a dark desk under a warm lamp, with the machine in the centre,
seen from **front-above** as in museum photographs. From back to front: the
open lid showing its inside, the rotor cover, the lampboard, the keyboard, the
front plugboard panel and the fall-front flap lying on the desk.

Implementation: the machine is modelled in **millimetres** (CSS custom
property `--mm`). Each face (lid, top plate, front panel, flap) is a flat
element placed with CSS 3D transforms under one perspective camera. Keys are
real 3D stacks (stem plus cap) raised off the top plate. If 3D rendering
proves poor, the same faces can be laid out flat with no other code changes.

Dimensions follow R§4.8: case 337 × 280 × 165 mm; key and lamp pitch 30 mm;
key caps Ø19 mm; lamp windows Ø15 mm; plugboard pitch 28 mm; rotor windows
9 × 11 mm with the thumbwheel to the **right** of each window (R§4.2).

### 5.2 Components

| Component | Look (R§4) | Behaviour |
|---|---|---|
| Oak case, lid, flap | Procedural oak grain with medullary-ray flecks and varnish sheen. "Zur Beachtung!" plate, spare bulbs, green filter and 2 spare cables in the lid. "Klappe schließen" stamp on the flap. Brass hinges and hooks | Decorative. Spare cables can be dragged out |
| Top plate | Black crackle paint (grey-black on M4), screws, serial plate `A 16081 / jla 43`, no logo (R§4.2) | — |
| Rotor cover | 3 (M4: 4) windows showing numbers or letters on a curved ring, plus a knurled thumbwheel protruding through a slot on each window's right | Drag vertically, scroll, click, or arrow keys to turn, with detents. Rolls on stepping |
| Power switch | Black rotary knob at top right: `hell Batterie · dkl. Batterie · aus · Sammler 4V` | Bright / dim / off. `Sammler` means no accumulator connected, so lamps stay off |
| Lampboard | 26 round cream windows with black letters in QWERTZ layout | A lamp warms up over about 30 ms, stays lit while the key is held, and fades over about 90 ms |
| Keyboard | 26 raised keys: white letter on glossy black, nickel rim, stem | Press on pointer, touch or physical key. The key travels about 5 mm and springs back |
| Plugboard | Ebonite panel with 26 double-hole sockets (thick above thin), letter labels, 9/8/9 rows | Drag plug ends between sockets. A socket's letter lights on hover. A half-plugged cable is an open circuit |
| Cables | Fabric-covered 20 cm cables with black bakelite plug heads. Verlet rope physics, gravity sag and swing, soft shadow | 12 supplied: 10 plugged by default, 2 spares in the lid |

**Desk items** (outside the machine, paper-like):

* **Schlüsseltafel (key sheet):** model, UKW, Walzenlage, Ringstellung,
  Grundstellung and Steckerverbindungen, in typewriter type on yellowed
  paper. It applies to the machine: rotors change, cables re-plug and
  windows turn. It reflects manual changes made on the machine.
* **Funkspruch pad:** the operator's log, with keys pressed and lamps lit, in
  groups of five. It has copy and clear, plus a "type this text" box with
  adjustable speed that drives the real keys and lamps.
* **Historical messages (R§2.2):** 1930 manual, Barbarossa ×2, Scharnhorst,
  U-264, Dönitz. Loading one sets the machine. For H1–H3 the indicator step
  is performed first, then the message is auto-typed so the plaintext appears
  on the lamps.

### 5.3 Sound (Web Audio, created on first user gesture)

| Event | Synthesis |
|---|---|
| Key down | A band-passed noise click (key bottoming), a low damped body thump, then 1–3 short high ratchet ticks, one per rotor that steps, spaced about 6 ms apart. A double step adds a tick |
| Key up | A softer, lower clunk plus a faint spring ring |
| Thumbwheel detent | A tiny high click per position |
| Plug in / out | A bakelite knock plus a metallic contact ping / a shorter pop |
| Switch, lid, cover | A detent clack / a wooden thump |

Small random variation in pitch and level keeps repeated events from sounding
identical. There is a master mute and volume, and the choice is remembered in
`localStorage` (wrapped in try/catch).

### 5.4 Accessibility and responsiveness

* Keys are `<button>`s with labels. Thumbwheels are `role="spinbutton"` with
  value text. Sockets can be connected by click-then-click as well as by
  drag. The output is announced through an `aria-live` region. Visible focus
  rings are provided. `prefers-reduced-motion` damps the cable swing and key
  overshoot.
* Layout breakpoints: ≥1280 px three columns (sheet · machine · pad); below
  that, the machine spans the full width with the panels below; the machine
  scales to the viewport and the lid is cropped on small screens.
* Performance: physics sleeps when the cables settle, and canvases are sized
  to device pixel ratio × scale.

## 6. Milestones

Each milestone ends with **screenshots** (`tools/screenshot.mjs`, Playwright)
compared against R§4, with the findings and fixes logged in
[docs/milestone-reviews.md](docs/milestone-reviews.md).

| # | Milestone | Done when |
|---|---|---|
| M0 | Research and spec | RESEARCH.md and SPEC.md committed |
| M1 | **Engine proven** | Engine in `enigma.html`; `npm test` passes every V, H and S vector and P1–P9 |
| M2 | Static machine | Case, lid, top plate, rotor windows and thumbwheels, lampboard, keyboard, plugboard panel and flap rendered from millimetre dimensions; screenshot reviewed against R§4 |
| M3 | Live machine | Keys, lamps, stepping, thumbwheels, power switch and pad work with pointer and keyboard; E2E typing test passes; screenshot review |
| M4 | Plugboard and cables | Physics cables, drag and drop, spares, open circuits, key-sheet sync; E2E drag test; screenshot review |
| M5 | Models and history | Key sheet, Enigma I/M3/M4 visuals and components, historical presets with auto-typing; E2E historical decrypts; screenshot of each model |
| M6 | Sound | All events synthesized, mute/volume |
| M7 | Polish | Textures, lighting, glow, mobile layout, accessibility, performance; final screenshots and review |
