# TIL — Today I Lucky 🍀

매일 확인하는 오늘의 사주 운세와 타로 한 장, 그리고 주제별 타로 상세 운세(`/tarot`).
개발 계획은 [PLAN.md](./PLAN.md), 타로 계획은 [docs/TAROT_PLAN.md](./docs/TAROT_PLAN.md), 해석 다듬기(T8)는 [docs/TAROT_AI_PLAN.md](./docs/TAROT_AI_PLAN.md), 다음 개선 계획은 [docs/NEXT_PLAN.md](./docs/NEXT_PLAN.md) 참고.

## 시작하기

```bash
npm install
cp .env.example .env.local   # Phase 3부터 필요
npm run dev                  # http://localhost:3000
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm test` | Vitest 단위 테스트 |
| `npm run typecheck` | 라우트 타입 생성(`next typegen`) 후 `tsc --noEmit` — CI용. 개발 서버와 같은 `.next/dev/types`를 덮어쓰므로 개발 서버를 켠 채로는 쓰지 않기 |
| `npm run typecheck:src` | `tsc --noEmit`만 — 개발 서버를 켠 채 타입 검사할 때 (라우트 타입은 개발 서버가 만들어 둔 것 사용) |
| `npm run lint` | ESLint |
| `node scripts/tarot/fetch-images.mjs` | 타로 카드 이미지(Wikimedia Commons, 퍼블릭 도메인) 받기 → `public/tarot/rws/`(화면용 WebP), `public/tarot/og/`(공유 이미지용 JPG) |

## 배포

- `main`에 병합되면 Vercel이 자동으로 Production 배포(https://til-today-i-lucky.vercel.app), 다른 브랜치·PR은 미리보기 배포.
- GitHub Actions CI(`.github/workflows/ci.yml`)가 PR과 `main` 푸시마다 `lint` → `typecheck` → `test` → `build`를 실행. `main` 보호 규칙에서 CI 통과를 필수로 두면 실패한 코드가 배포되지 않는다.
- 절대 주소(OG 이미지·사이트맵·구조화 데이터)는 Vercel 프로덕션 주소를 자동으로 쓴다. 커스텀 도메인을 붙이면 Vercel 환경 변수에 `NEXT_PUBLIC_SITE_URL`을 넣는다.
- 방문 통계는 Vercel Web Analytics(`@vercel/analytics`) — Vercel 대시보드의 프로젝트 → Analytics에서 켜야 수집된다.
- 배포 후 Google Search Console에 `/sitemap.xml` 제출.
- AI 이어 보기 버튼 클릭은 커스텀 이벤트 `ai_handoff`(target·source)로 보낸다 — Vercel 요금제가 커스텀 이벤트를 지원할 때만 Analytics → Events에 보인다.

### 매일 아침 알림 (웹 푸시)

홈 화면에 추가한 앱(PWA)과 Android Chrome에서 매일 08:00(KST) 알림을 받는다. iPhone·iPad는 iOS 16.4 이상에서 **홈 화면에 추가한 앱**으로만 받을 수 있다.

1. Vercel → Storage(Marketplace) → **Upstash for Redis** 를 만들어 이 프로젝트에 연결 → `KV_REST_API_URL`·`KV_REST_API_TOKEN` 이 자동으로 들어온다.
2. Vercel → Settings → Environment Variables 에 추가 (값 만들기: `npx web-push generate-vapid-keys`, 비밀값은 아무 긴 임의 문자열)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`(사이트 주소), `CRON_SECRET`
3. 다시 배포하면 `vercel.json`의 Cron(`0 23 * * *` = 08:00 KST)이 `/api/cron/push`를 부른다.

설정이 없으면 알림 버튼은 화면에서 숨겨진다. 서버에는 구독 주소·암호화 키만 저장하고 생년월일은 보내지 않는다.

## 구조

```
src/
  app/
    page.tsx             홈 (요청마다 렌더링)
    sitemap.ts, robots.ts  검색엔진용 사이트맵(홈·타로·카드 사전 78장), robots.txt
    not-found.tsx, error.tsx, loading.tsx  404·오류·불러오는 중 화면
    tarot/page.tsx       타로 상세 운세 (주제 → 스프레드 → 카드 고르기 → 해석)
    saju/page.tsx        사주 상세 풀이 (명식 표·오행·용신·십신·주제별·대운·세운)
    compat/page.tsx      사주 궁합 (관계 유형 → 상대 입력 → 궁합), 공유 주소(?a=&b=&s=&r=)면 미리보기만 결과로
    tarot/r/page.tsx     공유받은 타로 결과 — 주소(seed·고른 자리)로 서버에서 다시 해석, 검색 제외
    og/tarot/, og/compat/  공유 미리보기 이미지(ImageResponse) — 카드 그림은 public/tarot/og/*.jpg
    tarot/cards/         카드 사전 — 목록 + 78장 상세(빌드 때 정적 생성)
    api/today/route.ts   POST: 오늘의 운세 + 행운 요소 + 타로
    api/tarot/reading/   POST: 스프레드 해석 (seed + 고른 자리 → 결과, 재현 가능)
    api/saju/, api/compat/  POST: 사주 상세 / 궁합 계산
  components/            입력 폼, 운세·행운·타로 카드 (클라이언트)
    tarot/               타로 상세 운세 흐름, 카드 펼치기, 결과 화면, 카드 이미지(card-face)
  lib/
    calendar/            음력·윤달 → 양력, KST 날짜, 오늘의 일진
    saju/                saju-fortune 어댑터(연·월주 절입 보정), 간지·십신·합충·지장간, 오늘 운세 점수, 행운 요소,
                         사주 상세(detail.ts, 대운은 manseryeok)·궁합(compat.ts)·AI 프롬프트, 만세력 대조 테스트
    naming/              naming-house 어댑터
    tarot/               78장 해석 데이터, 스프레드, 시드 기반 뽑기·셔플, 해석 엔진
    profile/             입력 스키마(zod), localStorage 저장
    josa.ts              받침에 맞는 조사 붙이기
    site.ts              절대 주소 기준(SITE_URL)
    today.ts             위 계산을 묶어 API 응답 생성
  types/k-skill.d.ts     saju-fortune / naming-house 타입 선언
```

사주·작명 계산은 [k-skill](https://github.com/NomaDamas/k-skill)의 `saju-fortune`, `naming-house` 패키지를 사용합니다.
두 패키지 모두 음력을 변환하지 않으므로 반드시 `lib/saju/adapter.ts`를 거쳐 호출하세요.
`saju-fortune`은 절기를 고정 날짜로 계산해 절입 전후 출생의 연주·월주가 틀릴 수 있어, 어댑터가 [manseryeok](https://github.com/yhj1024/manseryeok)(한국천문연구원 절입 시각 기반)으로 바로잡습니다 — 대조 테스트는 `lib/saju/accuracy.test.ts`.

> 운세 풀이는 재미와 자기점검을 위한 참고용이며 의료·투자·법률·개명 판단을 대신하지 않습니다.
