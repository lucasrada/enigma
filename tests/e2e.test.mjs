// End-to-end tests: drive the real page in Chromium and check that what the
// interface does matches the engine (SPEC.md §4). Run with `npm run test:e2e`.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { HTML_PATH, loadEngine } from './load-engine.mjs';

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
  await typeKeys(page, text);
  const state = await uiState(page);
  const expected = new E.Machine({ model: 'I' }).encrypt(text);
  assert.equal(state.padIn, text);
  assert.equal(state.padOut, expected);
  assert.equal(await positions(page), (() => { const m = new E.Machine({ model: 'I' }); m.encrypt(text); return m.getPositions(); })());
  // The default key is the textbook one: AAAAA → BDZGO.
  const fresh = await open();
  await typeKeys(fresh.page, 'AAAAA');
  assert.equal((await uiState(fresh.page)).padOut, 'BDZGO');
  await fresh.page.close();
  await page.close();
});

test('a lamp is lit only while its key is held down', async () => {
  const { page } = await open();
  await page.keyboard.down('a');
  await page.waitForFunction(() => document.querySelectorAll('.lamp.lit').length === 1);
  assert.deepEqual(await litLamps(page), ['B']);
  assert.equal(await page.locator('.key[data-letter="A"]').getAttribute('class'), 'key down');
  await page.waitForTimeout(250);
  assert.deepEqual(await litLamps(page), ['B'], 'still lit while held');
  await page.keyboard.up('a');
  await page.waitForFunction(() => document.querySelectorAll('.lamp.lit').length === 0);
  assert.equal(await page.locator('.key[data-letter="A"]').getAttribute('class'), 'key');
  await page.close();
});

test('clicking and holding a key with the mouse works like a key press', async () => {
  const { page } = await open();
  const box = await page.locator('.key[data-letter="Q"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const expected = new E.Machine({ model: 'I' }).press('Q').output;
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
  assert.equal(await positions(page), 'AAE');
  assert.equal(await wheel.getAttribute('aria-valuetext'), '05');
  // Keyboard on the focused middle wheel: from A down to Z, no carry.
  const middle = page.locator('.wheel-slot').nth(1);
  await middle.focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await positions(page), 'AZE');
  assert.equal(await middle.getAttribute('aria-valuetext'), '26');
  // Scroll wheel on the left wheel.
  const left = await page.locator('.wheel-slot').nth(0).boundingBox();
  await page.mouse.move(left.x + left.width / 2, left.y + left.height / 2);
  await page.mouse.wheel(0, -30);
  assert.equal(await positions(page), 'BZE');
  await page.close();
});

test('the power switch darkens the lamps, but the rotors still step', async () => {
  const { page } = await open();
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
  assert.equal(await positions(page), 'AAC', 'both presses stepped the rotors');
  assert.equal((await uiState(page)).padOut, 'B·');
  assert.match(await page.textContent('#pad-note'), /aus/);
  await page.close();
});

test('Eintasten types a text through the keys and lamps', async () => {
  const { page } = await open();
  await page.fill('#feed-text', 'Heil dem Wetterbericht? Nein: WETTER BISKAYA');
  await page.fill('#feed-speed', '30');
  await page.click('#feed-go');
  await page.waitForFunction(() => !window.enigma.state.feeding && window.enigma.state.padIn.length > 0, null, { timeout: 15000 });
  const letters = 'HEILDEMWETTERBERICHTNEINWETTERBISKAYA';
  const state = await uiState(page);
  assert.equal(state.padIn, letters);
  assert.equal(state.padOut, new E.Machine({ model: 'I' }).encrypt(letters));
  await page.close();
});
