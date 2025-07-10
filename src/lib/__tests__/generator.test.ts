import { generateSet } from "../generator";

describe("generateSet", () => {
  test("throws when pickCount exceeds maxNumber", () => {
    expect(() => generateSet({ maxNumber: 2, pickCount: 3 })).toThrow(
      "pickCount cannot exceed maxNumber",
    );
  });

  test("generates deterministic set with custom rand", () => {
    const result = generateSet(
      { maxNumber: 5, pickCount: 3, windowPct: 1 },
      () => 0,
    );
    expect(result).toEqual([1, 2, 3]);
  });
});
