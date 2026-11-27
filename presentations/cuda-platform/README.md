# CUDA 플랫폼 발표 (KAIST 플랫폼과 비즈니스)

발표자: IMMS 박병진, PMBA 조기원. 이 폴더는 채널 에피소드 작업과 무관한 수업 발표자료다.

- `index.html` 한 파일에 20분 본 발표(15장)와 5분 발제(5장)가 함께 들어 있다.
- 기준 문서: 발표자의 내러티브 인계 문서(2026-11-27). 발표 문장은 발표자 노트에 원문대로 두었다.
- 디자인: 이전 발표(NVIDIA Blue Ocean Strategy v2)의 검은 배경, #76B900, #151515 카드, Pretendard·Inter를 따랐다. 물감총 시연과 AlexNet은 직접 그린 도식이다.

## 편집기 (studio.html)

`studio.html`은 장표를 직접 고치고 전체화면으로 발표하는 편집기다. 공유 링크: https://claude.ai/artifact/AmB997GcwX3PsHCrDiMfDj (비공개, Share 메뉴로 공유해야 다른 발표자가 열 수 있다)

- 왼쪽 장표 목록, 가운데 캔버스(끌어서 이동, 오른쪽 아래 손잡이로 크기 조절, 더블클릭으로 글 수정), 오른쪽 속성·에셋 패널, 아래 발표 스크립트.
- 에셋 15종(물감총, 플랫폼 구조도, 막대 비교, 기간 비교, 비교표 등)을 아무 장표에나 넣고 문구와 값을 바꿀 수 있다.
- 발표는 Reveal.js 5.1.0(MIT, cdnjs)으로 돌린다. `N` 노트, `Esc` 편집으로 복귀.
- 수정본은 아티팩트 공유 DB의 `slides` 컬렉션에 장표 단위로 저장된다. 원본 장표는 페이지에 들어 있고, "원본으로 되돌리기"는 저장본을 지운다. 로컬 파일로 열면 브라우저에만 저장된다.
- `studio.src.html`이 원본이고, `studio.html`은 여기에 Reveal CSS를 넣어 만든 결과물이다.
- v2(컨설팅 형식): 장마다 결론형 제목, 섹션 트래커, 출처 각주, 쪽 번호. 계층 구조·네트워크 효과 순환·단계 타임라인·2×2 매트릭스·찬반 논거·딜 타임라인 도식을 추가했다. 수정본은 `slides2` 컬렉션에 저장된다.
- 사진과 아이콘(`img/`)은 발표자의 이전 자료(NVIDIA Blue Ocean Strategy v2)에서 뽑아 아티팩트에만 올렸다. 권리 확인 전이라 저장소에는 넣지 않았으므로, 로컬에서 열면 이미지가 비어 보인다.

### v3 편집 도구 기능
- 덱 여러 개: 위쪽 덱 선택, 새 덱(빈 덱 또는 현재 덱 복제). 새 덱의 장표는 `decks/<id>/slides`에 저장된다.
- 레이아웃 10종: NVIDIA·CUDA 맥락의 예시 내용이 채워진 결론형 장표 템플릿.
- 드래그로 여러 요소 선택, 정렬, 일괄 삭제. `Ctrl+A` 전체 선택.
- AI 편집(뷰어 본인의 Claude 사용량, `sample` 기능): 선택 영역 위에 뜨는 요청 바(결론형 제목으로, 문장 다듬기, 더 간결하게, 도식으로 바꾸기, 근거 보강, 자유 요청), 글 편집 중 문장 일부를 선택해 바꾸기, "AI 장표"로 새 장표 생성. 프롬프트에 한국어 경영전략 문체 기준과 출처가 확인된 사실 자료만 넣고, 자료에 없는 수치는 "[수치 확인 필요]"로 쓰게 했다.
- 화면 문구와 발표 스크립트를 경영전략 발표 문체로 다시 썼다. 사실, 수치, 출처, 사실과 해석의 구분은 그대로 두었다.

## 조작 (index.html)

| 키 | 동작 |
|---|---|
| → / Space / 클릭 | 다음 (7장은 한 줄씩) |
| ← / 화면 왼쪽 1/4 클릭 | 이전 |
| N | 발표자 노트 패널 |
| P | 발표자 창(노트, 다음 장, 경과 시간). 본 창과 동기화 |
| F | 전체 화면 |
| 2 / 5 | 20분 / 5분 버전 전환 (마우스를 움직이면 오른쪽 아래에도 나타남) |

URL로 바로 열기: `index.html?v=5` (5분), `index.html?v=20&s=7` (7번 장).

## 화면 표기 원칙

- 초록 채움 = 엔비디아가 만든 것(CUDA, 기본 라이브러리). 테두리만 = 바깥에서 만든 것(응용 프로그램, AI 모델).
- 9장 막대는 ChatGPT 이전 대비 13배라는 비율만 나타낸다. 연도별 매출값은 재확인 전이라 쓰지 않았다.
- 11장 화면 아래에 Anthropic 수치의 단서를 넣었다.

## 출처 URL

- https://www.jonpeddie.com/news/cuda-turns-20-with-11-million-developers/
- https://fudzilla.com/cuda-could-a-torched-nvidias-margins/
- https://www.glennklockwood.com/garden/jensen
- https://byline.network/2026/03/nvidia/
- https://www.nextplatform.com/2015/10/28/inside-the-programming-evolution-of-gpu-computing
- https://en.wikipedia.org/wiki/CUDA
- https://techcrunch.com/2008/08/28/mythbusters-gpu-vs-cpu-demo-2100-paintballs-make-the-mona-lisa-in-275ms
- https://en.wikipedia.org/wiki/Nvision
- https://cacm.acm.org/research/imagenet-classification-with-deep-convolutional-neural-networks
- https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Fourth-Quarter-and-Fiscal-2026/default.aspx
- https://www.pcgamer.com/hardware/nvidia-reports-a-truly-astonishing-usd193-7-billion-in-annual-data-center-revenue-in-its-latest-earnings-call-up-75-percent-year-on-year-while-little-old-gaming-brought-in-usd16-billion/
- https://www.techrepublic.com/de/article/news-nvidia-120-billion-profit/
- https://newmarketpitch.com/blogs/news/ai-chip-nvidia-lead
- https://siliconanalysts.com/analysis/amd-vs-nvidia-ai-gpu-market-share-2026
- https://swotpal.com/blog/amd-swot-analysis-2026
- https://the-decoder.com/anthropic-says-ai-is-eroding-nvidias-cuda-lead-cutting-an-amd-chip-switch-from-months-to-three-days/
- https://mezha.net/eng/news/mezha-86356759cab6cc28c8c6bac8_anthropic_says_claude/
- https://www.computerweekly.com/news/366640614/CUDA-at-20-From-billion-dollar-gamble-to-agentic-AI
- https://techwireasia.com/2026/10/nvidia-cuda-moat-ai-kernel-engineers-china/
- https://www.mindstudio.ai/blog/openai-codex-kernel-writing-cuda-moat
- https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/
- https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000078/nvda-20260902.htm
- https://finance.yahoo.com/markets/article/nvidia-confirms-13-billion-acquisition-of-open-weight-ai-platform-hugging-face-141058641.html
- https://m.seoul.co.kr/news/economy/industry/2026/09/03/20260903500353
- https://www.itdaily.kr/news/articleView.html?idxno=241399

## 작업 기록

- 제작: Claude Code 클라우드 세션 (https://claude.ai/code/session_01PGnDYYRkzDyviPFVMqxNV2), 2026-11-27.
- 검토: 아직 없음. 발표자 확인 필요.
