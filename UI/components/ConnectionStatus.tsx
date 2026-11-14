import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { ConnectionState } from "../state/PawPlateContext";

export function ConnectionStatus({
  state,
  isLoading,
}: {
  state: ConnectionState;
  isLoading?: boolean;
}) {
  const label = getConnectionLabel(state);

  return (
    <View style={styles.container} accessibilityRole="text">
      {isLoading ? <ActivityIndicator size="small" color="#4aa9a3" /> : null}
      {!isLoading ? (
        <Text style={styles.icon}>{getConnectionIcon(state)}</Text>
      ) : null}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function getConnectionLabel(state: ConnectionState) {
  switch (state) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting";
    case "disconnected":
      return "Disconnected";
    default:
      return "Unknown";
  }
}

function getConnectionIcon(state: ConnectionState) {
  switch (state) {
    case "connected":
      return "OK";
    case "connecting":
      return "...";
    case "disconnected":
      return "!";
    default:
      return "?";
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 0,
    maxWidth: "100%",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    gap: 6,
  },
  icon: {
    flexShrink: 0,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    color: "#2f7f79",
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2f7f79",
    flexShrink: 1,
  },
});
