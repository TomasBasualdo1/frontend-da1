import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Image,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { SubastaListado, Categoria } from "../../src/types";
import { auctionService } from "../../src/services";
import {
  getAuctionScheduleLabel,
  getAuctionScheduleStatus,
  isAuctionLive,
  isAuctionScheduled,
} from "../../src/utils/auctionSchedule";

const CATEG_LABELS: Record<Categoria, string> = {
  comun: "Común",
  especial: "Especial",
  plata: "Plata",
  oro: "Oro",
  platino: "Platino",
};

const CATEG_COLORS: Record<Categoria, { bg: string; text: string; border: string }> = {
  comun: { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
  especial: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  plata: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  oro: { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
  platino: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
};

const CATEG_ICONS: Record<Categoria, string> = {
  comun: "local-offer",
  especial: "star",
  plata: "workspace-premium",
  oro: "emoji-events",
  platino: "diamond",
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
];

/* ── Pulsating Live Dot ─────────────────────────────────── */
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <View style={{ width: 10, height: 10, justifyContent: "center", alignItems: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: "rgba(239,68,68,0.3)",
          transform: [{ scale: pulse }],
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" }} />
    </View>
  );
}

function formatDate(fecha: string): string {
  try {
    const [year, month, day] = fecha.split("T")[0].split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  } catch {
    return fecha;
  }
}

function formatTime(hora: string): string {
  try {
    const [h, m] = hora.split(":");
    return `${h}:${m} hs`;
  } catch {
    return hora;
  }
}

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
      /* offline fallback */
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const stats = useMemo(() => {
    const total = subastas.length;
    const enVivo = subastas.filter((s) => isAuctionLive(s)).length;
    const proximas = subastas.filter((s) => isAuctionScheduled(s)).length;
    return { total, enVivo, proximas };
  }, [subastas]);

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
    const scheduleStatus = getAuctionScheduleStatus(item);
    const isLive = scheduleStatus === "live";
    const isClosed = scheduleStatus === "closed";
    const placeholderImg = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
    const canJoin = isAuthenticated;
    const catColors = CATEG_COLORS[item.categoria];

    return (
      <Pressable
        onPress={() => router.push(`/subasta/${item.id}` as any)}
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      >
        <View style={st.card}>
          <View style={st.cardRow}>
            {/* Thumbnail */}
            <View style={st.thumbWrap}>
              <Image source={{ uri: placeholderImg }} style={st.thumb} />
              {!isClosed && (
                <View
                  style={[
                    st.liveTagBadge,
                    !isLive && st.scheduledTagBadge,
                  ]}
                >
                  {isLive && <LiveDot />}
                  <Text
                    style={[
                      st.liveTagText,
                      !isLive && st.scheduledTagText,
                    ]}
                  >
                    {getAuctionScheduleLabel(scheduleStatus)}
                  </Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={st.cardInfo}>
              <Text style={st.cardTitle} numberOfLines={2}>
                Subasta #{item.id}
              </Text>

              <View style={st.cardMeta}>
                <View style={[st.categChip, { backgroundColor: catColors.bg, borderColor: catColors.border }]}>
                  <MaterialIcons name={CATEG_ICONS[item.categoria] as any} size={10} color={catColors.text} />
                  <Text style={[st.categChipText, { color: catColors.text }]}>
                    {CATEG_LABELS[item.categoria]}
                  </Text>
                </View>
                <View style={st.currencyChip}>
                  <Text style={st.currencyText}>{item.moneda}</Text>
                </View>
              </View>

              <View style={st.dateRow}>
                <MaterialIcons name="event" size={13} color="#9CA3AF" />
                <Text style={st.dateText}>{formatDate(item.fecha)}</Text>
                <MaterialIcons name="schedule" size={13} color="#9CA3AF" style={{ marginLeft: 8 }} />
                <Text style={st.dateText}>{formatTime(item.hora)}</Text>
              </View>

              {!canJoin && (
                <View style={st.guestNote}>
                  <MaterialIcons name="visibility" size={12} color="#9CA3AF" />
                  <Text style={st.guestNoteText}>Solo espectador</Text>
                </View>
              )}
            </View>

            <View style={st.cardArrow}>
              <MaterialIcons name="chevron-right" size={22} color="#C4B898" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={st.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={st.header}>
                <Text style={st.headerTitle}>Subastas</Text>
              </View>

              {/* Search Row */}
              <View style={st.searchRow}>
                <View style={st.searchBar}>
                  <MaterialIcons name="search" size={20} color="#8B6914" />
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

                {/* Filter Icon Toggle */}
                <Pressable
                  onPress={() => setShowFilters(!showFilters)}
                  style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                >
                  <View style={[st.filterToggle, showFilters && st.filterToggleActive]}>
                    <MaterialIcons
                      name="tune"
                      size={20}
                      color={showFilters ? "#FFF" : "#1A1A2E"}
                    />
                  </View>
                </Pressable>
              </View>

              {/* Active Category Tag (if filter is selected) */}
              {filterCateg && (
                <View style={st.clearFilterRow}>
                  <Pressable
                    style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                    onPress={() => setFilterCateg(null)}
                  >
                    <View style={st.clearFilter}>
                      <Text style={st.clearFilterText}>✕ {CATEG_LABELS[filterCateg]}</Text>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* Filter Chips (Expandable) */}
              {showFilters && (
                <View style={st.chipsRow}>
                  {(["comun", "especial", "plata", "oro", "platino"] as Categoria[]).map((c) => {
                    const isActive = filterCateg === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setFilterCateg(isActive ? null : c)}
                        style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                      >
                        <View style={[st.chip, isActive && st.chipActive]}>
                          <Text style={[st.chipText, isActive && st.chipTextActive]}>
                            {CATEG_LABELS[c]}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Stats Card (Now smaller and scrolls with screen) */}
              <View style={st.statsRow}>
                <View style={st.statItem}>
                  <Text style={st.statNumber}>{stats.total}</Text>
                  <Text style={st.statLabel}>Total</Text>
                </View>
                <View style={st.statDivider} />
                <View style={st.statItem}>
                  <View style={st.statLiveRow}>
                    <LiveDot />
                    <Text style={[st.statNumber, { color: "#DC2626" }]}>{stats.enVivo}</Text>
                  </View>
                  <Text style={st.statLabel}>En Vivo</Text>
                </View>
                <View style={st.statDivider} />
                <View style={st.statItem}>
                  <Text style={st.statNumber}>{stats.proximas}</Text>
                  <Text style={st.statLabel}>Próximas</Text>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={st.empty}>
              <View style={st.emptyIconWrap}>
                <MaterialIcons name="search-off" size={36} color="#C4B898" />
              </View>
              <Text style={st.emptyTitle}>No hay subastas</Text>
              <Text style={st.emptyText}>
                {search
                  ? "No se encontraron resultados para tu búsqueda"
                  : "No hay subastas disponibles en este momento"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */
const SHADOW_LIGHT = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
}) as any;

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },

  /* ── Header ── */
  header: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },

  /* ── Search Row ── */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    ...SHADOW_LIGHT,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
    fontWeight: "500",
  },

  /* ── Filter Icon Button ── */
  filterToggle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    ...SHADOW_LIGHT,
  },
  filterToggleActive: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },

  /* ── Active Selected Tag Row ── */
  clearFilterRow: {
    marginBottom: 12,
    flexDirection: "row",
  },
  clearFilter: {
    borderRadius: 10,
    backgroundColor: "#FEF3E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },

  /* ── Filter Chips ── */
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipTextActive: {
    color: "#FFF",
  },

  /* ── Stats Card (Smaller version) ── */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    marginBottom: 8,
    ...SHADOW_LIGHT,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLiveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statNumber: { fontSize: 18, fontWeight: "800", color: "#1A1A2E" },
  statLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  statDivider: { width: 1, height: 20, backgroundColor: "#F0EBE3" },

  /* ── List Layout ── */
  list: { paddingHorizontal: 24, paddingBottom: 110, gap: 12 },

  /* ── Cards ── */
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    overflow: "hidden",
    ...SHADOW_LIGHT,
  },
  cardRow: { flexDirection: "row", padding: 14, gap: 14, alignItems: "center" },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F0EBE3",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%", resizeMode: "cover" },

  liveTagBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220,38,38,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveTagText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  scheduledTagBadge: {
    backgroundColor: "rgba(245,158,11,0.92)",
  },
  scheduledTagText: {
    color: "#FFF",
  },

  cardInfo: { flex: 1, justifyContent: "center", gap: 5 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", letterSpacing: -0.2 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  categChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  categChipText: { fontSize: 11, fontWeight: "600" },
  currencyChip: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  currencyText: { fontSize: 10, fontWeight: "700", color: "#15803D" },

  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  dateText: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },

  guestNote: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  guestNoteText: { fontSize: 11, color: "#9CA3AF", fontStyle: "italic" },

  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Empty State ── */
  empty: { alignItems: "center", marginTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#FEF3E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
});
