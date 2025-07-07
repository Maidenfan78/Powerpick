import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface GeneratedNumbersState {
  sets: Record<string, number[][]>;
  saveNumbers: (gameId: string, numbers: number[]) => void;
}

const STORAGE_KEY = "pp:generatedNumbers";

export const useGeneratedNumbersStore = create<GeneratedNumbersState>()(
  persist(
    (set) => ({
      sets: {},
      saveNumbers: (gameId: string, numbers: number[]) =>
        set((state) => {
          const current = state.sets[gameId] || [];
          return { sets: { ...state.sets, [gameId]: [...current, numbers] } };
        }),
    }),
    { name: STORAGE_KEY, storage: createJSONStorage(() => AsyncStorage) },
  ),
);
