# Chip in Birdie

**반도체를 통해 기술·산업·돈·사회의 맥락을 이해하는 영어권 교양 다큐멘터리 채널.**

반도체와 무관한 일을 하루 종일 한 사람이 잠들기 전에 보고 "아, 그래서 그런 선택을 했구나" 하고 이해한다.

## 읽는 순서

| 문서 | 답하는 질문 |
|---|---|
| [채널 공식](FORMULA.md) | 한 편이 성과를 내려면 무엇이 맞아야 하는가 |
| [채널](channel/CHANNEL.md) | 누구에게 무엇을 약속하는가, 고정 값은 무엇인가 |
| [핵심 독자](channel/CORE.md) | 제목과 도입을 누구에게 맞추는가, 수익이 어디서 나오는가 |
| [시즌 1–4](editorial/SEASONS-1-4.md) | 24편의 제목과 중심 질문 |
| [2026년의 독자](channel/READER.md) | 대중이 AI와 칩에 대해 무엇을 알고 모르는가, 제목에 쓸 수 있는 낱말 |
| [첫 유입과 그립](channel/INFLOW.md) | 어느 채널의 시청자가 처음 들어오고 무엇으로 붙잡는가 |
| [100편 재편](editorial/SLATE-REVIEW.md) | 무엇을 남기고 빼고 새로 넣었나 |
| [게시 대기열](editorial/QUEUE.md) | 100편의 게시 순서와 제외·병합·보류 |
| [편성](editorial/PROGRAMMING.md) | 시즌 1에 무엇을 어떤 순서로 내는가 |
| [편집 기준](editorial/PLAYBOOK.md) | 패키지·도입·비트·리뷰 판정 |
| [작업 절차](ops/WORKFLOW.md) | 관문 G0–G5, 역할, CLI |
| [측정과 판단](analytics/MEASUREMENT.md) | 게시 뒤 무엇을 보고 무엇을 바꾸는가 |
| [결정 기록](DECISIONS.md) | 무엇을 왜 정했고 무엇을 버렸는가 |

## 지금 상태

- 게시된 영상 0편. YouTube Analytics 미연결.
- 100편은 역사적 무게 기준으로 다시 세웠다. 첫 편은 P004(TSMC), 시즌 1은 6편이다.
- 개국 목표 2026-12-19. 일정·담당·막힌 것은 [개국 런북](production/LAUNCH.md).
- 시즌 1–4의 24편은 제목 3안·썸네일·첫 30초·에디토리얼 초안이 `episodes/`에 있다. 사실은 검증 전이다.

## 자산

- [proposals.json](editorial/proposals.json): P001–P148. `slate_review.status`가 `ACTIVE`인 100편이 편성표다.
- [catalog.json](editorial/catalog.json): 연구 계보 H001–H100과 공개 자료 단서.
- [work/](work): 작업·제출·리뷰 원장.
- [prompts/](prompts), [templates/](templates): 역할 프롬프트와 제작 양식.
- [archive/](archive/README.md): 대체된 문서와 채택하지 않은 안.

## 명령

```bash
python3 tools/channel.py status
python3 tools/channel.py brief H039
make check
```

Python 표준 라이브러리만 쓴다. 모델 호출이나 YouTube 업로드를 자동 실행하지 않는다.

모델은 [AGENTS.md](AGENTS.md)부터 읽는다.
