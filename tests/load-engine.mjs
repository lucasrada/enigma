// Loads the cipher engine straight out of enigma.html, so the tests always run
// the exact code that ships in the page (SPEC §3.1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ENIGMA_HTML lets tools/mutants.mjs point the suite at a mutated copy.
export const HTML_PATH = process.env.ENIGMA_HTML || fileURLToPath(new URL('../enigma.html', import.meta.url));

export function engineSource() {
  const html = readFileSync(HTML_PATH, 'utf8');
  const match = /<script id="enigma-engine">([\s\S]*?)<\/script>/.exec(html);
  if (!match) throw new Error('enigma.html has no <script id="enigma-engine"> block');
  return match[1];
}

// The script attaches EnigmaEngine to `globalThis`. Running it with a
// shadowed `globalThis` keeps the real global clean while creating all
// objects in this realm (vm contexts would make deepStrictEqual fail on
// cross-realm arrays).
export function loadEngine() {
  const sandbox = {};
  // eslint-disable-next-line no-new-func
  new Function('globalThis', `${engineSource()}\n//# sourceURL=enigma.html#enigma-engine`)(sandbox);
  if (!sandbox.EnigmaEngine) throw new Error('The engine script did not define EnigmaEngine');
  return sandbox.EnigmaEngine;
}
