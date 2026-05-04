import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/context/AuthContext";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="subasta" />
      </Stack>
    </AuthProvider>
  );
}
