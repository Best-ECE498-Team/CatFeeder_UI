import { Tabs } from "expo-router";
import { Image, StyleSheet } from "react-native";

const icons = {
  home: require("../../assets/images/Home_Icon.png"),
  bowls: require("../../assets/images/Bowls_Icon.png"),
  schedule: require("../../assets/images/Schedule_Icon.png"),
  settings: require("../../assets/images/Setting_Icon.png"),
};

type TabIconName = keyof typeof icons;

function TabIcon({ focused, name }: { focused: boolean; name: TabIconName }) {
  return (
    <Image
      source={icons[name]}
      style={[styles.icon, focused ? styles.activeIcon : styles.inactiveIcon]}
      resizeMode="contain"
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4aa9a3",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="bowls"
        options={{
          title: "Bowls",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="bowls" />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="schedule" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="settings" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  icon: {
    width: 28,
    height: 28,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  inactiveIcon: {
    opacity: 0.55,
  },
});
