# Folio — Portfolio Studio

실무 수준의 포트폴리오 편집 앱. React + Vite + TypeScript + Supabase 스택.

---

## 기술 스택

- **프론트엔드**: React 18 + Vite + TypeScript
- **상태 관리**: Zustand
- **백엔드/인증**: Supabase (PostgreSQL + Auth + Storage)
- **PDF 내보내기**: html2canvas + jsPDF
- **아이콘**: Lucide React
- **폰트**: DM Sans, DM Mono (Google Fonts)

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **SQL Editor**에서 `src/lib/supabase.ts` 파일 상단 주석의 SQL 쿼리 실행
3. **Storage** → New Bucket → 이름: `assets`, Public: false 설정
4. Storage 정책 추가:
   - 정책 이름: `User asset access`
   - 조건: `auth.uid()::text = (storage.foldername(name))[1]`

### 3. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 Supabase 프로젝트 URL과 anon key 입력:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

URL과 Key는 Supabase 대시보드 → **Project Settings** → **API**에서 확인

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 5. 프로덕션 빌드

```bash
npm run build
npm run preview
```

---

## 기능 목록

### 캔버스
- A4, A3, B4, Letter, HD, 정사각형, Instagram, 사용자 지정 크기
- mm/px 단위 변환
- 캔버스 크기 변경 시 자동 화면 맞춤 (fit zoom)
- Ctrl/Cmd + 휠로 줌 인/아웃
- 눈금 표시 (그리드)
- 자석 스냅 가이드 (요소 간 정렬 보조선)

### 요소
- 이미지: 드래그&드롭, 클릭 배치
- 텍스트: 더블클릭으로 편집, 다양한 폰트/크기/색상/정렬
- 도형: 사각형, 타원, 채우기/테두리 색상
- **비율 유지 크기 조절** (슬라이더 아닌 핸들)

### 편집
- 드래그 이동, 핸들 리사이즈 (비율 고정)
- 좌우/상하 반전, 회전 (+15° 단위 또는 수치 입력)
- 투명도 조절
- 레이어 앞으로/뒤로/맨앞/맨뒤
- 잠금, 숨기기
- 실행취소/다시실행 (50단계)
- 다중 선택 (Shift 클릭) 및 일괄 정렬

### 텍스트 서식
- 폰트 패밀리 (DM Sans, Georgia, Arial 등 기본 제공)
- 사용자 지정 폰트 업로드 (.ttf/.otf/.woff)
- 크기, 굵게, 기울기, 밑줄
- 왼쪽/가운데/오른쪽 정렬
- 글자색, 배경색

### 페이지
- 페이지 추가/삭제/복제
- 페이지 이름 더블클릭으로 변경
- 하단 썸네일 스트립으로 페이지 미리보기

### 에셋
- 이미지 업로드 (자동 Supabase 클라우드 저장)
- 날짜/이름 정렬
- 태그 필터, 텍스트 검색

### 템플릿
- 빌트인: 빈 페이지, 히어로, 2열 그리드
- 현재 페이지를 사용자 템플릿으로 저장

### 내보내기
- PDF 내보내기 (html2canvas + jsPDF)
- 웹 링크 생성 및 클립보드 복사

### 워터마크
- 사용자 지정 텍스트 워터마크
- 토글로 켜기/끄기

### 테마
- 다크 모드
- 라이트 모드  
- 그린 모드 (눈의 피로 저하)

---

## 프로젝트 구조

```
src/
├── components/
│   ├── canvas/
│   │   ├── Canvas.tsx              # 메인 캔버스 (드래그/리사이즈/스냅)
│   │   ├── CanvasElementRenderer.tsx  # 요소 렌더러
│   │   └── PageStrip.tsx           # 하단 페이지 썸네일
│   ├── toolbar/
│   │   └── Topbar.tsx              # 상단 툴바
│   ├── sidebar/
│   │   └── LeftSidebar.tsx         # 프로젝트/에셋 사이드바
│   ├── panels/
│   │   └── RightPanel.tsx          # 속성/레이어 패널
│   ├── modals/
│   │   ├── CanvasSizeModal.tsx
│   │   └── TemplatesModal.tsx
│   ├── ui/
│   │   └── CanvasSizeButton.tsx
│   ├── HomeScreen.tsx              # 홈 화면 (프로젝트 브라우저)
│   └── EditorLayout.tsx            # 편집기 레이아웃
├── stores/
│   └── useStore.ts                 # Zustand 전역 상태
├── lib/
│   └── supabase.ts                 # Supabase 클라이언트 + DB 스키마
├── types/
│   └── index.ts                    # TypeScript 타입 정의
├── utils/
│   ├── canvas.ts                   # 스냅, 좌표 변환, 요소 생성 유틸
│   └── export.ts                   # PDF 내보내기, 링크 공유
└── styles/
    └── globals.css                 # 전역 CSS 변수 (다크/라이트/그린)
```

---

## 배포

### Vercel

```bash
npm install -g vercel
vercel --prod
```

환경 변수를 Vercel 대시보드에 추가:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

```bash
npm run build
# dist/ 폴더를 Netlify에 드래그 드롭
```

---

## 확장 계획

- [ ] Fabric.js 통합으로 자유 변형 (Free Transform)
- [ ] 협업 기능 (Supabase Realtime)
- [ ] AI 레이아웃 제안
- [ ] 고해상도 PNG/JPG 내보내기
- [ ] 웹 링크 실제 공유 뷰어 페이지
- [ ] 모바일 터치 지원
