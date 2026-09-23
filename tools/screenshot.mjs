// Milestone screenshots (SPEC §6). Usage:
//   node tools/screenshot.mjs [outDir] [--only=name,name] [--script=file.mjs] [--jpeg]
// Captures the page at several viewport sizes plus a close-up of the machine,
// and prints any console errors or failed requests.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const outDir = resolve(root, args.find((a) => !a.startsWith('--')) ?? 'docs/screenshots/latest');
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const scriptArg = args.find((a) => a.startsWith('--script='))?.slice(9);
const jpeg = args.includes('--jpeg');
mkdirSync(outDir, { recursive: true });

const VIEWS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'tablet-1024', width: 1024, height: 1366 },
  { name: 'phone-400', width: 400, height: 860, fullPage: true },
  { name: 'machine', width: 1600, height: 1000, element: '#scene-wrap', deviceScaleFactor: 2 },
];

const url = pathToFileURL(resolve(root, 'enigma.html')).href;
const browser = await chromium.launch();
const setup = scriptArg ? (await import(pathToFileURL(resolve(root, scriptArg)).href)).default : null;
for (const v of VIEWS) {
  if (only && !only.includes(v.name)) continue;
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor ?? 1 });
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) problems.push(`external request: ${r.url()}`); });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const loadMs = Date.now() - t0;
  if (setup) await setup(page, v);
  await page.waitForTimeout(400);
  const file = resolve(outDir, `${v.name}.${jpeg ? 'jpg' : 'png'}`);
  const opts = jpeg ? { path: file, type: 'jpeg', quality: 82 } : { path: file };
  if (v.element) await page.locator(v.element).screenshot(opts);
  else await page.screenshot({ ...opts, fullPage: Boolean(v.fullPage) });
  const scroll = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: innerWidth }));
  console.log(`${v.name}: ${file} (load ${loadMs} ms, page ${scroll.w}×${scroll.h}${scroll.w > scroll.vw ? ' HORIZONTAL SCROLL!' : ''})`);
  for (const p of problems) console.log(`  ${p}`);
  await page.close();
}
await browser.close();
