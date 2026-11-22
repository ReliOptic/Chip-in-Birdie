# 261111 | 결정과 변경 이력

`USER_DIRECTIVE`는 직접 지시, `INHERITED`는 기존 계약의 보존, `IMPLEMENTED_POLICY`는 이번 운영 구현, `HYPOTHESIS`는 실제 검증할 전략, `UNKNOWN`은 미확인이다. `RECONCILIATION`은 기존 결정과 저장소/PR 증거의 시점·범위를 맞춘 해석이며 새 사용자 승인이나 편집 규칙이 아니다.

| ID | 상태 | 결정 | 이유·범위 |
|---|---|---|---|
| CIB-020 | USER_DIRECTIVE | 타깃은 채널 유입·재방문 관객으로 정의 | v1의 영상별 S1–S5 타깃 배정을 대체 |
| CIB-021 | USER_DIRECTIVE | 긴 비반도체 업무 후 자기 전에도 맥락을 이해하는 시청 조건 | 인구통계 추정이나 야간 업로드 규칙을 뜻하지 않음 |
| CIB-022 | USER_DIRECTIVE | 반도체 산업·기술을 시사상식·경영·경제·사회 맥락과 연결 | 각 편의 사건에서 필요한 인과를 설명 |
| CIB-023 | USER_DIRECTIVE | GitHub를 다중 모델 협업·상호 리뷰의 운영 공간으로 구성 | 현재 저장소의 콘텐츠·도구 반영 요청. 미디어 자동 게시 요청 아님 |
| CIB-024 | IMPLEMENTED_POLICY | 모든 활성 에피소드는 하나의 audience_ref 상속 | 영상별 타깃 필드를 제거하고 과거 값은 legacy 주제 분류로 이동 |
| CIB-025 | HYPOTHESIS | 시사·경제, 기업 선택, 기술 호기심, 역사·사회에서 유입 | 같은 사람이 겹칠 수 있으며 실제 Analytics로 확인할 대상 |
| CIB-026 | INHERITED | 영어 정본·KO 퍼포먼스·8–9분 기본 형식·H100 보존 | 길이는 알고리즘 최적값이 아니라 기존 제작 계약 |
| CIB-027 | IMPLEMENTED_POLICY | task/delivery/review/미디어 상태 분리 | 연구 문서 DONE이 영상 READY나 PUBLISHED가 되는 오류 방지 |
| CIB-028 | IMPLEMENTED_POLICY | actor/session 분리와 정확한 리비전 해시로 리뷰 | 다른 모델 family는 권장 가능, 사용하지 않은 모델을 표기하지 않음 |
| CIB-029 | INHERITED | 감독 HOTL와 제작 역할에서 분리된 독립 QA | 모든 쇼트의 수동승인 병목을 추가하지 않음 |
| CIB-030 | UNKNOWN | 실제 YouTube 관객·성과·현재 영상 READY 수 | 계정 데이터와 미디어 검수를 확보하기 전 null 유지 |
| CIB-031 | IMPLEMENTED_POLICY | 공개 운영 기준과 기획 색인만 저장소에 반영 | 비공개 원문·고객 자료·개인 피드백·자격증명은 복제하지 않음 |

## 변경 시 남길 것

`decision_id / date / changed_requirement / previous / next / authority_or_source / affected_artifacts / verification / remaining_unknowns`

최신 지시를 모든 세부안의 승인으로 확대하지 않는다. 제목·공개 순서·20분 전환·새 캐릭터·플랫폼 업로드를 이 변경으로 확정하지 않았다. 이후 실제 관측과 사용자 편집을 보존하며 필요한 항목만 수정한다.

## 2026-11-14 · Four-season execution directive

CIB-046 USER_DIRECTIVE: Four seasons of 7–8 full English-VO 3D documentary episodes; selected 8 each (32). editorial/seasons.json is the canonical season selection; existing H/P catalogs retain lineage. Prior 6-episode/trailer contracts are superseded for this task. PR #1 is recovered at 3c66e4b, not merged wholesale.

CIB-047 IMPLEMENTED_POLICY: Preserve 24 user-specified PR core episodes and add two existing PR candidates per season (P109/P078, P010/P099, P042/P044, P074/P076). Additions connect design interfaces, power constraints, bit economics and government procurement; they are new editorial judgments, not recovered user approvals of claims.

