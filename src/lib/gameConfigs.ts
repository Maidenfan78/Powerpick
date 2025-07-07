export interface GameConfig {
  mainMax: number;
  mainCount: number;
  suppCount?: number;
  suppMax?: number;
  powerballMax?: number;
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export const gameConfigs: Record<string, GameConfig> = {
  [normalizeName("Powerball")]: {
    mainMax: 35,
    mainCount: 7,
    powerballMax: 20,
  },
  [normalizeName("Saturday Lotto")]: {
    mainMax: 45,
    mainCount: 6,
    suppCount: 2,
    suppMax: 45,
  },
  [normalizeName("Oz Lotto")]: {
    mainMax: 45,
    mainCount: 7,
    suppCount: 2,
    suppMax: 45,
  },
  [normalizeName("Set for Life")]: {
    mainMax: 44,
    mainCount: 7,
    suppCount: 2,
    suppMax: 44,
  },
  [normalizeName("Weekday Windfall")]: { mainMax: 45, mainCount: 6 },
};

const nameAliases: Record<string, string> = {
  [normalizeName("Sat Lotto")]: normalizeName("Saturday Lotto"),
  [normalizeName("Weekday WF")]: normalizeName("Weekday Windfall"),
  [normalizeName("Set 4 Life")]: normalizeName("Set for Life"),
};

export function getGameConfig(name: string): GameConfig | undefined {
  const normalized = normalizeName(name);
  const canonical = nameAliases[normalized] ?? normalized;
  return gameConfigs[canonical];
}
