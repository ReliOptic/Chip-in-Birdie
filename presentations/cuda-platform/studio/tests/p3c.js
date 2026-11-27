const {open} = require('./h'); const sleep = ms => new Promise(r => setTimeout(r, ms)); const assert = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
(async () => { const {p, errs, close} = await open({db:false});
  await p.click('#thumbs .thumb[data-id="why"]'); await sleep(100); await p.focus('#canvas'); await p.keyboard.press('Tab'); await sleep(100);
  const a = await p.evaluate(() => __st.sel()); await p.keyboard.press('Tab'); await sleep(100); const b = await p.evaluate(() => __st.sel());
  assert(a && b && a !== b, 'Tab walks elements'); await p.keyboard.press('ArrowRight'); await sleep(100);
  assert(await p.$eval('#sr', x => x.textContent.length > 0), 'selection announced to screen readers');
  assert(!errs.length, 'no errors ' + errs.join('|')); await close(); })();
