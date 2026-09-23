// Screenshot scene: a message typed on the pad and one key held down.
export default async function (page) {
  for (const ch of 'WETTERVORHERSAGEBISKAYA') {
    await page.keyboard.down(ch.toLowerCase());
    await page.keyboard.up(ch.toLowerCase());
  }
  await page.keyboard.down('e');
  await page.waitForFunction(() => document.querySelectorAll('.lamp.lit').length === 1);
  await page.waitForTimeout(150);
}
