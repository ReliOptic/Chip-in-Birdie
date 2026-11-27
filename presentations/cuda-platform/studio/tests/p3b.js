// exports: native PPTX (tables/charts/text editable) and print-to-PDF with selectable text
const {open, SP} = require('./h'); const fs = require('fs'); const sleep = ms => new Promise(r => setTimeout(r, ms)); const assert = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
(async () => { const {p, errs, close} = await open({db:false});
  if (process.env.PPTXGEN_JS) await p.route(/pptxgen\.bundle\.js$/, r => r.fulfill({body:fs.readFileSync(process.env.PPTXGEN_JS), contentType:'text/javascript'}));
  if (process.env.H2I_JS) await p.route(/html-to-image/, r => r.fulfill({body:fs.readFileSync(process.env.H2I_JS), contentType:'text/javascript'}));
  const [dl] = await Promise.all([p.waitForEvent('download', {timeout:90000}), p.evaluate(() => { document.querySelector('#exportPop [data-cmd="pptx"]').click(); })]);
  await dl.saveAs(SP + '/out.pptx'); assert(fs.statSync(SP + '/out.pptx').size > 50000, 'pptx written');
  await p.evaluate(() => { const b = [...document.querySelectorAll('#exportPop [data-cmd="print"]')][0]; window.print = () => {}; b.click(); }); await sleep(600);
  await p.emulateMedia({media:'print'}); await p.pdf({path:SP + '/out.pdf', width:'1600px', height:'900px', printBackground:true});
  assert(fs.statSync(SP + '/out.pdf').size > 20000, 'print pdf written');
  assert(!errs.length, 'no errors ' + errs.join('|')); await close(); })();
