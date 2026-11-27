# TASK-004 / TASK-004-r0004 / revision 4 / evidence

- 실제 reviewer actor / model / session: independent-session-reviewer / claude-opus-5-5 / session_01PGnDYZv6brohvxNHDQ46PW
- 독립성: 제작 세션(session_01PGnDYYRkzDyviPFVMqxNV2)과 다른 claude.ai 세션이다. 다만 `get_session` 기록상 parent_session_id가 제작 세션이다. 같은 모델 계열이다. 제작 대화의 맥락은 받지 않았다. r1–r3 메모는 아래 판단을 정한 뒤에 읽었다.
- 대상: work/deliveries/TASK-004-r0004.json(bundle 905a203f…, manifest ad23ad83…). 주요 artifact 9개의 작업 트리 SHA-256이 delivery 기록과 일치한다.
- 판정: **changes_requested** (차단 1건)

## 검토 방법

1. **비교 기준:**
   - catalog·proposals·DECISIONS: `git show a11b495:…`.
     - 얕은 클론이라 `git fetch origin a11b495b…`로 받았다.
     - a11b495와 TASK-004 직전 ee8d3ec의 catalog·proposals는 같다.
   - seasons.json: a11b495에 파일이 없다. TASK-004 직전 상태인 `ee8d3ec`를 썼다. eca80f4 이후 변경이 없다.
2. **보존 조건(스크립트):**
   - 32편의 episode_id·season·episode·original_id·original_title_en·source_h_ids·main_p_id·source_namespace·crosswalk_status·selection 값이 원래와 같다.
   - 바뀐 title_en은 모두 이전 값이 title_history에 있다. 시즌 제목 8개(영·국)도 같다.
   - title_ko는 원래 레코드에 없던 필드다.
   - H001–H100: 바뀐 필드는 story_question·physical_anchor·industry_choice·economic_social_context·viewer_payoff·draft_synopsis·research_gate(6건)·technical_mechanism(1건)이다.
     - 추가된 필드는 reviewed_title_ko·selection_flag·language_review·title_history다.
     - source_working_title·source_review_title·era·public_research_leads·source_snapshot_context·계보 필드(next/branch/proposed_p_ids)는 바뀌지 않았다. 삭제된 필드도 없다.
   - P001–P100: 바뀐 필드는 title_ko·title_en·act·economic_question·ending·opening이다.
     - 100건 모두 title_history에 이전 제목이 있다.
     - source_h_ids·proposed_order·primary_source_hunt·상태 필드는 바뀌지 않았다.
   - `tools/check_catalog.py`: errors 없음(H 100, P 100 보존).
   - `tools/channel.py validate`: PASS.
   - unittest 33개 OK.
3. **새 고유명사·숫자 검사:**
   - 바뀐 필드의 라틴 문자 토큰과 숫자를 각 레코드의 이전 값, 연결 H/P, DECISIONS.md와 대조했다.
     - 걸린 고유명사: Poland·Soviet·Hynix·Japan·Texas·Fairchild. 모두 연결 H에 한국어로 있다(폴란드·소련·하이닉스·일본·텍사스·페어차일드). ES-1032는 H001에 있다.
     - 새로 들어간 숫자: H023 "8"(draft_synopsis의 "여덟"), H038 "1980년대"(era 1987). 둘 다 레코드 범위 안이다.
     - 시즌 연결 문장의 1968·1965·2012는 각각 H045·S2E07·S2E06 레코드에 있다.
     - S3E01 제목의 1985는 H061 era·draft_synopsis에 있다.
   - 한국어 필드는 자동 대조하지 않았다. 표본 catalog 20건과 proposals 23건을 수동으로 읽었다(편집 메모의 표본 목록과 같다).

## 차단 사항

### V1. DECISIONS.md CIB-052의 시즌 flag 수가 실제와 다름 (LANGUAGE 8절 "한 수치를 고치면 모든 곳을 같이 고친다", 실행 기록의 정확성)

- **위치:** DECISIONS.md 42행, CIB-052. 문구: "Premises resting on unverified anecdotes or single causes are marked `selection_flag` (seasons 4, proposals 23, catalog 30)".
- **문제:**
  - 현재 seasons.json에서 selection_flag가 있는 편은 **14편**이다: S1E01·02·04·05, S2E01·06·07, S3E03·05·08, S4E01·02·04·07.
  - proposals 23건과 catalog 30건은 실제와 맞는다.
  - DECISIONS.md는 13df523(part 4) 이후 수정되지 않았다. r2에서 flag를 10편에 전파한 결과가 반영되지 않았다.
- **영향:** DECISIONS는 정책 이행의 공식 기록이다. 소유자가 이 기록만 보면 전제 검증이 필요한 편을 4편으로 알게 되고, 나머지 10편의 전제 검증을 일정에서 놓칠 수 있다. 실행 결과를 실제보다 작게 보고한 수치다.
- **수정:**
  - "(episodes 14, proposals 23, catalog 30)"로 고친다.
  - 시즌 레코드 4개에는 flag가 없으므로 "seasons"가 아니라 "episodes"로 적는다.
- **확인할 증거:** `python3 -c "import json;print(sum(1 for e in json.load(open('editorial/seasons.json'))['episodes'] if e.get('selection_flag')))"`의 결과가 14다.

## 비차단 사항

