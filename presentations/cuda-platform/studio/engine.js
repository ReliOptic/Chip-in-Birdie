(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS = {t1:'var(--t1)', t2:'var(--t2)', t3:'var(--t3)', g:'var(--g)', ink:'var(--g-ink)', card:'var(--card)', raised:'var(--raised)'};
const SW = ['t1','t2','t3','g'];
const FONTS = {sans:{n:'기본 고딕', css:'var(--sans)'}, inter:{n:'Inter (숫자·영문)', css:'"Inter",var(--sans)'}, serif:{n:'명조', css:'"Noto Serif KR",serif'}, mono:{n:'고정폭', css:'var(--mono)'}};
const FILLS = ['g','card','raised','t3'];

/* ============ IMAGES (from the presenters' earlier NVIDIA deck) ============ */
/* photos come from the 4-2 team's 2026.5.20 class deck supplied as the design reference */
const IMG = {
  cover:{src:'img/cover.webp', name:'표지 곡선'},
  keynote:{src:'img/keynote.webp', name:'키노트 무대'},
  geforce:{src:'img/geforce.webp', name:'GeForce 256 카드'},
  wave:{src:'img/wave.webp', name:'병렬 연산 시각화'},
  vision:{src:'img/vision.webp', name:'이미지 인식'},
  datacenter:{src:'img/datacenter.webp', name:'AI 데이터센터'},
  logo:{src:'img/nvidia-logo.png', name:'NVIDIA 로고', fit:'contain'},
};
const ICONS = ['chip','layers','cubes','people','cap','rocket','bulb','server','network','shield','robot','branch','flask','chart','search','bank'];
const ic = k => ICONS.includes(k) ? `<img class="ic" src="img/ic-${k}.png" alt="">` : '';

/* ============ ASSETS: exhibits, reusable on any slide ============ */
function lines(s){ return String(s || '').split('\n').map(x => x.trim()).filter(Boolean); }
function rlines(s){ return String(s || '').split('\n').filter(x => x.trim()); }
function cells(s){ return String(s || '').split('|').map(x => x.trim()); }
const D = ms => `animation-delay:${ms}ms`;
/* editable text inside exhibits: key|row|col points back into the asset's props */
const pe = (k, r, c, t) => `<span class="pe" data-pe="${k}|${r}|${c}">${esc(t)}</span>`;

function paintSVG(){
  const cpu = ['<rect x="270" y="12" width="20" height="40" rx="4" fill="#555"/>'];
  const pts = [];
  for (let k = 0; k < 28; k++){ const a = k / 28 * Math.PI * 2; pts.push([280 + 130 * Math.cos(a), 250 + 130 * Math.sin(a)]); }
  pts.push([235, 215], [325, 215]);
  for (let k = 0; k <= 10; k++){ const a = Math.PI * (0.15 + 0.7 * k / 10); pts.push([280 + 75 * Math.cos(a), 255 + 60 * Math.sin(a)]); }
  pts.forEach(([x, y], n) => cpu.push(`<circle class="dot an" style="${D(400 + n * 100)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#aaa"/>`));
  const gpu = [];
  const cols = 40, rows = 30, s = 12, ox = 40, oy = 64;
  for (let c = 0; c < cols; c++) gpu.push(`<rect class="brl an" x="${ox + c * s + 3}" y="12" width="6" height="28" rx="2" fill="#555"/>`);
  const ramp = ['#0c1304','#172507','#24380a','#3a5a06','#4f7a00','#62990a','#76b900','#9bd23a'];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
    const x = (c - 19.5) / 20, y = (r - 14.5) / 15;
    const head = Math.hypot(x / 0.42, (y + 0.28) / 0.55);
    const body = y > 0.35 ? Math.hypot(x / 0.95, (y - 1.25) / 0.85) : 9;
    let v = 0.18 + 0.12 * Math.sin(c * 0.4 + r * 0.25);
    if (head < 1) v = 0.95 - head * 0.45 + 0.08 * Math.cos(c * 0.9);
    else if (body < 1) v = 0.55 - body * 0.3;
    const k = Math.max(0, Math.min(7, Math.round(v * 7)));
    gpu.push(`<rect class="px an" x="${ox + c * s}" y="${oy + r * s}" width="${s - 1}" height="${s - 1}" fill="${ramp[k]}"/>`);
  }
  return [cpu.join(''), gpu.join('')];
}
let PAINT = null;

