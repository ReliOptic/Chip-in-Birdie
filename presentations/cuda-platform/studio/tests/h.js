// Shared Playwright helpers. Serve the studio folder first:  (cd .. && python3 -m http.server 8766)
// Optional local copies of CDN libraries: REVEAL_JS, PPTXGEN_JS, H2I_JS (paths) for offline runs.
// IMG_DIR: folder with the deck photos (not committed; they come from the 4-2 team's deck).
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const SP = __dirname;
async function open({db = false, uid} = {}){
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1600, height:900}});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  if (process.env.REVEAL_JS) await p.route(/reveal\.min\.js$/, r => r.fulfill({body:fs.readFileSync(process.env.REVEAL_JS), contentType:'text/javascript'}));
  if (process.env.IMG_DIR) await p.route(/\/img\/[\w.-]+$/, r => { const f = path.join(process.env.IMG_DIR, path.basename(new URL(r.request().url()).pathname)); return fs.existsSync(f) ? r.fulfill({body:fs.readFileSync(f)}) : r.fulfill({status:404, body:''}); });
  const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
  fs.writeFileSync(ROOT + '/qa.html', '<!doctype html><html><head><meta charset=utf8><style>[hidden]{display:none!important}</style></head><body>' + html + '</body></html>');
  if (uid) await p.addInitScript(`window.__uid=${JSON.stringify(uid)}`);
  if (db) await p.addInitScript({path:SP + '/fakedb.js'});
  await p.goto('http://127.0.0.1:8766/qa.html'); await p.waitForTimeout(300); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  return {b, p, errs, close:() => b.close()};
}
module.exports = {open, SP};
