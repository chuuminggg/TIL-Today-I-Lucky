import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // k-skill 패키지는 CommonJS + 로컬 데이터 파일(한자 획수 등)을 읽으므로 번들링하지 않고 Node require로 로드
  serverExternalPackages: ["saju-fortune", "naming-house"],
  // 서비스 워커는 바로 새 버전이 적용되도록 캐시하지 않는다 (Next.js PWA 가이드)
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
