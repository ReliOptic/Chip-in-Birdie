# CUDA 플랫폼 발표 (KAIST 플랫폼과 비즈니스)

발표자: IMMS 박병진, PMBA 조기원. 이 폴더는 채널 에피소드 작업과 무관한 수업 발표자료다.

- `index.html` 한 파일에 20분 본 발표(15장)와 5분 발제(5장)가 함께 들어 있다.
- 기준 문서: 발표자의 내러티브 인계 문서(2026-11-27). 발표 문장은 발표자 노트에 원문대로 두었다.
- 디자인: 이전 발표(NVIDIA Blue Ocean Strategy v2)의 검은 배경, #76B900, #151515 카드, Pretendard·Inter를 따랐다. 물감총 시연과 AlexNet은 직접 그린 도식이다.

## 편집기 (studio/)

`studio/`는 장표를 직접 고치고 발표하는 편집기다. 공유 링크: https://claude.ai/artifact/AmB997GcwX3PsHCrDiMfDj

| 파일 | 역할 |
|---|---|
| `studio/index.html` | 화면 골격 (툴바, 패널, 발표 모드) |
| `studio/studio.css` | 편집기와 장표 스타일 |
| `studio/engine.js` | 편집 엔진: 렌더링, 편집, 저장, 발표, 내보내기 |
| `studio/deck-cuda.js` | 이 발표의 내용: 섹션, 장표, 검증 수치 |
| `studio/reveal.css` | Reveal.js 5.1.0 스타일 (MIT) |
| `studio/tests/` | Playwright 회귀 테스트 (`tests/run.sh`) |

- 사진과 아이콘(`img/`)은 4-2조 발표 자료(2026.5.20)에서 뽑아 아티팩트에만 올렸다. 권리 확인 전이라 저장소에는 넣지 않았다. 테스트는 `IMG_DIR`로 사진 폴더를 넘기면 쓰고, 없어도 통과한다.
- 저장: 공유 DB `slides5` 컬렉션에 장표마다 문서 하나. 문서는 장표 속성(`meta`)과 요소별 객체(`els`)로 나뉘어, 두 사람이 서로 다른 요소를 고쳐도 둘 다 남는다. 저장된 값은 읽을 때 화이트리스트로 검사한다.
- 원본 변경 표시: 문서마다 어느 원본에서 고쳤는지(`base`)를 남긴다. 원본이 바뀐 뒤의 수정본은 썸네일에 "원본 변경"이 뜨고, 장표 패널에서 원본 최신본 적용 또는 수정본 유지를 고른다.
- 테마: 덱별 `themes/<덱 id>` 문서. 강조색, 배경, 카드, 글꼴, 섹션 트래커·구분선·쪽 번호·하단 출처·배경 효과 표시 여부.
- 내보내기: PowerPoint(Windows·Mac 글꼴 선택)는 텍스트·도형·표·막대 차트를 편집 가능한 개체로 만들고, 그 밖의 도식만 그림으로 넣는다. 인쇄/벡터 PDF는 브라우저 인쇄로 글자를 선택·검색할 수 있다. 이미지 PDF도 남겨 두었다.

### v10 편집기 개편 (리뷰 3단계 반영)
- 1단계: 공유 저장 시 속성 입력이 끊기던 문제(저장 응답마다 패널을 다시 그림) 수정, 저장값 검사로 스크립트 삽입 차단, 원본 되돌리기 경로 수정, 원본 변경 표시, 장표 추가·복제·이동 실행 취소, 정렬 8종(선택 범위 기준, 한 개면 슬라이드 기준).
- 2단계: 8방향 크기 조절(회전된 요소 포함, 크기 조절 중 스냅), 원·선·화살표, 이미지 올리기(아티팩트 저장소, 없으면 압축 데이터)와 자르기, 글꼴·굵기 6단계·줄 간격·자간·세로 정렬·목록, 발표자 창(현재·다음 장, 대본, 남은 시간, 전체 시간 설정; 청중 화면에는 대본이 나오지 않음), 드래그·입력 중 들어온 변경은 끝난 뒤 병합.
- 3단계: 파일 분리, 요소 단위 저장, 테마·마스터, 접속자 표시와 장표로 이동, 댓글 작성 창 연결, 편집 가능한 PPTX, 벡터 PDF, 키보드 요소 선택(Tab)과 낭독 안내, 회귀 테스트.

### v3 편집 도구 기능
- 덱 여러 개: 위쪽 덱 선택, 새 덱(빈 덱 또는 현재 덱 복제). 새 덱의 장표는 `decks/<id>/slides`에 저장된다.
- 레이아웃 10종: NVIDIA·CUDA 맥락의 예시 내용이 채워진 결론형 장표 템플릿.
- 드래그로 여러 요소 선택, 정렬, 일괄 삭제. `Ctrl+A` 전체 선택.
- AI 편집(뷰어 본인의 Claude 사용량, `sample` 기능): 선택 영역 위에 뜨는 요청 바(결론형 제목으로, 문장 다듬기, 더 간결하게, 도식으로 바꾸기, 근거 보강, 자유 요청), 글 편집 중 문장 일부를 선택해 바꾸기, "AI 장표"로 새 장표 생성. 프롬프트에 한국어 경영전략 문체 기준과 출처가 확인된 사실 자료만 넣고, 자료에 없는 수치는 "[수치 확인 필요]"로 쓰게 했다.
- 화면 문구와 발표 스크립트를 경영전략 발표 문체로 다시 썼다. 사실, 수치, 출처, 사실과 해석의 구분은 그대로 두었다.

