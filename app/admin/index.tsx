import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.12)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
});

export default function AdminDashboardScreen() {
  const router = useRouter();

  const options = [
    {
      title: "Verificación de Registros",
      desc: "Aprobar o rechazar nuevas solicitudes de registro de usuarios y asignar categorías iniciales.",
      icon: "how-to-reg" as const,
      route: "/admin/users" as const,
    },
    {
      title: "Medios de Pago",
      desc: "Verificar tarjetas de crédito y cuentas bancarias registradas por los usuarios.",
      icon: "credit-card" as const,
      route: "/admin/payments" as const,
    },
    {
      title: "Artículos Consignados",
      desc: "Tasación e inspección de artículos postulados por vendedores. Aprobación y asignación de precio base.",
      icon: "gavel" as const,
      route: "/admin/articles" as const,
    },
    {
      title: "Gestión de Subastas",
      desc: "Crear nuevos eventos de subasta y catalogar productos aprobados con sus precios de salida.",
      icon: "event" as const,
      route: "/admin/auctions" as const,
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <View style={s.backBtnInner}>
            <MaterialIcons name="arrow-back-ios" size={16} color="#8B6914" />
            <Text style={s.backText}>Volver</Text>
          </View>
        </Pressable>
        <Text style={s.headerTitle}>Panel de Control Admin</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.container}>
        <View style={s.hero}>
          <MaterialIcons name="admin-panel-settings" size={48} color="#8B6914" />
          <Text style={s.heroTitle}>Administración General</Text>
          <Text style={s.heroDesc}>
            Bienvenido al panel de control corporativo de SubastApp. Desde aquí podés regular todas las operaciones críticas de la plataforma.
          </Text>
        </View>

        <View style={s.menuGrid}>
          {options.map((opt, i) => (
            <Pressable
              key={i}
              onPress={() => router.push(opt.route)}
              style={s.cardWrapper}
            >
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.iconWrapper}>
                    <MaterialIcons name={opt.icon} size={24} color="#8B6914" />
                  </View>
                  <Text style={s.cardTitle}>{opt.title}</Text>
                </View>
                <Text style={s.cardDesc}>{opt.desc}</Text>
                <View style={s.cardFooter}>
                  <Text style={s.actionText}>Ingresar</Text>
                  <MaterialIcons name="keyboard-arrow-right" size={18} color="#8B6914" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 80,
  },
  backBtnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    color: "#8B6914",
    fontWeight: "600",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
  },
  container: {
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 12,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  menuGrid: {
    paddingHorizontal: 24,
    gap: 16,
  },
  cardWrapper: {
    width: "100%",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 20,
    ...SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5DDD0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    flex: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B6914",
    textTransform: "uppercase",
  },
});
