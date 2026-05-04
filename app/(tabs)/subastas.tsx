import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { SubastaListado, Categoria } from "../../src/types";
import { auctionService } from "../../src/services";

const CATEG_COLORS: Record<Categoria, string> = { comun: "#6B7280", especial: "#2563EB", plata: "#94A3B8", oro: "#D97706", platino: "#7C3AED" };
const CATEG_LABELS: Record<Categoria, string> = { comun: "Común", especial: "Especial", plata: "Plata", oro: "Oro", platino: "Platino" };

export default function SubastasScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [subastas, setSubastas] = useState<SubastaListado[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Categoria | "todas">("todas");

  const load = async () => {
    try {
      const data = isAuthenticated ? await auctionService.getSubastas() : await auctionService.getPublicas();
      setSubastas(data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const filtered = filter === "todas" ? subastas : subastas.filter((s) => s.categoria === filter);

  const renderItem = ({ item }: { item: SubastaListado }) => (
    <Pressable style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]} onPress={() => router.push(`/subasta/${item.id}` as any)}>
      <View style={s.cardTop}>
        <View style={[s.badge, { backgroundColor: CATEG_COLORS[item.categoria] + "18" }]}>
          <Text style={[s.badgeText, { color: CATEG_COLORS[item.categoria] }]}>{CATEG_LABELS[item.categoria]}</Text>
        </View>
        <Text style={[s.estado, { color: item.estado === "abierta" ? "#059669" : "#DC2626" }]}>● {item.estado === "abierta" ? "Abierta" : "Cerrada"}</Text>
      </View>
      <View style={s.row}><MaterialIcons name="event" size={16} color="#9CA3AF" /><Text style={s.info}>{item.fecha} · {item.hora}</Text></View>
      <View style={s.row}><MaterialIcons name="place" size={16} color="#9CA3AF" /><Text style={s.info} numberOfLines={1}>{item.ubicacion || "—"}</Text></View>
      <View style={s.cardBot}><Text style={s.moneda}>{item.moneda}</Text><MaterialIcons name="arrow-forward-ios" size={14} color="#8B6914" /></View>
    </Pressable>
  );

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <Text style={s.title}>Subastas</Text>
          <Text style={s.sub}>{isAuthenticated ? "Catálogo privado" : "Catálogo público"}</Text>
        </View>
        {/* Filtros */}
        <FlatList horizontal data={["todas", "comun", "especial", "plata", "oro", "platino"] as const} keyExtractor={(i) => i} showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}
          renderItem={({ item: f }) => (
            <Pressable style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f === "todas" ? "Todas" : CATEG_LABELS[f as Categoria]}</Text>
            </Pressable>
          )} />
        <FlatList data={filtered} keyExtractor={(i) => String(i.id)} renderItem={renderItem} contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#8B6914" />}
          ListEmptyComponent={<View style={s.empty}><MaterialIcons name="search-off" size={48} color="#E5DDD0" /><Text style={s.emptyText}>No hay subastas en esta categoría</Text></View>} />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", color: "#1A1A2E" },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  filters: { paddingHorizontal: 24, gap: 8, paddingVertical: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFCF7", borderWidth: 1, borderColor: "#E5DDD0" },
  filterActive: { backgroundColor: "#8B6914", borderColor: "#8B6914" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 14 },
  card: { backgroundColor: "#FFFCF7", borderRadius: 16, borderWidth: 1, borderColor: "#F0EBE3", padding: 16 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  estado: { fontSize: 12, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  info: { fontSize: 14, color: "#6B7280", flex: 1 },
  moneda: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  cardBot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3EDE4" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
