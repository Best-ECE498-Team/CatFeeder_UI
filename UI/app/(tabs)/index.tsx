import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ConnectionStatus } from "../../components/ConnectionStatus";
import { PI_API_BASE_URL } from "../../constants/api";
import { placeholderFeederStatus } from "../../data/placeholderFeederStatus";
import { usePawPlate } from "../../state/PawPlateContext";
import {
  getConfidenceDisplayName,
  getFoodClassDisplayName,
  type FoodDetectionResponse,
} from "../../services/pawplateApi";
import type { BowlId } from "../../services/bowlStorageService";

const BOWL_IDS: BowlId[] = [1, 2, 3];

export default function HomeScreen() {
  const {
    bowlResults,
    connectionState,
    isStatusLoading,
    refreshStatus,
    status,
    statusError,
  } = usePawPlate();

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>PawPlate</Text>
        <Text style={styles.text}>Wet Food Feeder App</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelTitleContainer}>
            <Text style={styles.panelTitle}>Food Detection Connection</Text>
            <Text style={styles.caption}>{PI_API_BASE_URL}</Text>
          </View>
          <ConnectionStatus state={connectionState} isLoading={isStatusLoading} />
        </View>

        {statusError ? <Text style={styles.errorText}>{statusError}</Text> : null}

        {status ? (
          <View style={styles.statusRows}>
            <StatusRow label="Device" value={status.device} />
            <StatusRow
              label="Raspberry Pi"
              value={status.raspberry_pi_ip || "Not available"}
            />
            <StatusRow
              label="Last updated"
              value={formatTimestamp(status.timestamp)}
            />
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.buttonPressed : null,
            isStatusLoading ? styles.buttonDisabled : null,
          ]}
          onPress={refreshStatus}
          disabled={isStatusLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isStatusLoading ? "Checking..." : "Refresh Connection"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bowl Overview</Text>
        {BOWL_IDS.map((bowlId) => (
          <BowlSummary
            key={bowlId}
            bowlId={bowlId}
            detection={bowlResults[bowlId]}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feeder Hardware</Text>
        <Text style={styles.noticeText}>
          Hardware monitoring will become available after STM32 control-board
          integration.
        </Text>
        <View style={styles.hardwareGrid}>
          <HardwareRow
            label="Heating temperature"
            value={formatUnavailable(placeholderFeederStatus.heatingTemperature)}
          />
          <HardwareRow
            label="Cooling Bowl 1 temperature"
            value={formatUnavailable(
              placeholderFeederStatus.coolingBowl1Temperature
            )}
          />
          <HardwareRow
            label="Cooling Bowl 2 temperature"
            value={formatUnavailable(
              placeholderFeederStatus.coolingBowl2Temperature
            )}
          />
          <HardwareRow label="Tray position" value="MCU not connected" />
          <HardwareRow label="Battery level" value="Not available" />
          <HardwareRow label="Heater state" value="Awaiting integration" />
          <HardwareRow label="Cooler state" value="Awaiting integration" />
          <HardwareRow label="Door position" value="MCU not connected" />
          <HardwareRow label="Bowl-lift state" value="MCU not connected" />
        </View>
      </View>
    </ScrollView>
  );
}

function BowlSummary({
  bowlId,
  detection,
}: {
  bowlId: BowlId;
  detection: FoodDetectionResponse | null;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Bowl {bowlId}</Text>
      {detection ? (
        <>
          <Text style={styles.summaryValue}>
            {getFoodClassDisplayName(detection.analysis.foodClass)}
          </Text>
          <Text style={styles.caption}>
            {getConfidenceDisplayName(detection.analysis.confidence)}
          </Text>
          <Text style={styles.caption}>
            Last scan: {formatTimestamp(detection.capturedAt)}
          </Text>
        </>
      ) : (
        <Text style={styles.caption}>No scan saved yet.</Text>
      )}
    </View>
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

function HardwareRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.hardwareRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function formatUnavailable(value: unknown) {
  return value === null || value === undefined ? "Not available" : String(value);
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
    gap: 24,
  },
  hero: {
    gap: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1f2937",
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
  },
  panel: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    gap: 16,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  panelTitleContainer: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  caption: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#6b7280",
    flexShrink: 1,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#b91c1c",
  },
  statusRows: {
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
  primaryButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#4aa9a3",
  },
  primaryButtonText: {
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
  },
  summaryCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "800",
    color: "#2f7f79",
  },
  noticeText: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    fontSize: 15,
    lineHeight: 22,
    color: "#92400e",
  },
  hardwareGrid: {
    gap: 10,
  },
  hardwareRow: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    gap: 4,
  },
});
