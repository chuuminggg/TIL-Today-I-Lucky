// 사이트맵·robots·구조화 데이터처럼 절대 주소가 필요한 곳의 기준 주소.
// 커스텀 도메인이면 NEXT_PUBLIC_SITE_URL, 아니면 Vercel 프로덕션 주소(미리보기 배포에서도 프로덕션을 가리킴)
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
