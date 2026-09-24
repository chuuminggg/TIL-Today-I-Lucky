import { describe, expect, it } from "vitest";
import { josa } from "./josa";

describe("josa", () => {
  it("받침 유무에 따라 조사를 고른다", () => {
    expect(josa("0. 바보", "과", "와")).toBe("0. 바보와");
    expect(josa("19. 태양", "과", "와")).toBe("19. 태양과");
    expect(josa("🌬️공기", "과", "와")).toBe("🌬️공기와");
    expect(josa("🔥불", "과", "와")).toBe("🔥불과");
  });

  it("숫자로 끝나면 읽는 소리 기준", () => {
    expect(josa("소드 2", "이", "가")).toBe("소드 2가");
    expect(josa("컵 10", "이", "가")).toBe("컵 10이");
    expect(josa("완드 3", "은", "는")).toBe("완드 3은");
  });
});
