# 종이의 레시피 · Paper Recipe

한국어 종이접기 검색·도안 탐색 웹 데모입니다. 서버 계산이나 데이터베이스 없이 브라우저에서 동작합니다.

## 바로 실행하기

```sh
python3 -m http.server 4173 --directory dist
```

브라우저에서 http://localhost:4173 을 엽니다. `file://`로 직접 열면 도안 로딩과 iframe 메시지가 제한될 수 있으므로 HTTP 서버를 사용하세요. Node.js 설치, npm 설치, 빌드는 필요하지 않습니다.

## 웹 배포

`dist/` 안의 **내용 전체**를 Apache/Nginx/닷홈/Netlify/Cloudflare Pages 같은 정적 호스팅의 공개 디렉터리에 올리면 됩니다. `index.html`, `style.css`, `app.js`, `recipes.js`, `catalog.js`, `engine/`, `licenses/`, `favicon.svg`가 함께 있어야 합니다. 하위 경로 배포를 지원합니다.

- Apache/FTP: 예를 들어 `/html/paper-recipe/`에 `dist/`의 내용을 업로드합니다.
- Netlify: 이 저장소를 연결하고 publish directory를 `dist`로 지정합니다. Build command는 비웁니다.
- Cloudflare Pages: 프레임워크 없이 배포하고 출력 디렉터리를 `dist`로 지정합니다.
- `.openai/hosting.json`은 로컬 Sites 호스팅 설정이며 GitHub/소스 ZIP/FTP 배포에서는 제외합니다.

FTP 비밀번호, 토큰, 사용자 파일은 소스에 들어 있지 않습니다. 업로드한 FOLD 파일도 서버로 전송하지 않습니다.

## 현재 구현 범위

- 동물 10종 + 꽃과 장식 4종 + 생활 소품 6종, 총 20개 검색·분류·상세 안내
- 봉투: 네 단계의 접힘을 제어하는 3D 시뮬레이션
- 학·종이비행기: OrigamiSimulator 원본 도안을 이용한 전체 접힘 3D 탐색. 인간이 따라 접는 순차 동작을 생성하는 기능은 아닙니다.
- 나머지 17개: 준비물·난이도·예상 시간·원본 사진 튜토리얼 링크. 현재 해당 모델의 3D 시뮬레이션은 제공하지 않습니다.
- 문접기·아코디언·삼각 접기는 검색창의 기본 접기 바로가기로 추가 체험할 수 있습니다.
- 단계 선택·재생·속도·진행률·시점 회전·확대·종이 색·전개도
- `.fold` 가져오기 및 전개도/현재 3D 모양 내보내기
- 반응형 화면, 키보드로 조작 가능한 버튼, 동작 감소 설정 지원

### 20개 목록

종이학, 고양이 얼굴, 강아지 얼굴, 여우, 토끼 얼굴, 점프하는 개구리, 나비, 물고기, 백조, 고래, 종이비행기, 종이배, 하트, 백합, 연꽃, 별, 작은 상자, 종이컵, 모자, 편지봉투.

검색은 준비된 목록을 찾습니다. 임의의 텍스트로 새로운 유효한 접기 레시피를 생성하지 않습니다. 종이 두께와 충돌은 시뮬레이션하지 않으므로 종이가 일부 겹쳐 보일 수 있습니다.

## 사용한 오픈소스

1. **OrigamiSimulator** — Amanda Ghassaei, MIT. 기준 커밋 [`7855983`](https://github.com/amandaghassaei/OrigamiSimulator/tree/7855983). GPU solver·모델·셰이더를 `dist/engine/`에 보존하고, 단계별 목표 각도 및 부하 제한 어댑터를 추가했습니다.
2. **FOLD** — Erik Demaine, Jason Ku, Robert Lang, MIT. [원본](https://github.com/edemaine/fold). 시뮬레이터에 포함된 호환 버전을 사용해 면·선 그래프를 구성하고 FOLD 파일을 읽고 씁니다.

학 도안은 원본 저장소의 `flat_crane.svg`, 비행기는 Scott Pakin이 작성한 `airplane.svg`를 사용합니다. 해당 파일의 메타데이터와 원저작권 표시를 보존했습니다. 주요 라이선스 전문은 `dist/licenses/`에 있습니다. 원본 엔진의 Three.js, jQuery, Underscore, Earcut, numeric.js 등의 파일 내 저작권 표시는 유지합니다.

동물 등 사진 튜토리얼은 [Origami Guide](https://origami.guide/howto/easy-origami/)의 원본 페이지로 연결합니다. 외부 사이트의 사진이나 전체 접기 설명을 복사하지 않았습니다. 카드 일러스트는 이 데모에서 작성한 SVG입니다.

## 자원 사용 제한

계산은 최대 24fps, 기본 도안은 프레임당 8회, 학·비행기는 16회의 solver 계산으로 제한합니다. 짧은 계산 후 정지하며, 탭이 숨겨지거나 프레임 처리 시간이 오래 걸리면 일시정지합니다. 브라우저는 시스템 CPU/GPU 사용률을 직접 읽지 않습니다.

## 파일 구성

- `dist/index.html`, `dist/style.css`, `dist/app.js`: 화면과 동작
- `dist/recipes.js`: 직접 작성한 네 가지 기본 도안과 FOLD 그래프 구성
- `dist/catalog.js`: 20개 목록과 출처
- `dist/engine/studio-engine.js`: 원본 엔진 연결·메시지·자원 제한
- `dist/engine/js/dynamic/dynamicSolver.js`: 단계별 목표 각도 갱신을 위한 작은 수정
- `dist/engine/js/pattern.js`: SVG 로딩 완료 연결 및 전환 중 오래된 응답 무시
- `scripts/check.mjs`: 문법·도안 그래프·20개 목록·로컬 파일 확인
- `scripts/package.py`: 정적 호스팅용 ZIP과 소스 ZIP 생성
