export interface HotColdResult {
  hot: number[];
  cold: number[];
}

/**
 * Calculate hot and cold numbers based on historical draws.
 * @param draws Array of arrays representing past winning numbers.
 * @param maxNumber Maximum possible number for the game.
 * @param percent Percentage of the number pool to return for hot/cold groups (0-100).
 */
export function calculateHotColdNumbers(
  draws: number[][],
  maxNumber: number,
  percent: number,
): HotColdResult {
  const counts = Array(maxNumber + 1).fill(0);
  for (const draw of draws) {
    for (const num of draw) {
      if (num >= 1 && num <= maxNumber) counts[num]++;
    }
  }
  const nums = Array.from({ length: maxNumber }, (_, i) => i + 1);
  nums.sort((a, b) => counts[b] - counts[a] || a - b);

  const groupSize = Math.max(0, Math.round((maxNumber * percent) / 100));
  const hot = nums.slice(0, groupSize);
  const cold = nums.slice(-groupSize);
  return { hot, cold };
}
