#!/usr/bin/env node
/**
 * Bounded, non-browser contract tests for the S1E01 full-film delivery.
 *
 * Run:
 *   node --experimental-vm-modules episodes/S1E01/full/qa-contract.mjs \
 *     --bundle /absolute/path/S1E01-full-documentary.html
 *
 * Prints a JSON report and never writes files. A failed assertion exits nonzero.
 * Module parsing is real; DOM, media, and offline-audio objects below are mocks.
 * No WebGL renderer, browser, real audio engine, playback, or network is used.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const argIndex = process.argv.indexOf('--bundle');
if (argIndex < 0 || !process.argv[argIndex + 1]) {
  throw new Error('Usage: node --experimental-vm-modules qa-contract.mjs --bundle /absolute/film.html');
}
if (typeof vm.SourceTextModule !== 'function') {
  throw new Error('Node --experimental-vm-modules is required for syntax/import inspection.');
}
const bundlePath = path.resolve(process.argv[argIndex + 1]);
const sourceNames = ['player.html', 'film.mjs', 'build.mjs'];
const sources = Object.fromEntries(sourceNames.map(name => [name, fs.readFileSync(path.join(root, name), 'utf8')]));
const html = fs.readFileSync(bundlePath, 'utf8');
const film = sources['film.mjs'];
const player = sources['player.html'];
const builder = sources['build.mjs'];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const decode = uri => {
  assert.match(uri, /^data:[^,]+;base64,/);
  return Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
};
const capture = (text, pattern, label) => {
  const match = text.match(pattern);
  assert.ok(match, `Missing ${label}`);
  return match[1];
};
const data = JSON.parse(capture(html, /<script id="film-data" type="application\/json">([\s\S]*?)<\/script>/, 'film data'));
const importMap = JSON.parse(capture(html, /<script type="importmap">([\s\S]*?)<\/script>/, 'import map'));
const loader = capture(html, /<script type="module">([\s\S]*?)<\/script>/, 'entry loader');
const entry = capture(loader, /import\(['"](data:[^'"]+)['"]\)/, 'entry URI');
const entryCode = decode(entry).toString('utf8');
const rows = data.timeline.sentences;
const duration = data.timeline.duration;
const tests = [];
const warnings = [];
const inputHashes = Object.fromEntries(sourceNames.map(name => [name, sha(sources[name])]));

async function test(name, method, body) {
  try {
    const detail = await body();
    tests.push({name, method, result: 'PASS', ...(detail === undefined ? {} : {detail})});
  } catch (error) {
    tests.push({name, method, result: 'FAIL', error: String(error.message || error)});
  }
}

function between(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Cannot extract ${start}`);
  return text.slice(a, b);
}

// Extract a named declaration from the production source, not a copied reimplementation.
// This scanner handles strings/templates/comments in the bounded control functions.
function functionSource(name) {
  const found = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(film);
  assert.ok(found, `Missing function ${name}`);
  const start = found.index, body = film.indexOf('{', start);
  let depth = 0, quote = null, lineComment = false, blockComment = false;
  for (let i = body; i < film.length; i++) {
    const c = film[i], n = film[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return film.slice(start, i + 1);
  }
  throw new Error(`Unclosed function ${name}`);
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return {promise, resolve, reject};
}
const settle = () => new Promise(resolve => setImmediate(resolve));

class MockNode {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase(); this.textContent = ''; this.value = '';
    this.style = {}; this.dataset = {}; this.children = []; this.attributes = {};
    this.hidden = false; this.disabled = false; this.parentNode = null;
  }
  append(...nodes) { for (const node of nodes) { this.children.push(node); if (node && typeof node === 'object') node.parentNode = this; } }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name]; }
  get firstElementChild() { return this.children[0]; }
  scrollIntoView() { this.scrolled = true; }
}

function domMock() {
  const nodes = new Map(), events = new Map();
  const get = id => {
    if (!nodes.has(id)) { const node = new MockNode(); node.id = id; nodes.set(id, node); }
    return nodes.get(id);
  };
  get('caption').append(new MockNode('span'));
  const document = {
    hidden: false, fullscreenElement: null, fonts: {ready: Promise.resolve()},
    getElementById: get, createElement: tag => new MockNode(tag),
    createTextNode: text => ({textContent: String(text)}), querySelectorAll: () => [],
    addEventListener(name, fn) { if (!events.has(name)) events.set(name, []); events.get(name).push(fn); },
    async exitFullscreen() { this.fullscreenElement = null; },
  };
  return {nodes, events, get, document};
}

function controlHarness({stage, stored} = {}) {
  const dom = domMock(); const gate = deferred();
  const counts = {prepare: 0, resume: 0, mediaPlay: 0, mediaPause: 0, sfxStop: 0, sfxStart: [], draws: [], errors: []};
  let storage = stored === undefined ? null : JSON.stringify(stored);
  const ctx = {
    console, DATA: data, rows, duration, current: 10, playing: false, pendingPlay: false,
    playRequest: 0, muteRequest: 0, locale: 'ko', muted: false, headless: false, qa: false,
    lastPersist: 0, frameCount: 0, soundRequested: false, audioState: 'ready', audioError: null,
    runtimeErrors: [], sfxBuffer: {}, $: dom.get, document: dom.document,
    window: {__ready: true, addEventListener() {}},
    localStorage: {getItem: () => storage, setItem: (_key, value) => { storage = value; }},
    clamp: (n, a = 0, b = 1) => Math.max(a, Math.min(b, n)),
    fmt: n => `${Math.floor(n / 60).toString().padStart(2, '0')}:${Math.floor(n % 60).toString().padStart(2, '0')}`,
    draw(t) { ctx.current = t; counts.draws.push(t); },
    stopSfx() { counts.sfxStop++; }, startSfx(t) { counts.sfxStart.push(t); },
    prepareAudio() { counts.prepare++; return stage === 'prepare' ? gate.promise : Promise.resolve(); },
    context: {resume() { counts.resume++; return stage === 'resume' ? gate.promise : Promise.resolve(); }},
    narration: {
      currentTime: 10, paused: true, muted: false,
      pause() { this.paused = true; counts.mediaPause++; },
      play() { this.paused = false; counts.mediaPlay++; return stage === 'media' ? gate.promise : Promise.resolve(); },
      load() {},
    },
    showError(message) { counts.errors.push(String(message)); },
    makeInterface() {}, loadFab: async () => {}, resize() {}, requestAnimationFrame() {},
    location: {reload() {}}, bakeScore: async () => new Float32Array(0), checksum: () => ({}),
  };
  vm.createContext(ctx);
  for (const name of ['persist', 'pause', 'seek', 'play', 'setMuted', 'setLocale', 'loop', 'start', 'setCaption', 'renderPassageEvidence']) {
    vm.runInContext(functionSource(name), ctx);
  }
  vm.runInContext(between(film, 'narration.onended=', 'function loop('), ctx);
  vm.runInContext(between(film, 'const audioAPI=', 'window.__meta='), ctx);
  return {ctx, dom, gate, counts, audio: vm.runInContext('audioAPI', ctx), readStorage: () => JSON.parse(storage)};
}

await test('Bundle placeholders and source freshness', 'STATIC_BYTES', () => {
  assert.ok(!/__FILM_DATA__|__IMPORT_MAP__|__ENTRY_MODULE__/.test(html));
  const original = new vm.SourceTextModule(film).dependencySpecifiers;
  const packed = new vm.SourceTextModule(entryCode).dependencySpecifiers;
  assert.equal(original.length, packed.length);
  let restored = entryCode;
  for (let i = 0; i < packed.length; i++) if (packed[i].startsWith('data:')) restored = restored.replaceAll(packed[i], original[i]);
  assert.ok(restored === film, 'Bundle entry differs from current film.mjs');
  const stripped = html
    .replace(/(<script id="film-data" type="application\/json">)[\s\S]*?(<\/script>)/, '$1__FILM_DATA__$2')
    .replace(/(<script type="importmap">)[\s\S]*?(<\/script>)/, '$1__IMPORT_MAP__$2')
    .replace(entry, '__ENTRY_MODULE__');
  assert.ok(stripped === player, 'Bundle template differs from current player.html');
  return {bundleBytes: Buffer.byteLength(html), sourceMatches: true};
});

await test('Embedded module graph syntax and resolution', 'REAL_JS_PARSE_NO_EVALUATION', () => {
  const seen = new Set(), modules = [];
  function inspect(uri, label) {
    if (seen.has(uri)) return; seen.add(uri);
    const code = decode(uri).toString('utf8');
    const module = new vm.SourceTextModule(code);
    modules.push({label, bytes: Buffer.byteLength(code), sha256: sha(code), imports: module.dependencySpecifiers.length});
    module.dependencySpecifiers.forEach((specifier, i) => {
      const resolved = specifier.startsWith('data:') ? specifier : importMap.imports[specifier];
      assert.ok(resolved, `Unresolved ${label}: ${specifier}`); inspect(resolved, `${label}/${i}`);
    });
  }
  inspect(entry, 'entry'); new vm.SourceTextModule(loader); new vm.SourceTextModule(builder);
  return {uniqueModules: modules.length, unresolvedImports: 0, modules};
});

await test('Embedded assets and canonical PCM duration', 'STATIC_BYTES_AND_JSON', () => {
  const mp3 = decode(data.assets.narration), glb = decode(data.assets.scene);
  assert.equal(sha(mp3), data.audio_sha256); assert.equal(sha(mp3), data.timeline.outputs.mp3.sha256);
  assert.equal(glb.subarray(0, 4).toString(), 'glTF'); assert.equal(glb.readUInt32LE(4), 2);
  assert.equal(glb.readUInt32LE(8), glb.length);
  const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
  const external = [...(gltf.buffers || []), ...(gltf.images || [])].filter(item => item.uri);
  assert.equal(external.length, 0); assert.ok(gltf.cameras?.length);
  assert.equal(data.timeline.total_samples / data.timeline.sample_rate, duration);
  return {duration, totalSamples: data.timeline.total_samples, narrationSHA256: sha(mp3), sceneSHA256: sha(glb), glbCameras: gltf.cameras.length, glbAnimations: gltf.animations.length, externalGLBResources: 0};
});

await test('Utterances, claims, and source references', 'STATIC_DATA_CONTRACT', () => {
  assert.equal(rows.length, data.script.sentences.length); assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  const claims = new Map(data.claims.map(claim => [claim.id, claim]));
  const sourceIDs = new Set(data.sources.map(source => source.id));
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    assert.ok(Number.isFinite(row.start) && Number.isFinite(row.end) && row.start <= row.end && row.end <= duration);
    if (i) assert.ok(rows[i - 1].end <= row.start);
    for (const field of ['id', 'en', 'ko', 'chapter', 'shot', 'phase', 'world']) assert.equal(row[field], data.script.sentences[i][field]);
    assert.ok(Math.abs(row.start * data.timeline.sample_rate - row.start_sample) < 1e-6);
    assert.ok(Math.abs(row.end * data.timeline.sample_rate - row.end_sample) < 1e-6);
    assert.ok(data.script.chapters.some(chapter => chapter.id === row.chapter));
    for (const id of row.claim || []) assert.ok(claims.has(id), `Missing claim ${id}`);
  }
  for (const claim of claims.values()) for (const id of claim.sources) assert.ok(sourceIDs.has(id), `Missing source ${id}`);
  for (const source of data.sources) { assert.match(source.url, /^https:\/\//); assert.ok(source.title && source.note); }
  assert.ok(typeof data.notices === 'string' && data.notices.length > 100);
  return {utterances: rows.length, chapters: data.script.chapters.length, claims: claims.size, sources: sourceIDs.size, thirdPartyNoticesBytes: Buffer.byteLength(data.notices)};
});

await test('Phase-aware shot grouping and time boundaries', 'ACTUAL_GROUPING_CODE_WITH_JSON', () => {
  const ctx = {rows, duration}; vm.createContext(ctx);
  vm.runInContext(between(film, 'const shots=[];', 'let current='), ctx);
  vm.runInContext(functionSource('currentShot'), ctx);
  const shots = vm.runInContext('shots', ctx);
  assert.equal(shots.length, 44); assert.equal(new Set(shots.map(shot => shot.id)).size, 41);
  assert.equal(shots[0].t0, 0); assert.equal(shots.at(-1).t1, duration);
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i]; assert.ok(shot.t1 > shot.t0);
    if (i) assert.equal(shots[i - 1].t1, shot.t0);
    for (const row of shot.rows) { assert.equal(row.phase, shot.phase); assert.equal(row.world, shot.world); }
    assert.equal(ctx.currentShot(shot.t0), shot);
    assert.equal(ctx.currentShot((shot.t0 + shot.t1) / 2), shot);
  }
  assert.equal(ctx.currentShot(duration), shots.at(-1));
  const phases = Object.fromEntries([...new Set(shots.map(shot => shot.id))].map(id => [id, shots.filter(shot => shot.id === id).map(shot => ({phase: shot.phase, start: shot.t0, end: shot.t1}))]).filter(([, value]) => value.length > 1));
  return {namedShots: 41, phaseBeats: 44, splitNamedShots: phases};
});

for (const stage of ['prepare', 'resume', 'media']) {
  await test(`Seek cancels pending play during ${stage}`, 'ACTUAL_CONTROL_FUNCTIONS_MOCK_MEDIA_DOM', async () => {
    const h = controlHarness({stage}); const p = h.ctx.play(); await settle();
    assert.equal(h.ctx.pendingPlay, true); h.ctx.seek(111); h.gate.resolve(); await p;
    assert.equal(h.ctx.current, 111); assert.equal(h.ctx.playing, false); assert.equal(h.ctx.pendingPlay, false);
    assert.equal(h.ctx.narration.paused, true); assert.equal(h.counts.sfxStart.length, 0);
    return {stage, mediaPlayCalls: h.counts.mediaPlay, staysPaused: true};
  });
}

await test('Visibility change cancels pending play', 'ACTUAL_EVENT_HANDLER_MOCK_DOCUMENT', async () => {
  const h = controlHarness({stage: 'prepare'}); const p = h.ctx.play();
  h.dom.document.hidden = true; for (const fn of h.dom.events.get('visibilitychange') || []) fn();
  h.gate.resolve(); await p; assert.equal(h.ctx.playing, false); assert.equal(h.ctx.pendingPlay, false);
  assert.equal(h.counts.mediaPlay, 0);
});

await test('Duplicate play is bounded and pause updates status', 'ACTUAL_CONTROL_FUNCTIONS_MOCK_MEDIA_DOM', async () => {
  const h = controlHarness({stage: 'prepare'}); const p = h.ctx.play(); await h.ctx.play();
  h.gate.resolve(); await p; assert.equal(h.counts.prepare, 1); assert.equal(h.counts.mediaPlay, 1);
  assert.equal(h.ctx.playing, true); h.ctx.pause(); assert.equal(h.dom.get('status').textContent, 'Paused');
  assert.equal(h.ctx.narration.paused, true);
});

await test('Audio failure preserves position and retry works', 'ACTUAL_CONTROL_FUNCTIONS_MOCK_REJECTION', async () => {
  const h = controlHarness({stage: 'prepare'}); const p = h.ctx.play(); h.gate.reject(new Error('Synthetic audio failure')); await p;
  assert.equal(h.ctx.current, 10); assert.equal(h.ctx.playing, false); assert.equal(h.ctx.pendingPlay, false);
  assert.equal(h.dom.get('status').textContent, 'Audio needs retry'); assert.equal(h.counts.errors.length, 1);
  h.ctx.prepareAudio = async () => {}; await h.ctx.play(); assert.equal(h.ctx.playing, true); assert.equal(h.ctx.current, 10);
});

await test('Media time drives frames; natural end and replay', 'ACTUAL_LOOP_AND_EVENTS_MOCK_MEDIA', async () => {
  const h = controlHarness(); await h.ctx.play(); const pauses = h.counts.mediaPause;
  h.ctx.narration.currentTime = duration - 0.01; h.ctx.loop(9999);
  assert.equal(h.ctx.playing, true, 'RAF must not preempt the media ended event'); assert.equal(h.counts.mediaPause, pauses);
  assert.equal(h.ctx.current, duration - 0.01);
  h.ctx.narration.currentTime = duration + 0.05; h.ctx.loop(11000); assert.equal(h.ctx.current, duration);
  h.ctx.narration.onended(); assert.equal(h.ctx.playing, false); assert.equal(h.ctx.current, duration);
  assert.match(h.dom.get('status').textContent, /Finished/); assert.equal(h.readStorage().time, 0);
  await h.ctx.play(); assert.equal(h.ctx.current, 0); assert.equal(h.ctx.narration.currentTime, 0); assert.equal(h.ctx.playing, true);
});

await test('UI/API mute stops SFX and updates accessibility', 'ACTUAL_MUTE_AND_API_MOCK_MEDIA', async () => {
  const h = controlHarness(); await h.ctx.play(); const before = h.counts.sfxStop;
  await h.audio.setEnabled(false); assert.ok(h.counts.sfxStop > before); assert.equal(h.ctx.narration.muted, true);
  assert.equal(h.dom.get('mute').getAttribute('aria-pressed'), 'true'); assert.equal(h.dom.get('mute').getAttribute('aria-label'), 'Unmute narration');
  assert.equal(h.dom.get('fs-mute').getAttribute('aria-pressed'), 'true');
  h.ctx.narration.currentTime = 31.25; await h.audio.setEnabled(true);
  assert.equal(h.ctx.narration.muted, false); assert.equal(h.counts.sfxStart.at(-1), 31.25);
  assert.equal(h.readStorage().muted, false);
});

await test('Latest audio enabled request wins while preparing', 'ACTUAL_AUDIO_API_MOCK_ASYNC_PREPARATION', async () => {
  const h = controlHarness({stage: 'prepare'}); h.ctx.setMuted(true);
  const pending = h.audio.setEnabled(true); await h.audio.setEnabled(false); h.gate.resolve(); await pending;
  assert.equal(h.ctx.muted, true, 'An older async enable must not overwrite a newer disable');
  assert.equal(h.ctx.narration.muted, true);
});

await test('Restore validates time and restores mute ARIA', 'ACTUAL_START_FUNCTION_MOCK_INITIALIZATION', async () => {
  const valid = controlHarness({stored: {time: 93.5, locale: 'en', muted: true}}); await valid.ctx.start();
  assert.equal(valid.ctx.current, 93.5); assert.equal(valid.ctx.playing, false); assert.equal(valid.ctx.locale, 'en');
  assert.equal(valid.dom.get('mute').getAttribute('aria-pressed'), 'true'); assert.equal(valid.ctx.narration.muted, true);
  const corrupt = controlHarness({stored: {time: 'NaN', locale: 'invalid', muted: false}}); await corrupt.ctx.start();
  assert.equal(corrupt.ctx.current, 0); assert.equal(corrupt.ctx.locale, 'ko'); assert.equal(corrupt.ctx.window.__ready, true);
});

await test('Captions obey utterance boundaries and locale', 'ACTUAL_CAPTION_FUNCTION_MOCK_DOM', () => {
  const h = controlHarness(), row = rows[0];
  h.ctx.setCaption(row, row.start - 0.01); assert.equal(h.dom.get('caption').firstElementChild.textContent, '');
  h.ctx.setCaption(row, row.start); assert.equal(h.dom.get('caption').firstElementChild.textContent, row.ko);
  h.ctx.locale = 'en'; h.ctx.setCaption(row, row.start); assert.equal(h.dom.get('caption').firstElementChild.textContent, row.en);
  h.ctx.setCaption(row, row.end + 0.2); assert.equal(h.dom.get('caption').firstElementChild.textContent, '');
  h.ctx.locale = 'off'; h.ctx.setCaption(row, row.start); assert.equal(h.dom.get('caption').style.display, 'none');
  h.ctx.setLocale('en'); assert.equal(h.dom.get('locale').value, 'en'); assert.equal(h.dom.get('fs-locale').value, 'en');
});

await test('Current-passage evidence renders claim/source links', 'ACTUAL_EVIDENCE_FUNCTION_MOCK_DOM', () => {
  const h = controlHarness(); const row = rows.find(row => row.claim.length > 1) || rows.find(row => row.claim.length > 0);
  assert.ok(row, 'At least one sourced passage is required');
  h.ctx.renderPassageEvidence(row); const tree = h.dom.get('passage-evidence');
  const all = []; function visit(node) { all.push(node); for (const child of node.children || []) visit(child); } visit(tree);
  const links = all.filter(node => node.tagName === 'A');
  const expected = row.claim.flatMap(id => data.claims.find(claim => claim.id === id).sources).length;
  assert.ok(expected > 0, 'Evidence test must exercise at least one original-source link');
  assert.equal(links.length, expected); for (const link of links) assert.match(link.href, /^https:\/\//);
  return {passage: row.id, claims: row.claim, renderedSourceLinks: links.length};
});

await test('Initialization rejection is surfaced with retry', 'REAL_ENTRY_LOADER_MOCK_DYNAMIC_IMPORT_REJECTION', async () => {
  const dom = domMock(); let reloads = 0;
  const context = vm.createContext({window: {__ready: true}, document: dom.document, location: {reload() { reloads++; }}});
  const module = new vm.SourceTextModule(loader, {context, importModuleDynamically: async () => { throw new Error('Synthetic WebGL initialization failure'); }});
  await module.link(() => { throw new Error('Unexpected static dependency'); }); await module.evaluate(); await settle();
  assert.equal(context.window.__ready, false); assert.match(dom.get('status').textContent, /could not initialize/);
  assert.equal(dom.get('error').style.display, 'block'); const retry = dom.get('error').children.find(node => node.tagName === 'BUTTON');
  assert.ok(retry); retry.onclick(); assert.equal(reloads, 1);
});

await test('Fullscreen subtree contains transport and letterbox rules', 'STATIC_HTML_CSS_CONTRACT_NOT_LAYOUT', () => {
  const screen = capture(player, /<section class="screen"[^>]*>([\s\S]*?)<\/section>/, 'screen subtree');
  for (const id of ['picture', 'fs-controls', 'fs-play', 'fs-seek', 'fs-time', 'fs-exit', 'fs-mute', 'fs-locale']) assert.ok(screen.includes(`id="${id}"`), `Missing fullscreen ${id}`);
  assert.match(player, /\.screen:fullscreen #picture\{[^}]*177\.777778vh[^}]*56\.25vw/);
  assert.match(film, /\$\('picture'\)\.getBoundingClientRect/);
  const ids = [...player.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML ids');
  for (const [, id] of film.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), `Missing DOM id ${id}`);
  return {fullscreenTransportPresent: true, letterboxRulePresent: true, renderedLayoutTested: false};
});

await test('Build guards reject missing/stale hashes and invalid timing', 'ACTUAL_GUARD_CODE_IN_MEMORY_NO_BUILD_WRITES', () => {
  const guard = between(builder, 'if(timeline.partial_smoke_test)', 'const dataURI=');
  function run(mutator) {
    const timeline = structuredClone(data.timeline), script = structuredClone(data.script);
    mutator?.(timeline, script);
    const ctx = {timeline, script, root: '/source', args: {audio: '/audio'}, path,
      hash: p => p.endsWith('script.json') ? data.timeline.source_script_sha256 : sha(decode(data.assets.narration))};
    vm.runInNewContext(guard, ctx);
  }
  run();
  const variants = [
    ['missing script SHA', t => { delete t.source_script_sha256; }],
    ['stale script SHA', t => { t.source_script_sha256 = 'stale'; }],
    ['missing MP3 SHA', t => { delete t.outputs.mp3.sha256; }],
    ['mismatched MP3 SHA', t => { t.outputs.mp3.sha256 = 'wrong'; }],
    ['invalid duration', t => { t.duration += 1; }],
    ['smoke test', t => { t.partial_smoke_test = true; }],
    ['script text mismatch', (_t, s) => { s.sentences[0].en = 'not the recorded script'; }],
  ];
  for (const [label, mutate] of variants) assert.throws(() => run(mutate), undefined, label);
  return {validInputAccepted: true, rejectedVariants: variants.map(([label]) => label)};
});

await test('SFX cue ordering and repeatability under identity offline mock', 'ACTUAL_SFX_CODE_MOCK_OFFLINE_AUDIO_CONTEXT_NOT_AUDIO_RENDERING', async () => {
  const ctx = {rows, duration, Float32Array, Math, window: {}}; vm.createContext(ctx);
  vm.runInContext(between(film, 'const shots=[];', 'let current='), ctx);
  vm.runInContext(between(film, 'const cueSpecs=', 'function rng('), ctx);
  let contexts = 0, zeroStarts = 0;
  class IdentityOffline {
    constructor(_channels, length, sr) { contexts++; this.length = length; this.sampleRate = sr; this.destination = {}; }
    createBuffer(_channels, length) { const samples = new Float32Array(length); return {copyToChannel: a => samples.set(a), getChannelData: () => samples}; }
    createBufferSource() { const node = {buffer: null, connect() {}, start(t) { if (t === 0) zeroStarts++; }}; this.node = node; return node; }
    async startRendering() { return this.node.buffer; }
  }
  ctx.window.OfflineAudioContext = IdentityOffline;
  for (const name of ['rng', 'bakeCue', 'bakeScore']) vm.runInContext(functionSource(name), ctx);
  const a = await ctx.bakeScore(24000), b = await ctx.bakeScore(24000);
  const cues = vm.runInContext('cueSpecs', ctx);
  assert.equal(a.length, data.timeline.total_samples, 'SFX timeline must match canonical narration sample length');
  assert.equal(a.length, Math.round(duration * 24000)); assert.equal(sha(Buffer.from(a.buffer)), sha(Buffer.from(b.buffer)));
  assert.equal(contexts, cues.length * 2); assert.equal(zeroStarts, contexts);
  assert.ok(a.every(Number.isFinite));
  return {sampleRate: 24000, samples: a.length, canonicalNarrationSamples: data.timeline.total_samples, cues: cues.length, mockContexts: contexts, independentContextPerCue: true, repeatedMockOutputEqual: true, actualOfflineAudioContextTested: false};
});

await test('Snapshot remained unchanged during this run', 'STATIC_BYTE_RECHECK', () => {
  for (const name of sourceNames) assert.equal(sha(fs.readFileSync(path.join(root, name))), inputHashes[name], `${name} changed during QA`);
  assert.equal(sha(fs.readFileSync(bundlePath)), sha(html), 'Bundle changed during QA');
});

const failed = tests.filter(test => test.result === 'FAIL').length;
const report = {
  schema: 'cib-s1e01-nonbrowser-contract-qa-v1',
  generatedAtUTC: new Date().toISOString(),
  scope: 'Static bytes/import parsing plus isolated production-function tests with mock DOM, media, and offline-audio objects. No browser or renderer was started.',
  producerIndependence: {playerAndBuildReview: 'Separate reviewer did not author player/build', audioApproval: 'EXCLUDED: reviewer produced the narration pipeline'},
  notTested: ['WebGL image correctness or frame order independence', 'Real browser playback or decoding', 'Real OfflineAudioContext output', 'Fullscreen appearance and interaction', 'Mobile layout and accessibility behavior', 'Human listening, pronunciation, translation or editorial release approval', 'External source URL availability'],
  inputs: {bundlePath, bundleSHA256: sha(html), bundleBytes: Buffer.byteLength(html), sourceSHA256: inputHashes, qaScriptSHA256: sha(fs.readFileSync(fileURLToPath(import.meta.url)))},
  summary: {passed: tests.length - failed, failed, total: tests.length, verdict: failed ? 'CONTRACT_FAILURES' : 'NON_BROWSER_CONTRACTS_PASS_ONLY', releaseApproval: false},
  warnings, tests,
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
process.exitCode = failed ? 1 : 0;
