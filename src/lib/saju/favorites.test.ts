import { describe, expect, it } from "vitest";
import type { BirthProfileInput } from "@/lib/profile/schema";
import { addFavorite, MAX_FAVORITES, parseFavorites, removeFavorite, sameBirth, type Favorite } from "./favorites";

const mom: BirthProfileInput = { calendar: "lunar", birthDate: "1965-08-12", gender: "female" };
const fav = (id: string, label: string, profile: BirthProfileInput = mom): Favorite => ({ id, label, profile, savedAt: "2026-10-13T00:00:00Z" });

describe("즐겨찾기", () => {
  it("같은 사람은 이름이 달라도 사주 값으로 판단한다", () => {
    expect(sameBirth({ ...mom, name: "엄마" }, { ...mom, name: "어머니" })).toBe(true);
    expect(sameBirth(mom, { ...mom, birthTime: "09:00" })).toBe(false);
    expect(sameBirth(mom, { ...mom, isLeapMonth: false })).toBe(true); // undefined === false
    expect(sameBirth(mom, { ...mom, calendar: "solar" })).toBe(false);
  });

  it("새 사람은 맨 앞에, 같은 사람은 이름만 바꿔 맨 앞으로", () => {
    const dad: BirthProfileInput = { ...mom, birthDate: "1962-01-30", gender: "male" };
    let list = addFavorite([], fav("a", "엄마"));
    list = addFavorite(list, fav("b", "아빠", dad));
    expect(list.map((f) => f.label)).toEqual(["아빠", "엄마"]);
    list = addFavorite(list, fav("c", "어머니"));
    expect(list.map((f) => [f.id, f.label])).toEqual([["a", "어머니"], ["b", "아빠"]]);
  });

  it(`최대 ${MAX_FAVORITES}명, 넘치면 오류`, () => {
    const full = Array.from({ length: MAX_FAVORITES }, (_, i) => fav(`id${i}`, `p${i}`, { ...mom, birthDate: `19${50 + i}-01-01` }));
    expect(() => addFavorite(full, fav("new", "새 사람", { ...mom, birthDate: "2001-01-01" }))).toThrow("최대");
    expect(addFavorite(full, fav("dup", "이미 있음", full[5].profile))).toHaveLength(MAX_FAVORITES); // 같은 사람은 허용
  });

  it("삭제와 손상된 저장값 무시", () => {
    expect(removeFavorite([fav("a", "엄마")], "a")).toEqual([]);
    expect(parseFavorites("not json")).toEqual([]);
    expect(parseFavorites(JSON.stringify([fav("a", "엄마"), { id: "x", label: "깨짐", profile: { birthDate: "nope" } }]))).toHaveLength(1);
  });
});
