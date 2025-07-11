export interface Bucket {
  label: string;
  mid: number;
  freq: number;
}

export function buildSumBuckets(draws: number[][], binSize = 5): Bucket[] {
  if (!draws.length) return [];

  const sums = draws.map((d) => d.reduce((a, b) => a + b, 0));
  const min = Math.min(...sums);
  const max = Math.max(...sums);

  const firstBinStart = Math.floor(min / binSize) * binSize;
  const lastBinStart = Math.ceil(max / binSize) * binSize;

  const bucketStarts: number[] = [];
  for (let s = firstBinStart; s <= lastBinStart; s += binSize) {
    bucketStarts.push(s);
  }

  const freqs = Array(bucketStarts.length).fill(0);
  sums.forEach((sum) => {
    const idx = Math.floor((sum - firstBinStart) / binSize);
    freqs[idx] += 1;
  });

  return bucketStarts.map((start, i) => ({
    label: `${start}-${start + binSize - 1}`,
    mid: start + binSize / 2,
    freq: freqs[i],
  }));
}
