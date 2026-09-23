// Mutation check for the engine tests: injects classic Enigma implementation
// bugs into a copy of enigma.html and confirms `npm test` fails for each.
// Usage: node tools/mutants.mjs
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(join(root, 'enigma.html'), 'utf8');

const MUTANTS = [
  ['no double step (middle only moves when the right rotor carries)',
    'if (right.atTurnover() || middle.atTurnover()) flags[n - 2] = true;',
    'if (right.atTurnover()) flags[n - 2] = true;'],
  ['left rotor carried by the right rotor instead of the middle',
    'if (middle.atTurnover()) flags[n - 3] = true;',
    'if (right.atTurnover() && middle.atTurnover()) flags[n - 3] = true;'],
  ['turnover read from the wiring core (ring setting applied to the notch)',
    'return this.turnovers.has(this.position);',
    'return this.turnovers.has(mod26(this.position - this.ring));'],
  ['ring setting applied in the wrong direction',
    'const shift = this.position - this.ring;\n      return mod26(this.forwardMap',
    'const shift = this.position + this.ring;\n      return mod26(this.forwardMap'],
  ['rotors step after the circuit closes instead of before',
    'const stepped = this.step();\n      const { output, path } = this.trace(input);',
    'const { output, path } = this.trace(input);\n      const stepped = this.step();'],
  ['Greek wheel steps like a fourth rotor',
    'if (middle.atTurnover()) flags[n - 3] = true;',
    'if (middle.atTurnover()) flags[n - 3] = true;\n      if (n === 4 && this.rotors[1].atTurnover() && middle.atTurnover()) flags[0] = true;'],
  ['plugboard applied only on the way in',
    'c = this.plugMap[c];\n      path.push({ stage: \'lamp\'',
    'path.push({ stage: \'lamp\''],
  ['one transposed letter pair in rotor VIII',
    "FKQHTLXOCBJSPDZRAMEWNIUYGV", "FKQHTLXOCBJSPDZRAMEWNIUYVG"],
  ['one transposed letter pair in UKW C thin',
    "RDOBJNTKVEHMLFCWZAXGYIPSUQ", "RDOBJNTKVEHMLFCWZAXGYIPUSQ"],
  ['rotor VI with a single notch',
    "wiring: 'JPGVOUMFYQBENHZRDKASXLICTW', turnovers: 'ZM'", "wiring: 'JPGVOUMFYQBENHZRDKASXLICTW', turnovers: 'Z'"],
  ['backward path uses the forward wiring',
    'return mod26(this.backwardMap[mod26(c + shift)] - shift);',
    'return mod26(this.forwardMap[mod26(c + shift)] - shift);'],
  ['thumbwheel turning carries to the next rotor',
    'rotor.position = mod26(rotor.position + delta);\n      return rotor.position;',
    'rotor.position = mod26(rotor.position + delta);\n      if (slot > 0 && rotor.atTurnover()) this.rotors[slot - 1].position = mod26(this.rotors[slot - 1].position + 1);\n      return rotor.position;'],
];

const dir = mkdtempSync(join(tmpdir(), 'enigma-mutants-'));
let survived = 0;
for (const [name, from, to] of MUTANTS) {
  if (!html.includes(from)) {
    console.log(`?? ${name}: pattern not found (update tools/mutants.mjs)`);
    survived++;
    continue;
  }
  const file = join(dir, 'enigma.html');
  writeFileSync(file, html.replace(from, to));
  const run = spawnSync(process.execPath, ['--test', 'tests/engine.test.mjs', 'tests/properties.test.mjs'], {
    cwd: root, env: { ...process.env, ENIGMA_HTML: file }, encoding: 'utf8',
  });
  const failed = /# fail (\d+)/.exec(run.stdout)?.[1] ?? '?';
  const killed = run.status !== 0;
  if (!killed) survived++;
  console.log(`${killed ? 'killed  ' : 'SURVIVED'} ${name}  (${failed} failing tests)`);
}
rmSync(dir, { recursive: true, force: true });
console.log(survived ? `\n${survived} mutant(s) survived` : '\nAll mutants killed.');
process.exit(survived ? 1 : 0);
