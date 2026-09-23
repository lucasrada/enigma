// Screenshot scene: the M3 set to the Scharnhorst key.
export default async function (page) {
  await page.evaluate(() => window.enigma.configure({ model: 'M3', reflector: 'B', rotors: ['III', 'VI', 'VIII'], rings: 'AHM', positions: 'UZV', plugboard: 'AN EZ HK IJ LR MQ OT PV SW UX' }));
  await page.evaluate(() => window.enigma.cablesSettled());
  await page.waitForTimeout(1200);
}
