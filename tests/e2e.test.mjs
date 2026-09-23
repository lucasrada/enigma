// End-to-end tests: drive the real page in Chromium and check that what the
// interface does matches the engine (SPEC.md §4). Run with `npm run test:e2e`.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { HTML_PATH, loadEngine } from './load-engine.mjs';
import { HISTORICAL } from './vectors.mjs';

const E = loadEngine();
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open(viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('request', (r) => {
    const url = r.url();
    if (!/^(file|data|blob):/.test(url)) problems.push(`external request: ${url}`);
  });
  await page.goto(pathToFileURL(HTML_PATH).href);
  await page.evaluate(() => document.fonts.ready);
  return { page, problems };
}

const uiState = (page) => page.evaluate(() => window.enigma.state);
const startConfig = (page) => page.evaluate(() => window.enigma.machine.config());
const positions = (page) => page.evaluate(() => window.enigma.machine.getPositions());
const litLamps = (page) => page.evaluate(() => [...document.querySelectorAll('.lamp.lit')].map((n) => n.dataset.letter));

async function typeKeys(page, text) {
  for (const ch of text) {
    await page.keyboard.down(ch.toLowerCase());
    await page.keyboard.up(ch.toLowerCase());
  }
}

test('the page loads without errors and makes no network requests', async () => {
  const { page, problems } = await open();
  await typeKeys(page, 'ENIGMA');
  await page.waitForTimeout(200);
  assert.deepEqual(problems, []);
  assert.equal(await page.title(), 'Chiffriermaschine Enigma');
  await page.close();
});

test('typing on the physical keyboard enciphers exactly like the engine', async () => {
  const { page } = await open();
  const text = 'DIEENIGMAWARNICHTUNKNACKBARXVIELEWARENDAVONUEBERZEUGT';
  const start = await startConfig(page);
  await typeKeys(page, text);
  const state = await uiState(page);
  const reference = new E.Machine(start);
  assert.equal(state.padIn, text);
  assert.equal(state.padOut, reference.encrypt(text));
  assert.equal(await positions(page), reference.getPositions());
  await page.close();
});

test('a lamp is lit only while its key is held down', async () => {
  const { page } = await open();
  const expected = new E.Machine(await startConfig(page)).press('A').output;
  await page.keyboard.down('a');
  await page.waitForFunction(() => document.querySelectorAll('.lamp.lit').length === 1);
  assert.deepEqual(await litLamps(page), [expected]);
  assert.equal(await page.locator('.key[data-letter="A"]').getAttribute('class'), 'key down');
  await page.waitForTimeout(250);
  assert.deepEqual(await litLamps(page), [expected], 'still lit while held');
  await page.keyboard.up('a');
  await page.waitForFunction(() => document.querySelectorAll('.lamp.lit').length === 0);
  assert.equal(await page.locator('.key[data-letter="A"]').getAttribute('class'), 'key');
  await page.waitForTimeout(250);
  assert.deepEqual(await litLamps(page), [], 'stays dark after release');
  await page.close();
});

test('clicking and holding a key with the mouse works like a key press', async () => {
  const { page } = await open();
  const expected = new E.Machine(await startConfig(page)).press('Q').output;
  const box = await page.locator('.key[data-letter="Q"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForFunction((l) => window.enigma.state.lit === l, expected);
  await page.mouse.up();
  await page.waitForFunction(() => window.enigma.state.lit === null);
  assert.equal((await uiState(page)).padOut, expected);
  await page.close();
});

test('thumbwheels turn one rotor, with no carry, and Enigma I windows show numbers', async () => {
  const { page } = await open();
  const wheel = page.locator('.wheel-slot').nth(2);
  const box = await wheel.boundingBox();
  // Drag the right wheel up by four detents.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 46, { steps: 8 });
  await page.mouse.up();
  assert.equal(await positions(page), 'BLE', 'from BLA, four detents on the right wheel');
  assert.equal(await wheel.getAttribute('aria-valuetext'), '05');
  // Keyboard on the focused middle wheel: L (12) down past its neighbours, no carry.
  const middle = page.locator('.wheel-slot').nth(1);
  await middle.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowDown');
  assert.equal(await positions(page), 'BZE');
  assert.equal(await middle.getAttribute('aria-valuetext'), '26');
  // Scroll wheel on the left wheel.
  const left = await page.locator('.wheel-slot').nth(0).boundingBox();
  await page.mouse.move(left.x + left.width / 2, left.y + left.height / 2);
  await page.mouse.wheel(0, -30);
  assert.equal(await positions(page), 'CZE');
  await page.close();
});

test('the power switch darkens the lamps, but the rotors still step', async () => {
  const { page } = await open();
  const reference = new E.Machine(await startConfig(page));
  await page.click('#power'); // dkl. Batterie
  assert.equal((await uiState(page)).power, 'dim');
  await page.keyboard.down('a');
  await page.waitForFunction(() => document.querySelectorAll('.lamp.lit').length === 1);
  await page.keyboard.up('a');
  await page.click('#power'); // aus
  assert.equal((await uiState(page)).power, 'off');
  await page.keyboard.down('a');
  await page.waitForTimeout(120);
  assert.deepEqual(await litLamps(page), []);
  await page.keyboard.up('a');
  const first = reference.press('A').output;
  reference.press('A');
  assert.equal(await positions(page), reference.getPositions(), 'both presses stepped the rotors');
  assert.equal((await uiState(page)).padOut, `${first}·`);
  assert.match(await page.textContent('#pad-note'), /aus/);
  await page.close();
});

test('Eintasten types a text through the keys and lamps', async () => {
  const { page } = await open();
  const reference = new E.Machine(await startConfig(page));
  await page.fill('#feed-text', 'Heil dem Wetterbericht? Nein: WETTER BISKAYA');
  await page.fill('#feed-speed', '30');
  await page.click('#feed-go');
  await page.waitForFunction(() => !window.enigma.state.feeding && window.enigma.state.padIn.length > 0, null, { timeout: 15000 });
  const letters = 'HEILDEMWETTERBERICHTNEINWETTERBISKAYA';
  const state = await uiState(page);
  assert.equal(state.padIn, letters);
  assert.equal(state.padOut, reference.encrypt(letters));
  await page.close();
});

// --- Plugboard (M4) ----------------------------------------------------------

const pairsOf = (page) => page.evaluate(() => window.enigma.machine.pairs().join(' '));
const openOf = (page) => page.evaluate(() => window.enigma.machine.config().open);

async function socketPoint(page, letter) {
  const socket = page.locator(`.socket[data-letter="${letter}"]`);
  await socket.scrollIntoViewIfNeeded();
  const b = await socket.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height * 0.595 };
}

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 12, from.y - 12, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 14 });
  await page.mouse.up();
}

