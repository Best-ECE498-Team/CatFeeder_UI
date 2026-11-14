import { PI_API_BASE_URL } from "../constants/api";

const DEFAULT_TIMEOUT_MS = 15000;
const FOOD_DETECTION_TIMEOUT_MS = 90000;

export type PawPlateStatus = {
  device: string;
  connected: boolean;
  raspberry_pi_ip: string;
  bowl_id: number;
  food_detected: boolean;
  food_level: string;
  timestamp: string;
};

export type FoodClass =
  | "empty_bowl"
  | "pate_wet_food_bowl"
  | "stew_wet_food_bowl"
  | "milk_bowl"
  | "unclear"
  | "unsupported";

export type FoodAnalysis = {
  foodClass: FoodClass;
  confidence: string;
  uncertain: boolean;
  notes: string;
  displayName: string;
  foodPresent: boolean;
  runtimeSeconds?: number;
  modelUsed?: string;
  imageFilename?: string;
};

export type FoodDetectionResponse = {
  success: boolean;
  detectionId?: string;
  bowlId: number;
  capturedAt: string;
  completedAt?: string;
  totalRuntimeSeconds?: number;
  capturedImageFilename?: string;
  processedImageFilename?: string;
  analysis: FoodAnalysis;
};

type ApiErrorKind =
  | "backend"
  | "busy"
  | "invalid-json"
  | "network"
  | "not-found"
  | "timeout";

export class PawPlateApiError extends Error {
  kind: ApiErrorKind;
  status?: number;

  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message);
    this.name = "PawPlateApiError";
    this.kind = kind;
    this.status = status;
  }
}

type BackendFoodAnalysis = {
  food_class?: string;
  confidence?: string;
  uncertain?: boolean;
  notes?: string;
  display_name?: string;
  food_present?: boolean;
  runtime_seconds?: number;
  model_used?: string;
  image_filename?: string;
};

type BackendFoodDetectionResponse = {
  success?: boolean;
  detection_id?: string;
  bowl_id?: number;
  captured_at?: string;
  completed_at?: string;
  total_runtime_seconds?: number;
  captured_image_filename?: string;
  processed_image_filename?: string;
  analysis?: BackendFoodAnalysis;
};

type MaybeWrappedFoodDetectionResponse =
  | BackendFoodDetectionResponse
  | {
      data?: BackendFoodDetectionResponse;
    };

export async function getPawPlateStatus(): Promise<PawPlateStatus> {
  return requestJson<PawPlateStatus>("/status");
}

export async function detectFood(bowlId = 1): Promise<FoodDetectionResponse> {
  const response = await requestJson<BackendFoodDetectionResponse>(
    "/detect-food",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bowl_id: bowlId }),
    },
    FOOD_DETECTION_TIMEOUT_MS
  );

  return parseFoodDetectionResponse(response);
}

export async function getLatestDetection(): Promise<FoodDetectionResponse | null> {
  try {
    const response = await requestJson<BackendFoodDetectionResponse>(
      "/latest-detection"
    );

    return parseFoodDetectionResponse(response);
  } catch (error) {
    if (error instanceof PawPlateApiError && error.kind === "not-found") {
      return null;
    }

    throw error;
  }
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${PI_API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const json = await parseJsonBody(response);

    if (!response.ok) {
      throw createHttpError(response.status, json);
    }

    return json as T;
  } catch (error) {
    if (error instanceof PawPlateApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new PawPlateApiError("Request timed out.", "timeout");
    }

    console.warn("PawPlate API request failed", error);
    throw new PawPlateApiError("Network request failed.", "network");
  } finally {
    clearTimeout(timeout);
  }
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    if (!response.ok) {
      return null;
    }

    console.warn("PawPlate API returned invalid JSON", error);
    throw new PawPlateApiError("Invalid JSON response.", "invalid-json");
  }
}

