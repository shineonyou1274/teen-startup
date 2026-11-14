# 틴 스타트업

사장이 되어 열두 달 동안 달마다 한 가지씩 결정을 내리는 창업 체험 게임입니다. 중·고등학생 창업가정신 수업용입니다.

업종은 첫 화면에서 고릅니다.

- 치킨집 (동네 가게)
- 친환경 텀블러 (소셜벤처)

## 실행

- 파일 하나로 실행: `teen-startup.html`을 브라우저로 엽니다.
- 개발: `npm install` 후 `npm run dev`
- 빌드: `npm run build` → `dist/index.html`이 만들어지고 `teen-startup.html`로 복사됩니다.

## 폴더

| 경로 | 내용 |
|---|---|
| `src/engine.js` | 장사 계산(지표, 손익, 가게 키우기, 대표 상품, 역량 점수). 모든 업종이 함께 씀 |
| `src/tracks.js` | 업종별 처음 숫자, 이름과 문구 |
| `src/cards.js` | 치킨집 카드 25장 |
| `src/tumbler.js` | 친환경 텀블러 카드 15장 |
| `src/shop.js` | Three.js로 만든 3D 가게 |
| `src/main.js`, `src/style.css` | 화면과 흐름 |
| `src/audio.js` | 효과음과 배경 음악 |
| `활동지/` | 사전·사후 활동지, 교사용 안내(한글 파일) |

## 배포 (Vercel)

저장소 맨 위가 곧 프로젝트입니다. Root Directory는 비워 두고, Framework는 Vite, Build Command는 `npm run build`, Output Directory는 `dist`입니다.
