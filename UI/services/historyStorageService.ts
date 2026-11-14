import AsyncStorage from "@react-native-async-storage/async-storage";

import type { BowlId } from "./bowlStorageService";
import {
  getConfidenceDisplayName,
  getFoodClassDisplayName,
  type FoodDetectionResponse,
} from "./pawplateApi";

export type HistoryEvent = {
  id: string;
  bowlId: BowlId;
  eventType: "food_detection";
  detectedContent: string;
  confidence?: string;
  timestamp: string;
  details?: string;
  status: "success" | "warning";
};

const HISTORY_STORAGE_KEY = "pawplate:history:v1";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function createDetectionHistoryEvent(
  bowlId: BowlId,
  detection: FoodDetectionResponse
): HistoryEvent {
  const timestamp = detection.capturedAt || new Date().toISOString();

  return {
    id: `${timestamp}-${bowlId}-${Date.now()}`,
    bowlId,
    eventType: "food_detection",
    detectedContent: getFoodClassDisplayName(detection.analysis.foodClass),
    confidence: getConfidenceDisplayName(detection.analysis.confidence),
    timestamp,
    details: detection.analysis.notes,
    status: detection.analysis.uncertain ? "warning" : "success",
  };
}

export async function loadHistoryEvents(): Promise<HistoryEvent[]> {
  try {
    const value = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return pruneOldEvents(parsed as HistoryEvent[]);
  } catch (error) {
    console.warn("Unable to restore PawPlate history", error);
    return [];
  }
}

export async function saveHistoryEvents(events: HistoryEvent[]) {
  await AsyncStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(pruneOldEvents(events))
  );
}

export async function clearHistoryEvents() {
  await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
}

export function pruneOldEvents(events: HistoryEvent[]) {
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  return events
    .filter((event) => {
      const time = new Date(event.timestamp).getTime();
      return Number.isNaN(time) || time >= cutoff;
    })
    .slice(0, 100);
}
