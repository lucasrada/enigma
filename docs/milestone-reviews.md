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
