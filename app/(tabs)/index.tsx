import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { SubastaListado, Categoria } from "../../src/types";
import { auctionService } from "../../src/services";

const CATEG_COLORS: Record<Categoria, string> = { comun: "#6B7280", especial: "#2563EB", plata: "#94A3B8", oro: "#D97706", platino: "#7C3AED" };
const CATEG_LABELS: Record<Categoria, string> = { comun: "Común", especial: "Especial", plata: "Plata", oro: "Oro", platino: "Platino" };

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [subastas, setSubastas] = useState<SubastaListado[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSubastas = async () => {
    try {
      const data = await auctionService.getPublicas();
      setSubastas(data);
    } catch { /* sin conexión, mostrar vacío */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadSubastas(); }, []);

  const renderSubasta = ({ item }: { item: SubastaListado }) => (
    <Pressable style={({ pressed }) => [s.card, pressed && s.cardPressed]} onPress={() => router.push(`/subasta/${item.id}` as any)}>
      <View style={s.cardHeader}>
        <View style={[s.categBadge, { backgroundColor: CATEG_COLORS[item.categoria] + "18" }]}>
          <View style={[s.categDot, { backgroundColor: CATEG_COLORS[item.categoria] }]} />
          <Text style={[s.categText, { color: CATEG_COLORS[item.categoria] }]}>{CATEG_LABELS[item.categoria]}</Text>
        </View>
        <View style={[s.estadoBadge, { backgroundColor: item.estado === "abierta" ? "#ECFDF5" : "#FEF2F2" }]}>
          <Text style={[s.estadoText, { color: item.estado === "abierta" ? "#059669" : "#DC2626" }]}>
            {item.estado === "abierta" ? "Abierta" : "Cerrada"}
          </Text>
        </View>
      </View>
      <View style={s.cardBody}>
        <View style={s.infoRow}>
          <MaterialIcons name="event" size={16} color="#9CA3AF" />
          <Text style={s.infoText}>{item.fecha} · {item.hora}</Text>
        </View>
        <View style={s.infoRow}>
          <MaterialIcons name="place" size={16} color="#9CA3AF" />
          <Text style={s.infoText} numberOfLines={1}>{item.ubicacion || "Sin ubicación"}</Text>
        </View>
        <View style={s.infoRow}>
          <MaterialIcons name="attach-money" size={16} color="#9CA3AF" />
          <Text style={s.monedaText}>{item.moneda}</Text>
        </View>
      </View>
      <View style={s.cardFooter}>
        <Text style={s.verDetalle}>Ver detalle</Text>
        <MaterialIcons name="arrow-forward-ios" size={14} color="#8B6914" />
      </View>
    </Pressable>
  );

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{isAuthenticated ? `Hola, ${user?.nombre || ""}` : "Bienvenido"}</Text>
            <Text style={s.headerSub}>Subastas disponibles</Text>
          </View>
          {isAuthenticated ? (
            <Pressable style={s.notifBtn} onPress={() => router.push("/profile" as any)}>
              <MaterialIcons name="notifications-none" size={24} color="#1A1A2E" />
            </Pressable>
          ) : (
            <Pressable style={s.loginBtn} onPress={() => router.push("/(auth)/welcome")}>
              <Text style={s.loginBtnText}>Ingresar</Text>
            </Pressable>
          )}
        </View>

        {/* Lista */}
        <FlatList
          data={subastas}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderSubasta}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSubastas(); }} tintColor="#8B6914" />}
          ListEmptyComponent={
            !loading ? (
              <View style={s.empty}>
                <MaterialIcons name="event-busy" size={56} color="#E5DDD0" />
                <Text style={s.emptyTitle}>Sin subastas</Text>
                <Text style={s.emptyText}>No hay subastas disponibles en este momento</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  greeting: { fontSize: 24, fontWeight: "800", color: "#1A1A2E" },
  headerSub: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFCF7", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3" },
  loginBtn: { backgroundColor: "#8B6914", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  loginBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 16 },
  card: { backgroundColor: "#FFFCF7", borderRadius: 18, borderWidth: 1, borderColor: "#F0EBE3", padding: 18, shadowColor: "#8B6914", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  categBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 6 },
  categDot: { width: 6, height: 6, borderRadius: 3 },
  categText: { fontSize: 12, fontWeight: "700" },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  estadoText: { fontSize: 12, fontWeight: "700" },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, color: "#6B7280", flex: 1 },
  monedaText: { fontSize: 14, color: "#1A1A2E", fontWeight: "700" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#F3EDE4", gap: 4 },
  verDetalle: { fontSize: 14, color: "#8B6914", fontWeight: "700" },
  empty: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
