const {open} = require('./h');
(async () => { const {p, errs, close} = await open({db:true});
  await p.click('#thumbs .thumb[data-id="fin"]'); await p.waitForTimeout(150);
  const els = await p.$$eval('#canvas .el', a => a.map(x => ({id:x.dataset.id, r:x.getBoundingClientRect().toJSON()})));
  const t = els[0]; await p.mouse.click(t.r.x + 20, t.r.y + t.r.height / 2); await p.waitForTimeout(150);
  const get = () => p.evaluate(() => { const e = __st.curEl(); return e && {x:e.x, size:e.size}; });
  await p.click('#f_size', {clickCount:3}); await p.keyboard.type('6', {delay:50}); await p.waitForTimeout(800); await p.keyboard.type('4', {delay:50}); await p.waitForTimeout(800);
  const focusOk = await p.evaluate(() => document.activeElement && document.activeElement.id);
  console.log(JSON.stringify({after:await get(), focus:focusOk, errs})); await close(); })();
