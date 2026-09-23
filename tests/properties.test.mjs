// Property tests (SPEC.md §4, P1–P9) over randomised machines of all three
// models. Deterministic: the seed is printed and can be overridden with
// ENIGMA_SEED=<n> to reproduce or explore. ENIGMA_RUNS scales the run count.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './load-engine.mjs';

const E = loadEngine();
const A = E.ALPHABET;
const SEED = Number(process.env.ENIGMA_SEED ?? 0x5eed1939) >>> 0;
const RUNS = Number(process.env.ENIGMA_RUNS ?? 1);

// mulberry32: small, fast, good enough to explore the settings space.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGen(seed) {
  const r = rng(seed);
  const int = (n) => Math.floor(r() * n);
  const pick = (list) => list[int(list.length)];
  const shuffle = (list) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const text = (n) => Array.from({ length: n }, () => A[int(26)]).join('');
  const letters = (n) => Array.from({ length: n }, () => A[int(26)]);
  const plugboard = (maxPairs = 13) => {
    const count = int(maxPairs + 1);
    const order = shuffle([...A]);
    return Array.from({ length: count }, (_, i) => order[2 * i] + order[2 * i + 1]).join(' ');
  };
  const config = (modelId = pick(['I', 'M3', 'M4'])) => {
    const model = E.MODELS[modelId];
    const stepping = shuffle(model.rotors).slice(0, 3);
    const rotors = model.greek.length ? [pick(model.greek), ...stepping] : stepping;
    return {
      model: modelId,
      reflector: pick(model.reflectors),
      rotors,
      rings: letters(rotors.length),
      positions: letters(rotors.length),
      plugboard: plugboard(),
    };
  };
  return { r, int, pick, shuffle, text, letters, plugboard, config };
}

// Runs `body` over `n` generated cases; on failure, reports the seed and case.
function forAll(name, n, body) {
  test(name, () => {
    const gen = makeGen(SEED ^ hash(name));
    const total = Math.max(1, Math.round(n * RUNS));
    for (let i = 0; i < total; i++) {
      const snapshot = { case: i, seed: SEED };
      try {
        body(gen, snapshot);
      } catch (err) {
        err.message += `\n  (property "${name}", ${JSON.stringify(snapshot)}; rerun with ENIGMA_SEED=${SEED})`;
        throw err;
      }
    }
  });
}

function hash(s) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

test(`property seed ${SEED} (set ENIGMA_SEED to reproduce), runs ×${RUNS}`, () => {});

forAll('P1 reciprocity: decrypting the ciphertext from the same start restores the plaintext', 300, (g, s) => {
  const config = (s.config = g.config());
  const plaintext = (s.plaintext = g.text(1 + g.int(400)));
  const ciphertext = new E.Machine(config).encrypt(plaintext);
  assert.equal(ciphertext.length, plaintext.length);
  assert.equal(new E.Machine(config).encrypt(ciphertext), plaintext);
});

forAll('P2 no letter ever enciphers to itself', 300, (g, s) => {
  const machine = new E.Machine((s.config = g.config()));
  for (let i = 0; i < 300; i++) {
    const ch = A[g.int(26)];
    const { output } = machine.press(ch);
    assert.notEqual(output, ch, `${ch} enciphered to itself at ${machine.getPositions()}`);
  }
});

forAll('P3 every position is a fixed-point-free involution (the whole alphabet, not just typed letters)', 200, (g, s) => {
  const machine = new E.Machine((s.config = g.config()));
  for (let step = 0; step < 60; step++) {
    const perm = machine.permutation();
    for (let i = 0; i < 26; i++) {
      const j = perm.charCodeAt(i) - 65;
      assert.notEqual(j, i, `fixed point ${A[i]} at ${machine.getPositions()}`);
      assert.equal(perm[j], A[i], `not an involution at ${machine.getPositions()}`);
    }
    machine.step();
  }
});

forAll('P4 M4 with β/γ at A, ring A, and the thin reflector equals M3 with UKW B/C', 300, (g, s) => {
  const m3 = g.config('M3');
  const [greek, reflector] = g.pick([['Beta', 'B'], ['Gamma', 'C']]);
  const m4 = {
    model: 'M4',
    reflector: `${reflector}-thin`,
    rotors: [greek, ...m3.rotors],
    rings: ['A', ...m3.rings],
    positions: ['A', ...m3.positions],
    plugboard: m3.plugboard,
  };
  m3.reflector = reflector;
  s.m3 = m3;
  s.m4 = m4;
  const text = g.text(1 + g.int(600));
  const a = new E.Machine(m3);
  const b = new E.Machine(m4);
  assert.equal(b.encrypt(text), a.encrypt(text));
  assert.equal(b.getPositions().slice(1), a.getPositions(), 'same stepping');
});

forAll('P5a shifting ring and position together changes no substitution (any rotor)', 300, (g, s) => {
  const config = (s.config = g.config());
  const slot = g.int(config.rotors.length);
  const k = 1 + g.int(25);
  const shifted = structuredClone(config);
  const shiftLetter = (c) => A[(A.indexOf(c) + k) % 26];
  shifted.rings[slot] = shiftLetter(config.rings[slot]);
  shifted.positions[slot] = shiftLetter(config.positions[slot]);
  s.shifted = shifted;
  assert.equal(new E.Machine(shifted).permutation(), new E.Machine(config).permutation());
});

