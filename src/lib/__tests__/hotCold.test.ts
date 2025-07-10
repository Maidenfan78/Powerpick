import { calculateHotColdNumbers } from "../hotCold";

describe("calculateHotColdNumbers", () => {
  test("returns hot and cold numbers based on draw history", () => {
    const draws = [
      [1, 2, 3],
      [1, 3, 5],
      [2, 3, 4],
    ];
    const result = calculateHotColdNumbers(draws, 5, 20);
    expect(result).toEqual({ hot: [3], cold: [5] });
  });
});
