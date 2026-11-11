#!/usr/bin/env python3
"""Write editorial/QUEUE.md from the slate_review fields in editorial/proposals.json."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=json.loads((ROOT/'editorial/proposals.json').read_text())
R=lambda p:p['slate_review']
q=sorted((p for p in P if R(p)['release_queue']),key=lambda p:R(p)['release_queue'])
out=['# 게시 대기열','','`python3 tools/slate.py`가 `proposals.json`의 `slate_review`에서 만든다. 손으로 고치지 않는다.','','시즌 1–4는 확정 순서, 시즌 5부터는 예고편 선별 뒤 다시 매기는 잠정 순서다.','']
season=None
for p in q:
    r=R(p)
    if r['season']!=season:
        season=r['season']; out+=['',f"## 시즌 {season}",'','| 순번 | 편 | 등급 | 문 | 작업 제목 | 메모 |','|---|---|---|---|---|---|']
    out.append(f"| {r['release_queue']} | {p['p_id']} | {r['tier']} | {r['door']} | {p['title_en']} | {r['note'] or ''} |")
for status,title in [('HOLD_PUBLIC_SOURCES','보류: 공개 출처로 전부 채워진 뒤 편성'),('MERGED','병합'),('LATE','후순위: 구독자가 쌓인 뒤, 또는 다른 편의 한 장면으로')]:
    rows=[p for p in P if R(p)['status']==status]
    out+=['',f"## {title} ({len(rows)})",'','| 편 | 작업 제목 | 비고 |','|---|---|---|']
    out+=[f"| {p['p_id']} | {p['title_en']} | {('→ '+R(p)['merged_into']) if R(p)['merged_into'] else ''} |" for p in rows]
(ROOT/'editorial/QUEUE.md').write_text('\n'.join(out)+'\n')
print(len(q),'queued')
