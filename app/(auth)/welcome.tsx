import React from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header decorativo */}
      <View style={styles.topDecoration}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      <SafeAreaView style={styles.content}>
        {/* Logo / Ícono */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="gavel" size={48} color="#8B6914" />
          </View>
          <Text style={styles.appName}>SubastApp</Text>
          <Text style={styles.tagline}>
            Tu acceso exclusivo al mundo de las subastas
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem icon="trending-up" text="Pujas en tiempo real" />
          <FeatureItem icon="verified" text="Seguridad garantizada" />
          <FeatureItem icon="collections" text="Catálogos exclusivos" />
        </View>

        {/* Botones */}
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text className="text-[#1A1A2E] text-xl font-bold text-center items-center">
              Iniciar Sesión
            </Text>
            {/**
            <MaterialIcons name="arrow-forward" size={20} />
            **/}
          </Pressable>

          <Text className="text-center text-[#6B7280]">o</Text>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(auth)/register-step1")}
          >
            <Text
              style={styles.secondaryButtonText}
              className="text-center bg-red"
            >
              Crear Cuenta
            </Text>
          </Pressable>

          <Pressable
            style={styles.guestLink}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.guestLinkText}>Explorar sin cuenta →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <MaterialIcons name={icon as any} size={20} color="#8B6914" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  topDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(139, 105, 20, 0.06)",
    top: -80,
    right: -40,
  },
  circle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(184, 148, 28, 0.05)",
    top: 40,
    left: -60,
  },
  circle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(139, 105, 20, 0.04)",
    top: 120,
    right: 60,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 80,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "rgba(139, 105, 20, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 105, 20, 0.15)",
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 24,
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF7",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0EBE3",
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(139, 105, 20, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureText: {
    fontSize: 15,
    color: "#1A1A2E",
    fontWeight: "600",
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#8B6914",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#8B6914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#8B6914",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#8B6914",
    fontSize: 17,
    fontWeight: "700",
  },
  guestLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  guestLinkText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
