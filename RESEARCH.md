# Enigma research notes

Research done before writing any engine or interface code. It covers the
cipher mechanics of the Wehrmacht **Enigma I** and the Kriegsmarine **M3** and
**M4**, published test vectors and historical messages, and the physical
design of the machines. Every claim lists its sources. Where sources disagree,
§3 says so, and anything that couldn't be confirmed is listed in §6.

---

## 0. Method and limitations

* **Network constraints.** The sandbox this was researched in blocks direct
  page fetches to most sites (Wikipedia, Crypto Museum, CryptoCellar,
  Rijmenants, Wikimedia Commons, Flickr, …). Research therefore used:
  1. **Web-search extracts** (search-engine summaries of the pages, with their
     URLs). Exact strings (wirings, ciphertexts) were confirmed with
     exact-phrase searches that hit the source pages.
  2. **Four independent open-source implementations**, downloaded from the
     package registries and read in full: `py-enigma` 1.0.2 (Brian Neal, PyPI),
     `crypto-enigma` 0.2.1b2 (Roy Levien, PyPI), `enigmapython` 3.2.0 (Denis
     Maggiorotto, PyPI) and `@ondoher/enigma` 1.0.14 (npm). Their test suites
     carry historical messages with citations to the primary web sources.
  3. **A throwaway Python prototype**, written from the rules in §1 (not
     shipped), to check every candidate vector before it went into the test
     suite. Results are in §2.
* **Photos.** No image host could be reached, so photos of real machines
  couldn't be viewed during this session. The physical design in §4 rests on
  museum catalogue and auction-house descriptions of specific surviving
  machines (quoted), plus general familiarity with widely published
  photographs. Details that come only from that familiarity are marked
  **[recollection]** and are repeated as open questions in §6.

---

## 1. Cipher mechanics

### 1.1 Signal path

On every key press the rotors **step first**, then the circuit closes. The
lamp stays lit only while the key is held down
([Rijmenants, Technical Details][rij-tech]; [Stanford CS106 handout][stanford];
[Wikipedia – Enigma machine][wp-enigma]).

Current path for one letter:

```
key → plugboard → entry wheel (ETW) → right rotor → middle rotor → left rotor
    → [M4: Greek wheel] → reflector (UKW) → [M4: Greek wheel]
    → left → middle → right → ETW → plugboard → lamp
```

For the military machines the ETW is the identity (`ABCDEFGHIJKLMNOPQRSTUVWXYZ`).
The commercial machines used keyboard order (`QWERTZUIOASDFGHJKPYXCVBNML`),
which is out of scope here ([Wikipedia – Enigma rotor details][wp-rotors],
search extract).

### 1.2 Wirings