1. **검증 전 전제를 사실로 적은 evidence_leads**(편집 리뷰 B2와 같은 위치: S4E04·S3E03·S1E05·S1E07)
   - 원 기획 문구가 그대로 남은 것이고, 이번 작업에서 새로 넣은 주장은 아니다. 같은 편에 flag(S1E07은 payoff의 해석 라벨)가 붙어 있다.
   - 그래서 근거 역할에서는 차단하지 않는다.
   - 다만 SEASONS.md의 "Source hunt"는 조사 방향으로 읽힌다. 결론을 정해 놓고 자료를 찾게 만들 위험이 있다. 수정은 편집 리뷰 B2를 따른다.
2. **selection_reason 32편 일괄 교체, 이전 값 미보존**
   - 예: "Preserves user-recovered six-episode sequence; titles remain factual review drafts." → "Part of the user-recovered PR #1 core (six episodes per season); …"
   - 새 문구의 사실 범위(시즌당 복구 6편, 제목은 승인 전)는 이전 값과 같다.
   - 그러나 E07·E08의 "not a recovered user approval of its claims"는 승인 상태에 대한 새 서술이다. authority 필드("canonical editorial selection, not publication approval")와 모순되지는 않는다.
   - 선정 근거의 원문이 레코드에서 사라졌다. title_history처럼 `selection_reason_history`에 이전 값을 두기를 권한다.
   - CIB-052의 "source snapshots unchanged"에도 이 필드 변경이 언급되지 않았다.
3. **S3E01 title_en "Intel's 1985 Exit From DRAM"**
   - 1985는 H061 era·draft_synopsis와 공개 연구 링크(timeline.intel.com/1985/farewell-to-dram)에 있다.
   - 그러나 H061 research_gate는 "1984–1986 의사결정·감원·사업 비중 … 확인"을 요구한다.
   - 발표 연도와 결정 과정의 기간을 구분해야 한다. 대본 단계에서 "1985 announcement" 범위를 지킨다는 조건을 brief에 남기기를 권한다.
4. **SEASONS.md와 seasons.json 불일치 1건**
   - S4E01 evidence_leads에 r1 이후 "2022–23 기간 표기의 출처: DECISIONS.md CIB-049"가 추가됐다.
   - SEASONS.md 384행의 "Source hunt"에는 이 문구가 없다. 기계 판독 정본과 문서를 맞춘다.
5. **H017 draft_synopsis의 새 경쟁 설명**
   - 새 문장: "당시 독점 규제 압력이 공개 결정에 미친 영향도 함께 확인해야 한다."
   - 이전 레코드에 없던 요소다. 다만 research_gate의 "라이선스 당시 강제성"과 selection_flag가 같은 내용을 검증 항목으로 둔다. 사실 서술이 아니라 확인할 대안 설명으로 쓰였으므로 허용 범위로 본다.
6. **P091 title_en "Fairchild's 1963 CMOS and Its Early Adoption"**
   - 연도와 회사는 H028 era에 있다. 그러나 H028은 초기 채택 우위가 없었다는 질문이다. 제목이 반대 사실(초기 채택)을 시사한다. 편집 리뷰 비차단 7과 같다.
7. **language_review.revision 누락 6편**
   - 실제 리비전은 delivery 원장에 남아 있으므로 차단하지 않는다.
8. **r3 근거 리뷰 비차단 처리 확인**
   - S2E01 payoff: "programmable"이 빠졌다.
   - S4E01 question: "needed an export licence"로 바뀌었다.
   - language_review revision과 이력: `language_review_history`에 누적된다.
   - S3E04 next "changed manufacturing cost": S3E03→04 문장이 "affected transistor density and reproducibility"로 바뀌어 S3E04 payoff 범위와 맞는다.

## 시간 순서·사후 의도 점검

- 32편의 question·choice·payoff·next_connection에 앞선 사건을 뒤 사건의 "대응"으로 쓴 문장이 없다.
- 결과를 보고 당시 의도를 붙인 문장도 없다. S2E01·S2E06·S2E07·S4E02·S4E07은 해당 위험을 flag와 payoff의 "still to be verified"로 표시했다.
- 연대 역행을 표시하지 않은 연결 3곳은 편집 리뷰 B1에서 다룬다. 인과 주장이 아니라 thematic 연결이므로 근거 역할에서는 별도로 차단하지 않는다.
- 자체 집계를 기본값으로 쓴 수치와 계산식 없는 파생 수치는 32편·표본에서 찾지 못했다.
  - H031의 "43달러 50센트"와 "60% 논쟁"은 검증 전으로 표시돼 있다.
  - P082의 "7만 장"은 selection_flag 안에서 원 가설의 추정으로 표시돼 있다.

## 검증하지 못한 것

- 역사적 사실 자체(연도·인물·수치). 1차 자료와 외부 자료는 조회하지 않았다. 이번 검토는 기존 레코드·연결 H/P·DECISIONS 대비 새 주장이 들어왔는지와 표현 범위만 본다.
- 한국어 필드의 전수 자동 대조. 표본 밖 catalog 80건·proposals 77건의 한국어 본문은 숫자 토큰만 기계로 대조했다.
- 운영 문서의 사실 주장. 바뀐 문장은 LANGUAGE 링크와 가설 라벨이며 새 외부 사실은 없다. YouTube 설명 문구 변경("YouTube 설명에 따르면")은 SOURCES.md의 YT01–YT03을 다시 열어 보지 않았다.
- 권리·영상·재생은 범위 밖이다. 작업 트리의 csv 3개 변경은 artifact가 아니어서 다루지 않았다.
