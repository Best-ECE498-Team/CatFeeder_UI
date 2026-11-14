import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePawPlate } from "../../state/PawPlateContext";
import type { HistoryEvent } from "../../services/historyStorageService";

export default function HistoryScreen() {
  const { historyEvents, clearHistory } = usePawPlate();

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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.text}>Food-detection activity from this app.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.clearButton,
            pressed ? styles.buttonPressed : null,
            historyEvents.length === 0 ? styles.buttonDisabled : null,
          ]}
          onPress={confirmClearHistory}
          disabled={historyEvents.length === 0}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
      </View>

      {historyEvents.length === 0 ? (
        <Text style={styles.emptyText}>No food-detection history yet.</Text>
      ) : (
        historyEvents.map((event) => (
          <HistoryCard key={event.id} event={event} />
        ))
      )}
    </ScrollView>
  );
}

function HistoryCard({ event }: { event: HistoryEvent }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>{event.status === "warning" ? "!" : "OK"}</Text>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>Bowl {event.bowlId} scan</Text>
          <Text style={styles.cardValue}>{event.detectedContent}</Text>
          {event.confidence ? (
            <Text style={styles.caption}>{event.confidence}</Text>
          ) : null}
          {event.details ? <Text style={styles.caption}>{event.details}</Text> : null}
          <Text style={styles.timestamp}>{formatTimestamp(event.timestamp)}</Text>
        </View>
      </View>
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#ffffff",
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  text: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#ffffff",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    fontSize: 15,
    color: "#6b7280",
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
    gap: 12,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ecfdf5",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 11,
    fontWeight: "800",
    color: "#2f7f79",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2f7f79",
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563",
  },
  timestamp: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
});
