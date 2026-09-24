# 🔮 타로 상세 운세 — 개발 계획

> 사주 없이 **타로만으로** 주제별 상세 운세를 보는 기능.
> 레퍼런스: [더메인타로 무료 타로 테스트](https://themaintarot.com/free-tarot-test/)
> (흐름: 질문 입력 → 카드 뽑기 → 해석). 더메인타로는 해석을 외부 AI에 맡기지만(프롬프트 복사), 우리는 **규칙 기반 해석을 직접 보여주고** LLM은 문장 다듬기에만 쓴다.

현재 상태(MVP): `src/lib/tarot/cards.ts`에 78장 데이터(메이저는 정·역 해석, 마이너는 키워드 + 템플릿 문장), `drawCards(seed)`로 원카드만 제공, 카드 앞면은 이모지.

---

## 1. 참고 자료와 활용 방식

| 자료 | 링크 | 활용 |
| --- | --- | --- |
| 메이저 아르카나 해석 | https://themaintarot.com/tarot-card-meaning/major-arcana/ | 카드별 필드 구조 참고 |
| 마이너 아르카나 해석 | https://themaintarot.com/tarot-card-meaning/minor-arcana/ | 수트·숫자·궁정카드 해석 체계 참고 |
| 타로 공부 자료 | https://themaintarot.com/tarot-learning/ | 스프레드, 원소 상성(Elemental Dignities), 카드 조합, 궁정카드 해석 원칙 |
| 카드 이미지 | https://luciellaes.itch.io/rider-waite-smith-tarot-cards-cc0 | 라이더-웨이트-스미스(RWS) 카드 이미지 |

**더메인타로 카드 페이지 구조** (예: [바보](https://themaintarot.com/the-fool-meaning/)) — 우리 데이터 스키마의 기준으로 삼는다.

1. 키워드 (일반·연애·금전·직업·조언)
2. 상징 요소 (숫자, 인물, 소지품, 배경 등)
3. 다른 카드와의 조합 — 반대 카드 / 강화 카드
4. 긍정적 의미 / 부정적 의미
5. 연애운 (성향, 속마음, 기존 관계, 재회) · 대인관계 · 직업운 · 금전운
6. 조언

> ⚠️ **저작권**: 더메인타로의 해석 문장은 저작물이다. **구조와 해석 체계만 참고하고 문장은 직접 작성**한다(복사·붙여넣기 금지). 카드 의미 자체(전통적 상징)는 공공 지식이라 자유롭게 서술 가능.

---

## 2. 사용자 흐름

```
/tarot
  ① 주제 선택        연애 · 재회 · 속마음 · 직업/이직 · 금전 · 학업 · 인간관계 · 오늘/이번 주 · 예/아니오 · 자유 질문
  ② 질문 입력(선택)   "그 사람과 다시 연락이 될까?"  (주제별 예시 질문 칩 제공)
  ③ 스프레드 선택     주제에 맞는 스프레드 자동 추천 + 변경 가능
  ④ 셔플              카드 뭉치 셔플 애니메이션 → "마음이 정해지면 멈추기"
  ⑤ 카드 고르기       78장을 부채꼴로 펼쳐 N장 직접 선택 (선택 순서 = 포지션 순서)
  ⑥ 한 장씩 뒤집기    포지션 이름을 보여주며 순서대로 공개
  ⑦ 결과              종합 요약 → 카드별 해석 → 흐름/조합 분석 → 조언 → (예/아니오 판정)
  ⑧ 저장·공유         결과 링크, 이미지 카드, TIL 캘린더 기록
```

- **랜덤성**: 오늘의 타로(원카드)는 지금처럼 `사람+날짜` 시드로 고정. 상세 타로는 **매번 새 시드**(`crypto.randomUUID()`)로 셔플 → 사용자가 직접 고른 인덱스로 카드 결정. 시드와 선택 인덱스를 저장하면 같은 결과를 재현할 수 있다.
- **역방향**: 셔플 때 카드별로 30% 확률(현행 `REVERSED_RATE`)로 뒤집힘. 설정에서 "역방향 사용 안 함" 옵션 제공.
- 같은 질문 반복 방지: 같은 주제를 짧은 시간에 다시 보면 "타로는 같은 질문을 반복하면 흐려져요" 안내(차단은 하지 않음).

---

## 3. 스프레드

`src/lib/tarot/spreads.ts`에 데이터로 정의 — 포지션마다 **해석 관점(lens)** 을 붙여 같은 카드라도 위치에 따라 다른 문장을 고른다.

| id | 이름 | 장수 | 포지션 | 추천 주제 |
| --- | --- | --- | --- | --- |
| `one` | 원 카드 | 1 | 핵심 메시지 | 오늘, 간단한 질문 |
| `yes-no` | 예/아니오 | 1 또는 3 | (3장) 흐름 · 결과 · 조언 | 예/아니오 |
| `three-time` | 과거·현재·미래 | 3 | 과거 · 현재 · 미래 | 전반, 재회, 학업 |
| `three-action` | 상황·행동·결과 | 3 | 현재 상황 · 해야 할 행동 · 예상 결과 | 직업, 금전 |
| `relationship` | 관계 스프레드 | 5 | 나의 마음 · 상대의 마음 · 현재 관계 · 장애물 · 앞으로의 전망 | 연애, 속마음, 인간관계 |
| `reunion` | 재회 스프레드 | 5 | 헤어진 이유 · 상대의 현재 마음 · 나의 현재 마음 · 재회 가능성 · 조언 | 재회 |
| `choice` | 양자택일 | 5 | 현재 상황 · A를 택하면 · A의 결과 · B를 택하면 · B의 결과 | 이직, 선택 고민 |
| `week` | 이번 주 운세 | 7 | 월 ~ 일 | 오늘/이번 주 |
| `celtic-cross` | 켈틱 크로스 | 10 | 현재 · 장애물 · 목표(의식) · 근원(무의식) · 과거 · 가까운 미래 · 나의 태도 · 주변 환경 · 희망과 두려움 · 최종 결과 | 깊은 고민 (고급) |

```ts
interface SpreadPosition {
  key: string;            // "obstacle"
  label: string;          // "장애물"
  question: string;       // "무엇이 나를 막고 있나요?"
  lens: "situation" | "feeling" | "obstacle" | "advice" | "outcome" | "past" | "future";
  layout: { x: number; y: number; rotate?: number }; // 결과 화면 배치(그리드 단위)
}
interface Spread {
  id: string; name: string; description: string;
  topics: Topic[];         // 추천 주제
  positions: SpreadPosition[];
  level: "basic" | "advanced";
}
```

---

## 4. 카드 데이터 확장

현재 `TarotCard`는 정/역 키워드·의미·조언만 있다. 주제별 상세 해석을 위해 아래로 확장한다.

```ts
type Topic = "general" | "love" | "reunion" | "career" | "money" | "study" | "relationship" | "health";
type Element = "fire" | "water" | "air" | "earth";

interface TarotCard {
  id: string;               // "major-00", "wands-01" … "pentacles-14"
  slug: string;             // "the-fool" — 카드 사전 URL
  name: string; nameEn: string;
  arcana: "major" | "minor";
  suit?: Suit;
  number: number;           // 메이저 0–21, 마이너 1–14 (11 시종, 12 기사, 13 여왕, 14 왕)
  element: Element;         // 메이저는 대응 점성술 기준, 마이너는 수트 기준
  image: string;            // "/tarot/rws/major-00-the-fool.webp"
  symbols: Array<{ name: string; meaning: string }>;   // 상징 요소
  upright: CardSide;
  reversed: CardSide;
  yesNo: { upright: "yes" | "no" | "maybe"; reversed: "yes" | "no" | "maybe" };
  combos: { reinforce: string[]; oppose: string[] }; // 카드 id
}

interface CardSide {
  keywords: string[];
  summary: string;                        // 한 줄 의미
  positive: string; negative: string;     // 긍정적/부정적 측면
  topics: Partial<Record<Topic, string>>; // 주제별 해석 (연애는 성향·속마음·관계·재회를 한 문단에)
  feeling?: string;                       // "상대의 마음" 포지션용 — 속마음 해석
  advice: string;
}
```

- **작성 분량**: 78장 × 정/역 × (요약 + 긍·부정 + 주제 6개 + 조언) ≈ 1,500 문단. 한 번에 다 쓰지 않고 **메이저 22장 → 마이너 궁정카드 16장 → 마이너 숫자카드 40장** 순으로 채운다.
- 필드가 비어 있으면 fallback: 수트 테마 × 숫자 의미 × 키워드로 문장을 조합(지금 마이너 방식). 그래서 데이터가 덜 채워져도 기능은 동작한다.
- 마이너 숫자 카드 fallback용 **숫자 의미표**: 1 시작 · 2 균형/선택 · 3 성장/협력 · 4 안정 · 5 갈등/변화 · 6 조화/회복 · 7 도전/성찰 · 8 움직임/숙련 · 9 성숙/절정 · 10 완성/전환.
- **데이터 검증 테스트**: 78장 존재, id·slug 중복 없음, 모든 이미지 파일 존재, `combos`가 유효한 id를 가리키는지.

---

## 5. 해석 엔진 (`src/lib/tarot/interpret.ts`)

LLM 없이도 완결된 결과가 나오게 **규칙 기반**으로 만든다. 입력은 `{ topic, question?, spread, cards: DrawnCard[] }`, 출력은 구조화된 `Reading` JSON.

### 5.1 카드별 해석
포지션 lens × 주제 × 정/역 으로 문장 선택:
- `feeling` 포지션 → `side.feeling` → 없으면 `side.topics.love`
- `obstacle` 포지션 → `side.negative` (정방향이어도 "주의할 점" 관점으로)
- `advice` 포지션 → `side.advice`
- 그 외 → `side.topics[topic]` → `side.summary`

### 5.2 스프레드 전체 분석 (타로 공부 자료의 해석 원칙)
| 분석 | 규칙 | 결과 문장 예 |
| --- | --- | --- |
| 메이저 비율 | 메이저 ≥ 50% | "큰 흐름이 움직이는 시기 — 운명적인 전환점" |
| 수트 분포 | 가장 많은 수트 | 완드=열정·일, 컵=감정, 소드=생각·갈등, 펜타클=현실·돈 |
| 원소 상성 | 인접 카드 원소: 불↔물, 공기↔흙은 상극 / 불↔공기, 물↔흙은 상생 | "마음과 현실이 엇갈려 있어요" |
| 숫자 패턴 | 같은 숫자 2장 이상 | 예: 5가 2장 → "변화와 갈등이 반복되는 흐름" |
| 궁정카드 | 궁정카드 등장 | "주변 인물(성향: …)이 영향을 줍니다" |
| 역방향 비율 | 역방향 ≥ 50% | "막힘·지연이 많은 흐름, 내면 점검 필요" |
| 카드 조합 | `combos.reinforce` / `oppose` 쌍 존재 | 강화: 의미 강조 / 대립: 균형 조언 |
| 흐름 | 과거→현재→미래 카드 점수 변화 | "점점 나아지는 흐름" / "정점 후 조정" |

### 5.3 예/아니오 판정
카드별 `yesNo`를 점수화(yes +1, maybe 0, no −1, 결과 포지션 가중치 ×2) → 합계로 **예 / 아마도 / 아니오** + 근거 카드 표시.

### 5.4 종합 요약·조언
- 요약 = 결과(outcome) 카드 summary + 가장 강한 분석 1–2개
- 조언 = advice 포지션 카드 → 없으면 결과 카드 advice
- 톤 가이드: 공포 조장·단정 금지, "~할 수 있어요" 형식, 건강·금전은 전문가 상담 권유 문구

```ts
interface Reading {
  id: string; createdAt: string;
  topic: Topic; question?: string; spreadId: string;
  seed: string; picks: number[];                 // 재현용
  cards: Array<{ position: SpreadPosition; card: TarotCard; reversed: boolean; text: string }>;
  insights: Array<{ kind: string; text: string }>;
  verdict?: { answer: "yes" | "maybe" | "no"; score: number };
  summary: string; advice: string;
}
```

### 5.5 LLM 풀이 (Phase 3와 공유)
- `Reading` JSON + 질문을 Claude(`claude-sonnet-5`)에 넘겨 **문장만 다듬기**. 카드 선택·판정은 절대 LLM에 맡기지 않는다.
- 스트리밍으로 "리더가 이야기하듯" 출력, 실패 시 규칙 기반 텍스트 그대로 표시.
- 부가 기능: 더메인타로처럼 **"AI에게 물어보기용 프롬프트 복사"** 버튼(비용 0, 구현 간단).

---

## 6. 카드 리소스 저장 구조

### 6.1 이미지 에셋 — 출처 비교와 결정

| | Wikimedia Commons RWS 스캔 ✅ 채택 | itch.io luciellaes 팩 |
| --- | --- | --- |
| 원본 | 1909 RWS 초판 스캔 (Pamela Colman Smith) | Wikipedia 스캔을 정리·축소한 것 |
| 라이선스 | Public domain (78장 모두 확인) | 원화 PD + 뒷면 CC0, "그대로 재판매 금지" 요청 |
| 해상도 | 약 1110×1920 | 300×527 (고해상도 화면에선 흐림) |
| 받는 방법 | 파일명 규칙이 있어 **스크립트로 자동 다운로드** | itch.io에서 **수동 클릭 다운로드** |
| 파일명 | `RWS Tarot 00 Fool.jpg`, `Wands01.jpg`, `Cups01.jpg`, `Swords01.jpg`, `Pents01.jpg` … | 300장(변형 포함) — 78장을 직접 골라야 함 |
| 용량 | 원본 합계 약 70MB → webp 변환 후 약 3MB | 3.2MB(jpg) |

**결정: Wikimedia Commons.** 해상도가 높아 카드 상세 페이지까지 한 소스로 해결되고, 다운로드·변환을 스크립트로 재현할 수 있다. 카드 뒷면은 지금의 CSS 디자인(`CardBack`)을 계속 쓴다.

- 원본은 `assets/tarot/raw/`에 받고(git 제외), `sharp`(Next.js에 포함)로 **600px 폭 webp**로 변환해 `public/tarot/rws/{slug}.webp`에 둔다 (카드당 약 40KB).
- Commons API 호출 시 User-Agent에 프로젝트 이름을 넣는다 (Wikimedia 정책).
- 크레딧: "Card images: Rider–Waite–Smith tarot (1909), illustrated by Pamela Colman Smith — public domain, via Wikimedia Commons".

### 6.2 디렉터리

```
assets/tarot/raw/                 # Commons 원본 jpg (git 제외 — .gitignore)
scripts/tarot/
  fetch-images.mjs                # Commons 다운로드 → webp 변환 → public/tarot/rws/
public/tarot/
  rws/
    the-fool.webp … the-world.webp
    ace-of-wands.webp … king-of-pentacles.webp   (cups/swords/pentacles 동일)
  CREDITS.md                      # 출처·라이선스·크레딧
src/lib/tarot/
  types.ts                        # TarotCard / CardSide 타입
  data/
    major.ts                      # ✅ 메이저 22장 상세 해석 (조합 카드 포함)
    minor.ts                      # ✅ 수트 테마, 숫자·궁정 의미표, 키워드, 예/아니오 보정
  cards.ts                        # ✅ data/* 조립 → TAROT_DECK (순서 고정)
  spreads.ts                      # ✅ 주제 10개 · 스프레드 9종
  draw.ts                         # ✅ drawCards(오늘의 타로) + shuffleDeck / pickCards(상세 타로)
  interpret.ts                    # ✅ 카드별 해석 · 전체 분석 · 예/아니오 판정
  schema.ts history.ts prompt.ts  # ✅ 요청 검증 · 로컬 기록 · AI 프롬프트 복사
src/components/tarot/             # ✅ tarot-app, card-fan, reading-result, card-face(이미지 교체 지점)
```

- 이미지는 `next/image`로 제공(자동 최적화, 지연 로딩). 경로는 `/tarot/rws/${card.slug}.webp` 규칙이라 데이터에 따로 적지 않는다.
- 이미지 교체는 `CardFront` 한 곳만 바꾸면 된다.

---

## 7. 화면·라우트

| 라우트 | 내용 |
| --- | --- |
| `/tarot` | 주제 선택 + 인기 스프레드 |
| `/tarot/reading` | 질문 → 스프레드 → 셔플 → 선택 → 공개 (클라이언트 상태 머신) |
| `/tarot/result/[id]` | 결과(로컬 저장 우선, 로그인 후 서버 저장) — 공유용 OG 이미지 |
| `/tarot/cards` | 카드 사전 — 메이저/수트별 목록 |
| `/tarot/cards/[slug]` | 카드 상세(정·역, 주제별, 상징, 조합) — 정적 생성, SEO 유입 채널 |
| `POST /api/tarot/reading` | `{ topic, question, spreadId, seed, picks }` zod 검증 → `Reading` 반환 |

- 해석은 서버에서 계산(데이터 번들을 클라이언트로 전부 보내지 않기 위해). 셔플·선택 UI는 클라이언트.
- 홈의 "오늘의 타로" 카드에서 "이 카드 더 알아보기" → `/tarot/cards/[slug]`, "더 깊게 보기" → `/tarot`.
- 애니메이션: 셔플·부채꼴 펼침·뒤집기 — 현재 CSS flip(`globals.css`) 확장, 필요 시 Framer Motion.
- 접근성: 카드 선택은 키보드(←/→, Enter)로도 가능, `prefers-reduced-motion`이면 애니메이션 생략.

---

## 8. 단계별 진행

| 단계 | 산출물 | 완료 기준 |
| --- | --- | --- |
| **T1. 리소스** (다음) | Commons 다운로드·`fetch-images.mjs`·`public/tarot/rws/` 78장·`CREDITS.md`, 오늘의 타로 카드 앞면을 이모지 → 실제 이미지로 교체 | 이미지 존재 테스트 통과 |
| **T2. 데이터 스키마** ✅ | `TarotCard` 확장, `data/*` 분리, 숫자·궁정·수트 fallback, 메이저 22장 상세 작성 | 스키마·중복·조합 테스트 통과, 기존 테스트 유지 |
| **T3. 스프레드·뽑기** ✅ | `spreads.ts` 9종, `shuffleDeck`/`pickCards`, 시드 재현 | 같은 seed+picks → 같은 결과 테스트 |
| **T4. 해석 엔진** ✅ | `interpret.ts` (카드별·전체 분석·예/아니오·요약), `/api/tarot/reading` | 스프레드별 스냅샷 테스트 |
| **T5. UI** ✅ | `/tarot` 흐름, 결과 화면, 로컬 기록 | 모바일에서 원카드·쓰리카드·관계 스프레드 끝까지 진행 |
| **T6. 콘텐츠 채우기** | 궁정카드 16장 → 숫자카드 40장 상세 작성 | fallback 사용 카드 0장 |
| **T7. 카드 사전·SEO** | `/tarot/cards`, 정적 생성, OG 이미지 | 78개 페이지 빌드 |
| **T8. LLM** | Claude 문장 다듬기(스트리밍), 프롬프트 복사 버튼 | 실패 시 규칙 기반 fallback 확인 |

`PLAN.md` 로드맵에서는 Phase 4 "상세 기능"의 쓰리카드 타로를 이 계획으로 대체한다.

## 9. 결정이 필요한 것

- 켈틱 크로스(10장)를 초기 출시에 넣을지 — 해석 품질이 가장 어려움 → 기본 제안: T5까지는 제외, 데이터 완성 후 추가
- 결과 서버 저장 여부 — 로그인 도입(Phase 5) 전에는 로컬 저장 + 결과를 URL 파라미터(seed·picks)로 공유
- 카드 이미지 해상도 — 300×527(itch.io)로 시작, 카드 상세 페이지만 Wikimedia 고해상도 사용 여부