test('the machine opens with ten cables plugged and two spares in the lid', async () => {
  const { page } = await open();
  assert.equal(await pairsOf(page), 'AV BS CG DL FU HZ IN KM OW RX');
  assert.equal((await page.evaluate(() => window.enigma.cables)).length, 10);
  assert.equal(await page.locator('.spare:not([hidden])').count(), 2);
  await page.close();
});

test('dragging a plug to another socket rewires the plugboard', async () => {
  const { page } = await open({ width: 1600, height: 1400 });
  await drag(page, await socketPoint(page, 'V'), await socketPoint(page, 'Q'));
  await page.waitForTimeout(100);
  assert.equal(await pairsOf(page), 'AQ BS CG DL FU HZ IN KM OW RX');
  // Typing now follows the new wiring.
  const start = await page.evaluate(() => window.enigma.machine.config());
  await typeKeys(page, 'QUAKE');
  assert.equal((await uiState(page)).padOut, new E.Machine(start).encrypt('QUAKE'));
  await page.close();
});

test('a cable with one loose end opens the circuit: no lamp, but the rotors step', async () => {
  const { page } = await open({ width: 1600, height: 1400 });
  const v = await socketPoint(page, 'V');
  // Pull the plug out of V and drop it on the flap: A's cable now ends loose.
  await drag(page, v, { x: v.x - 120, y: v.y + 170 });
  await page.waitForTimeout(200);
  assert.equal(await pairsOf(page), 'BS CG DL FU HZ IN KM OW RX');
  assert.equal(await openOf(page), 'A');
  const before = await positions(page);
  await page.keyboard.down('a');
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.enigma.state.lit), null);
  await page.keyboard.up('a');
  assert.notEqual(await positions(page), before, 'the rotors stepped anyway');
  assert.match(await page.textContent('#pad-note'), /loose end/);
  const cables = await page.evaluate(() => window.enigma.cables);
  assert.ok(cables.some((c) => c.includes('A') && c.includes(null)), 'A holds a cable whose other end is loose');
  await page.close();
});

test('clicking two empty sockets joins them with a spare cable from the lid', async () => {
  const { page } = await open({ width: 1600, height: 1400 });
  await page.locator('.socket[data-letter="Q"]').scrollIntoViewIfNeeded();
  await page.click('.socket[data-letter="Q"]');
  assert.match(await page.textContent('#pad-note'), /Socket Q chosen/);
  await page.click('.socket[data-letter="T"]');
  await page.waitForFunction(() => window.enigma.machine.pairs().includes('QT'));
  assert.equal(await page.locator('.spare:not([hidden])').count(), 1);
  await page.close();
});

