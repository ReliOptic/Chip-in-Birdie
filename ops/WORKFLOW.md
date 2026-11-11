# 261111 | 여러 모델이 함께 운영하는 절차

## 하나의 기준, 다른 역할

모델 브랜드별로 정본을 만들지 않는다. 모든 모델이 `AGENTS.md`와 채널 관객 정의를 읽고, 역할과 작업 ID를 정해 기여한다. 실제 모델명·actor·session을 기록하며 다른 모델을 사용했다고 꾸미지 않는다.

| 역할 | 입력 | 산출 | 독립 검토 |
|---|---|---|---|
| 조사 | 사건·질문·공통 관객·기존 출처 | 주장별 근거·정확한 구간·반론·한계 | evidence |
| 편집 | 검증 범위·사건·채널 약속 | 브리프·제목 후보·대본·편성 연결 | editorial, viewer |
| 시각화·제작 | 대본 리비전·주장·음성 조건 | 장면·모델·영상·자막·오디오 | evidence, editorial, viewer 및 별도 미디어 QA |
| 운영·분석 | 실제 관측·기간·유입 조건 | 관측 요약·수정 가설·검증 계획 | evidence, editorial |

필요한 리뷰 역할은 작업의 `required_review_roles`에서 정한다. 모든 문서에 모든 리뷰를 무조건 요구하지 않는다. 다른 모델 계열의 검토는 선택적으로 활용하고, 제작자와 다른 actor/session이라는 최소 독립성을 유지한다.

## 작업 인수

먼저 `python3 tools/channel.py status`로 대기열과 담당 상태를 확인한다. 작업은 `work/tasks/TASK-*.json`에 한 파일씩 있다. 다음은 사용 예시이며 아래 명령을 실행했다고 모든 작업이 실제 인수되는 것은 아니다.

```bash
python3 tools/channel.py brief H039
python3 tools/channel.py task claim TASK-002 --actor worker-a --model actual-model-id --session actual-session-id --lease-hours 4
```

CLI는 **현재 체크아웃 안에서** 잠금과 임대 기한을 검사한다. 여러 컴퓨터나 브랜치가 공유하는 서버 잠금은 아니다. 공유 작업을 시작하려면 최신 coordination branch를 읽고 claim 변경을 먼저 반영한다. GitHub API에서는 확인한 head의 `expected_sha`로 갱신하며, 거부되면 새 head를 읽고 다시 판단한다. 강제 덮어쓰기로 임대 충돌을 해결하지 않는다.

다른 작업자는 별도 branch/worktree를 사용한다. claim을 담은 PR이 아직 병합되지 않았다면 독점 인수를 획득한 것으로 주장하지 않는다. 사용 권한 없이 branch protection을 켰다거나 GitHub가 모델 신원을 인증한다고 말하지 않는다.

## 제출과 정확한 리비전

작업 산출물은 저장소 안의 파일로 만든다. 원문을 복사할 수 없는 경우에는 공개 가능한 주장·출처 위치의 비민감 식별·미확인 사유를 적는다.

```bash
python3 tools/channel.py task submit TASK-002 --actor worker-a --session actual-session-id --artifact episodes/H039/brief.md --artifact episodes/H039/claims.csv
```

제출은 `work/deliveries`에 리비전·파일별 SHA-256·내용 스냅샷·제작자를 남긴다. task/review/delivery 원장을 자기 자신의 산출물로 제출할 수 없다. 제출 후 작업 파일을 바꾸면 기존 검토 대상과 달라지므로 새 리비전으로 제출해야 한다.

## 독립 리뷰

리뷰 메모에는 실제 파일 위치와 관찰을 적는다. 리뷰를 통과시키기 위한 일반적인 칭찬, 사용자 요구를 완화해 만든 합격, 확인하지 않은 영상 재생 주장은 허용하지 않는다.

```bash
python3 tools/channel.py review add --task TASK-002 --role evidence --reviewer reviewer-b --model actual-model-id --session review-session-b --verdict pass --notes-file reviews/H039-evidence.md
python3 tools/channel.py review add --task TASK-002 --role editorial --reviewer reviewer-c --model actual-model-id --session review-session-c --verdict changes_requested --notes-file reviews/H039-editorial.md
python3 tools/channel.py review add --task TASK-002 --role viewer --reviewer reviewer-d --model actual-model-id --session fresh-session-d --fresh-context --verdict pass --notes-file reviews/H039-viewer.md
```

