import { describe, expect, it } from "vitest";
import { attach, josa } from "./josa";

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

describe("attach", () => {
  it("쌍 표기로 조사를 붙인다", () => {
    expect(attach("말로 받은 상처", "이/가")).toBe("말로 받은 상처가");
    expect(attach("공정한 판단", "을/를")).toBe("공정한 판단을");
    expect(attach("하나의 완성", "이에요/예요")).toBe("하나의 완성이에요");
    expect(attach("태양 카드", "은/는")).toBe("태양 카드는");
  });

  it("으로/로는 ㄹ 받침에도 로", () => {
    expect(attach("새 길", "으로/로")).toBe("새 길로");
    expect(attach("결실", "으로/로")).toBe("결실로");
    expect(attach("안정", "으로/로")).toBe("안정으로");
    expect(attach("나눔", "으로/로")).toBe("나눔으로");
    expect(attach("미래", "으로/로")).toBe("미래로");
  });
});
