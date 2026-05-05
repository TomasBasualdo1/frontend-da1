import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { SubastaListado, Categoria } from "../../src/types";
import { auctionService } from "../../src/services";

const CATEG_LABELS: Record<Categoria, string> = { comun: "Común", especial: "Especial", plata: "Plata", oro: "Oro", platino: "Platino" };
const CATEG_COLORS: Record<Categoria, string> = { comun: "#6B7280", especial: "#2563EB", plata: "#94A3B8", oro: "#D97706", platino: "#7C3AED" };
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1599643478518-a784e5dc3f25?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=250&fit=crop",
];

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
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadSubastas(); }, []);

  const liveSubastas = subastas.filter(s => s.estado === "abierta");
  const proximasSubastas = subastas.filter(s => s.estado === "cerrada");

  const renderFeatured = ({ item, index }: { item: SubastaListado; index: number }) => {
    const img = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
    return (
      <Pressable style={({ pressed }) => [st.featuredCard, pressed && { opacity: 0.95 }]} onPress={() => router.push(`/subasta/${item.id}` as any)}>
        <Image source={{ uri: img }} style={st.featuredImg} />
        <View style={st.featuredOverlay}>
          {item.estado === "abierta" && (
            <View style={st.liveBadge}><Text style={st.liveText}>EN VIVO</Text></View>
          )}
        </View>
        <View style={st.featuredInfo}>
          <Text style={st.featuredTitle} numberOfLines={1}>Subasta #{item.id}</Text>
          <View style={st.featuredMeta}>
            <View style={[st.categChip, { backgroundColor: CATEG_COLORS[item.categoria] + "15" }]}>
              <Text style={[st.categText, { color: CATEG_COLORS[item.categoria] }]}>{CATEG_LABELS[item.categoria]}</Text>
            </View>
            <Text style={st.featuredDate}>{item.fecha}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderSmall = ({ item, index }: { item: SubastaListado; index: number }) => (
    <Pressable style={({ pressed }) => [st.smallCard, pressed && { opacity: 0.92 }]} onPress={() => router.push(`/subasta/${item.id}` as any)}>
      <Image source={{ uri: PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length] }} style={st.smallThumb} />
      <View style={st.smallInfo}>
        <Text style={st.smallTitle}>Subasta #{item.id}</Text>
        <Text style={st.smallMeta}>{CATEG_LABELS[item.categoria]} · {item.moneda}</Text>
        <Text style={st.smallDate}>{item.fecha}, {item.hora}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
    </Pressable>
  );

  return (
    <View style={st.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={proximasSubastas}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderSmall}
          contentContainerStyle={st.mainList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSubastas(); }} tintColor="#1A1A2E" />}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={st.header}>
                <View>
                  <Text style={st.greeting}>{isAuthenticated ? `Hola, ${user?.nombre || ""}` : "Bienvenido"}</Text>
                  <Text style={st.subGreeting}>Descubrí las mejores subastas</Text>
                </View>
                {isAuthenticated ? (
                  <Pressable style={st.profileBtn} onPress={() => router.push("/(tabs)/profile" as any)}>
                    <MaterialIcons name="person" size={22} color="#1A1A2E" />
                  </Pressable>
                ) : (
                  <Pressable style={st.loginHeaderBtn} onPress={() => router.push("/(auth)/welcome")}>
                    <Text style={st.loginHeaderText}>Ingresar</Text>
                  </Pressable>
                )}
              </View>

              {/* Featured / En Vivo */}
              {liveSubastas.length > 0 && (
                <>
                  <View style={st.sectionHeader}>
                    <Text style={st.sectionTitle}>🔴 En Vivo</Text>
                    <Pressable onPress={() => router.push("/(tabs)/live" as any)}>
                      <Text style={st.seeAll}>Ver todas →</Text>
                    </Pressable>
                  </View>
                  <FlatList
                    data={liveSubastas}
                    keyExtractor={(i) => `live-${i.id}`}
                    renderItem={renderFeatured}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={st.featuredList}
                  />
                </>
              )}

              {/* Section: Próximas */}
              <View style={st.sectionHeader}>
                <Text style={st.sectionTitle}>Próximas Subastas</Text>
                <Pressable onPress={() => router.push("/(tabs)/subastas" as any)}>
                  <Text style={st.seeAll}>Ver todas →</Text>
                </Pressable>
              </View>
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={st.empty}>
                <MaterialIcons name="event-busy" size={48} color="#E5DDD0" />
                <Text style={st.emptyTitle}>Sin subastas próximas</Text>
                <Text style={st.emptyText}>Volvé pronto para ver nuevas subastas</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  mainList: { paddingBottom: 24 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  greeting: { fontSize: 24, fontWeight: "800", color: "#1A1A2E" },
  subGreeting: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  profileBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F5F1EC", justifyContent: "center", alignItems: "center" },
  loginHeaderBtn: { backgroundColor: "#1A1A2E", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  loginHeaderText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  seeAll: { fontSize: 13, color: "#8B6914", fontWeight: "600" },

  featuredList: { paddingHorizontal: 20, gap: 14 },
  featuredCard: { width: 280, borderRadius: 16, backgroundColor: "#FFF", overflow: "hidden", borderWidth: 1, borderColor: "#F0EBE3" },
  featuredImg: { width: "100%", height: 150, resizeMode: "cover" },
  featuredOverlay: { position: "absolute", top: 10, left: 10 },
  liveBadge: { backgroundColor: "#DC2626", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveText: { fontSize: 10, fontWeight: "800", color: "#FFF", letterSpacing: 0.5 },
  featuredInfo: { padding: 14, gap: 6 },
  featuredTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  featuredMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  categChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categText: { fontSize: 11, fontWeight: "700" },
  featuredDate: { fontSize: 12, color: "#9CA3AF" },

  smallCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#F0EBE3", padding: 12, marginHorizontal: 20, marginBottom: 10, gap: 14 },
  smallThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: "#F0EBE3" },
  smallInfo: { flex: 1 },
  smallTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  smallMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  smallDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  empty: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 13, color: "#9CA3AF" },
});
