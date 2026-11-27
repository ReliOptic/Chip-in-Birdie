// Stage-1 regression: sanitize, reset, stale badge, slide undo, align, element-level merge.
const {open} = require('./h'); const assert = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
(async () => {
  let {p, errs, close} = await open({db:true});
  // XSS via stored element fields
  await p.evaluate(() => { window.__pwn = 0; __fdb.remoteSet('slides5/fin', {v:2, base:'x', meta:{d:'20', o20:7, kind:'content', sec:1, order:['e1']}, els:{e1:{id:'e1', type:'text', html:'<img src=x onerror="window.__pwn=1">hi', x:100, y:100, w:400, h:80, size:'40px;background:red', align:'left" onmouseover="window.__pwn=2', color:'t1', weight:400}}}); });
  await p.waitForTimeout(300); await p.click('#thumbs .thumb[data-id="fin"]'); await p.waitForTimeout(200);
  await p.mouse.move(400, 300); await p.mouse.move(700, 400); await p.waitForTimeout(100);
  const el = await p.evaluate(() => __st.slides().find(s => s.id === 'fin').els[0]);
  assert(await p.evaluate(() => window.__pwn) === 0 && el.align === 'left' && el.size === 32 && !/onerror/.test(el.html), 'stored fields sanitized, no script ran');
  assert(await p.$('#thumbs .thumb[data-id="fin"] .stl') !== null, 'stale badge shown for copy saved from older original');
  // take original
  await p.click('#canvas', {position:{x:5, y:5}}).catch(() => {}); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.click('#bTakeBase'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => !__fdb.docs.has('slides5/fin')) && await p.evaluate(() => __st.slides().find(s => s.id === 'fin').els.length > 3), 'take original deletes stored copy and restores base');
  // slide add/dup/move undo
  const n0 = await p.$$eval('#thumbs .thumb', a => a.length);
  await p.click('#bAdd'); await p.waitForTimeout(150); await p.keyboard.press('Escape'); await p.evaluate(() => document.activeElement.blur());
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  assert(await p.$$eval('#thumbs .thumb', a => a.length) === n0, 'undo new slide');
  await p.click('#bDup'); await p.waitForTimeout(150); await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  assert(await p.$$eval('#thumbs .thumb', a => a.length) === n0, 'undo duplicate');
  await p.click('#thumbs .thumb:nth-child(5)'); const o0 = (await p.$$eval('#thumbs .thumb', a => a.map(x => x.dataset.id))).join();
  await p.click('#bUp'); await p.waitForTimeout(150); await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  assert((await p.$$eval('#thumbs .thumb', a => a.map(x => x.dataset.id))).join() === o0, 'undo move');
  // align: select two elements on 'why' and align right
  await p.click('#thumbs .thumb[data-id="why"]'); await p.waitForTimeout(150);
  const ids = await p.evaluate(() => __st.cur().els.slice(2, 4).map(e => e.id));
  await p.evaluate(ids => { const c = document.querySelector('#canvas'); }, ids);
  const r = await p.$$eval('#canvas .el', (a, ids) => a.filter(x => ids.includes(x.dataset.id)).map(x => x.getBoundingClientRect().toJSON()), ids);
  await p.mouse.click(r[0].x + 10, r[0].y + 10); await p.keyboard.down('Shift'); await p.mouse.click(r[1].x + 10, r[1].y + 10); await p.keyboard.up('Shift'); await p.waitForTimeout(150);
  await p.click('#panel [data-al="hc"]'); await p.waitForTimeout(150);
  const c2 = await p.evaluate(ids => __st.cur().els.filter(e => ids.includes(e.id)).map(e => e.x + e.w / 2), ids);
  assert(Math.abs(c2[0] - c2[1]) <= 1, 'center align uses selection box');
  // element-level merge: local edit of title while remote edits another element
  await p.keyboard.press('Escape');
  await p.evaluate(() => { const s = __st.cur(); s.els[0].html = 'LOCAL TITLE'; });
  await p.evaluate(() => document.querySelector('#bAdd') && 0);
  await p.evaluate(() => { const s = __st.cur(); window.__queue && 0; });
  await p.evaluate(() => { const s = __st.cur(); s.els[0].x = 100; });
  // trigger save through a real panel edit on title
  const t = (await p.$$eval('#canvas .el', a => a.map(x => x.getBoundingClientRect().toJSON())))[0];
  await p.mouse.click(t.x + 5, t.y + 10); await p.waitForTimeout(100); await p.fill('#f_x', '120'); await p.waitForTimeout(700);
  const doc = await p.evaluate(() => JSON.parse(JSON.stringify(__fdb.docs.get('slides5/why'))));
  const other = doc.meta.order[2];
  await p.evaluate(o => __fdb.remoteUpdate('slides5/why', {els:{[o]:{...__fdb.docs.get('slides5/why').els[o], y:777}}, base:__fdb.docs.get('slides5/why').base}), other);
  await p.fill('#f_x', '140'); await p.waitForTimeout(900);
  const fin = await p.evaluate(o => { const s = __st.cur(); return {x:s.els[0].x, y:s.els.find(e => e.id === o).y}; }, other);
  const stored = await p.evaluate(o => { const d = __fdb.docs.get('slides5/why'); return {x:d.els[d.meta.order[0]].x, y:d.els[o].y}; }, other);
  assert(fin.x === 140 && fin.y === 777 && stored.x === 140 && stored.y === 777, 'concurrent edits to different elements both kept');
  assert(!errs.length, 'no page errors ' + errs.join('|'));
  await close();
})();
