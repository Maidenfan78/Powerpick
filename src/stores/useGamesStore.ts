import { create } from "zustand";
import type { Game } from "../lib/gamesApi";

interface GamesState {
  games: Game[];
  setGames: (games: Game[]) => void;
  getGame: (id: string) => Game | undefined;
}

export const useGamesStore = create<GamesState>((set, get) => ({
  games: [],
  setGames: (games: Game[]) => set({ games }),
  getGame: (id: string) => get().games.find((g) => g.id === id),
}));
