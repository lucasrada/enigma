// Engine tests against published vectors (RESEARCH.md §2) and the API contract
// (SPEC.md §3). Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './load-engine.mjs';
import { BASIC, HISTORICAL, SYNTHETIC } from './vectors.mjs';

const E = loadEngine();
const letters = (s) => s.replace(/[^A-Z]/gi, '').toUpperCase();

test('component tables match RESEARCH.md §1.2–1.3', async (t) => {
  await t.test('every rotor wiring is a permutation of A–Z', () => {
    for (const [name, rotor] of Object.entries(E.ROTORS)) {
      assert.equal([...rotor.wiring].sort().join(''), E.ALPHABET, `rotor ${name}`);
    }
  });

  await t.test('every reflector is an involution without fixed points', () => {
    for (const [name, { wiring }] of Object.entries(E.REFLECTORS)) {
      for (let i = 0; i < 26; i++) {
        const j = E.toIndex(wiring[i]);
        assert.notEqual(j, i, `UKW ${name} maps ${E.ALPHABET[i]} to itself`);
        assert.equal(E.toIndex(wiring[j]), i, `UKW ${name} is not reciprocal at ${E.ALPHABET[i]}`);
      }
    }
  });

  await t.test('turnover letters (window) and physical notch letters are 8 apart', () => {
    const expected = { I: 'Q', II: 'E', III: 'V', IV: 'J', V: 'Z', VI: 'ZM', VII: 'ZM', VIII: 'ZM', Beta: '', Gamma: '' };
    for (const [name, turnovers] of Object.entries(expected)) {
      const rotor = E.ROTORS[name];
      assert.equal(rotor.turnovers, turnovers, `rotor ${name} turnover`);
      const shifted = [...rotor.turnovers].map((c) => E.ALPHABET[(E.toIndex(c) + 8) % 26]).sort().join('');
      assert.equal(shifted, [...rotor.notches].sort().join(''), `rotor ${name} notch`);
    }
  });

  await t.test('model component sets', () => {
    assert.deepEqual([...E.MODELS.I.rotors], ['I', 'II', 'III', 'IV', 'V']);
    assert.deepEqual([...E.MODELS.I.reflectors], ['A', 'B', 'C']);
    assert.deepEqual([...E.MODELS.M3.reflectors], ['B', 'C']);
    assert.equal(E.MODELS.M3.rotors.length, 8);
    assert.deepEqual([...E.MODELS.M4.greek], ['Beta', 'Gamma']);
    assert.deepEqual([...E.MODELS.M4.reflectors], ['B-thin', 'C-thin']);
    assert.equal(E.MODELS.I.labels, 'numbers');
    assert.equal(E.MODELS.M3.labels, 'letters');
  });
});

test('V1: AAAAA → BDZGO (Enigma I, UKW B, I-II-III, rings 01 01 01, start AAA)', () => {
  const v = BASIC.V1;
  assert.equal(new E.Machine(v.setup).encrypt(v.plaintext), v.ciphertext);
  assert.equal(new E.Machine(v.setup).encrypt(v.ciphertext), v.plaintext);
});

for (const id of ['V2', 'V3']) {
  const v = BASIC[id];
  test(`${id}: double step ${v.rotors.join('-')} from ${v.start}: ${v.sequence.join(' → ')}`, () => {
    const m = new E.Machine({ model: 'I', rotors: v.rotors, positions: v.start });
    const seen = v.sequence.map(() => (m.press('A'), m.getPositions()));
    assert.deepEqual(seen, v.sequence);
  });
}

