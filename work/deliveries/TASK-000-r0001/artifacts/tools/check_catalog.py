#!/usr/bin/env python3
"""Preserve the original H/P lineage while applying one channel audience."""
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
def read(name):
    return json.loads((ROOT/name).read_text())

catalog=read('editorial/catalog.json')
proposals=read('editorial/proposals.json')
baseline=read('verification/migration-baseline.json')
hs={e['h_id']:e for e in catalog}
ps={p['p_id']:p for p in proposals}
errors=[]
for hid,title_hash in baseline['original_title_sha256'].items():
    if hid not in hs:
        errors.append(f'Missing original ID: {hid}')
    elif hashlib.sha256(hs[hid]['source_working_title'].encode()).hexdigest()!=title_hash:
        errors.append(f'Original working title changed: {hid}; retain it and use a separate proposal/title field')
for pid,source_h_ids in baseline['proposal_lineage'].items():
    if pid not in ps or ps[pid]['source_h_ids']!=source_h_ids:
        errors.append(f'Original proposal lineage changed: {pid}')
for hid,e in hs.items():
    for pid in e['proposed_p_ids']:
        if pid not in ps or hid not in ps[pid]['source_h_ids']:
            errors.append(f'Broken H to P lineage: {hid} -> {pid}')
    for key in ['next_h_id','branch_h_id']:
        if e.get(key) and e[key] not in hs:
            errors.append(f'Unresolved episode link: {hid}/{key}')
for pid,p in ps.items():
    for hid in p['source_h_ids']:
        if hid not in hs or pid not in hs[hid]['proposed_p_ids']:
            errors.append(f'Broken P to H lineage: {pid} -> {hid}')
for file in ROOT.rglob('*.md'):
    if '.git' in file.parts or file.is_relative_to(ROOT/'work/deliveries'):
        continue
    for ref in re.findall(r'\]\(([^)]+)\)',file.read_text()):
        if re.match(r'^[a-z]+:',ref) or ref.startswith('#'):
            continue
        target=ref.split('#',1)[0]
        if target and not (file.parent/target).exists():
            errors.append(f'Broken document link: {file.relative_to(ROOT)} -> {ref}')
result={'status':'FAIL' if errors else 'PASS','preserved_original_H_ids':len(baseline['original_title_sha256']),'preserved_original_P_ids':len(baseline['proposal_lineage']),'errors':errors,'scope':'identity, original title and lineage preservation; not factual or media QA'}
print(json.dumps(result,ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
