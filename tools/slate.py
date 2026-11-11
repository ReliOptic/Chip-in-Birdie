#!/usr/bin/env python3
"""Write editorial/QUEUE.md from the slate_review fields in editorial/proposals.json."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=json.loads((ROOT/'editorial/proposals.json').read_text())
R=lambda p:p['slate_review']
q=sorted((p for p in P if R(p)['release_queue']),key=lambda p:R(p)['release_queue'])
out=['# 게시 대기열','','`python3 tools/slate.py`가 `proposals.json`의 `slate_review`에서 만든다. 손으로 고치지 않는다.','','시즌 1–4는 정한 순서, 시즌 5부터는 무게와 문으로 돌린 잠정 순서다. 무게 3은 산업의 구조나 방향을 바꾼 일, 2는 한 기술·회사의 전환점이다.','']
season=None
for p in q:
    r=R(p)
    if r['season']!=season:
        season=r['season']; out+=['',f"## 시즌 {season}",'','| 순번 | 편 | 무게 | 문 | 작업 제목 | 메모 |','|---|---|---|---|---|---|']
    note=' · '.join(x for x in [p.get('premise'),r['reframe'],r['reason']] if x)
    out.append(f"| {r['release_queue']} | {p['p_id']} | {r['weight'] or ''} | {r['door'] or ''} | {p['title_en']} | {note} |")
for status,title in [('CUT','제외'),('MERGED','병합'),('HOLD_PUBLIC_SOURCES','보류: 현업·고객사 인접')]:
    rows=[p for p in P if R(p)['status']==status]
    out+=['',f"## {title} ({len(rows)})",'','| 편 | 작업 제목 | 사유 |','|---|---|---|']
    out+=[f"| {p['p_id']} | {p['title_en']} | {('→ '+R(p)['merged_into']) if R(p)['merged_into'] else (R(p)['reason'] or '')} |" for p in rows]
(ROOT/'editorial/QUEUE.md').write_text('\n'.join(out)+'\n')
print(len(q),'queued')