forAll('P5b …and for the Greek wheel and the left rotor the equivalence holds for whole messages', 300, (g, s) => {
  const config = (s.config = g.config(g.pick(['I', 'M3', 'M4'])));
  // The wheels whose notch never matters: M4 Greek (slot 0) and the leftmost
  // stepping rotor (slot 0 on I/M3, slot 1 on M4).
  const candidates = config.model === 'M4' ? [0, 1] : [0];
  const slot = g.pick(candidates);
  const k = 1 + g.int(25);
  const shifted = structuredClone(config);
  const shiftLetter = (c) => A[(A.indexOf(c) + k) % 26];
  shifted.rings[slot] = shiftLetter(config.rings[slot]);
  shifted.positions[slot] = shiftLetter(config.positions[slot]);
  const text = g.text(2000);
  assert.equal(new E.Machine(shifted).encrypt(text), new E.Machine(config).encrypt(text));
});

test('P6 period: single-notch rotor orders return to the start after exactly 16 900 = 26·25·26 presses', () => {
  const g = makeGen(SEED ^ hash('P6'));
  const singleNotch = ['I', 'II', 'III', 'IV', 'V'];
  for (let i = 0; i < 12; i++) {
    const rotors = g.shuffle(singleNotch).slice(0, 3);
    const start = g.letters(3).join('');
    const machine = new E.Machine({ model: 'I', rotors, positions: start });
    let period = 0;
    do {
      machine.step();
      period++;
    } while (machine.getPositions() !== start && period < 26 ** 3 + 1);
    // Double stepping removes the other 26² states from the cycle entirely, so
    // a start can also lie on a pre-period that is never revisited. In that
    // case, move onto the cycle first and measure from there.
    if (machine.getPositions() !== start) {
      const onCycle = machine.getPositions();
      period = 0;
      do {
        machine.step();
        period++;
      } while (machine.getPositions() !== onCycle);
    }
    assert.equal(period, 16900, `rotors ${rotors.join('-')} from ${start}`);
  }
});

forAll('P7 stepping invariants: right always, left only with middle, middle leaves its turnover at once, Greek never', 200, (g, s) => {
  const config = (s.config = g.config());
  const machine = new E.Machine(config);
  const n = config.rotors.length;
  const greekStart = n === 4 ? machine.getPositions()[0] : null;
  for (let i = 0; i < 700; i++) {
    const before = machine.getPositions();
    const middleWasAtTurnover = E.ROTORS[config.rotors[n - 2]].turnovers.includes(before[n - 2]);
    const rightWasAtTurnover = E.ROTORS[config.rotors[n - 1]].turnovers.includes(before[n - 1]);
    const stepped = machine.step();
    const after = machine.getPositions();
    assert.equal(stepped[n - 1], true, 'right rotor always steps');
    if (stepped[n - 3]) assert.equal(stepped[n - 2], true, 'left never steps without the middle');
    assert.equal(stepped[n - 2], middleWasAtTurnover || rightWasAtTurnover, 'middle steps exactly when a pawl drops into a notch');
    assert.equal(stepped[n - 3], middleWasAtTurnover, 'left steps exactly when the middle is at its turnover');
    if (middleWasAtTurnover) assert.notEqual(after[n - 2], before[n - 2], 'double step: the middle leaves its turnover at once');
    if (greekStart) assert.equal(after[0], greekStart, 'Greek wheel never moves');
    for (let k = 0; k < n; k++) {
      const moved = after[k] !== before[k];
      assert.equal(moved, stepped[k], `slot ${k} flag matches movement`);
      if (moved) assert.equal(A.indexOf(after[k]), (A.indexOf(before[k]) + 1) % 26, 'steps are single, forward');
    }
  }
});

forAll('P8 the plugboard is a reciprocal involution, and open sockets never light a lamp', 300, (g, s) => {
  const config = (s.config = g.config());
  const machine = new E.Machine(config);
  const pairs = machine.pairs();
  const map = new Map();
  for (const p of pairs) {
    map.set(p[0], p[1]);
    map.set(p[1], p[0]);
  }
  assert.equal(map.size, pairs.length * 2, 'no letter in two pairs');
  // Open one or two unplugged sockets (a cable with one end loose).
  const free = [...A].filter((c) => !map.has(c));
  if (free.length === 0) return;
  const open = g.shuffle(free).slice(0, 1 + g.int(Math.min(2, free.length)));
  s.open = open.join('');
  machine.setOpen(open);
  for (let i = 0; i < 100; i++) {
    const ch = A[g.int(26)];
    const { output, path } = machine.press(ch);
    if (open.includes(ch)) assert.equal(output, null, 'a key on an open socket lights nothing');
    if (output !== null) {
      assert.ok(!open.includes(output), 'no lamp behind an open socket');
      assert.notEqual(output, ch);
    } else {
      const returning = path.at(-1).letter;
      assert.ok(open.includes(ch) || open.includes(returning), 'dark only because of an open socket');
    }
  }
});

test('P9 randomised machines never produce a reflector or rotor mapping outside A–Z', () => {
  const g = makeGen(SEED ^ hash('P9'));
  for (let i = 0; i < 200; i++) {
    const machine = new E.Machine(g.config());
    const perm = machine.permutation();
    assert.match(perm, /^[A-Z]{26}$/);
    assert.equal([...perm].sort().join(''), A, 'each position is a permutation');
  }
});
