import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FoodDetectionResponse } from "./pawplateApi";

export type BowlId = 1 | 2 | 3;
export type BowlResults = Record<BowlId, FoodDetectionResponse | null>;

const BOWL_RESULTS_STORAGE_KEY = "pawplate:bowl-results:v1";

export const emptyBowlResults: BowlResults = {
  1: null,
  2: null,
  3: null,
};

export async function loadSavedBowlResults(): Promise<BowlResults> {
  try {
    const value = await AsyncStorage.getItem(BOWL_RESULTS_STORAGE_KEY);

    if (!value) {
      return emptyBowlResults;
    }

    const parsed = JSON.parse(value) as Partial<BowlResults>;

    return {
      1: parsed[1] ?? null,
      2: parsed[2] ?? null,
      3: parsed[3] ?? null,
    };
  } catch (error) {
    console.warn("Unable to restore saved PawPlate bowl results", error);
    return emptyBowlResults;
  }
}

export async function saveBowlResults(results: BowlResults) {
  await AsyncStorage.setItem(BOWL_RESULTS_STORAGE_KEY, JSON.stringify(results));
}

export async function clearSavedBowlResults() {
  await AsyncStorage.removeItem(BOWL_RESULTS_STORAGE_KEY);
}
