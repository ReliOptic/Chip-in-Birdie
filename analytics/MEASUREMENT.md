# 261111 | 채널 관객을 실제 반응으로 확인하기

**현재 상태:** YouTube 채널 Analytics 미연결. `channel-state.json`의 미확인 값은 `null`이며 0명이나 0%라는 뜻이 아니다. `observations.csv`에는 아직 관측 행이 없다.

## 무엇을 알아내려는가

채널 관객 정의를 고정된 정답으로 취급하지 않는다. 어떤 관심에서 들어온 사람이 무엇을 얻고, 다른 주제의 다음 영상도 선택하는지 확인한다. 영상별 성과는 그 채널 질문에 답하는 증거로 사용하며 영상마다 새 타깃을 만드는 근거로 쓰지 않는다.

| 질문 | 관찰할 자료 | 바로 단정할 수 없는 것 |
|---|---|---|
| 어떤 관심과 경로에서 들어오나? | 실제 traffic source, 검색어, 제안 동영상, 관객이 함께 보는 콘텐츠 | 다른 채널 시청이 그 채널에서의 유입 인과라는 주장 |
| 약속한 사건을 받았나? | 제목·썸네일 노출/클릭, 도입 이탈, 실제 시청자 의견 | 클릭률 하나로 만족이나 채널 적합성을 판정 |
| 기술과 선택이 이해됐나? | 핵심 장면의 이탈·재시청, 비전공자의 재설명·오해 | 재시청 증가가 흥미인지 이해 실패인지 자동 판정 |
| 다른 소재의 다음 편도 보나? | 실제 후속 선택·end screen 반응, 신규/재방문, 콘텐츠 간 연결 | 구독자 수를 활성 관객이나 반복 시청으로 대체 |
| 반복될 경험이 생겼나? | 같은 기간의 월간 관객·행동 분류와 질적 피드백 | 특정 regular 비중을 추천 보너스 공식으로 사용 |

플랫폼 정의는 [공식 출처](../channel/SOURCES.md)의 YT04–YT06에 연결한다. 관측 기간·포맷·언어·기기·유입 조건이 다른 수치를 그대로 비교하지 않는다. 조작 가능한 지표를 위해 결말을 지연하거나 이해를 어렵게 만들지 않는다.

## 입력 형식

이 저장소의 importer는 아래 **명시적 교환 형식**을 읽는다. 모든 종류의 YouTube Studio CSV를 자동 해석하거나 API에 연결하는 기능은 아니다. 실제 내보내기 파일을 받은 작업자가 열과 의미를 확인해 이 형식으로 매핑한다.

`observed_at,video_id,metric,value,unit,source,source_ref`

- `observed_at`: 관측 시점. 비교 기간은 metric 명세 또는 근거 메모에 별도 기록한다.
- `video_id`: 실제 영상 ID. 채널 단위 행은 `channel:<실제 YouTube channel ID>` 형식 사용. 계정 미확인 상태에서 ID를 만들어 넣지 않는다.
- `metric`, `unit`: 원자료의 의미와 단위를 유지한다. 퍼센트와 비율, 분과 초를 혼합하지 않는다.
- `value`: 실제 값. 빈칸은 미확인 `null`로 취급한다. 추정값을 관측값처럼 넣지 않는다.
- `source`, `source_ref`: 실제 보고서나 파일의 근거 위치. 공개 저장소에는 개인 접근 링크나 개인정보를 넣지 않고 허용된 식별자 사용.

```bash
python3 tools/channel.py metrics import path/to/mapped-observations.csv
python3 tools/channel.py status
```

`templates/analytics-import.csv`는 헤더만 있는 양식이다. 시연용 숫자를 실제 관측 테이블에 넣지 않는다.

지원하는 교환 지표는 다음과 같다. 이 이름은 저장소의 규격이며 Studio의 모든 내보내기 열 이름과 동일하다는 뜻이 아니다. 새로운 지표는 단위·범위·대상 검증과 함께 추가한다.

| 지표 | 허용 단위 |
|---|---|
| views, impressions, likes, comments, unique_viewers, returning_viewers, subscribers_gained, subscribers_lost | count |
| monthly_audience, new_viewers, casual_viewers, regular_viewers | count, 채널 식별자 사용 |
| ctr | percent 또는 fraction |
| intro_retention, end_screen_click_rate | percent, 실제 영상 식별자 사용 |
| average_view_duration_seconds | seconds |
| watch_time_hours | hours |

CSV importer는 단위·숫자·필수 출처 필드와 중복을 검사한다. 실제 플랫폼에서 나온 값인지 또는 비교할 관측 기간이 같은지는 근거 검토자가 확인한다.

## 편집 수정 기록

관측 → 경쟁 설명 → 수정할 가설 → 바꿀 항목 → 비교 범위 → 실제 결과 순서로 짧게 기록한다. 예를 들어 도입 이탈이 크면 용어 과부하·제목 약속 불일치·느린 사건 진입을 각각 검토한다. 어느 원인인지 확인되지 않았는데 자동으로 짧게 자르거나 제목을 자극적으로 바꾸지 않는다.

한 번의 결과를 채널 전체 수요로 일반화하지 않는다. 표본이나 기간이 부족하면 `INSUFFICIENT_DATA`로 남기고, 필요한 자료를 다음 작업에 기록한다. 통합 점수나 성공 임계값을 근거 없이 만들지 않는다.
