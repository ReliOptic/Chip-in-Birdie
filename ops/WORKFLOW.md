# 작업 절차

모든 모델과 사람이 [AGENTS.md](../AGENTS.md) 하나를 따른다. 실제 actor·모델·세션을 기록한다.

## 한 편의 관문

| 관문 | 산출물 | 통과 조건 | 필수 리뷰 |
|---|---|---|---|
| G0 패키지 | 로그라인, 제목 3안, 썸네일 2안, 첫 30초 | [패키지 기준](../editorial/PLAYBOOK.md#1-패키지-먼저) | editorial |
| G1 브리프 | `brief.md`, `claims.csv` | 핵심 주장마다 출처 위치 또는 미확인 표시 | evidence |
| G2 대본 잠금 | 영어 대본, 비트 표, `shots.csv` | [판정표](../editorial/PLAYBOOK.md#5-리뷰-판정표)에 차단 없음 | editorial, viewer |
| G3 제작 | 영상·음성·자막 | 처음부터 끝까지 재생 확인 | — |
| G4 READY | `media-bundle.json` | 같은 리비전의 근거·권리·언어별 싱크·메타데이터 | 독립 QA |
| G5 게시 | 실제 URL | A/B 테스트 설정, 끝 화면이 다음 편을 가리킴 | — |

- 개국 3편(TASK-001–003)은 G1에서도 세 역할 리뷰를 모두 받는다. 4편부터는 위 표가 기본이다.
- 감독은 G0와 G4의 대표 샘플을 본다. 그 밖의 관문은 리뷰어가 닫는다.
- 대본이 잠기면 같은 script hash로 영상 제작과 한국어 퍼포먼스를 병렬로 진행한다.
- 작업 `DONE` ≠ 영상 `READY` ≠ 플랫폼 `PUBLISHED`. `PUBLISHED`는 실제 URL을 확인한 뒤에만 기록한다.

## 역할

| 역할 | 산출 | 프롬프트 |
|---|---|---|
| 조사 | 주장별 근거·반론·한계 | [researcher](../prompts/researcher.md) |
| 편집 | 패키지·브리프·대본 | [editor](../prompts/editor.md) |
| 시각화·제작 | 장면·영상·자막·오디오 | [visual-producer](../prompts/visual-producer.md) |
| 근거 리뷰 | 주장과 출처 대조 | [evidence-reviewer](../prompts/evidence-reviewer.md) |
| 편집 리뷰 | 판정표 적용 | [editorial-reviewer](../prompts/editorial-reviewer.md) |
| 모의 시청자 | 새 컨텍스트에서 시청자용 산출물만 보고 답한다 | [viewer-reviewer](../prompts/viewer-reviewer.md) |

제작자는 자기 산출물을 승인하지 않는다. 리뷰어는 다른 actor·세션이어야 한다. 다른 모델 계열은 선택이다.

## CLI

```bash
python3 tools/channel.py status
python3 tools/channel.py brief H039
python3 tools/channel.py task claim TASK-002 --actor worker-a --model actual-model-id --session actual-session-id --lease-hours 4
python3 tools/channel.py task submit TASK-002 --actor worker-a --session actual-session-id --artifact episodes/H039/brief.md --artifact episodes/H039/claims.csv
python3 tools/channel.py review add --task TASK-002 --role evidence --reviewer reviewer-b --model actual-model-id --session review-session-b --verdict pass --notes-file reviews/H039-evidence.md
python3 tools/channel.py review add --task TASK-002 --role viewer --reviewer reviewer-d --model actual-model-id --session fresh-session-d --fresh-context --verdict pass --notes-file reviews/H039-viewer.md
python3 tools/channel.py task complete TASK-002 --actor coordinator
python3 tools/channel.py task block|retry|cancel TASK-002 --actor worker-a --reason '...'
```

- `claim`은 현재 체크아웃 안의 잠금이다. 공유하려면 claim 커밋을 먼저 올리고, 충돌하면 새 head를 읽고 다시 판단한다. 강제 푸시로 풀지 않는다.
- `submit`은 `work/deliveries`에 리비전·파일별 SHA-256·스냅샷을 남긴다. 제출 뒤 파일을 고치면 새 리비전으로 다시 제출한다. 이전 리뷰는 새 리비전에 적용되지 않는다.
- 반려 메모에는 위치·문제·영향·수정안을 쓴다. 양식은 [review-note](../templates/review-note.md).
- `--fresh-context`는 실행자의 선언이다. 모의 시청자 리뷰와 실제 사람의 시청은 메모에서 구분한다.
- 원자료를 못 구하면 확인된 부분과 미확인 부분을 나눠 `block`한다. 결과를 지어 채우지 않는다.

## 작업 흐름

1. 최신 main을 받고 `status`로 대기열을 본다.
2. claim → 별도 branch/worktree에서 작업 → submit → 리뷰 → complete.
3. PR에 목적·결과·미확인 범위를 적는다. 다른 작업자의 활성 파일은 인수인계 없이 고치지 않는다.

## 검사

```bash
make check
```

`validate`, 계보 검사, 단위 테스트를 차례로 돌린다. 구조 검사 통과는 사실·권리·재미의 증거가 아니다.

## 저장소에 넣지 않는 것

자격증명, 고객·회사 비공개 자료, 개인 Drive 링크, 미공개 원본 미디어. 대신 비민감 식별자와 검증 상태를 적는다. 자동 게시·예약·유료 호출은 이 저장소의 작업이 아니다.
