import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // k-skill 패키지는 CommonJS + 로컬 데이터 파일(한자 획수 등)을 읽으므로 번들링하지 않고 Node require로 로드
  serverExternalPackages: ["saju-fortune", "naming-house"],
};

export default nextConfig;
