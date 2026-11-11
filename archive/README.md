# 보관함

대체된 문서와 채택하지 않은 안. 현재 기준으로 인용하지 않고, 고치지 않는다. 채택·보관 이유는 [DECISIONS.md](../DECISIONS.md)의 "충돌했던 항목" 표에 있다.

## 2026-11-11-pre-formula

| 보관된 것 | 대체한 것 | 보관 이유 |
|---|---|---|
| `channel/AUDIENCE.md`, `channel/CHARTER.md` | `channel/CHANNEL.md` + JSON | 같은 관객 정의가 여러 문서에 반복 |
| `channel/SOURCES.md` | `channel/sources.json` | JSON의 요약 사본. H/P 계보 설명 문단 포함 |
| `CONTRIBUTING.md` | `ops/WORKFLOW.md` | 같은 절차의 축약 사본 |
| `editorial/catalog.csv` | `editorial/catalog.json` | JSON의 부분 사본 |
| `verification/` | `work/` 원장, CI | 저장소 자체 구축(TASK-000) 검토 기록. `migration-baseline.json`만 `editorial/lineage-baseline.json`으로 옮겨 계속 사용 |

대체 전 `README.md`, `DECISIONS.md`, `PLAYBOOK.md`, `PROGRAMMING.md`, `MEASUREMENT.md`, `WORKFLOW.md`의 원문은 git 이력(커밋 `a11b495`)과 `work/deliveries/TASK-000-r0002/artifacts/`에 있다. `work/` 원장(제출 스냅샷·리뷰)은 옮기지 않았다.

보관된 안: 완성본 10편 뒤 개국, 8–9분 단일 형식, 20분 전환, 모든 산출물 세 역할 리뷰, ja·de 동시 확장, 임계값 없는 측정.
