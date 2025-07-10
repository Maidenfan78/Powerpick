import * as dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { calculateHotColdNumbers } from "./hotCold.ts";

dotenv.config();

let supabase: SupabaseClient;

function initSupabase(): void {
  const SUPABASE_URL =
    process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const READ_KEY =
    process.env.SUPABASE_READ_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const WRITE_KEY =
    process.env.SUPABASE_WRITE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_KEY = WRITE_KEY || READ_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase credentials are missing");
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

interface GameConfig {
  id: string;
  main_max: number;
  supp_max?: number | null;
  powerball_max?: number | null;
  from_draw_number: number;
}

interface DrawRow {
  winning_numbers: number[];
  supplementary_numbers?: number[] | null;
  powerball?: number | null;
}

export interface HotColdRecord {
  game_id: string;
  main_hot: number[];
  main_cold: number[];
  supp_hot?: number[];
  supp_cold?: number[];
  powerball_hot?: number[];
  powerball_cold?: number[];
}

export function computeHotCold(
  rows: DrawRow[],
  cfg: GameConfig,
  percent = 20,
): HotColdRecord {
  const mainDraws = rows.map((r) => r.winning_numbers);
  const { hot: main_hot, cold: main_cold } = calculateHotColdNumbers(
    mainDraws,
    cfg.main_max,
    percent,
  );
  const record: HotColdRecord = { game_id: cfg.id, main_hot, main_cold };

  if (cfg.supp_max) {
    const suppDraws = rows.flatMap((r) => r.supplementary_numbers ?? []);
    const grouped = suppDraws.map((n) => [n]);
    const { hot, cold } = calculateHotColdNumbers(
      grouped,
      cfg.supp_max,
      percent,
    );
    record.supp_hot = hot;
    record.supp_cold = cold;
  }

  if (cfg.powerball_max) {
    const pbDraws = rows
      .map((r) => r.powerball)
      .filter((n): n is number => typeof n === "number");
    const grouped = pbDraws.map((n) => [n]);
    const { hot, cold } = calculateHotColdNumbers(
      grouped,
      cfg.powerball_max,
      percent,
    );
    record.powerball_hot = hot;
    record.powerball_cold = cold;
  }

  return record;
}

interface DrawResultRow {
  draw_results: {
    number: number;
    ball_types: { name: string } | null;
  }[];
}

async function updateGameHotCold(game: GameConfig): Promise<void> {
  const batchSize = 5000;
  const typedRows: DrawResultRow[] = [];

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1;
    const { data, error } = await supabase
      .from("draws")
      .select("draw_results(number, ball_types(name))")
      .eq("game_id", game.id)
      .gte("draw_number", game.from_draw_number)
      .range(from, to);

    if (error) {
      throw new Error(
        typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error),
      );
    }

    const page = (data ?? []) as unknown as DrawResultRow[];
    if (page.length === 0) break;
    typedRows.push(...page);
    if (page.length < batchSize) break;
  }

  const rows: DrawRow[] = typedRows.map((row) => {
    const results = row.draw_results;
    const winning_numbers = results
      .filter((r) => r.ball_types?.name === "main")
      .map((r) => r.number);
    const supplementary_numbers = results
      .filter((r) => r.ball_types?.name === "supplementary")
      .map((r) => r.number);
    const powerball =
      results.find((r) => r.ball_types?.name === "powerball")?.number ?? null;
    return {
      winning_numbers,
      supplementary_numbers: supplementary_numbers.length
        ? supplementary_numbers
        : null,
      powerball,
    };
  });

  const record = computeHotCold(rows, game);
  const { error: upsertError } = await supabase
    .from("hot_cold_numbers")
    .upsert(record, { onConflict: "game_id" });

  if (upsertError) {
    throw new Error(
      typeof upsertError === "object" && "message" in upsertError
        ? String((upsertError as { message: unknown }).message)
        : String(upsertError),
    );
  }
  console.log(`✅ Updated hot/cold for game ${game.id}`);
}

export async function syncHotColdForGame(gameId: string): Promise<void> {
  if (!supabase) initSupabase();
  const { data, error } = await supabase
    .from("games")
    .select("id, main_max, supp_max, powerball_max, from_draw_number")
    .eq("id", gameId)
    .maybeSingle();

  if (error) {
    throw new Error(
      typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error),
    );
  }

  if (!data) return;
  await updateGameHotCold(data as unknown as GameConfig);
}

export async function syncAllHotCold(gameId?: string): Promise<void> {
  if (!supabase) initSupabase();

  if (gameId) {
    await syncHotColdForGame(gameId);
    return;
  }

  const { data, error } = await supabase
    .from("games")
    .select("id, main_max, supp_max, powerball_max, from_draw_number");

  if (error) {
    throw new Error(
      typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error),
    );
  }

  const games = (data ?? []) as unknown as GameConfig[];
  for (const g of games) {
    await updateGameHotCold(g);
  }
}

async function main(): Promise<void> {
  const gameId = process.argv[2];
  await syncAllHotCold(gameId);
}

if (process.argv[1] && process.argv[1].endsWith("syncHotCold.ts")) {
  main().catch((err) => {
    const errObj = err instanceof Error ? err : new Error(String(err));
    console.error("FATAL:", errObj);
  });
}
