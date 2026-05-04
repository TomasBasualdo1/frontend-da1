import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8B6914",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFCF7",
          borderTopColor: "#F0EBE3",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subastas"
        options={{
          title: "Subastas",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="gavel" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "En Vivo",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
