import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePawPlate } from "../../state/PawPlateContext";

export default function ScheduleScreen() {
  const { schedules, addSchedule, toggleSchedule, deleteSchedule } =
    usePawPlate();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.badge}>Prototype</Text>
      <Text style={styles.notice}>
        Schedules are currently stored in the app for interface demonstration
        only. They are not sent to the feeder until STM32 integration is
        completed.
      </Text>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.primaryButton,
          pressed ? styles.buttonPressed : null,
        ]}
        onPress={addSchedule}
      >
        <Text style={styles.primaryButtonText}>Add Demo Feeding Time</Text>
      </Pressable>

      {schedules.length === 0 ? (
        <Text style={styles.emptyText}>No local demo schedules yet.</Text>
      ) : (
        schedules.map((schedule) => (
          <View key={schedule.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Bowl {schedule.bowlId}</Text>
                <Text style={styles.cardValue}>{schedule.time}</Text>
              </View>
              <Text style={styles.statusText}>
                {schedule.enabled ? "Enabled" : "Disabled"}
              </Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={() => toggleSchedule(schedule.id)}
              >
                <Text style={styles.secondaryButtonText}>
                  {schedule.enabled ? "Disable" : "Enable"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.deleteButton}
                onPress={() => deleteSchedule(schedule.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
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
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    fontSize: 13,
    fontWeight: "800",
    color: "#2f7f79",
  },
  notice: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    fontSize: 15,
    lineHeight: 22,
    color: "#92400e",
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
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2937",
  },
  cardValue: {
    marginTop: 4,
    fontSize: 16,
    color: "#4b5563",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2f7f79",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    paddingVertical: 8,
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
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#ffffff",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },
});
