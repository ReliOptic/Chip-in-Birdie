# 261111 Chip in Birdie 운영 CLI 독립 코드 리뷰

## 범위와 결론

검토 대상은 `tools/channel.py` 및 `tests/test_channel.py`다. 원본 코드와 실제 운영 데이터는 수정하지 않았다. 기존 테스트 20개가 모두 통과한 뒤, 같은 테스트의 임시 저장소 fixture를 사용해 아래 6개 운영 결함을 재현했다. 네트워크·GitHub 쓰기·모델 실행·실제 채널 데이터 사용은 없었다.

검토 시점의 파일 SHA-256:

- `tools/channel.py`: `d94d1c786094c553d76dc912900ea3913b8641ec16a1e1c2e562a5ecdabf73be`
- `tests/test_channel.py`: `9df1d8218628d724092ed79784488a05a18e3d5eedd079220bdfa678ce0c527d`

행 번호는 이 스냅샷 기준이다. 아래 6건은 **수정 전 발견 기록**이며, 담당 구현자가 모두 수정했다. 수정 후 독립 재검토에서도 6건의 해결과 기존 계약 유지를 확인했다. 세부 결과는 마지막 섹션에 있다.

## 중요도 기준

- **P1**: 사용자가 정한 파일 쓰기 경계를 넘을 수 있어 실제 운영 투입 전에 수정해야 한다.
- **P2**: 일반 작업·데이터 입력·후속 개정에서 잘못된 기록, 누락 또는 정상 흐름의 차단을 일으키는 결함이다.

## 1. 출력 디렉터리 symlink를 통한 저장소 밖 쓰기 — P1

**위치:** `tools/channel.py`의 `submit()` 311–312행, `immutable_write()` 97–117행, `task_path()` 181–182행, `lock()` 153–164행. 입력 artifact의 `relative_file()` 검사와 달리, ledger/snapshot 출력 목적지는 root 안으로 해석되는지 검사하지 않는다.

**재현:** 임시 저장소의 `work/deliveries`를 다른 임시 디렉터리로 symlink한 뒤 정상적인 `claim`과 `submit(['drafts/research.md'])`을 실행했다.

**관측 결과:** `submit`은 성공하고 task가 `IN_REVIEW`가 됐다. 저장소 밖에 `TASK-001-r0001.json`과 `TASK-001-r0001/artifacts/drafts/research.md` 두 파일이 작성됐다. 이후 `validate()`만 `Artifact path escapes the repository`로 실패했다.

**영향:** 입력 파일의 경계 검사가 있어도 복사본과 운영 기록은 저장소 밖으로 나간다. 사후 검증은 이미 이루어진 외부 쓰기를 되돌리지 못한다. 이 보고는 프로세스 간 인증을 주장하는 것이 아니라 CLI가 지켜야 할 저장소 파일 경계를 다룬다.

**수정안:** lock, task, delivery, review, metrics와 artifact snapshot 등 관리 대상 목적지에 공통 경로 검사를 적용한다. 존재하는 조상 디렉터리까지 resolve해 root 외부 또는 Git 내부로 향하는 경로를 모든 쓰기 전에 거절한다. 적어도 제출 전체 목적지는 첫 파일을 쓰기 전에 검사한다. 회귀 테스트는 외부 파일이 **0개 작성되고 task revision/status가 그대로인지** 확인해야 한다.

## 2. submit에서 세션을 생략하면 claim의 세션 검사가 사라짐 — P2

**위치:** `active_claim()` 217–218행, `submit()` 274·282행, CLI `--session` 선택 인자.

**재현:** `claim('TASK-001', 'shared-actor', 'model-a', session='worker-session-A')` 후, 같은 actor와 `session='worker-session-B'`로 submit하면 거절된다. 이어 세션 인자 없이 submit하면 성공한다.

**관측 결과:** 명시적으로 다른 세션은 `Task is claimed by another session` 오류였지만, 생략한 요청은 `IN_REVIEW`가 됐다. manifest에는 submit 호출자가 제시하지 않은 기존 `worker-session-A`가 producer로 기록됐다.

**영향:** 같은 actor 이름을 사용하는 로컬 작업자가 실수로 `--session`을 빠뜨리면 다른 세션의 활성 claim을 사용하고 그 세션의 산출물로 기록한다. 이는 분산 인증 문제가 아니라 자체 제공하는 actor/session 동시작업 구분의 일관성 문제다.

