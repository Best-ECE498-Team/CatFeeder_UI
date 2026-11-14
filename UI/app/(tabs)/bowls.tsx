import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { BowlId } from "../../services/bowlStorageService";
import {
  getConfidenceDisplayName,
  getFoodClassDisplayName,
  type FoodDetectionResponse,
} from "../../services/pawplateApi";
import { usePawPlate } from "../../state/PawPlateContext";

const BOWL_IDS: BowlId[] = [1, 2, 3];

export default function BowlsScreen() {
  const { bowlResults, bowlErrors, scanningBowlId, scanBowl } = usePawPlate();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bowls</Text>
      <Text style={styles.text}>
        Scan each manually positioned bowl with the PawPlate camera.
      </Text>

      {BOWL_IDS.map((bowlId) => (
        <BowlScanCard
          key={bowlId}
          bowlId={bowlId}
          detection={bowlResults[bowlId]}
          errorMessage={bowlErrors[bowlId]}
          isAnyScanRunning={scanningBowlId !== null}
          isScanning={scanningBowlId === bowlId}
          onScan={scanBowl}
        />
      ))}
    </ScrollView>
  );
}

function BowlScanCard({
  bowlId,
  detection,
  errorMessage,
  isAnyScanRunning,
  isScanning,
  onScan,
}: {
  bowlId: BowlId;
  detection: FoodDetectionResponse | null;
  errorMessage: string | null;
  isAnyScanRunning: boolean;
  isScanning: boolean;
  onScan: (bowlId: BowlId) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Bowl {bowlId}</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.scanButton,
            pressed ? styles.buttonPressed : null,
            isAnyScanRunning ? styles.buttonDisabled : null,
          ]}
          onPress={() => onScan(bowlId)}
          disabled={isAnyScanRunning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? "Scanning..." : `Scan Bowl ${bowlId}`}
          </Text>
        </Pressable>
      </View>

      {isScanning ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color="#4aa9a3" />
          <Text style={styles.mutedText}>Scanning Bowl {bowlId}...</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.retryButton,
              pressed ? styles.buttonPressed : null,
              isAnyScanRunning ? styles.buttonDisabled : null,
            ]}
            onPress={() => onScan(bowlId)}
            disabled={isAnyScanRunning}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : null}

      {detection ? (
        <FoodDetectionResult detection={detection} />
      ) : !isScanning && !errorMessage ? (
        <Text style={styles.mutedText}>No bowl analysis is available yet.</Text>
      ) : null}
    </View>
  );
}

function FoodDetectionResult({
  detection,
}: {
  detection: FoodDetectionResponse;
}) {
  return (
    <View style={styles.result}>
      <Text style={styles.resultLabel}>Detected content</Text>
      <Text style={styles.resultTitle}>
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

      <Text style={styles.mutedText}>
        Last scanned: {formatTimestamp(detection.capturedAt)}
      </Text>
    </View>
  );
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (!timestamp || Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#ffffff",
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  scanButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#4aa9a3",
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  inlineLoading: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mutedText: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: "#6b7280",
  },
  errorPanel: {
    marginTop: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#b91c1c",
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
  result: {
    marginTop: 18,
    gap: 8,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "800",
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
