// lib/gamesApi.ts
import { supabase } from "./supabase";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const logoUrlCache: Record<string, string> = {};
let gamesCache: { data: Game[]; timestamp: number } | null = null;
const hotColdCache = new Map<
  string,
  { data: HotColdNumbers; timestamp: number }
>();
const drawsCache = new Map<string, { data: DrawResult[]; timestamp: number }>();

const STORAGE_BUCKET = "powerpick";

export interface Game {
  id: string;
  name: string;
  logoUrl: string; // full public URL to the PNG logo
  jackpot: string; // formatted string like "$5,000,000"
  mainMax: number | null;
  mainCount: number | null;
  suppCount: number | null;
  suppMax: number | null;
  powerballMax: number | null;
  fromDrawNumber: number;
  nextDrawTime: string | null;
}

export interface GameRow {
  id: string | number;
  name: string;
  logo_url: string;
  jackpot: string;
  main_max: number | null;
  main_count: number | null;
  supp_count: number | null;
  supp_max: number | null;
  powerball_max: number | null;
  from_draw_number: number;
  next_draw_time: string | null;
}

/** Collapse any “//” in the pathname (preserving “https://”) */
function normalizeUrl(url: string): string {
  // Collapse duplicate slashes except after the protocol
  return url.replace(/([^:])\/{2,}/g, "$1/");
}

export async function fetchGames(force = false): Promise<Game[]> {
  if (
    !force &&
    gamesCache &&
    Date.now() - gamesCache.timestamp < CACHE_TTL_MS
  ) {
    return gamesCache.data;
  }

  const { data: rows, error } = await supabase
    .from("games")
    .select(
      "id, name, logo_url, jackpot, main_max, main_count, supp_count, supp_max, powerball_max, from_draw_number, next_draw_time",
    );

  if (error) {
    console.error("Error fetching games:", error);
    throw error;
  }

  const games = (rows ?? []).map((row: GameRow) => {
    const raw = (row.logo_url ?? "").trim();
    let url: string;

    if (raw.startsWith("http")) {
      url = normalizeUrl(raw);
    } else {
      const key = raw.replace(/^\/+|\/+$/g, "");
      if (!logoUrlCache[key]) {
        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(key);
        logoUrlCache[key] = normalizeUrl(publicUrl);
      }
      url = logoUrlCache[key];
    }

    console.log(`[GamesAPI] "${row.id}" → ${url}`);
    return {
      id: String(row.id),
      name: row.name,
      logoUrl: url,
      jackpot: `$${Number(row.jackpot).toLocaleString()}`,
      mainMax: row.main_max ?? null,
      mainCount: row.main_count ?? null,
      suppCount: row.supp_count ?? null,
      suppMax: row.supp_max ?? null,
      powerballMax: row.powerball_max ?? null,
      fromDrawNumber: row.from_draw_number,
      nextDrawTime: row.next_draw_time ?? null,
    };
  });

  gamesCache = { data: games, timestamp: Date.now() };
  return games;
}

export interface HotColdNumbers {
  mainHot: number[];
  mainCold: number[];
  suppHot?: number[];
  suppCold?: number[];
  powerballHot?: number[];
  powerballCold?: number[];
}

export async function fetchHotColdNumbers(
  gameId: string,
  force = false,
): Promise<HotColdNumbers> {
  const cached = hotColdCache.get(gameId);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  const { data, error } = await supabase
    .from("hot_cold_numbers")
    .select("*")
    .eq("game_id", gameId)
    .maybeSingle();
  if (error) {
    console.error("Error fetching hot/cold:", error);
    throw error;
  }
  const result = {
    mainHot: data?.main_hot ?? [],
    mainCold: data?.main_cold ?? [],
    suppHot: data?.supp_hot ?? [],
    suppCold: data?.supp_cold ?? [],
    powerballHot: data?.powerball_hot ?? [],
    powerballCold: data?.powerball_cold ?? [],
  } as HotColdNumbers;
  hotColdCache.set(gameId, { data: result, timestamp: Date.now() });
  return result;
}

export interface DrawResult {
  draw_number: number;
  draw_date: string;
  winning_numbers: number[];
  supplementary_numbers?: number[] | null;
  powerball?: number | null;
}

interface DrawRow {
  draw_number: number;
  draw_date: string;
  draw_results: {
    number: number;
    ball_types: { name: string } | null;
  }[];
}

export async function fetchRecentDraws(
  gameId: string,
  force = false,
): Promise<DrawResult[]> {
  const cached = drawsCache.get(gameId);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from("draws")
    .select("draw_number, draw_date, draw_results(number, ball_types(name))")
    .eq("game_id", gameId)
    .order("draw_number", { ascending: false })
    .limit(10);
  if (error) {
    console.error("Error fetching draws:", error);
    throw error;
  }

  const rows = (data ?? []) as unknown as DrawRow[];
  const draws = rows.map((row: DrawRow) => {
    const results = row.draw_results || [];
    const winning_numbers = results
      .filter(
        (r: { number: number; ball_types: { name: string } | null }) =>
          r.ball_types?.name === "main",
      )
      .map((r) => r.number)
      .sort((a: number, b: number) => a - b);
    const supplementary_numbers = results
      .filter(
        (r: { number: number; ball_types: { name: string } | null }) =>
          r.ball_types?.name === "supplementary",
      )
      .map((r) => r.number)
      .sort((a: number, b: number) => a - b);
    const powerball =
      results.find(
        (r: { number: number; ball_types: { name: string } | null }) =>
          r.ball_types?.name === "powerball",
      )?.number ?? null;

    return {
      draw_number: row.draw_number,
      draw_date: row.draw_date,
      winning_numbers,
      supplementary_numbers: supplementary_numbers.length
        ? supplementary_numbers
        : null,
      powerball,
    } as DrawResult;
  });

  drawsCache.set(gameId, { data: draws, timestamp: Date.now() });
  return draws;
}

export function _clearCaches(): void {
  gamesCache = null;
  hotColdCache.clear();
  drawsCache.clear();
  for (const key of Object.keys(logoUrlCache)) delete logoUrlCache[key];
}