const ASSETS = {
  paintgun: {name:'물감총 시연: 순차 대 병렬', nw:1280, nh:600,
    props:[['cpu','왼쪽 이름'],['cpuL','왼쪽 막대 설명'],['gpu','오른쪽 이름'],['gpuL','오른쪽 막대 설명']],
    d:{cpu:'CPU', cpuL:'순차 처리: 한 번에 한 발씩', gpu:'GPU', gpuL:'병렬 처리: 1,000여 개 총열 동시 발사 · 275ms'},
    render:p => { PAINT = PAINT || paintSVG();
      return `<div class="a-paint"><figure><figcaption><b>${pe('cpu', -1, -1, p.cpu)}</b></figcaption><svg viewBox="0 0 560 440" role="img" aria-label="총열 하나가 한 발씩 쏜다">${PAINT[0]}</svg><div class="pbar"><i class="an cpu"></i></div><span class="pl">${pe('cpuL', -1, -1, p.cpuL)}</span></figure>
      <figure><figcaption><b style="color:var(--g)">${pe('gpu', -1, -1, p.gpu)}</b></figcaption><svg viewBox="0 0 560 440" role="img" aria-label="천 개가 넘는 총열이 한 번에 쏜다">${PAINT[1]}</svg><div class="pbar"><i class="an gpu"></i></div><span class="pl" style="color:var(--g)">${pe('gpuL', -1, -1, p.gpuL)}</span></figure></div>`; }},
  disguise: {name:'위장 흐름 (계산 → 그림 명령 → GPU)', nw:1120, nh:260,
    props:[['code','계산식'],['a','첫 칸'],['m','가운데 칸'],['z','끝 칸']], d:{code:'A × B', a:'행렬 곱셈', m:'삼각형 렌더링 명령으로 변환', z:'GPU'},
    render:p => `<div class="a-flow"><div class="box an" style="${D(100)}"><code>${pe('code', -1, -1, p.code)}</code><span>${pe('a', -1, -1, p.a)}</span></div><div class="arr an" style="${D(300)}"></div><div class="box mask an" style="${D(400)}"><svg width="96" height="84" viewBox="0 0 96 84" aria-hidden="true"><path d="M48 4 L92 80 H4 Z" fill="none" stroke="#aaa" stroke-width="3"/></svg><span>${pe('m', -1, -1, p.m)}</span></div><div class="arr an" style="${D(600)}"></div><div class="box an" style="${D(700)}"><span style="font-size:48px;color:var(--g);font-weight:600">${pe('z', -1, -1, p.z)}</span></div></div>`},
  chips: {name:'칩 줄 (전 제품 적용)', nw:896, nh:64,
    props:[['n','개수','number']], d:{n:8},
    render:p => `<div class="a-chips">${Array.from({length:Math.max(1, Math.min(24, +p.n || 8))}, (_, k) => `<i class="an" style="${D(500 + k * 60)}"></i>`).join('')}</div>`},
  acronym: {name:'약자 풀이 (CUDA)', nw:880, nh:220,
    props:[['w','단어 (|로 구분)'],['hi','강조 위치','number']], d:{w:'Compute|Unified|Device|Architecture', hi:2},
    render:p => `<div class="a-acr">${cells(p.w).map((w, k) => `<div class="${k + 1 === +p.hi ? 'u' : ''} an" style="${D(150 + k * 120)}"><b>${esc(w.charAt(0))}</b><span>${pe('w', 0, k, w)}</span></div>`).join('')}</div>`},
  onemany: {name:'하나의 프로그램 → 여러 GPU', nw:720, nh:160,
    props:[['src','프로그램'],['t','대상 (|로 구분)']], d:{src:'program.cu', t:'게임용 GeForce|워크스테이션|데이터센터용 GPU'},
    render:p => `<div class="a-om"><div class="src">${pe('src', -1, -1, p.src)}</div><svg width="120" height="160" viewBox="0 0 120 160" aria-hidden="true"><path class="dr an" style="--l:600;${D(500)}" d="M0 80 C60 80 60 16 120 16 M0 80 H120 M0 80 C60 80 60 144 120 144" fill="none" stroke="#76b900" stroke-width="2"/></svg><div class="tg">${cells(p.t).map((x, k) => `<div class="an" style="${D(800 + k * 100)}">${pe('t', 0, k, x)}</div>`).join('')}</div></div>`},
  stack: {name:'플랫폼 계층 구조', nw:1180, nh:600,
    props:[['rows','층 (아이콘|이름|설명|■ 또는 □) 위에서 아래로','textarea'],['top','□ 묶음 이름'],['topn','□ 묶음 설명'],['bot','■ 묶음 이름'],['botn','■ 묶음 설명']],
    d:{rows:'robot|AI 모델 · 응용 프로그램|연구기관과 기업이 개발해 공개|□\nbranch|프레임워크 · 개발 도구|모델 학습과 배포에 쓰는 소프트웨어|□\ncubes|CUDA-X 라이브러리|1,000개 이상의 연산 라이브러리|■\nlayers|CUDA 플랫폼|컴파일러 · 런타임 · 프로그래밍 모델|■\nchip|GPU 하드웨어|GeForce에서 데이터센터용 GPU까지|■', top:'가치 창출', topn:'외부 개발자가 창출', bot:'가치 획득', botn:'NVIDIA가 GPU 판매로 획득'},
    render:p => { const rs = lines(p.rows).map(cells); const n = rs.length; const h = Math.floor((600 - (n - 1) * 12) / n);
      const grp = f => rs.map((r, i) => ({r, i})).filter(o => (o.r[3] || '■').startsWith(f));
      const brace = (g, label, cls) => { if (!g.length) return ''; const y0 = g[0].i * (h + 12), y1 = g[g.length - 1].i * (h + 12) + h;
        return `<div class="brace ${cls} an" style="top:${y0}px;height:${y1 - y0}px;${D(200 + n * 120)}"><span>${pe(label, -1, -1, p[label])}<em>${pe(label + 'n', -1, -1, p[label + 'n'] || '')}</em></span></div>`; };
      return `<div class="a-stack">${rs.map((r, i) => { const f = (r[3] || '■').startsWith('■');
        return `<div class="ly ${f ? 'f' : 'o'} an" style="top:${i * (h + 12)}px;height:${h}px;${D(150 + (n - 1 - i) * 120)}">${ic(r[0])}<b>${pe('rows', i, 1, r[1])}</b><span>${pe('rows', i, 2, r[2] || '')}</span></div>`; }).join('')}
        ${brace(grp('□'), 'top', 'o')}${brace(grp('■'), 'bot', 'f')}</div>`; }},
  flywheel: {name:'교차 네트워크 효과 순환', nw:760, nh:600,
    props:[['nodes','네 단계 (|로 구분, 위부터 시계 방향)'],['c','가운데 글']],
    d:{nodes:'개발자 유입|응용 프로그램 증가|GPU 수요 증가|설치 기반 확대', c:'교차\n네트워크 효과'},
    render:p => { const n = cells(p.nodes).slice(0, 4); const cx = 380, cy = 300, r = 220; const ang = [-90, 0, 90, 180];
      const pt = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
      const arc = k => { const a0 = ang[k] + 30, a1 = ang[k] + 62; const [x0, y0] = pt(a0), [x1, y1] = pt(a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
      return `<div class="a-fly"><svg viewBox="0 0 760 600" aria-hidden="true"><defs><marker id="fa" viewBox="0 0 12 12" refX="10" refY="6" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" orient="auto"><path d="M1 1.5 L11 6 L1 10.5 Z" fill="#cfcfcf"/></marker></defs>
        ${[0, 1, 2, 3].map(k => `<path class="arc" style="--i:${k}" d="${arc(k)}" fill="none" stroke="#cfcfcf" stroke-width="3" stroke-linecap="round" marker-end="url(#fa)"/>`).join('')}</svg>
        ${n.map((t, k) => { const [x, y] = pt(ang[k]); return `<div class="nd" style="--i:${k};left:${x.toFixed(0)}px;top:${y.toFixed(0)}px">${pe('nodes', 0, k, t)}</div>`; }).join('')}
        <div class="ctr">${pe('c', -1, -1, p.c).replace(/\n/g, '<br>')}</div></div>`; }},
  kv: {fluid:true, name:'항목 표 (키 | 값)', nw:560, nh:420,
    props:[['t','제목'],['rows','행 (키|값)','textarea']],
    d:{t:'핵심 상호작용 (《플랫폼 레볼루션》)', rows:'생산자|CUDA로 프로그램을 개발하는 개발자\n소비자|프로그램을 활용하는 연구자와 기업\n가치 단위|프로그램 · 학습 코드 · AI 모델\n가치 회수|거래 수수료 없이 GPU 판매로 회수'},
    render:p => `<div class="a-kv"><div class="t">${pe('t', -1, -1, p.t)}</div>${lines(p.rows).map(cells).map((r, k) => `<div class="r an" style="${D(300 + k * 120)}"><span>${pe('rows', k, 0, r[0])}</span><b>${pe('rows', k, 1, r[1] || '')}</b></div>`).join('')}</div>`},
  cards: {fluid:true, name:'번호 카드 (조건 · 요인)', nw:1408, nh:440,
    props:[['items','카드 (아이콘|제목|설명|■ 또는 □)','textarea'],['step','클릭할 때마다 한 장씩','bool']],
    d:{items:'robot|외부 연구자의 개발|토론토대 대학원생이 CUDA로 직접 구현했다. NVIDIA는 딥러닝을 겨냥하지 않았다|□\npeople|시판 그래픽카드로 접근|GTX 580 두 장이면 충분했다. GeForce 전 제품에 CUDA를 탑재한 결과다|■\nbranch|공개 코드의 재사용|연구팀이 코드를 공개했고, 후속 연구가 그 위에서 이어졌다|□\nchip|하드웨어 교체만으로 성능 향상|논문은 더 빠른 GPU가 나오면 결과가 개선된다고 명시했다|■', step:true},
    render:p => { const it = lines(p.items).map(cells);
      return `<div class="a-cards" style="grid-template-columns:repeat(${Math.max(1, it.length)},1fr)">${it.map((r, k) => { const f = (r[3] || '■').startsWith('■');
        return `<div class="cd ${f ? 'f' : 'o'} ${p.step ? 'fragment' : 'an'}" style="${D(200 + k * 120)}"><div class="hd">${ic(r[0])}<em class="num">${String(k + 1).padStart(2, '0')}</em></div><b>${pe('items', k, 1, r[1])}</b><span>${pe('items', k, 2, r[2] || '')}</span></div>`; }).join('')}</div>`; }},
  phases: {fluid:true, name:'단계별 타임라인', nw:1408, nh:420,
    props:[['rows','단계 (기간|이름|설명|h 강조)','textarea']],
    d:{rows:'~2006|그래픽칩 기업|게이머에게 그래픽카드 판매\n2006–2012|플랫폼 출범|GeForce 설치 기반 위에서 대학부터 확산\n2012–2022|양면 시장 형성|개발자와 활용자가 분리되며 서로를 끌어들임|h\n2023–2025|수요 집중|대형 클라우드 사업자 중심, 점유율 80%대\n2026~|전환 비용 하락|AI가 코드 작성과 이식을 대신하기 시작'},
    render:p => { const rs = lines(p.rows).map(cells);
      return `<div class="a-ph"><div class="line"></div>${rs.map((r, k) => `<div class="st ${r[3] === 'h' ? 'h' : ''} an" style="${D(200 + k * 150)}"><i></i><em class="num">${pe('rows', k, 0, r[0])}</em><b>${pe('rows', k, 1, r[1])}</b><span>${pe('rows', k, 2, r[2] || '')}</span></div>`).join('')}</div>`; }},
  matrix: {name:'2×2 매트릭스', nw:960, nh:620,
    props:[['x','가로축'],['y','세로축'],['q','사분면 (왼위|오른위|왼아래|오른아래)'],['pts','점 (이름|x 0~1|y 0~1|■ 또는 □)','textarea'],['arr','화살표 (1>2, 줄바꿈 구분)','textarea']],
    d:{x:'외부 개발자의 축적 →', y:'전환 비용 →', q:'|고착형 플랫폼||개방형 플랫폼', pts:'CUDA 2012–2025|0.82|0.85|■\nCUDA 2026~|0.82|0.45|□\n허깅페이스|0.72|0.15|□', arr:'1>2'},
    render:p => { const X = v => 140 + Math.max(0, Math.min(1, +v || 0)) * 760, Y = v => 560 - Math.max(0, Math.min(1, +v || 0)) * 520;
      const pts = lines(p.pts).map(cells); const q = cells(p.q);
      const arr = lines(p.arr).map(a => a.split('>').map(n => pts[(+n || 0) - 1])).filter(a => a[0] && a[1]);
      return `<div class="a-mx"><svg viewBox="0 0 960 620" role="img" aria-label="${esc(p.x)} 대 ${esc(p.y)}"><defs><marker id="ma" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#aaa"/></marker></defs>
        <rect x="140" y="40" width="760" height="520" fill="#0d0d0d" stroke="#2d2d2d"/><path d="M520 40 V560 M140 300 H900" stroke="#2d2d2d" stroke-dasharray="4 6"/>
        ${[[160, 72, q[0]], [880, 72, q[1]], [160, 540, q[2]], [880, 540, q[3]]].map(([x, y, t], k) => t ? `<text x="${x}" y="${y}" text-anchor="${k % 2 ? 'end' : 'start'}" fill="#888" font-size="20">${esc(t)}</text>` : '').join('')}
        <text x="900" y="600" text-anchor="end" fill="#aaa" font-size="22">${esc(p.x)}</text><text x="100" y="40" fill="#aaa" font-size="22" transform="rotate(-90 100 40)" text-anchor="end">${esc(p.y)}</text>
        ${arr.map(([a, b], k) => `<path class="dr an" style="--l:400;${D(900 + k * 300)}" d="M${X(a[1])} ${Y(a[2]) + 22} L${X(b[1])} ${Y(b[2]) - 24}" stroke="#aaa" stroke-width="2.5" marker-end="url(#ma)"/>`).join('')}
        ${pts.map((r, k) => { const f = (r[3] || '■').startsWith('■'); return `<g class="an pt" style="${D(300 + k * 250)}"><circle cx="${X(r[1])}" cy="${Y(r[2])}" r="16" fill="${f ? '#76b900' : '#000'}" stroke="${f ? '#76b900' : '#aaa'}" stroke-width="3"/><text x="${X(r[1]) - 28}" y="${Y(r[2]) + 8}" text-anchor="end" fill="${f ? '#fff' : '#aaa'}" font-size="24" font-weight="500">${esc(r[0])}</text></g>`; }).join('')}</svg></div>`; }},
  debate: {fluid:true, name:'논거 비교 (두 입장)', nw:1408, nh:480,
    props:[['lt','왼쪽 제목'],['l','왼쪽 논거','textarea'],['rt','오른쪽 제목'],['r','오른쪽 논거','textarea'],['v','가운데 판단']],
    d:{lt:'전환 비용 약화 논리', l:'AI가 CUDA 코드를 타사 칩용으로 이식 (Anthropic, 약 3일)\n이식 비용 하락 시 멀티호밍 용이\n대형 클라우드 사업자의 자체 칩 비중 12~18%', rt:'생태계 강화 논리 (NVIDIA)', r:'AI의 CUDA 코드 작성 속도 향상 (Ian Buck)\nCUDA 기반 코드 축적 가속\n점유율은 여전히 80%대 (2026년 약 81%)', v:'판단 유보'},
    render:p => `<div class="a-db"><div class="col an" style="${D(200)}"><div class="h">${pe('lt', -1, -1, p.lt)}</div>${lines(p.l).map((t, i) => `<p>${pe('l', i, -1, t)}</p>`).join('')}</div><div class="vs an" style="${D(700)}"><span>${pe('v', -1, -1, p.v)}</span></div><div class="col g an" style="${D(450)}"><div class="h">${pe('rt', -1, -1, p.rt)}</div>${lines(p.r).map((t, i) => `<p>${pe('r', i, -1, t)}</p>`).join('')}</div></div>`},
  kpis: {fluid:true, name:'핵심 수치 카드', nw:1408, nh:200,
    props:[['rows','카드 (값|이름|주석|g 강조)','textarea']],
    d:{rows:'129억 달러|인수 금액|주주 대금 약 119억 달러 + 임직원 보상 최대 10억 달러|g\n1,200만 명+|허깅페이스 개발자 수|2026년 9월 기준\n300만 개+|공유 모델 수|2026년 9월 기준'},
    render:(p, bx) => { const rs = lines(p.rows).map(cells); const one = bx && bx.w < 640;
      return `<div class="a-kpi" style="grid-template-columns:repeat(${one ? 1 : Math.max(1, rs.length)},1fr)">${rs.map((r, k) => `<div class="k an" style="${D(150 + k * 120)}"><span class="lb">${pe('rows', k, 1, r[1] || '')}</span><b class="num" style="color:${r[3] === 'g' ? 'var(--g)' : 'var(--t1)'}">${pe('rows', k, 0, r[0])}</b><em>${pe('rows', k, 2, r[2] || '')}</em></div>`).join('')}</div>`; }},
  timeline: {fluid:true, name:'사건 타임라인', nw:1408, nh:220,
    props:[['rows','사건 (날짜|내용|g 또는 o)','textarea']],
    d:{rows:'2026.9.2|인수 계약 체결|g\n2026.9.3|인수 발표 (SEC 8-K 공시)|g\n2026.11|Anthropic, AMD 이식 사례 발표|o\n2027 상반기|규제 승인 후 거래 종결 예정|o'},
    render:p => { const rs = lines(p.rows).map(cells); const n = rs.length;
      return `<div class="a-tl"><div class="ln"></div>${rs.map((r, k) => `<div class="ev ${r[2] === 'g' ? 'g' : 'o'} an" style="left:${n > 1 ? k / (n - 1) * 100 : 50}%;${D(200 + k * 180)}"><i></i><em class="num">${pe('rows', k, 0, r[0])}</em><span>${pe('rows', k, 1, r[1] || '')}</span></div>`).join('')}</div>`; }},
  sticker: {fluid:true, name:'시사점 상자', nw:1408, nh:96,
    props:[['t','글','textarea'],['lb','머리말'],['fill','채움','bool']], d:{t:'NVIDIA는 딥러닝의 등장을 예측하지 않았다. 열어 둔 개발 기반 위에서 새로운 용도를 외부가 발견했다', lb:'시사점', fill:false},
    render:(p, bx) => `<div class="a-stk ${p.fill ? 'fill' : ''} ${bx && bx.w < 700 ? 'col' : ''} an" style="${D(400)}"><em>${pe('lb', -1, -1, p.lb)}</em><span>${pe('t', -1, -1, p.t)}</span></div>`},
  execsum: {fluid:true, name:'요약 (Executive summary)', nw:1408, nh:640,
    props:[['rows','행 (섹션|요약)','textarea']], d:{rows:''},
    render:p => `<div class="a-ex">${lines(p.rows).map(cells).map((r, k) => `<div class="r an" style="${D(120 + k * 90)}"><em class="num">${k + 1}</em><b>${pe('rows', k, 0, r[0])}</b><span>${pe('rows', k, 1, r[1] || '')}</span></div>`).join('')}</div>`},
  hbars: {name:'가로 막대 비교', nw:1000, nh:300,
    props:[['rows','행 (이름|값|g 강조)','textarea'],['unit','단위'],['cap','설명']],
    d:{rows:'AlexNet|15.3|g\n2위|26.2', unit:'%', cap:'ImageNet 2012 · 상위 5개 오류율 · 낮을수록 좋음'},
    render:p => { const rs = lines(p.rows).map(cells); const mx = Math.max(...rs.map(r => +r[1] || 0), 1);
      return `<div class="a-hb">${rs.map((r, i) => { const g = r[2] === 'g'; const w = (+r[1] || 0) / mx * 68;
        return `<div class="r"><div class="lb">${pe('rows', i, 0, r[0])}</div><div class="tr"><div class="fl an" style="width:${w}%;height:88px;background:${g ? 'var(--g)' : 'var(--raised)'}"></div><div class="v num" style="color:${g ? 'var(--g)' : 'var(--t1)'}">${pe('rows', i, 1, r[1])}${esc(p.unit)}</div></div></div>`; }).join('')}
        ${p.cap ? `<div class="cap">${pe('cap', -1, -1, p.cap)}</div>` : ''}</div>`; }},
  dcchart: {name:'배수 막대 (이전 대비 N배)', nw:840, nh:600,
    props:[['bl','왼쪽 이름'],['tl','오른쪽 이름'],['tv','오른쪽 값'],['m','배수','number']],
    d:{bl:'ChatGPT 이전', tl:'FY2026', tv:'1,937억 달러', m:13},
    render:p => { const m = Math.max(1, +p.m || 1); const H = 470;
      return `<div class="a-dc"><div class="cols"><div class="col"><div class="b an" style="height:${(H / m).toFixed(0)}px;background:var(--t3)"></div><div class="l">${pe('bl', -1, -1, p.bl)}</div></div><div class="col"><div class="top num">${pe('tv', -1, -1, p.tv)}</div><div class="b an" style="height:${H}px;background:var(--g)"></div><div class="l">${pe('tl', -1, -1, p.tl)}</div></div></div><div class="times num an" style="${D(800)}">${esc(m)}배</div></div>`; }},
  sharebars: {name:'점유율 막대 목록', nw:400, nh:140,
    props:[['t','제목'],['rows','행 (이름|값)','textarea']], d:{t:'NVIDIA 점유율', rows:'2023|87\n2026|81'},
    render:p => `<div class="a-sb"><div class="ttl">${pe('t', -1, -1, p.t)}</div>${lines(p.rows).map(cells).map((r, i) => `<div class="r num"><span>${pe('rows', i, 0, r[0])}</span><div><i class="an" style="width:${Math.min(100, +r[1] || 0)}%"></i></div><b>${esc(r[1])}%</b></div>`).join('')}</div>`},
  lock: {name:'묶임 도식 (한쪽만 연결)', nw:1200, nh:480,
    props:[['s','출발'],['ok','연결됨'],['no','막힘'],['r1','연결 이유 1'],['r2','연결 이유 2']], d:{s:'CUDA 프로그램', ok:'NVIDIA GPU', no:'타사 칩', r1:'NVIDIA GPU 전용 기계어로 컴파일', r2:'NVIDIA 전용 라이브러리 호출'},
    render:p => `<div class="a-lock"><svg viewBox="0 0 1200 480" role="img" aria-label="${esc(p.s)}은 ${esc(p.ok)}로만 이어진다">
      <rect x="20" y="180" width="320" height="120" rx="16" fill="none" stroke="#aaa" stroke-width="2"/><text x="180" y="250" text-anchor="middle" fill="#fff" font-size="30" font-weight="500">${esc(p.s)}</text>
      <path class="dr an" style="--l:480;${D(300)}" d="M340 240 C520 240 560 110 760 110" fill="none" stroke="#76b900" stroke-width="4"/><rect x="760" y="50" width="400" height="120" rx="16" fill="#141a0c" stroke="#76b900" stroke-width="2"/><text x="960" y="120" text-anchor="middle" fill="#ffffff" font-size="30" font-weight="600">${esc(p.ok)}</text>
      <text class="an" style="${D(700)}" x="440" y="120" fill="#aaa" font-size="20" text-anchor="middle">${esc(p.r1)}</text><text class="an" style="${D(800)}" x="440" y="150" fill="#aaa" font-size="20" text-anchor="middle">${esc(p.r2)}</text>
      <path class="an" style="${D(900)}" d="M340 240 C460 240 500 330 560 355" fill="none" stroke="#555" stroke-width="4" stroke-dasharray="10 10"/><path class="an" style="${D(1200)}" d="M600 345 l24 24 M624 345 l-24 24" stroke="#e5484d" stroke-width="4"/>
      <rect x="760" y="310" width="400" height="120" rx="16" fill="#151515" stroke="#2d2d2d" stroke-width="2"/><text x="960" y="380" text-anchor="middle" fill="#888" font-size="30" font-weight="500">${esc(p.no)}</text></svg></div>`},
  timecmp: {name:'기간 비교 (같은 축)', nw:1280, nh:330,
    props:[['a','짧은 쪽 표기'],['ad','짧은 쪽 일수','number'],['b','긴 쪽 표기'],['b1','긴 쪽 최소 일수','number'],['b2','긴 쪽 최대 일수','number'],['cap','단서','textarea']],
    d:{a:'약 3일', ad:3, b:'6~12개월', b1:180, b2:365, cap:'AMD MI355X용 코드 이식에 걸린 기간'},
    render:p => { const mx = Math.max(+p.b2 || 1, +p.ad || 1); const pa = Math.max(0.8, (+p.ad || 0) / mx * 100), p1 = (+p.b1 || 0) / mx * 100, p2 = (+p.b2 || 0) / mx * 100;
      return `<div class="a-time"><div class="r"><div class="n num" style="color:var(--g)">${pe('a', -1, -1, p.a)}</div><div class="tr"><i class="an" style="left:0;width:${pa}%;background:var(--g)"></i></div></div>
      <div class="r"><div class="n num">${pe('b', -1, -1, p.b)}</div><div class="tr"><i class="an" style="left:0;width:${p2}%;background:#333"></i><i class="an" style="left:0;width:${p1}%;background:#555"></i></div></div>
      <div class="ax"><span></span><div class="num"><span>0</span><span>6개월</span><span>12개월</span></div></div>
      ${p.cap ? `<div class="fine">${pe('cap', -1, -1, p.cap)}</div>` : ''}</div>`; }},
  cmptable: {fluid:true, name:'두 칸 비교표', nw:1240, nh:300,
    props:[['h','열 제목 (|로 구분)'],['rows','행 (항목|왼쪽|오른쪽, ●/○ 표시 가능)','textarea']],
    d:{h:'CUDA|허깅페이스', rows:'축적 대상|프로그램|AI 모델\nNVIDIA 칩|●필수|○선택\n형성 방식|2006년부터 자체 구축|기존 플랫폼 인수'},
    render:(p, bx) => { const sm = bx && bx.w < 760; const h = cells(p.h); const cell = (t, i, j) => { const m = /^([●○])\s*/.exec(t); return m ? `<i class="pin ${m[1] === '●' ? 'f' : 'o'}"></i>${pe('rows', i, j, t.slice(m[0].length))}` : pe('rows', i, j, t); };
      return `<div class="a-cmp ${sm ? 'sm' : ''}"><div></div><div class="h h1">${pe('h', 0, 0, h[0])}</div><div class="h">${pe('h', 0, 1, h[1])}</div>${lines(p.rows).map(cells).map((r, i) => `<div class="k">${pe('rows', i, 0, r[0])}</div><div>${cell(r[1] || '', i, 1)}</div><div>${cell(r[2] || '', i, 2)}</div>`).join('')}</div>`; }},
  sharebar: {fluid:true, name:'점유율 한 줄 막대', nw:1000, nh:40,
    props:[['v','값 (%)','number']], d:{v:81},
    render:p => `<div class="a-share" style="height:100%"><i class="an" style="width:${Math.min(100, Math.max(0, +p.v || 0))}%"></i></div>`},
};

/* ============ SCENES: period-accurate reconstructions the story happens inside (drawn, no logos) ============ */
const lensTag = t => t ? `<div class="sc-lens an" style="${D(100)}"><i></i>${pe('lens', -1, -1, t)}</div>` : '';
Object.assign(ASSETS, {
  sc_glsl:{scene:true, name:'장면: 그래픽 명령으로 위장한 계산', nw:1600, nh:900,
    props:[['lens','플랫폼 렌즈'],['code','코드 (줄 단위)','textarea'],['out','오른쪽 설명']],
    d:{lens:'개발 기반이 없던 시절', out:'화면에 그린 사각형의 픽셀 하나하나가 행렬 곱셈 결과의 칸 하나다',
      code:'// 2004년, GPU에 계산을 시키는 방법\nuniform sampler2D A;   // 행렬 A를 텍스처로 위장\nuniform sampler2D B;   // 행렬 B도 텍스처로 위장\nvoid main() {\n  // 픽셀 하나 = 결과 행렬의 칸 하나\n  vec4 sum = vec4(0.0);\n  for (int k = 0; k < N; k++)\n    sum += texture2D(A, vec2(k, y)) * texture2D(B, vec2(x, k));\n  gl_FragColor = sum;   // 계산 결과를 색깔로 출력\n}'},
    render:p => { const L = rlines(p.code);
      return `<div class="sc sc-glsl">${lensTag(p.lens)}
        <div class="win ed an" style="${D(200)}"><div class="tb"><i></i><i></i><i></i><span>matmul.frag</span></div><div class="code">${L.map((l, i) => `<div class="ln an" style="${D(500 + i * 140)}"><em>${i + 1}</em><span class="${/^\s*\/\//.test(l) ? 'cm' : ''}">${pe('code', i, -1, l)}</span></div>`).join('')}</div></div>
        <div class="win out an" style="${D(500 + L.length * 140)}"><div class="tb"><i></i><i></i><i></i><span>출력 창</span></div><div class="grid">${Array.from({length:64}, (_, i) => `<b class="an" style="${D(700 + L.length * 140 + (i % 8 + Math.floor(i / 8)) * 40)}"></b>`).join('')}</div><p>${pe('out', -1, -1, p.out)}</p></div></div>`; }},
  sc_driver:{scene:true, name:'장면: 드라이버 설치 창', nw:1600, nh:900,
    props:[['lens','플랫폼 렌즈'],['title','창 제목'],['items','설치 항목 (이름|설명|h 강조)','textarea'],['foot','아래 문구']],
    d:{lens:'설치 기반', title:'그래픽 드라이버 설치', items:'디스플레이 드라이버|화면 출력\n오디오 드라이버|HDMI 음성\nCUDA|범용 연산 기능, 모든 GeForce에 함께 설치|h', foot:'게임용 그래픽카드를 산 사람 모두가 CUDA를 실행할 수 있는 컴퓨터를 갖게 되었다'},
    render:p => { const it = lines(p.items).map(cells);
      return `<div class="sc sc-drv">${lensTag(p.lens)}<div class="desk"></div>
        <div class="dlg an" style="${D(200)}"><div class="tb"><span>${pe('title', -1, -1, p.title)}</span><b>×</b></div>
          <div class="bd"><div class="side"><i></i></div><div class="main"><h4>설치할 구성 요소</h4>${it.map((r, k) => `<label class="${r[2] === 'h' ? 'h' : ''} an" style="${D(600 + k * 350)}"><i class="ck"></i><span><b>${pe('items', k, 0, r[0])}</b><em>${pe('items', k, 1, r[1] || '')}</em></span></label>`).join('')}
          <div class="pg"><i class="an" style="${D(700 + it.length * 350)}"></i></div></div></div>
          <div class="ft"><button>뒤로</button><button class="pri">설치</button></div></div>
        <p class="cap an" style="${D(1200 + it.length * 350)}">${pe('foot', -1, -1, p.foot)}</p></div>`; }},
  sc_train:{scene:true, name:'장면: 2012년 학습 터미널과 대회 결과', nw:1600, nh:900,
    props:[['lens','플랫폼 렌즈'],['log','터미널 (줄 단위)','textarea'],['board','결과표 (순위|팀|오류율|g)','textarea'],['bt','결과표 제목']],
    d:{lens:'커뮤니티 효과', bt:'ILSVRC 2012 · 상위 5개 오류율',
      log:'$ nvcc -O3 convnet.cu -o convnet\n$ ./convnet --gpus 2 --data imagenet/\nGPU 0  GeForce GTX 580  3GB\nGPU 1  GeForce GTX 580  3GB\n학습 1일차  ......\n학습 3일차  ............\n학습 6일차  .................. 완료\n대회 제출  top-5 error 15.3%',
      board:'1|SuperVision (토론토대)|15.3%|g\n2|2위 팀|26.2%'},
    render:p => { const L = rlines(p.log); const B = lines(p.board).map(cells);
      return `<div class="sc sc-train">${lensTag(p.lens)}
        <div class="win term an" style="${D(200)}"><div class="tb"><i></i><i></i><i></i><span>student@toronto: ~/convnet</span></div><div class="code">${L.map((l, i) => `<div class="an ${l.startsWith('$') ? 'cmd' : ''} ${i === L.length - 1 ? 'res' : ''}" style="${D(400 + i * 420)}">${pe('log', i, -1, l)}</div>`).join('')}<span class="cur an" style="${D(400 + L.length * 420)}"></span></div></div>
        <div class="board fragment"><h4>${pe('bt', -1, -1, p.bt)}</h4>${B.map((r, k) => `<div class="row ${r[3] === 'g' ? 'g' : ''}"><em>${pe('board', k, 0, r[0])}</em><span>${pe('board', k, 1, r[1] || '')}</span><b>${pe('board', k, 2, r[2] || '')}</b><i style="--w:${(parseFloat(r[2]) || 0) / 30 * 100}%"></i></div>`).join('')}</div></div>`; }},
  sc_repo:{scene:true, name:'장면: 코드 저장소 검색', nw:1600, nh:900,
    props:[['lens','플랫폼 렌즈'],['q','검색어'],['items','저장소 (이름|설명)','textarea'],['n','큰 숫자'],['nl','큰 숫자 설명']],
    d:{lens:'교차 네트워크 효과', q:'language:CUDA', n:'600만', nl:'CUDA 개발자',
      items:'convnet|2012년 공개된 이미지 인식 학습 코드\ndeep-learning-framework|학습 코드를 짜는 프레임워크\nfast-inference|학습한 모델을 빠르게 실행하는 엔진\npaper-reproduction|논문 결과를 다시 만들어 보는 코드\nmedical-imaging|의료 영상 분석 모델\nclimate-sim|기후 시뮬레이션 커널'},
    render:p => { const it = lines(p.items).map(cells);
      return `<div class="sc sc-repo">${lensTag(p.lens)}
        <div class="win br an" style="${D(200)}"><div class="tb"><i></i><i></i><i></i><div class="url">${pe('q', -1, -1, p.q)}</div></div>
          <div class="list">${it.map((r, k) => `<div class="it an" style="${D(500 + k * 260)}"><b>${pe('items', k, 0, r[0])}</b><span>${pe('items', k, 1, r[1] || '')}</span><em>CUDA</em></div>`).join('')}</div></div>
        <div class="big fragment"><b class="num">${pe('n', -1, -1, p.n)}</b><span>${pe('nl', -1, -1, p.nl)}</span></div></div>`; }},
  sc_agent:{scene:true, name:'장면: AI 기반 코드 변환', nw:1600, nh:900,
    props:[['lens','플랫폼 렌즈'],['ask','요청'],['steps','진행 단계','textarea'],['old','과거 기간'],['now','이번 기간']],
    d:{lens:'전환 비용', ask:'이 CUDA 추론 코드를 AMD MI355X에서 돌아가게 옮겨 줘', steps:'CUDA 커널 구조 분석\nAMD용 코드로 변환\n성능 비교와 수정\n테스트 통과', old:'6~12개월', now:'약 3일'},
    render:p => { const st = lines(p.steps);
      return `<div class="sc sc-agent">${lensTag(p.lens)}
        <div class="win ag an" style="${D(200)}"><div class="tb"><i></i><i></i><i></i><span>agent — porting</span></div>
          <div class="msg an" style="${D(500)}"><b>›</b>${pe('ask', -1, -1, p.ask)}</div>
          ${st.map((s, k) => `<div class="step an" style="${D(1100 + k * 600)}"><i></i>${pe('steps', k, -1, s)}</div>`).join('')}</div>
        <div class="dur fragment"><div class="r"><span>과거</span><div><i class="o"></i></div><b>${pe('old', -1, -1, p.old)}</b></div><div class="r g"><span>2026년</span><div><i class="n"></i></div><b>${pe('now', -1, -1, p.now)}</b></div></div></div>`; }},
  sc_hub:{scene:true, name:'장면: 모델 허브와 인수 공시', nw:1600, nh:900,
    props:[['lens','플랫폼 렌즈'],['stats','허브 수치 (값|이름)','textarea'],['models','모델 목록','textarea'],['doc','공시 내용 (항목|값)','textarea']],
    d:{lens:'개방형 플랫폼', stats:'300만 개+|공개 모델\n1,200만 명+|개발자\n20만 곳+|기업',
      models:'텍스트 생성 모델\n이미지 분류 모델\n음성 인식 모델\n번역 모델\n코드 생성 모델\n의료 영상 모델',
      doc:'문서|FORM 8-K\n일자|2026년 9월 2일\n내용|허깅페이스 인수 계약 체결\n금액|129억 달러\n종결|규제 승인 후 2027년 상반기 예정\n약속|플랫폼 개방 유지, 특정 하드웨어 사용 의무 없음'},
    render:p => { const S = lines(p.stats).map(cells), M = lines(p.models), Dd = lines(p.doc).map(cells);
      return `<div class="sc sc-hub">${lensTag(p.lens)}
        <div class="win hb an" style="${D(200)}"><div class="tb"><i></i><i></i><i></i><div class="url">models</div></div>
          <div class="st">${S.map((r, k) => `<div class="an" style="${D(500 + k * 200)}"><b class="num">${pe('stats', k, 0, r[0])}</b><span>${pe('stats', k, 1, r[1] || '')}</span></div>`).join('')}</div>
          <div class="ms">${M.map((m, k) => `<div class="an" style="${D(1100 + k * 150)}"><i></i>${pe('models', k, -1, m)}</div>`).join('')}</div></div>
        <div class="doc fragment">${Dd.map((r, k) => `<div class="${k === 0 ? 'hd' : ''}"><em>${pe('doc', k, 0, r[0])}</em><span>${pe('doc', k, 1, r[1] || '')}</span></div>`).join('')}</div></div>`; }},
});

/* ============ CONSULTING EXHIBITS: mix shift, customer/price migration, range bars, before/after stack ============ */
Object.assign(ASSETS, {
  mix:{fluid:true, name:'매출 구성 변화 (100% 막대)', nw:900, nh:420,
    props:[['rows','연도 (이름|데이터센터 %|g 강조)','textarea'],['a','진한 부분 이름'],['b','나머지 이름']],
    d:{rows:'FY2017|19\nFY2025|88\nFY2026|90|g', a:'데이터센터', b:'게이밍 등 기타'},
    render:(p, bx) => { const rs = lines(p.rows).map(cells);
      return `<div class="a-mix"><div class="lg"><span><i class="d"></i>${pe('a', -1, -1, p.a)}</span><span><i class="o"></i>${pe('b', -1, -1, p.b)}</span></div>
        ${rs.map((r, k) => { const v = Math.max(0, Math.min(100, parseFloat(r[1]) || 0)); return `<div class="r ${r[2] === 'g' ? 'g' : ''}"><em>${pe('rows', k, 0, r[0])}</em><div class="bar"><i class="dc an" style="width:${v}%;${D(200 + k * 200)}"><b class="num">${pe('rows', k, 1, r[1])}%</b></i><i class="ot" style="width:${100 - v}%"><b class="num">${100 - v}%</b></i></div></div>`; }).join('')}</div>`; }},
  shift:{fluid:true, name:'고객과 가격대의 이동', nw:1408, nh:460,
    props:[['rows','단계 (시기|고객|제품|가격대|g 강조)','textarea'],['img','첫 칸 이미지 (geforce 등, 비우면 없음)']],
    d:{rows:'1999~|게이머|GeForce 그래픽카드|$200~500\n2006~|연구자|GeForce + CUDA|$500~2,000\n2016~|AI 연구소|DGX-1 서버|$129,000\n2022~|대형 클라우드|H100 GPU|$27,000~40,000|g', img:'geforce'},
    render:(p, bx) => { const rs = lines(p.rows).map(cells); const im = IMG[p.img];
      return `<div class="a-shift">${rs.map((r, k) => `<div class="st ${r[4] === 'g' ? 'g' : ''}">${k === 0 && im ? `<img src="${im.src}" alt="">` : ''}<em class="num">${pe('rows', k, 0, r[0])}</em><b>${pe('rows', k, 1, r[1] || '')}</b><span>${pe('rows', k, 2, r[2] || '')}</span><strong class="num">${pe('rows', k, 3, r[3] || '')}</strong></div>${k < rs.length - 1 ? '<i class="ar"></i>' : ''}`).join('')}</div>`; }},
  ranges:{fluid:true, name:'범위 막대 (점유율 등)', nw:1408, nh:360,
    props:[['rows','행 (이름|최소|최대|g 강조)','textarea'],['unit','단위'],['max','축 최대값','number']],
    d:{rows:'NVIDIA|81|81|g\n대형 클라우드 사업자 자체 칩|12|18\nAMD|5|12', unit:'%', max:100},
    render:(p, bx) => { const rs = lines(p.rows).map(cells); const mx = +p.max || 100; const pc = v => Math.max(0, Math.min(100, (parseFloat(v) || 0) / mx * 100));
      return `<div class="a-rng">${rs.map((r, k) => { const a = pc(r[1]), b = pc(r[2] || r[1]); const f = v => (parseFloat(v) || 0).toLocaleString('en-US'); const lab = (r[1] === r[2] || !r[2]) ? `${f(r[1])}${p.unit}` : `${f(r[1])}~${f(r[2])}${p.unit}`;
        return `<div class="r ${r[3] === 'g' ? 'g' : ''}"><span>${pe('rows', k, 0, r[0])}</span><div class="tr"><i class="base" style="left:0;width:${a}%"></i>${b > a ? `<i class="rg" style="left:${a}%;width:${b - a}%"></i>` : ''}<b class="num" style="left:${b}%">${esc(lab)}</b></div></div>`; }).join('')}
        <div class="ax num"><span></span><div><span>0</span><span>${mx / 2}${esc(p.unit)}</span><span>${mx}${esc(p.unit)}</span></div></div></div>`; }},
  thesis:{fluid:true, name:'투자 논리 (논리|설명|근거)', nw:1408, nh:470,
    props:[['rows','논리 (제목|설명|근거)','textarea'],['lb','위 머리말'],['eb','근거 머리말']],
    d:{lb:'분석', eb:'근거', rows:'통제 지점 확장|코드에 더해 모델 탐색·배포 단계 운영|개발자 1,200만 명+ · 기업 20만 곳+\n양면 네트워크 효과|모델 공급자·이용자 증가에 따른 플랫폼 가치 상승. 칩 전환과 무관하게 유지|공개 모델 300만 개+\nGPU 수요 확대|모델 개발·배포 증가에 따른 학습·추론 연산 수요 확대|FY2026 데이터센터 매출 1,937억 달러'},
    render:p => { const rs = lines(p.rows).map(cells);
      return `<div class="a-th" style="grid-template-columns:repeat(${rs.length},1fr)">${rs.map((r, k) => `<div class="c an" style="${D(200 + k * 250)}"><em class="num">0${k + 1} · ${pe('lb', -1, -1, p.lb)}</em><b>${pe('rows', k, 0, r[0])}</b><span>${pe('rows', k, 1, r[1] || '')}</span><div class="ev"><i>${pe('eb', -1, -1, p.eb)}</i><strong>${pe('rows', k, 2, r[2] || '')}</strong></div></div>`).join('')}</div>`; }},
  layers2:{fluid:true, name:'전후 비교 계층도', nw:1408, nh:560,
    props:[['lt','왼쪽 제목'],['l','왼쪽 층 (위에서 아래, 이름|■ 또는 □)','textarea'],['rt','오른쪽 제목'],['r','오른쪽 층','textarea'],['note','■ 설명']],
    d:{lt:'인수 전', l:'AI 서비스 · 응용 프로그램|□\n모델 유통 (허깅페이스)|□\n학습 프레임워크|□\nCUDA-X 라이브러리|■\nCUDA|■\nGPU|■', rt:'인수 후', r:'AI 서비스 · 응용 프로그램|□\n모델 유통 (허깅페이스)|■|n\n학습 프레임워크|□\nCUDA-X 라이브러리|■\nCUDA|■\nGPU|■', note:'NVIDIA가 보유하는 층'},
    render:(p, bx) => { const col = (t, key, s) => `<div class="col"><h4>${pe(key === 'l' ? 'lt' : 'rt', -1, -1, t)}</h4>${lines(s).map(cells).map((r, k) => `<div class="ly ${(r[1] || '').startsWith('■') ? 'f' : 'o'} ${key === 'r' && r[2] === 'n' ? 'new' : ''}">${pe(key, k, 0, r[0])}</div>`).join('')}</div>`;
      return `<div class="a-l2">${col(p.lt, 'l', p.l)}<div class="arr"></div>${col(p.rt, 'r', p.r)}<div class="nt"><i></i>${pe('note', -1, -1, p.note)}</div></div>`; }},
});


Object.assign(ASSETS, {
  bridge:{name:'전환 비용 전후 (닫힌 길과 열린 길)', nw:1408, nh:600,
    props:[['l1','첫 줄 이름'],['l2','둘째 줄 이름'],['src','출발'],['nv','NVIDIA 쪽'],['amd','대안 칩'],['wall','막힌 이유'],['ai','다리 역할'],['old','과거 기간'],['now','2026년 기간']],
    d:{l1:'지금까지', l2:'2026년', src:'CUDA 코드', nv:'NVIDIA GPU', amd:'AMD GPU', wall:'다시 짜야 함', ai:'AI 기반 코드 변환', old:'6~12개월', now:'약 3일'},
    render:p => `<div class="a-br">
      <div class="row r1"><em>${pe('l1', -1, -1, p.l1)}</em>
        <div class="bx s">${pe('src', -1, -1, p.src)}</div>
        <div class="paths"><svg viewBox="0 0 520 200" preserveAspectRatio="none"><path d="M0 100 C160 100 200 30 520 30" stroke="#cfcfcf" stroke-width="3" fill="none"/><path d="M0 100 C160 100 200 170 300 170" stroke="#555" stroke-width="3" stroke-dasharray="8 8" fill="none"/></svg><span class="x">✕</span><span class="wl">${pe('wall', -1, -1, p.wall)}</span></div>
        <div class="dst"><div class="bx n">${pe('nv', -1, -1, p.nv)}</div><div class="bx a off">${pe('amd', -1, -1, p.amd)}</div></div></div>
      <div class="row r2 fragment"><em>${pe('l2', -1, -1, p.l2)}</em>
        <div class="bx s">${pe('src', -1, -1, p.src)}</div>
        <div class="paths"><svg viewBox="0 0 520 200" preserveAspectRatio="none"><path class="go" d="M0 100 C160 100 200 30 520 30" stroke="#cfcfcf" stroke-width="3" fill="none"/><path class="go" d="M0 100 C160 100 200 170 520 170" stroke="#76b900" stroke-width="3" fill="none"/></svg><span class="ag">${pe('ai', -1, -1, p.ai)}</span></div>
        <div class="dst"><div class="bx n">${pe('nv', -1, -1, p.nv)}</div><div class="bx a on">${pe('amd', -1, -1, p.amd)}</div></div></div>
      <div class="tm fragment"><div class="tr"><i class="shr"></i></div><div class="lb"><span class="o">${pe('old', -1, -1, p.old)}</span><b class="num">${pe('now', -1, -1, p.now)}</b></div></div>
    </div>`},
});


Object.assign(ASSETS, {
  chain:{fluid:true, name:'인과 흐름 지도', nw:1408, nh:300,
    props:[['nodes','단계 (이름|설명|챕터 번호)','textarea'],['hl','강조할 챕터 (0이면 전체)','number']],
    d:{nodes:'커뮤니티 효과|개발자가 쌓는 코드|1\nGPU 수요|코드가 GPU를 부른다|1\nAI 시대의 독점|데이터센터 매출 90%|2\n전환 비용|옮기기 어려운 해자|2\nAI 이식|3일 만에 AMD로|3\n플랫폼 확장|허깅페이스 인수 결정|4', hl:0},
    render:(p, bx) => { const rs = lines(p.nodes).map(cells); const hl = +p.hl || 0;
      return `<div class="a-chain">${rs.map((r, k) => { const c = +r[2] || 0; const st = !hl ? 'all' : c === hl ? 'on' : c < hl ? 'past' : 'next';
        return `<div class="nd ${st}"><em class="num">${String(k + 1).padStart(2, '0')}</em><b>${pe('nodes', k, 0, r[0])}</b><span>${pe('nodes', k, 1, r[1] || '')}</span></div>${k < rs.length - 1 ? `<i class="ar ${st}"></i>` : ''}`; }).join('')}</div>`; }},
});

/* ============ STORY: one diagram that changes state scene by scene ============ */
Object.assign(ASSETS, {
  story:{name:'이야기 그림 (코드 → 칩, 장면 1~5)', nw:1408, nh:640,
    props:[['stage','장면 (1~5)','number'],['chips','칩 (|로 구분)'],['ai','번역 단계'],['hub','모델 허브'],['m1','장면 1 수치'],['m2','장면 2 수치'],['m3','장면 3 수치'],['m4','장면 4 수치'],['m5','장면 5 문구']],
    d:{stage:1, chips:'NVIDIA GPU|AMD GPU|자체 칩', ai:'AI 기반 코드 변환', hub:'모델 유통 · 허깅페이스 (인수 예정)', m1:'CUDA 개발자 약 600만 명', m2:'매출 90% 데이터센터 · 매출총이익률 71.1%', m3:'이식 기간 6~12개월 → 약 3일', m4:'인수 결정 129억 달러', m5:'허깅페이스 모델은 칩과 무관하게 실행'},
    render:p => { const st = Math.max(1, Math.min(5, +p.stage || 1)); const ch = cells(p.chips);
      const nw = k => st === k ? 'new' : '';
      const blocks = Array.from({length:12}, (_, i) => `<i class="cb ${st === 1 ? 'new' : ''}" style="--d:${i * 70}ms">&lt;/&gt;</i>`).join('');
      const line = (d, cls) => `<path class="${cls}" d="${d}"/>`;
      const toNv = 'M352 368 C620 368 760 250 1040 250', toAmdDirect = 'M352 368 C620 368 760 420 1040 420', toOwnDirect = 'M352 368 C620 368 760 560 1040 560';
      const toAi = 'M352 368 L560 368', aiAmd = 'M800 368 C900 368 940 420 1040 420', aiOwn = 'M800 368 C900 368 940 560 1040 560';
      const hubTo = x => `M${x} 96 L${x} 140`;
      let svg = '';
      if (st <= 3) svg += line(toNv, `nv ${st === 1 ? 'draw new' : ''} ${st >= 3 ? 'thin' : ''}`);
      if (st === 2) svg += line(toAmdDirect, 'blk') + line(toOwnDirect, 'blk');
      if (st >= 3) svg += line(toAi, `go ${nw(3)} draw`) + line(aiAmd, `go ${nw(3)} draw`) + line(aiOwn, `go ${nw(3)} draw`) + (st >= 4 ? line('M800 368 C900 368 940 250 1040 250', 'go') : '');
      const metric = st === 1 ? p.m1 : st === 2 ? p.m2 : st === 3 ? p.m3 : st === 4 ? p.m4 : p.m5; const mk = 'm' + st;
      return `<div class="a-story s${st}">
        ${st >= 4 ? `<div class="hub ${nw(4)}"><img src="img/nvidia-logo.png" alt="NVIDIA"><span>${pe('hub', -1, -1, p.hub)}</span></div><div class="hublinks ${nw(4)}"><i style="left:160px"></i><i style="left:680px"></i><i style="left:1224px"></i></div>` : ''}
        <div class="code"><div class="grid">${blocks}</div><span class="lb">CUDA 코드</span></div>
        <svg class="ln" viewBox="0 0 1408 640" aria-hidden="true">${svg}</svg>
        ${st === 2 ? `<div class="lock new"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div><span class="x x1">✕</span><span class="x x2">✕</span>` : ''}
        ${st >= 3 ? `<div class="ai ${nw(3)}">${pe('ai', -1, -1, p.ai)}</div>` : ''}
        <div class="chips">${ch.map((c, k) => `<div class="chip c${k} ${k === 0 ? 'nv' : ''} ${(k > 0 && st < 3) ? 'off' : ''} ${(k > 0 && st === 3) ? 'open new' : ''}">${pe('chips', 0, k, c)}</div>`).join('')}</div>
        <div class="metric ${'new'}">${pe(mk, -1, -1, metric)}</div>
      </div>`; }},
});

/* ============ BASE DECK ============ */
let uid = 0;
const T = (html, x, y, w, h, o = {}) => ({id:'e' + (++uid), type:'text', html, x, y, w, h, size:o.size || 32, color:o.color || 't1', weight:o.weight || 400, align:o.align || 'left', lh:o.lh || 1.3, mono:!!o.mono, anim:o.anim || 'none'});
const A = (asset, x, y, w, h, p = {}, anim = 'none') => ({id:'e' + (++uid), type:'asset', asset, x, y, w, h, p:Object.assign({}, (ASSETS[asset] || {}).d, p), anim});
const R = (x, y, w, h, fill = 'g', radius = 0) => ({id:'e' + (++uid), type:'rect', x, y, w, h, fill, radius, anim:'none'});
const I = (img, x, y, w, h, o = {}) => ({id:'e' + (++uid), type:'img', img, x, y, w, h, fit:o.fit || 'cover', radius:o.radius ?? 12, op:o.op ?? 1, anim:o.anim || 'fade'});
const H = t => T(t, 96, 76, 1408, 64, {size:50, weight:700, lh:1.2});
const SUB = t => T(t, 96, 142, 1408, 32, {size:22, color:'t2', lh:1.3});
const CAPT = (t, x, y, w) => T(t, x, y, w, 28, {size:18, color:'t3'});

const DECK = window.DECKS.cuda({T, A, R, I, H, SUB, CAPT});
const {SECTIONS, BASE, FACTS} = DECK;

const clone = o => JSON.parse(JSON.stringify(o));

/* ============ STATE ============ */
let slides = clone(BASE);           // working copy
let deck = '20';
let curId = null;
let selId = null;
let tab = 'props';
const overridden = new Set();       // ids that differ from BASE (stored)

function inDeck(s, d = deck){ return !s.deleted && String(s.d).split(' ').includes(d); }
function ord(s, d = deck){ return d === '5' ? (s.o5 ?? 50) : (s.o20 ?? 50); }
function list(){ return slides.filter(s => inDeck(s)).sort((a, b) => ord(a) - ord(b)); }
function cur(){ return slides.find(s => s.id === curId); }
function curEl(){ const s = cur(); return s && s.els.find(e => e.id === selId); }
function nid(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* ============ SANITIZE (shared text is untrusted) ============ */
function clean(html){
  const root = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html').body.firstChild;
  const walk = node => { let out = ''; node.childNodes.forEach(n => {
    if (n.nodeType === 3) out += esc(n.textContent);
    else if (n.nodeType === 1){ const t = n.tagName, inner = walk(n);
      if (t === 'BR') out += '<br>';
      else if (t === 'B' || t === 'STRONG') out += '<b>' + inner + '</b>';
      else if (t === 'SMALL') out += '<small>' + inner + '</small>';
      else if (t === 'I' || t === 'EM') out += '<i>' + inner + '</i>';
      else if (t === 'U') out += '<u>' + inner + '</u>';
      else if (t === 'UL' || t === 'OL') out += `<${t.toLowerCase()}>${inner.replace(/^(<br>)+|(<br>)+$/g, '')}</${t.toLowerCase()}>`;
      else if (t === 'LI') out += '<li>' + inner + '</li>';
      else if (t === 'SPAN' && ['g', 't2', 't3'].includes(n.className)) out += `<span class="${n.className}">${inner}</span>`;
      else if (t === 'DIV' || t === 'P') out += (out && !out.endsWith('<br>') ? '<br>' : '') + inner;
      else out += inner; } }); return out; };
  return root ? walk(root) : '';
}

/* ============ RENDER ============ */
function elHTML(e, mode){
  if (e.hidden && mode === 'present') return '';
  const st = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;${e.rot ? `transform:rotate(${+e.rot}deg);` : ''}`;
  const cls = ['el']; if (e.hidden) cls.push('hid'); if (e.lock) cls.push('locked'); if (mode === 'present'){ if (e.anim === 'step') cls.push('fragment'); if (e.anim === 'fade') cls.push('an-rise'); }
  if (e.type === 'text'){
    const ff = e.mono ? 'var(--mono)' : (FONTS[e.font] || FONTS.sans).css; const ls = e.ls != null ? e.ls : e.size >= 40 ? -0.03 : 0;
    const ts = `font-size:${+e.size}px;line-height:${+e.lh || 1.2};font-weight:${+e.weight || 400};color:${COLORS[e.color] || COLORS.t1};text-align:${['left', 'center', 'right', 'justify'].includes(e.align) ? e.align : 'left'};font-family:${ff};letter-spacing:${+ls}em;${e.italic ? 'font-style:italic;' : ''}`;
    const va = e.va === 'middle' ? 'center' : e.va === 'bottom' ? 'flex-end' : '';
    return `<div class="${cls.join(' ')}" data-id="${esc(e.id)}" style="${st}${va ? `display:flex;flex-direction:column;justify-content:${va};` : ''}"><div class="txt" style="${ts}">${clean(e.html)}</div></div>`;
  }
  if (e.type === 'img'){ const im = IMG[e.img]; const src = e.src || (im && im.src); if (!src) return ''; const logo = e.img === 'logo';
    const cz = +e.cz || 1, cx = e.cx ?? 50, cy = e.cy ?? 50;
    return `<div class="${cls.join(' ')} img" data-id="${esc(e.id)}" style="${st}"><img src="${esc(src)}" alt="${esc(im ? im.name : '이미지')}" draggable="false" style="object-fit:${e.fit === 'contain' || logo ? 'contain' : 'cover'};object-position:${logo ? 'left center' : `${+cx}% ${+cy}%`};opacity:${Math.max(0, Math.min(1, +(e.op ?? 1)))};border-radius:${+e.radius || 0}px;${cz > 1 ? `transform:scale(${cz});transform-origin:${+cx}% ${+cy}%;` : ''}"></div>`; }
  if (e.type === 'rect'){ const shp = e.shape || 'rect'; const op = e.op ?? 1;
    if (shp === 'line' || shp === 'arrow'){ const col = COLORS[e.stroke || e.fill] || COLORS.t2; const sw = +(e.sw ?? 4); const mid = e.h / 2;
      return `<div class="${cls.join(' ')} shape" data-id="${esc(e.id)}" style="${st}opacity:${+op}"><svg width="100%" height="100%" viewBox="0 0 ${+e.w} ${+e.h}" preserveAspectRatio="none"><line x1="${sw}" y1="${mid}" x2="${+e.w - (shp === 'arrow' ? sw * 3 : sw)}" y2="${mid}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" ${e.dash ? `stroke-dasharray="${sw * 3} ${sw * 2}"` : ''}/>${shp === 'arrow' ? `<path d="M${+e.w - sw * 4.5} ${mid - sw * 2.4} L${+e.w - sw * 0.5} ${mid} L${+e.w - sw * 4.5} ${mid + sw * 2.4} Z" fill="${col}"/>` : ''}</svg></div>`; }
    const bd = e.stroke ? `border:${+(e.sw ?? 2)}px ${e.dash ? 'dashed' : 'solid'} ${COLORS[e.stroke]};` : '';
    return `<div class="${cls.join(' ')}" data-id="${esc(e.id)}" style="${st}background:${e.fill === 'none' ? 'transparent' : COLORS[e.fill] || COLORS.g};border-radius:${shp === 'ellipse' ? '50%' : (+e.radius || 0) + 'px'};opacity:${+op};${bd}box-sizing:border-box"></div>`; }
  const a = ASSETS[e.asset]; if (!a) return '';
  const nw = a.fluid ? e.w : a.nw, nh = a.fluid ? e.h : a.nh;
  const k = a.fluid ? 1 : Math.min(e.w / a.nw, e.h / a.nh); const ox = (e.w - nw * k) / 2, oy = (e.h - nh * k) / 2;
  let inner = ''; try { inner = a.render(Object.assign({}, a.d, e.p || {}), {w:nw, h:nh}); } catch (_) { inner = ''; }
  return `<div class="${cls.join(' ')}" data-id="${esc(e.id)}" style="${st}"><div class="ab" style="width:${nw}px;height:${nh}px;transform:translate(${ox}px,${oy}px) scale(${k})">${inner}</div></div>`;
}
function chromeHTML(s){
  if (s.kind !== 'content') return '';
  const L = list().filter(x => x.kind === 'content'); const n = L.indexOf(s) + 1; const sec = s.sec == null ? -1 : +s.sec;
  const trk = sec >= 0 ? SECTIONS.map((t, i) => `<span class="${i === sec ? 'on' : i < sec ? 'done' : ''}">${esc(t)}</span>`).join('') : sec === -2 ? SECTIONS.map(t => `<span class="done">${esc(t)}</span>`).join('') : '<span class="on">Take home</span>';
  return `<div class="trk">${trk}</div><div class="rule"></div>${s.src ? `<div class="foot">${esc(s.src)}</div>` : ''}${n > 0 ? `<div class="pg num">${n}</div>` : ''}`;
}
function slideHTML(s, mode){ return (s.kind === 'content' || s.kind === 'refs' ? '<div class="bgfx" aria-hidden="true"></div>' : '') + s.els.map(e => elHTML(e, mode)).join('') + chromeHTML(s); }

function renderThumbs(){
  const box = $('#thumbs'); const L = list();
  box.innerHTML = L.map((s, n) => `<button class="thumb" type="button" data-id="${esc(s.id)}" aria-current="${s.id === curId}"><span class="n num">${n + 1}</span>${stale.has(s.id) ? '<span class="stl" title="원본이 바뀐 뒤 저장된 수정본">원본 변경</span>' : ''}<span class="f"><span class="stage static" style="display:block">${slideHTML(s, 'thumb')}</span></span></button>`).join('');
  fitThumbs();
}
function fitThumbs(){ document.querySelectorAll('#thumbs .f').forEach(f => { const st = f.firstChild; if (st) st.style.transform = `scale(${f.clientWidth / 1600})`; }); }
function renderThumb(id){
  const t = document.querySelector(`#thumbs .thumb[data-id="${CSS.escape(id)}"] .f`); const s = slides.find(x => x.id === id);
  if (t && s){ t.innerHTML = `<span class="stage static" style="display:block">${slideHTML(s, 'thumb')}</span>`; t.firstChild.style.transform = `scale(${t.clientWidth / 1600})`;
    const b = t.parentElement; const has = b.querySelector('.stl'); if (stale.has(id) && !has) t.insertAdjacentHTML('beforebegin', '<span class="stl" title="원본이 바뀐 뒤 저장된 수정본">원본 변경</span>'); else if (!stale.has(id) && has) has.remove(); }
}

function renderCanvas(){
  const s = cur(); const c = $('#canvas');
  c.innerHTML = s ? slideHTML(s, 'edit') : '';
  if (s){ if (selId && !s.els.some(e => e.id === selId)) selId = null; [...multi].forEach(id => { if (!s.els.some(e => e.id === id)) multi.delete(id); });
    selected().forEach(e => { const n = c.querySelector(`.el[data-id="${CSS.escape(e.id)}"]`); if (n) n.classList.add('sel'); });
    if (selId && !multi.size){ const n = c.querySelector(`.el[data-id="${CSS.escape(selId)}"]`); if (n && !curEl().lock) n.insertAdjacentHTML('beforeend', HANDLES); } }
  $('#notes').value = s ? (s.notes || '') : '';
}
let K = 1;
function fitCanvas(){
  const vp = $('#viewport'); const pad = innerWidth <= 900 ? 16 : 32;
  const fk = Math.max(0.05, Math.min((vp.clientWidth - pad) / 1600, (vp.clientHeight - pad) / 900)); K = fk * (typeof ZM === 'number' ? ZM : 1);
  $('#canvas').style.transform = `scale(${K})`;
  const w = $('#canvasWrap'); w.style.width = 1600 * K + 'px'; w.style.height = 900 * K + 'px'; w.style.transform = typeof PX === 'number' && (PX || PY) ? `translate(${PX}px,${PY}px)` : '';
  if (typeof renderStatus === 'function' && $('#status')) $('#status').querySelector('.zoom').textContent = Math.round((typeof ZM === 'number' ? ZM : 1) * 100) + '%';
}

/* ---------- inspector ---------- */
function fld(k, label, v, type = 'number'){ return `<label class="fld"><span>${label}</span><input id="f_${k}" data-k="${k}" type="${type}" value="${esc(v)}" step="4"></label>`; }
function renderPanel(){
  const P = $('#panel');
  if (tab === 'assets'){
    P.innerHTML = `<div class="grp"><div class="agrid">${Object.entries(ASSETS).map(([k, a]) => `<button class="acard" type="button" data-asset="${k}"><span class="pv"><div data-pv="${k}"></div></span><b>${esc(a.name)}</b></button>`).join('')}</div></div>`;
    P.querySelectorAll('[data-pv]').forEach(d => { const a = ASSETS[d.dataset.pv]; const box = d.parentElement; const k = Math.min(box.clientWidth / a.nw, box.clientHeight / a.nh) * 0.9;
      d.className = 'stage static'; d.style.cssText = `width:${a.nw}px;height:${a.nh}px;background:transparent;transform:translate(${(box.clientWidth - a.nw * k) / 2}px,${(box.clientHeight - a.nh * k) / 2}px) scale(${k})`;
      d.innerHTML = a.render(Object.assign({}, a.d), {w:a.nw, h:a.nh}); });
    return;
  }
  if (tab === 'layouts'){
    P.innerHTML = `<div class="grp"><div class="agrid">${LAYOUTS.map((l, i) => `<button class="acard" type="button" data-layout="${i}"><span class="pv"><span class="stage static" data-lpv="${i}"></span></span><b>${esc(l[0])}</b></button>`).join('')}</div></div>`;
    P.querySelectorAll('[data-lpv]').forEach(d => { const box = d.parentElement; const els = LAYOUTS[+d.dataset.lpv][2](); d.style.cssText = `position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(${box.clientWidth / 1600})`; d.innerHTML = els.map(e => elHTML(e, 'thumb')).join(''); });
    return;
  }
  if (tab === 'images'){
    P.innerHTML = `<div class="grp"><div class="agrid">${Object.entries(IMG).map(([k, m]) => `<button class="acard" type="button" data-img="${k}"><span class="pv"><img src="${m.src}" alt="" style="width:100%;height:100%;object-fit:cover"></span><b>${esc(m.name)}</b></button>`).join('')}</div></div>`;
    return;
  }
  const s = cur(); const e = curEl();
  if (!s){ P.innerHTML = ''; return; }
  if (multi.size > 1){
    P.innerHTML = `<div class="grp"><div class="lbl">${selected().length}개 요소 선택</div>
      ${ALIGN_BTNS}</div>
      <div class="grp ai-only"><div class="lbl">AI</div><button class="btn primary" type="button" id="bAskSel">선택 영역에 AI 요청</button></div>
      <div class="grp"><button class="btn" type="button" id="bDelSel">선택 요소 삭제</button></div>`;
    return;
  }
  if (!e){
    const isBase = baseFor().some(b => b.id === s.id), changed = overridden.has(s.id);
    P.innerHTML = `${stale.has(s.id) ? `<div class="grp warn"><div class="lbl">원본이 바뀌었습니다</div><p class="hint">이 장표는 원본이 수정되기 전에 저장된 수정본입니다. 지금 보이는 것은 수정본입니다.</p><div class="row2"><button class="btn primary" type="button" id="bTakeBase">원본 최신본 적용</button><button class="btn" type="button" id="bKeepMine">수정본 유지</button></div></div>` : ''}<div class="grp"><div class="lbl">장표</div>
      <label class="chk"><input type="checkbox" id="d20" ${String(s.d).includes('20') ? 'checked' : ''}>20분 발표에 포함</label>
      <label class="chk"><input type="checkbox" id="d5" ${String(s.d).split(' ').includes('5') ? 'checked' : ''}>5분 발제에 포함</label></div>
      <div class="grp"><div class="lbl">섹션 (위쪽 트래커)</div><select class="inp" id="f_sec" data-sk="sec">${['<option value="">없음 (표지·참고)</option>', `<option value="-1" ${s.kind === 'content' && +s.sec === -1 ? 'selected' : ''}>Take home</option>`].concat(SECTIONS.map((t, i) => `<option value="${i}" ${s.kind === 'content' && +s.sec === i ? 'selected' : ''}>${esc(t)}</option>`)).join('')}</select></div>
      <div class="grp"><div class="lbl">출처 (아래 각주)</div><textarea class="ta" id="f_src" data-sk="src" style="min-height:64px">${esc(s.src || '')}</textarea></div>
      <div class="grp"><div class="lbl">배분 시간 (분)</div><div class="row2">${fld('min', '20', s.min ?? '', 'number')}${fld('min5', '5', s.min5 ?? '', 'number')}</div></div>
      <div class="grp ai-only"><div class="lbl">AI</div><button class="btn primary" type="button" id="bAskAll">이 장표 전체에 AI 요청</button></div>
      <div class="grp"><div class="lbl">요소 추가</div><div class="addg"><button class="btn" type="button" data-add="text">텍스트</button><button class="btn" type="button" data-add="rect">사각형</button><button class="btn" type="button" data-add="ellipse">원</button><button class="btn" type="button" data-add="line">선</button><button class="btn" type="button" data-add="arrow">화살표</button><button class="btn" type="button" data-add="upload">이미지 올리기</button></div></div>
      
      <div class="grp">${isBase && changed ? '<button class="btn" type="button" id="bReset">이 장표를 원본으로 되돌리기</button>' : ''}<button class="btn" type="button" id="bDelSlide">장표 삭제</button></div>`;
    return;
  }
  let h = `<div class="grp"><div class="lbl">위치와 크기</div><div class="row2">${fld('x', 'X', e.x)}${fld('y', 'Y', e.y)}${fld('w', 'W', e.w)}${fld('h', 'H', e.h)}</div><div class="lbl">슬라이드 기준 정렬</div>${ALIGN_BTNS}</div>`;
  if (e.type === 'text'){
    h += `<div class="grp"><div class="lbl">글자</div><select class="inp" id="f_font" data-ks="font">${Object.entries(FONTS).map(([k, f]) => `<option value="${k}" ${(e.font || 'sans') === k ? 'selected' : ''}>${f.n}</option>`).join('')}</select>
      <div class="row2">${fld('size', '크기', e.size)}<select class="inp" id="f_weight" data-k="weight">${[[300, '가늘게'], [400, '보통'], [500, '중간'], [600, '약간 굵게'], [700, '굵게'], [800, '아주 굵게']].map(([w, l]) => `<option value="${w}" ${+e.weight === w ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="row2"><label class="fld"><span>줄 간격</span><input id="f_lh" data-k="lh" type="number" step="0.05" min="0.8" max="3" value="${+e.lh || 1.3}"></label><label class="fld"><span>자간</span><input id="f_ls" data-k="ls" type="number" step="0.01" min="-0.1" max="0.5" value="${e.ls ?? (e.size >= 40 ? -0.03 : 0)}"></label></div>
      <div class="tfmt" role="group" aria-label="글자 서식"><button type="button" data-fmt="bold" title="굵게 (⌘B)"><b>B</b></button><button type="button" data-fmt="italic" title="기울임 (⌘I)"><i>I</i></button><button type="button" data-fmt="underline" title="밑줄 (⌘U)"><u>U</u></button><button type="button" data-fmt="list" title="글머리 기호 목록">• 목록</button><button type="button" data-fmt="olist" title="번호 목록">1. 목록</button></div>
      <div class="seg" role="group" aria-label="세로 정렬">${[['top', '위'], ['middle', '가운데'], ['bottom', '아래']].map(([v, l]) => `<button type="button" data-va="${v}" aria-pressed="${(e.va || 'top') === v}">${l}</button>`).join('')}</div>
      <div class="sws">${SW.map(c => `<button class="sw" type="button" data-color="${c}" aria-pressed="${e.color === c}" style="background:${COLORS[c]}" title="${c}"></button>`).join('')}</div>
      <div class="seg" role="group">${['left', 'center', 'right'].map(a => `<button type="button" data-align="${a}" aria-pressed="${e.align === a}">${a === 'left' ? '왼쪽' : a === 'center' ? '가운데' : '오른쪽'}</button>`).join('')}</div>
      <button class="btn" type="button" id="bHi">선택한 글자 초록 강조</button></div>`;
  } else if (e.type === 'img'){
    h += `<div class="grp"><div class="lbl">이미지</div><button class="btn" type="button" id="bReplaceImg">이미지 파일로 바꾸기</button><select class="inp" id="f_img" data-k2="img"><option value="" ${e.src ? 'selected' : ''}>${e.src ? '올린 이미지' : '선택'}</option>${Object.entries(IMG).map(([k, m]) => `<option value="${k}" ${e.img === k ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
      <div class="seg" role="group">${[['cover', '채우기'], ['contain', '맞추기']].map(([v, l]) => `<button type="button" data-fit="${v}" aria-pressed="${(e.fit || 'cover') === v}">${l}</button>`).join('')}</div>
      <div class="row2"><label class="fld"><span>투명도</span><input data-k="op" type="number" step="0.05" min="0" max="1" value="${e.op ?? 1}"></label>${fld('radius', '모서리', e.radius || 0)}</div>
      <div class="lbl">자르기</div><label class="rng"><span>확대</span><input type="range" data-k="cz" min="1" max="4" step="0.05" value="${e.cz || 1}"></label><label class="rng"><span>가로 위치</span><input type="range" data-k="cx" min="0" max="100" step="1" value="${e.cx ?? 50}"></label><label class="rng"><span>세로 위치</span><input type="range" data-k="cy" min="0" max="100" step="1" value="${e.cy ?? 50}"></label></div>`;
  } else if (e.type === 'rect'){
    const shp = e.shape || 'rect'; const line = shp === 'line' || shp === 'arrow';
    h += `<div class="grp"><div class="lbl">도형</div><div class="seg" role="group">${[['rect', '사각형'], ['ellipse', '원'], ['line', '선'], ['arrow', '화살표']].map(([v, l]) => `<button type="button" data-shape="${v}" aria-pressed="${shp === v}">${l}</button>`).join('')}</div>
      ${line ? '' : `<div class="lbl">채우기</div><div class="sws">${FILLS.concat(['none']).map(c => `<button class="sw ${c === 'none' ? 'none' : ''}" type="button" data-fill="${c}" aria-pressed="${e.fill === c}" style="background:${c === 'none' ? 'transparent' : COLORS[c]}" title="${c === 'none' ? '채우기 없음' : c}"></button>`).join('')}</div>`}
      <div class="lbl">${line ? '선 색' : '테두리'}</div><div class="sws">${(line ? [] : ['']).concat(SW).map(c => `<button class="sw ${c ? '' : 'none'}" type="button" data-stroke="${c}" aria-pressed="${(e.stroke || '') === c}" style="background:${c ? COLORS[c] : 'transparent'}" title="${c || '없음'}"></button>`).join('')}</div>
      <div class="row2"><label class="fld"><span>두께</span><input data-k="sw" type="number" min="0" max="40" step="1" value="${e.sw ?? (line ? 4 : 2)}"></label><label class="fld"><span>투명도</span><input data-k="op" type="number" step="0.05" min="0" max="1" value="${e.op ?? 1}"></label></div>
      <div class="row2">${line ? '' : fld('radius', '모서리', e.radius || 0)}<label class="chk"><input type="checkbox" data-kb="dash" ${e.dash ? 'checked' : ''}>점선</label></div></div>`;
  } else {
    const a = ASSETS[e.asset]; const p = Object.assign({}, a.d, e.p || {});
    h += `<div class="grp"><div class="lbl">${esc(a.name)}</div>${a.props.map(([k, label, type]) => type === 'bool'
      ? `<label class="chk"><input type="checkbox" data-p="${k}" ${p[k] ? 'checked' : ''}>${esc(label)}</label>`
      : type === 'textarea' ? `<label class="grp"><span class="hint">${esc(label)}</span><textarea class="ta" data-p="${k}">${esc(p[k])}</textarea></label>`
      : `<label class="grp"><span class="hint">${esc(label)}</span><input class="inp" data-p="${k}" type="${type === 'number' ? 'number' : 'text'}" value="${esc(p[k])}"></label>`).join('')}
      <button class="btn" type="button" id="bRatio">원래 비율로 맞추기</button></div>`;
  }
  h += `<div class="grp"><div class="lbl">발표할 때</div><div class="seg" role="group">${[['none', '그대로'], ['fade', '떠오르기'], ['step', '클릭 시']].map(([v, l]) => `<button type="button" data-anim="${v}" aria-pressed="${(e.anim || 'none') === v}">${l}</button>`).join('')}</div></div>
    <div class="grp"><div class="row2"><button class="btn" type="button" id="bFront">맨 앞으로</button><button class="btn" type="button" id="bBack">맨 뒤로</button></div><button class="btn" type="button" id="bDelEl">요소 삭제</button></div>`;
  P.innerHTML = h;
}

function renderAll(){
  if (!list().some(s => s.id === curId)) curId = (list()[0] || {}).id; if (typeof sendPresence === 'function') sendPresence();
  renderThumbs(); renderCanvas(); renderPanel(); if (typeof renderStatus === 'function' && $('#status')) renderStatus();
  document.querySelectorAll('#bar .seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.deck === deck)));
}

/* ============ EDIT + PERSIST ============ */
/* ============ STORAGE: per-deck slide docs, shared through the artifact db ============ */
let deckId = 'cuda';
let decks = [{id:'cuda', name:'CUDA 플랫폼 발표'}];
const store = {db:null, pending:new Map(), busy:new Set(), timer:null, unsub:null, uid:null};
const LS = 'cuda-studio-v5';
const LSD = 'cuda-studio-decks';
const slidesPath = (d = deckId) => d === 'cuda' ? 'slides5' : 'decks/' + d + '/slides';
const baseFor = () => deckId === 'cuda' ? BASE : [];
const lsKey = (d = deckId) => d === 'cuda' ? LS : LS + ':' + d;
const synced = new Map();            // slide id -> last doc known to be stored (normalized v2)
const stale = new Set();             // slide ids whose stored copy was made from an older original
function setSync(s){ const n = $('#sync'); n.dataset.s = s; const t = s === 'shared' ? '모든 발표자에게 저장됨' : s === 'saving' ? '저장 중' : s === 'error' ? '저장 실패, 다시 시도 중' : '이 브라우저에만 저장'; n.title = t; n.setAttribute('aria-label', t); }

/* ---------- sanitize: everything read from storage is untrusted ---------- */
const num = (v, lo, hi, d = 0) => { const n = +v; return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const pick = (v, okList, d) => okList.includes(v) ? v : d;
const sid = v => /^[\w-]{1,64}$/.test(String(v)) ? String(v) : null;
const SAFE_SRC = v => typeof v === 'string' && (/^\/_blob\/[\w.-]+$/.test(v) || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v) || /^img\/[\w.-]+$/.test(v)) ? v : '';
function cleanEl(e){
  if (!e || typeof e !== 'object') return null; const id = sid(e.id); if (!id) return null;
  const type = pick(e.type, ['text', 'rect', 'img', 'asset'], null); if (!type) return null;
  const o = {id, type, x:num(e.x, -3200, 4800), y:num(e.y, -1800, 2700), w:num(e.w, 1, 6400, 10), h:num(e.h, 1, 3600, 10), anim:pick(e.anim, ['none', 'fade', 'step'], 'none')};
  if (e.rot) o.rot = num(e.rot, -360, 360); if (e.lock) o.lock = true; if (e.hidden) o.hidden = true; if (e.g && sid(e.g)) o.g = sid(e.g);
  if (type === 'text'){ Object.assign(o, {html:clean(e.html), size:num(e.size, 6, 320, 32), weight:pick(+e.weight, [300, 400, 500, 600, 700, 800], 400), color:pick(e.color, Object.keys(COLORS), 't1'), align:pick(e.align, ['left', 'center', 'right', 'justify'], 'left'), lh:num(e.lh, 0.8, 3, 1.3), mono:!!e.mono});
    if (e.font) o.font = pick(e.font, Object.keys(FONTS), undefined); if (e.ls != null) o.ls = num(e.ls, -0.1, 0.5); if (e.va) o.va = pick(e.va, ['top', 'middle', 'bottom'], 'top'); if (e.italic) o.italic = true; }
  else if (type === 'rect'){ Object.assign(o, {fill:pick(e.fill, Object.keys(COLORS).concat(['none']), 'g'), radius:num(e.radius, 0, 1000), shape:pick(e.shape, ['rect', 'ellipse', 'line', 'arrow'], 'rect')});
    if (e.stroke) o.stroke = pick(e.stroke, Object.keys(COLORS), 't2'); if (e.sw != null) o.sw = num(e.sw, 0, 40); if (e.op != null) o.op = num(e.op, 0, 1, 1); if (e.dash) o.dash = true; }
  else if (type === 'img'){ Object.assign(o, {img:IMG[e.img] ? e.img : '', fit:pick(e.fit, ['cover', 'contain'], 'cover'), radius:num(e.radius, 0, 1000), op:num(e.op, 0, 1, 1)});
    const src = SAFE_SRC(e.src); if (src) o.src = src; if (!o.img && !o.src) return null;
    if (e.cz != null) o.cz = num(e.cz, 1, 8, 1); if (e.cx != null) o.cx = num(e.cx, 0, 100, 50); if (e.cy != null) o.cy = num(e.cy, 0, 100, 50); }
  else { const a = ASSETS[e.asset]; if (!a) return null; o.asset = e.asset; const keys = new Set(Object.keys(a.d).concat(a.props.map(x => x[0]))); o.p = {};
    Object.entries(e.p && typeof e.p === 'object' ? e.p : {}).forEach(([k, v]) => { if (!keys.has(k)) return; if (typeof v === 'number') o.p[k] = num(v, -1e9, 1e9); else if (typeof v === 'boolean') o.p[k] = v; else if (typeof v === 'string') o.p[k] = v.slice(0, 8000); }); }
  return o;
}
function cleanSlide(id, v){
  if (!v || typeof v !== 'object' || !Array.isArray(v.els)) return null;
  const s = {id, d:/^[\d ]{0,12}$/.test(String(v.d ?? '20')) ? String(v.d ?? '20') : '20', o20:num(v.o20, -1e6, 1e6), o5:num(v.o5, -1e6, 1e6), kind:pick(v.kind, ['cover', 'content', 'scene', 'refs', 'plain'], 'content'),
    sec:v.sec == null || v.sec === '' ? null : num(v.sec, -2, 50), src:String(v.src || '').slice(0, 600), notes:String(v.notes || '').slice(0, 12000), deleted:!!v.deleted, els:v.els.map(cleanEl).filter(Boolean)};
  if (v.min != null) s.min = num(v.min, 0, 120); if (v.min5 != null) s.min5 = num(v.min5, 0, 120); if (v.tr) s.tr = pick(v.tr, ['fade', 'slide', 'convex', 'zoom', 'none'], 'fade');
  return s;
}

/* ---------- doc format v2: slide meta + elements keyed by id, so two people editing different elements both keep their work ---------- */
const META = ['d', 'o20', 'o5', 'kind', 'sec', 'src', 'notes', 'deleted', 'min', 'min5', 'tr'];
const hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const baseHash = id => { const b = baseFor().find(x => x.id === id); return b ? hash(JSON.stringify(b)) : ''; };
function toDoc(s){ const meta = {}; META.forEach(k => { if (s[k] !== undefined) meta[k] = s[k]; }); meta.order = s.els.map(e => e.id); const els = {}; s.els.forEach(e => { els[e.id] = clone(e); }); return {v:2, meta, els}; }
function fromDoc(id, d){
  if (!d || typeof d !== 'object') return null;
  if (d.slide) return cleanSlide(id, d.slide);                       // v1 docs: whole slide
  if (d.v !== 2 || !d.meta || !d.els) return null;
  const order = Array.isArray(d.meta.order) ? d.meta.order.map(String) : [];
  const ids = order.concat(Object.keys(d.els).filter(k => !order.includes(k)));
  const els = ids.map(k => d.els[k] && !d.els[k].del ? {...d.els[k], id:k} : null).filter(Boolean);
  return cleanSlide(id, {...d.meta, els});
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function patchFor(prev, next){
  const p = {meta:{}, els:{}}; let n = 0;
  META.concat(['order']).forEach(k => { if (!same(prev.meta[k], next.meta[k])){ p.meta[k] = next.meta[k] === undefined ? null : next.meta[k]; n++; } });
  Object.keys(next.els).forEach(k => { if (!same(prev.els[k], next.els[k])){ p.els[k] = next.els[k]; n++; } });
  Object.keys(prev.els).forEach(k => { if (!next.els[k] && !(prev.els[k] && prev.els[k].del)){ p.els[k] = {del:true}; n++; } });
  if (!Object.keys(p.meta).length) delete p.meta; if (!Object.keys(p.els).length) delete p.els;
  return n ? p : null;
}
const docBody = d => ({v:2, meta:d.meta, els:Object.fromEntries(Object.entries(d.els).filter(([, e]) => !e.del))});

function queueSave(s){ store.pending.set(deckId + '|' + s.id, {path:slidesPath(), ls:lsKey(), deck:deckId, id:s.id}); setSync('saving'); clearTimeout(store.timer); store.timer = setTimeout(flush, 450); }
const pendingFor = id => store.pending.has(deckId + '|' + id) || store.busy.has(deckId + '|' + id);
async function flush(){
  const jobs = [...store.pending.entries()].filter(([k]) => !store.busy.has(k));
  let failed = false;
  await Promise.all(jobs.map(async ([k, v]) => {
    store.pending.delete(k); if (v.deck !== deckId) return;
    const s = slides.find(x => x.id === v.id); if (!s) return;
    const next = toDoc(s); const prev = synced.get(v.id); const base = stale.has(v.id) ? (prev && prev.base) || '' : baseHash(v.id);
    if (!store.db){ try { const all = JSON.parse(localStorage.getItem(v.ls) || '{}'); all[v.id] = {...next, base, at:Date.now()}; localStorage.setItem(v.ls, JSON.stringify(all)); synced.set(v.id, {...next, base}); } catch (_) {} return; }
    store.busy.add(k);
    try {
      if (!prev){ await store.db.doc(v.path + '/' + v.id).set({...next, base, at:Date.now(), by:store.uid || ''}); synced.set(v.id, {...next, base}); }
      else { const p = patchFor(prev, next); if (p || prev.base !== base){ await store.db.doc(v.path + '/' + v.id).update({...(p || {}), base, at:Date.now(), by:store.uid || ''}); }
        synced.set(v.id, {...docBody(next), base}); }
    } catch (_) { if (!store.pending.has(k)) store.pending.set(k, v); failed = true; }
    finally { store.busy.delete(k); }
  }));
  if (store.pending.size){ setSync(failed ? 'error' : 'saving'); store.timer = setTimeout(flush, failed ? 4000 : 300); }
  else setSync(store.db ? 'shared' : 'local');
}

/* ---------- merge a stored doc into the working copy; local unsaved changes win per element ---------- */
function mergeRemote(id, raw){
  const remote = fromDoc(id, raw); if (!remote) return false;
  const rDoc = {...toDoc(remote), base:String(raw.base || '')};
  const prev = synced.get(id); synced.set(id, rDoc);
  const bh = baseHash(id); if (bh && rDoc.base !== bh) stale.add(id); else stale.delete(id);
  const i = slides.findIndex(x => x.id === id);
  if (i < 0 || !prev){ if (i < 0) slides.push(remote); else slides[i] = remote; overridden.add(id); return true; }
  const local = slides[i]; const lDoc = toDoc(local);
  if (same(docBody(lDoc), docBody(rDoc))) return false;                    // our own echo
  const out = {id};
  META.forEach(k => { const mine = !same(lDoc.meta[k], prev.meta[k]); const v = mine ? local[k] : remote[k]; if (v !== undefined) out[k] = v; });
  const mineOrder = !same(lDoc.meta.order, prev.meta.order); const order = (mineOrder ? lDoc.meta.order : rDoc.meta.order).slice();
  const elIds = new Set(Object.keys(lDoc.els).concat(Object.keys(rDoc.els)));
  const els = {};
  elIds.forEach(k => { const mine = !same(lDoc.els[k], prev.els[k]); const v = mine ? lDoc.els[k] : rDoc.els[k]; if (v) els[k] = v; });
  Object.keys(els).forEach(k => { if (!order.includes(k)) order.push(k); });
  out.els = order.filter(k => els[k]).map(k => clone(els[k]));
  slides[i] = out; overridden.add(id);
  // keep undo from reverting someone else's element edits
  [undo, redo].forEach(stack => stack.forEach(u => u.items.forEach(it => { if (it.id !== id || !it.data) return;
    it.data.els = it.data.els.map(e => { const before = prev.els[e.id], after = rDoc.els[e.id]; return before && after && same(e, before) && !same(before, after) ? clone(after) : e; }); })));
  return true;
}
function revertToBase(id){
  overridden.delete(id); stale.delete(id); synced.delete(id);
  const b = baseFor().find(x => x.id === id); const i = slides.findIndex(x => x.id === id);
  if (b){ if (i < 0) slides.push(clone(b)); else slides[i] = clone(b); } else if (i >= 0) slides.splice(i, 1);
}
function loadLocal(){ try { const all = JSON.parse(localStorage.getItem(lsKey()) || '{}'); Object.entries(all).forEach(([k, v]) => { if (sid(k)) mergeRemote(k, v); }); } catch (_) {} }

let dragging = false, editingText = false;
const deferred = new Map();          // remote changes to the slide being dragged/typed in, applied when the gesture ends
function applyDeferred(){ if (dragging || editingText || !deferred.size) return; const ids = [...deferred.keys()]; ids.forEach(id => { const d = deferred.get(id); deferred.delete(id); if (mergeRemote(id, d)) renderThumb(id); }); if (ids.includes(curId)){ renderCanvas(); if (!panelBusy()) renderPanel(); } }
const panelBusy = () => { const a = document.activeElement; return !!(a && $('#panel').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)); };
function subSlides(){
  if (store.unsub){ store.unsub(); store.unsub = null; }
  const db = store.db; if (!db) return; const myDeck = deckId;
  let first = true; const t = setTimeout(() => { if (first) setSync('error'); }, 10000);
  store.unsub = db.collection(slidesPath()).onSnapshot(snap => {
    clearTimeout(t); if (myDeck !== deckId) return; let touched = false, curTouched = false;
    snap.docChanges().forEach(ch => {
      const id = ch.doc.id; if (!sid(id)) return;
      if (ch.type === 'removed'){ if (pendingFor(id)) return; revertToBase(id); touched = true; curTouched = curTouched || id === curId; return; }
      if (id === curId && (dragging || editingText)){ deferred.set(id, ch.doc.data()); return; }
      if (mergeRemote(id, ch.doc.data())){ touched = true; curTouched = curTouched || id === curId; renderThumb(id); }
    });
    if (first || touched){
      if (!list().some(s => s.id === curId)) curId = (list()[0] || {}).id;
      if (first) renderThumbs(); else document.querySelectorAll('#thumbs .thumb').length !== list().length && renderThumbs();
      if ((first || curTouched) && !(dragging || editingText)){ const keepNotes = document.activeElement === $('#notes'); const n = $('#notes').value; renderCanvas(); if (keepNotes) $('#notes').value = n; if (!panelBusy()) renderPanel(); }
      renderStatus();
    }
    if (first){ first = false; if (!store.pending.size) setSync('shared'); }
  }, () => { clearTimeout(t); setSync('error'); });
}
function renderDecks(){
  const sel = $('#deckSel'); sel.innerHTML = decks.map(d => `<option value="${esc(d.id)}" ${d.id === deckId ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
  document.body.classList.toggle('deck-cuda', deckId === 'cuda');
}
function switchDeck(id){
  if (id === deckId) return; if (editingText) finishText();
  deckId = id; deck = '20'; slides = clone(baseFor()); overridden.clear(); synced.clear(); stale.clear(); undo.length = 0; curId = null; clearSel(); hideAI();
  if (!store.db) loadLocal();
  renderDecks(); renderAll(); if (store.db) subSlides(); subVersions(); subTheme();
}
async function createDeck(name, copy, imported){
  const id = nid('d'); const nm = String(name || '').trim().slice(0, 60) || '새 발표';
  const src = copy ? list().map(s => clone(s)) : null;
  decks.push({id, name:nm});
  if (store.db){ try { await store.db.doc('decks/' + id).set({name:nm, at:Date.now()}); } catch (_) { toast('덱을 만들지 못했습니다'); return; } }
  else { try { localStorage.setItem(LSD, JSON.stringify(decks.filter(d => d.id !== 'cuda'))); } catch (_) {} }
  switchDeck(id);
  let seed;
  if (imported){ seed = imported.map((sv, i) => { const t = cleanSlide('x', sv); if (!t) return null; t.id = nid('n'); t.d = '20'; t.o20 = i; t.o5 = i; t.deleted = false; return t; }).filter(Boolean); }
  else if (src) seed = src.map((s, i) => ({...s, id:nid('n'), d:'20', o20:i, o5:i}));
  else seed = [
    {id:nid('n'), kind:'cover', d:'20', o20:0, els:[I('cover', 0, 0, 1600, 900, {radius:0, op:0.2, anim:'none'}), R(128, 540, 64, 6), T(esc(nm), 128, 568, 1300, 100, {size:72, weight:600, lh:1.1}), T('부제', 128, 676, 1300, 44, {size:28, color:'t2'}), T('발표자 · 날짜', 128, 772, 1300, 32, {size:20, color:'t2'})], notes:''},
    {id:nid('n'), kind:'content', sec:-1, d:'20', o20:1, src:'', els:[H('한눈에 보기'), A('execsum', 96, 200, 1408, 620, {rows:EXEC})], notes:''},
  ];
  seed.forEach(s => { s.els.forEach(e => e.id = nid('e')); slides.push(s); queueSave(s); });
  curId = seed[0].id; renderAll(); toast('새 덱을 만들었습니다');
}
async function connect(){
  let db = null;
  try { db = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (_) { db = null; }
  if (!db){ try { const ds = JSON.parse(localStorage.getItem(LSD) || '[]'); if (Array.isArray(ds)) ds.forEach(d => d && d.id && decks.push({id:String(d.id), name:String(d.name || '발표')})); } catch (_) {} renderDecks(); return; }
  store.db = db; slides = clone(baseFor()); overridden.clear(); synced.clear(); stale.clear();
  try { const u = await window.claude.use('user'); store.uid = u ? await u.id() : null; } catch (_) { store.uid = null; }
  db.collection('decks').onSnapshot(snap => {
    decks = [{id:'cuda', name:'CUDA 플랫폼 발표'}].concat(snap.docs.map(d => ({id:d.id, name:String((d.data() || {}).name || '발표').slice(0, 60)})));
    renderDecks();
  }, () => {});
  subSlides(); subVersions();
}
$('#deckSel').addEventListener('change', ev => switchDeck(ev.target.value));
$('#bNewDeck').addEventListener('click', () => { const p = $('#deckPop'); p.hidden = !p.hidden; if (!p.hidden) $('#deckName').focus(); });
$('#deckForm').addEventListener('submit', ev => { ev.preventDefault(); const copy = ev.submitter && ev.submitter.dataset.copy === '1'; $('#deckPop').hidden = true; createDeck($('#deckName').value, copy); $('#deckName').value = ''; });
/* ---------- canvas interaction: select, marquee, group move, alt-duplicate, snap, resize, rotate, pan ---------- */
const canvas = $('#canvas');
let drag = null, marq = null, pan = null, spaceDown = false, pendPE = null, pendTXT = null, tsel = null;
/* text selection inside the scaled canvas is driven here, so a click puts the caret where it lands and a drag selects freely */
function caretPoint(x, y){ if (document.caretRangeFromPoint){ const r = document.caretRangeFromPoint(x, y); return r ? {n:r.startContainer, o:r.startOffset} : null; } if (document.caretPositionFromPoint){ const c = document.caretPositionFromPoint(x, y); return c ? {n:c.offsetNode, o:c.offset} : null; } return null; }
function textPointer(ev, host){
  if (ev.button !== 0) return; const a = caretPoint(ev.clientX, ev.clientY); if (!a || !host.contains(a.n)) return;
  ev.preventDefault(); host.focus({preventScroll:true}); const sel = getSelection();
  if (ev.detail === 2){ sel.setBaseAndExtent(a.n, a.o, a.n, a.o); if (sel.modify){ sel.modify('move', 'backward', 'word'); sel.modify('extend', 'forward', 'word'); } return; }
  if (ev.detail >= 3){ const r = document.createRange(); r.selectNodeContents(host); sel.removeAllRanges(); sel.addRange(r); return; }
  if (ev.shiftKey && sel.rangeCount && host.contains(sel.anchorNode)) sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, a.n, a.o);
  else sel.setBaseAndExtent(a.n, a.o, a.n, a.o);
  tsel = {host, a:ev.shiftKey && sel.anchorNode ? {n:sel.anchorNode, o:sel.anchorOffset} : a}; canvas.setPointerCapture(ev.pointerId);
}
const multi = new Set();
function groupIds(s, id){ const e = s.els.find(x => x.id === id); return e && e.g ? s.els.filter(x => x.g === e.g).map(x => x.id) : [id]; }
function selected(){ const s = cur(); if (!s) return []; const ids = new Set(multi); if (selId) ids.add(selId); return s.els.filter(e => ids.has(e.id)); }
function clearSel(){ selId = null; multi.clear(); if (!review) aiOpen = false; }
function selectIds(ids){ clearSel(); ids.forEach(i => multi.add(i)); selId = ids[ids.length - 1] || null; if (multi.size === 1) multi.clear(); }
function toSlide(ev){ const r = canvas.getBoundingClientRect(); return {x:(ev.clientX - r.left) / K, y:(ev.clientY - r.top) / K}; }
const isBg = e => (e.type === 'img' || e.type === 'rect') && e.w >= 1500 && e.h >= 800;
function drawMarq(){
  let m = canvas.querySelector('#marq'); if (!m){ m = document.createElement('div'); m.id = 'marq'; canvas.appendChild(m); }
  const x0 = Math.min(marq.x0, marq.x1), y0 = Math.min(marq.y0, marq.y1);
  m.style.cssText = `left:${x0}px;top:${y0}px;width:${Math.abs(marq.x1 - marq.x0)}px;height:${Math.abs(marq.y1 - marq.y0)}px`;
}
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => `<div class="handle h-${h}" data-h="${h}"></div>`).join('') + '<div class="rhandle" data-r="1"></div>';
const HDIR = {nw:[-1, -1], n:[0, -1], ne:[1, -1], e:[1, 0], se:[1, 1], s:[0, 1], sw:[-1, 1], w:[-1, 0]};
function snapEdges(s, e, sx, sy){
  if (e.rot){ guides([]); return; }
  const xs = [96, 800, 1504], ys = [196, 450, 820, 72]; s.els.forEach(o => { if (o.id === e.id || isBg(o) || o.hidden) return; xs.push(o.x, o.x + o.w / 2, o.x + o.w); ys.push(o.y, o.y + o.h / 2, o.y + o.h); });
  const th = 6 / Math.max(K, 0.2); const out = [];
  const near = (v, arr) => { let b = null, d = th + 1; arr.forEach(c => { if (Math.abs(c - v) < d && Math.abs(c - v) <= th){ d = Math.abs(c - v); b = c; } }); return b; };
  if (sx === 1){ const c = near(e.x + e.w, xs); if (c != null){ e.w = Math.max(16, c - e.x); out.push(['v', c]); } }
  if (sx === -1){ const c = near(e.x, xs); if (c != null){ const r = e.x + e.w; e.x = c; e.w = Math.max(16, r - c); out.push(['v', c]); } }
  if (sy === 1){ const c = near(e.y + e.h, ys); if (c != null){ e.h = Math.max(8, c - e.y); out.push(['h', c]); } }
  if (sy === -1){ const c = near(e.y, ys); if (c != null){ const b = e.y + e.h; e.y = c; e.h = Math.max(8, b - c); out.push(['h', c]); } }
  guides(out);
}
function guides(gs){ canvas.querySelectorAll('.guide').forEach(n => n.remove()); gs.forEach(([ax, v]) => { const d = document.createElement('div'); d.className = 'guide ' + ax; d.style[ax === 'v' ? 'left' : 'top'] = v + 'px'; canvas.appendChild(d); }); }
function snapMove(s, group, dx, dy){
  const ids = new Set(group.map(g => g.e.id));
  const bx0 = Math.min(...group.map(g => g.x)) + dx, by0 = Math.min(...group.map(g => g.y)) + dy;
  const bx1 = Math.max(...group.map(g => g.x + g.e.w)) + dx, by1 = Math.max(...group.map(g => g.y + g.e.h)) + dy;
  const xs = [96, 800, 1504], ys = [196, 450, 820, 72];
  s.els.forEach(e => { if (ids.has(e.id) || isBg(e) || e.hidden) return; xs.push(e.x, e.x + e.w / 2, e.x + e.w); ys.push(e.y, e.y + e.h / 2, e.y + e.h); });
  const th = 6 / Math.max(K, 0.2); let sx = 0, sy = 0, gx = null, gy = null, best = th + 1;
  [bx0, (bx0 + bx1) / 2, bx1].forEach(v => xs.forEach(c => { const d = c - v; if (Math.abs(d) < best && Math.abs(d) <= th){ best = Math.abs(d); sx = d; gx = c; } }));
  best = th + 1;
  [by0, (by0 + by1) / 2, by1].forEach(v => ys.forEach(c => { const d = c - v; if (Math.abs(d) < best && Math.abs(d) <= th){ best = Math.abs(d); sy = d; gy = c; } }));
  const out = []; if (gx != null) out.push(['v', gx]); if (gy != null) out.push(['h', gy]); guides(out);
  return [dx + sx, dy + sy];
}
canvas.addEventListener('pointerdown', ev => {
  if (ev.button === 2) return;
  if (spaceDown || ev.button === 1){ pan = {sx:ev.clientX, sy:ev.clientY, px:PX, py:PY}; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); return; }
  if (editingText){ const host = ev.target.closest('.pe.on, .editing .txt'); if (host){ textPointer(ev, host); return; } finishText(); }
  const s = cur(); if (!s) return; closeCtx();
  { const nd = ev.target.closest('.el'); const te = nd && s.els.find(x => x.id === nd.dataset.id); const was = te && selId === te.id && !multi.size;
    const sp = ev.target.closest('.pe') || (ev.target.querySelectorAll && ev.target.querySelectorAll('.pe').length === 1 ? ev.target.querySelector('.pe') : null);
    if (te && !te.lock && !ev.shiftKey && !ev.altKey && (ev.detail >= 2 || was)){
      if (sp && te.type === 'asset'){ ev.preventDefault(); if (!was){ selectIds([te.id]); renderCanvas(); } const sp2 = canvas.querySelector(`.el[data-id="${CSS.escape(te.id)}"] .pe[data-pe="${sp.dataset.pe}"]`); if (ev.detail >= 2 || was){ pendPE = {span:sp2, id:te.id, x:ev.clientX, y:ev.clientY, word:ev.detail >= 2}; } }
      else if (te.type === 'text' && (ev.detail >= 2)){ ev.preventDefault(); startEdit(te.id, ev.clientX, ev.clientY, true); return; }
      else if (te.type === 'text' && was){ pendTXT = {id:te.id, x:ev.clientX, y:ev.clientY}; }
    } }
  const elNode = ev.target.closest('.el'); const id = elNode && elNode.dataset.id; let e = id && s.els.find(x => x.id === id);
  if (e && e.lock && !selected().includes(e)) e = null;
  if (!e || (isBg(e) && !selected().includes(e))){
    const p = toSlide(ev); marq = {x0:p.x, y0:p.y, x1:p.x, y1:p.y};
    if (!ev.shiftKey){ clearSel(); renderCanvas(); renderPanel(); }
    hideAI(); canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); return;
  }
  const gids = groupIds(s, e.id);
  if (ev.shiftKey){
    const on = gids.every(g => g === selId || multi.has(g));
    if (on){ gids.forEach(g => multi.delete(g)); if (gids.includes(selId)) selId = [...multi].pop() || null; }
    else { if (selId) multi.add(selId); gids.forEach(g => multi.add(g)); selId = e.id; }
    if (multi.size === 1){ selId = [...multi][0]; multi.clear(); }
    renderCanvas(); renderPanel(); placeAI(); return;
  }
  if (!(selId === e.id || multi.has(e.id))){ selectIds(gids); renderCanvas(); renderPanel(); }
  const hn = ev.target.closest('[data-h]'); const resize = !!hn, rotate = !!ev.target.closest('[data-r]');
  if (selected().some(x => x.lock) && !resize){ hideAI(); return; }
  drag = {id:e.id, sx:ev.clientX, sy:ev.clientY, w:e.w, h:e.h, x0:e.x, y0:e.y, hd:hn ? (HDIR[hn.dataset.h] || [1, 1]) : null, ratio:e.w / e.h, resize, rotate, alt:ev.altKey && !resize && !rotate, moved:false, group:selected().map(x => ({e:x, x:x.x, y:x.y}))};
  hideAI(); canvas.setPointerCapture(ev.pointerId); ev.preventDefault();
});
canvas.addEventListener('pointermove', ev => {
  if (tsel){ const b = caretPoint(ev.clientX, ev.clientY); if (b && tsel.host.contains(b.n)) getSelection().setBaseAndExtent(tsel.a.n, tsel.a.o, b.n, b.o); return; }
  if (pan){ PX = pan.px + ev.clientX - pan.sx; PY = pan.py + ev.clientY - pan.sy; applyView(); return; }
  if (marq){ const p = toSlide(ev); marq.x1 = p.x; marq.y1 = p.y; drawMarq(); return; }
  if (!drag) return; const s = cur(); const e = s.els.find(x => x.id === drag.id); if (!e) return;
  let dx = (ev.clientX - drag.sx) / K, dy = (ev.clientY - drag.sy) / K;
  if (!drag.moved && Math.hypot(dx, dy) < 3) return;
  if (!drag.moved){
    snapshot(drag.rotate ? '회전' : drag.resize ? '크기 조절' : drag.alt ? '복제하며 이동' : '이동'); drag.moved = true; dragging = true;
    if (drag.alt){ const gmap = {}; const copies = drag.group.map(g => { const c = clone(g.e); c.id = nid('e'); if (c.g){ gmap[c.g] = gmap[c.g] || nid('g'); c.g = gmap[c.g]; } s.els.push(c); return {e:c, x:g.x, y:g.y}; }); drag.group = copies; selectIds(copies.map(c => c.e.id)); renderCanvas(); }
  }
  const snap4 = v => Math.round(v / 4) * 4;
  if (drag.rotate){
    const r = canvas.getBoundingClientRect(); const cx = r.left + (e.x + e.w / 2) * K, cy = r.top + (e.y + e.h / 2) * K;
    let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90; if (ev.shiftKey) a = Math.round(a / 15) * 15; else a = Math.round(a);
    e.rot = ((a % 360) + 360) % 360; if (e.rot > 180) e.rot -= 360;
    const n = canvas.querySelector(`.el[data-id="${CSS.escape(e.id)}"]`); if (n) n.style.transform = e.rot ? `rotate(${e.rot}deg)` : '';
    return;
  }
  if (drag.resize){
    const [hx, hy] = drag.hd; const th = (e.rot || 0) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
    const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;              // pointer delta in the element's own axes
    let w = hx ? Math.max(16, drag.w + hx * lx) : drag.w, h = hy ? Math.max(8, drag.h + hy * ly) : drag.h;
    if ((ev.shiftKey || e.type === 'img' || (e.type === 'asset' && !(ASSETS[e.asset] || {}).fluid)) && hx && hy){ const k = Math.max(w / drag.w, h / drag.h); w = Math.max(16, drag.w * k); h = Math.max(8, drag.h * k); }
    w = snap4(w); h = snap4(h);
    // keep the opposite handle fixed in slide coordinates
    const c0x = drag.x0 + drag.w / 2, c0y = drag.y0 + drag.h / 2; const ax = -hx * drag.w / 2, ay = -hy * drag.h / 2;
    const Ax = c0x + ax * cs - ay * sn, Ay = c0y + ax * sn + ay * cs; const bx = -hx * w / 2, by = -hy * h / 2;
    const c1x = Ax - (bx * cs - by * sn), c1y = Ay - (bx * sn + by * cs);
    e.w = w; e.h = h; e.x = Math.round(c1x - w / 2); e.y = Math.round(c1y - h / 2);
    if (!ev.metaKey && !ev.ctrlKey) snapEdges(s, e, hx, hy); else guides([]);
    if (e.type === 'asset') renderCanvas(); else { const n = canvas.querySelector(`.el[data-id="${CSS.escape(e.id)}"]`); if (n){ n.style.left = e.x + 'px'; n.style.top = e.y + 'px'; n.style.width = e.w + 'px'; n.style.height = e.h + 'px'; } }
    return;
  }
  if (ev.shiftKey){ if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
  if (!ev.metaKey && !ev.ctrlKey) [dx, dy] = snapMove(s, drag.group, dx, dy); else guides([]);
  drag.group.forEach(g => { g.e.x = snap4(g.x + dx); g.e.y = snap4(g.y + dy); const n = canvas.querySelector(`.el[data-id="${CSS.escape(g.e.id)}"]`); if (n){ n.style.left = g.e.x + 'px'; n.style.top = g.e.y + 'px'; } });
});
canvas.addEventListener('pointerup', () => {
  if (tsel){ tsel = null; return; }
  guides([]);
  if (pan){ pan = null; return; }
  if (marq){
    const m = marq; marq = null; const x0 = Math.min(m.x0, m.x1), x1 = Math.max(m.x0, m.x1), y0 = Math.min(m.y0, m.y1), y1 = Math.max(m.y0, m.y1);
    if (x1 - x0 > 6 || y1 - y0 > 6){ const s = cur(); const hit = new Set([...multi, ...(selId ? [selId] : [])]);
      s.els.forEach(e => { if (!isBg(e) && !e.lock && !e.hidden && e.x < x1 && e.x + e.w > x0 && e.y < y1 && e.y + e.h > y0) groupIds(s, e.id).forEach(i => hit.add(i)); }); selectIds([...hit]); }
    renderCanvas(); renderPanel(); placeAI(); return;
  }
  if (!drag){ pendPE = pendTXT = null; return; } const moved = drag.moved; drag = null; dragging = false; setTimeout(applyDeferred, 0);
  if (moved){ pendPE = pendTXT = null; changed(cur(), {panel:true}); }
  else if (pendPE && pendPE.span){ const p0 = pendPE; pendPE = pendTXT = null; peAt = {x:p0.x, y:p0.y, word:p0.word}; startPE(p0.span, p0.id); return; }
  else if (pendTXT){ const t0 = pendTXT; pendPE = pendTXT = null; startEdit(t0.id, t0.x, t0.y); return; }
  pendPE = pendTXT = null;
  placeAI();
});
function setPE(e, spec, text){
  const [k, rs, cs] = spec.split('|'); const r = +rs, c = +cs; const a = ASSETS[e.asset]; if (!a) return false;
  e.p = Object.assign({}, a.d, e.p || {}); const before = String(e.p[k] ?? '');
  const t0 = String(text).replace(/\u00a0/g, ' ').replace(/[\n\r]+/g, ' '); const t = (k === 'code' || k === 'log') ? t0.replace(/\s+$/, '') : t0.trim();
  const prop = a.props.find(x => x[0] === k) || []; let v;
  if (r < 0){ v = prop[2] === 'number' ? (+t.replace(/[^0-9.\-]/g, '') || 0) : t; }
  else { const L = (k === 'code' || k === 'log') ? rlines(before) : lines(before); while (L.length <= r) L.push(''); const safe = t.replace(/\|/g, '/');
    if (c < 0) L[r] = safe; else { const cl = cells(L[r]); while (cl.length <= c) cl.push(''); const m = /^([●○■□])\s*/.exec(cl[c] || ''); cl[c] = (m ? m[1] : '') + safe; L[r] = cl.join('|'); }
    v = L.join('\n'); }
  if (v === before) return false; e.p[k] = v; return true;
}
let peEdit = null, peAt = null;
function startPE(span, elId){
  const s = cur(); const e = s && s.els.find(x => x.id === elId); if (!e || e.lock) return;
  snapshot('도식 글 수정'); editingText = true; peEdit = {id:elId, spec:span.dataset.pe}; selId = elId; multi.clear();
  const host = span.closest('.el'); host.classList.add('editing'); span.classList.add('on');
  span.contentEditable = 'true';
  span.focus(); caretAt(span, peAt && peAt.x, peAt && peAt.y, peAt && peAt.word); peAt = null;
  span.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); finishText(); } }, {once:false});
  hideAI();
}
function caretAt(host, x, y, word){
  const sel = getSelection(); let r = null;
  if (x != null){ if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(x, y); else if (document.caretPositionFromPoint){ const cp = document.caretPositionFromPoint(x, y); if (cp){ r = document.createRange(); r.setStart(cp.offsetNode, cp.offset); } } }
  if (!r || !host.contains(r.startContainer)){ r = document.createRange(); r.selectNodeContents(host); r.collapse(false); }
  r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
  if (word && sel.modify){ sel.modify('move', 'backward', 'word'); sel.modify('extend', 'forward', 'word'); }
}
function startEdit(id, x, y, word){
  const s = cur(); const n = canvas.querySelector(`.el[data-id="${CSS.escape(id)}"]`); const e = s && s.els.find(x => x.id === id); if (!n || !e || e.lock || e.type !== 'text') return;
  snapshot('텍스트 편집'); editingText = true; multi.clear(); selId = e.id; n.classList.add('editing'); n.querySelectorAll('.handle,.rhandle').forEach(h => h.remove());
  const t = n.querySelector('.txt'); t.contentEditable = 'true'; t.focus();
  caretAt(t, x, y, word); hideAI();
}
canvas.addEventListener('dblclick', ev => {
  if (editingText) return;
  const n = ev.target.closest('.el') || document.elementFromPoint(ev.clientX, ev.clientY)?.closest('#canvas .el'); const s = cur(); if (!n || !s) return;
  const e = s.els.find(x => x.id === n.dataset.id); if (!e || e.lock) return;
  if (e.type !== 'text'){ if (e.type === 'asset' && !n.querySelector('.pe')){ tab = 'props'; setTab(); renderPanel(); const f = $('#panel [data-p], #panel .grid input'); if (f) f.focus(); } return; }
  startEdit(e.id, ev.clientX, ev.clientY, true);
});
function finishText(){ try { finishText0(); } finally { setTimeout(applyDeferred, 0); } }
function finishText0(){
  if (peEdit){ const pe0 = peEdit; peEdit = null; editingText = false; aiRange = null; const s = cur(); const e = s && s.els.find(x => x.id === pe0.id); const sp = canvas.querySelector('.pe.on');
    if (e && sp && setPE(e, pe0.spec, sp.innerText)){ changed(s, {panel:true}); } else { undo.pop(); renderCanvas(); }
    placeAI(); renderStatus(); return; }
  const n = canvas.querySelector('.el.editing'); editingText = false; aiRange = null; if (!n) return;
  const s = cur(); const e = s.els.find(x => x.id === n.dataset.id);
  const t = n.querySelector('.txt'); const html = clean(t.innerHTML);
  if (e && html !== e.html){ e.html = html; changed(s); } else { undo.pop(); renderCanvas(); }
  placeAI(); renderStatus();
}
canvas.addEventListener('focusout', ev => { if (ev.target.classList && (ev.target.classList.contains('txt') || ev.target.classList.contains('pe')) && editingText) setTimeout(() => { const a = document.activeElement; if (!canvas.contains(a) && !(a && a.closest && a.closest('#aibar'))) finishText(); }, 0); });
canvas.addEventListener('contextmenu', ev => {
  ev.preventDefault(); if (editingText) return;
  const s = cur(); const n = ev.target.closest('.el'); const e = n && s && s.els.find(x => x.id === n.dataset.id);
  if (e && !(selId === e.id || multi.has(e.id))){ selectIds(groupIds(s, e.id)); renderCanvas(); renderPanel(); }
  openCtx(ev.clientX, ev.clientY);
});

/* zoom and pan: pinch (ctrl+wheel) zooms at the cursor, wheel pans when zoomed, space+drag pans */
let ZM = 1, PX = 0, PY = 0;
function applyView(){ fitCanvas(); }
$('#viewport').addEventListener('wheel', ev => {
  if (!$('#present').hidden) return;
  if (ev.ctrlKey || ev.metaKey){
    ev.preventDefault(); const vp = $('#viewport').getBoundingClientRect(); const old = K;
    ZM = Math.min(4, Math.max(0.5, ZM * Math.exp(-ev.deltaY * 0.01)));
    const cw = $('#canvasWrap').getBoundingClientRect(); const fx = (ev.clientX - cw.left) / old, fy = (ev.clientY - cw.top) / old;
    fitCanvas(); const nw = $('#canvasWrap').getBoundingClientRect(); PX += ev.clientX - (nw.left + fx * K); PY += ev.clientY - (nw.top + fy * K); fitCanvas();
  } else if (ZM > 1.001){ ev.preventDefault(); PX -= ev.deltaX; PY -= ev.deltaY; fitCanvas(); }
}, {passive:false});
function zoomTo(z){ ZM = z; if (z === 1){ PX = 0; PY = 0; } fitCanvas(); }
/* ============ AI: select-to-edit and slide generation (viewer's own Claude via `sample`) ============ */
let sample = null, aiRange = null, aiCtl = null;
const STYLE = `문체 기준 (한국어 경영전략 발표 자료, 청중은 MBA 학생과 교수):
- 한국어 원어민 경영전략 전문가가 처음부터 한국어로 쓴 문장으로 작성한다. 영어 직역투, 추상명사의 과도한 결합, 광고 카피, 비유(해자, 무기, 잠그다, 포획 등)를 쓰지 않는다.
- 네트워크 효과, 전환 비용, 진입장벽, 설치 기반, 멀티호밍, 보완재, 가치 창출과 가치 획득 같은 경영학 용어를 정확히 쓰되, 수사 대신 경제적·전략적 인과관계를 설명한다.
- 슬라이드 제목은 20자 안팎의 짧고 단단한 명사구로 쓴다(예: NVIDIA CUDA에서 찾은 딥러닝 프로세스, 옮기기 어려운 것이 경쟁력). 설명 문장은 제목에 넣지 않고 본문과 시사점 상자에 둔다.
- 도표 레이블과 캡션은 명사형으로 짧게, 발표자 노트는 소리 내어 읽기 자연스러운 합니다체로 쓴다.
- 사실과 해석을 구분한다. 해석은 "~로 해석할 수 있다" 또는 "(해석)"으로 표시한다.
- 세 개씩 묶는 습관적 나열, "단순히 ~가 아니라" 구문, 과한 강조어를 쓰지 않는다.
- 아래 사실 자료에 없는 숫자는 만들지 않는다. 필요한 수치가 없으면 "[수치 확인 필요]"라고 쓴다.
- 회사명은 NVIDIA, 허깅페이스로 표기한다.
- 소설체나 극적인 묘사(위장, 승부, 붕괴의 서막 등)를 쓰지 않는다. 사실과 논리를 평이하게 쓴다.`;
function catalog(){
  return Object.entries(ASSETS).filter(([k]) => k !== 'paintgun').map(([k, a]) => `- ${k} (${a.name}, 기본 크기 ${a.nw}×${a.nh}${a.fluid ? ', 크기에 맞춰 늘어남' : ', 비율 유지'}): p = ${JSON.stringify(a.d).slice(0, 420)}`).join('\n');
}
const CANVAS = `캔버스 규칙: 1600×900 좌표. 제목은 별도로 처리하므로 만들지 않는다(편집 요청에서 제목 요소를 고치는 것은 가능). 본문 영역은 x 96~1504, y 196~820. 좌표와 크기는 4의 배수. 요소끼리 겹치지 않게 배치한다.
요소 형식:
- {"type":"text","x","y","w","h","html","size","color":"t1|t2|t3|g","weight":400|500|600,"align":"left|center|right","lh"} (html에는 <br>, <b>, <small>, <span class="g">만 허용)
- {"type":"asset","x","y","w","h","asset":"에셋 키","p":{속성}}
- {"type":"rect","x","y","w","h","fill":"g|card|raised|t3"}
- {"type":"img","x","y","w","h","img":"${Object.keys(IMG).join('|')}","fit":"cover|contain"}
- 공통 선택 항목 "anim": "none|fade|step"
에셋 목록 (p의 문자열에서 | 는 칸 구분, \\n 은 줄 구분, ■는 NVIDIA가 만든 것, □는 외부가 만든 것):
${catalog()}`;
function vEl(o){
  if (!o || typeof o !== 'object') return null;
  const c = (v, a, b, d) => { const n = +v; return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
  const g4 = v => Math.round(v / 4) * 4;
  const b = {x:g4(c(o.x, -200, 1600, 96)), y:g4(c(o.y, -200, 900, 200)), w:g4(c(o.w, 16, 1600, 600)), h:g4(c(o.h, 8, 900, 200)), anim:['none', 'fade', 'step'].includes(o.anim) ? o.anim : 'none'};
  if (o.type === 'text') return {...b, type:'text', html:clean(String(o.html ?? o.text ?? '')), size:c(o.size, 10, 200, 28), color:SW.includes(o.color) ? o.color : 't1', weight:[400, 500, 600].includes(+o.weight) ? +o.weight : 400, align:['left', 'center', 'right'].includes(o.align) ? o.align : 'left', lh:c(o.lh, 0.9, 2.2, 1.3), mono:false};
  if (o.type === 'asset' && ASSETS[o.asset]){ const a = ASSETS[o.asset]; const p = {};
    a.props.forEach(([k, , ty]) => { if (o.p && k in o.p) p[k] = ty === 'number' ? +o.p[k] : ty === 'bool' ? !!o.p[k] : String(o.p[k]); });
    return {...b, type:'asset', asset:o.asset, p:Object.assign({}, a.d, p)}; }
  if (o.type === 'rect') return {...b, type:'rect', fill:FILLS.includes(o.fill) ? o.fill : 'g', radius:c(o.radius, 0, 40, 0)};
  if (o.type === 'img' && IMG[o.img]) return {...b, type:'img', img:o.img, fit:o.fit === 'contain' ? 'contain' : 'cover', radius:c(o.radius, 0, 40, 12), op:c(o.op, 0, 1, 1)};
  return null;
}
const slim = e => { const o = {...e}; if (o.type === 'text') o.html = clean(o.html); return o; };
function outline(){ return list().map((s, i) => `${i + 1}. ${plainTitle(s)}`).join('\n'); }
function plainTitle(s){ const t = s.els.find(e => e.type === 'text' && e.y < 180 && e.size >= 32) || s.els.find(e => e.type === 'text'); return t ? t.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '(제목 없음)'; }

const QUICK = {
  title:'선택한 문장을 20자 안팎의 짧고 단단한 제목으로 바꿔 주세요. 설명은 빼고 핵심만 남깁니다.',
  polish:'선택한 내용의 한국어 표현을 경영전략 발표 자료 수준으로 다듬어 주세요. 뜻과 사실은 유지합니다.',
  short:'뜻은 유지하면서 더 간결하게 줄여 주세요.',
  visual:'선택한 텍스트 내용을 가장 알맞은 에셋(도식)으로 바꿔 같은 영역에 배치해 주세요.',
  evidence:'사실 자료에서 이 주장을 뒷받침하는 근거를 찾아 짧은 근거 요소(시사점 상자나 수치 카드)를 추가해 주세요. 자료에 없으면 추가하지 마세요.',
};
function setBusy(on){ $('#aibar').classList.toggle('busy', on); $('#aiGo').hidden = on; $('#aiStop').hidden = !on; $('#aiq').disabled = on; document.querySelectorAll('#aibar .chip').forEach(b => b.disabled = on); }
async function runAI(instr){
  if (!sample || !instr) return;
  if (aiRange) return runText(instr);
  const s = cur(); const sel = selected(); if (!s || !sel.length) return;
  const others = s.els.filter(e => !sel.includes(e)).map(e => ({id:e.id, type:e.type, x:e.x, y:e.y, w:e.w, h:e.h, ...(e.type === 'text' ? {text:e.html.replace(/<[^>]+>/g, ' ').slice(0, 80)} : e.type === 'asset' ? {asset:e.asset} : {})}));
  const input = `${STYLE}\n\n${FACTS}\n\n${CANVAS}\n\n덱 흐름:\n${outline()}\n\n현재 장 제목: ${plainTitle(s)}\n선택하지 않은 요소(참고용, 건드리지 말 것): ${JSON.stringify(others)}\n\n선택한 요소:\n${JSON.stringify(sel.map(slim))}\n\n요청: ${instr}\n\nJSON 객체 하나만 출력: {"replace":[선택한 요소를 고친 전체 객체, 같은 id 유지], "add":[새로 추가할 요소, id 없이], "remove":[지울 요소 id], "summary":"바꾼 내용 20자 이내"}`;
  setBusy(true); aiCtl = new AbortController();
  try {
    const out = await sample.json(input, {signal:aiCtl.signal, modelTier:'default'});
    snapshot(); const ids = new Set(sel.map(e => e.id)); let n = 0; const keep = [];
    (Array.isArray(out && out.replace) ? out.replace : []).forEach(r => { if (!r || !ids.has(r.id)) return; const v = vEl(r); const i = s.els.findIndex(e => e.id === r.id); if (v && i >= 0){ s.els[i] = {...v, id:r.id}; keep.push(r.id); n++; } });
    (Array.isArray(out && out.remove) ? out.remove : []).forEach(id => { if (ids.has(id)){ s.els = s.els.filter(e => e.id !== id); n++; } });
    (Array.isArray(out && out.add) ? out.add : []).slice(0, 8).forEach(a => { const v = vEl(a); if (v){ v.id = nid('e'); s.els.push(v); keep.push(v.id); n++; } });
    if (!n){ undo.pop(); toast('바꿀 내용이 없었습니다'); return; }
    clearSel(); keep.forEach(id => multi.add(id)); selId = keep[keep.length - 1] || null; if (multi.size === 1) multi.clear();
    changed(s, {panel:true}); toast(String((out && out.summary) || '적용했습니다').slice(0, 40), true); $('#aiq').value = '';
  } catch (err){ aiFail(err); } finally { setBusy(false); aiCtl = null; placeAI(); }
}
async function runText(instr){
  const r = aiRange; const n = canvas.querySelector('.el.editing'); if (!r || !n) return;
  const picked = r.toString(); const whole = n.querySelector('.txt').textContent;
  const input = `${STYLE}\n\n${FACTS}\n\n문장 전체: ${whole}\n선택한 부분: ${picked}\n\n요청: ${instr}\n\n선택한 부분만 바꾼 결과를 JSON으로 출력: {"text":"바꾼 문장"}`;
  setBusy(true); aiCtl = new AbortController();
  try {
    const out = await sample.json(input, {signal:aiCtl.signal, modelTier:'quick'});
    const t = String((out && out.text) || '').trim(); if (!t){ toast('바꿀 내용이 없었습니다'); return; }
    r.deleteContents(); r.insertNode(document.createTextNode(t)); aiRange = null; finishText(); toast('문장을 바꿨습니다', true); $('#aiq').value = '';
  } catch (err){ aiFail(err); } finally { setBusy(false); aiCtl = null; }
}
function aiFail(err){
  const code = err && err.code;
  if (code === 'not_granted'){ sample = null; document.body.classList.remove('ai-on'); hideAI(); toast('Claude 사용이 허용되지 않아 AI 기능을 껐습니다'); return; }
  if (code === 'aborted' || (err && err.name === 'AbortError')) return;
  toast(code === 'rate_limited' ? '요청이 많습니다. 잠시 뒤에 다시 시도해 주세요' : '요청을 처리하지 못했습니다. 다시 시도해 주세요');
}
function hideAI(){ const b = $('#aibar'); if (b && !b.classList.contains('busy') && !review) b.hidden = true; const d = $('#aiDot'); if (d) d.hidden = true; }
let aiOpen = false;
function placeAI(force){
  const bar = $('#aibar'); const dot = $('#aiDot'); if (!sample || !bar) return; if (force) aiOpen = true;
  const vp = $('#viewport').getBoundingClientRect(); const cw = $('#canvasWrap').getBoundingClientRect(); let box = null;
  const sel = selected();
  if (aiRange){ const rr = aiRange.getBoundingClientRect(); box = {l:rr.left - vp.left, r:rr.right - vp.left, t:rr.top - vp.top, b:rr.bottom - vp.top}; }
  else {
    if (!(review || force || sel.length) || (editingText && !review && !aiRange)){ if (!bar.classList.contains('busy')) bar.hidden = true; dot.hidden = true; aiOpen = false; return; }
    if (!sel.length && aiScope === 'sel') aiScope = 'slide';
    if (sel.length && !review && !force && aiScope !== 'sel') aiScope = 'sel';
    if (sel.length && aiScope === 'sel'){ const x0 = Math.min(...sel.map(e => e.x)), y0 = Math.min(...sel.map(e => e.y)), y1 = Math.max(...sel.map(e => e.y + e.h)); box = {l:cw.left - vp.left + x0 * K, r:cw.left - vp.left + Math.max(...sel.map(e => e.x + e.w)) * K, t:cw.top - vp.top + y0 * K, b:cw.top - vp.top + y1 * K}; }
    else box = {l:cw.left - vp.left + 24, t:cw.top - vp.top + 16, b:cw.top - vp.top + 16};
  }
  if (!(aiOpen || review || bar.classList.contains('busy'))){
    bar.hidden = true; dot.hidden = false; const rx = box.r != null ? box.r : box.l;
    dot.style.left = Math.max(8, Math.min(vp.width - 40, rx - 16)) + 'px'; dot.style.top = (box.t - 40 >= 8 ? box.t - 40 : box.b + 8) + 'px'; return; }
  dot.hidden = true; bar.hidden = false; const w = bar.offsetWidth, h = bar.offsetHeight;
  const left = Math.max(8, Math.min(vp.width - w - 8, box.l)); let top = box.b + 8; if (top + h > vp.height - 8) top = Math.max(8, box.t - h - 8);
  bar.style.left = left + 'px'; bar.style.top = top + 'px';
  document.querySelectorAll('#aiScope button').forEach(x => { x.setAttribute('aria-pressed', String(x.dataset.scope === aiScope)); x.disabled = !!aiRange || (x.dataset.scope === 'sel' && !sel.length); });
  $('#aiCount').textContent = aiRange ? '선택한 문장' : aiScope === 'deck' ? `덱 전체 ${list().length}장` : aiScope === 'slide' ? '이 장표 전체' : `${sel.length}개 요소`;
}
$('#aiDot').addEventListener('mousedown', ev => ev.preventDefault());
$('#aiDot').addEventListener('click', () => { placeAI(true); setTimeout(() => { if (!aiRange) $('#aiq').focus(); }, 0); });
document.addEventListener('selectionchange', () => {
  if (!editingText || !sample) return; const sl = getSelection();
  if (sl.rangeCount && !sl.isCollapsed){ const r = sl.getRangeAt(0); const host = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
    if (host && host.closest('.txt[contenteditable=true]')){ aiRange = r.cloneRange(); placeAI(); return; } }
  if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#aibar')) return;
  aiRange = null; const b = $('#aibar'); if (b && !b.classList.contains('busy') && !review){ b.hidden = true; aiOpen = false; } const d = $('#aiDot'); if (d) d.hidden = true;
});
$('#aibar').addEventListener('mousedown', ev => { if (ev.target.closest('.chip')) ev.preventDefault(); });
$('#aibar').addEventListener('click', ev => { const c = ev.target.closest('.chip'); if (c) runAI(QUICK[c.dataset.q]); });
$('#aiform').addEventListener('submit', ev => { ev.preventDefault(); const q = $('#aiq').value.trim(); if (q) runAI(q); });
$('#aiStop').addEventListener('click', () => { if (aiCtl) aiCtl.abort(); });

/* AI slide generation */
async function genSlide(desc, sec){
  if (!sample || !desc) return;
  const input = `${STYLE}\n\n${FACTS}\n\n${CANVAS}\n\n덱 흐름:\n${outline()}\n\n섹션: ${sec >= 0 ? SECTIONS[sec] : '요약'}\n만들 장표: ${desc}\n\nNVIDIA와 CUDA의 맥락에서 이 장표 한 장을 설계하세요. 에셋을 적극 활용하고 텍스트 요소는 최소로 둡니다. JSON 객체 하나만 출력: {"title":"20자 안팎의 짧은 제목","src":"출처 각주 (사실 자료의 출처 사용)","notes":"발표 스크립트, 합니다체로 말하는 문장 2~5개","els":[제목을 제외한 요소들]}`;
  const btn = $('#genGo'); btn.disabled = true; $('#genPop').classList.add('busy'); aiCtl = new AbortController();
  try {
    const out = await sample.json(input, {signal:aiCtl.signal, modelTier:'default'});
    const els = (Array.isArray(out && out.els) ? out.els : []).slice(0, 12).map(vEl).filter(Boolean);
    const h = H(String((out && out.title) || '새 장표').replace(/<[^>]+>/g, '').slice(0, 120)); h.id = nid('e'); els.forEach(e => e.id = nid('e'));
    const L = list(); const i = L.findIndex(x => x.id === curId);
    const s = {id:nid('n'), kind:'content', sec, src:String((out && out.src) || '').slice(0, 300), d:deck, o20:50, o5:50, els:[h, ...els], notes:String((out && out.notes) || '')};
    setOrd(s, between(i)); slides.push(s); curId = s.id; clearSel(); hideAI(); changed(s); renderAll();
    $('#genPop').hidden = true; $('#genDesc').value = ''; toast('장표를 만들었습니다', true);
  } catch (err){ aiFail(err); } finally { btn.disabled = false; $('#genPop').classList.remove('busy'); aiCtl = null; }
}
$('#bGen').addEventListener('click', () => { const p = $('#genPop'); p.hidden = !p.hidden; if (!p.hidden){ const s = cur(); $('#genSec').value = String(s && s.kind === 'content' && s.sec != null ? s.sec : 0); $('#genDesc').focus(); } });
$('#genForm').addEventListener('submit', ev => { ev.preventDefault(); genSlide($('#genDesc').value.trim(), +$('#genSec').value); });
$('#genStop').addEventListener('click', () => { if (aiCtl) aiCtl.abort(); });
document.querySelectorAll('#genPop .ex').forEach(b => b.addEventListener('click', () => { $('#genDesc').value = b.textContent; $('#genDesc').focus(); }));

async function initAI(){
  try { sample = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (_) { sample = null; }
  document.body.classList.toggle('ai-on', !!sample);
}

/* toast */
let toastT = null;
function toast(msg, withUndo){
  const t = $('#toast'); t.querySelector('span').textContent = msg; t.querySelector('button').hidden = !withUndo; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 6000);
}
$('#toast button').addEventListener('click', () => { doUndo(); $('#toast').hidden = true; });

/* ============ LAYOUTS: new slides from NVIDIA-context templates ============ */
const LAYOUTS = [
  ['핵심 수치', 5, () => [H('허깅페이스 인수 결정'), A('kpis', 96, 224, 1408, 220), A('sticker', 96, 520, 1408, 96, {lb:'시사점', t:'전환 비용에 기대지 않고 외부 개발자의 축적을 확보하려는 움직임으로 해석할 수 있다'})]],
  ['2×2 매트릭스', 5, () => [H('CUDA와 허깅페이스'), A('matrix', 96, 196, 900, 582), A('kv', 1040, 236, 464, 420, {t:'판단 기준', rows:'가로축|외부 개발자 결과물의 축적 정도\n세로축|다른 플랫폼으로 옮기는 비용'})]],
  ['계층 구조', 1, () => [H('CUDA 플랫폼의 구조'), A('stack', 210, 200, 1180, 600)]],
  ['네트워크 효과', 1, () => [H('개발자와 GPU가 서로를 키운다'), A('flywheel', 96, 196, 760, 600), A('kv', 944, 236, 560, 420)]],
  ['단계 타임라인', 3, () => [H('CUDA의 진화 단계'), A('phases', 96, 216, 1408, 400), A('kpis', 96, 640, 1408, 168, {rows:'1,100만 명|CUDA 개발자 수|NVIDIA 집계|g\n1,000개+|CUDA-X 라이브러리|NVIDIA 제공'})]],
  ['찬반 논거', 4, () => [H('두 가지 시각'), A('debate', 96, 216, 1408, 520)]],
  ['비교표', 5, () => [H('CUDA와 허깅페이스 비교'), A('cmptable', 96, 232, 1408, 330), A('sticker', 96, 640, 1408, 96)]],
  ['네 가지 요인', 2, () => [H('NVIDIA CUDA에서 찾은 딥러닝 프로세스'), A('cards', 96, 216, 1408, 440), A('sticker', 96, 704, 1408, 96, {fill:true})]],
  ['이미지 + 메시지', 0, () => [H('그래픽 칩에서 연산 플랫폼으로'), I('keynote', 96, 208, 840, 472), T('2006년 CUDA 발표 이후 NVIDIA의 사업은 게임용 그래픽카드에서 데이터센터용 연산 인프라로 확장되었다', 984, 224, 520, 300, {size:28, lh:1.5, color:'t2'}), A('sticker', 984, 584, 520, 96, {lb:'핵심', t:'하드웨어 판매와 소프트웨어 생태계가 함께 성장했다'})]],
  ['Take home', -1, () => [H('Take home'), A('execsum', 96, 200, 1408, 620, {rows:EXEC})]],
];
function addLayout(i){
  const [, sec, make] = LAYOUTS[i]; const els = make(); els.forEach(e => e.id = nid('e'));
  const L = list(); const k = L.findIndex(x => x.id === curId);
  const s = {id:nid('n'), kind:'content', sec, src:'', d:deck, o20:50, o5:50, els, notes:''};
  setOrd(s, between(k)); slides.push(s); created(s, '레이아웃 추가'); curId = s.id; clearSel(); hideAI(); changed(s); renderAll();
}
/* ---------- panel interaction ---------- */
$('#panel').addEventListener('input', ev => {
  const s = cur(); if (!s) return; const t = ev.target; const e = curEl();
  if (t.dataset.p && e){ snapshotOnce(); e.p = Object.assign({}, ASSETS[e.asset].d, e.p || {}); e.p[t.dataset.p] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? +t.value : t.value; changed(s); return; }
  if (t.dataset.ks && e){ snapshotOnce(); e[t.dataset.ks] = t.value; changed(s); return; }
  if (t.dataset.kb && e){ snapshotOnce(); e[t.dataset.kb] = t.checked; changed(s); return; }
  if (t.dataset.k && e){ snapshotOnce(); const v = t.type === 'number' || t.type === 'range' || t.tagName === 'SELECT' ? +t.value : t.value; if (!Number.isNaN(v)) e[t.dataset.k] = v; changed(s); return; }
  if (t.dataset.sk && !e){ snapshotOnce(); if (t.dataset.sk === 'src') s.src = t.value; else { if (t.value === ''){ s.kind = s.kind === 'content' ? 'plain' : s.kind; } else { s.kind = 'content'; s.sec = +t.value; } } changed(s); return; }
  if (t.dataset.k2 && e){ snapshotOnce(); e.img = t.value; changed(s); return; }
  if (t.dataset.k && !e){ snapshotOnce(); s[t.dataset.k] = t.value === '' ? undefined : +t.value; changed(s, {noCanvas:true}); return; }
  if (t.id === 'd20' || t.id === 'd5'){ snapshotOnce(); const set = new Set(String(s.d).split(' ')); const v = t.id === 'd20' ? '20' : '5'; t.checked ? set.add(v) : set.delete(v);
    if (v === '5' && t.checked && s.o5 == null) s.o5 = (list().length ? Math.max(...slides.filter(x => inDeck(x, '5') && x.kind === 'content').map(x => x.o5 || 0)) : 0) + 1;
    if (v === '20' && t.checked && s.o20 == null) s.o20 = 50;
    s.d = [...set].filter(Boolean).join(' ') || deck; changed(s); renderAll(); }
});
let snapT = 0; function snapshotOnce(label){ const now = Date.now(); if (now - snapT > 1200) snapshot(label || '속성 변경'); snapT = now; }
$('#panel').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return; const s = cur(); const e = curEl();
  if (b.dataset.asset){ addAsset(b.dataset.asset); return; }
  if (b.dataset.img){ addImage(b.dataset.img); return; }
  if (b.dataset.layout){ addLayout(+b.dataset.layout); return; }
  if (b.id === 'bAskSel' || b.id === 'bAskAll'){ if (b.id === 'bAskAll'){ const ss = cur(); clearSel(); ss.els.filter(x => !isBg(x)).forEach(x => multi.add(x.id)); selId = [...multi].pop() || null; if (multi.size === 1) multi.clear(); renderCanvas(); renderPanel(); } placeAI(); setTimeout(() => $('#aiq').focus(), 0); return; }
  if (b.id === 'bDelSel'){ snapshot(); const ids = new Set(selected().map(x => x.id)); s.els = s.els.filter(x => !ids.has(x.id)); clearSel(); hideAI(); changed(s, {panel:true}); return; }
  if (b.dataset.al){ alignSel(b.dataset.al); return; }
  if (b.dataset.add === 'text'){ addText(); return; }
  if (['rect', 'ellipse', 'line', 'arrow'].includes(b.dataset.add)){ snapshot('도형 추가'); const k = b.dataset.add; const r = k === 'line' || k === 'arrow' ? {...R(600, 440, 400, 24, 't2'), shape:k, stroke:'t2', sw:4} : {...R(k === 'ellipse' ? 700 : 704, 380, k === 'ellipse' ? 200 : 192, k === 'ellipse' ? 200 : 96), shape:k};
    r.id = nid('e'); s.els.push(r); selectIds([r.id]); changed(s, {panel:true}); return; }
  if (b.dataset.add === 'upload' || b.id === 'bReplaceImg'){ pickImage(b.id === 'bReplaceImg' ? e : null); return; }
  if (!s) return;
  if (b.id === 'bTakeBase'){ snapshot('원본 최신본 적용'); resetSlide(s.id); toast('원본 최신본을 적용했습니다'); return; }
  if (b.id === 'bKeepMine'){ stale.delete(s.id); queueSave(s); renderThumb(s.id); renderPanel(); toast('수정본을 유지합니다'); return; }
  if (b.id === 'bReset'){ if (b.dataset.armed){ snapshot(); resetSlide(s.id); } else { b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 되돌립니다'; } return; }
  if (b.id === 'bDelSlide'){ if (b.dataset.armed){ snapshot(); s.deleted = true; changed(s); curId = null; renderAll(); } else { b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 삭제됩니다'; } return; }
  if (!e) return;
  snapshot();
  if (b.dataset.color){ e.color = b.dataset.color; }
  else if (b.dataset.fill){ e.fill = b.dataset.fill; }
  else if (b.dataset.align){ e.align = b.dataset.align; }
  else if (b.dataset.fit){ e.fit = b.dataset.fit; }
  else if (b.dataset.shape){ e.shape = b.dataset.shape; if ((e.shape === 'line' || e.shape === 'arrow') && !e.stroke) e.stroke = 't2'; }
  else if (b.dataset.stroke != null){ if (b.dataset.stroke) e.stroke = b.dataset.stroke; else delete e.stroke; }
  else if (b.dataset.va){ e.va = b.dataset.va; }
  else if (b.dataset.fmt){ undo.pop(); fmtBox(e, b.dataset.fmt); return; }
  else if (b.dataset.anim){ e.anim = b.dataset.anim; }
  else if (b.id === 'bFront'){ s.els = s.els.filter(x => x !== e).concat(e); }
  else if (b.id === 'bBack'){ s.els = [e].concat(s.els.filter(x => x !== e)); }
  else if (b.id === 'bDelEl'){ s.els = s.els.filter(x => x !== e); selId = null; }
  else if (b.id === 'bRatio'){ const a = ASSETS[e.asset]; e.h = Math.round(e.w * a.nh / a.nw / 4) * 4; }
  else if (b.id === 'bHi'){ undo.pop(); highlight(); return; }
  else { undo.pop(); return; }
  changed(s, {panel:true});
});
function highlight(){
  const sel = getSelection(); if (!sel.rangeCount) return; const r = sel.getRangeAt(0);
  const t = r.commonAncestorContainer.parentElement && r.commonAncestorContainer.parentElement.closest('.txt[contenteditable=true]');
  if (!t || r.collapsed) return; const sp = document.createElement('span'); sp.className = 'g';
  try { sp.appendChild(r.extractContents()); r.insertNode(sp); } catch (_) {}
}
$('#panel').addEventListener('mousedown', ev => { if (ev.target.closest('#bHi, [data-fmt]')) ev.preventDefault(); });
/* text formatting: applies to the selection while editing, otherwise to the whole text box */
function fmtBox(e, kind){
  const s = cur(); if (!s || !e || e.type !== 'text') return;
  if (editingText){ if (kind === 'list') document.execCommand('insertUnorderedList'); else if (kind === 'olist') document.execCommand('insertOrderedList'); else document.execCommand(kind); return; }
  snapshot('서식');
  if (kind === 'list' || kind === 'olist'){ const tag = kind === 'list' ? 'ul' : 'ol'; const m = new RegExp(`^<${tag}>(.*)</${tag}>$`, 's').exec(e.html);
    if (m) e.html = m[1].replace(/<\/li><li>/g, '<br>').replace(/<\/?li>/g, '');
    else e.html = `<${tag}>` + e.html.replace(/^<(ul|ol)>|<\/(ul|ol)>$/g, '').replace(/<\/?li>/g, '').split('<br>').map(x => `<li>${x}</li>`).join('') + `</${tag}>`; }
  else { const tag = kind === 'bold' ? 'b' : kind === 'italic' ? 'i' : 'u'; const re = new RegExp(`^<${tag}>(.*)</${tag}>$`, 's'); const m = re.exec(e.html); e.html = m ? m[1] : `<${tag}>${e.html}</${tag}>`; }
  e.html = clean(e.html); changed(s, {panel:true});
}
/* image upload: stored as an artifact asset when available, else as a compressed data URL */
let assetsApi;
async function pickImage(target){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/gif';
  inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f) return; busy('이미지 올리는 중');
    try { const src = await storeImage(f); const s = cur(); if (!s) return;
      if (target){ snapshot('이미지 교체'); target.src = src; target.img = ''; changed(s, {panel:true}); }
      else { const dim = await new Promise(r => { const im = new Image(); im.onload = () => r([im.naturalWidth, im.naturalHeight]); im.onerror = () => r([1600, 900]); im.src = src; });
        const k = Math.min(960 / dim[0], 600 / dim[1], 1); const w = Math.round(dim[0] * k / 4) * 4, h = Math.round(dim[1] * k / 4) * 4;
        snapshot('이미지 추가'); const e = {id:nid('e'), type:'img', img:'', src, x:Math.round((1600 - w) / 8) * 4, y:Math.round((900 - h) / 8) * 4, w, h, fit:'cover', radius:12, op:1, anim:'none'}; s.els.push(e); selectIds([e.id]); tab = 'props'; setTab(); changed(s, {panel:true}); }
    } catch (_) { toast('이미지를 올리지 못했습니다'); } finally { busy(); } };
  inp.click();
}
async function storeImage(f){
  if (assetsApi === undefined){ try { assetsApi = window.claude && window.claude.use ? await window.claude.use('assets') : null; } catch (_) { assetsApi = null; } }
  const blob = await shrink(f);
  if (assetsApi){ try { const r = await assetsApi.upload(blob); if (r && r.url && SAFE_SRC(r.url)) return r.url; if (r && r.id) return '/_blob/' + r.id; } catch (_) {} }
  if (blob.size > 900000) throw new Error('too big');
  return await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
}
async function shrink(f){
  if (f.type === 'image/gif') return f;
  const bmp = await createImageBitmap(f); const k = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(b => r(b || f), 'image/webp', 0.84));
}

async function resetSlide(id){
  const k = deckId + '|' + id; store.pending.delete(k); revertToBase(id);
  if (store.db){ try { await store.db.doc(slidesPath() + '/' + id).delete(); } catch (_) { toast('원본으로 되돌리지 못했습니다'); } }
  else { try { const all = JSON.parse(localStorage.getItem(lsKey()) || '{}'); delete all[id]; localStorage.setItem(lsKey(), JSON.stringify(all)); } catch (_) {} }
  selId = null; multi.clear(); renderAll();
}
function addText(){ const s = cur(); if (!s) return; snapshot(); const t = T('텍스트', 400, 400, 800, 60, {size:40}); t.id = nid('e'); s.els.push(t); selId = t.id; tab = 'props'; setTab(); changed(s, {panel:true}); }
function addImage(k){ const s = cur(); if (!s) return; snapshot(); const e = I(k, 400, 240, 800, 450); e.id = nid('e'); s.els.push(e); selId = e.id; tab = 'props'; setTab(); changed(s, {panel:true}); }
function addAsset(k){
  const s = cur(); if (!s) return; snapshot(); const a = ASSETS[k];
  const k2 = Math.min(1, 1408 / a.nw, 640 / a.nh); const w = Math.round(a.nw * k2 / 4) * 4, h = Math.round(a.nh * k2 / 4) * 4;
  const e = A(k, Math.round((1600 - w) / 8) * 4, Math.round((168 + (732 - h) / 2) / 4) * 4, w, h); e.id = nid('e');
  s.els.push(e); selId = e.id; tab = 'props'; setTab(); changed(s, {panel:true});
}

/* ---------- slides rail ---------- */
$('#thumbs').addEventListener('click', ev => { const b = ev.target.closest('.thumb'); if (!b) return; if (editingText) finishText(); curId = b.dataset.id; clearSel(); hideAI();
  document.querySelectorAll('#thumbs .thumb').forEach(x => x.setAttribute('aria-current', String(x.dataset.id === curId))); renderCanvas(); renderPanel(); renderStatus(); });
/* align/distribute: several elements align to their joint box, one element aligns to the slide */
function alignSel(kind){
  const s = cur(); const g = selected().filter(x => !x.lock); if (!s || !g.length) return;
  snapshot('정렬'); const one = g.length === 1;
  const box = one ? {x:0, y:0, r:1600, b:900} : {x:Math.min(...g.map(e => e.x)), y:Math.min(...g.map(e => e.y)), r:Math.max(...g.map(e => e.x + e.w)), b:Math.max(...g.map(e => e.y + e.h))};
  const R4 = v => Math.round(v);
  if (kind === 'left') g.forEach(e => e.x = box.x); else if (kind === 'right') g.forEach(e => e.x = R4(box.r - e.w)); else if (kind === 'hc') g.forEach(e => e.x = R4((box.x + box.r - e.w) / 2));
  else if (kind === 'top') g.forEach(e => e.y = box.y); else if (kind === 'bottom') g.forEach(e => e.y = R4(box.b - e.h)); else if (kind === 'vm') g.forEach(e => e.y = R4((box.y + box.b - e.h) / 2));
  else if ((kind === 'dh' || kind === 'dv') && g.length > 2){ const H = kind === 'dh'; const o = g.slice().sort((p, q) => H ? p.x - q.x : p.y - q.y);
    const start = H ? o[0].x : o[0].y, end = H ? o[o.length - 1].x + o[o.length - 1].w : o[o.length - 1].y + o[o.length - 1].h; const tot = o.reduce((t, e) => t + (H ? e.w : e.h), 0); const gap = (end - start - tot) / (o.length - 1);
    let v = start; o.forEach(e => { if (H) e.x = R4(v); else e.y = R4(v); v += (H ? e.w : e.h) + gap; }); }
  changed(s, {panel:true}); placeAI();
}
const ALIGN_BTNS = `<div class="algn" role="group" aria-label="정렬">${[['left', '왼쪽', 'M4 3v18M8 7h12v4H8zM8 13h8v4H8z'], ['hc', '가로 가운데', 'M12 3v18M6 7h12v4H6zM8 13h8v4H8z'], ['right', '오른쪽', 'M20 3v18M4 7h12v4H4zM8 13h8v4H8z'], ['top', '위쪽', 'M3 4h18M7 8v12h4V8zM13 8v8h4V8z'], ['vm', '세로 가운데', 'M3 12h18M7 6v12h4V6zM13 8v8h4V8z'], ['bottom', '아래쪽', 'M3 20h18M7 4v12h4V4zM13 8v8h4V8z'], ['dh', '가로 간격 균등', 'M4 4v16M20 4v16M9 8h6v8H9z'], ['dv', '세로 간격 균등', 'M4 4h16M4 20h16M8 9h8v6H8z']].map(([k, l, d]) => `<button class="ib" type="button" data-al="${k}" title="${l}" aria-label="${l}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg></button>`).join('')}</div>`;
function between(i){ const L = list(); const a = L[i], b = L[i + 1]; const oa = a ? ord(a) : 0; const ob = b ? ord(b) : oa + 2; return (oa + ob) / 2; }
function setOrd(s, v){ if (deck === '5') s.o5 = v; else s.o20 = v; }
$('#bAdd').onclick = () => { const L = list(); const i = L.findIndex(s => s.id === curId);
  const s = {id:nid('n'), kind:'content', sec:(cur() && cur().sec) ?? 0, src:'', d:deck, o20:50, o5:50, els:[], notes:''}; const h = H('새 장표'); h.id = nid('e'); s.els.push(h); setOrd(s, between(i));
  slides.push(s); created(s, '새 장표'); curId = s.id; selId = null; changed(s); renderAll(); };
$('#bDup').onclick = () => dupSlide();
function created(s, label){ undo.push({label, items:[{id:s.id, data:null}], cur:curId}); if (undo.length > 150) undo.shift(); redo.length = 0; }
function move(dir){ const L = list(); const i = L.findIndex(s => s.id === curId); const j = i + dir; if (i < 0 || j < 0 || j >= L.length) return;
  const a = L[i], b = L[j]; snapshot('장표 이동', [a.id, b.id]); const oa = ord(a), ob = ord(b); setOrd(a, ob); setOrd(b, oa); if (oa === ob) setOrd(a, ob + dir * 0.01); changed(a); changed(b); renderAll(); }
$('#bUp').onclick = () => move(-1); $('#bDown').onclick = () => move(1);
$('#bText').onclick = addText; $('#bUndo').onclick = () => doUndo();
document.querySelectorAll('#bar .seg button').forEach(b => b.onclick = () => { deck = b.dataset.deck; clearSel(); hideAI(); curId = (list()[0] || {}).id; renderAll(); });
function setTab(){ document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab))); }
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; setTab(); renderPanel(); });

let notesT = null;
$('#notes').addEventListener('input', () => { const s = cur(); if (!s) return; s.notes = $('#notes').value; clearTimeout(notesT); notesT = setTimeout(() => { overridden.add(s.id); queueSave(s); }, 400); });

/* ============ HISTORY: one undo/redo stack shared by direct edits, commands and the agent ============ */
const undo = [], redo = [];
function snapshot(label = '편집', ids){
  const items = (ids || [curId]).filter(Boolean).map(id => { const s = slides.find(x => x.id === id); return {id, data:s ? clone(s) : null}; });
  if (!items.length) return; undo.push({label, items, cur:curId}); if (undo.length > 150) undo.shift(); redo.length = 0; renderStatus();
}
function swapItems(items){
  return items.map(it => {
    const i = slides.findIndex(x => x.id === it.id); const now = i >= 0 ? clone(slides[i]) : null;
    if (it.data){ if (i < 0) slides.push(clone(it.data)); else slides[i] = clone(it.data); }
    else if (i >= 0) slides[i].deleted = true;
    const s = slides.find(x => x.id === it.id); if (s){ overridden.add(s.id); queueSave(s); }
    return {id:it.id, data:now};
  });
}
function doUndo(){ if (editingText){ document.execCommand('undo'); return; } const u = undo.pop(); if (!u) return; redo.push({label:u.label, items:swapItems(u.items), cur:curId}); curId = u.cur; if (!list().some(s => s.id === curId)) curId = (list()[0] || {}).id; clearSel(); hideAI(); renderAll(); toast('실행 취소: ' + u.label); }
function doRedo(){ if (editingText){ document.execCommand('redo'); return; } const r = redo.pop(); if (!r) return; undo.push({label:r.label, items:swapItems(r.items), cur:curId}); curId = r.cur; if (!list().some(s => s.id === curId)) curId = (list()[0] || {}).id; clearSel(); hideAI(); renderAll(); toast('다시 실행: ' + r.label); }
function changed(s, opts = {}){
  overridden.add(s.id); queueSave(s);
  if (!opts.noCanvas && s.id === curId) renderCanvas();
  renderThumb(s.id); if (opts.panel) renderPanel(); renderStatus();
}

/* ============ COMMANDS (keyboard, palette, context menu, app menu all call these) ============ */
let clip = null;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const KEYS = k => isMac ? k.replace(/Mod\+/g, '⌘').replace(/Shift\+/g, '⇧').replace(/Alt\+/g, '⌥') : k.replace(/Mod\+/g, 'Ctrl+');
function editSel(label, fn, {keepSel = true} = {}){ const s = cur(); const g = selected(); if (!s || !g.length) return false; snapshot(label); fn(s, g); if (!keepSel) clearSel(); changed(s, {panel:true}); placeAI(); return true; }
function copySel(){ const g = selected(); if (!g.length) return null; clip = {from:curId, els:clone(g)}; return JSON.stringify({cudaStudio:1, els:clip.els}); }
function pasteEls(els, from){
  const s = cur(); if (!s || !els || !els.length) return; snapshot('붙여넣기');
  const off = from === curId ? 24 : 0; const gmap = {}; const ids = [];
  els.forEach(o => { const v = o.id && o.type ? {...o} : null; if (!v) return; const e = clone(v); e.id = nid('e'); e.x = (+e.x || 0) + off; e.y = (+e.y || 0) + off; if (e.g){ gmap[e.g] = gmap[e.g] || nid('g'); e.g = gmap[e.g]; } if (e.type === 'text') e.html = clean(e.html); s.els.push(e); ids.push(e.id); });
  if (clip && from === curId) clip.els.forEach(x => { x.x += 24; x.y += 24; });
  selectIds(ids); changed(s, {panel:true}); placeAI();
}
function dupSlide(){ const c = cur(); if (!c) return; const L = list(); const i = L.findIndex(s => s.id === curId); const s = clone(c); s.id = nid('n'); s.els.forEach(e => e.id = nid('e')); setOrd(s, between(i)); slides.push(s); created(s, '장표 복제'); curId = s.id; clearSel(); changed(s); renderAll(); }
function zorder(dir){ editSel(dir === 'front' ? '맨 앞으로' : dir === 'back' ? '맨 뒤로' : dir === 'fwd' ? '앞으로' : '뒤로', (s, g) => {
  const ids = new Set(g.map(e => e.id)); const rest = s.els.filter(e => !ids.has(e.id));
  if (dir === 'front') s.els = rest.concat(g); else if (dir === 'back'){ const bg = rest.filter(isBg); s.els = bg.concat(g, rest.filter(e => !isBg(e))); }
  else { const arr = s.els.slice(); const idx = g.map(e => arr.indexOf(e)).sort((a, b) => dir === 'fwd' ? b - a : a - b);
    idx.forEach(i => { const j = dir === 'fwd' ? i + 1 : i - 1; if (j < 0 || j >= arr.length || ids.has(arr[j].id)) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }); s.els = arr; } }); }
function fmtText(cmd){ if (editingText){ document.execCommand(cmd); return true; } const e = curEl(); if (e && e.type === 'text' && ['bold', 'italic', 'underline'].includes(cmd)){ fmtBox(e, cmd); return true; } return false; }
const CMD = {
  undo:{l:'실행 취소', k:'Mod+Z', run:doUndo},
  redo:{l:'다시 실행', k:'Mod+Shift+Z', run:doRedo},
  cut:{l:'잘라내기', k:'Mod+X', run:() => { if (copySel()) editSel('잘라내기', (s, g) => { const ids = new Set(g.map(e => e.id)); s.els = s.els.filter(e => !ids.has(e.id)); }, {keepSel:false}); }},
  copy:{l:'복사', k:'Mod+C', run:() => { const t = copySel(); if (t && navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {}); if (t) toast(`${clip.els.length}개 요소 복사`); }},
  paste:{l:'붙여넣기', k:'Mod+V', run:() => { if (clip) pasteEls(clip.els, clip.from); }},
  dup:{l:'복제', k:'Mod+D', run:() => { if (selected().length){ copySel(); pasteEls(clip.els, curId); } else dupSlide(); }},
  del:{l:'삭제', k:'Delete', run:() => editSel('삭제', (s, g) => { const ids = new Set(g.map(e => e.id)); s.els = s.els.filter(e => !ids.has(e.id)); }, {keepSel:false})},
  all:{l:'모두 선택', k:'Mod+A', run:() => { const s = cur(); if (!s) return; selectIds(s.els.filter(x => !isBg(x) && !x.lock && !x.hidden).map(x => x.id)); renderCanvas(); renderPanel(); placeAI(); }},
  group:{l:'그룹', k:'Mod+G', run:() => { if (selected().length < 2) return; const g = nid('g'); editSel('그룹', (s, els) => els.forEach(e => e.g = g)); }},
  ungroup:{l:'그룹 해제', k:'Mod+Shift+G', run:() => editSel('그룹 해제', (s, els) => els.forEach(e => delete e.g))},
  front:{l:'맨 앞으로', k:'Mod+Shift+]', run:() => zorder('front')},
  fwd:{l:'앞으로', k:'Mod+]', run:() => zorder('fwd')},
  bwd:{l:'뒤로', k:'Mod+[', run:() => zorder('bwd')},
  back:{l:'맨 뒤로', k:'Mod+Shift+[', run:() => zorder('back')},
  lock:{l:'잠금 전환', k:'Mod+Shift+L', run:() => { const on = !selected().every(e => e.lock); editSel(on ? '잠금' : '잠금 해제', (s, g) => g.forEach(e => e.lock = on)); }},
  hide:{l:'숨기기 전환', k:'Mod+Shift+H', run:() => { const on = !selected().every(e => e.hidden); editSel(on ? '숨기기' : '보이기', (s, g) => g.forEach(e => e.hidden = on)); }},
  bold:{l:'굵게', k:'Mod+B', run:() => fmtText('bold')},
  italic:{l:'기울임', k:'Mod+I', run:() => fmtText('italic')},
  underline:{l:'밑줄', k:'Mod+U', run:() => fmtText('underline')},
  save:{l:'버전 저장', k:'Mod+S', run:() => saveVersion()},
  find:{l:'찾기와 바꾸기', k:'Mod+F', run:() => openFind()},
  palette:{l:'명령 팔레트', k:'Mod+K', run:() => openPal()},
  text:{l:'텍스트 추가', k:'', run:() => addText()},
  newSlide:{l:'새 장표', k:'Mod+Shift+N', run:() => $('#bAdd').click()},
  dupSlide:{l:'장표 복제', k:'', run:dupSlide},
  zin:{l:'확대', k:'Mod+=', run:() => zoomTo(Math.min(4, ZM * 1.25))},
  zout:{l:'축소', k:'Mod+-', run:() => zoomTo(Math.max(0.5, ZM / 1.25))},
  zfit:{l:'화면에 맞추기', k:'Mod+0', run:() => zoomTo(1)},
  present:{l:'발표 시작', k:'Mod+Enter', run:() => present()},
  check:{l:'점검 보기', k:'', run:() => { tab = 'check'; setTab(); renderPanel(); }},
  history:{l:'수정 이력 보기', k:'', run:() => { tab = 'hist'; setTab(); renderPanel(); }},
  pptx:{l:'PPTX로 내보내기 (Windows 글꼴)', k:'', run:() => exportPPTX('Malgun Gothic')},
  pptxMac:{l:'PPTX로 내보내기 (Mac 글꼴)', k:'', run:() => exportPPTX('Apple SD Gothic Neo')},
  print:{l:'인쇄 / 벡터 PDF', k:'Mod+P', run:() => printDeck()},
  pdf:{l:'이미지 PDF로 내보내기', k:'', run:() => exportPDF()},
  json:{l:'프로젝트 파일로 저장', k:'Mod+Shift+S', run:() => exportJSON()},
  open:{l:'프로젝트 파일 열기', k:'Mod+O', run:() => $('#fileIn').click()},
  ai:{l:'AI에게 요청', k:'Mod+J', run:() => { if (!sample) return; if (!selected().length){ aiScope = 'slide'; } placeAI(true); setTimeout(() => $('#aiq').focus(), 0); }},
  aiSlide:{l:'AI로 장표 만들기', k:'', run:() => $('#bGen').click()},
};
function keyOf(ev){
  const parts = []; if (ev.metaKey || ev.ctrlKey) parts.push('Mod'); if (ev.shiftKey) parts.push('Shift'); if (ev.altKey) parts.push('Alt');
  let k = ev.key; if (k === '+') k = '='; if (k === '_') k = '-'; if (k === '{') k = '['; if (k === '}') k = ']';
  if (k.length === 1) k = k.toUpperCase(); if (k === 'Backspace') k = 'Delete';
  parts.push(k); return parts.join('+');
}
const KEYMAP = {}; Object.entries(CMD).forEach(([id, c]) => { if (c.k) KEYMAP[c.k.replace(/\+(\w)$/, (m, a) => '+' + a.toUpperCase())] = id; });
KEYMAP['Mod+Y'] = 'redo'; KEYMAP['Mod+Shift+Delete'] = 'del';
addEventListener('keydown', ev => {
  if (ev.key === ' ' && !ev.target.closest('input,textarea,select,[contenteditable=true]') && $('#present').hidden){ if (!spaceDown){ spaceDown = true; canvas.classList.add('panning'); } ev.preventDefault(); return; }
  if (!$('#present').hidden) return;
  if (!$('#pal').hidden || !$('#ctx').hidden){ if (ev.key === 'Escape'){ closePal(); closeCtx(); ev.preventDefault(); } if (!$('#ctx').hidden) return; if (!$('#pal').hidden) return; }
  const typing = ev.target.closest && ev.target.closest('input,textarea,select,[contenteditable=true]');
  const combo = keyOf(ev); let id = KEYMAP[combo];
  if (typing){
    if (editingText && ev.target.closest('[contenteditable=true]')){
      if (['bold', 'italic', 'underline'].includes(id)){ ev.preventDefault(); CMD[id].run(); return; }
      if (ev.key === 'Escape'){ ev.preventDefault(); finishText(); return; }
    }
    if (['save', 'find', 'palette', 'present'].includes(id)){ ev.preventDefault(); CMD[id].run(); }
    return;
  }
  if (['cut', 'copy', 'paste'].includes(id)) return; // handled by the native clipboard events below
  if (id === 'text' && (ev.metaKey || ev.ctrlKey)) return;
  if (id){ ev.preventDefault(); CMD[id].run(); return; }
  const s = cur(); const g = selected();
  if (ev.key.startsWith('Arrow') && g.length && !ev.metaKey && !ev.ctrlKey){
    ev.preventDefault(); if (g.some(e => e.lock)) return; snapshotOnce('미세 이동'); const d = ev.shiftKey ? 16 : 4;
    g.forEach(e => { if (ev.key === 'ArrowLeft') e.x -= d; if (ev.key === 'ArrowRight') e.x += d; if (ev.key === 'ArrowUp') e.y -= d; if (ev.key === 'ArrowDown') e.y += d; }); changed(s, {panel:true}); placeAI(); return;
  }
  if (!g.length && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === 'PageDown' || ev.key === 'PageUp')){ ev.preventDefault(); const L = list(); const i = L.findIndex(x => x.id === curId); const n = L[i + (ev.key.endsWith('Down') ? 1 : -1)]; if (n){ curId = n.id; renderAll(); } return; }
  if (ev.key === 'Tab' && (document.activeElement === canvas || g.length) && !ev.metaKey && !ev.ctrlKey && !ev.altKey){
    // keyboard selection: Tab / Shift+Tab walk the slide's elements in stacking order
    const els = s ? s.els.filter(e => !e.hidden && !isBg(e)) : []; if (!els.length) return; ev.preventDefault();
    const i = els.findIndex(e => e.id === selId); const n = els[(i + (ev.shiftKey ? -1 : 1) + els.length) % els.length];
    selectIds([n.id]); renderCanvas(); renderPanel(); placeAI(); canvas.focus({preventScroll:true}); announce(`${elName(n)} 선택됨, ${els.indexOf(n) + 1} / ${els.length}`); return; }
  if (ev.key === 'Enter' && g.length === 1 && g[0].type === 'text'){ ev.preventDefault(); startEdit(g[0].id); return; }
  if (ev.key === 'Escape'){ if (g.length){ clearSel(); hideAI(); renderCanvas(); renderPanel(); } else if (!$('#findBar').hidden) closeFind(); }
  if (ev.key === 'F5'){ ev.preventDefault(); present(); }
});
addEventListener('keyup', ev => { if (ev.key === ' '){ spaceDown = false; canvas.classList.remove('panning'); } });
const inField = t => t && t.closest && t.closest('input,textarea,select,[contenteditable=true]');
document.addEventListener('copy', ev => { if (inField(ev.target) || !$('#present').hidden) return; const t = copySel(); if (!t) return; ev.preventDefault(); ev.clipboardData.setData('text/plain', t); toast(`${clip.els.length}개 요소 복사`); });
document.addEventListener('cut', ev => { if (inField(ev.target) || !$('#present').hidden) return; const t = copySel(); if (!t) return; ev.preventDefault(); ev.clipboardData.setData('text/plain', t); CMD.del.run(); });
document.addEventListener('paste', ev => {
  if (inField(ev.target) || !$('#present').hidden) return; const s = cur(); if (!s) return;
  const txt = ev.clipboardData && ev.clipboardData.getData('text/plain'); ev.preventDefault();
  if (txt){ try { const o = JSON.parse(txt); if (o && o.cudaStudio && Array.isArray(o.els)){ pasteEls(o.els.map(vElKeep).filter(Boolean), clip && clip.from); return; } } catch (_) {}
    snapshot('텍스트 붙여넣기'); const t = T(esc(txt.slice(0, 2000)).replace(/\n/g, '<br>'), 200, 360, 1200, 120, {size:28, lh:1.5}); t.id = nid('e'); s.els.push(t); selectIds([t.id]); changed(s, {panel:true}); return; }
  if (clip) pasteEls(clip.els, clip.from);
});
function vElKeep(o){ const v = vEl(o); if (v){ v.id = 'x'; if (o.g) v.g = String(o.g); if (o.rot) v.rot = +o.rot || 0; if (o.lock) v.lock = true; if (o.hidden) v.hidden = true; } return v; }

/* context menu (native popup inside the installed app) */
function ctxItems(){
  const g = selected(); const has = g.length > 0;
  return [['cut', has], ['copy', has], ['paste', !!clip], ['dup', true], ['del', has], null, ['front', has], ['fwd', has], ['bwd', has], ['back', has], null, ['group', g.length > 1], ['ungroup', g.some(e => e.g)], ['lock', has], ['hide', has], null, ['ai', !!sample]];
}
function openCtx(x, y){
  if (desktop && desktop.Menu && desktop.fs !== undefined && desktopInstalled){
    desktop.Menu.popup(ctxItems().map(it => it ? {label:CMD[it[0]].l, enabled:it[1], accelerator:accel(CMD[it[0]].k), click:() => CMD[it[0]].run()} : {type:'separator'})).catch(() => openHtmlCtx(x, y)); return; }
  openHtmlCtx(x, y);
}
function openHtmlCtx(x, y){
  const m = $('#ctx'); m.innerHTML = ctxItems().map(it => it ? `<button type="button" data-cmd="${it[0]}" ${it[1] ? '' : 'disabled'}><span>${esc(CMD[it[0]].l)}</span></button>` : '<hr>').join('');
  m.hidden = false; const w = m.offsetWidth, h = m.offsetHeight; m.style.left = Math.min(x, innerWidth - w - 8) + 'px'; m.style.top = Math.min(y, innerHeight - h - 8) + 'px';
  const first = m.querySelector('button:not([disabled])'); if (first) first.focus();
}
function closeCtx(){ const m = $('#ctx'); if (m) m.hidden = true; }
$('#ctx').addEventListener('click', ev => { const b = ev.target.closest('button[data-cmd]'); if (!b) return; closeCtx(); CMD[b.dataset.cmd].run(); });
$('#ctx').addEventListener('keydown', ev => { const bs = [...$('#ctx').querySelectorAll('button:not([disabled])')]; const i = bs.indexOf(document.activeElement); if (ev.key === 'ArrowDown'){ ev.preventDefault(); (bs[i + 1] || bs[0]).focus(); } if (ev.key === 'ArrowUp'){ ev.preventDefault(); (bs[i - 1] || bs[bs.length - 1]).focus(); } if (ev.key === 'Escape') closeCtx(); });
document.addEventListener('pointerdown', ev => { if (!ev.target.closest('#ctx')) closeCtx(); if (!ev.target.closest('#exportPop,#bExport')) $('#exportPop').hidden = true; }, true);

/* command palette */
let palSel = 0;
function palEntries(q){
  const L = list(); const items = [];
  Object.entries(CMD).forEach(([id, c]) => items.push({t:c.l, k:c.k, run:() => c.run(), kind:'명령'}));
  L.forEach((s, i) => items.push({t:`${i + 1}. ${plainTitle(s)}`, run:() => { curId = s.id; clearSel(); renderAll(); }, kind:'장표'}));
  LAYOUTS.forEach((l, i) => items.push({t:'레이아웃: ' + l[0], run:() => addLayout(i), kind:'삽입'}));
  Object.entries(ASSETS).forEach(([k, a]) => items.push({t:'에셋: ' + a.name, run:() => addAsset(k), kind:'삽입'}));
  const qq = q.trim().toLowerCase(); return qq ? items.filter(it => it.t.toLowerCase().includes(qq)).slice(0, 40) : items.slice(0, 40);
}
function renderPal(){ const it = palEntries($('#palq').value); palSel = Math.min(palSel, it.length - 1); $('#pall').innerHTML = it.map((x, i) => `<button type="button" data-i="${i}" aria-selected="${i === palSel}"><em>${esc(x.kind)}</em><span>${esc(x.t)}</span></button>`).join(''); $('#pall').__items = it; const a = $('#pall').querySelector('[aria-selected=true]'); if (a) a.scrollIntoView({block:'nearest'}); }
function openPal(){ if (editingText) finishText(); $('#pal').hidden = false; $('#palq').value = ''; palSel = 0; renderPal(); $('#palq').focus(); }
function closePal(){ $('#pal').hidden = true; }
$('#palq').addEventListener('input', () => { palSel = 0; renderPal(); });
$('#palq').addEventListener('keydown', ev => { const it = $('#pall').__items || []; if (ev.key === 'ArrowDown'){ ev.preventDefault(); palSel = Math.min(it.length - 1, palSel + 1); renderPal(); } else if (ev.key === 'ArrowUp'){ ev.preventDefault(); palSel = Math.max(0, palSel - 1); renderPal(); } else if (ev.key === 'Enter'){ ev.preventDefault(); const x = it[palSel]; closePal(); if (x) x.run(); } else if (ev.key === 'Escape'){ closePal(); } });
$('#pall').addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; const x = ($('#pall').__items || [])[+b.dataset.i]; closePal(); if (x) x.run(); });
$('#pal').addEventListener('pointerdown', ev => { if (ev.target === $('#pal')) closePal(); });

/* find and replace across the deck (text elements, asset labels, notes) */
let hits = [], hitI = -1;
function plain(h){ return String(h || '').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
function runFind(){
  const q = $('#fq').value; hits = []; if (!q){ $('#fcount').textContent = ''; return; }
  list().forEach(s => { s.els.forEach(e => { const txt = e.type === 'text' ? plain(e.html) : e.type === 'asset' ? Object.values(e.p || {}).join(' ') : ''; if (txt.includes(q)) hits.push({s:s.id, e:e.id}); }); if ((s.notes || '').includes(q)) hits.push({s:s.id, notes:true}); });
  $('#fcount').textContent = hits.length ? `${Math.max(0, hitI) + 1}/${hits.length}` : '없음';
}
function gotoHit(d){ if (!hits.length) return; hitI = (hitI + d + hits.length) % hits.length; const h = hits[hitI]; curId = h.s; clearSel(); if (h.e) selId = h.e; renderAll(); $('#fcount').textContent = `${hitI + 1}/${hits.length}`; if (h.notes){ const n = $('#notes'); const i = n.value.indexOf($('#fq').value); n.focus(); n.setSelectionRange(i, i + $('#fq').value.length); $('#fq').focus(); } }
function replaceIn(s, e, q, r){
  if (e.type === 'text'){ const before = e.html; e.html = clean(before.split(esc(q)).join(esc(r))); return before !== e.html; }
  if (e.type === 'asset'){ let c = false; Object.keys(e.p || {}).forEach(k => { if (typeof e.p[k] === 'string' && e.p[k].includes(q)){ e.p[k] = e.p[k].split(q).join(r); c = true; } }); return c; }
  return false;
}
function replaceAll(onlyCurrent){
  const q = $('#fq').value, r = $('#fr').value; if (!q) return; const targets = onlyCurrent && hitI >= 0 ? [hits[hitI]] : hits; if (!targets.length) return;
  const sids = [...new Set(targets.map(h => h.s))]; snapshot(onlyCurrent ? '바꾸기' : `모두 바꾸기 (${targets.length}곳)`, sids);
  targets.forEach(h => { const s = slides.find(x => x.id === h.s); if (!s) return; if (h.notes) s.notes = s.notes.split(q).join(r); else { const e = s.els.find(x => x.id === h.e); if (e) replaceIn(s, e, q, r); } });
  sids.forEach(id => { const s = slides.find(x => x.id === id); if (s) changed(s); }); renderAll(); hitI = -1; runFind(); toast(`${targets.length}곳을 바꿨습니다`, true);
}
function openFind(){ if (editingText) finishText(); $('#findBar').hidden = false; $('#fq').focus(); $('#fq').select(); runFind(); }
function closeFind(){ $('#findBar').hidden = true; hits = []; hitI = -1; }
$('#fq').addEventListener('input', () => { hitI = -1; runFind(); });
$('#fq').addEventListener('keydown', ev => { if (ev.key === 'Enter'){ ev.preventDefault(); gotoHit(ev.shiftKey ? -1 : 1); } if (ev.key === 'Escape') closeFind(); });
$('#fr').addEventListener('keydown', ev => { if (ev.key === 'Enter'){ ev.preventDefault(); replaceAll(true); } if (ev.key === 'Escape') closeFind(); });
$('#findBar').addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.f; if (a === 'prev') gotoHit(-1); if (a === 'next') gotoHit(1); if (a === 'one') replaceAll(true); if (a === 'all') replaceAll(false); if (a === 'close') closeFind(); });

/* ============ QUALITY CHECKS ============ */
const BANNED = [[/무기/, '비유 표현: 무기'], [/잠그|잠금 효과/, '비유 표현: 잠그다 → 전환 비용'], [/포획/, '번역투: 가치 포획 → 수익 확보'], [/단순히[^.]*아니라/, 'AI 문체: 단순히 ~가 아니라'], [/비지니스/, '맞춤법: 비지니스 → 비즈니스'], [/게임 ?체인저|혁신적인|압도적/, '과한 강조어'], [/구동한다|가능하게 한다/, '번역투 동사']];
function lint(){
  const out = []; const L = list();
  L.forEach((s, i) => {
    const thumb = document.querySelector(`#thumbs .thumb[data-id="${CSS.escape(s.id)}"] .stage`);
    s.els.forEach(e => {
      if (e.hidden) return;
      if (!isBg(e) && (e.x < 0 || e.y < 0 || e.x + e.w > 1600 || e.y + e.h > 900)) out.push({s:s.id, e:e.id, n:i + 1, sev:'warn', m:'캔버스 밖으로 나간 요소'});
      if (e.type === 'text'){ const t = plain(e.html); BANNED.forEach(([re, m]) => { if (re.test(t)) out.push({s:s.id, e:e.id, n:i + 1, sev:'warn', m}); });
        if (thumb){ const n = thumb.querySelector(`.el[data-id="${CSS.escape(e.id)}"] .txt`); if (n && (n.scrollHeight > n.clientHeight + 4 || n.scrollWidth > n.clientWidth + 4)) out.push({s:s.id, e:e.id, n:i + 1, sev:'err', m:'텍스트 넘침', over:true}); } }
      if (e.type === 'asset'){ const t = Object.values(e.p || {}).join(' '); BANNED.forEach(([re, m]) => { if (re.test(t)) out.push({s:s.id, e:e.id, n:i + 1, sev:'warn', m}); }); }
    });
    if (s.kind === 'content'){
      const all = s.els.map(e => e.type === 'text' ? plain(e.html) : e.type === 'asset' ? Object.values(e.p || {}).join(' ') : '').join(' ');
      const tt = plainTitle(s); if (tt.length > 70) out.push({s:s.id, n:i + 1, sev:'warn', m:`제목이 깁니다 (${tt.length}자)`});
      if (!s.notes || s.notes.trim().length < 10) out.push({s:s.id, n:i + 1, sev:'info', m:'발표 스크립트 없음'});
    }
  });
  return out;
}
let lastLint = [];
function renderStatus(){
  const st = $('#status'); if (!st) return; const L = list(); const i = L.findIndex(s => s.id === curId);
  lastLint = lint(); const over = lastLint.filter(x => x.over).length, warn = lastLint.filter(x => x.sev !== 'info').length - over;
  st.querySelector('.pos').textContent = `${i + 1} / ${L.length}장`;
  const o = st.querySelector('.over'); o.textContent = over ? `텍스트 넘침 ${over}` : '텍스트 넘침 없음'; o.dataset.s = over ? 'bad' : 'ok';
  const w = st.querySelector('.warn'); w.textContent = warn ? `점검 경고 ${warn}` : '점검 경고 없음'; w.dataset.s = warn ? 'warn' : 'ok';
  st.querySelector('.hist').textContent = `수정 이력 ${undo.length}`;
  st.querySelector('.zoom').textContent = Math.round(ZM * 100) + '%';
}
$('#status').addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a; if (a === 'check') CMD.check.run(); if (a === 'hist') CMD.history.run(); if (a === 'zin') CMD.zin.run(); if (a === 'zout') CMD.zout.run(); if (a === 'zfit') CMD.zfit.run(); });

/* ============ VERSIONS: Cmd+S saves a named restore point of the whole deck ============ */
const versPath = () => deckId === 'cuda' ? 'versions' : 'decks/' + deckId + '/versions';
let versions = [], versUnsub = null;
async function saveVersion(){
  if (editingText) finishText(); clearTimeout(store.timer); await flush();
  const base = baseFor(); const changedOnly = slides.filter(sl => { const b = base.find(x => x.id === sl.id); return !b || !same(b, sl); }).map(clone);
  const v = {at:Date.now(), name:`${new Date().toLocaleString('ko-KR', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})} 저장`, v:2, slides:changedOnly};
  if (store.db){ try { await store.db.collection(versPath()).add(v); toast('버전을 저장했습니다'); } catch (e){ toast('버전을 저장하지 못했습니다. 문서가 너무 크면 장표 수를 줄여 주세요'); } }
  else { try { const k = lsKey() + ':versions'; const a = JSON.parse(localStorage.getItem(k) || '[]'); a.unshift({...v, id:nid('v')}); localStorage.setItem(k, JSON.stringify(a.slice(0, 10))); versions = a.slice(0, 10); toast('이 브라우저에 버전을 저장했습니다'); } catch (_) { toast('버전을 저장하지 못했습니다'); } }
  if (tab === 'hist') renderPanel();
}
function subVersions(){
  if (versUnsub){ versUnsub(); versUnsub = null; }
  if (!store.db){ try { versions = JSON.parse(localStorage.getItem(lsKey() + ':versions') || '[]'); } catch (_) { versions = []; } return; }
  versUnsub = store.db.collection(versPath()).orderBy('at', 'desc').limit(20).onSnapshot(snap => { versions = snap.docs.map(d => ({id:d.id, ...(d.data() || {})})); if (tab === 'hist') renderPanel(); }, () => {});
}
function restoreVersion(id){
  const v = versions.find(x => x.id === id); if (!v || !Array.isArray(v.slides)) return;
  const saved = v.slides.map(sv => sv && sid(sv.id) ? cleanSlide(sv.id, sv) : null).filter(Boolean);
  // v2 versions hold only changed slides: everything else is the original
  const target = v.v === 2 ? baseFor().map(b => saved.find(x => x.id === b.id) || clone(b)).concat(saved.filter(x => !baseFor().some(b => b.id === x.id))) : saved;
  const ids = [...new Set(slides.map(x => x.id).concat(target.map(x => x.id)))];
  snapshot('버전 복원: ' + (v.name || ''), ids);
  const keep = new Set(target.map(x => x.id));
  slides.forEach(x => { if (!keep.has(x.id) && !x.deleted){ x.deleted = true; changed(x, {noCanvas:true}); } });
  target.forEach(t => { const i = slides.findIndex(x => x.id === t.id); const nx = {...t, deleted:false}; if (i < 0) slides.push(nx); else if (!same(slides[i], nx)) slides[i] = nx; else return; changed(slides.find(x => x.id === t.id), {noCanvas:true}); });
  curId = null; clearSel(); renderAll(); toast('버전을 복원했습니다', true);
}

/* ============ EXPORT / IMPORT ============ */
const LIBS = {pptx:['https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js', 'PptxGenJS'], h2i:['https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js', 'htmlToImage'], pdf:['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf']};
function loadLib(k){ const [u, g] = LIBS[k]; if (window[g]) return Promise.resolve(window[g]); return new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = u; sc.onload = () => res(window[g]); sc.onerror = () => rej(new Error('load')); document.head.appendChild(sc); }); }
let downloads = null;
async function saveFile(filename, data){
  if (downloads){ try { const r = await downloads.save({filename, data}); return r; } catch (e){ toast(e && e.code === 'declined' ? '저장을 취소했습니다' : '파일을 저장하지 못했습니다'); return null; } }
  const blob = data instanceof Blob ? data : new Blob([data]); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return {saved:true};
}
const deckName = () => (decks.find(d => d.id === deckId) || {}).name || '발표';
function offStage(html){ const box = $('#offscreen'); box.innerHTML = `<div class="stage static">${html}</div>`; return box.firstChild; }
async function waitImgs(node){ await Promise.all([...node.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))); }
function busy(msg){ const b = $('#busy'); b.hidden = !msg; b.querySelector('span').textContent = msg || ''; }
async function exportPDF(){
  try { busy('PDF 만드는 중'); const [h2i, jspdf] = await Promise.all([loadLib('h2i'), loadLib('pdf')]);
    const doc = new jspdf.jsPDF({orientation:'landscape', unit:'px', format:[1600, 900], compress:true}); const L = list();
    for (let i = 0; i < L.length; i++){ busy(`PDF 만드는 중 ${i + 1}/${L.length}`); const node = offStage(slideHTML(L[i], 'thumb')); await waitImgs(node);
      const url = await capture(h2i, 'toJpeg', node, {quality:0.92, pixelRatio:1.5, skipFonts:true, backgroundColor:'#000000', width:1600, height:900}); if (i) doc.addPage([1600, 900], 'landscape'); doc.addImage(url, 'JPEG', 0, 0, 1600, 900); }
    busy(''); await saveFile(deckName() + '.pdf', doc.output('blob'));
  } catch (e){ busy(''); toast('PDF를 만들지 못했습니다'); }
}
function runsFrom(html, color, base = {}){
  // paragraphs for PptxGenJS: inline b/i/u/span colours, <br> breaks, ul/ol lists become bulleted paragraphs
  const runs = []; const root = new DOMParser().parseFromString('<div>' + clean(html) + '</div>', 'text/html').body.firstChild;
  const tone = c => c === 'g' ? HEXT().g : c === 't2' ? HEXT().t2 : HEXT().t3;
  const brk = () => { if (runs.length) runs[runs.length - 1].options.breakLine = true; };
  const walk = (n, st) => n.childNodes.forEach(c => {
    if (c.nodeType === 3){ if (c.textContent) runs.push({text:c.textContent, options:{...st}}); return; }
    const t = c.tagName;
    if (t === 'BR'){ if (runs.length) brk(); else runs.push({text:'', options:{breakLine:true}}); return; }
    if (t === 'UL' || t === 'OL'){ if (runs.length) brk(); [...c.children].forEach((li, k) => { const s2 = {...st, bullet:t === 'OL' ? {type:'number'} : {code:'2022'}, indentLevel:0}; const before = runs.length; walk(li, s2); if (runs.length > before) brk(); }); return; }
    const s2 = {...st}; if (t === 'B') s2.bold = true; if (t === 'I') s2.italic = true; if (t === 'U') s2.underline = {style:'sng'};
    if (t === 'SMALL') s2.fontSize = (st.fontSize || 20) * 0.5; if (t === 'SPAN') s2.color = tone(c.className); walk(c, s2); });
  walk(root, {color, ...base}); if (runs.length) delete runs[runs.length - 1].options.breakLine; return runs;
}
const HEXT = () => { const h = v => String(v).replace('#', '').toUpperCase(); return {t1:h(theme.t1), t2:h(theme.t2), t3:h(theme.t3), g:h(theme.accent), card:h(theme.card), raised:'1F1F1F', ink:h(theme.ink), bg:h(theme.bg), line:h(theme.line)}; };
/* image capture never blocks an export: 15 s per picture, then a transparent pixel */
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
function capture(h2i, fn, node, opts){ return Promise.race([h2i[fn](node, opts).catch(() => BLANK), new Promise(r => setTimeout(() => r(BLANK), 15000))]); }
async function toDataURL(src){ try { const r = await fetch(src); if (!r.ok) return BLANK; const b = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(BLANK); fr.readAsDataURL(b); }); } catch (_) { return BLANK; } }
/* native exhibits: tables, cards, callouts and bar charts stay editable in PowerPoint; anything else becomes a picture */
function pptxAsset(p, sl, e, X, font){
  const a = ASSETS[e.asset]; const q = Object.assign({}, a.d, e.p || {}); const H = HEXT(); const S = X.S; const bx = (x, y, w, h) => ({x:(e.x + x) * S, y:(e.y + y) * S, w:w * S, h:h * S});
  const T = (text, o) => ({text:String(text ?? ''), options:o || {}}); const pt = px => Math.round(px * 0.6 * 10) / 10;
  const card = (x, y, w, h, top) => { sl.addShape(p.ShapeType.roundRect, {...bx(x, y, w, h), fill:{color:H.card}, line:{color:'2D2D2D', width:0.75}, rectRadius:0.08}); if (top) sl.addShape(p.ShapeType.rect, {...bx(x, y, w, 3), fill:{color:H.g}, line:{color:H.g, width:0}}); };
  const rows = k => lines(q[k]).map(cells);
  if (e.asset === 'sticker'){ sl.addShape(p.ShapeType.roundRect, {...bx(0, 0, e.w, e.h), fill:{color:H.g, transparency:93}, line:{color:H.g, width:0.75, transparency:68}, rectRadius:0.1});
    sl.addText([T(q.lb + '   ', {color:H.g, bold:true, fontSize:pt(18)}), T(q.t, {color:H.t1, fontSize:pt(24)})], {...bx(32, 0, e.w - 64, e.h), valign:'middle', margin:0, fontFace:font}); return true; }
  if (e.asset === 'kpis'){ const rs = rows('rows'); const one = e.w < 640; const n = rs.length; const gap = 20; const cw = one ? e.w : (e.w - gap * (n - 1)) / n; const ch = one ? (e.h - gap * (n - 1)) / n : e.h;
    rs.forEach((r, k) => { const x = one ? 0 : k * (cw + gap), y = one ? k * (ch + gap) : 0; card(x, y, cw, ch, true);
      sl.addText([T(r[1] || '', {color:'AAAAAA', bold:true, fontSize:pt(18), breakLine:true}), T(r[0], {color:r[3] === 'g' ? H.g : H.t1, bold:true, fontSize:pt(52), breakLine:true}), T(r[2] || '', {color:H.t3, fontSize:pt(16)})], {...bx(x + 28, y + 12, cw - 56, ch - 24), valign:'middle', margin:0, fontFace:font}); }); return true; }
  if (e.asset === 'thesis' || e.asset === 'cards'){ const rs = e.asset === 'thesis' ? rows('rows') : rows('items').map(r => [r[1], r[2], '']); const n = rs.length || 1; const gap = 20; const cw = (e.w - gap * (n - 1)) / n;
    rs.forEach((r, k) => { const x = k * (cw + gap); card(x, 0, cw, e.h, true);
      sl.addText([T(e.asset === 'thesis' ? `0${k + 1} · ${q.lb}` : `0${k + 1}`, {color:H.t3, bold:true, fontSize:pt(17), breakLine:true}), T(r[0] || '', {color:H.t1, bold:true, fontSize:pt(30), breakLine:true}), T(r[1] || '', {color:'AAAAAA', fontSize:pt(22)})], {...bx(x + 28, 28, cw - 56, e.h * 0.62), valign:'top', margin:0, fontFace:font, paraSpaceAfter:6});
      if (r[2]) sl.addText([T(q.eb || '근거', {color:H.t3, fontSize:pt(16), breakLine:true}), T(r[2], {color:H.g, bold:true, fontSize:pt(22)})], {...bx(x + 28, e.h - 96, cw - 56, 72), valign:'bottom', margin:0, fontFace:font}); }); return true; }
  if (e.asset === 'cmptable' || e.asset === 'kv' || e.asset === 'execsum'){
    let data;
    if (e.asset === 'cmptable'){ const h = cells(q.h); data = [[T(''), T(h[0] || '', {bold:true, color:H.g, fontSize:pt(30)}), T(h[1] || '', {bold:true, color:H.t1, fontSize:pt(30)})]].concat(rows('rows').map(r => [T(r[0], {color:H.t3, fontSize:pt(20)}), T((r[1] || '').replace(/^[●○]\s*/, (m) => m.trim() === '●' ? '● ' : '○ '), {color:H.t1, fontSize:pt(24)}), T((r[2] || '').replace(/^[●○]\s*/, (m) => m.trim() === '●' ? '● ' : '○ '), {color:H.t1, fontSize:pt(24)})])); }
    else if (e.asset === 'kv') data = (q.t ? [[T(q.t, {bold:true, color:H.t1, fontSize:pt(24)}), T('')]] : []).concat(rows('rows').map(r => [T(r[0], {color:H.t3, fontSize:pt(20)}), T(r[1] || '', {color:H.t1, fontSize:pt(20)})]));
    else data = rows('rows').map((r, k) => [T(String(k + 1), {color:H.t3, fontSize:pt(22)}), T(r[0], {bold:true, color:H.t1, fontSize:pt(22)}), T(r[1] || '', {color:'AAAAAA', fontSize:pt(20)})]);
    const cols = data[0].length; const cw = e.asset === 'execsum' ? [56, 360, e.w - 416] : e.asset === 'kv' ? [Math.min(160, e.w * 0.32), e.w - Math.min(160, e.w * 0.32)] : [220, (e.w - 220) / 2, (e.w - 220) / 2];
    sl.addTable(data, {...bx(0, 0, e.w, e.h), colW:cw.slice(0, cols).map(v => v * S), fontFace:font, border:{type:'solid', pt:0.5, color:'2D2D2D'}, fill:{color:H.bg}, valign:'middle', margin:[4, 6, 4, 6]}); return true; }
  if (e.asset === 'chart'){ const rs = lines(q.rows).map(cells); const head = rs[0] || []; const body = rs.slice(1); if (!body.length) return false;
    const series = head.slice(1).map((nm, j) => ({name:nm, labels:body.map(r => r[0]), values:body.map(r => +r[j + 1] || 0)})).slice(0, 1);
    sl.addChart(q.kind === 'line' ? p.ChartType.line : p.ChartType.bar, series, {...bx(0, 0, e.w, e.h), barDir:'col', chartColors:[H.g], catAxisLabelColor:'AAAAAA', valAxisLabelColor:'888888', valGridLine:{color:'2D2D2D', size:0.5}, catGridLine:{style:'none'}, showValue:true, dataLabelColor:'FFFFFF', dataLabelFontSize:9, catAxisLabelFontFace:font, valAxisLabelFontFace:font, showLegend:false, plotArea:{fill:{color:H.bg}}, chartArea:{fill:{color:H.bg}}}); return true; }
  return false;
}
async function exportPPTX(fontFace){
  const font = fontFace || 'Malgun Gothic';
  try { busy('PPTX 만드는 중'); const [PG, h2i] = await Promise.all([loadLib('pptx'), loadLib('h2i')]);
    const p = new PG(); p.layout = 'LAYOUT_WIDE'; p.title = deckName(); const S = 13.333 / 1600; const L = list(); const imgCache = {}; const H = HEXT();
    // the master background (glow + dot grid) rendered once as a picture
    let bgImg = null; if (theme.bgfx > 0){ try { const n = offStage('<div class="bgfx"></div>'); n.style.width = '1600px'; n.style.height = '900px'; bgImg = await capture(h2i, 'toJpeg', n, {quality:0.9, pixelRatio:1, skipFonts:true, width:1600, height:900, backgroundColor:theme.bg}); } catch (_) { bgImg = null; } }
    for (let i = 0; i < L.length; i++){ busy(`PPTX 만드는 중 ${i + 1}/${L.length}`); const s = L[i]; const sl = p.addSlide();
      sl.background = bgImg && (s.kind === 'content' || s.kind === 'refs') ? {data:bgImg} : {color:H.bg};
      for (const e of s.els){ if (e.hidden) continue; const box = {x:e.x * S, y:e.y * S, w:e.w * S, h:e.h * S, rotate:e.rot || 0};
        if (e.type === 'text'){ const ff = e.font === 'serif' ? 'Batang' : e.font === 'mono' || e.mono ? 'Consolas' : e.font === 'inter' ? 'Inter' : font;
          sl.addText(runsFrom(e.html, H[e.color] || H.t1, {fontSize:Math.round(e.size * 0.6 * 10) / 10}), {...box, fontSize:Math.round(e.size * 0.6 * 10) / 10, bold:+e.weight >= 600, italic:!!e.italic, align:e.align, valign:e.va === 'middle' ? 'middle' : e.va === 'bottom' ? 'bottom' : 'top', margin:0, fontFace:ff, lineSpacingMultiple:e.lh || 1.2, charSpacing:e.ls ? Math.round(e.ls * e.size * 0.6 * 10) / 10 : undefined, fit:'none'}); }
        else if (e.type === 'rect'){ const shp = e.shape || 'rect'; const tr = Math.round((1 - (e.op ?? 1)) * 100);
          if (shp === 'line' || shp === 'arrow') sl.addShape(p.ShapeType.line, {x:box.x, y:box.y + box.h / 2, w:box.w, h:0, rotate:box.rotate, line:{color:H[e.stroke || e.fill] || H.t2, width:(e.sw ?? 4) * 0.6, dashType:e.dash ? 'dash' : 'solid', endArrowType:shp === 'arrow' ? 'triangle' : undefined, transparency:tr}});
          else sl.addShape(p.ShapeType[shp === 'ellipse' ? 'ellipse' : e.radius ? 'roundRect' : 'rect'], {...box, fill:e.fill === 'none' ? {type:'none'} : {color:H[e.fill] || H.g, transparency:tr}, line:e.stroke ? {color:H[e.stroke], width:(e.sw ?? 2) * 0.6, dashType:e.dash ? 'dash' : 'solid'} : {type:'none'}, rectRadius:e.radius && shp !== 'ellipse' ? Math.min(0.5, e.radius / Math.min(e.w, e.h)) : 0}); }
        else if (e.type === 'img' && (e.src || IMG[e.img])){
          if ((+e.cz || 1) > 1){ const node = offStage(elHTML({...e, x:0, y:0, rot:0}, 'thumb')); node.style.width = e.w + 'px'; node.style.height = e.h + 'px'; await waitImgs(node); sl.addImage({data:await capture(h2i, 'toPng', node, {pixelRatio:2, skipFonts:true, width:e.w, height:e.h}), ...box}); }
          else { const key = e.src || e.img; imgCache[key] = imgCache[key] || (e.src && e.src.startsWith('data:') ? e.src : await toDataURL(e.src || IMG[e.img].src));
            sl.addImage({data:imgCache[key], ...box, transparency:Math.round((1 - (e.op ?? 1)) * 100), sizing:{type:e.fit === 'contain' || e.img === 'logo' ? 'contain' : 'cover', w:box.w, h:box.h}}); } }
        else if (e.type === 'asset'){ if (pptxAsset(p, sl, e, {S}, font)) continue;
          const node = offStage(elHTML({...e, x:0, y:0, rot:0}, 'thumb')); node.style.width = e.w + 'px'; node.style.height = e.h + 'px'; await waitImgs(node); const url = await capture(h2i, 'toPng', node, {pixelRatio:2, skipFonts:true, width:e.w, height:e.h}); sl.addImage({data:url, ...box}); }
      }
      if (s.kind === 'content'){ const sec = s.sec == null ? -1 : +s.sec;
        if (theme.trk) sl.addText(sec >= 0 ? SECTIONS.map((t, k) => ({text:t + '    ', options:{color:k === sec ? H.g : '5C5C5C'}})) : [{text:'Take home', options:{color:H.g}}], {x:96 * S, y:28 * S, w:1300 * S, h:24 * S, fontSize:8.4, margin:0, fontFace:font});
        if (theme.rule) sl.addShape(p.ShapeType.line, {x:96 * S, y:180 * S, w:1408 * S, h:0, line:{color:H.line, width:0.75}});
        if (s.src && theme.foot) sl.addText(s.src, {x:96 * S, y:852 * S, w:1300 * S, h:18 * S, fontSize:6.6, color:'3A3A3A', margin:0, fontFace:font});
        const n = L.filter(x => x.kind === 'content').indexOf(s) + 1; if (theme.pg) sl.addText(String(n), {x:1440 * S, y:848 * S, w:64 * S, h:22 * S, fontSize:7.8, color:H.t3, align:'right', margin:0, fontFace:font}); }
      if (s.notes) sl.addNotes(s.notes);
    }
    const blob = await p.write({outputType:'blob'}); busy(''); await saveFile(deckName() + '.pptx', blob);
  } catch (e){ busy(''); toast('PPTX를 만들지 못했습니다'); }
}
/* vector PDF through the browser's print dialog: text stays selectable and searchable */
function printDeck(){
  const L = list(); let box = $('#printDeck'); if (!box){ box = document.createElement('div'); box.id = 'printDeck'; document.body.appendChild(box); }
  box.innerHTML = L.map(s => `<div class="pp"><div class="stage static">${slideHTML(s, 'thumb')}</div></div>`).join('');
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); box.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => { try { window.print(); } catch (_) { toast('이 화면에서는 인쇄 창을 열 수 없습니다. 이미지 PDF를 이용해 주세요'); done(); } }, 300);
}
async function exportJSON(){ const data = JSON.stringify({format:'cuda-studio', version:4, name:deckName(), slides:list().map(clone)}, null, 1); await saveFile(deckName() + '.slides.json', new Blob([data], {type:'application/json'})); }
$('#fileIn').addEventListener('change', async ev => {
  const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
  try { const o = JSON.parse(await f.text()); if (!o || o.format !== 'cuda-studio' || !Array.isArray(o.slides)) throw 0;
    await createDeck(String(o.name || f.name.replace(/\.slides\.json$|\.json$/, '')).slice(0, 60), false, o.slides); toast('프로젝트를 열었습니다');
  } catch (_) { toast('이 파일은 열 수 없습니다. 이 편집기에서 저장한 프로젝트 파일만 열 수 있습니다'); }
});