`pass` 예시는 실제 검토가 통과한 경우에만 사용한다. 반려 메모에는 위치·문제·관객/사실에 대한 영향·수정안을 포함한다. CLI는 메모 내용과 해시를 함께 보존한다. 제작자와 같은 actor 또는 session의 자기 리뷰는 거부한다.

**viewer 검토:** 공통 관객 약속과 시청자에게 실제 제공될 대본·영상만 새 컨텍스트에 전달한다. 조사자의 해설·의도·정답·기존 리뷰는 먼저 주지 않는다. `--fresh-context`는 실행자의 선언이지 CLI가 실제 컨텍스트 격리를 입증하는 장치가 아니다. 모델의 모의 독자 리뷰와 실제 비전공자의 시청 검토는 메모에서 구분한다.

## 반려·막힘·취소·재시도

차단 리뷰가 있으면 `CHANGES_REQUESTED`가 된다. 작업자가 수정 후 다시 claim·submit하면 새 리비전을 만든다. 이전 리뷰와 스냅샷은 남고 새 리비전에 자동 적용되지 않는다.

```bash
python3 tools/channel.py task block TASK-002 --actor worker-a --reason '필수 원자료 미확보'
python3 tools/channel.py task retry TASK-002 --actor worker-a --reason '원자료 확보 후 재개'
python3 tools/channel.py task cancel TASK-002 --actor worker-a --reason '범위를 새 작업으로 이전'
```

원자료를 확보하지 못하면 확인된 부분과 미확인 부분을 나누고 실제 막힌 조건을 기록한다. 결과를 만들어 채우지 않는다. 취소된 이력도 삭제하지 않는다.

모든 필수 역할이 현재 파일·현재 리비전을 검토하고 차단 이슈가 없을 때 작업을 완료한다.

```bash
python3 tools/channel.py task complete TASK-002 --actor coordinator
```

이 명령은 작업을 `DONE`으로 만든다. 영상의 제작·권리·공개 상태를 바꾸지 않는다.

## 영상 제작 상태와 별도 릴리스 관문

대본이 잠기면 같은 script hash를 기준으로 영상 제작과 한국어 퍼포먼스 확보를 병렬 진행한다. 필요한 한국어 퍼포먼스가 확보된 뒤 언어별 후처리를 진행한다. 이번 공개의 `required_locales`와 향후 확장 언어를 구분한다.

영상 `READY`는 다음의 동일 리비전 묶음이 있어야 한다.

- 주장과 조건·반론 검수, 장면·물리적 모델 검수.
- 영상·음성·자막을 처음부터 끝까지 재생한 증거와 실제 파일 해시.
- 사용 자산의 권리와 요구되는 표기.
- 이번 공개 언어별 발음·뜻·싱크·자막 검수.
- 제목·썸네일·설명·출처 등 미디어/메타데이터 묶음.
- 제작 역할에서 분리된 독립 QA의 결과 및 적용되는 감독 피드백·명시적 예외 처리.

`templates/media-bundle.json`은 이 요건을 기록하는 양식이다. 이번 CLI는 파일을 읽었다고 영상 READY를 자동 생성하지 않는다. 실제 YouTube 상태와 URL을 확인해야 `PUBLISHED`를 기록한다. 자동 게시·예약·알림·유료 모델 호출은 구현하지 않았다.

## 협업을 재현하는 기준

같은 파일의 오래된 복사본을 근거로 승인하지 않도록 해시를 확인한다. 모델은 서로의 추론을 복제하기보다 공통 입력과 자신의 증거로 검토한다. 리뷰가 서로 충돌하면 중요도·근거·시청 영향으로 정리하고, 해결되지 않은 차단 의견을 다수결이나 평균 점수로 없애지 않는다.

구조 검사·모델 리뷰·사실 검증·실제 시청·게시 성과는 각각 다른 증거다. `verification/`에는 이번 저장소 자체의 검사 범위를 남긴다.
