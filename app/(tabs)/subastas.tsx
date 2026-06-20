import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, TextInput, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { SubastaListado, Categoria } from "../../src/types";
import { auctionService } from "../../src/services";

const CATEG_LABELS: Record<Categoria, string> = { comun: "Común", especial: "Especial", plata: "Plata", oro: "Oro", platino: "Platino" };
const CATEG_COLORS: Record<Categoria, string> = { comun: "#6B7280", especial: "#2563EB", plata: "#94A3B8", oro: "#D97706", platino: "#7C3AED" };

// Placeholder images for demo cards
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1599643478518-a784e5dc3f25?w=200&h=150&fit=crop",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=150&fit=crop",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=150&fit=crop",
];

export default function SubastasScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [subastas, setSubastas] = useState<SubastaListado[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCateg, setFilterCateg] = useState<Categoria | null>(null);

  const load = async () => {
    try {
      const data = isAuthenticated
        ? await auctionService.getSubastas()
        : await auctionService.getPublicas();
      setSubastas(data);
    } catch {
      /* offline fallback — show empty */
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  // Derived stats
  const stats = useMemo(() => {
    const total = subastas.length;
    const enVivo = subastas.filter((s) => s.estado === "abierta").length;
    const proximas = subastas.filter((s) => s.estado === "cerrada").length;
    return { total, enVivo, proximas };
  }, [subastas]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = subastas;
    if (filterCateg) list = list.filter((s) => s.categoria === filterCateg);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.ubicacion?.toLowerCase().includes(q) ||
          s.categoria.toLowerCase().includes(q) ||
          s.moneda.toLowerCase().includes(q) ||
          String(s.id).includes(q)
      );
    }
    return list;
  }, [subastas, filterCateg, search]);

  const renderCard = ({ item, index }: { item: SubastaListado; index: number }) => {
    const isLive = item.estado === "abierta";
    const placeholderImg = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
    const canJoin = isAuthenticated;

    return (
      <Pressable
        style={({ pressed }) => [st.card, pressed && st.cardPressed]}
        onPress={() => router.push(`/subasta/${item.id}` as any)}
      >
        {/* Thumbnail */}
        <View style={st.cardRow}>
          <View style={st.thumbWrap}>
            <Image source={{ uri: placeholderImg }} style={st.thumb} />
            {isLive && (
              <View style={st.liveBadge}>
                <Text style={st.liveText}>EN VIVO</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={st.cardInfo}>
            <Text style={st.cardTitle} numberOfLines={2}>
              Subasta #{item.id}
            </Text>

            <View style={st.cardMeta}>
              <View style={[st.categChip, { backgroundColor: CATEG_COLORS[item.categoria] + "15" }]}>
                <Text style={[st.categChipText, { color: CATEG_COLORS[item.categoria] }]}>
                  {CATEG_LABELS[item.categoria]}
                </Text>
              </View>
              <Text style={st.monedaLabel}>{item.moneda}</Text>
            </View>

            <View style={st.dateRow}>
              <MaterialIcons name="schedule" size={13} color="#9CA3AF" />
              <Text style={st.dateText}>
                {item.fecha}, {item.hora}
              </Text>
            </View>

            {/* Guest note */}
            {!canJoin && (
              <View style={st.guestNote}>
                <MaterialIcons name="visibility" size={12} color="#9CA3AF" />
                <Text style={st.guestNoteText}>Solo espectador</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={st.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={st.header}>
          <Text style={st.headerTitle}>Subastas</Text>
        </View>

        {/* Search bar */}
        <View style={st.searchWrap}>
          <View style={st.searchBar}>
            <MaterialIcons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={st.searchInput}
              placeholder="Buscar subastas.."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <MaterialIcons name="close" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filters button */}
        <View style={st.filtersRow}>
          <Pressable
            style={[st.filterToggle, showFilters && st.filterToggleActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialIcons
              name="tune"
              size={16}
              color={showFilters ? "#FFF" : "#1A1A2E"}
            />
            <Text style={[st.filterToggleText, showFilters && { color: "#FFF" }]}>
              Filtros
            </Text>
          </Pressable>

          {filterCateg && (
            <Pressable style={st.clearFilter} onPress={() => setFilterCateg(null)}>
              <Text style={st.clearFilterText}>✕ {CATEG_LABELS[filterCateg]}</Text>
            </Pressable>
          )}
        </View>

        {/* Filter chips (expandable) */}
        {showFilters && (
          <View style={st.chipsRow}>
            {(["comun", "especial", "plata", "oro", "platino"] as Categoria[]).map((c) => (
              <Pressable
                key={c}
                style={[st.chip, filterCateg === c && st.chipActive]}
                onPress={() => setFilterCateg(filterCateg === c ? null : c)}
              >
                <Text style={[st.chipText, filterCateg === c && st.chipTextActive]}>
                  {CATEG_LABELS[c]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={st.statsRow}>
          <View style={st.statItem}>
            <Text style={st.statNumber}>{stats.total}</Text>
            <Text style={st.statLabel}>Total</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={[st.statNumber, { color: "#DC2626" }]}>{stats.enVivo}</Text>
            <Text style={st.statLabel}>En Vivo</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={st.statNumber}>{stats.proximas}</Text>
            <Text style={st.statLabel}>Próximas</Text>
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={st.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#8B6914"
            />
          }
          ListEmptyComponent={
            <View style={st.empty}>
              <MaterialIcons name="search-off" size={48} color="#E5DDD0" />
              <Text style={st.emptyTitle}>No hay subastas</Text>
              <Text style={st.emptyText}>
                {search ? "No se encontraron resultados para tu búsqueda" : "No hay subastas disponibles en este momento"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  header: { alignItems: "center", paddingVertical: 14 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },

  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F5F1EC",
    borderRadius: 12, paddingHorizontal: 14, height: 44, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1A1A2E" },

  filtersRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 8, gap: 10 },
  filterToggle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: "#E5DDD0", backgroundColor: "#FFF",
  },
  filterToggleActive: { backgroundColor: "#1A1A2E", borderColor: "#1A1A2E" },
  filterToggleText: { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },
  clearFilter: { backgroundColor: "#FEF3E2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  clearFilterText: { fontSize: 12, fontWeight: "600", color: "#D97706" },

  chipsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: "#E5DDD0", backgroundColor: "#FFF",
  },
  chipActive: { backgroundColor: "#1A1A2E", borderColor: "#1A1A2E" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  chipTextActive: { color: "#FFF" },

  statsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginHorizontal: 20, marginBottom: 16, paddingVertical: 14,
    backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#F0EBE3",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  statLabel: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#F0EBE3" },

  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },

  card: {
    backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1,
    borderColor: "#F0EBE3", overflow: "hidden",
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardRow: { flexDirection: "row", padding: 12, gap: 14 },
  thumbWrap: { width: 90, height: 90, borderRadius: 12, overflow: "hidden", backgroundColor: "#F0EBE3", position: "relative" },
  thumb: { width: "100%", height: "100%", resizeMode: "cover" },
  liveBadge: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "#DC2626", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  liveText: { fontSize: 9, fontWeight: "800", color: "#FFF", letterSpacing: 0.5 },

  cardInfo: { flex: 1, justifyContent: "center", gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", lineHeight: 20 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  categChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categChipText: { fontSize: 11, fontWeight: "700" },
  monedaLabel: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 12, color: "#9CA3AF" },

  guestNote: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  guestNoteText: { fontSize: 11, color: "#9CA3AF", fontStyle: "italic" },

  empty: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 40 },
});
