const {open} = require('./h');
(async () => { for (const db of [false, true]){ const {p, errs, close} = await open({db});
  const n = await p.$$eval('#thumbs .thumb', a => a.length); const sync = await p.$eval('#sync', x => x.dataset.s);
  console.log(JSON.stringify({db, n, sync, errs})); await close(); } })();
