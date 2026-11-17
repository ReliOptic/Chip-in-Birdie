#!/usr/bin/env node
/**
 * Bounded R6 archive/runtime regression checks. No browser, renderer or network.
 * node --experimental-vm-modules qa-archive-runtime.mjs
 *   [--bundle /path/to/S1E01-full-documentary.html] [--site /path/to/dist]
 *   [--archive /path/to/archive]
 * Actual production modules/control handlers run with mock DOM, Image, media,
 * archive renderer and OfflineAudioContext. PASS is not audiovisual approval.
 * JSON goes to stdout; this script does not write files.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {validateTimeline, readArchive} from './build.mjs';

assert.equal(typeof vm.SourceTextModule, 'function', 'Run Node with --experimental-vm-modules');
const root = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  assert(['--bundle', '--site', '--archive'].includes(process.argv[i]) && process.argv[i + 1], 'Expected --bundle FILE, --site DIR or --archive DIR');
  args[process.argv[i].slice(2)] = path.resolve(process.argv[i + 1]);
}
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const names = ['film.mjs', 'player.html', 'build.mjs', 'qa-archive-runtime.mjs', 'archive-cinema.mjs', 'script.json', 'claims.json', 'sources.json'].filter(name => fs.existsSync(path.join(root, name)));
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
function fixture() {
  return {
    script: {title: 'Runtime test fixture, not film content', revision: 'S1E01-full-r6', chapters: [{id: 'first', title: 'The record'}, {id: 'second', title: 'The consequence'}], sentences: fixtureRows.map(row => ({...row}))},
    timeline: {duration: 12, total_samples: 288000, sample_rate: 24000, sentences: fixtureRows.map(row => ({...row})), source_script_sha256: 'fixture-script-hash', outputs: {mp3: {sha256: 'fixture-audio-hash'}}},
    audio_sha256: 'fixture-audio-hash',
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
  const config = {stage: null, imageFailure: null, drawFailure: false, invalidShot: false, fullscreenBlocked: false, storageDenied: false, ...options};
  const gate = deferred(), nodes = new Map(), allNodes = [], docEvents = new Map(), winEvents = new Map(), raf = [];
  const counts = {imageLoads: [], rendererCreated: 0, draws: [], mediaPlay: 0, mediaPause: 0, mediaLoad: 0, resume: 0, sfxStarts: [], sfxStops: 0, offlineContexts: 0, offlineStarts: [], paintFallback: 0};
  let stored = options.stored === undefined ? null : typeof options.stored === 'string' ? options.stored : JSON.stringify(options.stored);
  const data = fixture();
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
    fonts: {ready: Promise.resolve()}, getElementById: id => nodes.get(id) || null,
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
  const context = vm.createContext({
    console, window: win, document, Image: MockImage, Audio: MockAudio, URLSearchParams, URL, Blob,
    location: {hash: options.hash || '', search: options.search || '', reload() { counts.reloads = (counts.reloads || 0) + 1; }},
    localStorage: {getItem(key) { assert.equal(key, 'cib-s1e01-r6'); if (config.storageDenied) throw new Error('Storage unavailable'); return stored; }, setItem(key, value) { assert.equal(key, 'cib-s1e01-r6'); if (config.storageDenied) throw new Error('Storage unavailable'); stored = value; }},
    requestAnimationFrame: fn => { raf.push(fn); return raf.length; }, performance: {now: () => 0}
  });
  const createArchiveCinema = supplied => {
    counts.rendererCreated++; rendererArgs = supplied;
    const list = supplied.timeline.sentences.map((row, index, source) => ({
      id: 'fixture-shot-' + row.id, t0: index ? row.start : 0, t1: source[index + 1]?.start ?? supplied.timeline.duration,
      kind: ['photo', 'document', 'comparison'][index], assetIds: [config.invalidShot ? 'missing' : 'image' + index], rowId: row.id
    }));
    return {
      shots: list, state: null,
      draw(t) {
        if (config.drawFailure) throw new Error('Synthetic archive draw failure');
        counts.draws.push(t); this.state = list.find(shot => t >= shot.t0 && t < shot.t1) || list.at(-1); return this.state;
      }
    };
  };
  const dependency = new vm.SyntheticModule(['createArchiveCinema'], function() { this.setExport('createArchiveCinema', createArchiveCinema); }, {context});
  const module = new vm.SourceTextModule(film, {context, identifier: 'production:film.mjs'});
  await module.link(specifier => { assert.equal(specifier, './archive-cinema.mjs'); return dependency; });
  await module.evaluate();
  const handle = {
    win, context, document, nodes, counts, config, gate, data, get media() { return media; }, get rendererArgs() { return rendererArgs; },
    get boot() { return win.__bootPromise; }, readStorage: () => stored && JSON.parse(stored),
    frame(wall = 100) { const callbacks = raf.splice(0); for (const callback of callbacks) callback(wall); },
    emitDoc, press(key, target = new Node('div')) { const event = {key, target, preventDefault() { this.prevented = true; }}; emitDoc('keydown', event); return event; },
    findButtons: predicate => allNodes.filter(node => node.tagName === 'BUTTON' && predicate(node))
  };
  await handle.boot;
  return handle;
}
function tree(node) { return [node, ...(node.children || []).flatMap(tree)]; }
const controlMethod = 'ACTUAL_PRODUCTION_MODULE_WITH_MOCK_DOM_IMAGE_MEDIA_CANVAS_AND_AUDIO';

await test('Archive-only entry and HTML controls are structurally connected', 'REAL_JS_PARSE_AND_STATIC_HTML_CSS', () => {
  assert.deepEqual([...new vm.SourceTextModule(film).dependencySpecifiers], ['./archive-cinema.mjs']);
  assert(!/three|WebGLRenderer|createSoftwareRenderer|worlds\.|Cirrus/.test(film), 'Historical 3D runtime or story text remains active');
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
await test('Images and font readiness precede archive renderer startup', controlMethod, async () => {
  const h = await harness();
  assert.equal(h.win.__ready, true); assert.equal(h.counts.imageLoads.length, 3); assert.equal(h.counts.rendererCreated, 1);
  assert.equal(Object.keys(h.rendererArgs.images).length, 3); assert.equal(h.counts.mediaPlay, 0);
  assert.equal(h.win.__timeline.SHOTS.length, 3); assert.equal(h.win.__state().backend, 'canvas-archive');
  assert.equal(h.win.__state().resolution[0], 960); assert.equal(h.win.__state().resolution[1], 540);
});
await test('An image load failure blocks playback, renders error and retries', controlMethod, async () => {
  const h = await harness({imageFailure: 'image1'});
  assert.equal(h.win.__ready, false); assert.equal(h.win.__state().archiveState, 'error');
  assert.equal(h.nodes.get('error').style.display, 'block'); assert.match(h.nodes.get('error').children[0].textContent, /image1/);
  assert(h.counts.paintFallback > 0); assert.equal(h.counts.rendererCreated, 0);
  await h.win.__film.play(); assert.equal(h.counts.mediaPlay, 0);
  h.config.imageFailure = null; await h.nodes.get('error').children.find(node => node.tagName === 'BUTTON').onclick();
  assert.equal(h.win.__ready, true); assert.equal(h.nodes.get('play').disabled, false);
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
  assert.equal(h.counts.mediaLoad, 1); assert.equal(h.win.__state().playing, true);
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
await test('Sparse seeded SFX repeat under independent identity offline mocks', 'ACTUAL_SFX_CODE_IDENTITY_OFFLINE_MOCK_NOT_AUDIO_RENDERING', async () => {
  const h = await harness(), result = await h.win.__meta.audio.verify();
  assert.equal(result.equal, true); assert.equal(result.finite, true); assert.equal(result.samples, 288000);
  assert(result.cues > 0 && result.cues <= 16); assert.equal(h.counts.offlineContexts, result.cues * 2); assert(h.counts.offlineStarts.every(t => t === 0));
  assert(h.win.__timeline.SCORE.every(cue => ['paper', 'cut', 'reveal'].includes(cue.kind)));
  return {samples: result.samples, cues: result.cues, peak: result.peak, independentContexts: h.counts.offlineContexts, actualOfflineAudioContext: false};
});
await test('Build rejects stale audio/script, invalid PCM and mismatched passages', 'ACTUAL_EXPORTED_BUILD_VALIDATOR_NO_WRITES', () => {
  const valid = fixture();
  validateTimeline(valid.script, valid.timeline, 'fixture-script-hash', 'fixture-audio-hash');
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
  for (const [label, mutate] of variants) { const value = fixture(); mutate(value); assert.throws(() => validateTimeline(value.script, value.timeline, 'fixture-script-hash', 'fixture-audio-hash'), undefined, label); }
  return {rejectedVariants: variants.map(([label]) => label)};
});

function parseHTML(html) {
  const data = JSON.parse(html.match(/<script id="film-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const loader = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const entry = loader.match(/import\(['"]([^'"]+)['"]\)/)[1];
  return {data, loader, entry};
}
function decode(uri) {
  assert.match(uri, /^data:[^,]+;base64,/);
  return Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
}
function assertFilmData(data) {
  const script = JSON.parse(read('script.json')); assert.deepEqual(data.script, script);
  const rawClaims = JSON.parse(read('claims.json')); assert.deepEqual(data.claims, Array.isArray(rawClaims) ? rawClaims : rawClaims.claims);
  assert.deepEqual(data.sources, JSON.parse(read('sources.json')));
  validateTimeline(script, data.timeline, sha(read('script.json')), data.audio_sha256);
  assert.equal(data.archiveCredits.length, Object.keys(data.assets.archive).length);
  assert.equal(new Set(data.archiveCredits.map(asset => asset.id)).size, data.archiveCredits.length);
  for (const asset of data.archiveCredits) {
    assert(data.assets.archive[asset.id]); assert(asset.creator && asset.license && asset.caution && asset.date_label);
    assert.match(asset.source_url, /^https?:\/\//); assert.match(asset.license_url, /^https?:\/\//);
  }
}
if (args.archive) await test('Source archive manifest and every image hash are valid', 'ACTUAL_ASSET_BYTES_METADATA_NO_IMAGE_DECODING', () => {
  const archive = readArchive(args.archive);
  return {images: archive.assets.length, bytes: archive.assets.reduce((sum, item) => sum + item.credit.bytes, 0), ids: archive.assets.map(item => item.credit.id)};
});
if (args.bundle) await test('Standalone archive/audio/module graph matches current sources', 'ACTUAL_BUNDLE_BYTES_REAL_JS_PARSE_NO_EVALUATION', () => {
  const html = fs.readFileSync(args.bundle, 'utf8'); artifactHashes.bundle = sha(html);
  assert(!/__FILM_TITLE__|__FILM_DATA__|__ENTRY_MODULE__/.test(html));
  const {data, loader, entry} = parseHTML(html); assertFilmData(data); assert.equal(data.deliveryMode, 'standalone');
  assert.equal(sha(decode(data.assets.narration)), data.audio_sha256);
  for (const asset of data.archiveCredits) { const bytes = decode(data.assets.archive[asset.id]); assert.equal(sha(bytes), asset.sha256); assert.equal(bytes.length, asset.bytes); }
  const seen = new Set();
  function inspect(uri, originalFile) {
    if (seen.has(uri)) return; seen.add(uri);
    const code = decode(uri).toString('utf8'), packed = new vm.SourceTextModule(code), original = read(originalFile), sourceModule = new vm.SourceTextModule(original);
    assert.equal(packed.dependencySpecifiers.length, sourceModule.dependencySpecifiers.length);
    let restored = code;
    packed.dependencySpecifiers.forEach((specifier, i) => {
      assert(specifier.startsWith('data:'), 'Standalone has an external module dependency');
      const relative = sourceModule.dependencySpecifiers[i]; assert(relative.startsWith('.'));
      restored = restored.replaceAll(specifier, relative);
      inspect(specifier, path.normalize(path.join(path.dirname(originalFile), relative)));
    });
    assert.equal(restored, original, 'Stale embedded module: ' + originalFile);
  }
  new vm.SourceTextModule(loader); inspect(entry, 'film.mjs');
  return {bytes: Buffer.byteLength(html), sha256: artifactHashes.bundle, duration: data.timeline.duration, images: data.archiveCredits.length, modules: seen.size};
});
if (args.site) await test('Site asset graph, credits and downloadable HTML are complete', 'ACTUAL_SITE_FILE_HASHES_REAL_JS_PARSE_NO_HTTP', () => {
  const dist = args.site, html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8'), {data, entry} = parseHTML(html);
  artifactHashes.siteIndex = sha(html); assertFilmData(data); assert.equal(data.deliveryMode, 'site'); assert.equal(entry, './film.mjs');
  assert.equal(data.assets.narration, './narration.mp3'); assert.equal(sha(fs.readFileSync(path.join(dist, 'narration.mp3'))), data.audio_sha256);
  for (const asset of data.archiveCredits) {
    const relative = data.assets.archive[asset.id]; assert(relative.startsWith('./archive/'));
    const file = path.resolve(dist, relative); assert(file.startsWith(dist + path.sep)); assert.equal(sha(fs.readFileSync(file)), asset.sha256);
  }
  const checked = new Set();
  function inspect(file) {
    if (checked.has(file)) return; checked.add(file); assert(file.startsWith(dist + path.sep));
    const relative = path.relative(dist, file), code = fs.readFileSync(file, 'utf8'); assert.equal(code, read(relative), 'Stale Site module: ' + relative);
    for (const dep of new vm.SourceTextModule(code).dependencySpecifiers) { assert(dep.startsWith('.'), 'External Site dependency'); inspect(path.resolve(path.dirname(file), dep)); }
  }
  inspect(path.resolve(dist, entry));
  const download = fs.readFileSync(path.join(dist, 'S1E01-full-documentary.html'));
  if (artifactHashes.bundle) assert.equal(sha(download), artifactHashes.bundle);
  else { const standalone = parseHTML(download.toString('utf8')); assert.equal(standalone.data.deliveryMode, 'standalone'); assertFilmData(standalone.data); }
  assert(download.length < 25 * 1024 * 1024);
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'archive-manifest.json'), 'utf8')); assert.deepEqual(manifest.assets, data.archiveCredits);
  return {indexSHA256: artifactHashes.siteIndex, modules: checked.size, images: data.archiveCredits.length, downloadBytes: download.length, downloadSHA256: sha(download)};
});
await test('Source snapshot stayed unchanged during this QA run', 'STATIC_BYTE_RECHECK', () => {
  for (const [name, expected] of Object.entries(inputHashes)) assert.equal(sha(read(name)), expected, 'Source changed during QA: ' + name);
});
const failed = tests.filter(item => item.result === 'FAIL').length;
console.log(JSON.stringify({
  schema: 'cib-s1e01-archive-runtime-qa-v1', generatedAtUTC: new Date().toISOString(),
  scope: 'Actual R6 production control module with mock DOM, Image, media, Canvas renderer and OfflineAudioContext; optional actual delivery byte/import checks. No browser or network.',
  notTested: ['Archive visual/cut quality', 'Real image decoding or Canvas pixels', 'Real browser playback and fullscreen layout', 'Actual OfflineAudioContext output or listening', 'Historical accuracy, rights clearance or release approval'],
  inputs: {sourceSHA256: inputHashes, artifacts: artifactHashes, arguments: args},
  summary: {passed: tests.length - failed, failed, total: tests.length, verdict: failed ? 'CONTRACT_FAILURES' : 'NON_BROWSER_ARCHIVE_CONTRACTS_PASS_ONLY', releaseApproval: false}, tests
}, null, 2));
process.exitCode = failed ? 1 : 0;