CIB-048 USER_DIRECTIVE: Sequential production cycle S1E01 → S2E01 → S3E01 → S4E01, followed by E02 cycle. Initial milestone four finished full episodes. NOT_STARTED at slate save; no document or teaser establishes READY.

CIB-049 IMPLEMENTED_POLICY: Target 8–9 minutes; 6–12 if the story needs it. English script and real VO lead animation timing. Documentary reconstructions and illustrative process models must be labeled. Historical 2022–23 export-control case requires dated rules; no statement of current legality. Original overclaiming titles retained only as provenance; reviewed working titles narrow them.

CIB-050 USER_DIRECTIVE: Stay in Chat; no new payments or YouTube uploads. Source code, reproducible playback, real audio and QA required; independent review still applies. Production binary outputs remain outside Git.

## 2026-11-22 · Canonical reconciliation (documentation only)

아래는 기존 지시와 확인된 GitHub 증거의 **적용 범위·시점**을 정렬한 결과다. 새로운 시즌 선택, 제목 승인, 제작 완료 또는 게시 승인이 아니다.

| ID | 종류 | 충돌처럼 보이는 항목과 정리 |
|---|---|---|
| CIB-055 | RECONCILIATION | **시즌 편수:** CIB-046의 4×8(32)이 유효한 선정 정본이다. 미병합 [PR #1](https://github.com/ReliOptic/Chip-in-Birdie/pull/1)의 시즌 6편·개국 3 READY+3 대본·주 1편 제안, [PR #2](https://github.com/ReliOptic/Chip-in-Birdie/pull/2)의 4×6(24편) 제안은 현재 승인된 운영 계약이 아니다. PR #1의 일부 P 기록만 검증 가능한 계보로 회수됐다. |
| CIB-056 | RECONCILIATION | **서로 다른 제작 목표:** CIB-048의 첫 사이클 완성본 4편은 초기 제작 이정표다. 기존 채널 헌장의 약 10편 READY 개국 완충 목표는 별도이며 4편이 10편을 대체하거나 10편이 최초 제작 순서를 뒤집지 않는다. 공개 날짜·빈도는 승인되지 않았다. |
| CIB-057 | RECONCILIATION | **길이와 형식:** 기본 8–9분/510초와 CIB-049의 작품별 6–12분 허용은 양립한다. 32편 영어 VO·3D 다큐 제작 방향과 CHARTER/PLAYBOOK의 장면별 실사·사료·2D·3D 선택도 양립한다. 특정 샷 문법·고정 비트 구조·풍자는 강제하지 않는다. |
| CIB-058 | RECONCILIATION | **진행 상태의 시간차:** `editorial/seasons.json`의 전편 `NOT_STARTED`는 2026-11-14 편성 **저장 당시 스냅샷**이다. `main`의 `TASK-002 OPEN`은 초기 범위다. [PR #4 R8](https://github.com/ReliOptic/Chip-in-Birdie/pull/4)의 현재 증거는 S1E01 `IN_REVIEW`, Sites v5 배포이며 독립 전체 영상 검수·사실·권리·청취 등 남은 항목 때문에 `READY`/YouTube `PUBLISHED`는 아니다(2026-11-22 확인). 초안 브랜치를 main에 무검토 복사하지 않는다. |
| CIB-059 | RECONCILIATION | **S1E01의 서사 변화:** 최초 `TSMC's No-Competition Promise`은 편성 당시 작업 제목/질문. 이후 CIB-051~054의 제작 지시 아래 R8은 *qualified capacity*와 제조 계약의 실질적 조건으로 전개했다. 동일 S1E01/H039의 발전된 **제작안**이며, 별도 신규 편이나 최종 제목·독립 편집 승인으로 취급하지 않는다. |
| CIB-060 | RECONCILIATION | **대기열과 제안의 위치:** `PROGRAMMING.md`의 TASK-001~003은 초기 준비 범위이며 CIB-048의 제작 순서를 대체하지 않는다. [PR #5](https://github.com/ReliOptic/Chip-in-Birdie/pull/5)의 외부 영상 벤치마크도 미병합 검토 자산이지 새 채널 정책은 아니다. |

**불변 범위:** H001–H100/P 제안의 계보, 32편의 선정·순서, 기존 리뷰·배송 리비전, 실제 배포 권한 및 파일은 수정하지 않았다. R8 제작 브랜치의 독립 QA와 승인 여부는 여전히 별도 확인 대상이다.
