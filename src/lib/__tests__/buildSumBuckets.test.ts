import { buildSumBuckets } from "../buildSumBuckets";

test("builds correct bucket frequencies", () => {
  const draws = [
    [1, 2, 3, 4, 5, 6, 7],
    [35, 34, 33, 32, 31, 30, 29],
  ];
  const buckets = buildSumBuckets(draws, 10);
  expect(buckets).toMatchSnapshot();
});
