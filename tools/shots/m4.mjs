// Screenshot scene: the M4 set to the U-264 key, lamp lit.
export default async function (page) {
  await page.evaluate(() => window.enigma.configure({ model: 'M4', reflector: 'B-thin', rotors: ['Beta', 'II', 'IV', 'I'], rings: 'AAAV', positions: 'VJNA', plugboard: 'AT BL DF GJ HM NW OP QY RZ VX' }));
  await page.evaluate(() => window.enigma.cablesSettled());
  await page.waitForTimeout(1200);
  await page.keyboard.down('n');
  await page.waitForFunction(() => document.querySelectorAll('.lamp.lit').length === 1);
}
