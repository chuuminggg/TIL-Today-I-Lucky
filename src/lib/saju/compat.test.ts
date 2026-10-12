import { describe, expect, it } from "vitest";
import { compatibility } from "./adapter";
import { getCompatDetail } from "./compat";

const me = { name: "민지", birthDate: "1990-03-15", birthTime: "10:30", gender: "female" as const, calendar: "solar" as const };
const partner = { name: "준호", birthDate: "1992-10-24", birthTime: "05:30", gender: "male" as const, calendar: "solar" as const };
const pad = (n: number) => String(n).padStart(2, "0");

describe("getCompatDetail", () => {
  const d = getCompatDetail(me, partner, "lover");

  it("점수는 패키지 공식 그대로, 제목은 점수대별", () => {
    expect(d.score).toBe(compatibility(me, partner).score);
    expect(d.headline).toMatch(/궁합이에요$/);
  });

  it("두 사람 요약: 닉네임·일간·띠", () => {
    expect(d.people[0]).toMatchObject({ nickname: "민지", dayMaster: { ko: "기" }, animal: "말" });
    expect(d.people[1]).toMatchObject({ nickname: "준호", dayMaster: { ko: "계" }, animal: "원숭이" }); // 壬申 庚戌 癸酉
  });

  it("일간 관계: 기토에게 계수는 편재, 계수에게 기토는 편관", () => {
    expect(d.roles.meToPartner.tenGod).toBe("편재");
    expect(d.roles.partnerToMe.tenGod).toBe("편관");
    expect(d.elementBond).toContain("다스리는 상극");
  });

  it("잘 맞는 점·조심할 점 1~3개, 관계 유형별 팁", () => {
    for (const list of [d.goods, d.cautions]) {
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.length).toBeLessThanOrEqual(3);
    }
    expect(getCompatDetail(me, partner, "coworker").tips[0]).toContain("역할과 마감");
  });

  it("같은 띠, 시간 모름", () => {
    const same = getCompatDetail(me, { ...partner, birthDate: "1990-06-01", birthTime: undefined }, "friend");
    expect(same.zodiac.text).toContain("같은 띠");
    expect(same.people[1].pillars[3]).toBe("??");
    expect(same.limitations.join(" ")).toContain("시주를 뺀 궁합");
  });

  it("무작위 100쌍 — 빈 문장·조사 미처리 없음", () => {
    for (let i = 0; i < 100; i++) {
      const a = { birthDate: `${1960 + (i % 40)}-${pad(1 + (i % 12))}-${pad(1 + (i % 27))}`, birthTime: "09:00", gender: "female" as const, calendar: "solar" as const };
      const b = { birthDate: `${1965 + ((i * 3) % 35)}-${pad(1 + ((i * 7) % 12))}-${pad(1 + ((i * 5) % 27))}`, gender: "male" as const, calendar: "solar" as const };
      expect(JSON.stringify(getCompatDetail(a, b, "lover"))).not.toMatch(/undefined|\(이\)|\(가\)|\(을\)/);
    }
  });
});
