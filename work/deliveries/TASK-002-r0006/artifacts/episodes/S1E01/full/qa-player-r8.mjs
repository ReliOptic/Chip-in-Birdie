#!/usr/bin/env node
/**
 * Bounded R8 cinematic/runtime regression checks. No browser, real renderer or network.
 * node --experimental-vm-modules qa-player-r8.mjs
 *   [--bundle /path/to/S1E01-full-documentary.html] [--site /path/to/dist]
 *   [--archive /path/to/archive]
 * Actual production modules/control handlers run with mock DOM, Image, media,
 * cinematic renderer and OfflineAudioContext. PASS is not audiovisual approval.
 * Synthetic narration bytes test fetch/hash/Blob handling, NOT MP3 decoding.
 * JSON goes to stdout; this script does not write files.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {validateTimeline, readArchive} from './build.mjs';
import {buildFabShots} from './fab-shotplan-r8.mjs';

assert.equal(typeof vm.SourceTextModule, 'function', 'Run Node with --experimental-vm-modules');
const root = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  assert(['--bundle', '--site', '--archive', '--timeline'].includes(process.argv[i]) && process.argv[i + 1], 'Expected --bundle FILE, --site DIR, --archive DIR or --timeline FILE');
  args[process.argv[i].slice(2)] = path.resolve(process.argv[i + 1]);
}
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const names = ['film.mjs','player.html','build.mjs','qa-player-r8.mjs','fab-director-r8.mjs','fab-shotplan-r8.mjs','fab-hardware-r8.mjs','fab-hall-r8.mjs','fab-facility-r8.mjs','fab-process-r8.mjs','fab-editorial-r8.mjs','software-renderer.mjs','script.json','claims.json','sources.json','THIRD_PARTY_NOTICES.txt'];
const inputHashes = Object.fromEntries(names.map(name => [name, sha(read(name))]));
const film = read('film.mjs'), player = read('player.html'), tests = [], artifactHashes = {};
async function test(name, method, run) {
  try { const detail = await run(); tests.push({name, method, result: 'PASS', ...(detail === undefined ? {} : {detail})}); }
  catch (error) { tests.push({name, method, result: 'FAIL', error: String(error.message || error).slice(0,1800)}); }
}
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return {promise, resolve, reject}; }
const settle = () => new Promise(resolve => setImmediate(resolve));
const fixtureRows = [
  {id: 'r1', chapter: 'first', en: 'A recorded choice.', ko: '기록된 선택입니다.', claim: ['C1'], start: .12, end: 3.5},
  {id: 'r2', chapter: 'first', en: 'A document supplies the conditions.', ko: '문서에 조건이 나옵니다.', claim: ['C1'], start: 4, end: 7.4},
  {id: 'r3', chapter: 'second', en: 'The choice has consequences.', ko: '그 선택에는 결과가 따릅니다.', claim: ['C1'], start: 8, end: 11.5}
].map(row => ({...row, start_sample: Math.round(row.start * 24000), end_sample: Math.round(row.end * 24000)}));
const narrationBytes = Buffer.from(Array.from({length: 4096}, (_, i) => (i * 31 + 17) % 256));
const narrationSHA = sha(narrationBytes); // Synthetic bytes; never decoded as an MP3 in this harness.
function fixture() {
  return {
    script: {title: 'Runtime test fixture, not film content', revision: 'S1E01-runtime-fixture-r8', chapters: [{id: 'first', title: 'The record'}, {id: 'second', title: 'The consequence'}], sentences: fixtureRows.map(row => ({...row}))},
    timeline: {duration: 12, total_samples: 288000, sample_rate: 24000, sentences: fixtureRows.map(row => ({...row})), source_script_sha256: 'fixture-script-hash', outputs: {mp3: {sha256: narrationSHA}}},
    audio_sha256: narrationSHA,
    claims: [{id: 'C1', kind: 'test_fixture', claim: 'An isolated runtime fixture.', limitation: 'No historical claim.', sources: ['S1'], locator: 'Fixture only'}],
    sources: [{id: 'S1', title: 'Fixture record', note: 'Synthetic test metadata.', url: 'https://example.test/source'}],
    notices: 'Fixture notices',
    archiveCredits: [0, 1, 2].map(n => ({id: 'image' + n, title: 'Fixture image ' + n, creator: 'Test author', date_label: 'Test capture', caution: 'Mock image, not pixels', license: 'Fixture license', source_url: 'https://example.test/image/' + n, license_url: 'https://example.test/license', sha256: 'not-an-asset-hash'})),
    archiveRights: {global_usage_notes: ['Fixture attribution is retained.']},
    assets: {narration: 'fixture:narration', archive: Object.fromEntries([0, 1, 2].map(n => ['image' + n, 'fixture:image' + n]))},
    deliveryMode: 'site'
  };
}
async function harness(options = {}) {
  const config = {stage: null, imageFailure: null, drawFailure: false, invalidShot: false, fullscreenBlocked: false, storageDenied: false, fetchStatus: 200, fetchFailure: false, fetchBytes: null, fetchPending: false, fontPending: false, cryptoUnavailable: false, ...options};
  const gate = deferred(), fetchGate = deferred(), fontGate = deferred(), nodes = new Map(), allNodes = [], docEvents = new Map(), winEvents = new Map(), raf = [];
  const counts = {fetches: [], fetchReads: 0, blobs: [], revokedURLs: [], imageLoads: [], rendererCreated: 0, draws: [], mediaPlay: 0, mediaPause: 0, mediaLoad: 0, resume: 0, sfxStarts: [], sfxStops: 0, offlineContexts: 0, offlineStarts: [], paintFallback: 0};
  let stored = options.stored === undefined ? null : typeof options.stored === 'string' ? options.stored : JSON.stringify(options.stored);
  const data = options.data || fixture();
  let document, media, rendererArgs;
  class Node {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.dataset = {}; this.attributes = {};
      this.textContent = ''; this.hidden = false; this.disabled = false; this.width = 960; this.height = 540; this.value = '';
      this.classList = {values: new Set(), toggle(name, on) { if (on) this.values.add(name); else this.values.delete(name); }};
      this.events = new Map(); allNodes.push(this);
    }
    append(...children) { for (const child of children) { this.children.push(child); if (child && typeof child === 'object') child.parentNode = this; } }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name]; }
    get firstElementChild() { return this.children[0]; }
    getBoundingClientRect() { return {width: 960, height: 540}; }
    scrollIntoView() { this.scrolled = true; }
    focus() { document.activeElement = this; }
    matches(selector) { return selector.split(',').includes(this.tagName.toLowerCase()); }
    closest(selector) { return this.matches(selector) ? this : null; }
    addEventListener(name, callback) { if (!this.events.has(name)) this.events.set(name, []); this.events.get(name).push(callback); }
    click() { return this.onclick?.({target: this, preventDefault() {}}); }
    async requestFullscreen() {
      if (config.fullscreenPending) await gate.promise;
      if (config.fullscreenBlocked) throw new Error('Synthetic fullscreen denial');
      document.fullscreenElement = this; emitDoc('fullscreenchange');
    }
    getContext(type) {
      assert.equal(type, '2d');
      return {
        setTransform() {}, fillRect() { counts.paintFallback++; }, fillText() {},
        getImageData: () => ({data: new Uint8ClampedArray(this.width * this.height * 4)})
      };
    }
  }
  for (const match of player.matchAll(/<([a-zA-Z0-9]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const node = new Node(match[1]); node.id = match[2]; node.disabled = /\bdisabled\b/.test(match[0]); node.hidden = /\bhidden\b/.test(match[0]); nodes.set(node.id, node);
  }
  nodes.get('caption').append(new Node('span'));
  nodes.get('film-data').textContent = JSON.stringify(data);
  const add = (map, name, callback) => { if (!map.has(name)) map.set(name, []); map.get(name).push(callback); };
  const emitDoc = (name, event = {}) => { for (const fn of docEvents.get(name) || []) fn(event); };
  document = {
    hidden: false, fullscreenElement: null, body: new Node('body'), documentElement: {outerHTML: player},
    fonts: {ready: config.fontPending ? fontGate.promise : Promise.resolve()}, getElementById: id => nodes.get(id) || null,
    createElement: tag => new Node(tag), createTextNode: text => ({textContent: String(text)}),
    querySelectorAll: selector => selector.includes('data-row') ? allNodes.filter(node => node.dataset.row) : selector.includes('#chapters') ? allNodes.filter(node => node.dataset.chapter) : [],
    addEventListener: (name, fn) => add(docEvents, name, fn),
    async exitFullscreen() { document.fullscreenElement = null; emitDoc('fullscreenchange'); }
  };
  class MockImage {
    naturalWidth = 1280; naturalHeight = 720;
    set src(value) {
      this._src = value; counts.imageLoads.push(value);
      Promise.resolve().then(() => {
        if (config.imageFailure && value.includes(config.imageFailure)) this.onerror?.();
        else this.onload?.();
      });
    }
    get src() { return this._src; }
    async decode() { if (config.decodeFailure) throw new Error('Synthetic decode rejection'); }
  }
  class MockAudio {
    currentTime = 0; paused = true; muted = false; readyState = 4; events = new Map();
    constructor(uri) { this.src = uri; media = this; }
    addEventListener(name, callback) { add(this.events, name, callback); }
    emit(name) { this['on' + name]?.(); for (const callback of this.events.get(name) || []) callback(); }
    pause() { this.paused = true; counts.mediaPause++; }
    play() { this.paused = false; counts.mediaPlay++; return config.stage === 'media' ? gate.promise : Promise.resolve(); }
    load() { counts.mediaLoad++; }
  }
  function buffer(length, sampleRate) {
    const samples = new Float32Array(length);
    return {sampleRate, length, copyToChannel: values => samples.set(values), getChannelData: () => samples};
  }
  class MockAudioContext {
    sampleRate = 24000; destination = {};
    resume() { counts.resume++; return config.stage === 'resume' ? gate.promise : Promise.resolve(); }
    createMediaElementSource() { return {connect() {}}; }
    createBuffer(_channels, length, sr) { return buffer(length, sr); }
    createBufferSource() { return {connect() {}, disconnect() {}, start(_when, at) { counts.sfxStarts.push(at); }, stop() { counts.sfxStops++; }}; }
  }
  class IdentityOffline {
    constructor(_channels, length, sr) { counts.offlineContexts++; this.length = length; this.sampleRate = sr; this.destination = {}; }
    createBuffer(_channels, length, sr) { return buffer(length, sr); }
    createBufferSource() { const node = {connect() {}, start(at) { counts.offlineStarts.push(at); }, buffer: null}; this.node = node; return node; }
    async startRendering() { if (config.stage === 'prepare') await gate.promise; return this.node.buffer; }
  }
  const win = {devicePixelRatio: 1, addEventListener: (name, fn) => add(winEvents, name, fn), AudioContext: MockAudioContext, OfflineAudioContext: IdentityOffline};
  class MockURL extends URL {
    static createObjectURL(blob) {
      const uri = 'blob:fixture-' + (counts.blobs.length + 1);
      counts.blobs.push({uri, blob}); return uri;
    }
    static revokeObjectURL(uri) { counts.revokedURLs.push(uri); }
  }
  const mockFetch = async uri => {
    assert.equal(uri, data.assets.narration, 'Only the declared narration asset may be fetched');
    counts.fetches.push(uri);
    if (config.fetchPending) await fetchGate.promise;
    if (config.fetchFailure) throw new Error('Synthetic narration network rejection');
    return {
      ok: config.fetchStatus >= 200 && config.fetchStatus < 300, status: config.fetchStatus,
      async arrayBuffer() {
        counts.fetchReads++;
        const bytes = Buffer.from(config.fetchBytes || config.narrationBytes || narrationBytes);
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      }
    };
  };
  const context = vm.createContext({
    console, window: win, document, Image: MockImage, Audio: MockAudio, URLSearchParams, URL: MockURL, Blob,
    fetch: mockFetch, crypto: config.cryptoUnavailable ? {} : crypto.webcrypto,
    location: {hash: options.hash || '', search: options.search || '', reload() { counts.reloads = (counts.reloads || 0) + 1; }},
    localStorage: {getItem(key) { assert.equal(key, 'cib-s1e01-r8'); if (config.storageDenied) throw new Error('Storage unavailable'); return stored; }, setItem(key, value) { assert.equal(key, 'cib-s1e01-r8'); if (config.storageDenied) throw new Error('Storage unavailable'); stored = value; }},
    requestAnimationFrame: fn => { raf.push(fn); return raf.length; }, performance: {now: () => 0}
  });
  const createCinematicFilm = supplied => {
    counts.rendererCreated++; rendererArgs = supplied;
    const list = options.useActualShots ? buildFabShots(supplied.script, supplied.timeline) : supplied.timeline.sentences.map((row, index, source) => ({
      id: 'fixture-shot-' + row.id, ordinal: index + 1, t0: index ? row.start : 0, t1: source[index + 1]?.start ?? supplied.timeline.duration,
      kind: ['spatial', 'document', 'spatial'][index],
      assetIds: config.invalidShot ? ['missing'] : index === 1 ? ['image1'] : [],
      rowId: row.id,
      ...(index === 0 ? {set: 'hall', event: 'handoff', eventClock: {t0: 0, t1: 4, p0: 0, p1: 1}} : index === 2 ? {set: 'process', event: 'load', eventClock: {t0: 8, t1: 12, p0: .16, p1: 1}} : {})
    }));
    return {
      backend: 'MOCK_CINEMATIC_RENDERER_NO_PIXELS', shots: list, state: null,
      dispose() { counts.disposals = (counts.disposals || 0) + 1; },
      draw(t) {
        if (config.drawFailure) throw new Error('Synthetic cinematic draw failure');
        counts.draws.push(t); const shot = list.find(shot => t >= shot.t0 && t < shot.t1) || list.at(-1);
        this.state = {...shot, shot, backend: this.backend, detail: 'Stub state; no pixels rendered'}; return this.state;
      }
    };
  };
  const dependency = new vm.SyntheticModule(['createCinematicFilm'], function() { this.setExport('createCinematicFilm', createCinematicFilm); }, {context});
  const module = new vm.SourceTextModule(film, {context, identifier: 'production:film.mjs'});
  await module.link(specifier => { assert.equal(specifier, './fab-director-r8.mjs'); return dependency; });
  await module.evaluate();
  const handle = {
    win, context, document, nodes, counts, config, gate, fetchGate, fontGate, data, get media() { return media; }, get rendererArgs() { return rendererArgs; },
    get boot() { return win.__bootPromise; }, readStorage: () => stored && JSON.parse(stored),
    frame(wall = 100) { const callbacks = raf.splice(0); for (const callback of callbacks) callback(wall); },
    emitDoc, press(key, target = new Node('div')) { const event = {key, target, preventDefault() { this.prevented = true; }}; emitDoc('keydown', event); return event; },
    findButtons: predicate => allNodes.filter(node => node.tagName === 'BUTTON' && predicate(node))
  };
  if (options.awaitBoot !== false) await handle.boot;
  return handle;
}
function tree(node) { return [node, ...(node.children || []).flatMap(tree)]; }
const controlMethod = 'ACTUAL_PRODUCTION_MODULE_WITH_MOCK_DOM_IMAGE_MEDIA_CINEMATIC_RENDERER_AND_AUDIO';

await test('Cinematic entry and HTML controls are structurally connected', 'REAL_JS_PARSE_AND_STATIC_HTML_CSS', () => {
  assert.deepEqual([...new vm.SourceTextModule(film).dependencySpecifiers], ['./fab-director-r8.mjs']);
  assert(!/worlds\.|Cirrus/.test(film), 'Legacy miniature world or rejected story text remains active');
  for (const name of names.filter(name => name.endsWith('.mjs'))) new vm.SourceTextModule(read(name));
  new vm.SourceTextModule(read('build.mjs'));
  const ids = [...player.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id] of film.matchAll(/\$\('([^']+)'\)/g)) assert(ids.includes(id), 'Missing DOM id: ' + id);
  for (const id of ['fs-play', 'fs-seek', 'fs-time', 'fs-mute', 'fs-locale', 'fs-exit', 'archive-credits', 'download-film']) assert(ids.includes(id));
  assert.match(player, /\.screen:is\(:fullscreen,\.theater\) #picture\{[^}]*177\.777778vh[^}]*56\.25vw/);
  assert.match(player, /\.screen\.theater\{[^}]*position:fixed[^}]*inset:0[^}]*z-index:/);
  assert.match(player, /\.screen:not\(:fullscreen\):not\(\.theater\) #caption\{display:none!important/);
  assert.match(player, /body\.theater-open\{overflow:hidden\}/);
  assert.match(player, /color-scheme:light/);
});
await test('Images, verified narration and fonts precede cinematic startup', controlMethod, async () => {
  const h = await harness();
  assert.equal(h.win.__ready, true); assert.equal(h.counts.imageLoads.length, 3); assert.equal(h.counts.rendererCreated, 1);
  assert.equal(Object.keys(h.rendererArgs.images).length, 3); assert.equal(h.counts.mediaPlay, 0);
  assert.equal(h.win.__timeline.SHOTS.length, 3); assert.equal(h.win.__state().backend, 'MOCK_CINEMATIC_RENDERER_NO_PIXELS');
  assert.equal(h.win.__state().resolution[0], 960); assert.equal(h.win.__state().resolution[1], 540);
});
await test('Narration fetch verifies all bytes before attaching one audio/mpeg Blob', controlMethod, async () => {
  const h = await harness();
  assert.deepEqual(h.counts.fetches, ['fixture:narration']); assert.equal(h.counts.fetchReads, 1);
  assert.equal(h.counts.blobs.length, 1); assert.equal(h.counts.mediaLoad, 1);
  const {uri, blob} = h.counts.blobs[0];
  assert.equal(blob.type, 'audio/mpeg'); assert.equal(blob.size, narrationBytes.length);
  assert.equal(sha(Buffer.from(await blob.arrayBuffer())), narrationSHA); assert.equal(h.media.src, uri);
  assert.equal(h.win.__state().narrationIntegrity, 'SHA-256 verified');
  assert.equal(h.counts.mediaPlay, 0); assert.equal(h.win.__state().playing, false);
  return {syntheticBytes: narrationBytes.length, syntheticSHA256: narrationSHA, actualMP3Decoding: false};
});
await test('Pending narration and fonts keep controls blocked with no premature play', controlMethod, async () => {
  const h = await harness({fetchPending: true, fontPending: true, awaitBoot: false});
  await settle(); assert.equal(h.win.__ready, false); assert.equal(h.counts.rendererCreated, 0);
  await h.win.__film.play(); assert.equal(h.counts.mediaPlay, 0); assert.equal(h.counts.fetches.length, 1);
  for (const id of ['play','fs-play','big-play']) assert.equal(h.nodes.get(id).disabled, true);
  h.fetchGate.resolve(); await settle(); await settle();
  assert.equal(h.win.__ready, false); assert.equal(h.counts.rendererCreated, 0);
  h.fontGate.resolve(); await h.boot;
  assert.equal(h.win.__ready, true); assert.equal(h.counts.fetches.length, 1); assert.equal(h.counts.blobs.length, 1);
  assert.equal(h.counts.mediaPlay, 0);
});
for (const [label, config, message, reads] of [
  ['HTTP failure', {fetchStatus: 503}, /HTTP 503/, 0],
  ['network rejection', {fetchFailure: true}, /network rejection/, 0],
  ['truncated body', {fetchBytes: Buffer.alloc(1023)}, /empty or truncated/, 1],
  ['SHA mismatch', {fetchBytes: Buffer.alloc(4096, 42)}, /hash mismatch/, 1]
]) {
  await test('Narration ' + label + ' cannot play or initialize pictures; explicit retry recovers', controlMethod, async () => {
    const h = await harness({...config, stored: {time: 5.25, locale: 'en', muted: true}});
    assert.equal(h.win.__ready, false); assert.equal(h.win.__state().archiveState, 'error');
    assert.match(h.win.__state().archiveError, message); assert.equal(h.counts.rendererCreated, 0);
    assert.equal(h.counts.fetchReads, reads); assert.equal(h.counts.blobs.length, 0); assert.equal(h.counts.mediaLoad, 0);
    assert.equal(h.win.__state().narrationIntegrity, 'not loaded'); assert.equal(h.win.__state().time, 5.25);
    for (const id of ['play','fs-play','big-play']) {
      assert.equal(h.nodes.get(id).disabled, true); await h.nodes.get(id).onclick();
    }
    await h.win.__film.play(); assert.equal(h.counts.mediaPlay, 0);
    h.config.fetchStatus = 200; h.config.fetchFailure = false; h.config.fetchBytes = null;
    const retry = h.nodes.get('error').children.find(node => node.tagName === 'BUTTON'); assert(retry);
    await retry.onclick(); assert.equal(h.win.__ready, true); assert.equal(h.counts.fetches.length, 2);
    assert.equal(h.counts.blobs.length, 1); assert.equal(h.counts.mediaLoad, 1);
    assert.equal(h.win.__state().narrationIntegrity, 'SHA-256 verified');
    assert.equal(h.win.__state().time, 5.25); assert.equal(h.nodes.get('locale').value, 'en'); assert.equal(h.media.muted, true);
    assert.equal(h.counts.mediaPlay, 0); assert.equal(h.win.__state().playing, false);
    await h.win.__film.play(); assert.equal(h.counts.mediaPlay, 1); assert.equal(h.media.currentTime, 5.25);
  });
}
await test('Absent subtle crypto is reported as unverified rather than claiming SHA verification', controlMethod, async () => {
  const h = await harness({cryptoUnavailable: true});
  assert.equal(h.win.__ready, true); assert.equal(h.counts.blobs.length, 1);
  assert.equal(h.win.__state().narrationIntegrity, 'Loaded; SHA-256 API unavailable');
  return {fallbackPolicy: 'Production permits full-length unchecked audio when subtle crypto is absent; this is not a hash-verification pass.'};
});
await test('An image load failure blocks playback, renders error and retries', controlMethod, async () => {
  const h = await harness({imageFailure: 'image1'});
  assert.equal(h.win.__ready, false); assert.equal(h.win.__state().archiveState, 'error');
  assert.equal(h.nodes.get('error').style.display, 'block'); assert.match(h.nodes.get('error').children[0].textContent, /image1/);
  assert(h.counts.paintFallback > 0); assert.equal(h.counts.rendererCreated, 0);
  await h.win.__film.play(); assert.equal(h.counts.mediaPlay, 0);
  h.config.imageFailure = null; await h.nodes.get('error').children.find(node => node.tagName === 'BUTTON').onclick();
  assert.equal(h.win.__ready, true); assert.equal(h.nodes.get('play').disabled, false);
  assert.equal(h.counts.fetches.length, 1); assert.equal(h.counts.blobs.length, 1); // verified narration is reused on image retry.
});
await test('Image decode failures and missing shot assets are explicit errors', controlMethod, async () => {
  const decode = await harness({decodeFailure: true}); assert.equal(decode.win.__ready, false); assert.match(decode.win.__state().archiveError, /decoded/);
  const missing = await harness({invalidShot: true}); assert.equal(missing.win.__ready, false); assert.match(missing.win.__state().archiveError, /missing/);
});
await test('A draw failure stops media and can retry the same position', controlMethod, async () => {
  const h = await harness(); await h.win.__film.play();
  h.config.drawFailure = true; h.win.__seek(6.25);
  assert.equal(h.win.__ready, false); assert.equal(h.win.__state().playing, false); assert.equal(h.media.paused, true);
  h.config.drawFailure = false; await h.nodes.get('error').children.find(node => node.tagName === 'BUTTON').onclick();
  assert.equal(h.win.__ready, true); assert.equal(h.win.__state().time, 6.25);
});
await test('Reload restoration is not erased by initialization', controlMethod, async () => {
  const h = await harness({stored: {time: 5.25, locale: 'en', muted: true}});
  assert.equal(h.win.__state().time, 5.25); assert.equal(h.win.__state().playing, false); assert.equal(h.media.muted, true);
  assert.equal(h.nodes.get('locale').value, 'en'); assert.equal(h.nodes.get('mute').getAttribute('aria-pressed'), 'true');
  assert.equal(h.readStorage().time, 5.25);
});
await test('Invalid storage and denied storage do not block the film', controlMethod, async () => {
  const broken = await harness({stored: '{broken'}); assert.equal(broken.win.__ready, true); assert.equal(broken.win.__state().time, 0);
  const denied = await harness({storageDenied: true}); assert.equal(denied.win.__ready, true); denied.win.__seek(4); assert.equal(denied.win.__state().time, 4);
  const invalid = await harness({stored: {time: 'NaN', locale: 'invalid', muted: false}}); assert.equal(invalid.win.__state().time, 0); assert.equal(invalid.nodes.get('locale').value, 'ko');
});
for (const stage of ['prepare', 'resume', 'media']) {
  await test('Seek cancels pending playback during ' + stage, controlMethod, async () => {
    const h = await harness({stage}), playing = h.win.__film.play(); await settle();
    assert.equal(h.win.__state().pendingPlay, true);
    h.win.__seek(6.25); h.gate.resolve(); await playing;
    assert.equal(h.win.__state().time, 6.25); assert.equal(h.win.__state().pendingPlay, false); assert.equal(h.win.__state().playing, false);
    assert.equal(h.media.paused, true); assert.equal(h.counts.sfxStarts.length, 0);
  });
}
await test('Visibility change cancels a pending audio start', controlMethod, async () => {
  const h = await harness({stage: 'prepare'}), playing = h.win.__film.play();
  h.document.hidden = true; h.emitDoc('visibilitychange'); h.gate.resolve(); await playing;
  assert.equal(h.win.__state().pendingPlay, false); assert.equal(h.win.__state().playing, false); assert.equal(h.counts.mediaPlay, 0);
});
await test('Play is idempotent and pause captures the actual media clock', controlMethod, async () => {
  const h = await harness(); await h.win.__film.play(); await h.win.__film.play();
  assert.equal(h.counts.mediaPlay, 1); h.media.currentTime = 2.25; h.win.__film.pause();
  assert.equal(h.win.__state().time, 2.25); assert.equal(h.readStorage().time, 2.25); assert.equal(h.nodes.get('status').textContent, 'Paused');
});
await test('Preparation rejection preserves position and retry works', controlMethod, async () => {
  const h = await harness({stage: 'prepare'}); h.win.__seek(2);
  const playing = h.win.__film.play(); h.gate.reject(new Error('Synthetic preparation rejection')); await playing;
  assert.equal(h.win.__state().time, 2); assert.equal(h.win.__state().playing, false); assert.equal(h.nodes.get('status').textContent, 'Audio needs retry');
  h.config.stage = null; await h.nodes.get('error').children.find(node => node.tagName === 'BUTTON').onclick();
  assert.equal(h.win.__state().playing, true); assert.equal(h.win.__state().time, 2);
});
await test('Media decode failure has an actionable reload/retry', controlMethod, async () => {
  const h = await harness(); h.win.__seek(4.25); await h.win.__film.play(); h.media.emit('error');
  assert.equal(h.win.__state().playing, false); assert.equal(h.win.__state().time, 4.25);
  await h.nodes.get('error').children.find(node => node.tagName === 'BUTTON').onclick();
  assert.equal(h.counts.mediaLoad, 2); assert.equal(h.counts.fetches.length, 1); assert.equal(h.counts.blobs.length, 1); assert.equal(h.win.__state().playing, true);
});
await test('Media clock drives picture, natural ending, persisted replay', controlMethod, async () => {
  const h = await harness(); await h.win.__film.play(); h.media.currentTime = 11.99; h.frame(1000);
  assert.equal(h.win.__state().time, 11.99); assert.equal(h.win.__state().playing, true);
  h.media.currentTime = 12.05; h.frame(2000); assert.equal(h.win.__state().time, 12);
  h.media.emit('ended'); assert.equal(h.win.__state().playing, false); assert.equal(h.readStorage().time, 0);
  await h.win.__film.play(); assert.equal(h.win.__state().time, 0); assert.equal(h.media.currentTime, 0);
});
await test('Buffering holds SFX including mute toggles and resumes once', controlMethod, async () => {
  const h = await harness(); await h.win.__film.play(); const before = h.counts.sfxStarts.length;
  h.media.currentTime = 3.25; h.media.emit('waiting'); assert.equal(h.win.__state().buffering, true);
  await h.win.__meta.audio.setEnabled(false); await h.win.__meta.audio.setEnabled(true);
  assert.equal(h.counts.sfxStarts.length, before, 'Unmute must not restart SFX while buffering');
  h.media.currentTime = 3.5; h.media.emit('playing'); assert.equal(h.win.__state().buffering, false); assert.equal(h.counts.sfxStarts.at(-1), 3.5);
  const resumed = h.counts.sfxStarts.length; h.media.emit('playing'); assert.equal(h.counts.sfxStarts.length, resumed);
  h.media.readyState = 3; h.media.emit('stalled'); assert.equal(h.win.__state().buffering, false);
  h.media.readyState = 2; h.media.emit('stalled'); assert.equal(h.win.__state().buffering, true);
  h.win.__film.pause(); h.media.emit('playing'); assert.equal(h.win.__state().playing, false); assert.equal(h.win.__state().buffering, false);
});
await test('Mute state is shared by normal/fullscreen controls and persistence', controlMethod, async () => {
  const h = await harness(); await h.win.__film.play(); await h.win.__meta.audio.setEnabled(false);
  assert.equal(h.media.muted, true); assert.equal(h.readStorage().muted, true);
  for (const id of ['mute', 'fs-mute']) { assert.equal(h.nodes.get(id).getAttribute('aria-pressed'), 'true'); assert.equal(h.nodes.get(id).getAttribute('aria-label'), 'Unmute narration'); }
  h.media.currentTime = 5.5; await h.win.__meta.audio.setEnabled(true); assert.equal(h.media.muted, false); assert.equal(h.counts.sfxStarts.at(-1), 5.5);
});
await test('A stale async enable cannot override a newer mute', controlMethod, async () => {
  const h = await harness({stage: 'prepare'});
  const old = h.win.__meta.audio.setEnabled(true); await h.win.__meta.audio.setEnabled(false); h.gate.resolve(); await old;
  assert.equal(h.win.__meta.audio.enabled, false); assert.equal(h.media.muted, true);
});
await test('Captions follow recorded boundaries, locale and off state', controlMethod, async () => {
  const h = await harness(); h.win.__seek(0); assert.equal(h.nodes.get('caption').firstElementChild.textContent, '');
  h.win.__seek(.12); assert.equal(h.nodes.get('caption').firstElementChild.textContent, fixtureRows[0].ko);
  h.nodes.get('locale').onchange({target: {value: 'en'}}); assert.equal(h.nodes.get('caption').firstElementChild.textContent, fixtureRows[0].en);
  assert.equal(h.nodes.get('fs-locale').value, 'en'); h.win.__seek(3.8); assert.equal(h.nodes.get('caption').firstElementChild.textContent, '');
  h.nodes.get('fs-locale').onchange({target: {value: 'off'}}); h.win.__seek(4); assert.equal(h.nodes.get('caption').style.display, 'none');
});
await test('Transcript/evidence/credits preserve dynamic content and attribution', controlMethod, async () => {
  const h = await harness(), button = h.findButtons(node => node.dataset.row === 'r2')[0]; button.onclick();
  assert.equal(h.win.__state().time, 4);
  const evidence = h.findButtons(node => node.getAttribute('aria-label') === 'Evidence for passage at 00:04')[0]; evidence.onclick();
  assert.equal(h.nodes.get('sources').hidden, false);
  assert(tree(h.nodes.get('passage-evidence')).some(node => node.href === 'https://example.test/source'));
  const texts = tree(h.nodes.get('archive-credits')).map(node => node.textContent || '').join('\n');
  for (const value of ['Fixture image 0', 'Test author', 'Mock image, not pixels', 'Fixture license', 'Fixture attribution is retained.', '"sha256"']) assert(texts.includes(value), 'Missing credit content: ' + value);
});
await test('Native fullscreen and cinema fallback preserve playback and restore the page', controlMethod, async () => {
  const h = await harness(); await h.nodes.get('fullscreen').onclick(); assert.equal(h.document.fullscreenElement, h.nodes.get('screen'));
  assert.equal(h.win.__state().viewMode, 'native-fullscreen'); assert(!h.nodes.get('screen').classList.values.has('theater'));
  await h.nodes.get('fs-exit').onclick(); assert.equal(h.document.fullscreenElement, null); assert.equal(h.win.__state().viewMode, 'inline');
  h.document.body.style.overflow = 'auto'; h.win.__seek(4); await h.win.__film.play();
  h.config.fullscreenBlocked = true; await h.nodes.get('fullscreen').onclick();
  assert.equal(h.document.fullscreenElement, null); assert.equal(h.win.__state().viewMode, 'theater');
  assert(h.nodes.get('screen').classList.values.has('theater')); assert(h.document.body.classList.values.has('theater-open'));
  assert.equal(h.document.body.style.overflow, 'hidden'); assert.equal(h.nodes.get('status').textContent, 'Cinema view');
  assert.equal(h.nodes.get('fs-exit').getAttribute('aria-label'), 'Exit cinema view');
  assert.equal(h.win.__ready, true); assert.equal(h.win.__state().playing, true); assert.equal(h.win.__state().time, 4);
  assert.equal(h.document.activeElement, h.nodes.get('fs-play'));
  await h.nodes.get('fs-exit').onclick(); assert.equal(h.win.__state().viewMode, 'inline');
  assert.equal(h.document.body.style.overflow, 'auto'); assert(!h.nodes.get('screen').classList.values.has('theater'));
  assert(!h.document.body.classList.values.has('theater-open')); assert.equal(h.document.activeElement, h.nodes.get('fullscreen'));
  assert.equal(h.win.__state().playing, true); assert.equal(h.nodes.get('status').textContent, 'Playing');
  await h.nodes.get('fullscreen').onclick(); h.press('Escape', h.nodes.get('fs-locale'));
  assert.equal(h.win.__state().viewMode, 'inline'); assert.equal(h.document.body.style.overflow, 'auto');
});
await test('Missing fullscreen API falls back; a cancelled request cannot reopen a view', controlMethod, async () => {
  const missing = await harness(); missing.nodes.get('screen').requestFullscreen = undefined;
  await missing.nodes.get('fullscreen').onclick(); assert.equal(missing.win.__state().viewMode, 'theater');
  await missing.nodes.get('fullscreen').onclick(); assert.equal(missing.win.__state().viewMode, 'inline');
  for (const blocked of [true, false]) {
    const h = await harness({fullscreenPending: true, fullscreenBlocked: blocked});
    const request = h.nodes.get('fullscreen').onclick(); assert.equal(h.win.__state().viewPending, true);
    h.press('Escape'); h.gate.resolve(); await request;
    assert.equal(h.win.__state().viewMode, 'inline'); assert.equal(h.document.fullscreenElement, null);
    assert.equal(h.win.__state().viewPending, false); assert(!h.nodes.get('screen').classList.values.has('theater'));
    assert(!h.document.body.classList.values.has('theater-open'));
  }
});
await test('Keyboard transport ignores focused controls and editable content', controlMethod, async () => {
  const h = await harness(); h.win.__seek(2); h.press('ArrowRight', h.nodes.get('seek')); assert.equal(h.win.__state().time, 2);
  h.press('ArrowRight'); assert.equal(h.win.__state().time, 7); h.press('Home'); assert.equal(h.win.__state().time, 0);
  h.press('End'); assert.equal(h.win.__state().time, 12);
  h.nodes.get('sources-toggle').onclick(); h.press('Escape'); assert.equal(h.nodes.get('sources').hidden, true);
});
await test('Headless review starts paused and ignores saved playback position', controlMethod, async () => {
  const h = await harness({hash: '#headless', stored: {time: 5, locale: 'en', muted: true}});
  assert.equal(h.win.__state().time, 0); assert.equal(h.win.__state().playing, false);
  assert.equal(h.nodes.get('start').style.display, 'none'); assert.equal(h.win.__meta.loop, false); assert.equal(h.win.__meta.fps, 30);
});
await test('Seeded archive/action SFX repeat under independent identity offline mocks', 'ACTUAL_SFX_CODE_IDENTITY_OFFLINE_MOCK_NOT_AUDIO_RENDERING', async () => {
  const h = await harness(), result = await h.win.__meta.audio.verify();
  assert.equal(result.equal, true); assert.equal(result.finite, true); assert.equal(result.samples, 288000);
  assert(result.cues > 0 && result.cues <= 16); assert.equal(h.counts.offlineContexts, result.cues * 2); assert(h.counts.offlineStarts.every(t => t === 0));
  assert(h.win.__timeline.SCORE.every(cue => ['paper', 'cut', 'reveal', 'wheels', 'contact', 'latch', 'servo', 'air', 'room', 'pump'].includes(cue.kind)));
  for (const [event, p, kind, at] of [['handoff',.005,'wheels',.02],['handoff',.23,'servo',.92],['handoff',.53,'contact',2.12],['handoff',.61,'latch',2.44],['load',.19,'servo',8+(.19-.16)/.84*4],['load',.67,'contact',8+(.67-.16)/.84*4]]) {
    const cue = h.win.__timeline.SCORE.find(cue => cue.event === event && cue.p === p && cue.kind === kind);
    assert(cue, 'Missing authored action cue: ' + event + '/' + kind); assert(Math.abs(cue.t - at) < 1e-9, 'Action cue drift: ' + event + '/' + kind);
  }
  return {samples: result.samples, cues: result.cues, peak: result.peak, independentContexts: h.counts.offlineContexts, actualOfflineAudioContext: false};
});
await test('Build rejects stale audio/script, invalid PCM and mismatched passages', 'ACTUAL_EXPORTED_BUILD_VALIDATOR_NO_WRITES', () => {
  const valid = fixture();
  validateTimeline(valid.script, valid.timeline, 'fixture-script-hash', narrationSHA);
  const variants = [
    ['stale script', x => { x.timeline.source_script_sha256 = 'stale'; }],
    ['missing narration hash', x => { delete x.timeline.outputs.mp3.sha256; }],
    ['smoke result', x => { x.timeline.partial_smoke_test = true; }],
    ['incorrect duration', x => { x.timeline.duration += 1; }],
    ['changed text', x => { x.script.sentences[0].en = 'Different recording'; }],
    ['changed identifier', x => { x.timeline.sentences[0].id = 'wrong'; }],
    ['noncanonical samples', x => { x.timeline.sentences[0].start_sample += 1; }],
    ['overlap', x => { x.timeline.sentences[1].start = 1; }],
    ['missing chapter', x => { x.script.chapters.push({id: 'empty', title: 'Empty'}); }]
  ];
  for (const [label, mutate] of variants) { const value = fixture(); mutate(value); assert.throws(() => validateTimeline(value.script, value.timeline, 'fixture-script-hash', narrationSHA), undefined, label); }
  return {rejectedVariants: variants.map(([label]) => label)};
});

function parseHTML(html) {
  const dataTag = html.match(/<script id="film-data" type="application\/json">([\s\S]*?)<\/script>/);
  const mapTag = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  const loaderTag = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert(dataTag && mapTag && loaderTag, 'Film data, import map and module loader are required');
  const data = JSON.parse(dataTag[1]), imports = JSON.parse(mapTag[1]).imports, loader = loaderTag[1];
  assert(imports && typeof imports === 'object', 'Missing import-map entries');
  const entry = loader.match(/import\(['"]([^'"]+)['"]\)/)?.[1]; assert(entry, 'Missing module entry');
  new vm.SourceTextModule(loader);
  return {data, imports, loader, entry};
}
function decode(uri, mime) {
  assert.match(uri, /^data:[^,]+;base64,[A-Za-z0-9+/]*={0,2}$/);
  if (mime) assert(uri.startsWith('data:' + mime + ';base64,'), 'Unexpected embedded asset MIME');
  const encoded = uri.slice(uri.indexOf(',') + 1), bytes = Buffer.from(encoded, 'base64');
  assert.equal(bytes.toString('base64'), encoded, 'Noncanonical/truncated embedded base64');
  return bytes;
}
function inDirectory(directory, relative) {
  const target = path.resolve(directory, relative);
  assert(target.startsWith(path.resolve(directory) + path.sep), 'Asset path escapes delivery directory: ' + relative);
  return target;
}
function assertTemplate(html, data, entry, imports) {
  const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const json = value => JSON.stringify(value).replaceAll('<','\\u003c');
  const expected = player.replaceAll('__FILM_TITLE__', escape(data.script.title))
    .replace('__FILM_DATA__', json(data)).replace('__ENTRY_MODULE__', entry).replace('__IMPORT_MAP__', json({imports}));
  assert.equal(sha(html), sha(expected), 'Delivery HTML template differs from current player.html');
}
function assertFilmData(data) {
  const script = JSON.parse(read('script.json')); assert.deepEqual(data.script, script);
  assert.equal(script.sentences.length, 45, 'The current R8 45-passage episode must be retained');
  const rawClaims = JSON.parse(read('claims.json')); assert.deepEqual(data.claims, Array.isArray(rawClaims) ? rawClaims : rawClaims.claims);
  assert.deepEqual(data.sources, JSON.parse(read('sources.json'))); assert.equal(data.notices, read('THIRD_PARTY_NOTICES.txt'));
  assert.equal(data.pictureRevision, 'R8-fab-reportage');
  validateTimeline(script, data.timeline, sha(read('script.json')), data.audio_sha256);
  assert.equal(data.archiveCredits.length, Object.keys(data.assets.archive).length);
  assert.equal(new Set(data.archiveCredits.map(asset => asset.id)).size, data.archiveCredits.length);
  for (const asset of data.archiveCredits) {
    assert(data.assets.archive[asset.id]); assert(asset.creator && asset.license && asset.caution && asset.date_label);
    assert.match(asset.source_url, /^https?:\/\//); assert.match(asset.license_url, /^https?:\/\//);
  }
  if (args.archive) {
    const archive = readArchive(args.archive);
    assert.deepEqual(data.archiveCredits, archive.assets.map(asset => asset.credit), 'Delivery credits differ from source archive');
    assert.deepEqual(data.archiveRights, archive.publicMetadata);
  }
}
function inspectStandalone(html) {
  assert(!/__FILM_TITLE__|__FILM_DATA__|__ENTRY_MODULE__|__IMPORT_MAP__/.test(html), 'Unresolved placeholder');
  const {data, loader, entry, imports} = parseHTML(html); assertFilmData(data);
  assertTemplate(html, data, entry, imports); assert.equal(data.deliveryMode, 'standalone'); assert.equal(entry, 'cib-runtime/film.mjs');
  assert.equal(sha(decode(data.assets.narration, 'audio/mpeg')), data.audio_sha256);
  for (const asset of data.archiveCredits) {
    const bytes = decode(data.assets.archive[asset.id], asset.mime);
    assert.equal(sha(bytes), asset.sha256); assert.equal(bytes.length, asset.bytes);
  }
  const seen = new Set(), runtimeHashes = {};
  function inspect(specifier, originalFile) {
    if (seen.has(specifier)) return;
    seen.add(specifier); assert(Object.hasOwn(imports, specifier), 'Unmapped module: ' + specifier);
    const code = decode(imports[specifier], 'text/javascript').toString('utf8'), packed = new vm.SourceTextModule(code);
    if (specifier === 'three') {
      assert.equal(packed.dependencySpecifiers.length, 0, 'Pinned Three has an unbundled dependency');
      artifactHashes.pinnedThree = sha(Buffer.from(code));
      return;
    }
    assert.equal(specifier, 'cib-runtime/' + originalFile.split(path.sep).join('/'));
    const original = read(originalFile), source = new vm.SourceTextModule(original), dependencies = [...source.dependencySpecifiers];
    assert.equal(packed.dependencySpecifiers.length, dependencies.length, 'Module dependency count changed: ' + originalFile);
    let restored = code;
    [...packed.dependencySpecifiers].forEach((dep, i) => {
      const originalDep = dependencies[i];
      if (originalDep === 'three') { assert.equal(dep, 'three'); inspect(dep); }
      else {
        assert(originalDep.startsWith('.'), 'Unapproved source dependency: ' + originalDep);
        const relative = path.normalize(path.join(path.dirname(originalFile), originalDep));
        assert(!relative.startsWith('..') && !path.isAbsolute(relative), 'Runtime escapes episode source');
        assert.equal(dep, 'cib-runtime/' + relative.split(path.sep).join('/'));
        restored = restored.replaceAll(dep, originalDep); inspect(dep, relative);
      }
    });
    assert.equal(sha(restored), sha(original), 'Stale embedded module: ' + originalFile);
    runtimeHashes[originalFile] = sha(original);
  }
  inspect(entry, 'film.mjs');
  assert.deepEqual([...seen].sort(), Object.keys(imports).sort(), 'Unused or missing import-map entries');
  assert(seen.has('three'), 'Cinematic runtime must include the pinned Three module');
  for (const rejected of ['worlds.mjs','business-economics.mjs','business-institutions.mjs','business-transactions.mjs','cinema.mjs']) assert(!Object.hasOwn(runtimeHashes, rejected), 'Legacy miniature module is reachable: ' + rejected);
  return {data, imports, runtimeHashes, modules: Object.keys(runtimeHashes).length, moduleGraphEntries: seen.size, pinnedThreeSHA256: artifactHashes.pinnedThree};
}
if (args.archive) await test('Source archive manifest and every image hash are valid', 'ACTUAL_ASSET_BYTES_METADATA_NO_IMAGE_DECODING', () => {
  const archive = readArchive(args.archive);
  return {images: archive.assets.length, bytes: archive.assets.reduce((sum, item) => sum + item.credit.bytes, 0), ids: archive.assets.map(item => item.credit.id)};
});
if (args.bundle) await test('Standalone archive/audio/import-map graph equals current R8 sources', 'ACTUAL_BUNDLE_BYTES_REAL_JS_PARSE_NO_EVALUATION', () => {
  const html = fs.readFileSync(args.bundle, 'utf8'); artifactHashes.bundle = sha(html);
  const inspected = inspectStandalone(html);
  assert(Buffer.byteLength(html) < 25 * 1024 * 1024, 'Standalone exceeds the Sites delivery limit');
  return {bytes: Buffer.byteLength(html), sha256: artifactHashes.bundle, duration: inspected.data.timeline.duration, rows: inspected.data.timeline.sentences.length,
    images: inspected.data.archiveCredits.length, modules: inspected.modules, importMapEntries: inspected.moduleGraphEntries, pinnedThreeSHA256: inspected.pinnedThreeSHA256};
});
if (args.bundle) await test('Final build manifest, caption text/timings and every listed output hash agree', 'ACTUAL_BUILD_OUTPUT_BYTES_NO_RENDERING', () => {
  const directory = path.dirname(args.bundle), manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  const inspected = inspectStandalone(fs.readFileSync(args.bundle, 'utf8')), data = inspected.data;
  assert.equal(manifest.revision, 'R8-fab-reportage'); assert.equal(manifest.releaseApproval, false);
  assert.equal(manifest.utterances, 45); assert.equal(manifest.duration, data.timeline.duration);
  assert.equal(manifest.narrationRevision, data.script.revision); assert.equal(manifest.script_sha256, sha(read('script.json')));
  assert.equal(manifest.narration_sha256, data.audio_sha256); assert.equal(manifest.three_sha256, inspected.pinnedThreeSHA256);
  assert.deepEqual(manifest.runtimeSources, inspected.runtimeHashes, 'Runtime source hash register differs from current graph');
  assert.equal(new Set(manifest.files.map(file => file.path)).size, manifest.files.length);
  for (const file of manifest.files) {
    const bytes = fs.readFileSync(inDirectory(directory, file.path));
    assert.equal(bytes.length, file.bytes, 'Output length: ' + file.path); assert.equal(sha(bytes), file.sha256, 'Output hash: ' + file.path);
  }
  assert(manifest.files.some(file => file.path === path.basename(args.bundle)));
  const stamp = time => {
    const ms = Math.round(time * 1000);
    return Math.floor(ms / 3600000).toString().padStart(2,'0') + ':' + Math.floor(ms / 60000 % 60).toString().padStart(2,'0') + ':' + Math.floor(ms / 1000 % 60).toString().padStart(2,'0') + '.' + (ms % 1000).toString().padStart(3,'0');
  };
  for (const locale of ['en','ko']) {
    const expected = 'WEBVTT\n\n' + data.timeline.sentences.map(row => row.id + '\n' + stamp(row.start) + ' --> ' + stamp(row.end) + '\n' + row[locale] + '\n').join('\n');
    assert.equal(fs.readFileSync(path.join(directory, 'captions.' + locale + '.vtt'),'utf8'), expected);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'timeline.json'),'utf8')), data.timeline);
  return {listedOutputs: manifest.files.length, captions: ['en','ko'], rowsPerCaptionFile: 45, releaseApproval: false};
});
if (args.site) await test('Site module graph, local media, credits and download match final sources', 'ACTUAL_SITE_FILE_HASHES_REAL_JS_PARSE_NO_HTTP', () => {
  const dist = args.site, html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8'), {data, entry, imports} = parseHTML(html);
  artifactHashes.siteIndex = sha(html); assertFilmData(data); assertTemplate(html, data, entry, imports);
  assert.equal(data.deliveryMode, 'site'); assert.equal(entry, './film.mjs'); assert.deepEqual(imports, {three: './vendor/three.module.js'});
  assert.equal(data.assets.narration, './narration.mp3'); assert.equal(sha(fs.readFileSync(path.join(dist, 'narration.mp3'))), data.audio_sha256);
  for (const asset of data.archiveCredits) {
    const relative = data.assets.archive[asset.id]; assert(relative.startsWith('./archive/'));
    const bytes = fs.readFileSync(inDirectory(dist, relative));
    assert.equal(sha(bytes), asset.sha256); assert.equal(bytes.length, asset.bytes);
  }
  const checked = new Set(), runtimeHashes = {};
  function inspect(file, vendor = false) {
    if (checked.has(file)) return; checked.add(file); assert(file.startsWith(dist + path.sep));
    const relative = path.relative(dist, file), bytes = fs.readFileSync(file), code = bytes.toString('utf8'), module = new vm.SourceTextModule(code);
    if (vendor) {
      assert.equal(relative, path.join('vendor','three.module.js')); assert.equal(module.dependencySpecifiers.length, 0);
      if (artifactHashes.pinnedThree) assert.equal(sha(bytes), artifactHashes.pinnedThree, 'Site and standalone use different Three bytes');
      artifactHashes.siteThree = sha(bytes); return;
    }
    assert.equal(sha(code), sha(read(relative)), 'Stale Site module: ' + relative); runtimeHashes[relative] = sha(code);
    for (const dep of module.dependencySpecifiers) {
      if (dep.startsWith('.')) inspect(inDirectory(path.dirname(file), dep));
      else { assert.equal(dep, 'three', 'Unexpected bare Site dependency'); inspect(inDirectory(dist, imports[dep]), true); }
    }
  }
  inspect(inDirectory(dist, entry));
  const download = fs.readFileSync(path.join(dist, 'S1E01-full-documentary.html'));
  const standalone = inspectStandalone(download.toString('utf8'));
  assert.deepEqual(runtimeHashes, standalone.runtimeHashes, 'Site and standalone runtime graph differ');
  assert.equal(artifactHashes.siteThree, standalone.pinnedThreeSHA256);
  if (artifactHashes.bundle) assert.equal(sha(download), artifactHashes.bundle, 'Site download differs from audited standalone file');
  assert(download.length < 25 * 1024 * 1024);
  assert.match(html, /id="download-film" href="\.\/S1E01-full-documentary\.html" download=/);
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'archive-manifest.json'), 'utf8')); assert.deepEqual(manifest.assets, data.archiveCredits);
  assert.equal(fs.readFileSync(path.join(dist, 'THIRD_PARTY_NOTICES.txt'), 'utf8'), data.notices);
  return {indexSHA256: artifactHashes.siteIndex, runtimeModules: Object.keys(runtimeHashes).length, moduleGraphFiles: checked.size,
    images: data.archiveCredits.length, downloadBytes: download.length, downloadSHA256: sha(download), pinnedThreeSHA256: artifactHashes.siteThree};
});

if (args.timeline) await test('Current final narration timeline matches R8 script and canonical samples', 'ACTUAL_TIMELINE_AND_SCRIPT_BYTES_NO_AUDIO_DECODING', () => {
  const script = JSON.parse(read('script.json')), timeline = JSON.parse(fs.readFileSync(args.timeline,'utf8'));
  const mp3 = fs.readFileSync(path.join(path.dirname(args.timeline),'narration.mp3'));
  validateTimeline(script, timeline, sha(read('script.json')), sha(mp3));
  assert.equal(timeline.sentences.length,45); artifactHashes.finalTimeline=sha(fs.readFileSync(args.timeline));artifactHashes.finalNarration=sha(mp3);
  return {duration:timeline.duration,passages:timeline.sentences.length,chapters:script.chapters.length,narrationBytes:mp3.length,narrationSHA256:sha(mp3)};
});
if (args.site) await test('Actual R8 data and authored shots drive controls, every caption, persistence, replay and end', 'ACTUAL_45_PASSAGE_DATA_AND_PRODUCTION_PLAYER_WITH_MOCK_DOM_MEDIA_RENDERER', async () => {
  const {data} = parseHTML(fs.readFileSync(path.join(args.site,'index.html'),'utf8'));
  const actualNarration = fs.readFileSync(path.join(args.site,'narration.mp3'));
  const h=await harness({data,useActualShots:true,narrationBytes:actualNarration});
  assert.equal(h.win.__ready,true);assert.equal(h.win.__state().playing,false);
  assert.equal(h.win.__timeline.SHOTS.length,buildFabShots(data.script,data.timeline).length);
  assert.equal(h.counts.imageLoads.length,2);assert.equal(h.win.__state().narrationIntegrity,'SHA-256 verified');
  assert.equal(sha(Buffer.from(await h.counts.blobs[0].blob.arrayBuffer())),data.audio_sha256);
  assert.equal(h.findButtons(n=>Boolean(n.dataset.chapter)).length,data.script.chapters.length);
  const rows=data.timeline.sentences,duration=data.timeline.duration, snapshots=[];
  for(const row of rows) {
    const t=(row.start+row.end)/2;h.win.__seek(t);
    assert.equal(h.nodes.get('caption').firstElementChild.textContent,row.ko);
    assert.equal(h.nodes.get('read-caption').textContent,row.ko);
    assert.equal(h.win.__state().time,t);assert.equal(h.win.__state().playing,false);
    const shot=h.win.__timeline.SHOTS.find(s=>t>=s.t0&&t<s.t1)||h.win.__timeline.SHOTS.at(-1);
    assert.equal(h.win.__state().shot,shot.id);assert.equal(shot.rowId,row.id);
    const expectedClaims=(row.claim||[]).map(id=>data.claims.find(c=>c.id===id)).filter(Boolean);
    const expectedLinks=expectedClaims.flatMap(c=>c.sources||[]).map(id=>data.sources.find(s=>s.id===id)?.url).filter(Boolean);
    const renderedLinks=tree(h.nodes.get('passage-evidence')).map(n=>n.href).filter(Boolean);
    for(const url of expectedLinks)assert(renderedLinks.includes(url),'Missing passage evidence URL '+row.id);
    h.nodes.get('locale').onchange({target:{value:'en'}});
    assert.equal(h.nodes.get('caption').firstElementChild.textContent,row.en);
    assert.equal(h.nodes.get('fs-locale').value,'en');
    h.nodes.get('fs-locale').onchange({target:{value:'off'}});
    assert.equal(h.nodes.get('caption').style.display,'none');
    h.nodes.get('locale').onchange({target:{value:'ko'}});
    snapshots.push([t,shot.id,h.nodes.get('caption').firstElementChild.textContent]);
  }
  for(const [t,id,ko] of snapshots.toReversed()){h.win.__seek(t);assert.equal(h.win.__state().shot,id);assert.equal(h.nodes.get('caption').firstElementChild.textContent,ko);}
  let gapProbes=0;
  for(let i=0;i<rows.length-1;i++)if(rows[i+1].start>rows[i].end+.182){h.win.__seek(rows[i].end+.181);assert.equal(h.nodes.get('caption').firstElementChild.textContent,'');gapProbes++;}
  h.nodes.get('restart').onclick();assert.equal(h.win.__state().time,0);assert.equal(h.media.paused,true);
  h.nodes.get('fs-seek').oninput({target:{value:141.5}});assert.equal(h.win.__state().time,141.5);
  h.nodes.get('seek').oninput({target:{value:48.125}});assert.equal(h.win.__state().time,48.125);
  await h.win.__film.play();await h.win.__film.play();assert.equal(h.counts.mediaPlay,1);
  h.media.currentTime=52.25;h.frame(5000);assert.equal(h.win.__state().time,52.25);
  h.nodes.get('play').onclick();assert.equal(h.win.__state().playing,false);assert.equal(h.readStorage().time,52.25);
  h.nodes.get('locale').onchange({target:{value:'en'}});h.nodes.get('mute').onclick();
  const saved=h.readStorage();assert.equal(saved.revision,data.script.revision);assert.equal(saved.locale,'en');assert.equal(saved.muted,true);
  const restored=await harness({data,useActualShots:true,narrationBytes:actualNarration,stored:saved});
  assert.equal(restored.win.__state().time,52.25);assert.equal(restored.win.__state().playing,false);assert.equal(restored.media.muted,true);assert.equal(restored.nodes.get('locale').value,'en');
  h.nodes.get('restart').onclick();await h.win.__film.play();h.media.currentTime=duration+.05;h.frame(10000);h.media.emit('ended');
  assert.equal(h.win.__state().time,duration);assert.equal(h.win.__state().playing,false);assert.equal(h.readStorage().time,0);
  await h.win.__film.play();assert.equal(h.media.currentTime,0);assert.equal(h.win.__state().playing,true);h.win.__film.pause();
  for(const shot of h.win.__timeline.SHOTS){assert.equal(shot.priorShotReuse,false);assert(shot.id.startsWith('r8-'));}
  assert(h.win.__timeline.SCORE.every(c=>Number.isFinite(c.t)&&Number.isFinite(c.length)&&c.t>=0&&c.t+c.length<=duration+1e-8));
  return {passages:rows.length,shots:h.win.__timeline.SHOTS.length,chapters:data.script.chapters.length,captionLocales:['ko','en','off'],captionMidpointChecks:rows.length*3,reverseSeekChecks:rows.length,gapProbes,sfxCues:h.win.__timeline.SCORE.length,actualNarrationHashChecked:true,actualMP3Decoded:false,actualPixelsRendered:false};
});

await test('Source snapshot stayed unchanged during this QA run', 'STATIC_BYTE_RECHECK', () => {
  for (const [name, expected] of Object.entries(inputHashes)) assert.equal(sha(read(name)), expected, 'Source changed during QA: ' + name);
});
const failed = tests.filter(item => item.result === 'FAIL').length;
const changedSources = Object.entries(inputHashes).filter(([name, expected]) => sha(read(name)) !== expected).map(([name]) => name);
console.log(JSON.stringify({
  schema: 'cib-s1e01-r8-player-runtime-qa-v1', generatedAtUTC: new Date().toISOString(),
  scope: 'Actual R8 production film.mjs with mock DOM, Image, fetch, media, cinematic renderer and identity OfflineAudioContext; real WebCrypto hashes and optional exact delivery-byte/module-graph checks. No browser, network, WebGL, real media decoding or listening.',
  notTested: ['Cinematic visual quality, 3D action/camera perception or full-film viewing', 'Real image/MP3 decoding, Canvas pixels or WebGL', 'Real browser playback, Blob media seeking, import-map support and fullscreen layout', 'Actual OfflineAudioContext output, speaker output or listening', 'Historical accuracy, rights clearance or release approval'],
  inputs: {sourceSHA256: inputHashes, artifacts: artifactHashes, arguments: args},
  summary: {passed: tests.length - failed, failed, total: tests.length, changedSources, verdict: changedSources.length ? 'INVALID_SNAPSHOT' : failed ? 'CONTRACT_FAILURES' : 'NON_BROWSER_R8_PLAYER_CONTRACTS_PASS_ONLY', releaseApproval: false}, tests
}, null, 2));
process.exitCode = failed ? 1 : 0;

