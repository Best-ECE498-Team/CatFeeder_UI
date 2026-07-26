import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  detectFood,
  getLatestDetection,
  getPawPlateStatus,
  PawPlateApiError,
  type FoodDetectionResponse,
  type PawPlateStatus,
} from "../../services/pawplateApi";

export default function BowlsScreen() {
  const [status, setStatus] = useState<PawPlateStatus | null>(null);
  const [latestDetection, setLatestDetection] =
    useState<FoodDetectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLatestDetection, setIsLoadingLatestDetection] =
    useState(true);
  const [isDetectingFood, setIsDetectingFood] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectionErrorMessage, setDetectionErrorMessage] = useState<
    string | null
  >(null);
  const isMounted = useRef(true);
  const detectionInFlight = useRef(false);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextStatus = await getPawPlateStatus();

      if (isMounted.current) {
        setStatus(nextStatus);
      }
    } catch (error) {
      if (isMounted.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Raspberry Pi status."
        );
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const loadLatestDetection = useCallback(async () => {
    setIsLoadingLatestDetection(true);
    setDetectionErrorMessage(null);

    try {
      const detection = await getLatestDetection();

      if (isMounted.current) {
        setLatestDetection(detection);
      }
    } catch (error) {
      console.warn("Unable to load latest PawPlate detection", error);

      if (isMounted.current) {
        setDetectionErrorMessage(getDetectionErrorMessage(error));
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingLatestDetection(false);
      }
    }
  }, []);

  const runFoodDetection = useCallback(async () => {
    if (detectionInFlight.current) {
      return;
    }

    detectionInFlight.current = true;
    setIsDetectingFood(true);
    setDetectionErrorMessage(null);

    try {
      const detection = await detectFood(1);

      if (isMounted.current) {
        setLatestDetection(detection);
      }
    } catch (error) {
      console.warn("PawPlate food detection failed", error);

      if (isMounted.current) {
        setDetectionErrorMessage(getDetectionErrorMessage(error));
      }
    } finally {
      detectionInFlight.current = false;

      if (isMounted.current) {
        setIsDetectingFood(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadStatus();
    loadLatestDetection();

    return () => {
      isMounted.current = false;
    };
  }, [loadLatestDetection, loadStatus]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bowls</Text>
      <Text style={styles.text}>Bowl status will be shown here.</Text>

      <View style={styles.statusPanel}>
        <View style={styles.statusHeader}>
          <Text style={styles.panelTitle}>Raspberry Pi Status</Text>
          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed ? styles.refreshButtonPressed : null,
            ]}
            onPress={loadStatus}
            disabled={isLoading}
          >
            <Text style={styles.refreshButtonText}>
              {isLoading ? "Loading" : "Refresh"}
            </Text>
          </Pressable>
        </View>

        {isLoading && !status ? (
          <Text style={styles.mutedText}>Loading device status...</Text>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {status ? (
          <View style={styles.statusRows}>
            <StatusRow label="Device name" value={status.device} />
            <StatusRow
              label="Connected"
              value={status.connected ? "Connected" : "Disconnected"}
            />
            <StatusRow
              label="Raspberry Pi IP"
              value={status.raspberry_pi_ip}
            />
            <StatusRow label="Bowl ID" value={String(status.bowl_id)} />
            <StatusRow
              label="Food detected"
              value={status.food_detected ? "Yes" : "No"}
            />
            <StatusRow label="Food level" value={status.food_level} />
            <StatusRow
              label="Last updated"
              value={formatTimestamp(status.timestamp)}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.statusPanel}>
        <View style={styles.statusHeader}>
          <Text style={styles.panelTitle}>Food Classification</Text>
          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed ? styles.refreshButtonPressed : null,
              isDetectingFood ? styles.buttonDisabled : null,
            ]}
            onPress={runFoodDetection}
            disabled={isDetectingFood}
          >
            <Text style={styles.refreshButtonText}>
              {isDetectingFood ? "Checking" : "Check Bowl"}
            </Text>
          </Pressable>
        </View>

        {isLoadingLatestDetection ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color="#4aa9a3" />
            <Text style={styles.mutedText}>Loading latest analysis...</Text>
          </View>
        ) : null}

        {isDetectingFood ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color="#4aa9a3" />
            <Text style={styles.mutedText}>
              Capturing and analyzing the bowl...
            </Text>
          </View>
        ) : null}

        {!isLoadingLatestDetection && !latestDetection && !detectionErrorMessage ? (
          <Text style={styles.mutedText}>
            No bowl analysis is available yet.
          </Text>
        ) : null}

        {detectionErrorMessage ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorText}>{detectionErrorMessage}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed ? styles.refreshButtonPressed : null,
              ]}
              onPress={runFoodDetection}
              disabled={isDetectingFood}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {latestDetection ? (
          <FoodDetectionResult detection={latestDetection} />
        ) : null}
      </View>
    </ScrollView>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function FoodDetectionResult({
  detection,
}: {
  detection: FoodDetectionResponse;
}) {
  return (
    <View style={styles.classificationResult}>
      <Text style={styles.classificationLabel}>Latest classification</Text>
      <Text style={styles.classificationTitle}>
        {getFoodClassDisplayName(detection.analysis.foodClass)}
      </Text>
      <Text style={styles.confidenceText}>
        {getConfidenceDisplayName(detection.analysis.confidence)}
      </Text>

      {detection.analysis.uncertain ? (
        <Text style={styles.warningText}>
          The image was unclear. Check the bowl position and try again.
        </Text>
      ) : null}

      {detection.analysis.notes ? (
        <Text style={styles.notesText}>{detection.analysis.notes}</Text>
      ) : null}

      {detection.capturedAt ? (
        <Text style={styles.mutedText}>
          Last analyzed: {formatTimestamp(detection.capturedAt)}
        </Text>
      ) : null}
    </View>
  );
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString();
}

function getFoodClassDisplayName(foodClass: string) {
  switch (foodClass) {
    case "empty_bowl":
      return "Empty Bowl";
    case "pate_wet_food_bowl":
      return "Pâté Wet Food";
    case "stew_wet_food_bowl":
      return "Stew Wet Food";
    case "milk_bowl":
      return "Milk";
    default:
      return "Unknown";
  }
}

function getConfidenceDisplayName(confidence: string) {
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

function getDetectionErrorMessage(error: unknown) {
  if (error instanceof PawPlateApiError) {
    switch (error.kind) {
      case "network":
        return "Unable to connect to PawPlate. Make sure the Raspberry Pi and this device are on the same network.";
      case "timeout":
        return "Food detection took too long. Please try again.";
      case "busy":
        return "PawPlate is already analyzing the bowl. Please wait and try again.";
      default:
        return "Food detection failed. Please try again.";
    }
  }

  return "Food detection failed. Please try again.";
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
  },
  statusPanel: {
    marginTop: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  panelTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#4aa9a3",
  },
  refreshButtonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  mutedText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#b91c1c",
  },
  statusRows: {
    marginTop: 16,
    gap: 10,
  },
  statusRow: {
    gap: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  statusValue: {
    fontSize: 16,
    color: "#1f2937",
  },
  inlineLoading: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorPanel: {
    marginTop: 16,
    gap: 12,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4aa9a3",
    backgroundColor: "#ffffff",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4aa9a3",
  },
  classificationResult: {
    marginTop: 18,
    gap: 8,
  },
  classificationLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  classificationTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4aa9a3",
  },
  warningText: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    fontSize: 15,
    lineHeight: 22,
    color: "#92400e",
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4b5563",
  },
});
