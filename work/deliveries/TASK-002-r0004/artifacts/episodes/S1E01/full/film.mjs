import {createArchiveCinema} from './archive-cinema.mjs';

const DATA = JSON.parse(document.getElementById('film-data').textContent);
const $ = id => document.getElementById(id);
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const fmt = t => Math.floor(t / 60).toString().padStart(2, '0') + ':' + Math.floor(t % 60).toString().padStart(2, '0');
const STORAGE_KEY = 'cib-s1e01-r6';
const headless = location.hash === '#headless';
const qa = new URLSearchParams(location.search).has('qa');
document.body.classList.toggle('headless', headless);
document.body.classList.toggle('qa', qa);
window.__ready = false;

const timeline = DATA.timeline;
const rows = timeline.sentences || timeline.utterances;
const duration = timeline.duration ?? timeline.duration_seconds;
if (!Array.isArray(rows) || !rows.length || !Number.isFinite(duration) || duration <= 0) throw new Error('The recorded timeline is missing or invalid');
const rowById = new Map(rows.map(row => [row.id, row]));
const credits = DATA.archiveCredits || [];
const creditById = new Map(credits.map(asset => [asset.id, asset]));
const chapters = DATA.script.chapters.map(chapter => {
  const members = rows.filter(row => row.chapter === chapter.id);
  if (!members.length) throw new Error('Chapter has no recorded passages: ' + chapter.id);
  return {...chapter, start: members[0].start, end: members.at(-1).end};
});
const shots = [], cueSpecs = [], runtimeErrors = [];
const images = Object.create(null);
let renderer = null, current = 0, playing = false, pendingPlay = false, buffering = false;
let locale = 'ko', muted = false, lastRow = null, activeShot = null, frameCount = 0;
let playRequest = 0, muteRequest = 0, initRequest = 0, lastPersist = 0;
let archiveState = 'idle', archiveError = null, interfaceReady = false, restored = false, loopStarted = false;
let theater = false, viewPending = false, viewRequest = 0, wantedExpanded = false, overflowBeforeTheater = '';
const narration = new Audio(DATA.assets.narration);
narration.preload = 'auto';
narration.loop = false;
let context, voiceNode, sfxNode, sfxBuffer, audioState = 'idle', audioError = null, soundRequested = false;

document.title = DATA.script.title + ' — Chip in Birdie';
$('film-title').textContent = DATA.script.title;
$('edition-time').textContent = fmt(duration) + ' · English narration';
function recordError(error) { runtimeErrors.push(String(error?.message || error)); }
window.addEventListener('error', event => recordError(event.error || event.message));
window.addEventListener('unhandledrejection', event => recordError(event.reason));