**수정안:** `claim`과 `submit`에 같은 세션 기본값 정책을 적용한다. 생략 시 actor identifier로 정규화해 항상 비교하거나, 명시적 세션으로 인수한 task는 submit에도 동일한 명시적 세션을 요구한다. 생략을 wildcard로 처리하지 않는다.

## 3. 완료한 과거 delivery가 이후 원본 파일 편집을 영구 차단 — P2

**위치:** `completion_checks()` 401–403행과 `validate()` 602–607행. `check_artifacts()`의 기본 `check_live=True`가 `DONE`에도 계속 적용된다.

**재현:** 정상 제출 → 독립 evidence/editorial/viewer 리뷰 통과 → complete → validate PASS를 확인했다. 이후 후속 작업을 가정해 `drafts/research.md`만 편집했다. 제출 snapshot과 manifest, 모든 리뷰는 그대로 뒀다.

**관측 결과:** task의 `DONE`과 immutable snapshot은 유지되지만 전체 validate가 `Stale artifact hash: drafts/research.md; submit a new revision`로 실패했다.

**영향:** `DONE`이 특정 delivery의 완료라는 현재 계약과 원본 파일의 영구 동결이 충돌한다. 동일한 문서를 다음 task에서 개선하면 이전 DONE task까지 재개·재심사해야 한다. 여러 task가 같은 정본을 차례로 개정하는 운영에 적합하지 않다. 제출 중인 파일의 무단 변경을 거절하는 기존 테스트는 유효하며 유지해야 한다.

**수정안:** `IN_REVIEW` 검토 및 최초 `complete`에서는 live hash와 snapshot을 모두 확인한다. 과거 `DONE` 검증은 해당 snapshot·manifest·리뷰의 무결성을 확인한다. 새 개정은 새 delivery/hash로 제출하고, 새 개정에 기존 승인을 재사용하지 않는다. DONE 이후 새 review로 task를 재개하는 기능을 유지한다면, 그 전환에 대한 live 일치 조건은 별도로 명시한다.

## 4. 알려진 지표의 잘못된 단위와 미등록 지표가 측정값으로 수락됨 — P2

**위치:** `metric_rows()` 503–520행. count와 ctr에는 타입·단위 제한이 있지만 duration에는 음수 검사만 있고, 알 수 없는 metric은 숫자라는 이유로 통과한다.

**재현:** 아래 세 행을 임시 CSV로 import했다. 날짜, 영상, source, source_ref는 정상 값이다.

| metric | value | unit |
|---|---:|---|
| average_view_duration_seconds | 60 | percent |
| watch_time_hours | 4 | seconds |
| ctrr | -20 | count |

**관측 결과:** 오류 없이 3행이 저장되고 `measured_values: 3`이 반환됐다.

**영향:** 시간 단위가 의미와 다르거나 CTR 오타가 범위 검사를 피해도 검증된 관측처럼 집계된다. 아직 분석을 계산하지 않는다는 범위 고지는 맞지만, 운영 CSV의 기본 의미 검증은 충족하지 않는다.

**수정안:** 지원 metric별 단위·수치 범위·정수 여부를 작은 명시적 registry로 정의한다. 알 수 없는 metric은 거절하거나 검증된 사용자 확장 스키마를 요구한다. 실제 관측이 없는 공란 value를 null로 유지하는 기존 동작은 보존한다.

## 5. 허용된 task ID가 status와 validate에서 누락됨 — P2

**위치:** `identifier()`와 `task_path()` 181–182행의 허용 범위 대비, `status()` 551행 및 `validate()` 588행의 `glob('TASK-*.json')`.

**재현:** 기존 fixture와 같은 구조로 `work/tasks/RESEARCH-001.json`을 만들고 task_id를 `RESEARCH-001`로 지정했다. `claim('RESEARCH-001', ...)`은 성공했다.

**관측 결과:** 해당 task는 활성 claim을 가지고 있지만 status 목록에는 없었다. 기존 TASK-001과 합쳐 파일이 2개임에도 validate는 task_count 1로 PASS했다.

**영향:** 도구가 실제로 인수·제출할 수 있는 작업을 상태 대시보드와 정합성 검사에서 빠뜨린다. 새 task 작성자가 이름 관례를 달리 쓰면 조용히 사각지대가 생긴다.

