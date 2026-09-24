# TIL — Today I Lucky 🍀

매일 확인하는 오늘의 사주 운세와 타로 한 장. 개발 계획은 [PLAN.md](./PLAN.md) 참고.

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
| `npm run typecheck` | 라우트 타입 생성 후 `tsc --noEmit` |
| `npm run lint` | ESLint |

## 구조

```
src/
  app/
    page.tsx             홈 (요청마다 렌더링)
    api/today/route.ts   POST: 오늘의 운세 + 행운 요소 + 타로
  components/            입력 폼, 운세·행운·타로 카드 (클라이언트)
  lib/
    calendar/            음력·윤달 → 양력, KST 날짜, 오늘의 일진
    saju/                saju-fortune 어댑터, 간지·십신·합충, 오늘 운세 점수, 행운 요소
    naming/              naming-house 어댑터
    tarot/               78장 데이터, 시드 기반 뽑기
    profile/             입력 스키마(zod), localStorage 저장
    today.ts             위 계산을 묶어 API 응답 생성
  types/k-skill.d.ts     saju-fortune / naming-house 타입 선언
```

사주·작명 계산은 [k-skill](https://github.com/NomaDamas/k-skill)의 `saju-fortune`, `naming-house` 패키지를 사용합니다.
두 패키지 모두 음력을 변환하지 않으므로 반드시 `lib/saju/adapter.ts`를 거쳐 호출하세요.

> 운세 풀이는 재미와 자기점검을 위한 참고용이며 의료·투자·법률·개명 판단을 대신하지 않습니다.
