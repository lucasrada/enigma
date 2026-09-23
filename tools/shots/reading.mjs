// Screenshot scene: the Barbarossa message deciphered.
export default async function (page) {
  await page.evaluate(() => window.enigma.play('H2', { perSecond: 80 }));
  await page.waitForTimeout(600);
}
