# 측정과 판단

**현재 상태:** YouTube Analytics 미연결. [channel-state.json](channel-state.json)의 `null`은 미확인이며 0이 아니다. [observations.csv](observations.csv)에 관측 행이 없다.

## 기준선

절대 임계값을 쓰지 않는다. 비교 대상은 **이 채널의 직전 편들을 같은 경과일에 본 중앙값**이다(Studio의 "평소 실적" 표시와 같은 개념).

- 1–3편: 기준선이 없다. 세 편을 서로 비교하고 수치만 기록한다.
- 4편부터: 직전 편 전체의 중앙값. 10편을 넘으면 직전 10편.

## 확인 시점

| 시점 | 보는 것 | 할 수 있는 조치 |
|---|---|---|
| 48시간 | 노출, CTR, 30초 유지율 | 없음. 기록만 한다 |
| A/B 테스트 종료 (최대 2주) | 결과 라벨, 유지율 곡선, 유입 경로 | 패키지 재테스트 1회 |
| 28일 | 평균 시청 지속, 끝 화면 클릭률, 신규·재방문 | 다음 편들의 규칙 수정 |

## 처방표

| 관측 (기준선 대비) | 먼저 의심할 것 | 조치 |
|---|---|---|
| 노출이 적다 | 주제의 수요, 채널 이력 부족 | 패키지를 건드리지 않는다. 3편 연속이면 주제 선정 기준을 고친다 |
| 노출은 평소, CTR이 낮다 | 패키지 | 테스트가 끝난 뒤 새 3안으로 한 번 더 테스트한다. 테스트 중에는 제목·썸네일을 건드리지 않는다(건드리면 테스트가 중단된다) [YT07]. 잘 되고 있는 편의 패키지는 바꾸지 않는다 [YT03] |
| CTR은 평소, 30초 유지율이 낮다 | 패키지와 도입의 불일치 | 게시된 편은 두고, 다음 편 도입 대본을 패키지와 다시 맞춘다 |
| 중간에 절벽이 있다 | 그 구간에서 질문이 멈췄거나 개념이 겹쳤다 | 해당 타임코드의 비트를 기록하고 같은 유형을 다음 대본에서 뺀다 |
| 끝까지 보는데 끝 화면 클릭이 낮다 | 다음 편 연결 | 끝 화면이 가리키는 편과 마지막 문장을 바꾼다 |
| 전부 평소 이상 | — | 그 편의 주제 유형·패키지 형식을 다음 3편 안에 한 번 더 쓴다 |

재시청이 늘어난 구간은 흥미인지 이해 실패인지 수치로 구분되지 않는다. 댓글과 비전공자 재설명으로 확인한다.

## 시즌 리뷰

6편 게시 후 28일에 한 번 한다.

1. [채널 공식](../FORMULA.md)의 여섯 항을 편별로 기준선 대비 위·평소·아래로 채점한다.
2. 유입 가설 네 가지 중 실제로 열린 입구를 유입 경로와 "시청자가 함께 본 콘텐츠"로 확인한다.
3. 결정은 셋 중 하나다.
   - **계속:** 재방문 시청자가 생기고, 한 편 이상이 기준선을 분명히 넘었다.
   - **수정:** 같은 항이 3편 이상에서 아래다. 그 항의 규칙을 고치고 시즌 2에서 다시 본다.
   - **형식 재검토:** 여섯 편 모두 노출이 붙지 않았다. 주제 선정과 길이·형식을 다시 정한다.
4. 결과를 [DECISIONS.md](../DECISIONS.md)에 한 줄로 남긴다.

한 편의 결과로 관객 정의나 공식을 바꾸지 않는다.

## 입력 형식

`observed_at,video_id,metric,value,unit,source,source_ref`

```bash
python3 tools/channel.py metrics import path/to/mapped-observations.csv
```

- `video_id`: 실제 영상 ID. 채널 단위는 `channel:<채널 ID>`.
- `value`: 실제 값만. 빈칸은 미확인.
- `source_ref`: 보고서·파일 식별자. 개인 접근 링크를 넣지 않는다.
- Studio 내보내기를 자동 해석하지 않는다. 작업자가 열을 확인해 이 형식으로 옮긴다.

| 지표 | 단위 |
|---|---|
| views, impressions, likes, comments, unique_viewers, returning_viewers, subscribers_gained, subscribers_lost | count |
| monthly_audience, new_viewers, casual_viewers, regular_viewers | count (채널 식별자) |
| ctr | percent 또는 fraction |
| intro_retention, end_screen_click_rate | percent (영상 식별자) |
| average_view_duration_seconds | seconds |
| watch_time_hours | hours |

플랫폼 정의는 [sources.json](../channel/sources.json)의 YT04–YT07.