### v4 편집 엔진
- 문서 모델: 장표와 요소(텍스트, 도형, 이미지, 에셋)를 구조화된 객체로 저장하고, HTML은 표현 계층으로만 쓴다. 요소 속성: 위치, 크기, 회전, 그룹, 잠금, 숨김, 발표 애니메이션.
- 명령 시스템: 단축키, 명령 팔레트, 컨텍스트 메뉴, 데스크톱 앱 메뉴, AI가 같은 명령과 같은 실행 취소 기록을 쓴다.
- 단축키(⌘는 Windows에서 Ctrl): ⌘Z/⌘⇧Z, ⌘C/⌘X/⌘V, ⌘D, ⌘A, ⌘G/⌘⇧G, ⌘B/⌘I/⌘U(글 편집 중), ⌘F 찾기와 바꾸기, ⌘K 명령 팔레트, ⌘S 버전 저장, ⌘⇧S 프로젝트 파일, ⌘O 열기, ⌘J AI 요청, ⌘]/⌘[ 레이어 순서, ⌘=/⌘-/⌘0 확대, Delete, 방향키(⇧ 16px), ⇧클릭, ⌥드래그 복제, Space+드래그 이동, Ctrl+휠(핀치) 확대, Esc, Enter로 글 편집.
- 스냅 가이드, 회전 손잡이(⇧ 15도), 비율 고정 크기 조절(⇧), 레이어 패널(숨김·잠금), 차트 데이터 표 편집, 장표별 발표 전환 효과.
- 점검: 텍스트 넘침, 캔버스 밖 요소, 출처 누락, 긴 제목, 번역투·비유 표현, 스크립트 누락. 아래 상태 막대에 요약.
- AI: 범위(선택/장표/덱)를 고르고, 변경안을 미리 본 뒤 항목별로 골라 적용. 적용은 한 번의 실행 취소 단위.
- 내보내기: PPTX(텍스트는 PowerPoint에서 편집 가능, 도식은 이미지), PDF, 프로젝트 파일(JSON, 다시 열기 가능). 라이브러리: PptxGenJS 3.12.0, html-to-image 1.11.11, jsPDF 2.5.1.
- 데스크톱 앱: Claude 데스크톱 앱에서 "앱으로 설치" 버튼이 나타나며, 설치하면 파일·편집·정렬·삽입·보기 메뉴와 단축키, 네이티브 컨텍스트 메뉴를 쓴다. 파일 시스템 권한은 쓰지 않는다.

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

## v6 변경
- 도식(에셋) 안의 모든 글을 캔버스에서 직접 고칠 수 있다: 요소를 고른 뒤 글을 한 번 더 클릭하거나 더블클릭, Enter·Esc·바깥 클릭으로 확정. 변경은 에셋의 데이터에 다시 기록되므로 실행 취소, 저장, 내보내기에 그대로 반영된다.
- 화면 문구를 다시 썼고, 섹션 이름을 출발점·플랫폼 설계·외부 혁신·확장과 고착·2026년의 변화·전략적 시사점으로 바꿨다.
- 2026.5.20 경영전략 수업의 NVIDIA 발표 두 건(행운 관점, 블루오션 관점)과 토론에서 나온 질문을 받아 두 장을 추가했다: 세 가지 질문에 대한 답의 지도(2장), NV1과 CUDA의 독자 규격 비교(13장).
- 공유 저장 위치를 `slides3`로 옮겼다. 이전 버전에서 저장된 표지 수정본이 새 문구를 가리던 문제를 없애기 위해서다. 이전 저장본은 `slides2`에 그대로 남아 있다.

## v9 내러티브 재구성
- 흐름: 커뮤니티 효과 → AI 시대의 독점 → 대체 움직임(AI 이식) → 기존 플랫폼 접근의 한계 → 허깅페이스와 오픈소스 생태계 → 남은 질문 → Take home.
- 재현 장면 에셋(학습 터미널과 대회 결과, 코드 저장소, AI 이식, 모델 허브와 공시)과 발표 막대(재생, 진행, 20분 시계, 대본).
- 장마다 붙던 출처 각주를 없애고 인용은 참고자료 장에 모았다. 이전 수업 발표와의 연결 장은 뺐다.
- 공유 저장 위치를 `slides4`로 옮겼다. `slides3`에 저장된 수정 중 표지 변경(부제·날짜 삭제)은 새 기본 표지에 반영했다.