/* ============ DESKTOP APP (Install as app): native menu with accelerators, native context menu ============ */
let desktop = null, desktopInstalled = false;
const accel = k => k ? k.replace('Mod+', 'CmdOrCtrl+').replace('Delete', 'Backspace') : undefined;
async function initDesktop(){
  try { desktop = window.claude && window.claude.use ? await window.claude.use('desktop') : null; } catch (_) { desktop = null; }
  try { downloads = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (_) { downloads = null; }
  if (!desktop) return;
  let st = 'unavailable'; try { st = await desktop.install.state(); } catch (_) {}
  $('#bInstall').hidden = st !== 'available';
  desktopInstalled = !!desktop.Menu && !!desktop.window;
  if (!desktopInstalled) return;
  const it = id => ({label:CMD[id].l, accelerator:accel(CMD[id].k), click:() => { if (inField(document.activeElement) && ['undo', 'redo', 'all'].includes(id) && !editingText){ document.execCommand(id === 'all' ? 'selectAll' : id); return; } CMD[id].run(); }});
  const sep = {type:'separator'};
  desktop.Menu.setApplicationMenu([
    {label:'파일', submenu:[it('save'), it('json'), it('open'), sep, it('pptx'), it('pdf')]},
    {label:'편집', submenu:[it('undo'), it('redo'), sep, {role:'cut'}, {role:'copy'}, {role:'paste'}, it('dup'), it('del'), it('all'), sep, it('find'), it('palette')]},
    {label:'정렬', submenu:[it('group'), it('ungroup'), sep, it('front'), it('fwd'), it('bwd'), it('back'), sep, it('lock'), it('hide')]},
    {label:'삽입', submenu:[it('text'), it('newSlide'), it('dupSlide'), sep, it('aiSlide'), it('ai')]},
    {label:'보기', submenu:[it('zin'), it('zout'), it('zfit'), sep, it('check'), it('history'), sep, it('present')]},
  ]).catch(() => {});
}
$('#bInstall').addEventListener('click', () => { if (desktop) desktop.install.request().then(r => { if (r === 'installed') toast('앱으로 설치했습니다'); }).catch(() => toast('설치하지 못했습니다')); });
$('#bExport').addEventListener('click', () => { const p = $('#exportPop'); p.hidden = !p.hidden; });
$('#exportPop').addEventListener('click', ev => { const b = ev.target.closest('button[data-cmd]'); if (!b) return; $('#exportPop').hidden = true; CMD[b.dataset.cmd].run(); });
$('#bRedo').onclick = doRedo; $('#bPal').onclick = openPal;

/* ============ MORE EXHIBITS: editable data chart and a 3D compute grid ============ */
Object.assign(ASSETS, {
  chart:{fluid:true, name:'데이터 차트 (막대·선)', nw:960, nh:520,
    props:[['kind','종류 (bar 또는 line)'],['rows','데이터 (첫 줄은 머리글)','textarea'],['unit','단위'],['hl','강조할 항목 (마지막 항목은 last)']],
    d:{kind:'bar', rows:'구분|매출|매출총이익률(%)\nFY2025|1305|75.0\nFY2026|2159|71.1', unit:'억 달러', hl:'last'},
    render:(p, bx) => {
      const W = bx ? bx.w : 960, Hh = bx ? bx.h : 520; const rs = lines(p.rows).map(cells); if (rs.length < 2) return '';
      const head = rs[0], data = rs.slice(1); const series = head.slice(1, 3); const val = v => +String(v || '').replace(/[^0-9.\-]/g, '') || 0;
      const L = 72, R = 24, T = 48, B = 56; const pw = W - L - R, ph = Hh - T - B;
      const mx = Math.max(1, ...data.map(r => val(r[1]))); const nice = Math.pow(10, Math.floor(Math.log10(mx))); const top = Math.ceil(mx / nice) * nice;
      const y = v => T + ph - v / top * ph; const n = data.length; const bw = Math.min(120, pw / n * 0.5);
      const xs = data.map((_, i) => L + pw * (i + 0.5) / n);
      const grid = [0, 0.25, 0.5, 0.75, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(top * f)}" y2="${y(top * f)}" stroke="#2d2d2d"/><text x="${L - 12}" y="${y(top * f) + 6}" text-anchor="end" fill="#888" font-size="16">${(top * f).toLocaleString('ko-KR')}</text>`).join('');
      const hlIdx = p.hl === 'last' ? n - 1 : data.findIndex(r => r[0] === p.hl);
      const marks = p.kind === 'line'
        ? `<path class="dr an" style="--l:2000" d="${xs.map((x, i) => (i ? 'L' : 'M') + x + ' ' + y(val(data[i][1]))).join(' ')}" fill="none" stroke="#76b900" stroke-width="4"/>` + xs.map((x, i) => `<circle class="an" style="${D(300 + i * 80)}" cx="${x}" cy="${y(val(data[i][1]))}" r="7" fill="${i === hlIdx ? '#76b900' : '#000'}" stroke="#76b900" stroke-width="3"/>`).join('')
        : xs.map((x, i) => `<rect class="an bar" style="${D(200 + i * 100)}" x="${x - bw / 2}" y="${y(val(data[i][1]))}" width="${bw}" height="${Math.max(0, T + ph - y(val(data[i][1])))}" rx="4" fill="${i === hlIdx || hlIdx < 0 ? '#76b900' : '#555'}"/>`).join('');
      const labels = xs.map((x, i) => `<text x="${x}" y="${y(val(data[i][1])) - 14}" text-anchor="middle" fill="#fff" font-size="22" font-weight="600">${esc(data[i][1])}</text><text x="${x}" y="${Hh - B + 32}" text-anchor="middle" fill="#aaa" font-size="18">${esc(data[i][0])}</text>`).join('');
      const s2 = series[1] ? xs.map((x, i) => `<text x="${x}" y="${Hh - B + 52}" text-anchor="middle" fill="#76b900" font-size="15">${esc(series[1])} ${esc(data[i][2] || '')}</text>`).join('') : '';
      return `<svg class="a-chart" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(series[0] || '')}"><text x="${L}" y="24" fill="#aaa" font-size="18">${esc(series[0] || '')}${p.unit ? ' (' + esc(p.unit) + ')' : ''}</text>${grid}${marks}${labels}${s2}</svg>`;
    }},
  gpu3d:{name:'3D 병렬 연산 격자', nw:900, nh:560,
    props:[['n','한 변의 코어 수','number'],['lit','켜진 비율 (%)','number'],['label','설명']],
    d:{n:12, lit:100, label:'GPU 코어가 동시에 연산하는 구조 (개념도)'},
    render:p => { const n = Math.max(4, Math.min(20, +p.n || 12)); const lit = Math.max(0, Math.min(100, +p.lit || 0)); const tot = n * n; const on = Math.round(tot * lit / 100);
      return `<div class="a-3d"><div class="sc"><div class="pl" style="grid-template-columns:repeat(${n},1fr)">${Array.from({length:tot}, (_, i) => `<i class="${i < on ? 'on an' : ''}" style="${D(300 + (i % n + Math.floor(i / n)) * 40)}"></i>`).join('')}</div></div><span>${pe('label', -1, -1, p.label)}</span></div>`; }},
});
LAYOUTS.push(['실적 차트', 3, () => [H('FY2026 실적'), A('chart', 96, 216, 900, 560), A('kpis', 1040, 216, 464, 560, {rows:'2,159억 달러|FY2026 매출|NVIDIA 실적 발표|g\n71.1%|FY2026 매출총이익률|FY2025 75.0%'})]]);
LAYOUTS.push(['3D 개념도', 0, () => [H('수천 개의 코어'), A('gpu3d', 96, 196, 900, 580), A('sticker', 1040, 300, 464, 300, {lb:'핵심', t:'같은 연산을 대량의 데이터에 동시에 적용하는 작업일수록 CPU 대비 GPU의 처리 효율이 높다'})]]);

/* ============ PANELS: properties, layers, insert, checks, history ============ */
let insTab = 'layouts';
const renderPanelBase = renderPanel;
renderPanel = function(){
  const P = $('#panel'); $('#insSeg').hidden = tab !== 'insert';
  document.querySelectorAll('#insSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ins === insTab)));
  if (tab === 'insert'){ const t = tab; tab = insTab; renderPanelBase(); tab = t; return; }
  if (tab === 'layers') return renderLayers(P);
  if (tab === 'check') return renderCheck(P);
  if (tab === 'hist') return renderHist(P);
  if (tab === 'theme') return renderTheme(P);
  renderPanelBase(); enhanceProps(P);
};
function elName(e){ if (e.type === 'text') return plain(e.html).replace(/\s+/g, ' ').slice(0, 28) || '텍스트'; if (e.type === 'asset') return (ASSETS[e.asset] || {}).name || e.asset; if (e.type === 'img') return '이미지: ' + ((IMG[e.img] || {}).name || ''); return '도형'; }
function renderLayers(P){
  const s = cur(); if (!s){ P.innerHTML = ''; return; } const sel = new Set(selected().map(e => e.id));
  P.innerHTML = `<div class="grp"><div class="lbl">레이어 (위가 앞)</div><div class="layers">${s.els.slice().reverse().map(e => `<div class="ly ${sel.has(e.id) ? 'on' : ''}" data-id="${esc(e.id)}"><button type="button" class="nm" data-a="sel">${e.g ? '<em>그룹</em>' : ''}${esc(elName(e))}</button><button type="button" class="ib" data-a="hide" aria-pressed="${!!e.hidden}" title="숨기기">${e.hidden ? '<svg viewBox="0 0 16 16"><path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.2 4.4C2.8 5.3 2 6.6 1.5 8c1.2 3 3.8 5 6.5 5 1.3 0 2.5-.4 3.6-1.2M7 3.1C7.3 3 7.7 3 8 3c2.7 0 5.3 2 6.5 5-.3.8-.8 1.6-1.3 2.2"/></svg>' : '<svg viewBox="0 0 16 16"><path d="M1.5 8C2.7 5 5.3 3 8 3s5.3 2 6.5 5c-1.2 3-3.8 5-6.5 5S2.7 11 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>'}</button><button type="button" class="ib" data-a="lock" aria-pressed="${!!e.lock}" title="잠금">${e.lock ? '<svg viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>' : '<svg viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0"/></svg>'}</button></div>`).join('')}</div></div>
    <div class="grp"><div class="row2"><button class="btn" type="button" data-cmd="fwd">앞으로</button><button class="btn" type="button" data-cmd="bwd">뒤로</button><button class="btn" type="button" data-cmd="group">그룹</button><button class="btn" type="button" data-cmd="ungroup">그룹 해제</button></div></div>`;
}
function renderCheck(P){
  const L = lastLint = lint(); const n = L.filter(x => x.sev !== 'info').length;
  P.innerHTML = `<div class="grp"><div class="chkhead ${n ? 'warn' : 'ok'}">${n ? `경고 ${n}건` : '모든 장이 점검 항목을 통과했습니다'}</div></div>
    <div class="grp ai-only"><button class="btn primary" type="button" id="bAiDeck">덱 전체 문체를 AI로 점검</button></div>
    <div class="grp issues">${L.map(x => `<button type="button" class="iss ${x.sev}" data-s="${esc(x.s)}" data-e="${esc(x.e || '')}"><em class="num">${x.n}</em><span>${esc(x.m)}</span></button>`).join('') || ''}</div>`;
}
function renderHist(P){
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? m + '분 전' : Math.round(m / 60) + '시간 전'; };
  P.innerHTML = `<div class="grp"><div class="lbl">저장한 버전</div><button class="btn primary" type="button" data-cmd="save">지금 버전 저장</button>
    <div class="vers">${versions.map(v => `<div class="vr"><span>${esc(v.name || '')}<em>${esc(ago(v.at || 0))} · ${(v.slides || []).length}장</em></span><button class="btn" type="button" data-ver="${esc(v.id)}">복원</button></div>`).join('') || '<div class="hint">저장한 버전이 없습니다</div>'}</div></div>
    <div class="grp"><div class="lbl">이번 세션의 수정 이력</div><div class="hlist">${undo.slice().reverse().slice(0, 40).map(u => `<div>${esc(u.label)}</div>`).join('') || '<div class="hint">아직 수정하지 않았습니다</div>'}</div>
    <div class="row2"><button class="btn" type="button" data-cmd="undo">실행 취소</button><button class="btn" type="button" data-cmd="redo">다시 실행</button></div></div>`;
}
/* element inspector additions: rotation, lock/hide, table editor for data props, slide transition */
function enhanceProps(P){
  const s = cur(); if (!s) return; const e = multi.size > 1 ? null : curEl();
  if (e){
    const g = P.querySelector('.grp'); if (g) g.insertAdjacentHTML('beforeend', `<div class="row2">${fld('rot', '°', e.rot || 0)}<div class="row2"><button class="btn" type="button" data-cmd="lock">${e.lock ? '잠금 해제' : '잠금'}</button><button class="btn" type="button" data-cmd="hide">${e.hidden ? '보이기' : '숨기기'}</button></div></div>`);
    P.querySelectorAll('textarea[data-p]').forEach(ta => { if (!ta.value.includes('|')) return; const k = ta.dataset.p; const rows = lines(ta.value).map(cells); const nc = Math.max(...rows.map(r => r.length));
      const grid = document.createElement('div'); grid.className = 'grid'; grid.dataset.gp = k;
      grid.innerHTML = `<table>${rows.map((r, i) => `<tr>${Array.from({length:nc}, (_, j) => `<td><input data-r="${i}" data-c="${j}" value="${esc(r[j] ?? '')}" aria-label="${i + 1}행 ${j + 1}열"></td>`).join('')}<td class="rm"><button type="button" class="ib" data-rm="${i}" title="행 삭제"><svg viewBox="0 0 16 16"><path d="M4 8h8"/></svg></button></td></tr>`).join('')}</table><button type="button" class="btn" data-addrow="1">행 추가</button>`;
      ta.replaceWith(grid); });
  } else if (multi.size <= 1){
    const first = P.querySelector('.grp'); if (first) first.insertAdjacentHTML('beforeend', `<label class="grp"><span class="hint">발표 전환</span><select class="inp" data-tr="1">${[['fade', '페이드'], ['slide', '밀기'], ['convex', '입체 회전'], ['zoom', '확대'], ['none', '없음']].map(([v, l]) => `<option value="${v}" ${(s.tr || 'fade') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`);
  }
}
function gridString(grid){ const rows = []; grid.querySelectorAll('tr').forEach(tr => { const c = [...tr.querySelectorAll('input')].map(i => i.value.replace(/\|/g, '/').replace(/\n/g, ' ')); rows.push(c.join('|').replace(/\|+$/, '')); }); return rows.join('\n'); }
$('#panel').addEventListener('input', ev => {
  const t = ev.target; const s = cur(); if (!s) return;
  const grid = t.closest('.grid'); if (grid){ ev.stopImmediatePropagation(); const e = curEl(); if (!e) return; snapshotOnce('데이터 편집'); e.p = Object.assign({}, ASSETS[e.asset].d, e.p || {}); e.p[grid.dataset.gp] = gridString(grid); changed(s, {noCanvas:false}); return; }
  if (t.dataset.tr){ ev.stopImmediatePropagation(); snapshot('전환 효과'); s.tr = t.value; changed(s, {noCanvas:true}); }
}, true);
$('#panel').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return; const s = cur();
  if (b.dataset.cmd){ ev.stopImmediatePropagation(); CMD[b.dataset.cmd].run(); if (tab !== 'props') renderPanel(); return; }
  if (b.dataset.ver){ ev.stopImmediatePropagation(); if (b.dataset.armed){ restoreVersion(b.dataset.ver); } else { b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 복원'; } return; }
  if (b.id === 'bAiDeck'){ ev.stopImmediatePropagation(); aiScope = 'deck'; placeAI(true); runAI(QUICK.polish); return; }
  const grid = b.closest('.grid');
  if (grid && (b.dataset.addrow || b.dataset.rm != null)){ ev.stopImmediatePropagation(); const e = curEl(); if (!e) return; snapshot('데이터 편집'); let rows = lines(e.p[grid.dataset.gp]).map(cells);
    if (b.dataset.addrow){ const nc = Math.max(...rows.map(r => r.length)); rows.push(Array(nc).fill('')); rows[rows.length - 1][0] = '새 항목'; } else rows.splice(+b.dataset.rm, 1);
    e.p[grid.dataset.gp] = rows.map(r => r.join('|')).join('\n'); changed(s, {panel:true}); return; }
  const iss = b.closest('.iss'); if (iss){ ev.stopImmediatePropagation(); curId = iss.dataset.s; clearSel(); if (iss.dataset.e) selId = iss.dataset.e; renderThumbs(); renderCanvas(); renderStatus(); return; }
  const ly = b.closest('.layers .ly'); if (ly && s){ ev.stopImmediatePropagation(); const id = ly.dataset.id; const e = s.els.find(x => x.id === id); if (!e) return;
    if (b.dataset.a === 'sel'){ if (ev.shiftKey){ if (multi.has(id) || selId === id){ multi.delete(id); if (selId === id) selId = [...multi].pop() || null; } else { if (selId) multi.add(selId); multi.add(id); selId = id; } if (multi.size === 1){ selId = [...multi][0]; multi.clear(); } } else selectIds([id]); renderCanvas(); renderLayers($('#panel')); placeAI(); }
    else { snapshot(b.dataset.a === 'hide' ? '숨기기 전환' : '잠금 전환'); e[b.dataset.a === 'hide' ? 'hidden' : 'lock'] = !e[b.dataset.a === 'hide' ? 'hidden' : 'lock']; changed(s); renderLayers($('#panel')); }
    return; }
}, true);
document.querySelectorAll('#insSeg button').forEach(b => b.onclick = () => { insTab = b.dataset.ins; renderPanel(); });

/* ============ AGENT: scoped requests, preview, partial accept, one undo step ============ */
let aiScope = 'sel', review = null;
function scopeEls(){ const s = cur(); if (!s) return []; return aiScope === 'slide' ? s.els.filter(e => !isBg(e)) : selected(); }
async function runAIv2(instr){
  if (!sample || !instr) return;
  if (aiRange) return runText(instr);
  if (review) endReview(false);
  const s = cur(); if (!s) return;
  let input, deckMode = aiScope === 'deck';
  if (deckMode){
    const pack = list().map(x => ({slide:x.id, title:plainTitle(x), texts:x.els.filter(e => e.type === 'text').map(e => ({id:e.id, html:clean(e.html)})), notes:(x.notes || '').slice(0, 900)}));
    input = `${STYLE}\n\n${FACTS}\n\n덱 전체:\n${JSON.stringify(pack)}\n\n요청: ${instr}\n\n고칠 곳만 JSON 객체 하나로 출력: {"changes":[{"slide":"장표 id","id":"텍스트 요소 id","html":"고친 내용"}],"notes":[{"slide":"장표 id","text":"고친 발표 스크립트 전체"}],"summary":"20자 이내"}. 고칠 필요가 없는 곳은 넣지 않는다.`;
  } else {
    const sel = scopeEls(); if (!sel.length) return;
    const others = s.els.filter(e => !sel.includes(e)).map(e => ({id:e.id, type:e.type, x:e.x, y:e.y, w:e.w, h:e.h, ...(e.type === 'text' ? {text:plain(e.html).slice(0, 80)} : e.type === 'asset' ? {asset:e.asset} : {})}));
    input = `${STYLE}\n\n${FACTS}\n\n${CANVAS}\n\n덱 흐름:\n${outline()}\n\n현재 장 제목: ${plainTitle(s)}\n현재 장 발표 스크립트: ${(s.notes || '').slice(0, 900)}\n선택하지 않은 요소(참고용, 건드리지 말 것): ${JSON.stringify(others)}\n\n선택한 요소:\n${JSON.stringify(sel.map(slim))}\n\n요청: ${instr}\n\nJSON 객체 하나만 출력: {"replace":[선택한 요소를 고친 전체 객체, 같은 id 유지], "add":[새로 추가할 요소, id 없이], "remove":[지울 요소 id], "notes":"발표 스크립트를 고쳐야 하면 전체 문장, 아니면 생략", "summary":"바꾼 내용 20자 이내"}`;
  }
  setBusy(true); aiCtl = new AbortController();
  try {
    const out = await sample.json(input, {signal:aiCtl.signal, modelTier:deckMode ? 'complex' : 'default'});
    const ch = [];
    if (deckMode){
      (Array.isArray(out && out.changes) ? out.changes : []).forEach(c => { const sl = slides.find(x => x.id === c.slide); const e = sl && sl.els.find(x => x.id === c.id && x.type === 'text'); if (e && typeof c.html === 'string' && clean(c.html) !== clean(e.html)) ch.push({kind:'text', slide:sl.id, id:e.id, html:clean(c.html), label:`${list().indexOf(sl) + 1}장 · ${plain(c.html).slice(0, 40)}`}); });
      (Array.isArray(out && out.notes) ? out.notes : []).forEach(c => { const sl = slides.find(x => x.id === c.slide); if (sl && typeof c.text === 'string' && c.text.trim() && c.text !== sl.notes) ch.push({kind:'notes', slide:sl.id, text:c.text, label:`${list().indexOf(sl) + 1}장 · 발표 스크립트`}); });
    } else {
      const ids = new Set(scopeEls().map(e => e.id));
      (Array.isArray(out && out.replace) ? out.replace : []).forEach(r => { if (!r || !ids.has(r.id)) return; const v = vEl(r); if (v) ch.push({kind:'replace', slide:s.id, id:r.id, el:{...v, id:r.id}, label:'수정 · ' + elName(v)}); });
      (Array.isArray(out && out.remove) ? out.remove : []).forEach(id => { if (ids.has(id)){ const e = s.els.find(x => x.id === id); ch.push({kind:'remove', slide:s.id, id, label:'삭제 · ' + (e ? elName(e) : id)}); } });
      (Array.isArray(out && out.add) ? out.add : []).slice(0, 8).forEach(a => { const v = vEl(a); if (v){ v.id = nid('e'); ch.push({kind:'add', slide:s.id, el:v, label:'추가 · ' + elName(v)}); } });
      if (out && typeof out.notes === 'string' && out.notes.trim()) ch.push({kind:'notes', slide:s.id, text:out.notes, label:'발표 스크립트 수정'});
    }
    if (!ch.length){ toast('바꿀 내용이 없었습니다'); return; }
    startReview(ch, String((out && out.summary) || 'AI 편집').slice(0, 40));
    $('#aiq').value = '';
  } catch (err){ aiFail(err); } finally { setBusy(false); aiCtl = null; placeAI(true); }
}
function startReview(changes, summary){
  const sids = [...new Set(changes.map(c => c.slide))];
  review = {changes:changes.map(c => ({...c, on:true})), summary, pre:sids.map(id => ({id, data:clone(slides.find(x => x.id === id))}))};
  applyReview(); renderReview();
}
function applyReview(){
  review.pre.forEach(p => { const i = slides.findIndex(x => x.id === p.id); slides[i] = clone(p.data); });
  review.changes.filter(c => c.on).forEach(c => { const s = slides.find(x => x.id === c.slide); if (!s) return;
    if (c.kind === 'text'){ const e = s.els.find(x => x.id === c.id); if (e) e.html = c.html; }
    if (c.kind === 'notes') s.notes = c.text;
    if (c.kind === 'replace'){ const i = s.els.findIndex(x => x.id === c.id); if (i >= 0){ const old = s.els[i]; s.els[i] = {...c.el, g:old.g}; } }
    if (c.kind === 'remove') s.els = s.els.filter(x => x.id !== c.id);
    if (c.kind === 'add') s.els.push(clone(c.el)); });
  renderThumbs(); renderCanvas(); renderStatus();
}
function renderReview(){
  const box = $('#aireview'); if (!review){ box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<div class="rh"><b>${esc(review.summary)}</b><span>${review.changes.filter(c => c.on).length}/${review.changes.length}개 적용 예정</span></div>
    <div class="rl">${review.changes.map((c, i) => `<label><input type="checkbox" data-ri="${i}" ${c.on ? 'checked' : ''}><span>${esc(c.label)}</span></label>`).join('')}</div>
    <div class="rb"><button type="button" class="btn primary" data-rv="ok">적용</button><button type="button" class="btn" data-rv="no">모두 취소</button></div>`;
  placeAI(true);
}
function endReview(accept){
  if (!review) return; const r = review; review = null;
  if (accept && r.changes.some(c => c.on)){
    undo.push({label:'AI: ' + r.summary, items:r.pre.map(p => ({id:p.id, data:p.data})), cur:curId}); redo.length = 0;
    r.pre.forEach(p => { const s = slides.find(x => x.id === p.id); if (s) changed(s, {noCanvas:true}); });
    const keep = r.changes.filter(c => c.on && (c.kind === 'replace' || c.kind === 'add') && c.slide === curId).map(c => c.kind === 'add' ? c.el.id : c.id);
    if (keep.length) selectIds(keep); toast('AI 편집을 적용했습니다', true);
  } else { r.pre.forEach(p => { const i = slides.findIndex(x => x.id === p.id); slides[i] = clone(p.data); }); }
  renderReview(); renderAll(); placeAI();
}
$('#aibar').addEventListener('change', ev => { const t = ev.target; if (t.dataset.ri != null && review){ review.changes[+t.dataset.ri].on = t.checked; applyReview(); renderReview(); } });
$('#aibar').addEventListener('click', ev => { const b = ev.target.closest('[data-rv],[data-scope]'); if (!b) return; ev.stopImmediatePropagation();
  if (b.dataset.rv) endReview(b.dataset.rv === 'ok');
  if (b.dataset.scope){ aiScope = b.dataset.scope; document.querySelectorAll('#aiScope button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.scope === aiScope))); placeAI(true); }
}, true);

runAI = runAIv2;
/* ============ PRESENT (Reveal.js) ============ */
let rv = null; let wentFull = false; let presentFromCurrent = false;
function fmt(m){ if (m == null || m === '') return ''; const t = Math.round(parseFloat(m) * 60); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
function present(){
  if (editingText) finishText();
  if (typeof Reveal === 'undefined') { return; }
  const L = list(); const start = presentFromCurrent ? Math.max(0, L.findIndex(s => s.id === curId)) : 0; presentFromCurrent = false;
  const ov = $('#present'); ov.hidden = false;
  ov.querySelector('.slides').innerHTML = L.map(s => `<section data-id="${esc(s.id)}" data-transition="${['fade', 'slide', 'convex', 'zoom', 'none'].includes(s.tr) ? s.tr : 'fade'}"><div class="stage">${slideHTML(s, 'present')}</div></section>`).join('');
  rv = new Reveal(ov.querySelector('.reveal'), {width:1600, height:900, margin:0, minScale:0.05, maxScale:4, center:false, hash:false, history:false, embedded:true, keyboardCondition:null,
    controls:false, controlsTutorial:false, progress:true, transition:'fade', transitionSpeed:'fast', backgroundTransition:'none', overview:true, keyboard:{27: exitPresent, 78: openSpeaker, 83: openSpeaker}});
  rv.initialize().then(() => { rv.slide(start); updNotes(); pbStart(); });
  rv.on('slidechanged', updNotes); rv.on('fragmentshown', updNotes); rv.on('fragmenthidden', updNotes); rv.on('slidechanged', updSpeaker); rv.on('fragmentshown', updSpeaker);
  const req = ov.requestFullscreen ? ov.requestFullscreen() : null;
  if (req && req.then) req.then(() => { wentFull = true; }).catch(() => {});
}
/* speaker view: a separate window with current + next slide, script and timer; the audience screen never shows notes */
let spk = null;
const spkTotKey = () => 'cuda-studio-total:' + deckId + ':' + deck;
function pbTotal(){ try { const v = +localStorage.getItem(spkTotKey()); if (v > 0 && v < 600) return v; } catch (_) {} return deck === '5' ? 5 : 20; }
function setTotal(v){ v = Math.max(1, Math.min(599, Math.round(+v || 0))); try { localStorage.setItem(spkTotKey(), String(v)); } catch (_) {} pbTick(); updSpeaker(); }
function openSpeaker(){
  if (spk && !spk.closed){ spk.focus(); return; }
  let w = null; try { w = window.open('', 'cuda-speaker', 'popup,width=1280,height=800'); } catch (_) { w = null; }
  if (!w || !w.document){ toggleNotes(); toast('팝업이 막혀 이 화면에 대본을 표시합니다. 청중 화면과 같은 화면이면 대본이 함께 보입니다'); return; }
  spk = w; const abs = u => new URL(u, location.href).href;
  w.document.open(); w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>발표자 보기</title>
<link rel="stylesheet" href="${abs('studio.css')}"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>html,body{margin:0;height:100%;background:#0b0b0b;color:#eee;font:400 15px/1.5 Inter,"Noto Sans KR",sans-serif;overflow:hidden}
#sv{display:grid;grid-template-columns:1.6fr 1fr;grid-template-rows:auto 1fr auto;gap:16px;height:100%;padding:16px;box-sizing:border-box}
#sv header{grid-column:1/3;display:flex;align-items:center;gap:20px}#sv .t{font:700 34px/1 Inter;font-variant-numeric:tabular-nums}#sv .t.over{color:#ff6b6b}
#sv .rem{color:#999}#sv .pos{margin-left:auto;color:#aaa;font-variant-numeric:tabular-nums}
#sv label{display:flex;align-items:center;gap:6px;color:#999}#sv input{width:56px;background:#151515;border:1px solid #333;color:#eee;border-radius:6px;padding:4px 6px}
.pv{position:relative;background:#000;border:1px solid #2d2d2d;border-radius:8px;overflow:hidden}.pv .stage{position:absolute;left:0;top:0;transform-origin:0 0}
.cur{aspect-ratio:16/9;align-self:start}.side{display:grid;grid-template-rows:auto auto 1fr;gap:10px;min-height:0}.side .lbl{color:#888;font-size:12px}
.nx{aspect-ratio:16/9}.notes{overflow:auto;background:#121212;border:1px solid #2d2d2d;border-radius:8px;padding:14px 16px;font-size:20px;line-height:1.6;white-space:pre-wrap}
footer{grid-column:1/3;display:flex;gap:8px}footer button{background:#1d1d1d;border:1px solid #333;color:#eee;border-radius:8px;padding:8px 16px;font:500 14px Inter,sans-serif;cursor:pointer}footer button:hover{border-color:#76b900}
.bar{height:4px;background:#222;border-radius:2px;flex:1;overflow:hidden}.bar i{display:block;height:100%;background:#76b900}</style></head>
<body><div id="sv"><header><span class="t">00:00</span><span class="rem"></span><label>전체 <input id="tot" type="number" min="1" max="599"> 분</label><div class="bar"><i></i></div><span class="pos"></span></header>
<div class="pv cur"></div><div class="side"><div class="lbl">다음 장표</div><div class="pv nx"></div><div class="notes"></div></div>
<footer><button data-a="prev">이전</button><button data-a="next">다음</button><button data-a="reset">타이머 다시 시작</button><button data-a="close">발표 종료</button></footer></div></body></html>`);
  w.document.close();
  const d = w.document; d.getElementById('tot').value = pbTotal();
  d.getElementById('tot').addEventListener('change', ev => setTotal(ev.target.value));
  d.addEventListener('click', ev => { const b = ev.target.closest('[data-a]'); if (!b || !rv) return; const a = b.dataset.a; if (a === 'prev') rv.prev(); if (a === 'next') rv.next(); if (a === 'reset'){ pbT0 = Date.now(); pbTick(); } if (a === 'close'){ exitPresent(); } });
  d.addEventListener('keydown', ev => { if (!rv) return; if (['ArrowRight', 'PageDown', ' ', 'ArrowDown'].includes(ev.key)){ ev.preventDefault(); rv.next(); } if (['ArrowLeft', 'PageUp', 'ArrowUp'].includes(ev.key)){ ev.preventDefault(); rv.prev(); } if (ev.key === 'Escape') exitPresent(); });
  w.addEventListener('resize', updSpeaker); updSpeaker();
}
function updSpeaker(){
  if (!spk || spk.closed || !rv) return; const d = spk.document; const L = list(); const sec = rv.getCurrentSlide(); const i = L.findIndex(x => x.id === (sec && sec.dataset.id)); const s = L[i], nx = L[i + 1];
  const put = (sel, sl) => { const box = d.querySelector(sel); if (!box) return; box.innerHTML = sl ? `<div class="stage static">${slideHTML(sl, 'thumb')}</div>` : '<p style="padding:16px;color:#777">마지막 장표</p>'; const st = box.firstElementChild; if (st && st.classList.contains('stage')) st.style.transform = `scale(${box.clientWidth / 1600})`; };
  put('.cur', s); put('.nx', nx); d.querySelector('.notes').textContent = s ? (s.notes || '') : '';
  d.querySelector('.pos').textContent = `${i + 1} / ${L.length}`; d.querySelector('.bar i').style.width = (rv.getProgress() * 100) + '%';
}
function toggleNotes(){ $('#pNotes').classList.toggle('on'); const b = $('#pBar [data-pb=notes]'); if (b) b.setAttribute('aria-pressed', String($('#pNotes').classList.contains('on'))); }
/* presenter bar: position, timeline, 20-minute clock, autoplay paced by each slide's allotted minutes */
let pbT0 = 0, pbClock = null, pbAuto = null;
function pbUpdate(){
  if (!rv) return; const tot = rv.getTotalSlides(); const i = rv.getIndices().h; const pg = rv.getProgress();
  $('#pBar .pos').textContent = `${String(i + 1).padStart(2, '0')} / ${String(tot).padStart(2, '0')}`; $('#pBar .tl i').style.width = (pg * 100) + '%';
}
function pbTick(){ const sec = Math.floor((Date.now() - pbT0) / 1000); const mm = String(Math.floor(sec / 60)).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0'); const tot = pbTotal(); $('#pBar .clock').textContent = `${mm}:${ss} / ${String(tot).padStart(2, '0')}:00`;
  if (spk && !spk.closed){ const d = spk.document; const t = d.querySelector('.t'); if (t){ t.textContent = `${mm}:${ss}`; t.classList.toggle('over', sec > tot * 60); const r = tot * 60 - sec; d.querySelector('.rem').textContent = r >= 0 ? `남은 시간 ${Math.floor(r / 60)}분 ${r % 60}초` : `${Math.floor(-r / 60)}분 ${-r % 60}초 초과`; } } }
function pbStart(){ pbT0 = Date.now(); clearInterval(pbClock); pbClock = setInterval(pbTick, 1000); pbTick(); pbUpdate(); rv.on('slidechanged', pbUpdate); rv.on('fragmentshown', pbUpdate); rv.on('fragmenthidden', pbUpdate); }
function pbStop(){ clearInterval(pbClock); pbClock = null; pbPlay(false); }
function pbStep(){
  if (!rv) return; const sec = rv.getCurrentSlide(); const s = slides.find(x => x.id === (sec && sec.dataset.id));
  const steps = (sec ? sec.querySelectorAll('.fragment').length : 0) + 1; const m = s ? (deck === '5' ? s.min5 : s.min) : null;
  return Math.max(2500, ((+m || 1) * 60000) / steps);
}
function pbPlay(on){
  clearTimeout(pbAuto); pbAuto = null; const b = $('#pBar [data-pb=play]'); if (b){ b.setAttribute('aria-pressed', String(!!on)); b.textContent = on ? '일시정지' : '재생'; }
  if (!on || !rv) return; const go = () => { if (!rv) return; if (rv.isLastSlide() && !rv.availableFragments().next){ pbPlay(false); return; } rv.next(); pbAuto = setTimeout(go, pbStep()); }; pbAuto = setTimeout(go, pbStep());
}
$('#pBar').addEventListener('click', ev => { const b = ev.target.closest('[data-pb]'); if (!b || !rv) return; const a = b.dataset.pb;
  if (a === 'prev') rv.prev(); if (a === 'next') rv.next(); if (a === 'play') pbPlay(b.getAttribute('aria-pressed') !== 'true'); if (a === 'notes') openSpeaker();
  if (a === 'time'){ const v = prompt('전체 발표 시간 (분)', String(pbTotal())); if (v) setTotal(v); }
  if (a === 'full'){ const ov = $('#present'); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else if (ov.requestFullscreen) ov.requestFullscreen().then(() => { wentFull = true; }).catch(() => {}); } });
function updNotes(){
  if (!rv) return; const sec = rv.getCurrentSlide(); const s = slides.find(x => x.id === (sec && sec.dataset.id)); if (!s) return;
  const L = list().filter(x => x.kind === 'content'); const n = L.indexOf(s); const m = deck === '5' ? s.min5 : s.min;
  const pn = $('#pNotes'); pn.textContent = s.notes || '';
  const tm = document.createElement('div'); tm.className = 'tm'; tm.textContent = (n >= 0 ? `${n + 1} / ${L.length}` : '') + (m ? ' · ' + fmt(m) : ''); pn.prepend(tm);
  curId = s.id;
}
function exitPresent(){
  if (!rv) return; pbStop(); try { rv.destroy(); } catch (_) {} rv = null; if (spk && !spk.closed) spk.close(); spk = null;
  const ov = $('#present'); ov.hidden = true; ov.querySelector('.slides').innerHTML = ''; $('#pNotes').classList.remove('on');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  wentFull = false; selId = null; renderAll();
}
document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement || !wentFull || !rv) return; wentFull = false; if (!(spk && !spk.closed)) exitPresent(); });
$('#bPlay').onclick = ev => { presentFromCurrent = ev.shiftKey || ev.altKey; present(); };
let hotT; $('#present').addEventListener('mousemove', () => { const o = $('#present'); o.classList.add('hot'); clearTimeout(hotT); hotT = setTimeout(() => o.classList.remove('hot'), 1600); });

/* ============ THEME + MASTER: deck-wide colors, fonts and slide chrome ============ */
const THEME0 = {accent:'#76b900', ink:'#0b1200', bg:'#000000', card:'#151515', line:'#2d2d2d', t1:'#ffffff', t2:'#aaaaaa', t3:'#888888', font:'sans', trk:true, rule:true, pg:true, foot:true, bgfx:1};
let theme = {...THEME0};
const themeDoc = () => 'themes/' + deckId;
const hex = v => /^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : null;
function cleanTheme(v){ const o = {...THEME0}; if (!v || typeof v !== 'object') return o; ['accent', 'ink', 'bg', 'card', 'line', 't1', 't2', 't3'].forEach(k => { if (hex(v[k])) o[k] = v[k]; }); if (FONTS[v.font]) o.font = v.font; ['trk', 'rule', 'pg', 'foot'].forEach(k => { if (typeof v[k] === 'boolean') o[k] = v[k]; }); o.bgfx = num(v.bgfx, 0, 2, 1); return o; }
function applyTheme(){
  let st = $('#themeCss'); if (!st){ st = document.createElement('style'); st.id = 'themeCss'; document.head.appendChild(st); }
  const t = theme; st.textContent = `.stage{--g:${t.accent};--g-ink:${t.ink};--bg:${t.bg};--card:${t.card};--line:${t.line};--t1:${t.t1};--t2:${t.t2};--t3:${t.t3};--sans:${FONTS[t.font].css === 'var(--sans)' ? '"Inter","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif' : FONTS[t.font].css}}
${t.trk ? '' : '.stage .trk{display:none}'}${t.rule ? '' : '.stage .rule{display:none}'}${t.pg ? '' : '.stage .pg{display:none}'}${t.foot ? '' : '.stage .foot{display:none}'}
.stage .bgfx{opacity:${t.bgfx}}`;
}
let themeUnsub = null, themeT = null;
function subTheme(){
  if (themeUnsub){ themeUnsub(); themeUnsub = null; }
  if (!store.db){ try { theme = cleanTheme(JSON.parse(localStorage.getItem(lsKey() + ':theme') || 'null')); } catch (_) { theme = {...THEME0}; } applyTheme(); return; }
  themeUnsub = store.db.doc(themeDoc()).onSnapshot(d => { if (d && d.exists && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.thm'))){ theme = cleanTheme(d.data()); applyTheme(); renderThumbs(); if (tab === 'theme') renderPanel(); } }, () => {});
}
function saveTheme(){ applyTheme(); clearTimeout(themeT); themeT = setTimeout(async () => { if (store.db){ try { await store.db.doc(themeDoc()).set({...theme, at:Date.now()}); } catch (_) { toast('테마를 저장하지 못했습니다'); } } else { try { localStorage.setItem(lsKey() + ':theme', JSON.stringify(theme)); } catch (_) {} } renderThumbs(); }, 400); }
function renderTheme(P){
  const c = (k, l) => `<label class="fld thm-c"><span>${l}</span><input type="color" data-th="${k}" value="${theme[k]}"></label>`;
  const b = (k, l) => `<label class="chk"><input type="checkbox" data-th="${k}" ${theme[k] ? 'checked' : ''}>${l}</label>`;
  P.innerHTML = `<div class="thm"><div class="grp"><div class="lbl">색상</div><div class="row2">${c('accent', '강조')}${c('bg', '배경')}${c('card', '카드')}${c('line', '구분선')}${c('t1', '본문')}${c('t2', '보조')}</div></div>
    <div class="grp"><div class="lbl">글꼴</div><select class="inp" data-th="font">${Object.entries(FONTS).map(([k, f]) => `<option value="${k}" ${theme.font === k ? 'selected' : ''}>${f.n}</option>`).join('')}</select></div>
    <div class="grp"><div class="lbl">마스터 (모든 본문 장표)</div>${b('trk', '섹션 트래커')}${b('rule', '제목 아래 구분선')}${b('pg', '쪽 번호')}${b('foot', '하단 출처')}
      <label class="rng"><span>배경 효과</span><input type="range" data-th="bgfx" min="0" max="2" step="0.1" value="${theme.bgfx}"></label></div>
    <div class="grp"><button class="btn" type="button" id="bThemeReset">기본 테마로</button></div></div>`;
}
$('#panel').addEventListener('input', ev => { const t = ev.target; if (!t.dataset.th) return; ev.stopImmediatePropagation(); const k = t.dataset.th;
  if (t.type === 'checkbox') theme[k] = t.checked; else if (t.type === 'range') theme[k] = +t.value; else theme[k] = t.value; theme = cleanTheme(theme); saveTheme(); }, true);
$('#panel').addEventListener('click', ev => { if (ev.target.closest('#bThemeReset')){ ev.stopImmediatePropagation(); theme = {...THEME0}; saveTheme(); renderPanel(); } }, true);

/* ============ PRESENCE + COMMENTS ============ */
let room = null, userApi = null, commentsApi = null, peerNames = {};
async function initCollab(){
  try { userApi = window.claude && window.claude.use ? await window.claude.use('user') : null; } catch (_) { userApi = null; }
  try { room = window.claude && window.claude.use ? await window.claude.use('room') : null; } catch (_) { room = null; }
  try { commentsApi = window.claude && window.claude.use ? await window.claude.use('comments') : null; } catch (_) { commentsApi = null; }
  $('#bComment').hidden = !commentsApi;
  if (room){ sendPresence(); room.onPeers(ch => renderPeers(ch.peers)); }
}
function sendPresence(){ if (room) Promise.resolve().then(() => room.presence({slide:curId || null, deck:deckId})).catch(() => {}); }
async function renderPeers(peers){
  const others = (peers || []).filter(x => !x.isMe && x.kind === 'viewer'); const box = $('#peers');
  const ids = [...new Set(others.map(x => x.by).filter(Boolean))];
  if (userApi && ids.length){ try { const ps = await userApi.profiles(ids); ids.forEach(i => { peerNames[i] = (ps[i] && ps[i].name) || ''; }); } catch (_) {} }
  box.innerHTML = '';
  others.slice(0, 6).forEach(x => { const nm = peerNames[x.by] || '다른 발표자'; const pr = x.presence || {}; const b = document.createElement('button'); b.type = 'button'; b.className = 'peer';
    b.textContent = nm.trim().slice(0, 1) || '·'; const sl = typeof pr.slide === 'string' ? pr.slide : null; const n = sl ? list().findIndex(s => s.id === sl) : -1;
    b.title = `${nm}${n >= 0 ? ` · ${n + 1}번 장표 보는 중` : ''}`; b.setAttribute('aria-label', b.title);
    if (n >= 0 && pr.deck === deckId) b.onclick = () => { curId = sl; clearSel(); renderAll(); };
    box.appendChild(b); });
  if (others.length > 6){ const m = document.createElement('span'); m.className = 'peer more'; m.textContent = '+' + (others.length - 6); box.appendChild(m); }
}
$('#bComment').addEventListener('click', async () => {
  if (!commentsApi) return; const n = selId ? canvas.querySelector(`.el[data-id="${CSS.escape(selId)}"]`) : canvas;
  try { const r = await commentsApi.openComposer({element:n || canvas}); if (r && r.opened === false) toast('댓글 창을 열 수 없습니다. 페이지를 한 번 클릭한 뒤 다시 시도해 주세요'); } catch (_) { toast('이 화면에서는 댓글을 쓸 수 없습니다'); }
});

function announce(t){ let r = $('#sr'); if (!r){ r = document.createElement('div'); r.id = 'sr'; r.setAttribute('aria-live', 'polite'); r.className = 'sr-only'; document.body.appendChild(r); } r.textContent = ''; setTimeout(() => { r.textContent = t; }, 30); }
canvas.tabIndex = 0; canvas.setAttribute('role', 'application'); canvas.setAttribute('aria-roledescription', '슬라이드 편집 영역'); canvas.setAttribute('aria-label', '슬라이드 편집 영역. Tab으로 요소 선택, 화살표로 이동, Enter로 글자 편집');

/* ============ BOOT ============ */
new ResizeObserver(() => { fitCanvas(); fitThumbs(); placeAI(); }).observe($('#viewport'));
loadLocal(); renderAll(); fitCanvas(); setSync('local'); renderDecks();
$('#genSec').innerHTML = '<option value="-1">Take home</option>' + SECTIONS.map((t, i) => `<option value="${i}">${esc(t)}</option>`).join('');
connect().then(() => subTheme()); initAI(); initDesktop(); subVersions(); renderStatus(); initCollab(); applyTheme();
window.__st = {cur:() => cur(), curEl:() => curEl(), sel:() => selId, multi:() => [...multi], slides:() => slides, list:() => list()};
})();