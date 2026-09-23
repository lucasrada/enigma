// Screenshot scene: a plug lifted out of V and held over the plugboard.
export default async function (page) {
  const socket = page.locator('.socket[data-letter="V"]');
  await socket.scrollIntoViewIfNeeded();
  const b = await socket.boundingBox();
  const x = b.x + b.width / 2;
  const y = b.y + b.height * 0.595;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y - 30, { steps: 5 });
  await page.mouse.move(x + 190, y - 150, { steps: 10 });
  await page.waitForTimeout(700);
}
