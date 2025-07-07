// src/lib/generator.ts
// Note: avoid Node-specific imports for React Native compatibility

export interface GeneratorConfig {
  maxNumber: number;
  pickCount: number;
  /** Numbers to favour when generating */
  hotNumbers?: number[];
  /** Numbers to avoid when generating */
  coldNumbers?: number[];
  /** Value between 0 and 1 representing how strongly to favour hot numbers */
  hotRatio?: number;
  /**
   * Width of the bell-curve sum window as a fraction of the full range
   * (0.5–0.9). Defaults to 0.7 (i.e. middle 70% of sums).
   */
  windowPct?: number;
  /** Optional per-ball weight multipliers (1-indexed). */
  weights?: number[];
}

/**
 * Generate a set of unique numbers using a simple bell-curve sum balance.
 * The sum of the numbers will fall within the middle `windowPct * 100%` of the
 * theoretical minimum/maximum range (default 70%).
 */
export function generateSet(
  config: GeneratorConfig,
  rand: () => number = Math.random,
): number[] {
  const {
    maxNumber,
    pickCount,
    hotNumbers = [],
    coldNumbers = [],
    hotRatio = 0,
    windowPct = 0.7,
    weights,
  } = config;

  if (pickCount > maxNumber) {
    throw new Error("pickCount cannot exceed maxNumber");
  }

  const numbers: number[] = [];
  // expected sum and full range of sums
  const mean = (pickCount * (maxNumber + 1)) / 2;
  const totalRange = pickCount * (maxNumber - 1);
  // half-window = windowPct/2 (e.g. 0.7/2 = 0.35)
  const halfWindow = windowPct / 2;
  const lower = mean - totalRange * halfWindow;
  const upper = mean + totalRange * halfWindow;

  for (let attempt = 0; attempt < 100; attempt++) {
    numbers.length = 0;
    const pool = Array.from({ length: maxNumber }, (_, i) => i + 1);
    const baseWeights = pool.map((n) => weights?.[n] ?? 1);
    const adjusted = baseWeights.map((w, i) => {
      const n = i + 1;
      if (hotNumbers.includes(n)) return w * (1 + hotRatio);
      if (coldNumbers.includes(n)) return w * Math.max(0, 1 - hotRatio);
      return w;
    });

    const tempPool = [...pool];
    const tempWeights = [...adjusted];
    while (numbers.length < pickCount && tempPool.length > 0) {
      const total = tempWeights.reduce((s, w) => s + w, 0);
      let r = rand() * total;
      let idx = 0;
      while (r >= tempWeights[idx]) {
        r -= tempWeights[idx];
        idx++;
      }
      const n = tempPool.splice(idx, 1)[0];
      tempWeights.splice(idx, 1);
      numbers.push(n);
    }

    numbers.sort((a, b) => a - b);
    const sum = numbers.reduce((s, n) => s + n, 0);
    if (sum >= lower && sum <= upper) break;
  }

  return [...numbers];
}

/** Load weight multipliers from assets/weights/<game>.json if present. */
// Preloaded JSON imports so Metro can resolve them statically.
const weightLoaders: Record<string, () => Promise<{ weights?: number[] }>> = {
  sample_game: () => import("../../assets/weights/sample_game.json"),
};

export async function loadWeightVector(game: string): Promise<number[] | null> {
  const loader = weightLoaders[game];
  if (!loader) return null;
  try {
    const json = (await loader()) as { weights?: number[] };
    return Array.isArray(json.weights) ? json.weights : null;
  } catch {
    return null;
  }
}
