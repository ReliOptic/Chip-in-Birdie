// Stage-2 regression: 8-way resize, shapes, text formatting, image upload + crop.
const {open, SP} = require('./h'); const assert = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
(async () => {
  const {p, errs, close} = await open({db:true});
  await p.click('#thumbs .thumb[data-id="why"]'); await p.waitForTimeout(150);
  const desel = async () => { const c = await p.$eval('#canvas', x => x.getBoundingClientRect().toJSON()); await p.mouse.click(c.x + c.width - 3, c.y + c.height * 0.55); await p.waitForTimeout(80); };
  const rect = async id => p.$eval(`#canvas .el[data-id="${id}"]`, x => x.getBoundingClientRect().toJSON());
  const id = await p.evaluate(() => __st.cur().els[3].id); let r = await rect(id);
  await p.mouse.click(r.x + 30, r.y + 30); await p.waitForTimeout(150);
  assert(await p.$$eval(`#canvas .el[data-id="${id}"] .handle`, a => a.length) === 8, 'eight resize handles');
  const before = await p.evaluate(i => { const e = __st.cur().els.find(x => x.id === i); return {x:e.x, w:e.w, r:e.x + e.w}; }, id);
  const hw = await p.$eval(`#canvas .el[data-id="${id}"] .h-w`, x => x.getBoundingClientRect().toJSON());
  const K = r.width / before.w;
  await p.mouse.move(hw.x + hw.width / 2, hw.y + hw.height / 2); await p.mouse.down(); await p.mouse.move(hw.x - 60 * K, hw.y + hw.height / 2, {steps:6}); await p.mouse.up(); await p.waitForTimeout(150);
  const after = await p.evaluate(i => { const e = __st.cur().els.find(x => x.id === i); return {x:e.x, w:e.w, r:e.x + e.w}; }, id);
  assert(Math.abs(after.r - before.r) <= 4 && after.w > before.w + 40, 'west handle grows left, right edge fixed');
  await p.keyboard.press('Control+z'); await p.waitForTimeout(150);
  assert(await p.evaluate(i => __st.cur().els.find(x => x.id === i).w, id) === before.w, 'undo resize');
  // rotated resize keeps the opposite corner fixed
  await p.evaluate(i => { const e = __st.cur().els.find(x => x.id === i); e.rot = 30; }, id); await p.click('#thumbs .thumb[data-id="why"]'); await p.waitForTimeout(100);
  r = await rect(id); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await p.waitForTimeout(100);
  const corner = () => p.evaluate(i => { const e = __st.cur().els.find(x => x.id === i); const t = e.rot * Math.PI / 180; const cx = e.x + e.w / 2, cy = e.y + e.h / 2; const ax = -e.w / 2, ay = -e.h / 2; return [cx + ax * Math.cos(t) - ay * Math.sin(t), cy + ax * Math.sin(t) + ay * Math.cos(t)]; }, id);
  const c0 = await corner(); const se = await p.$eval(`#canvas .el[data-id="${id}"] .h-se`, x => x.getBoundingClientRect().toJSON());
  await p.mouse.move(se.x + 7, se.y + 7); await p.mouse.down(); await p.mouse.move(se.x + 7 + 50, se.y + 7 + 30, {steps:5}); await p.mouse.up(); await p.waitForTimeout(100);
  const c1 = await corner(); assert(Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) < 6, 'rotated resize keeps opposite corner fixed');
  // shapes
  await p.keyboard.press('Escape'); await desel(); await p.waitForTimeout(100); await p.click('#panel [data-add="ellipse"]'); await p.waitForTimeout(150);
  assert(await p.evaluate(() => __st.curEl().shape) === 'ellipse', 'add ellipse');
  await p.click('#panel [data-shape="arrow"]'); await p.waitForTimeout(100);
  assert(await p.$eval(`#canvas .el[data-id="${await p.evaluate(() => __st.sel())}"] svg path`, x => !!x), 'arrow renders with head');
  // text: list + font
  const tid = await p.evaluate(() => __st.cur().els[1].id); r = await rect(tid); await p.keyboard.press('Escape'); await p.mouse.click(r.x + 10, r.y + 8); await p.waitForTimeout(100);
  await p.click('#panel [data-fmt="list"]'); await p.waitForTimeout(100);
  const hh = await p.evaluate(() => [__st.sel(), __st.curEl() && __st.curEl().html]); assert(/^<ul><li>/.test(hh[1] || ''), 'bullet list applied ' + JSON.stringify(hh));
  await p.selectOption('#f_font', 'serif'); await p.waitForTimeout(100);
  assert(await p.evaluate(() => __st.curEl().font) === 'serif', 'font family set');
  // image upload + crop
  await p.keyboard.press('Escape'); await desel(); await p.waitForTimeout(100);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#panel [data-add="upload"]')]); await fc.setFiles(SP + '/test.png'); await p.waitForTimeout(800);
  const im = await p.evaluate(() => __st.curEl()); assert(im && im.type === 'img' && /^data:image\/webp/.test(im.src), 'image uploaded (data URL fallback)');
  await p.$eval('#panel input[data-k="cz"]', x => { x.value = '2'; x.dispatchEvent(new Event('input', {bubbles:true})); }); await p.waitForTimeout(100);
  assert(await p.evaluate(() => __st.curEl().cz) === 2, 'crop zoom');
  await p.waitForTimeout(800);
  const stored = await p.evaluate(() => { const d = __fdb.docs.get('slides5/why'); return d && Object.values(d.els).some(e => e.type === 'img' && e.src && e.cz === 2); });
  assert(stored, 'uploaded image survives save + sanitize');
  assert(!errs.length, 'no page errors ' + errs.join('|'));
  await close();
})();