for (const h of HISTORICAL) {
  test(`${h.id}: ${h.name}`, async (t) => {
    const machine = new E.Machine(h.setup);

    if (h.indicator) {
      await t.test(`indicator: ${h.indicator.plain} at ${h.indicator.start} ↔ ${h.indicator.cipher}`, () => {
        machine.setPositions(h.indicator.start);
        assert.equal(machine.encrypt(h.indicator.plain), h.indicator.cipher);
        machine.setPositions(h.indicator.start);
        assert.equal(machine.encrypt(h.indicator.cipher), h.indicator.plain);
      });
    }

    await t.test(`decrypts at message key ${h.key}`, () => {
      machine.setPositions(h.key);
      assert.equal(machine.encrypt(letters(h.ciphertext)), h.plaintext);
      if (h.finalPositions) assert.equal(machine.getPositions(), h.finalPositions);
    });

    await t.test('re-encrypting the plaintext gives the published ciphertext', () => {
      machine.setPositions(h.key);
      assert.equal(machine.encrypt(h.plaintext), letters(h.ciphertext));
    });

    if (h.equivalentSetup) {
      await t.test(`the other published setting (rings ${h.equivalentSetup.rings}, start ${h.equivalentSetup.key}) is equivalent`, () => {
        const other = new E.Machine({ ...h.setup, rings: h.equivalentSetup.rings, positions: h.equivalentSetup.key });
        assert.equal(other.encrypt(letters(h.ciphertext)), h.plaintext);
      });
    }
  });
}

for (const s of SYNTHETIC) {
  test(`${s.id}: ${s.setup.model} ${s.setup.rotors.join('-')} UKW ${s.setup.reflector} rings ${s.setup.rings} (verified on ${s.verifiedWith.length} simulator(s))`, () => {
    const machine = new E.Machine({ ...s.setup, positions: s.key });
    assert.equal(machine.encrypt(s.ciphertext), s.plaintext);
  });
}

test('rotor windows are labelled with numbers on Enigma I and letters on M3/M4', () => {
  assert.deepEqual(new E.Machine({ model: 'I', positions: '01 17 26' }).windowLabels(), ['01', '17', '26']);
  assert.deepEqual(new E.Machine({ model: 'M3', positions: 'AQZ' }).windowLabels(), ['A', 'Q', 'Z']);
  assert.deepEqual(new E.Machine({ model: 'M4', positions: 'VJNA' }).windowLabels(), ['V', 'J', 'N', 'A']);
  assert.equal(E.labelFor('I', 21), '22');
  assert.equal(E.labelFor('M4', 21), 'V');
});

test('settings accept letters, numbers and lists interchangeably', () => {
  const a = new E.Machine({ model: 'I', rings: '24 13 22', positions: 'ABL' });
  const b = new E.Machine({ model: 'I', rings: 'X M V', positions: [1, 2, 12] });
  const c = new E.Machine({ model: 'I', rings: ['X', 13, '22'], positions: 'A-B-L' });
  assert.equal(a.getRings(), 'XMV');
  assert.equal(b.getRings(), 'XMV');
  assert.equal(c.getRings(), 'XMV');
  assert.equal(b.getPositions(), 'ABL');
  assert.equal(c.getPositions(), 'ABL');
});

test('plugboard accepts letter and numeric pair notation', () => {
  const letters_ = new E.Machine({ model: 'M4', rotors: ['Beta', 'II', 'IV', 'I'], plugboard: 'AT BL DF GJ HM NW OP QY RZ VX' });
  const numbers = new E.Machine({ model: 'M4', rotors: ['Beta', 'II', 'IV', 'I'], plugboard: '1/20 2/12 4/6 7/10 8/13 14/23 15/16 17/25 18/26 22/24' });
  assert.deepEqual(numbers.pairs(), letters_.pairs());
  assert.deepEqual(E.parsePairs('a-v, b/s cg'), ['AV', 'BS', 'CG']);
});

test('invalid configurations are rejected with a readable EnigmaError', () => {
  const bad = [
    [{ model: 'I', rotors: ['I', 'II', 'VI'] }, /cannot use rotor "VI"/],
    [{ model: 'I', reflector: 'B-thin' }, /no reflector/],
    [{ model: 'M3', reflector: 'A' }, /no reflector/],
    [{ model: 'M3', rotors: ['I', 'I', 'III'] }, /only be used once/],
    [{ model: 'M4', rotors: ['I', 'II', 'III', 'IV'] }, /Greek wheel/],
    [{ model: 'M4', rotors: ['Beta', 'Gamma', 'I', 'II'] }, /cannot use rotor "Gamma"/],
    [{ model: 'M4', rotors: ['I', 'II', 'III'] }, /takes 4 rotors/],
    [{ model: 'I', rings: '27 01 01' }, /not in 01–26/],
    [{ model: 'I', positions: 'AB' }, /needs 3 values/],
    [{ model: 'I', plugboard: 'AB AC' }, /plugged more than once/],
    [{ model: 'I', plugboard: 'AA' }, /to itself/],
    [{ model: 'I', plugboard: 'AB CD EF GH IJ KL MN OP QR ST UV WX YZ' }, null],
    [{ model: 'X' }, /Unknown model/],
  ];
  for (const [config, pattern] of bad) {
    if (pattern === null) {
      assert.doesNotThrow(() => new E.Machine(config), 'all 13 pairs fit');
      continue;
    }
    assert.throws(() => new E.Machine(config), (err) => err.name === 'EnigmaError' && pattern.test(err.message), JSON.stringify(config));
  }
  assert.throws(() => E.parsePairs('AB CD EF GH IJ KL MN OP QR ST UV WX YZ AZ'), /At most 13/);
  assert.throws(() => new E.Machine().press('1'), /not a letter/);
});

