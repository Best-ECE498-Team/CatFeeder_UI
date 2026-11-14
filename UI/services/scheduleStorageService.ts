import AsyncStorage from "@react-native-async-storage/async-storage";

import type { BowlId } from "./bowlStorageService";

export type FeedingSchedule = {
  id: string;
  bowlId: BowlId;
  time: string;
  enabled: boolean;
};

const SCHEDULE_STORAGE_KEY = "pawplate:schedules:v1";

export async function loadSchedules(): Promise<FeedingSchedule[]> {
  try {
    const value = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as FeedingSchedule[]) : [];
  } catch (error) {
    console.warn("Unable to restore PawPlate schedules", error);
    return [];
  }
}

export async function saveSchedules(schedules: FeedingSchedule[]) {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
}

export async function clearSchedules() {
  await AsyncStorage.removeItem(SCHEDULE_STORAGE_KEY);
}