function createHttpError(status: number, body: unknown) {
  const detail = extractDetail(body);

  if (status === 404) {
    return new PawPlateApiError(detail || "Not found.", "not-found", status);
  }

  if (status === 409) {
    return new PawPlateApiError(
      detail || "PawPlate is already analyzing the bowl.",
      "busy",
      status
    );
  }

  return new PawPlateApiError(
    detail || `Backend request failed with ${status}.`,
    "backend",
    status
  );
}

function extractDetail(body: unknown) {
  if (!body || typeof body !== "object" || !("detail" in body)) {
    return null;
  }

  const detail = (body as { detail?: unknown }).detail;

  if (typeof detail === "string") {
    return detail;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return null;
  }
}

function parseFoodDetectionResponse(
  response: MaybeWrappedFoodDetectionResponse
): FoodDetectionResponse {
  console.log("Raw PawPlate detection payload", response);

  const detection = unwrapFoodDetectionResponse(response);

  if (!detection.analysis?.food_class) {
    throw new PawPlateApiError(
      "Detection response is missing analysis data.",
      "invalid-json"
    );
  }

  const foodClass = normalizeFoodClass(detection.analysis.food_class);

  return {
    success: Boolean(detection.success),
    detectionId: detection.detection_id,
    bowlId: detection.bowl_id ?? 1,
    capturedAt: detection.captured_at ?? "",
    completedAt: detection.completed_at,
    totalRuntimeSeconds: detection.total_runtime_seconds,
    capturedImageFilename: detection.captured_image_filename,
    processedImageFilename: detection.processed_image_filename,
    analysis: {
      foodClass,
      confidence: detection.analysis.confidence ?? "unknown",
      uncertain:
        Boolean(detection.analysis.uncertain) ||
        foodClass === "unclear" ||
        foodClass === "unsupported",
      notes: detection.analysis.notes ?? "",
      displayName:
        detection.analysis.display_name || getFoodClassDisplayName(foodClass),
      foodPresent: Boolean(detection.analysis.food_present),
      runtimeSeconds: detection.analysis.runtime_seconds,
      modelUsed: detection.analysis.model_used,
      imageFilename: detection.analysis.image_filename,
    },
  };
}

function unwrapFoodDetectionResponse(
  response: MaybeWrappedFoodDetectionResponse
): BackendFoodDetectionResponse {
  const maybeData =
    response && typeof response === "object" && "data" in response
      ? response.data
      : undefined;

  if (hasFoodDetectionData(maybeData)) {
    return maybeData;
  }

  return response as BackendFoodDetectionResponse;
}

function hasFoodDetectionData(
  value: BackendFoodDetectionResponse | undefined
): value is BackendFoodDetectionResponse {
  return Boolean(value && typeof value === "object" && "analysis" in value);
}

export function normalizeFoodClass(foodClass: string): FoodClass {
  const normalized = foodClass
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  switch (normalized) {
    case "empty_bowl":
    case "empty":
      return "empty_bowl";
    case "pate_wet_food_bowl":
    case "pate_wet_food":
      return "pate_wet_food_bowl";
    case "stew_wet_food_bowl":
    case "stew_wet_food":
      return "stew_wet_food_bowl";
    case "milk_bowl":
    case "milk":
      return "milk_bowl";
    case "unclear":
    case "unknown":
      return "unclear";
    default:
      return "unsupported";
  }
}

export function getFoodClassDisplayName(foodClass: FoodClass | string) {
  switch (foodClass) {
    case "empty_bowl":
      return "Empty Bowl";
    case "pate_wet_food_bowl":
      return "Pate Wet Food";
    case "stew_wet_food_bowl":
      return "Stew Wet Food";
    case "milk_bowl":
      return "Milk";
    case "unclear":
      return "Unclear";
    case "unsupported":
      return "Unsupported Result";
    default:
      return "Unclear";
  }
}

export function getConfidenceDisplayName(confidence: string) {
  switch (confidence.toLowerCase()) {
    case "low":
      return "Low Confidence";
    case "medium":
      return "Medium Confidence";
    case "high":
      return "High Confidence";
    default:
      return "Confidence unavailable";
  }
}
