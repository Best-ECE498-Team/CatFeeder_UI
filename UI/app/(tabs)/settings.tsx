import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";

import { ConnectionStatus } from "../../components/ConnectionStatus";
import { PI_API_BASE_URL } from "../../constants/api";
import { usePawPlate } from "../../state/PawPlateContext";

export default function SettingsScreen() {
  const {
    clearBowlResults,
    clearHistory,
    connectionState,
    isStatusLoading,
    refreshStatus,
  } = usePawPlate();

  const confirmClearBowlResults = () => {
    Alert.alert(
      "Clear saved bowl results?",
      "This removes the latest saved scan for Bowl 1, Bowl 2, and Bowl 3.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearBowlResults },
      ]
    );
  };

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear history?",
      "This removes saved food-detection history from this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearHistory },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.text}>App-level PawPlate prototype settings.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Raspberry Pi Server</Text>
        <Text style={styles.caption}>{PI_API_BASE_URL}</Text>
        <View style={styles.connectionRow}>
          <ConnectionStatus state={connectionState} isLoading={isStatusLoading} />
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
              {isStatusLoading ? "Testing..." : "Test Connection"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Food Detection</Text>
        <InfoRow label="Request timeout" value="90 seconds" />
        <InfoRow label="Backend route" value="POST /detect-food" />
        <InfoRow label="Status route" value="GET /status" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saved App Data</Text>
        <View style={styles.actionStack}>
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={confirmClearBowlResults}
          >
            <Text style={styles.secondaryButtonText}>Clear Bowl Results</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={confirmClearHistory}
          >
            <Text style={styles.secondaryButtonText}>Clear History</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Demo Mode</Text>
        <Text style={styles.caption}>
          Heating, cooling, door, tray, lift, battery, and MCU controls are not
          connected in this prototype.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accessibility</Text>
        <Text style={styles.caption}>
          Connection and scan states use text labels in addition to color.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About PawPlate</Text>
        <InfoRow
          label="App version"
          value={Constants.expoConfig?.version || "1.0.0"}
        />
        <InfoRow label="Runtime" value="Expo Go compatible" />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#ffffff",
    gap: 16,
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
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4b5563",
  },
  connectionRow: {
    gap: 12,
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
  secondaryButton: {
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4aa9a3",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4aa9a3",
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionStack: {
    gap: 10,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 16,
    color: "#1f2937",
  },
});