test('Enter on a plugged socket takes its cable out (keyboard access)', async () => {
  const { page } = await open();
  await page.locator('.socket[data-letter="K"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  assert.equal(await pairsOf(page), 'AV BS CG DL FU HZ IN OW RX');
  await page.close();
});

test('a spare cable can be dragged out of the lid into a socket', async () => {
  const { page } = await open({ width: 1600, height: 1400 });
  const spare = page.locator('.spare').first();
  await spare.scrollIntoViewIfNeeded();
  const b = await spare.boundingBox();
  const p = await socketPoint(page, 'P');
  await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.75);
  await page.mouse.down();
  await page.mouse.move(p.x, p.y, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  assert.equal(await openOf(page), 'P', 'one end in P, the other loose');
  assert.equal(await page.locator('.spare:not([hidden])').count(), 1);
  await page.close();
});

// --- Key sheet, models and historical messages (M5) -------------------------

const windowLabels = (page) => page.evaluate(() => [...document.querySelectorAll('.wheel-slot')].map((n) => n.getAttribute('aria-valuetext')));

test('choosing a model changes the rotor windows: numbers on Enigma I, letters on M3, four on M4', async () => {
  const { page } = await open();
  assert.deepEqual(await windowLabels(page), ['02', '12', '01']);
  await page.check('#model-M3');
  await page.waitForFunction(() => window.enigma.machine.model === 'M3');
  assert.equal(await page.locator('.rotor-window').count(), 3);
  assert.deepEqual(await windowLabels(page), ['A', 'A', 'A']);
  assert.equal(await pairsOf(page), 'AV BS CG DL FU HZ IN KM OW RX', 'the cables stay plugged');
  await page.check('#model-M4');
  await page.waitForFunction(() => window.enigma.machine.model === 'M4');
  assert.equal(await page.locator('.rotor-window').count(), 4);
  assert.equal(await page.locator('.cover-lock').count(), 1, 'the M4 rotor cover has a lock');
  assert.deepEqual(await page.evaluate(() => window.enigma.machine.config().rotors), ['Beta', 'I', 'II', 'III']);
  assert.equal(await page.inputValue('#ukw'), 'B-thin');
  await page.check('#model-I');
  await page.waitForFunction(() => window.enigma.machine.model === 'I');
  assert.deepEqual(await windowLabels(page), ['01', '01', '01']);
  await page.close();
});

test('the key sheet sets the machine, and follows the rotors as they move', async () => {
  const { page } = await open();
  await page.selectOption('#ukw', 'C');
  await page.selectOption('#rotor-0', 'V');
  await page.selectOption('#rotor-1', 'I');
  await page.selectOption('#rotor-2', 'III');
  for (const [i, v] of ['16', '11', '13'].entries()) await page.fill(`#ring-${i}`, v);
  for (const [i, v] of ['01', '26', '22'].entries()) await page.fill(`#start-${i}`, v);
  await page.fill('#stecker', 'co di fr hu jw ls tx');
  await page.click('#key-form button[type="submit"]');
  await page.evaluate(() => window.enigma.cablesSettled());
  const config = await page.evaluate(() => window.enigma.machine.config());
  assert.deepEqual(
    { reflector: config.reflector, rotors: config.rotors, rings: config.rings, positions: config.positions, plugboard: config.plugboard },
    { reflector: 'C', rotors: ['V', 'I', 'III'], rings: 'PKM', positions: 'AZV', plugboard: 'CO DI FR HU JW LS TX' },
  );
  assert.equal(await page.locator('.spare:not([hidden])').count(), 2, 'unused cables went back to the lid');
  const reference = new E.Machine(config);
  await typeKeys(page, 'FUNKSPRUCH');
  assert.equal((await uiState(page)).padOut, reference.encrypt('FUNKSPRUCH'));
  assert.equal(await page.inputValue('#start-2'), E.labelFor('I', E.ALPHABET.indexOf(reference.getPositions()[2])), 'Grundstellung follows the windows');
  await page.close();
});

test('an impossible key is refused with a readable note', async () => {
  const { page } = await open();
  await page.selectOption('#rotor-1', 'II');
  await page.click('#key-form button[type="submit"]');
  assert.match(await page.textContent('#sheet-note'), /only be used once/);
  await page.fill('#stecker', 'AB BC');
  await page.selectOption('#rotor-1', 'IV');
  await page.click('#key-form button[type="submit"]');
  assert.match(await page.textContent('#sheet-note'), /plugged more than once/);
  await page.close();
});

for (const id of ['H1', 'H2', 'H5']) {
  const vector = HISTORICAL.find((h) => h.id === id);
  test(`${id}: loading "${vector.name}" deciphers it through the keys and lamps`, async () => {
    const { page } = await open({ width: 1600, height: 1200 });
    await page.evaluate((mid) => window.enigma.play(mid, { perSecond: 60 }), id);
    const state = await uiState(page);
    assert.equal(state.padOut, vector.plaintext);
    assert.equal(state.padIn, vector.ciphertext.replace(/[^A-Z]/g, ''));
    if (vector.finalPositions) assert.equal(await positions(page), vector.finalPositions);
    assert.equal(await pairsOf(page), new E.Machine(vector.setup).pairs().join(' '));
    assert.ok(await page.locator('.archive .reading').isVisible(), 'the reading is shown');
    await page.close();
  });
}
