import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1A1A2E",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F0EBE3",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home-filled" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "En Vivo",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="cell-tower" size={size} color={color} />
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
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
