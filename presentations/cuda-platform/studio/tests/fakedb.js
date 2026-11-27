// In-memory stand-in for claude.use('db'|'user'|'room') so persistence paths can be tested locally.
(() => {
  const docs = new Map(); const subs = new Set(); let seq = 0;
  const parent = p => p.split('/').slice(0, -1).join('/');
  const deepMerge = (a, b) => { const o = {...a}; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a && typeof a[k] === 'object' && !Array.isArray(a[k]) ? deepMerge(a[k], v) : v; return o; };
  const snapDoc = (path) => ({id:path.split('/').pop(), exists:docs.has(path), data:() => docs.has(path) ? JSON.parse(JSON.stringify(docs.get(path))) : undefined});
  const notify = (path, type) => { setTimeout(() => subs.forEach(s => { if (s.doc === path) s.cb(snapDoc(path)); else if (s.col === parent(path)) s.cb(mk(s, [{type, doc:snapDoc(path)}])); }), window.__fdbDelay ?? 30); };
  const mk = (s, ch) => { let list = [...docs.keys()].filter(k => parent(k) === s.col).map(snapDoc); if (s.ord) list.sort((a, b) => (a.data()[s.ord.f] - b.data()[s.ord.f]) * (s.ord.d === 'desc' ? -1 : 1)); if (s.lim) list = list.slice(0, s.lim); return {docs:list, size:list.length, docChanges:() => ch}; };
  const docRef = path => ({id:path.split('/').pop(), path,
    get: async () => snapDoc(path),
    set: async d => { window.__fdbWrites = (window.__fdbWrites || 0) + 1; if (window.__fdbFail) throw {code:'unavailable'}; const t = docs.has(path) ? 'modified' : 'added'; docs.set(path, JSON.parse(JSON.stringify(d))); notify(path, t); },
    update: async d => { window.__fdbWrites = (window.__fdbWrites || 0) + 1; if (!docs.has(path)) throw {code:'invalid_argument'}; docs.set(path, deepMerge(docs.get(path), JSON.parse(JSON.stringify(d)))); notify(path, 'modified'); },
    delete: async () => { if (docs.has(path)){ docs.delete(path); notify(path, 'removed'); } },
    onSnapshot: (cb) => { const sub = {doc:path, cb}; subs.add(sub); setTimeout(() => cb(snapDoc(path)), 10); return () => subs.delete(sub); }});
  const colRef = (col, q = {}) => ({path:col, doc: id => docRef(col + '/' + (id || ('a' + (++seq)))),
    add: async d => { const r = docRef(col + '/a' + (++seq)); await r.set(d); return r; },
    orderBy: (f, d) => colRef(col, {...q, ord:{f, d}}), limit: n => colRef(col, {...q, lim:n}), where: () => colRef(col, q),
    onSnapshot: (cb, err) => { const s = {col, cb, ...q}; subs.add(s); setTimeout(() => cb(mk(s, [...docs.keys()].filter(k => parent(k) === col).map(k => ({type:'added', doc:snapDoc(k)})))), 20); return () => subs.delete(s); }});
  const db = {collection: colRef, doc: docRef};
  window.__fdb = {docs, remoteSet:(path, d) => { const t = docs.has(path) ? 'modified' : 'added'; docs.set(path, JSON.parse(JSON.stringify(d))); notify(path, t); }, remoteUpdate:(path, d) => { docs.set(path, deepMerge(docs.get(path) || {}, d)); notify(path, 'modified'); }};
  const user = {id: async () => window.__uid || 'u_test', me: async () => ({id:window.__uid || 'u_test', name:'Tester'}), isOwner: async () => true, canEdit: async () => true, can: async () => true, profiles: async ids => Object.fromEntries(ids.map(i => [i, {id:i, name:'User ' + i.slice(-2)}]))};
  const peers = new Set(); const room = {presence: async () => {}, onPeers: fn => { fn({peers:[]}); return () => {}; }, emit: () => {}, on: () => () => {}};
  window.claude = {use: async n => n === 'db' ? db : n === 'user' ? user : n === 'room' ? room : null};
})();
