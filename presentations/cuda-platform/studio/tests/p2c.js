// remote change arriving mid-drag must not discard the drag
const {open} = require('./h'); const sleep = ms => new Promise(r => setTimeout(r, ms)); const assert = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
(async () => { const {p, errs, close} = await open({db:true});
  await p.click('#thumbs .thumb[data-id="why"]'); await sleep(150);
  // create stored doc first via a tiny edit
  const ids = await p.evaluate(() => __st.cur().els.map(e => e.id)); const r = await p.$eval(`#canvas .el[data-id="${ids[3]}"]`, x => x.getBoundingClientRect().toJSON());
  await p.mouse.click(r.x + 20, r.y + 20); await sleep(100); await p.fill('#f_y', '640'); await sleep(900);
  const x0 = await p.evaluate(i => __st.cur().els.find(e => e.id === i).x, ids[3]); const r2 = await p.$eval(`#canvas .el[data-id="${ids[3]}"]`, x => x.getBoundingClientRect().toJSON());
  await p.mouse.move(r2.x + 30, r2.y + 30); await p.mouse.down(); await p.mouse.move(r2.x + 90, r2.y + 30, {steps:4});
  await p.evaluate(o => __fdb.remoteUpdate('slides5/why', {els:{[o]:{...__fdb.docs.get('slides5/why').els[o], html:'REMOTE'}}}), ids[1]); await sleep(120);
  await p.mouse.move(r2.x + 150, r2.y + 30, {steps:4}); await p.mouse.up(); await sleep(900);
  const st = await p.evaluate(i => { const s = __st.cur(); return {x:s.els.find(e => e.id === i[3]).x, t:s.els.find(e => e.id === i[1]).html}; }, ids);
  assert(st.x > x0 + 40 && st.t === 'REMOTE', 'drag kept and remote text merged after drag ' + JSON.stringify(st) + ' x0=' + x0);
  assert(!errs.length, 'no errors ' + errs.join('|')); await close(); })();
