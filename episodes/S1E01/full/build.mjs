import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => fs.readFileSync(file, 'utf8');
const json = file => JSON.parse(read(file));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const hash = file => sha(fs.readFileSync(file));
const dataURI = (file, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(file).toString('base64');
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const scriptJSON = value => JSON.stringify(value).replaceAll('<', '\\u003c');

export function validateTimeline(script, timeline, scriptHash, narrationHash) {
  if (timeline.partial_smoke_test) throw new Error('Refusing a smoke test as a full film');
  if (!timeline.source_script_sha256 || timeline.source_script_sha256 !== scriptHash) throw new Error('Missing or stale voice/script hash');
  if (!timeline.outputs?.mp3?.sha256 || timeline.outputs.mp3.sha256 !== narrationHash) throw new Error('Missing or mismatched narration/timeline hash');
  if (!Number.isFinite(timeline.duration) || timeline.duration <= 0 || !Number.isInteger(timeline.total_samples) || !Number.isInteger(timeline.sample_rate) || timeline.sample_rate <= 0 || timeline.total_samples / timeline.sample_rate !== timeline.duration) throw new Error('Invalid canonical PCM duration');
  if (!Array.isArray(script.sentences) || !script.sentences.length || !Array.isArray(timeline.sentences) || timeline.sentences.length !== script.sentences.length) throw new Error('Voice/script row count mismatch');
  const ids = new Set();
  for (let i = 0; i < timeline.sentences.length; i++) {
    const row = timeline.sentences[i], expected = script.sentences[i];
    for (const field of ['id', 'en', 'ko', 'chapter']) if (row[field] !== expected[field]) throw new Error('Voice/script mismatch at ' + i + ': ' + field);
    if (!row.id || ids.has(row.id)) throw new Error('Duplicate or missing passage identifier');
    ids.add(row.id);
    if (!Number.isFinite(row.start) || !Number.isFinite(row.end) || row.start < 0 || row.end < row.start || row.end > timeline.duration || (i && timeline.sentences[i - 1].end > row.start)) throw new Error('Invalid or overlapping utterance timing: ' + row.id);
    if (Math.abs(row.start * timeline.sample_rate - row.start_sample) > 1e-6 || Math.abs(row.end * timeline.sample_rate - row.end_sample) > 1e-6 || !Number.isInteger(row.start_sample) || !Number.isInteger(row.end_sample)) throw new Error('Utterance boundaries are not canonical PCM samples: ' + row.id);
    if (JSON.stringify(row.claim || []) !== JSON.stringify(expected.claim || [])) throw new Error('Voice/script claim reference mismatch: ' + row.id);
  }
  const chapterIDs = (script.chapters || []).map(chapter => chapter.id);
  const usedChapters = timeline.sentences.filter((row, i, list) => !i || list[i - 1].chapter !== row.chapter).map(row => row.chapter);
  if (!chapterIDs.length || new Set(chapterIDs).size !== chapterIDs.length || JSON.stringify(chapterIDs) !== JSON.stringify(usedChapters)) throw new Error('Canonical chapters are missing, repeated or out of order');
}
export function readArchive(archivePath) {
  const directory = fs.realpathSync(path.resolve(archivePath)), raw = json(path.join(directory, 'manifest.json'));
  const entries = Array.isArray(raw) ? raw : raw.assets;
  if (!Array.isArray(entries) || !entries.length) throw new Error('Archive manifest must be an asset array or {assets:[]}');
  const ids = new Set();
  const assets = entries.map(asset => {
    if (!/^[a-zA-Z0-9_-]+$/.test(asset.id || '') || ids.has(asset.id)) throw new Error('Invalid or duplicate archive id: ' + asset.id);
    ids.add(asset.id);
    for (const field of ['file', 'title', 'creator', 'license', 'source_url', 'license_url', 'date_label', 'caution']) if (typeof asset[field] !== 'string' || !asset[field].trim()) throw new Error('Missing archive metadata ' + field + ': ' + asset.id);
    if (!/^https?:\/\//.test(asset.source_url) || !/^https?:\/\//.test(asset.license_url)) throw new Error('Archive provenance must use source and license URLs: ' + asset.id);
    if (path.isAbsolute(asset.file)) throw new Error('Archive file must be relative: ' + asset.id);
    const file = fs.realpathSync(path.resolve(directory, asset.file));
    if (!file.startsWith(directory + path.sep) || !fs.statSync(file).isFile()) throw new Error('Archive file escapes the asset directory: ' + asset.id);
    const extension = path.extname(file).toLowerCase();
    const mime = {'.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.avif':'image/avif'}[extension];
    if (!mime) throw new Error('Unsupported archive image format: ' + asset.id);
    const bytes = fs.readFileSync(file), actualHash = sha(bytes);
    if (asset.sha256 && asset.sha256 !== actualHash) throw new Error('Archive image hash mismatch: ' + asset.id);
    if (asset.bytes !== undefined && asset.bytes !== bytes.length) throw new Error('Archive image byte length mismatch: ' + asset.id);
    return {file, filename: asset.id + extension, mime, credit: {...asset, mime, bytes: bytes.length, sha256: actualHash}};
  });
  const publicMetadata = Array.isArray(raw) ? {} : Object.fromEntries(Object.entries(raw).filter(([key]) => !['assets', 'path_base'].includes(key)));
  return {assets, publicMetadata, manifest: {...publicMetadata, assets: assets.map(asset => asset.credit)}};
}
function bundleModules(entry, threeFile) {
  const modules = new Map(), active = new Set(), imports = {};
  if (!threeFile || !fs.statSync(threeFile).isFile()) throw new Error('--three must identify the existing pinned Three.js module');
  imports.three = dataURI(threeFile, 'text/javascript');
  function visit(file) {
    file = path.resolve(file);
    if (!file.startsWith(root + path.sep)) throw new Error('Runtime module escapes episode source: ' + file);
    if (modules.has(file)) return modules.get(file).specifier;
    if (active.has(file)) throw new Error('Circular inline module import: ' + path.basename(file));
    active.add(file);
    const specifier = 'cib-runtime/' + path.relative(root, file).replaceAll(path.sep, '/');
    let code = read(file);
    code = code.replace(/(\bfrom\s*|\bimport\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_all, lead, quote, relative) => lead + quote + visit(path.resolve(path.dirname(file), relative)) + quote);
    const uri = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
    modules.set(file, {uri, specifier, sourceHash: hash(file)}); imports[specifier] = uri; active.delete(file); return specifier;
  }
  return {entry: visit(entry), modules, imports};
}
function makeHTML(template, data, entry, imports) {
  return template.replaceAll('__FILM_TITLE__', escapeHTML(data.script.title)).replace('__FILM_DATA__', scriptJSON(data)).replace('__ENTRY_MODULE__', entry).replace('__IMPORT_MAP__',scriptJSON({imports}));
}
function vtt(timeline, locale) {
  const stamp = time => {
    const ms = Math.round(time * 1000);
    return Math.floor(ms / 3600000).toString().padStart(2, '0') + ':' + Math.floor(ms / 60000 % 60).toString().padStart(2, '0') + ':' + Math.floor(ms / 1000 % 60).toString().padStart(2, '0') + '.' + (ms % 1000).toString().padStart(3, '0');
  };
  return 'WEBVTT\n\n' + timeline.sentences.map(row => row.id + '\n' + stamp(row.start) + ' --> ' + stamp(row.end) + '\n' + row[locale] + '\n').join('\n');
}
export function build(args) {
  if (!args.archive || !args.audio || !args.out || !args.three) throw new Error('Usage: node build.mjs --archive /path/to/archive --audio /path/to/audio --three /path/to/pinned-three.module.js --out /path/to/output [--site /path/to/site/dist]');
  const script = json(path.join(root, 'script.json')), timeline = json(path.join(args.audio, 'timeline.json'));
  const narrationFile = path.join(args.audio, 'narration.mp3'), scriptHash = hash(path.join(root, 'script.json')), narrationHash = hash(narrationFile);
  validateTimeline(script, timeline, scriptHash, narrationHash);
  const archive = readArchive(args.archive), runtime = bundleModules(path.join(root, 'film.mjs'), path.resolve(args.three));
  const rawClaims = json(path.join(root, 'claims.json'));
  const data = {
    script, timeline, claims: Array.isArray(rawClaims) ? rawClaims : rawClaims.claims, sources: json(path.join(root, 'sources.json')),
    notices: read(path.join(root, 'THIRD_PARTY_NOTICES.txt')), audio_sha256: narrationHash,
    archiveCredits: archive.assets.map(asset => asset.credit), archiveRights: archive.publicMetadata,
    deliveryMode: 'standalone', pictureRevision: 'R8-fab-reportage',
    assets: {narration: dataURI(narrationFile, 'audio/mpeg'), archive: Object.fromEntries(archive.assets.map(asset => [asset.credit.id, dataURI(asset.file, asset.mime)]))}
  };
  const template = read(path.join(root, 'player.html')), html = makeHTML(template, data, runtime.entry, runtime.imports);
  if (/__FILM_TITLE__|__FILM_DATA__|__ENTRY_MODULE__|__IMPORT_MAP__/.test(html)) throw new Error('Unresolved film template placeholder');
  const out = path.resolve(args.out), output = path.join(out, 'S1E01-full-documentary.html');
  if (args.site && Buffer.byteLength(html) >= 25 * 1024 * 1024) throw new Error('Downloadable standalone HTML exceeds the Sites 25 MiB static-file limit; reduce archive image delivery dimensions before publishing');
  fs.mkdirSync(out, {recursive: true});
  fs.writeFileSync(output, html);
  for (const name of ['script.json', 'claims.json', 'sources.json', 'THIRD_PARTY_NOTICES.txt']) fs.copyFileSync(path.join(root, name), path.join(out, name));
  fs.copyFileSync(path.join(args.audio, 'timeline.json'), path.join(out, 'timeline.json'));
  fs.writeFileSync(path.join(out, 'archive-manifest.json'), JSON.stringify(archive.manifest, null, 2));
  for (const locale of ['en', 'ko']) fs.writeFileSync(path.join(out, 'captions.' + locale + '.vtt'), vtt(timeline, locale));
  if (args.site) {
    const site = path.resolve(args.site);
    fs.mkdirSync(path.join(site, 'archive'), {recursive: true});
    fs.mkdirSync(path.join(site, 'vendor'), {recursive: true});
    if(path.resolve(args.three)!==path.join(site,'vendor','three.module.js'))fs.copyFileSync(args.three,path.join(site,'vendor','three.module.js'));
    for (const file of runtime.modules.keys()) {
      const relative = path.relative(root, file), target = path.join(site, relative);
      fs.mkdirSync(path.dirname(target), {recursive: true}); fs.copyFileSync(file, target);
    }
    for (const asset of archive.assets) fs.copyFileSync(asset.file, path.join(site, 'archive', asset.filename));
    fs.copyFileSync(narrationFile, path.join(site, 'narration.mp3'));
    fs.copyFileSync(path.join(root, 'THIRD_PARTY_NOTICES.txt'), path.join(site, 'THIRD_PARTY_NOTICES.txt'));
    const siteData = {...data, deliveryMode: 'site', assets: {narration: './narration.mp3', archive: Object.fromEntries(archive.assets.map(asset => [asset.credit.id, './archive/' + asset.filename]))}};
    fs.writeFileSync(path.join(site, 'index.html'), makeHTML(template, siteData, './film.mjs',{three:'./vendor/three.module.js'}));
    fs.copyFileSync(output, path.join(site, 'S1E01-full-documentary.html'));
    fs.writeFileSync(path.join(site, 'archive-manifest.json'), JSON.stringify(archive.manifest, null, 2));
  }
  const manifest = {
    episode: 'S1E01', revision: 'R8-fab-reportage', narrationRevision: script.revision, duration: timeline.duration, utterances: timeline.sentences.length,
    picture: 'New expansive fab, supported OHT/wafer handling, architectural cutaway, process studies and reporting graphics; no R1–R7 shot imports', archiveImages: archive.assets.length, releaseApproval: false, three_sha256: hash(args.three),
    script_sha256: scriptHash, narration_sha256: narrationHash,
    runtimeSources: Object.fromEntries([...runtime.modules].map(([file, value]) => [path.relative(root, file), value.sourceHash])),
    files: fs.readdirSync(out).filter(name => name !== 'manifest.json' && fs.statSync(path.join(out, name)).isFile()).map(name => ({path: name, bytes: fs.statSync(path.join(out, name)).size, sha256: hash(path.join(out, name))}))
  };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return {output, bytes: fs.statSync(output).size, sha256: hash(output), duration: timeline.duration, modules: runtime.modules.size, archiveImages: archive.assets.length};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const name = process.argv[i];
    if (!['--archive', '--audio', '--out', '--site', '--three'].includes(name) || !process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw new Error('Expected --archive PATH --audio PATH --three FILE --out PATH [--site PATH]');
    args[name.slice(2)] = process.argv[i + 1];
  }
  console.log(JSON.stringify(build(args)));
}