**수정안:** `work/tasks/*.json` 전체를 검증·집계하거나, task 식별자 규칙에서 `TASK-` 접두사를 일관되게 강제한다. 입력으로 허용된 task는 언제나 status와 validate의 동일 범위에 포함되어야 한다.

## 6. 공백 review 세션을 immutable record로 작성한 뒤에만 거절 — P2

**위치:** `add_review()` 377행의 `session_id = session or reviewer`와 394행 저장, `reviews()` 339–340행의 뒤늦은 require_text 검사.

**재현:** 정상 제출 후 `add_review(..., session='  ')`을 실행했다.

**관측 결과:** review 추가는 성공하며 공백 session을 가진 sealed record가 작성됐다. 이어 validate는 `reviewer.session_id is required`로 실패했다. 이후 리뷰 추가도 기존 리뷰를 읽는 단계에서 막힐 수 있다.

**영향:** 같은 도구의 writer가 reader가 거부하는 immutable 상태를 만든다. 인자 누락이나 자동화의 공백 문자열 때문에 운영 기록을 수동으로 정리해야 하는 상황이다.

**수정안:** reviewer actor/model과 마찬가지로 session도 쓰기 전에 `require_text`로 정규화·검사한다. session 기본값을 적용할 조건은 None/빈 문자열 등 명시적으로 정하고, 최종 저장값은 읽기 쪽과 동일한 스키마를 통과시킨다. 오류 때 review 파일·task history가 추가되지 않았는지 회귀 테스트한다.

## 통과한 주요 계약과 검증의 한계

기존 20개 테스트는 활성 lease 경쟁 거부, 만료된 claim 제출 거부, actor/session 자기 리뷰 거부, viewer fresh-context 선언, 현재 revision별 required role 충족, blocking finding을 이후 pass로 덮지 않기, 수정된 live artifact 거부, 과거 snapshot 보존, 리뷰 note seal 검증, retry revision 분리, 외부 입력 artifact 경로 거부, blank/null 지표 보존, NaN·일부 비정상 수치 거부, DONE과 video READY 분리를 포함한다. 이 계약들은 유효하다.

일반 lock과 원자적 파일 교체가 로컬 checkout을 조정한다는 범위를 벗어나, 서로 다른 branch의 분산 lease나 호출자의 실제 model/session 신원을 검증한다고 해석하지 않았다. 모델·컨텍스트 선언의 진실성, viewer 실제 경험, 영상 READY, 플랫폼 게시 상태와 역사적 사실은 이번 코드 테스트로 증명되지 않는다.

기계가 읽을 수 있는 실제 재현 결과는 같은 디렉터리의 `code-review-repro.json`에 있다. 반복 재현은 `tests/test_channel.py`의 `WorkflowTests.setUp()`이 만드는 격리 저장소를 사용했다. 모든 임시 저장소는 테스트 후 정리했다.

## 수정 후 재검토

수정 후 파일 SHA-256:

- `tools/channel.py`: `8101fe71bc734db40ed737a4accee88ed664d2ac2f712ef4ee145fee0a09a1ff`
- `tests/test_channel.py`: `6bd09cb8cdb19a2c4638d59d23432f0c3fc2e8abe628d8579ef0031aa1808c67`

독립 검토자가 수정 코드를 다시 읽고 `python -m unittest discover -s tests -v`를 직접 실행했다. **28개 테스트가 통과**했다. 실제 운영 데이터에 `python tools/channel.py validate`를 실행한 결과도 PASS였으며 catalog 100개, proposals 100개, task 3개가 검사됐다.

최초 재현과 같은 격리 fixture로 다시 실행한 결과:

| 발견 | 수정 후 관측 | 판단 |
|---|---|---|
| 출력 symlink | submit 전에 거절. 외부 작성 파일 0개, task CLAIMED/revision 0 유지 | 해결 |
| submit 세션 생략 | `Task is claimed by another session`으로 거절. manifest 미작성 | 해결 |
| 완료 후 후속 편집 | DONE snapshot이 그대로면 live 문서의 후속 편집 후에도 validate PASS. snapshot 자체 변조는 계속 거절. 새 리뷰는 live mismatch를 거절 | 해결 |
| metric 의미 검증 | AVD percent, watch-time seconds, 미등록 ctrr를 각각 거절. observations 파일 미작성 | 해결 |
| task ID 누락 | 부적합 ID는 claim·status·validate 모두 일관되게 거절 | 해결 |
| 공백 review session | 저장 전 거절. review 0개, task 내용 불변, validate PASS | 해결 |

