#!/usr/bin/env python3
"""Write editorial/QUEUE.md from the slate_review fields in editorial/proposals.json."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=json.loads((ROOT/'editorial/proposals.json').read_text())
T=json.loads((ROOT/'editorial/themes.json').read_text())
R=lambda p:p['slate_review']
q=sorted((p for p in P if R(p)['release_queue']),key=lambda p:R(p)['release_queue'])
out=['# 게시 대기열','','`python3 tools/slate.py`가 `proposals.json`의 `slate_review`와 `themes.json`에서 만든다. 손으로 고치지 않는다.','','시즌은 테마 하나를 6편으로 다룬다. 첫 편이 아는 이름으로 문을 열고, 2번째와 4번째 자리에 그 테마의 뿌리 이야기가 온다. 연도는 대략이며 검증 전이다.','']
season=None
for p in q:
    r=R(p)
    if r['season']!=season:
        season=r['season']; t=T[r['theme']]
        out+=['',f"## 시즌 {season} · {t['title']}",'',t['about'],'','| 순번 | 편 | 무렵 | 무게 | 작업 제목 | 메모 |','|---|---|---|---|---|---|']
    note=' · '.join(x for x in [p.get('premise'),r['reframe'],r['reason']] if x)
    out.append(f"| {r['release_queue']} | {p['p_id']} | {r['year_approx'] or ''} | {r['weight'] or ''} | {p['title_en']} | {note} |")
for status,title in [('CUT','제외'),('MERGED','병합'),('HOLD_PUBLIC_SOURCES','보류: 현업·고객사 인접')]:
    rows=[p for p in P if R(p)['status']==status]
    out+=['',f"## {title} ({len(rows)})",'','| 편 | 작업 제목 | 사유 |','|---|---|---|']
    out+=[f"| {p['p_id']} | {p['title_en']} | {('→ '+R(p)['merged_into']) if R(p)['merged_into'] else (R(p)['reason'] or '')} |" for p in rows]
(ROOT/'editorial/QUEUE.md').write_text('\n'.join(out)+'\n')
print(len(q),'queued')
