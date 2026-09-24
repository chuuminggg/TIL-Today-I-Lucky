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
  app/                 Next.js App Router
  lib/
    calendar/lunar.ts  음력·윤달 → 양력 변환, KST 오늘 날짜
    saju/adapter.ts    saju-fortune 래퍼 (사주 분석·궁합)
    naming/adapter.ts  naming-house 래퍼 (작명 추천·채점)
  types/k-skill.d.ts   saju-fortune / naming-house 타입 선언
```

사주·작명 계산은 [k-skill](https://github.com/NomaDamas/k-skill)의 `saju-fortune`, `naming-house` 패키지를 사용합니다.
두 패키지 모두 음력을 변환하지 않으므로 반드시 `lib/saju/adapter.ts`를 거쳐 호출하세요.

> 운세 풀이는 재미와 자기점검을 위한 참고용이며 의료·투자·법률·개명 판단을 대신하지 않습니다.