실제 재실행 결과는 `code-review-fixed-repro.json`에 저장했다. 이 리뷰에서 발견한 6건 중 미해결 결함은 없다. 이는 특정 로컬 코드 스냅샷의 계약 검증이며, 위에서 분리한 실제 모델 실행·분산 동시성·영상 검수·플랫폼 게시·채널 성과까지 승인한다는 뜻은 아니다.

## 채널 scope·지표 확장과 최종 catalog gate 재검토

후속 변경은 채널 공통 작업을 `scope=channel, episode_id=null`로 표현하고, episode 작업은 알려진 H ID를 요구하며, 채널 audience 지표 4개와 영상 유지·클릭 지표 2개를 registry에 추가했다. `tools/check_catalog.py`와 GitHub Actions 연결도 검토했다.

### 추가 발견 7: orphan 복구 시 scope/episode 불일치 수락 — P2, 해결

추가판 `7e0cb8323145cf675546af7e037766cad49a7a5e269db2caf4c3c02c5b37571b`의 submit 재사용 조건은 artifacts·producer·previous_delivery만 비교했다. manifest를 쓴 직후 task 쓰기 전에 중단된 상황을 재현하고, 복구 전 task scope를 episode에서 channel로 바꾸면 submit이 예전 episode manifest를 재사용하면서 task는 channel/IN_REVIEW로 기록했다. 이후 validate만 scope 불일치로 실패했다.

구현자는 orphan 재사용 때 delivery ID, task ID, revision, scope, episode ID, previous delivery, producer, artifacts, bundle hash를 모두 비교하도록 수정했다. 독립 재실행에서 변경된 scope는 쓰기 전에 거절됐고 task와 이전 manifest가 모두 그대로 유지됐다. 같은 입력의 정상 재시도는 submitted_at의 시간 차이를 허용한다.

수정 전·후 실제 출력은 `code-review-scope-orphan-repro.json` 및 `code-review-scope-orphan-fixed.json`에 보존했다.

### 최종 검토 파일

| 파일 | SHA-256 |
|---|---|
| tools/channel.py | c77ad072acfc1cfd9e3af14f75946f034c2cb21af75374fdffd820eff170bfac |
| tests/test_channel.py | f6bbdb674dd92d11db3fadffabec947452ec096adb901e61c53f6485d631ce5d |
| tools/check_catalog.py | 06fb4baa064ee2c5b63c9ceb6235dddc7c42d3a84816ce9fc2d6aeaba2e0c617 |
| .github/workflows/validate.yml | 97dd07a3a64119b65cd95139f9ca4116105e4eba9e917712cbee3950c73e7c7e |

최종 구현 스냅샷에서 독립적으로 실행한 **33개 테스트가 모두 통과**했다. channel 작업도 기존 3개 독립 리뷰 gate를 유지하며, 제출 manifest의 scope/episode를 나중에 바꾸는 행위를 거절한다. 지표 6개는 알려진 단위·대상·범위를 검사하고, importer가 플랫폼의 실제 데이터 출처나 계정 연결까지 확인했다고 주장하지 않는다.

실제 데이터 검사에서는 catalog 100개, proposal 100개, task 4개가 통과했다. catalog gate는 원본 H100 제목 hash와 P100 lineage를 보존하고 H↔P 및 H↔H 참조를 검사한다. 별도의 임시 복제본에서 원본 제목 변경과 활성 Markdown의 깨진 링크가 실패하는지, 과거 delivery snapshot 문서의 현재 존재하지 않는 링크는 검사 대상에서 제외되는지 확인했다. 실제 출력은 `catalog-gate-review.json`에 있다. CI는 operating validate → catalog gate → unittest를 순서대로 실행하도록 연결되어 있으며, 로컬 검토 시점에 원격 GitHub Actions의 실행 결과까지 확인한 것은 아니다.

**최종 판단:** 이번 코드·구조 검사 범위에서 발견한 7개 결함은 모두 해결됐고, 미해결 blocker는 없다. TASK-000의 작업 산출물 리뷰에 사용할 수 있는 코드 근거다. 영상 READY, 게시 승인 또는 전체 역사 연구의 사실 검증 완료를 의미하지 않는다.
