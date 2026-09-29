import { getBranchTenGod, getTenGod, type EarthlyBranch, type HeavenlyStem } from "manseryeok";
import { describe, expect, it } from "vitest";
import { BRANCHES, branchIndexByKo, branchRelations, HIDDEN_STEMS, STEMS, stemByKo, tenGodOf, threeHarmonyOf } from "./ganji";

const b = (ko: string) => branchIndexByKo(ko);

describe("지지 관계", () => {
  it("육합·삼합·충·형", () => {
    expect(branchRelations(b("자"), b("축"))).toEqual(["육합"]);
    expect(branchRelations(b("자"), b("오"))).toEqual(["충"]);
    expect(branchRelations(b("인"), b("사"))).toEqual(["형"]);
    expect(branchRelations(b("자"), b("묘"))).toEqual(["형"]);
    expect(branchRelations(b("오"), b("오"))).toEqual(["형"]); // 자형
    expect(branchRelations(b("인"), b("오"))).toEqual(["삼합"]);
    expect(branchRelations(b("인"), b("해"))).toEqual(["육합"]);
    expect(branchRelations(b("인"), b("신"))).toEqual(["충", "형"]);
    expect(branchRelations(b("묘"), b("유"))).toEqual(["충"]);
    expect(branchRelations(b("자"), b("자"))).toEqual([]);
  });

  it("삼합 오행", () => {
    expect(threeHarmonyOf(b("신"), b("진"))).toBe("water");
    expect(threeHarmonyOf(b("묘"), b("미"))).toBe("wood");
    expect(threeHarmonyOf(b("유"), b("축"))).toBe("metal");
    expect(threeHarmonyOf(b("자"), b("오"))).toBeNull();
  });
});

describe("지장간·십신 — manseryeok과 대조", () => {
  it("모든 일간 × 천간의 십신이 같다", () => {
    for (const dm of STEMS) for (const t of STEMS) {
      expect(tenGodOf(dm, t), `${dm.ko}→${t.ko}`).toBe(getTenGod(dm.ko as HeavenlyStem, t.ko as HeavenlyStem));
    }
  });

  it("지장간의 마지막(정기)으로 구한 지지 십신이 manseryeok(본기 기준)과 같다", () => {
    for (const dm of STEMS) for (const { ko } of BRANCHES) {
      const main = stemByKo(HIDDEN_STEMS[ko].at(-1)!);
      expect(tenGodOf(dm, main), `${dm.ko}→${ko}`).toBe(getBranchTenGod(dm.ko as HeavenlyStem, ko as EarthlyBranch));
    }
  });
});