test('turning a thumbwheel moves only that rotor, with no carry', () => {
  const m = new E.Machine({ model: 'I', rotors: ['I', 'II', 'III'], positions: 'ADU' });
  m.rotate(2, 1); // onto III's turnover letter V
  assert.equal(m.getPositions(), 'ADV');
  m.rotate(2, 1); // and past it
  assert.equal(m.getPositions(), 'ADW');
  for (let i = 0; i < 26; i++) m.rotate(1, 1); // the middle rotor through a full turn, E included
  assert.equal(m.getPositions(), 'ADW');
  for (let i = 0; i < 26; i++) m.rotate(2, -1); // the right rotor backwards through V
  assert.equal(m.getPositions(), 'ADW');
  m.rotate(0, -1);
  assert.equal(m.getPositions(), 'ZDW');
});

test('a half-plugged cable opens the circuit: rotors step but no lamp lights', () => {
  const m = new E.Machine({ model: 'I', positions: 'AAA', open: 'B' });
  const ref = new E.Machine({ model: 'I', positions: 'AAA' });
  // AAAAA → BDZGO on the reference machine: the first lamp would be B.
  const first = m.press('A');
  ref.press('A');
  assert.equal(first.output, null, 'current returning through open socket B is lost');
  assert.equal(m.getPositions(), 'AAB', 'the rotors still stepped');
  assert.equal(m.press('B').output, null, 'pressing B feeds the open socket');
  assert.equal(m.permutation().split('').filter((c) => c === '?').length, 2, 'exactly two letters are dark');
  assert.throws(() => m.plug('B', 'C'), /loose cable/);
  m.unplug('B');
  assert.equal(m.clone().permutation(), m.permutation());
  assert.equal(m.config().open, '');
});

test('press() reports the stepping and the full signal path', () => {
  const m = new E.Machine({ model: 'I', rotors: ['I', 'II', 'III'], positions: 'ADV', plugboard: 'AB' });
  // From ADV the right rotor shows its turnover letter V, so pawl 2 carries
  // the middle rotor (D → E); the middle is not at its turnover yet.
  const r = m.press('A');
  assert.deepEqual(r.stepped, [false, true, true]);
  assert.equal(r.positions, 'AEW');
  // Now the middle rotor shows E, its own turnover: pawl 3 moves the left
  // rotor and the middle rotor again. That second middle step is the double step.
  const r2 = m.press('A');
  assert.deepEqual(r2.stepped, [true, true, true]);
  assert.equal(r2.positions, 'BFX');
  m.setPositions('ADV');
  const stages = r.path.map((p) => p.stage);
  assert.deepEqual(stages, ['key', 'plugboard', 'rotor III', 'rotor II', 'rotor I', 'UKW B', 'rotor I', 'rotor II', 'rotor III', 'lamp']);
  assert.equal(r.path[1].letter, 'B', 'A is steckered to B');
  assert.equal(r.output, r.path.at(-1).letter);
});

test('config() round-trips through the constructor', () => {
  const m = new E.Machine({ model: 'M4', reflector: 'C-thin', rotors: ['Gamma', 'VIII', 'VI', 'V'], rings: '07 14 19 26', positions: 'IBFP', plugboard: 'RX VA HE' });
  const copy = new E.Machine(m.config());
  assert.deepEqual(copy.config(), m.config());
  assert.equal(copy.encrypt('WETTERVORHERSAGE'), m.encrypt('WETTERVORHERSAGE'));
});
