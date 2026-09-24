# TIL — Today I Lucky 🍀 개발 계획

> 매일 들어와서 **오늘의 사주 운세 + 오늘의 타로 한 장**을 확인하는 운세 사이트.
> 확장 기능으로 사주 상세 풀이 · 궁합 · 작명소를 제공한다.

---

## 1. 목표와 범위

| 구분 | 내용 |
| --- | --- |
| 핵심 가치 | "매일 1분" — 오늘의 총운 · 행운 요소 · 타로 한 장을 빠르게 확인 |
| 재방문 장치 | 날짜별 운세 기록(TIL 캘린더), 연속 방문 스트릭, 알림(선택) |
| 차별점 | 계산은 **결정적 로직**(만세력 엔진)으로 정확하게, 풀이 문장은 **LLM**으로 자연스럽게 |
| 비범위(초기) | 결제, 커뮤니티, 전문가 상담 연결 |

### 참고: k-skill 패키지 재사용

| 기능 | npm 패키지 | 주요 API | 참고 문서 |
| --- | --- | --- | --- |
| 사주 운세 풀이 | `saju-fortune` (v0.2.0) | `analyzeSaju`, `checkCompatibility`, `callSajuTool` | [saju-fortune.md](https://github.com/NomaDamas/k-skill/blob/main/docs/features/saju-fortune.md) |
| 작명소 | `naming-house` (v0.2.1) | `recommendNames` | [naming-house.md](https://github.com/NomaDamas/k-skill/blob/main/docs/features/naming-house.md) |

- 두 패키지 모두 **API 키 불필요**, 로컬에서 결정적으로 계산 → 서버(API Route)에서 직접 import
- 두 패키지 모두 **음력/윤달을 자동 변환하지 않음** → 음력 입력은 우리 쪽 `lib/calendar`에서 양력으로 변환한 뒤 넘긴다
- 출생시 모름이면 시주 및 시주 기반 해석(작명의 오행 보완 포함)은 "잠정" 표시
- 문서 권고대로 "재미·자기점검/참고용이며 의료·투자·법률·개명 판단을 대신하지 않음" 고지

## 2. 기능 목록

### 2.1 오늘의 운세 (MVP · 메인 화면)
- 입력: 생년월일시, 성별, 양력/음력(윤달 여부), 출생시 모름 옵션
- 계산: 본인 **일간(日干)** × 오늘의 **일진(日辰)** → 십신(十神) 관계 + 오행 상생/상극
- 출력
  - 총운 점수(0–100) + 한 줄 요약
  - 분야별 오늘 운: 연애 · 재물 · 직업 · 건강 (각 ★1–5 + 2~3문장)
  - **행운 요소**: 행운 색 · 숫자 · 방향 · 시간대 · 아이템 (용신/부족 오행 기반)
  - 오늘의 조언 / 피해야 할 것

### 2.2 오늘의 타로 (MVP)
- 하루 한 장 뽑기 (같은 날 다시 들어와도 같은 카드 — `seed = userId + 날짜`)
- 스프레드: 원 카드(오늘), 쓰리 카드(과거·현재·미래), 질문형(예/아니오)
- 78장 데이터(메이저 22 + 마이너 56), 정/역방향, 키워드·의미·분야별 해석
- 카드 뒤집기 애니메이션
- 👉 타로 단독 상세 운세(주제·스프레드·해석 엔진·카드 이미지 리소스)는 [docs/TAROT_PLAN.md](docs/TAROT_PLAN.md)

### 2.3 사주 상세 풀이 (`saju-fortune` 패키지)
- 인터뷰형 입력 흐름: 이름(선택) → 양/음력 → 생년월일 → 출생 시간 → 성별 → 출생지(선택) → 관심 주제
- 주제: 종합 · 연애 · 재물 · 직업 · 건강 · 연간 운세 · 궁합 → `analyzeSaju` 호출
- 결과 구성: 사주팔자 요약 → 오행 분포 → 주제별 해석 → 실천 조언 → 적용 범위(한계) 안내
- 사주팔자 표(연·월·일·시주, 천간/지지, 지장간)
- 오행 분포 차트(목·화·토·금·수), 신강/신약, 용신 추정
- 분야별 풀이: 연애운 · 재물운 · 직업운 · 건강운, 대운/세운(올해 운)
- 대화형 후속 질문 ("올해 이직해도 될까?") → LLM이 사주 데이터 기반으로 답변

### 2.4 궁합 (`saju-fortune` → `checkCompatibility`)
- 두 사람의 생년월일시·성별을 각각 입력 → 궁합 점수 + 풀이 + 공유 카드

### 2.5 작명소 (`naming-house` 패키지 → `recommendNames`, Phase 6)
- 입력: 성씨(한자 포함), 양/음력, 생년월일, 출생 시간, 성별, 후보 이름(선택), 선호(음절·스타일·뜻)
- 점수 체계(총 100점) — 패키지 결과를 그대로 시각화

  | 항목 | 배점 | 기준 |
  | --- | --- | --- |
  | 오행 보완 | 0–40 | 사주 보완 오행 ↔ 이름 오행 |
  | 획수 조화 | 0–30 | 한자 획수 / 한글 획수 흐름 |
  | 음운 흐름 | 0–20 | 길이, 반복 음절, 발음 패턴 |
  | 선호도 | 0–10 | 음절·스타일·의미 부합 |

- 등급 배지: 우수(85–100) · 좋음(70–84) · 보통(50–69) · 약함(0–49)
- 한글만 입력 시 정밀도 낮음(fallback) 경고, 인명용 한자 여부는 별도 확인 필요 안내

## 3. 기술 스택

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | **Next.js (App Router) + TypeScript** | SSR/SEO, API Route로 백엔드 통합 |
| 스타일 | Tailwind CSS + shadcn/ui, Framer Motion(카드 애니메이션) | 빠른 UI 구성 |
| 사주·궁합 | **`saju-fortune`** | 사주팔자·오행·주제별 운세·궁합 (k-skill) |
| 작명 | **`naming-house`** | 오행 보완·획수·음운 점수 (k-skill) |
| 음력 변환 / 오늘의 일진 | `korean-lunar-calendar` 또는 `lunar-javascript` | 위 패키지가 음력·윤달 변환 미지원, 일진 계산 필요 |
| 풀이 생성 | Claude API (`claude-sonnet-5`) + 규칙 기반 템플릿 fallback | 자연스러운 문장, 장애 시 대체 |
| DB | PostgreSQL (Supabase) + Prisma | 사용자 프로필·일일 결과 캐시 |
| 인증 | 비로그인 우선(로컬 저장) → 선택적 카카오/구글 로그인 | 진입 장벽 최소화 |
| 배포 | Vercel + Cron(자정 캐시 워밍/푸시) | 간단한 운영 |
| 차트 | Recharts (오행 분포) | |

## 4. 아키텍처

```
[Client]
  ├─ 입력 폼 / 인터뷰 UI
  ├─ 오늘의 운세 카드, 타로 카드
  └─ 로컬 프로필(비로그인)
        │
[Next.js API Routes]
  ├─ /api/saju/analyze    → saju-fortune.analyzeSaju
  ├─ /api/today           → 오늘의 운세 + 행운 요소 + 타로 한 장을 한 번에 반환 (✅ MVP, 규칙 기반)
  │                         analyzeSaju(일간·용신) × 오늘 일진(십신·합충) → 점수 → (Phase 3) LLM 풀이·캐시
  ├─ /api/tarot/draw      → 쓰리 카드·질문형 스프레드 (Phase 4)
  ├─ /api/compat          → saju-fortune.checkCompatibility
  ├─ /api/naming          → naming-house.recommendNames
  └─ /api/chat            → 사주 JSON 기반 대화형 Q&A (Claude tool use로 callSajuTool 연결, 스트리밍)
        │
[lib/]
  ├─ calendar/ (lunar.ts: 음력·윤달→양력, iljin.ts: 오늘의 일진)
  ├─ saju/     (adapter.ts: saju-fortune 래퍼·타입, daily.ts: 오늘 운세 점수, luck.ts: 행운요소 매핑)
  ├─ naming/   (adapter.ts: naming-house 래퍼)
  ├─ tarot/    (cards.json, draw.ts, interpret.ts)
  └─ llm/      (prompts/, client.ts, fallback-templates.ts)
```

**원칙:** 간지·오행·점수는 전부 패키지 + `lib/`에서 결정적으로 계산 → LLM에는 계산 결과(JSON)만 전달하고 "문장화"만 맡긴다. LLM이 사주를 직접 계산하지 않게 해서 환각을 차단. 패키지는 어댑터 뒤에 두어 버전 변경·교체에 대비한다.

## 5. 데이터 모델 (초안)

```prisma
model Profile {
  id          String   @id @default(cuid())
  userId      String?
  name        String?
  birthDate   DateTime        // 양력 변환 후 저장
  birthTime   String?         // "HH:mm" | null(모름)
  isLunar     Boolean
  isLeapMonth Boolean  @default(false)
  gender      Gender
  chartJson   Json            // 계산된 사주팔자 캐시
}

model DailyFortune {
  id        String   @id @default(cuid())
  profileId String
  date      String          // "2026-09-24" (KST)
  score     Int
  result    Json            // 분야별 점수·문장·행운요소
  tarotCard Json?
  @@unique([profileId, date])
}
```

## 6. 사주 계산에서 주의할 점 (정확도 체크리스트)

- [ ] **연주는 입춘 기준**, **월주는 절기(節) 기준**으로 바뀜 (음력 1일 기준 아님)
- [ ] **자시(23:00~01:00) 처리**: 야자시/조자시 학파 차이 → 설정 옵션으로
- [ ] **한국 표준시 보정**: 동경 135° 기준 vs 서울 약 127° → 약 -30분 보정 옵션
- [ ] **서머타임**: 1948–1951, 1955–1960, 1987–1988 한국 서머타임 기간 보정
- [ ] 음력 **윤달** 입력 처리
- [ ] 출생시 모름 → 삼주(三柱)만으로 풀이, UI에 명시
- [ ] 대운 방향: 양남음녀 순행 / 음남양녀 역행, 대운수 계산
- [ ] 검증: `saju-fortune` 결과를 공개 만세력과 대조하는 테스트 케이스 50개 이상 → 위 항목 중 패키지가 처리하지 않는 부분만 자체 보정

## 7. 오늘의 운세 산출 로직 (초안)

1. 오늘(KST) 일진 간지 계산
2. 본인 일간 기준 일진 천간의 **십신** 판정 (비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인)
3. 일진 지지와 원국 지지의 **합/충/형/파/해** 확인
4. 일진 오행이 **용신/희신**이면 가점, **기신**이면 감점
5. 분야 가중치: 재성→재물, 관성→직업, 식상→표현·연애(여: 관성 연애), 인성→학업·건강 등
6. 행운 요소 = 용신 오행 매핑 (예: 木 → 초록·3,8·동쪽 / 火 → 빨강·2,7·남쪽 …)
7. 결과 JSON → LLM 프롬프트 → 문장 생성 → `DailyFortune`에 캐시 (하루 1회 생성)

## 8. 화면 구성

1. **홈**: 오늘 날짜·일진, 총운 카드, 타로 카드 뒤집기, 행운 요소 칩
2. **입력/온보딩**: 인터뷰형 단계별 입력
3. **사주 풀이**: 명식 표, 오행 차트, 분야별 탭, 대운 타임라인, 질문 채팅
4. **타로**: 스프레드 선택 → 셔플/선택 → 해석
5. **궁합**: 두 사람 입력 → 결과 공유 카드
6. **TIL 캘린더**: 날짜별 운세·타로 기록, 스트릭
7. **작명소** (Phase 3)
8. 공유용 OG 이미지 (`@vercel/og`)

## 9. 단계별 로드맵

| Phase | 기간(예상) | 산출물 |
| --- | --- | --- |
| **0. 셋업** | 2일 | Next.js 초기화, Tailwind/shadcn, lint/test(Vitest), CI |
| **1. 엔진 연동** | 3–4일 | `saju-fortune`/`naming-house` 어댑터, 음력 변환, 일진 계산, 검증 테스트 |
| **2. MVP** ✅ | 1–2주 | 온보딩, 오늘의 운세(규칙 기반), 오늘의 타로(원카드), 로컬 저장 — 배포·shadcn/ui는 미적용 |
| **3. LLM 풀이** | 1주 | Claude 연동, 프롬프트 설계, 캐시, fallback 템플릿 |
| **4. 상세 기능** | 2주 | 사주 상세 풀이, 대화형 Q&A, 타로 상세 운세([TAROT_PLAN](docs/TAROT_PLAN.md)), 궁합 |
| **5. 리텐션** | 1주 | 로그인, TIL 캘린더·스트릭, 공유 카드, 푸시/카톡 알림 |
| **6. 작명소** | 2주 | 한자 DB 구축, 획수·자원오행·발음오행 점수 로직, UI |

> 👉 2026-09-25 기준 남은 과제와 우선순위는 [docs/NEXT_PLAN.md](docs/NEXT_PLAN.md) — Phase 3(LLM 풀이)는 토큰 0 방식으로 대체.

## 10. 리스크 & 대응

| 리스크 | 대응 |
| --- | --- |
| 만세력 계산 오류 | 기존 만세력과 대조 테스트, 학파 차이는 옵션화 |
| LLM 비용 | 사용자·날짜별 1회 생성 후 캐시, 짧은 출력, 저비용 모델로 일일 운세 |
| LLM이 불안·공포 조장 표현 | 시스템 프롬프트로 톤 제한(긍정적·조언형), 건강·금전 단정 금지 |
| 개인정보(생년월일시) | 최소 수집, 비로그인은 로컬 저장, 서버 저장 시 동의 + 암호화 |
| 법적 고지 | "오락/참고용이며 의학·법률·투자 조언이 아님" 문구 상시 노출 |
| 인명용 한자 데이터 | 대법원 인명용 한자 목록 기반으로 직접 구축(라이선스 확인) |

## 11. 다음 할 일 (바로 시작)

1. `npx create-next-app@latest` 로 프로젝트 초기화 (TS, App Router, Tailwind)
2. `npm i saju-fortune naming-house` 후 `analyzeSaju` / `recommendNames` 출력 JSON 구조 확인 → 타입 정의
3. `lib/calendar/` — 음력·윤달 → 양력 변환, 오늘의 일진 + 테스트
4. `lib/tarot/cards.json` — 78장 카드 데이터 작성
5. 홈 화면 목업 (오늘의 운세 카드 + 타로 카드)