function loadArchiveImage(id, uri) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      image.onload = image.onerror = null;
      try {
        if (typeof image.decode === 'function') await image.decode();
        if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) throw new Error('Empty image');
        resolve(image);
      } catch { reject(new Error('Archive image could not be decoded: ' + id)); }
    };
    image.onerror = () => {
      image.onload = image.onerror = null;
      reject(new Error('Archive image could not be loaded: ' + id));
    };
    image.src = uri;
  });
}
async function loadArchiveImages(request) {
  const entries = Object.entries(DATA.assets.archive || {});
  if (!entries.length) throw new Error('No archive images are included in this edition');
  let loaded = entries.filter(([id]) => images[id]).length;
  const showProgress = () => { if (request === initRequest && archiveState === 'loading') $('status').textContent = 'Loading archive · ' + loaded + ' / ' + entries.length; };
  showProgress();
  await Promise.all(entries.map(async ([id, uri]) => {
    if (!images[id]) {
      const image = await loadArchiveImage(id, uri);
      if (request !== initRequest) return;
      images[id] = image; loaded++; showProgress();
    }
  }));
}
function validateShots(list) {
  if (!Array.isArray(list) || !list.length) throw new Error('The archive edit contains no shots');
  const ids = new Set();
  for (let i = 0; i < list.length; i++) {
    const shot = list[i];
    if (!shot.id || ids.has(shot.id)) throw new Error('Duplicate or missing shot identifier');
    ids.add(shot.id);
    if (!Number.isFinite(shot.t0) || !Number.isFinite(shot.t1) || shot.t1 <= shot.t0) throw new Error('Invalid shot interval: ' + shot.id);
    const expected = i ? list[i - 1].t1 : 0;
    if (Math.abs(shot.t0 - expected) > 1e-6) throw new Error('The archive edit has a gap or overlap: ' + shot.id);
    if (!rowById.has(shot.rowId)) throw new Error('Shot has no recorded passage: ' + shot.id);
    if (!Array.isArray(shot.assetIds)) throw new Error('Shot has no asset register: ' + shot.id);
    for (const id of shot.assetIds) if (!images[id] || !creditById.has(id)) throw new Error('Shot is missing an image or credit: ' + id);
  }
  if (Math.abs(list.at(-1).t1 - duration) > 1e-6) throw new Error('The archive edit does not cover the recorded ending');
}
function setupCues() {
  cueSpecs.length = 0;
  let lastChapter = null, lastCue = -10, lastKind = null;
  for (const shot of shots) {
    const chapter = rowById.get(shot.rowId).chapter;
    const paper = /document|filing|quote|paper|record/.test(shot.kind || '');
    const chapterChange = chapter !== lastChapter;
    if (cueSpecs.length < 15 && (chapterChange || (paper && !/document|filing|quote|paper|record/.test(lastKind || '') && shot.t0 - lastCue >= 10))) {
      const t = shot.t0 + Math.min(.12, (shot.t1 - shot.t0) * .05);
      cueSpecs.push({t, kind: paper ? 'paper' : 'cut', length: paper ? .42 : .13, seed: 617 + cueSpecs.length});
      lastCue = t;
    }
    lastChapter = chapter; lastKind = shot.kind;
  }
  const ending = shots.at(-1);
  if (ending && ending.t1 - ending.t0 > .7) cueSpecs.push({t: ending.t0 + .18, kind: 'reveal', length: .6, seed: 761});
}
function rng(seed) { return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; }; }
function bakeCue(cue, sr) {
  const count = Math.max(1, Math.round(sr * cue.length)), out = new Float32Array(count), random = rng(cue.seed);
  let filtered = 0;
  for (let i = 0; i < count; i++) {
    const t = i / sr, u = i / count, noise = random() * 2 - 1;
    filtered = .89 * filtered + .11 * noise;
    const attack = Math.min(1, t / .008);
    let value;
    if (cue.kind === 'paper') value = (filtered * .026 + noise * .004) * Math.sin(Math.PI * u) ** 2;
    else if (cue.kind === 'reveal') value = (Math.sin(2 * Math.PI * 196 * t) + .25 * Math.sin(2 * Math.PI * 294 * t)) * .005 * Math.sin(Math.PI * u) ** 2;
    else value = (Math.sin(2 * Math.PI * 180 * t) * .012 + noise * .003) * Math.exp(-t / .026) * attack;
    out[i] = Math.fround(value);
  }
  return out;
}
async function bakeScore(sr = 24000) {
  const out = new Float32Array(Math.round(duration * sr));
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Offline) throw new Error('Offline audio rendering is unavailable');
  for (const cue of cueSpecs) {
    const raw = bakeCue(cue, sr), offline = new Offline(1, raw.length, sr);
    const buffer = offline.createBuffer(1, raw.length, sr);
    buffer.copyToChannel(raw, 0);
    const node = offline.createBufferSource();
    node.buffer = buffer; node.connect(offline.destination); node.start(0);
    const rendered = await offline.startRendering(), samples = rendered.getChannelData(0), at = Math.round(cue.t * sr);
    for (let i = 0; i < samples.length && at + i < out.length; i++) out[at + i] = Math.fround(out[at + i] + samples[i]);
  }
  return out;
}
function checksum(samples, sr = 24000) {
  let hash = 2166136261, peak = 0, finite = true;
  for (const value of new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength)) hash = Math.imul(hash ^ value, 16777619) >>> 0;
  for (const value of samples) { finite &&= Number.isFinite(value); peak = Math.max(peak, Math.abs(value)); }
  return {fnv1a: hash.toString(16).padStart(8, '0'), peak, finite, samples: samples.length, sampleRate: sr};
}
async function prepareAudio() {
  if (audioState === 'ready') return sfxBuffer;
  if (audioState === 'preparing') return prepareAudio.promise;
  audioState = 'preparing';
  prepareAudio.promise = (async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Audio playback is unavailable');
    context ??= new AudioContextClass({sampleRate: 24000});
    if (!voiceNode) { voiceNode = context.createMediaElementSource(narration); voiceNode.connect(context.destination); }
    const samples = await bakeScore(context.sampleRate);
    sfxBuffer = context.createBuffer(1, samples.length, context.sampleRate);
    sfxBuffer.copyToChannel(samples, 0);
    audioState = 'ready'; audioError = null;
    return sfxBuffer;
  })().catch(error => {
    audioState = 'error'; audioError = String(error); prepareAudio.promise = null; throw error;
  });
  return prepareAudio.promise;
}
function stopSfx() {
  if (!sfxNode) return;
  try { sfxNode.stop(); } catch {}
  sfxNode.disconnect(); sfxNode = null;
}
function startSfx(at) {
  stopSfx();
  if (muted || buffering || !sfxBuffer || at >= duration) return;
  sfxNode = context.createBufferSource();
  sfxNode.buffer = sfxBuffer; sfxNode.connect(context.destination); sfxNode.start(0, at);
}
function showError(message, retry) {
  const box = $('error'); box.replaceChildren(); box.style.display = 'block';
  const text = document.createElement('p'); text.textContent = message; box.append(text);
  if (retry) {
    const button = document.createElement('button'); button.textContent = 'Retry';
    button.onclick = () => { box.style.display = 'none'; return retry(); };
    box.append(button);
  }
}
function paintFailure() {
  const canvas = $('film'), ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width || 960, h = canvas.height || 540;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ece8df'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#24231f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = Math.max(20, Math.round(w / 32)) + 'px Georgia, serif';
  ctx.fillText('The archive picture is unavailable', w / 2, h * .33);
}
function pictureFailed(error) {
  window.__ready = false; archiveState = 'error'; archiveError = String(error?.message || error);
  pause(); renderer = null; recordError(error); paintFailure();
  for (const id of ['play', 'fs-play', 'big-play']) $(id).disabled = true;
  $('start').style.display = 'none'; $('status').textContent = 'Archive needs retry';
  showError(archiveError + '. The film is paused; your position is preserved.', () => window.__bootPromise = start());
}
function resize() {
  const bounds = $('picture').getBoundingClientRect();
  const dpr = qa ? 1 : Math.min(Number(window.devicePixelRatio) || 1, 1.5);
  const width = Math.max(2, Math.min(1440, Math.round((bounds.width || 960) * dpr)));
  const height = Math.max(2, Math.round(width * 9 / 16));
  const canvas = $('film');
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  if (renderer) draw(current);
}
function currentRow(t) {
  let lo = 0, hi = rows.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (rows[m].start <= t) lo = m + 1; else hi = m - 1; }
  return rows[Math.max(0, hi)];
}
function currentShot(t) { return shots.find(shot => t >= shot.t0 && t < shot.t1) || shots.at(-1); }
function setCaption(row, t) {
  const text = locale === 'off' ? '' : row[locale] || row.en;
  const live = t >= row.start && t <= row.end + .18 ? text : '';
  $('caption').firstElementChild.textContent = live; $('caption').style.display = live ? 'block' : 'none';
  $('caption').lang = locale === 'ko' ? 'ko' : 'en';
  $('read-caption').textContent = live; $('read-caption').lang = $('caption').lang;
  $('read-caption').style.visibility = locale === 'off' ? 'hidden' : 'visible';
}
function draw(t) {
  if (!Number.isFinite(t)) return false;
  current = clamp(t, 0, duration);
  if (!renderer) return false;
  try {
    const state = renderer.draw(current);
    activeShot = state?.shot || state || renderer.state || currentShot(current);
    const row = currentRow(current), chapter = chapters.find(item => item.id === row.chapter);
    frameCount++;
    $('seek').value = $('fs-seek').value = current;
    $('time').textContent = $('fs-time').textContent = fmt(current) + ' / ' + fmt(duration);
    $('chapter-label').textContent = chapter.title;
    $('chapter-index').textContent = String(chapters.indexOf(chapter) + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
    const shot = currentShot(current), assetIDs = activeShot.assetIds || shot?.assetIds || [];
    $('frame-kind').textContent = activeShot.kind || shot?.kind || 'Archive';
    $('frame-credit').textContent = assetIDs.map(id => {
      const asset = creditById.get(id);
      return asset ? asset.title + ' · ' + (asset.date_label || '') : '';
    }).filter(Boolean).join(' / ');
    setCaption(row, current);
    if (row !== lastRow) {
      lastRow = row;
      document.querySelectorAll('#transcript-list button[data-row]').forEach(button => button.setAttribute('aria-current', String(button.dataset.row === row.id)));
      document.querySelectorAll('#chapters button').forEach(button => button.setAttribute('aria-current', String(button.dataset.chapter === row.chapter)));
      renderPassageEvidence(row);
    }
    return true;
  } catch (error) { pictureFailed(error); return false; }
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({time: current >= duration - .2 ? 0 : current, locale, muted, revision: DATA.script.revision})); } catch {}
}
function pause(save = true) {
  if (playing && window.__ready && Number.isFinite(narration.currentTime) && !draw(Math.min(narration.currentTime, duration))) return;
  playRequest++; pendingPlay = false; playing = false; buffering = false;
  narration.pause(); stopSfx();
  $('play').textContent = $('fs-play').textContent = '▶';
  $('play').setAttribute('aria-label', 'Play'); $('fs-play').setAttribute('aria-label', 'Play');
  $('start').style.display = headless || archiveState === 'error' ? 'none' : 'grid';
  $('status').textContent = current >= duration - .02 ? 'Finished · replay available' : 'Paused';
  if (save) persist();
}
function seek(t) {
  pause(); const value = Number(t); current = Number.isFinite(value) ? clamp(value, 0, duration) : 0;
  narration.currentTime = Math.min(current, Math.max(0, duration - .001)); draw(current); persist();
}
async function play() {
  if (!window.__ready || pendingPlay || playing) return;
  const request = ++playRequest; pendingPlay = true;
  try {
    soundRequested = true; $('status').textContent = 'Preparing audio';
    const preparation = prepareAudio();
    const resumed = context?.resume();
    await Promise.all([preparation, resumed]);
    if (request !== playRequest) return;
    if (current >= duration - .05) { current = 0; draw(0); }
    if (!window.__ready) return;
    narration.currentTime = current; narration.muted = muted;
    await narration.play();
    if (request !== playRequest) return;
    pendingPlay = false; playing = true; buffering = false; startSfx(narration.currentTime);
    $('play').textContent = $('fs-play').textContent = 'Ⅱ';
    $('play').setAttribute('aria-label', 'Pause'); $('fs-play').setAttribute('aria-label', 'Pause');
    $('start').style.display = 'none'; $('status').textContent = 'Playing'; $('error').style.display = 'none';
  } catch (error) {
    if (request !== playRequest) return;
    pendingPlay = false; playing = false; buffering = false; narration.pause(); stopSfx();
    audioError = String(error); $('status').textContent = 'Audio needs retry';
    showError('Audio could not start. Your position is preserved. ' + String(error), play);
  }
}
function setMuted(value) {
  muteRequest++; muted = Boolean(value); narration.muted = muted;
  for (const id of ['mute', 'fs-mute']) {
    $(id).textContent = muted ? 'Sound off' : 'Sound on';
    $(id).setAttribute('aria-pressed', String(muted)); $(id).setAttribute('aria-label', muted ? 'Unmute narration' : 'Mute narration');
  }
  if (muted) stopSfx(); else if (playing) startSfx(narration.currentTime);
  persist();
}
function setLocale(value) {
  locale = ['ko', 'en', 'off'].includes(value) ? value : 'ko';
  $('locale').value = $('fs-locale').value = locale; draw(current); persist();
}
function panel(name, force) {
  const button = $(name + '-toggle'), element = $(name);
  element.hidden = force === undefined ? !element.hidden : !force;
  button.setAttribute('aria-expanded', String(!element.hidden));
}
function viewMode() { return theater ? 'theater' : document.fullscreenElement === $('screen') ? 'native-fullscreen' : 'inline'; }
function updateViewLabels() {
  const mode = viewMode();
  $('screen').setAttribute('data-view', mode);
  $('fullscreen').textContent = mode === 'theater' ? 'Exit cinema view' : mode === 'native-fullscreen' ? 'Exit full screen' : 'Full screen';
  $('fs-exit').setAttribute('aria-label', mode === 'theater' ? 'Exit cinema view' : 'Exit full screen');
  $('fs-controls').setAttribute('aria-label', mode === 'theater' ? 'Cinema view controls' : 'Full screen film controls');
}
function transportStatus() {
  if (archiveState === 'error') return 'Archive needs retry';
  if (buffering) return 'Buffering · picture held';
  if (pendingPlay) return 'Preparing audio';
  if (playing) return 'Playing';
  return current >= duration - .02 ? 'Finished · replay available' : 'Paused';
}
function setTheater(enabled) {
  enabled = Boolean(enabled);
  if (theater === enabled) return;
  if (enabled) { overflowBeforeTheater = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  else document.body.style.overflow = overflowBeforeTheater;
  theater = enabled;
  $('screen').classList.toggle('theater', enabled); document.body.classList.toggle('theater-open', enabled);
  updateViewLabels(); resize();
  $('status').textContent = enabled ? 'Cinema view' : transportStatus();
  if (enabled) $('fs-play').focus?.({preventScroll: true});
  else if (!document.fullscreenElement) $('fullscreen').focus?.({preventScroll: true});
}
async function leaveExpandedView() {
  viewRequest++; wantedExpanded = false; viewPending = false;
  if (theater) setTheater(false);
  if (document.fullscreenElement === $('screen')) {
    try { await document.exitFullscreen(); }
    catch { $('status').textContent = 'Could not exit full screen'; }
  }
  updateViewLabels();
}
async function toggleExpandedView() {
  if (theater || document.fullscreenElement === $('screen') || viewPending) return leaveExpandedView();
  const request = ++viewRequest; wantedExpanded = true; viewPending = true;
  try {
    if (typeof $('screen').requestFullscreen !== 'function') throw new Error('Native full screen is unavailable');
    await $('screen').requestFullscreen();
    if (request !== viewRequest) {
      if (!wantedExpanded && document.fullscreenElement === $('screen')) await document.exitFullscreen();
      return;
    }
    updateViewLabels(); resize();
  } catch {
    // A normal CSS view does not request or change browser/iframe permissions.
    if (request === viewRequest && !document.fullscreenElement) setTheater(true);
  } finally { if (request === viewRequest) viewPending = false; }
}
function onMediaWaiting() {
  if (playing) { buffering = true; stopSfx(); $('status').textContent = 'Buffering · picture held'; }
}
function onMediaPlaying() {
  if (playing && buffering) { buffering = false; startSfx(narration.currentTime); $('status').textContent = 'Playing'; }
}
function loop(wall) {
  if (playing) {
    draw(Math.min(narration.currentTime, duration));
    if (wall - lastPersist > 3000) { persist(); lastPersist = wall; }
  }
  requestAnimationFrame(loop);
}
function externalLink(url, label) {
  const link = document.createElement('a'); link.textContent = label;
  if (/^https?:\/\//.test(url || '')) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  return link;
}
function renderPassageEvidence(row) {
  const out = $('passage-evidence'); out.replaceChildren();
  const heading = document.createElement('h3'); heading.textContent = fmt(row.start) + ' · ' + row.en; out.append(heading);
  for (const id of row.claim || []) {
    const claim = DATA.claims.find(item => item.id === id); if (!claim) continue;
    const section = document.createElement('section'), name = document.createElement('strong'), text = document.createElement('p'), limit = document.createElement('p');
    name.textContent = claim.id + ' · ' + String(claim.kind || 'source').replaceAll('_', ' ');
    text.textContent = claim.claim; limit.textContent = 'Limit: ' + claim.limitation;
    section.append(name, text, limit);
    for (const sourceID of claim.sources || []) {
      const source = DATA.sources.find(item => item.id === sourceID); if (!source) continue;
      section.append(externalLink(source.url, source.id + ' · ' + source.title + ' — ' + (claim.locator || source.locator || 'Original source')), document.createElement('br'));
    }
    out.append(section);
  }
}
function renderArchiveCredits() {
  const list = $('archive-credits'); list.replaceChildren();
  for (const note of DATA.archiveRights?.global_usage_notes || []) {
    const paragraph = document.createElement('p'); paragraph.textContent = note; list.append(paragraph);
  }
  if (DATA.archiveRights && Object.keys(DATA.archiveRights).length) {
    const details = document.createElement('details'), summary = document.createElement('summary'), metadata = document.createElement('pre');
    summary.textContent = 'Archive provenance & distribution notes'; metadata.textContent = JSON.stringify(DATA.archiveRights, null, 2);
    details.append(summary, metadata); list.append(details);
  }
  for (const asset of credits) {
    const item = document.createElement('article'), heading = document.createElement('h3'), credit = document.createElement('p');
    heading.textContent = asset.title; credit.textContent = (asset.creator || asset.credit || '') + ' · ' + (asset.date_label || '');
    const caution = document.createElement('p'); caution.className = 'credit-caution'; caution.textContent = asset.caution || '';
    const rights = document.createElement('p');
    rights.append(externalLink(asset.source_url || asset.sourceUrl, 'Original image record'), document.createTextNode(' · '), externalLink(asset.license_url || asset.licenseUrl, asset.license || 'Rights record'));
    const details = document.createElement('details'), summary = document.createElement('summary'), metadata = document.createElement('pre');
    summary.textContent = 'Full attribution & asset metadata'; metadata.textContent = JSON.stringify(asset, null, 2);
    details.append(summary, metadata); item.append(heading, credit, caution, rights, details); list.append(item);
  }
}
function makeInterface() {
  if (interfaceReady) return;
  interfaceReady = true;
  $('chapters').replaceChildren(); $('transcript-list').replaceChildren(); $('source-list').replaceChildren();
  for (const chapter of chapters) {
    const item = document.createElement('li'), button = document.createElement('button'), stamp = document.createElement('span');
    stamp.textContent = fmt(chapter.start); button.append(stamp, document.createTextNode(chapter.title)); button.dataset.chapter = chapter.id;
    button.onclick = () => seek(chapter.start); item.append(button); $('chapters').append(item);
  }
  for (const row of rows) {
    const wrap = document.createElement('div'); wrap.className = 'passage';
    const button = document.createElement('button'), stamp = document.createElement('span'), text = document.createElement('span'), korean = document.createElement('span');
    button.dataset.row = row.id; stamp.textContent = fmt(row.start); text.append(document.createTextNode(row.en));
    korean.className = 'ko'; korean.lang = 'ko'; korean.textContent = row.ko; text.append(korean); button.append(stamp, text); button.onclick = () => seek(row.start);
    const evidence = document.createElement('button'); evidence.className = 'passage-evidence-button'; evidence.textContent = 'Evidence';
    evidence.setAttribute('aria-label', 'Evidence for passage at ' + fmt(row.start));
    evidence.onclick = () => { seek(row.start); renderPassageEvidence(row); panel('sources', true); $('sources').scrollIntoView({block: 'start'}); };
    wrap.append(button, evidence); $('transcript-list').append(wrap);
  }
  for (const source of DATA.sources) {
    const item = document.createElement('article'), title = document.createElement('strong'), note = document.createElement('p');
    title.textContent = source.id + ' · ' + source.title; note.textContent = source.note || '';
    item.append(title, note, externalLink(source.url, source.locator || 'Original source')); $('source-list').append(item);
  }
  renderArchiveCredits();
  $('third-party-notices').textContent = DATA.notices || '';
}
function digest() {
  const canvas = $('film'), pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let hash = 2166136261;
  for (const value of pixels) hash = Math.imul(hash ^ value, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
async function diagnostics() {
  pause(); const saved = current;
  $('diagnostics').textContent = 'Checking current Canvas image pixels and independently baked sound';
  try {
    if (!window.__ready) throw new Error('The archive picture is not ready');
    const stride = Math.max(1, Math.ceil(shots.length / 12));
    const samples = shots.filter((_shot, index) => index % stride === 0).slice(0, 12).map(shot => shot.t0 + (shot.t1 - shot.t0) * .55);
    const hashes = [], times = [];
    for (const time of samples) {
      const started = performance.now(); seek(time); hashes.push(digest()); times.push(performance.now() - started);
      await new Promise(requestAnimationFrame);
    }
    let same = true;
    for (let i = samples.length - 1; i >= 0; i--) { seek(samples[i]); same &&= digest() === hashes[i]; await new Promise(requestAnimationFrame); }
    const a = await bakeScore(), b = await bakeScore();
    const report = {scope: 'Current browser Canvas readback and independent OfflineAudioContext bakes; not viewing, listening or release approval', backend: 'canvas-archive', duration, shots: shots.length, utterances: rows.length, archiveImages: Object.keys(images).length, resolution: [$('film').width, $('film').height], samples: samples.map((time, i) => ({t: time, pixelFNV: hashes[i]})), orderIndependent: same, meanMs: times.reduce((sum, n) => sum + n, 0) / times.length, p95Ms: [...times].sort((x, y) => x - y)[Math.ceil(times.length * .95) - 1], sfx: {...checksum(a), equal: a.length === b.length && a.every((value, i) => value === b[i]), cues: cueSpecs.length, types: [...new Set(cueSpecs.map(cue => cue.kind))]}, errors: [...runtimeErrors]};
    $('diagnostics').textContent = JSON.stringify(report, null, 2); return report;
  } catch (error) { $('diagnostics').textContent = 'Diagnostics failed: ' + String(error); throw error; }
  finally { seek(saved); }
}
async function start() {
  const request = ++initRequest;
  window.__ready = false; archiveState = 'loading'; archiveError = null; pause(false);
  for (const id of ['play', 'fs-play', 'big-play']) $(id).disabled = true;
  $('error').style.display = 'none'; $('start').style.display = 'none';
  try {
    makeInterface();
    if (!restored) {
      restored = true;
      if (!headless && !qa) {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
          if (saved) {
            current = Number.isFinite(saved.time) ? clamp(saved.time, 0, duration) : 0;
            locale = ['ko', 'en', 'off'].includes(saved.locale) ? saved.locale : 'ko'; muted = Boolean(saved.muted);
          }
        } catch {}
      }
    }
    await Promise.all([loadArchiveImages(request), document.fonts?.ready || Promise.resolve()]);
    if (request !== initRequest) return;
    renderer = createArchiveCinema({canvas: $('film'), images, script: DATA.script, timeline: DATA.timeline});
    if (!renderer || typeof renderer.draw !== 'function') throw new Error('The archive renderer could not initialize');
    validateShots(renderer.shots); shots.splice(0, shots.length, ...renderer.shots); setupCues();
    $('locale').value = $('fs-locale').value = locale; $('seek').max = $('fs-seek').max = duration;
    archiveState = 'ready'; archiveError = null; window.__ready = true;
    resize();
    if (!window.__ready || !draw(current)) return;
    for (const id of ['play', 'fs-play', 'big-play']) $(id).disabled = false;
    $('start').style.display = headless ? 'none' : 'grid';
    $('status').textContent = current > 0 ? 'Restored · paused' : 'Ready';
    $('renderer-status').textContent = 'Archive film · Canvas';
    setMuted(muted);
    if (!loopStarted) { loopStarted = true; requestAnimationFrame(loop); }
  } catch (error) { if (request === initRequest) pictureFailed(error); }
}

const toggle = () => playing || pendingPlay ? pause() : play();
$('play').onclick = $('fs-play').onclick = toggle; $('big-play').onclick = play;
$('restart').onclick = () => seek(0);
$('seek').oninput = $('fs-seek').oninput = event => seek(Number(event.target.value));
$('mute').onclick = $('fs-mute').onclick = () => setMuted(!muted);
$('locale').onchange = $('fs-locale').onchange = event => setLocale(event.target.value);
$('picture').onclick = event => { if (!event.target.closest('button,input,select,a')) toggle(); };
$('transcript-toggle').onclick = () => panel('transcript'); $('sources-toggle').onclick = () => panel('sources');
$('evidence-link').onclick = () => panel('sources', true);
$('fullscreen').onclick = toggleExpandedView;
$('fs-exit').onclick = leaveExpandedView;
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { panel('transcript', false); panel('sources', false); leaveExpandedView().catch(recordError); }
  if (event.target.matches('input,select,textarea,button,a') || event.target.isContentEditable) return;
  if ([' ', 'k', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.preventDefault();
  if (event.key === ' ' || event.key === 'k') toggle();
  if (event.key === 'ArrowLeft') seek(current - 5); if (event.key === 'ArrowRight') seek(current + 5);
  if (event.key === 'Home') seek(0); if (event.key === 'End') seek(duration);
});
narration.onended = () => { pause(); draw(duration); $('status').textContent = 'Finished · replay available'; persist(); };
narration.onerror = () => {
  audioError = 'Narration media could not be decoded'; pause(); $('status').textContent = 'Audio needs retry';
  showError(audioError + '. Your position is preserved.', () => { narration.load(); return play(); });
};
narration.addEventListener('waiting', onMediaWaiting); narration.addEventListener('playing', onMediaPlaying);
narration.addEventListener('stalled', () => { if (narration.readyState < 3) onMediaWaiting(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && (playing || pendingPlay)) pause(); });
window.addEventListener('pagehide', persist); window.addEventListener('resize', resize);
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement === $('screen') && theater) setTheater(false);
  if (!document.fullscreenElement && !viewPending && !theater) wantedExpanded = false;
  updateViewLabels(); resize();
});
$('run-qa').onclick = () => diagnostics().catch(recordError); $('jump-end').onclick = () => seek(duration - .8);
if (DATA.deliveryMode === 'standalone') {
  $('download-film').onclick = event => {
    event.preventDefault();
    const blob = new Blob(['<!doctype html>\n' + document.documentElement.outerHTML], {type: 'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'S1E01-full-documentary.html'; link.click();
    requestAnimationFrame(() => URL.revokeObjectURL(url));
  };
}

const audioAPI = {
  prepare: prepareAudio, getBuffer: () => sfxBuffer,
  verify: async () => { const a = await bakeScore(), b = await bakeScore(); return {...checksum(a), equal: a.length === b.length && a.every((value, i) => value === b[i]), cues: cueSpecs.length, method: 'Independent OfflineAudioContext cue bakes', declaredNarrationSHA256: DATA.audio_sha256}; },
  setEnabled: async enabled => { const request = ++muteRequest; if (enabled) await prepareAudio(); if (request === muteRequest) setMuted(!enabled); },
  get status() { return audioState; }, get error() { return audioError; }, get enabled() { return !muted; }, get requested() { return soundRequested; }
};
window.__seek = seek;
window.__timeline = {SHOTS: shots, SPEECH: rows.map(row => [row.en, row.start, row.end, false, row.chapter, 0]), SCORE: cueSpecs};
window.__meta = {title: DATA.script.title, duration, fps: 30, aspects: ['16:9'], aspect: '16:9', setAspect: aspect => { if (aspect !== 0 && aspect !== '16:9') throw new Error('Only the commissioned 16:9 film is supported'); resize(); }, audio: audioAPI, starter: false, loop: false, play, pause, get time() { return current; }, get playing() { return playing; }, get frameCount() { return frameCount; }};
window.__film = {duration, fps: 30, seek, play, pause};
window.__state = () => ({time: current, playing, pendingPlay, buffering, audioTime: narration.currentTime, audioPaused: narration.paused, audioState, archiveState, archiveError, archiveImages: Object.keys(images).length, shot: activeShot?.id, kind: activeShot?.kind, assetIds: activeShot?.assetIds, backend: 'canvas-archive', viewMode: viewMode(), viewPending, resolution: [$('film').width, $('film').height], sceneState: renderer?.state, frames: frameCount, errors: [...runtimeErrors]});
window.__diagnostics = diagnostics;
window.__bootPromise = start();