Each string gives the output contact for the input contact A…Z when current
flows right to left (from the ETW towards the reflector), at position A with
ring setting 01/A ([Tony Sale – rotor spec][sale-spec]: "the tables … specify
how the rotor transforms the input (current coming from the right) into
output").

| Component | Wiring | Used in | Introduced |
|---|---|---|---|
| Rotor I | `EKMFLGDQVZNTOWYHXUSPAIBRCJ` | I, M3, M4 | 1930 |
| Rotor II | `AJDKSIRUXBLHWTMCQGZNPYFVOE` | I, M3, M4 | 1930 |
| Rotor III | `BDFHJLCPRTXVZNYEIWGAKMUSQO` | I, M3, M4 | 1930 |
| Rotor IV | `ESOVPZJAYQUIRHXLNFTGKDCMWB` | I, M3, M4 | Dec 1938 |
| Rotor V | `VZBRGITYUPSDNHLXAWMJQOFECK` | I, M3, M4 | Dec 1938 |
| Rotor VI | `JPGVOUMFYQBENHZRDKASXLICTW` | M3, M4 (Navy) | 1939 |
| Rotor VII | `NZJHGRCXMYSWBOUFAIVLPEKQDT` | M3, M4 (Navy) | 1939 |
| Rotor VIII | `FKQHTLXOCBJSPDZRAMEWNIUYGV` | M3, M4 (Navy) | 1939/40 (§3) |
| Greek wheel β (Beta) | `LEYJVCNIXWPBQMDRTAKZGFUHOS` | M4 only | 1941/42 (§3) |
| Greek wheel γ (Gamma) | `FSOKANUERHMBTIYCWLQPZXVGJD` | M4 only | 1942/43 (§3) |
| UKW A | `EJMZALYXVBWFCRQUONTSPIKHGD` | Enigma I (until 1937) | before 1930 |
| UKW B | `YRUHQSLDPXNGOKMIEBFZCWVJAT` | I, M3 | 1937 |
| UKW C | `FVPJIAOYEDRZXWGCTKUQSBNMHL` | I, M3 | 1940/41 |
| UKW B thin ("Bruno") | `ENKQAUYWJICOPBLMDXZVFTHRGS` | M4 only | 1940–42 (§3) |
| UKW C thin ("Caesar") | `RDOBJNTKVEHMLFCWZAXGYIPSUQ` | M4 only | 1940–43 (§3) |

**How these were cross-checked (all sources agree on every string):**

| Source | Coverage |
|---|---|
| [Wikipedia – Enigma rotor details][wp-rotors] (search extracts and exact-string hits) | I–VIII, β, γ, A, B, C, B thin, C thin |
| [Dirk Rijmenants – Technical Details of the Enigma Machine][rij-tech] (quoted as the data source in `py-enigma`'s `rotors/data.py`) | I–VIII, β, γ, B, C, B thin, C thin |
| [David Hamer – Enigma rotor wiring][hamer-wiring] (exact-string hits for VII/VIII) | VII, VIII (+ notch letters) |
| [Marks & Weierud, *Recovering the wiring of Enigma's Umkehrwalze A*, Cryptologia 24(1), 2000][ukwa] | UKW A. First deduced by Rejewski in 1932/33; recovered analytically from Turing's wartime data |
| `py-enigma`, `crypto-enigma`, `enigmapython`, `@ondoher/enigma` (four separate codebases) | all components (`py-enigma` has no UKW A) |
| **Cryptographic check:** historical ciphertexts decrypt to German plaintext (§2) | I, II, III, IV, V, VI, VIII, β, A, B, B thin, C thin |
| **Cryptographic check:** M4 ≡ M3 compatibility identity (§1.7) | links β, γ, B, C, B thin, C thin |
| Synthetic vectors cross-verified on two separate simulators (§2.3) | VII, γ, C, C thin (the rest too) |

Each rotor wiring is a permutation of A–Z. Each reflector is an involution
with no fixed points; the test suite checks both.

### 1.3 Notches and turnover

The notch is cut into the **alphabet ring**, so it moves with the ring. In the
window reading it is therefore independent of the ring setting
([Wikipedia – Enigma rotor details][wp-rotors]; [Rijmenants][rij-tech]).

| Rotor | Window letter at which the next rotor is carried ("turnover") | Physical notch position on the ring |
|---|---|---|
| I | Q (Q→R carries) | Y |
| II | E | M |
| III | V | D |
| IV | J | R |
| V | Z | H |
| VI, VII, VIII | Z and M (two notches) | H and U |
| β, γ | — (never step) | — |

Mnemonic from Bletchley Park: "Royal Flags Wave Kings Above", the letters that
appear in the window *just after* the carry (R, F, W, K, A)
([Wikipedia – Enigma rotor details][wp-rotors]; [Wikipedia – Clock][wp-clock];
[Tony Sale][sale-spec]). The physical notch sits 8
positions from the window letter (Q+8=Y, E+8=M, …). The two columns describe
the same behaviour; see §3 for the naming clash.

### 1.4 Ring setting (Ringstellung)

The alphabet ring and notch ring turn together relative to the wiring core
([Wikipedia – Enigma rotor details][wp-rotors]; [Rijmenants][rij-tech]). With
window position `p` and ring setting `r` (both 0–25, where ring 01 = A = 0),
the effective offset of the wiring is `p − r`:

```
forward(c)  = W[(c + p − r) mod 26] − p + r   (mod 26)
backward(c) = W⁻¹[(c + p − r) mod 26] − p + r (mod 26)
```

Consequences used in tests:

* Moving ring and position together (`r+k`, `p+k`) gives the same substitution
  but moves the carry point by k.
* For rotors whose notch never matters (the M4 Greek wheel, and the leftmost
  of the three stepping rotors), (`r+k`, `p+k`) is **exactly** equivalent for
  every message length. This explains the two different published settings
  for the Dönitz message (§3).

This formula is confirmed by the 1930 manual example (§2.2), which uses
non-trivial rings 24 13 22 and whose doubled indicator `ABLABL` enciphers to
the published `PKPJXI`.

### 1.5 Stepping and the double-step anomaly

Mechanism (Hamer, *Enigma: Actions involved in the "double stepping" of the
middle rotor*, [Cryptologia 21(1), 1997][hamer-ds];
[Rijmenants][rij-tech]; [Wikipedia][wp-rotors]):

* There are **three pawls**, and all three move on every key press. Each pawl
  sits half over the notch ring of the rotor to its right and half over the
  26-tooth ratchet of the rotor to its left.
* Pawl 1 (next to the ETW) always engages: the **right rotor always steps**.
* Pawl 2 drops into the right rotor's notch when it is at its turnover
  letter and pushes the **middle** rotor.
* Pawl 3 drops into the middle rotor's notch and then pushes **both** the
  left rotor (via its ratchet) and the middle rotor (via the notch). This is
  the double step: the middle rotor moves on two consecutive key presses.
* The left rotor's notch does nothing, because there is no fourth pawl. The
  M4 adds its Greek wheel without adding a pawl, so **the Greek wheel never
  moves** during encryption ([Wikipedia – Enigma-M4][wp-m4]).

The stepping rule that follows, applied before each letter is enciphered:

```
middleSteps = rightAtTurnover OR middleAtTurnover
leftSteps   = middleAtTurnover
right always steps
```

Published sequences (two independent examples):

| Rotors (L-M-R) | Sequence | Source |
|---|---|---|
| I-II-III | `ADU → ADV → AEW → BFX → BFY` | [Wikipedia – Enigma rotor details][wp-rotors] |
| III-II-I | `KDO → KDP → KDQ → KER → LFS → LFT → LFU` | [Rijmenants, stepping mechanism][rij-tech] (also used in `py-enigma`'s tests) |

**Period:** with single-notch rotors the three-rotor sequence repeats every
26 × 25 × 26 = **16 900** key presses, not 26³, because of double-stepping
([Wikipedia – Enigma machine][wp-enigma]; [James Grime, maths notes][grime]).
This is used as a property test.

### 1.6 Plugboard (Steckerbrett)

* 26 dual-holed sockets on the front panel. Each double-ended cable swaps two
  letters on the way in *and* on the way out, so the plugboard is
  reciprocal ([Tony Sale][sale-plugbd]; [ellsbury.com][ellsbury]; search
  extracts).
* Sockets close themselves: with no plug inserted, a spring-loaded bar
  shorts the two contacts, so the letter maps to itself (same sources).
* Cables are 20 cm long, with a black bakelite plug at each end. Each plug
  has a thick 4 mm pin on top and a thin 3 mm pin below, cross-wired thick↔thin,
  and the cable is made of brass, bakelite and fabric
  ([Chiffriermaschine object C0007][cable-c0007]).
* Cables in use: 6 pairs in 1930 (the 1930 manual example has 6), 5–8 pairs
  from 1 Oct 1936, **10 pairs from 1939**. At most 13 pairs are possible
  ([Wikipedia – Grill][wp-grill]; [Wikipedia – Cryptanalysis of the
  Enigma][wp-cryptanalysis]; search extracts).
* Supplied: "each Enigma I machine was equipped with 12 of these cables" (see
  §3 for the counts in actual surviving machines).

### 1.7 Model differences and M4 ↔ M3 compatibility

| | Enigma I (Heer, Luftwaffe) | M3 (Kriegsmarine) | M4 (Kriegsmarine U-boats, from 1 Feb 1942) |
|---|---|---|---|
| Stepping rotors | 3 of I–V | 3 of I–VIII | 3 of I–VIII |
| Extra wheel | — | — | β or γ, leftmost, never steps |
| Reflector | A (to 1937), B, C | B, C | B thin, C thin |
| Ring markings | **numbers 01–26** | letters A–Z | letters A–Z |
| Plugboard labels | letters | letters | letters |

Sources: rotor sets and reflectors from [Wikipedia – Enigma rotor details][wp-rotors]
and [Rijmenants][rij-tech]. "All Wehrmacht (Heer and Luftwaffe) Enigma
machines had rotors with numbers and never with letters", while Navy machines
used letters ([Rijmenants – Enigma Procedures][rij-proc] / Enigma Sim
manual). An Enigma I at Sotheby's had "each rotor with 26 positions labeled
with numbers" ([Sotheby's 2019, Enigma I][sothebys-i]). The M4 start date is
from [uboat.net][uboat] and [Wikipedia – Enigma-M4][wp-m4].

**Compatibility identity.** An M4 with UKW B thin and β at position A, ring A,
enciphers exactly like an M3 with UKW B. Likewise γ + UKW C thin at A/A equals
UKW C ([Wikipedia – Enigma-M4][wp-m4]; [Rijmenants][rij-tech]; the
[cryptii issue #100][cryptii-100] cites Crypto Museum for the same statement).
The test suite checks this over randomised settings. It is a strong test
because it ties six separately published wirings together.

### 1.8 Indicator procedures (context for the historical messages)

* **1930–1938 (Heer):** a daily Grundstellung. The operator picks a message
  key, types it twice at the Grundstellung and sends the result, e.g.
  `ABLABL → PKPJXI` at `FOL`. The doubled key was the weakness Rejewski
  exploited ([Wikipedia – Grill][wp-grill]; [CryptoCellar 1930
  message][cc-1930]).
* **From 1940 (Heer/Luftwaffe):** the operator picks a random start (e.g.
  `WXC`), types the message key once (`BLA → KCH`), and sends `WXC KCH` in
  clear in the header. A 5-letter *Kenngruppe* (e.g. `RFUGZ`) opens the text
  and is not part of the ciphertext ([Franklin Heath wiki][fh-samples];
  `py-enigma` tests credited to Frode Weierud and Geoff Sullivan via
  Rijmenants).
* **Kriegsmarine:** indicators were enciphered with bigram tables and are
  not machine-reproducible without the tables. Published M4 breaks give the
  message key (Grundstellung) directly ([bytereef M4 project][m4-first]).

---

## 2. Test vectors

The prototype (§0) reproduced every vector below exactly. Each has at least
two independent sources unless marked otherwise.

### 2.1 Basic vectors

| # | Setting | Input → Output | Sources |
|---|---|---|---|
| V1 | Enigma I, UKW B, I-II-III, rings 01 01 01, start AAA, no plugs | `AAAAA → BDZGO` | Wikipedia (cited in `py-enigma` tests); reproduced by all four implementations |
| V2 | I-II-III, stepping only | `ADU → ADV → AEW → BFX → BFY` | [Wikipedia][wp-rotors] |
| V3 | III-II-I, stepping only | `KDO → KDP → KDQ → KER → LFS → LFT → LFU` | [Rijmenants][rij-tech]; `py-enigma` |

### 2.2 Historical messages

| # | Message | Model / settings | Sources | Result |
|---|---|---|---|---|
| H1 | **Enigma I manual, 1930** ("Feindliche Infanteriekolonne beobachtet…") | Enigma I, UKW **A**, II-I-III, rings 24 13 22 (XMV), plugs AM FI NV PS TU WZ, Grundstellung FOL (06 15 12), key ABL (doubled indicator PKPJXI) | [CryptoCellar – Enigma test message from 1930][cc-1930]; [Wikipedia – Grill][wp-grill] (settings and indicator); exact ciphertext also on the [Franklin Heath wiki][fh-samples] | `FEINDLIQEINFANTERIEKOLONNEBEOBAQTETXANFANGSUEDAUSGANGBAERWALDEXENDEDREIKMOSTWAERTSNEUSTADT` ✔ and `ABLABL@FOL → PKPJXI` ✔ |
| H2 | **Operation Barbarossa, 7 Jul 1941**, part 1 | Enigma I, UKW B, II-IV-V, rings 02 21 12 (BUL), plugs AV BS CG DL FU HZ IN KM OW RX; indicator WXC KCH → key BLA; Kenngruppe RFUGZ dropped | `py-enigma` tests (from Rijmenants' simulator manual, credited to Weierud & Sullivan); `@ondoher/enigma` tests (from the [Franklin Heath wiki][fh-samples]) | `AUFKLXABTEILUNGXVONXKURTINOWA…` ✔ |
| H3 | Operation Barbarossa, part 2 | same; indicator CRS YPJ → key LSD; Kenngruppe FNJAU | `py-enigma` | `DREIGEHTLANGSAMABERSIQERVORWAERTS…` ✔ (single source for the ciphertext; the decrypt itself confirms it) |
| H4 | **Scharnhorst, 26 Dec 1943** (Konteradmiral Bey) | M3, UKW B, III-VI-VIII, rings 01 08 13 (AHM), plugs AN EZ HK IJ LR MQ OT PV SW UX, key UZV | `py-enigma` (from [bytereef.org][m4-scharnhorst]); `@ondoher` (from Franklin Heath); [CryptoCellar – Scharnhorst's last message?][cc-scharnhorst] | `STEUEREJTANAFJORDJANSTANDORTQUAAACCC…SCHARNHORSTHCO` ✔ |
| H5 | **U-264 (Kptlt. Looks), 1942**, M4 project first break (2006) | M4, UKW B thin, β-II-IV-I, rings A A A V, plugs AT BL DF GJ HM NW OP QY RZ VX, key VJNA | [bytereef – first break][m4-first] (settings); `py-enigma` (Rijmenants manual, credited to Stefan Krah); `@ondoher` (Franklin Heath) | `VONVONJLOOKSJHFFTTTEINSEINSDREIZWO…` ✔; rotor display after the message is `VJWY` ✔ |
| H6 | U-623 (Schroeder), M4 project second break | M4, UKW B thin, β-II-IV-I, rings A A N V, plugs AT CL DH EP FG IO JN KQ MU RX, key MCSF | [bytereef – second break][m4-second]; `py-enigma` | `VVVJSCHREEDERJAUFGELEITKURS…` ✔ |
| H7 | U-106 (Kptlt. Rasch), "HMS Hurricane" intercept, 25 Nov 1942 | M4, UKW B thin, β-VI-I-III, rings Z Z D G, plugs BQ CR DI EJ KW MT OS PX UZ GH, key NAQL | [hoerenberg – Rasch message][hoer-rasch]; `py-enigma` | `BOOTKLARXBEIJSCHNOORBETWA…` ✔ (raw decrypt; see §3 on garbles) |
| H8 | **Dönitz message P1030681, 1 May 1945** (U-534) | M4, UKW C thin, β-V-VI-VIII, plugs AE BF CM DQ HU JN LX PR SZ VW; rings **E P E L** + key **CDSZ** (Crypto Museum) *or* rings **A A E L** + key **Y O S Z** (hoerenberg) | [Crypto Museum P1030681][cm-p1030681] (via `@ondoher`); [hoerenberg P1030681][hoer-p1030681] | `KRKRALLEXXFOLGENDESISTSOFORTBEKANNTZUGEBEN…` ✔ under **both** settings (see §3) |
| H9 | U-534 message P1030662 | M4, UKW C thin, β-V-VI-VIII, rings A A E L, same plugs, key WIIJ | [hoerenberg P1030662][hoer-p1030662] (via `@ondoher`) | `UUUVIRSIBENNULEINSYNACHRXUUUSTUETZPUNKTLUEBECK…` ✔ (single source) |

### 2.3 Synthetic vectors verified on two independent simulators

`@ondoher/enigma` ships nine long English (Shakespeare) messages, each
verified against both [cryptii][cryptii] and Palloks'
[Universal Enigma][palloks]. Together they cover **UKW A** with rings
22 26 26, **rotor VII**, **γ**, **UKW C thin** and unusual ring settings. The
prototype reproduced all nine. They go into the test suite because they
exercise components that the historical messages use little or not at all
(VII, γ).

### 2.4 Excluded

* The **Norrköping messages** PAGE_47_DOEP and PAGE_49_KRLR (M3, VII-IV-VI,
  rings AGW) from `@ondoher` decrypt meaningfully only for 22 and 55 letters
  (`KOFFERGRAMOPHONKEINSINN…`, `VERWALTUNGSAMTREICHSGERICHT…`). After that the
  expected output in that package is itself random letters. A brute-force
  search over single dropped or inserted letters didn't resynchronise the
  tails either. They are not used; see §6.

---

## 3. Where sources disagree

1. **"Notch" means two different things.** Wikipedia's rotor-details table
   (as extracted), Rijmenants and all four implementations call Q/E/V/J/Z the
   "notch", meaning the window letter at which the carry happens. Tables
   derived from Crypto Museum and Hamer list the physical notch as **Y/M/D/R/H**
   (VI–VIII: **H/U**) and the turnover as **Q/E/V/J/Z** (VI–VIII: **Z/M**). One
   search extract even "corrected" Y to Q. The behaviour is identical: the
   physical notch is 8 positions from the window letter. This project stores
   the window letter, called `turnover`, and records the physical notch for
   documentation only.
2. **Introduction dates.** β: "Spring 1941" in the Wikipedia table versus
   1942, when the M4 entered service on 1 Feb 1942 ([uboat.net][uboat]).
   γ: "Spring 1942" versus "1943". Thin reflectors: "1940" in the Wikipedia
   table versus 1942 (B thin) and 1943 (C thin) in narrative sources. This has
   no effect on the cipher; the UI shows only the component set per model.
3. **Dönitz message settings.** Crypto Museum publishes rings `EPEL` with
   start `CDSZ`; hoerenberg publishes rings `AAEL` with start `YOSZ`. These
   look contradictory but are **equivalent**: the Greek wheel (E→A, C→Y) and
   the left rotor (P→A, D→O) are shifted by the same amount in ring and
   position, and neither wheel's notch has any effect (§1.4). Cryptanalysts
   can't recover those ring settings and conventionally set them to A. Both
   settings decrypt the message identically, and the test suite checks this.
4. **Garbled intercepts.** The published plaintext of the Rasch message is
   "degarbled" (`…BENOETIGE GLAESER Y NOCH VIER KLAR…`). The raw decrypt of the
   published ciphertext reads `…BENOETIGEGLMESERYNOCHVIEFKLHR…`, because
   of radio transmission errors in the intercept, not the machine. Tests compare
   against the raw decrypt. Crypto Museum's P1030681 ciphertext also has a
   separate "degarbling" write-up at hoerenberg.
5. **Metal finish.** Most auction descriptions give "black metal crackle
   finish case" ([Bonhams][bonhams-13489]). The Powerhouse Collection
   describes its Wehrmacht machine as "encased in a beige metal casing"
   ([Powerhouse][powerhouse]). This project uses black crackle for Enigma I
   and M3, and grey-black for M4 ([Sotheby's M4][sothebys-m4]: "grey and black
   painted metal case").
6. **Number of cables.** A machine was supplied with 12
   ([Chiffriermaschine][cable-c0007]), but surviving machines have 10
   ([Powerhouse][powerhouse]; [Sotheby's][sothebys-i]: 8 plugged + 2 spares),
   13, 12, 6 or 5 ([Bonhams lots][bonhams-13489]). Procedure used 10 from
   1939, so the simulator provides 12 cables with 10 pre-plugged and 2
   spares in the lid, matching the Sotheby's machine.
7. **Key tops.** "26 glass and metal keys with white on black backgrounds"
   ([Sotheby's][sothebys-i]) versus "metal and black Bakelite with white letters"
   ([Powerhouse][powerhouse]). Both agree on the look: white letter on a
   black, glossy face in a metal rim.
8. **Implementations disagree with each other.** Online simulators have
   shipped bugs in exactly the places this project tests: cryptii had an M4
   turnover bug that broke the M4≡M3 identity for some rotor orders
   ([issue #100][cryptii-100]) and an "Enigma I is wrong" report
   ([#84][cryptii-84]), and some hobby implementations omit double-stepping
   ([matheusportela/enigma-machine#1][mp-1]). These are the reasons for the
   property tests.

---

## 4. Physical design

### 4.1 Case

* **Oak** transit case with a hinged lid and a **fall-front flap** at the
  front, which opens down to expose the plugboard. It has two small metal
  hooks on the sides, a leather carrying handle (a metal handle on the M4) and
  a fold-in handle ([Powerhouse][powerhouse]; [Science Museum][scm]: "complete
  in oak wood transit case"; [Sotheby's][sothebys-i]; [Bonhams][bonhams-13489]:
  "original light oak case with hinged flap at the front").
* **Size:** 13¼ × 11 × 6½ in (≈ 337 × 280 × 165 mm)
  ([Sotheby's Enigma I][sothebys-i]); 13 × 11 × 6½ in and 6 × 11 × 13½ in
  (Bonhams lots); M4: 13¾ × 11¼ × 6¼ in ([Sotheby's M4][sothebys-m4]). Weight is
  about 12 kg / 26 lb (search extract, Science Museum / general).
* The flap is stamped **"Klappe schließen"** ("close the flap"; Sotheby's
  transcribes it as "Klappe Schleissen").

### 4.2 Top plate: rotors, windows, thumbwheels, switch

* The metal is painted with a **black crackle (wrinkle) finish**
  ([Bonhams][bonhams-13489]).
* A hinged inner **rotor cover** has one small **window** per rotor (three;
  four on the M4). Each rotor's serrated **finger wheel** (thumbwheel)
  sticks out through a slot in the cover so the operator can turn it
  ([Wikipedia – Enigma machine][wp-enigma]; search extracts).
* **Rotor anatomy** (Wikipedia exploded view,
  [File:Enigma_rotor_exploded_view.png][wp-exploded]): 1 notched ring,
  2 marking dot for contact "A", 3 alphabet ring, 4 plate contacts, 5 wire
  connections, 6 pin contacts, 7 spring-loaded ring-adjusting lever, 8 hub,
  9 finger wheel, 10 ratchet wheel. The alphabet and notch rings are on the
  plate-contact side, and the finger wheel and ratchet on the pin side.
  Since each pawl engages the ratchet of the rotor to its left and the notch
  ring of the rotor to its right (§1.5), the ratchet and finger wheel must be
  on each rotor's **right** side. Seen from the operator, then, each rotor's
  **window (alphabet ring) is to the left of its thumbwheel**. This is
  derived from the mechanism; see §6.
* A rotor is about **10 cm** in diameter, with a hard-rubber or bakelite body and
  brass contacts ([Wikipedia][wp-enigma]).
* **Power switch** (Enigma I): a black rotary dial at the top right with four
  positions, left to right: **"hell Batterie"** (bright), **"dkl.
  Batterie"** (dim), **"aus"** (off), **"Sammler 4V"** (external 4 V
  accumulator), with terminals to its right ([Virtual Enigma –
  simulation help][virtual-sim]). The internal battery is 4.5 V
  ([Chiffriermaschine C0009][battery]).
* A **serial number plate** sits by the keyboard, for example `16421/JLA/43`,
  where "jla" is the Heimsoeth & Rinke factory code. "Only a few machines
  actually carried the name Enigma and the logo"
  ([Rijmenants – Enigma][rij-enigma]; [Sotheby's][sothebys-i]). The simulator
  therefore shows a serial plate, not a logo, on the machine itself.

### 4.3 Lampboard

* 26 small **circular windows**, one letter each, in the **same QWERTZ layout**
  as the keyboard, above the keyboard and lit by bulbs underneath
  ([Tony Sale][sale-plugbd]; [PBS/NOVA][pbs]; [Powerhouse][powerhouse]:
  "A lettered lamp board is positioned above the keyboard").
* On the M4 the lamp panel is **removable**, so a Schreibmax printer can
  take its place, and there is a **coloured glare screen** ([Sotheby's
  M4][sothebys-m4]; [Rijmenants][rij-tech]). The Enigma I lid holds a
  **green contrast filter** ([Sotheby's][sothebys-i]).
* Appearance **[recollection]**: flush, round translucent windows, off-white to
  cream when dark, with black stencil-like capitals. A lit window glows warm
  yellow-white behind its letter. Incandescent bulbs light up and fade with a
  short lag.

### 4.4 Keyboard

* 26 keys in three rows, **QWERTZUIO / ASDFGHJK / PYXCVBNML**, with no digit
  or space keys ([Powerhouse][powerhouse]; [Rijmenants][rij-tech]).
* Raised typewriter-style keys: **white letters on black** round faces
  (glass or bakelite) in **metal rims**, on stems ([Sotheby's][sothebys-i];
  [Powerhouse][powerhouse]; [Sotheby's M4][sothebys-m4]: "raised 'QWERTZ'
  keyboard of 26 Bakelite keys in white on black backgrounds").
* Key travel is long, and the stepping pawls act during the first part of the
  stroke (§1.1). That is why a key press sounds like a heavy "clack-clunk".

### 4.5 Plugboard and cables

* On the front panel, behind the fall-front flap: an **ebonite/bakelite**
  panel ([Bonhams][bonhams-13489]; [Sotheby's][sothebys-i]) with 26 sockets,
  "each representing a letter" ([Powerhouse][powerhouse]). It follows the
  keyboard layout in three rows (9/8/9) **[recollection]**.
* Each socket has two holes, one thick and one thin, arranged **one above the
  other**, which matches the plug geometry ([Chiffriermaschine
  C0007][cable-c0007]).
* Cables: 20 cm, fabric-covered, with black bakelite plugs (§1.6). With a
  20 cm cable and sockets a few centimetres apart, cables hang in visible
  loops below the sockets.

### 4.6 Lid contents

"Zur Beachtung!" instruction plate (printed metal on Sotheby's machine; "white
Bakelite label with German text printed in black" on Powerhouse's), **two spare
plug cables**, **spare bulbs** (three at Powerhouse, ten at Sotheby's), a
**green contrast filter**, and a strip of black bakelite
([Powerhouse][powerhouse]; [Sotheby's][sothebys-i]).

### 4.7 M3 and M4 differences

* **M3:** mechanically and visually an Enigma I, with lettered rings and the
  Navy rotor set.
* **M4:** four windows (the thin Greek wheel sits leftmost), a split top
  cover whose rotor section can be **locked**, a removable lamp panel, a
  coloured glare screen, grey and black paint, a metal handle, a power socket
  for external supply, and a different ring-setting mechanism
  ([Sotheby's M4][sothebys-m4]; [Wikipedia – Enigma-M4][wp-m4]).

### 4.8 Proportions derived for the simulator

Based on the ≈ 337 × 280 × 165 mm case, 10 cm rotors and a 9-key top row
spanning most of the inner width (inner width ≈ 310 mm):

| Element | Value used |
|---|---|
| Key / lamp pitch | ≈ 30 mm horizontal, ≈ 26 mm between rows; rows 1 and 3 (9 keys) aligned, row 2 (8 keys) centred half a pitch in **[recollection]** |
| Key cap | Ø ≈ 19 mm, metal rim ≈ 1.5 mm |
| Lamp window | Ø ≈ 15 mm |
| Plugboard socket pitch | ≈ 28 mm |
| Rotor window | ≈ 9 × 11 mm; windows ≈ 30 mm apart (rotor thickness plus spacer) |
| Thumbwheel slot | ≈ 8 × 30 mm, just right of each window |
| Depth split (front→back) | keyboard ≈ 90 mm, lampboard ≈ 85 mm, rotor cover ≈ 90 mm |

These are **estimates** (§6). They are chosen so that the proportions read
correctly against photographs, not measured from a machine.

---

## 5. Consequences for the implementation

* The engine models I, M3 and M4 with the exact tables above. It enforces the
  component sets per model and 0–13 plug pairs (10 by default).
* Stepping uses the pawl logic from §1.5. It happens **before** encipherment and
  on key-down; the lamp is lit only while the key is held.
* Enigma I windows show **numbers 01–26**. M3 and M4 show letters. Ring
  settings are entered the same way the model labels them.
* Tests are built from §2 (vectors) and §1.4, §1.5 and §1.7 (properties:
  reciprocity, no self-encipherment, involution at each position, M4≡M3
  identity, ring/position equivalence, the 16 900 period, a Greek wheel that
  never moves).

---

## 6. Open questions (not confirmed in this session)

1. **Lamp window look.** Material, tint and letter colour of the lamp windows
   when unlit and lit (recollection: cream with black letters, warm yellow when
   lit). No photo could be viewed.
2. **Window-left-of-thumbwheel layout.** Derived from the rotor anatomy and the
   pawl mechanics (§4.2), not seen on a photo.
3. **Exact dimensions:** key and lamp pitch, key cap diameter, window size,
   thumbwheel protrusion and plugboard spacing are estimates (§4.8). The
   blueprint paper ("An Enigma Replica and its Blueprints", Cryptologia)
   couldn't be accessed.
4. **Plugboard labels on Heer/Luftwaffe machines.** Sources say letters. I
   vaguely recall letter-and-number labels on some panels but found no
   confirmation.
5. **Colour of the M4 "coloured glare screen"** and the exact M4 paint shade.
6. **Norrköping messages (§2.4).** Why do they decrypt only partially with the
   published settings? The tails may be operator filler, or the tail may be
   under a different key. Not resolved.
7. **Beta, gamma and thin-reflector introduction dates** (§3.2).
8. **UKW D** (the field-rewirable reflector, Luftwaffe 1944) is out of scope;
   its wiring varied by key list.
9. The exact wording of the "Zur Beachtung!" plate couldn't be read. The
   simulator shows a plausible **paraphrase**, labelled as decorative.

---

## 7. Sources

Cipher mechanics and vectors
* [wp-rotors]: https://en.wikipedia.org/wiki/Enigma_rotor_details — Wikipedia, *Enigma rotor details* (wirings, turnover table, ADU double-step example).
* [wp-enigma]: https://en.wikipedia.org/wiki/Enigma_machine — Wikipedia, *Enigma machine* (stepping, period 16 900, rotor diameter, finger wheels).
* [wp-m4]: https://en.wikipedia.org/wiki/Enigma-M4 — Wikipedia, *Enigma-M4* (Greek wheel does not step; M3 compatibility).
* [wp-grill]: https://en.wikipedia.org/wiki/Grill_(cryptology) — Wikipedia, *Grill* (1930 manual example settings and indicator).
* [wp-clock]: https://en.wikipedia.org/wiki/Clock_(cryptography) — Wikipedia, *Clock* ("Royal Flags Wave Kings Above").
* [wp-cryptanalysis]: https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma — plugboard pair counts over time.
* [rij-tech]: https://www.ciphermachinesandcryptology.com/en/enigmatech.htm — Dirk Rijmenants, *Technical Details of the Enigma Machine* (wirings, stepping, KDO example).
* [rij-proc]: https://www.ciphermachinesandcryptology.com/en/enigmaproc.htm — Rijmenants, *Enigma Procedures*; numbered Wehrmacht rotors (also the [Enigma Sim manual](https://ciphermachinesandcryptology.com/files/Enigma%20Sim%20Manual.pdf)).
* [rij-enigma]: https://www.ciphermachinesandcryptology.com/en/enigma.htm — Rijmenants, *Enigma* (few machines carried the logo).
* [hamer-wiring]: http://enigmamuseum.com/rotwirg.htm — David Hamer, *Enigma rotor wiring*.
* [hamer-ds]: https://www.cryptomuseum.com/people/hamer/files/double_stepping.pdf — D. Hamer, *Enigma: actions involved in the "double stepping" of the middle rotor*, Cryptologia 21(1), 1997.
* [sale-spec]: https://www.codesandciphers.org.uk/enigma/rotorspec.htm — Tony Sale, *Technical specifications of the Enigma rotors*.
* [sale-plugbd]: https://www.codesandciphers.org.uk/enigma/plugbd.htm — Tony Sale, *The Enigma – 2* (lampboard, plugboard).
* [ukwa]: https://cryptocellar.org/pubs/ukwa.pdf — P. Marks & F. Weierud, *Recovering the wiring of Enigma's Umkehrwalze A*, Cryptologia 24(1), 2000.
* [cc-1930]: https://cryptocellar.org/enigma/e-message-1930.html — Frode Weierud, *Enigma test message from 1930*.
* [cc-scharnhorst]: https://www.cryptocellar.org/bgac/scharnhorst.html — Weierud, *Scharnhorst's last message?*
* [fh-samples]: http://wiki.franklinheath.co.uk/index.php/Enigma/Sample_Messages — Franklin Heath wiki, *Enigma sample messages*.
* [m4-first]: https://www.bytereef.org/m4-project-first-break.html — Stefan Krah, M4 project first break (U-264).
* [m4-second]: https://www.bytereef.org/m4-project-second-break.html — M4 project second break (U-623).
* [m4-scharnhorst]: https://www.bytereef.org/m4-project-scharnhorst-break.html — Scharnhorst break.
* [hoer-rasch]: https://enigma.hoerenberg.com/index.php?cat=M4+Project+2006&page=Rasch+Message — Michael Hörenberg, Rasch message.
* [hoer-p1030681]: https://enigma.hoerenberg.com/index.php?cat=The+U534+messages&page=P1030681 — Dönitz message (AAEL / YOSZ settings).
* [hoer-p1030662]: https://enigma.hoerenberg.com/index.php?cat=The%20U534%20messages&page=P1030662 — U-534 message P1030662.
* [cm-p1030681]: https://www.cryptomuseum.com/crypto/enigma/msg/p1030681.htm — Crypto Museum, M4 message P1030681 (EPEL / CDSZ settings).
* [uboat]: https://uboat.net/technical/enigma_breaking.htm — uboat.net, M4 into service 1 Feb 1942.
* [grime]: https://www.singingbanana.com/enigmaproject/maths.pdf — James Grime, Enigma maths notes.
* [stanford]: https://web.stanford.edu/class/cs106j/handouts/36-TheEnigmaMachine.pdf — Stanford CS106J handout (rotors step before contact).
* [cryptii]: https://cryptii.com/pipes/enigma-machine · [palloks]: https://people.physik.hu-berlin.de/~palloks/js/enigma/index_en.html — the two simulators used to verify the synthetic vectors.
* [cryptii-100]: https://github.com/cryptii/cryptii/issues/100 · [cryptii-84]: https://github.com/cryptii/cryptii/issues/84 · [mp-1]: https://github.com/matheusportela/enigma-machine/issues/1 — implementation bugs.
* Implementations read in full: `py-enigma` 1.0.2 (https://pypi.org/project/py-enigma/), `crypto-enigma` 0.2.1b2 (https://pypi.org/project/crypto-enigma/), `enigmapython` 3.2.0 (https://pypi.org/project/enigmapython/), `@ondoher/enigma` 1.0.14 (https://www.npmjs.com/package/@ondoher/enigma).

Physical design
* [powerhouse]: https://collection.powerhouse.com.au/object/141921 — Powerhouse Collection, Wehrmacht Enigma in oak case.
* [scm]: https://collection.sciencemuseumgroup.org.uk/objects/co35752/three-ring-enigma-cypher-machine-in-oak-wood-transit-case — Science Museum Group.
* [sothebys-i]: https://www.sothebys.com/en/buy/auction/2019/history-of-science-and-technology-including-fossils-minerals-and-meteorites/enigma-i-a-fully-operational-three-rotor-enigma-i — Sotheby's 2019, Enigma I 16421/JLA/43.
* [sothebys-m4]: https://www.sothebys.com/en/buy/auction/2019/history-of-science-and-technology-including-fossils-minerals-and-meteorites/enigma-m4-a-fully-operational-four-rotor-m4 — Sotheby's 2019, M4.
* [bonhams-13489]: https://www.bonhams.com/auction/32384/lot/30/a-rare-3-rotor-heimsoeth-and-rinke-enigma-i-cipher-machine-german-circa-1941/ — Bonhams Enigma I lots (crackle finish, oak case, cable counts).
* [cable-c0007]: https://www.chiffriermaschine.com/explore/enigma-stecker-cable-624390bb6f052bc6951553d5-c0007 — Chiffriermaschine, Enigma I stecker cable.
* [battery]: https://www.chiffriermaschine.com/explore/enigma-battery-62c70660d27fe2b3064f4b2a-c0009 — Chiffriermaschine, 4.5 V battery.
* [virtual-sim]: https://enigma.virtualcolossus.co.uk/simulation.html — Virtual Enigma help (power switch positions).
* [wp-exploded]: https://commons.wikimedia.org/wiki/File:Enigma_rotor_exploded_view.png — rotor exploded view (part list).
* [pbs]: https://www.pbs.org/wgbh/nova/article/how-enigma-works/ — NOVA, *How Enigma works*.
* [ellsbury]: http://www.ellsbury.com/enigma2.htm — Graham Ellsbury, *Description of the Enigma*.

[wp-rotors]: https://en.wikipedia.org/wiki/Enigma_rotor_details
[wp-enigma]: https://en.wikipedia.org/wiki/Enigma_machine
[wp-m4]: https://en.wikipedia.org/wiki/Enigma-M4
[wp-grill]: https://en.wikipedia.org/wiki/Grill_(cryptology)
[wp-clock]: https://en.wikipedia.org/wiki/Clock_(cryptography)
[wp-cryptanalysis]: https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma
[wp-exploded]: https://commons.wikimedia.org/wiki/File:Enigma_rotor_exploded_view.png
[rij-tech]: https://www.ciphermachinesandcryptology.com/en/enigmatech.htm
[rij-proc]: https://www.ciphermachinesandcryptology.com/en/enigmaproc.htm
[rij-enigma]: https://www.ciphermachinesandcryptology.com/en/enigma.htm
[hamer-wiring]: http://enigmamuseum.com/rotwirg.htm
[hamer-ds]: https://www.cryptomuseum.com/people/hamer/files/double_stepping.pdf
[sale-spec]: https://www.codesandciphers.org.uk/enigma/rotorspec.htm
[sale-plugbd]: https://www.codesandciphers.org.uk/enigma/plugbd.htm
[ukwa]: https://cryptocellar.org/pubs/ukwa.pdf
[cc-1930]: https://cryptocellar.org/enigma/e-message-1930.html
[cc-scharnhorst]: https://www.cryptocellar.org/bgac/scharnhorst.html
[fh-samples]: http://wiki.franklinheath.co.uk/index.php/Enigma/Sample_Messages
[m4-first]: https://www.bytereef.org/m4-project-first-break.html
[m4-second]: https://www.bytereef.org/m4-project-second-break.html
[m4-scharnhorst]: https://www.bytereef.org/m4-project-scharnhorst-break.html
[hoer-rasch]: https://enigma.hoerenberg.com/index.php?cat=M4+Project+2006&page=Rasch+Message
[hoer-p1030681]: https://enigma.hoerenberg.com/index.php?cat=The+U534+messages&page=P1030681
[hoer-p1030662]: https://enigma.hoerenberg.com/index.php?cat=The%20U534%20messages&page=P1030662
[cm-p1030681]: https://www.cryptomuseum.com/crypto/enigma/msg/p1030681.htm
[uboat]: https://uboat.net/technical/enigma_breaking.htm
[grime]: https://www.singingbanana.com/enigmaproject/maths.pdf
[stanford]: https://web.stanford.edu/class/cs106j/handouts/36-TheEnigmaMachine.pdf
[cryptii]: https://cryptii.com/pipes/enigma-machine
[palloks]: https://people.physik.hu-berlin.de/~palloks/js/enigma/index_en.html
[cryptii-100]: https://github.com/cryptii/cryptii/issues/100
[cryptii-84]: https://github.com/cryptii/cryptii/issues/84
[mp-1]: https://github.com/matheusportela/enigma-machine/issues/1
[powerhouse]: https://collection.powerhouse.com.au/object/141921
[scm]: https://collection.sciencemuseumgroup.org.uk/objects/co35752/three-ring-enigma-cypher-machine-in-oak-wood-transit-case
[sothebys-i]: https://www.sothebys.com/en/buy/auction/2019/history-of-science-and-technology-including-fossils-minerals-and-meteorites/enigma-i-a-fully-operational-three-rotor-enigma-i
[sothebys-m4]: https://www.sothebys.com/en/buy/auction/2019/history-of-science-and-technology-including-fossils-minerals-and-meteorites/enigma-m4-a-fully-operational-four-rotor-m4
[bonhams-13489]: https://www.bonhams.com/auction/32384/lot/30/a-rare-3-rotor-heimsoeth-and-rinke-enigma-i-cipher-machine-german-circa-1941/
[cable-c0007]: https://www.chiffriermaschine.com/explore/enigma-stecker-cable-624390bb6f052bc6951553d5-c0007
[battery]: https://www.chiffriermaschine.com/explore/enigma-battery-62c70660d27fe2b3064f4b2a-c0009
[virtual-sim]: https://enigma.virtualcolossus.co.uk/simulation.html
[pbs]: https://www.pbs.org/wgbh/nova/article/how-enigma-works/
[ellsbury]: http://www.ellsbury.com/enigma2.htm
