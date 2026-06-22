import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/context/AuthContext";
import { SubastaListado, Categoria } from "../../src/types";
import { auctionService } from "../../src/services";
import {
  getAuctionScheduleLabel,
  getAuctionScheduleStatus,
  isAuctionLive,
  isAuctionScheduled,
} from "../../src/utils/auctionSchedule";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.72;

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
    <View style={{ width: 12, height: 12, justifyContent: "center", alignItems: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: "rgba(239,68,68,0.3)",
          transform: [{ scale: pulse }],
        }}
      />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#EF4444" }} />
    </View>
  );
}

/* ── Skeleton Loader ─────────────────────────────────────── */
function SkeletonCard({ width, height }: { width: number | string; height: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius: 20,
        backgroundColor: "#E5DDD0",
        opacity,
      }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 16, marginTop: 12 }}>
      <SkeletonCard width="100%" height={28} />
      <SkeletonCard width="60%" height={16} />
      <View style={{ flexDirection: "row", gap: 14, marginTop: 16 }}>
        <SkeletonCard width={FEATURED_CARD_WIDTH} height={220} />
        <SkeletonCard width={FEATURED_CARD_WIDTH * 0.4} height={220} />
      </View>
      <SkeletonCard width="45%" height={22} />
      <SkeletonCard width="100%" height={90} />
      <SkeletonCard width="100%" height={90} />
      <SkeletonCard width="100%" height={90} />
    </View>
  );
}

/* ── Format helpers ──────────────────────────────────────── */
function formatDate(fecha: string): string {
  try {
    const d = new Date(fecha);
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

/* ════════════════════════════════════════════════════════════
   HOME SCREEN
   ════════════════════════════════════════════════════════════ */
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

  const liveSubastas = subastas.filter((s) => isAuctionLive(s));
  const proximasSubastas = subastas.filter((s) => isAuctionScheduled(s));

  /* ── Featured Card (Horizontal) ── */
  const renderFeatured = ({ item, index }: { item: SubastaListado; index: number }) => {
    const img = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
    const scheduleStatus = getAuctionScheduleStatus(item);
    return (
      <Pressable
        onPress={() => router.push(`/subasta/${item.id}` as any)}
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      >
        <View style={st.featuredCard}>
          <View style={st.featuredImgWrap}>
            <Image source={{ uri: img }} style={st.featuredImg} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.65)"]}
              style={st.featuredGradient}
            />
            <View style={st.liveBadge}>
              <View style={st.liveDotSmall} />
              <Text style={st.liveText}>
                {getAuctionScheduleLabel(scheduleStatus)}
              </Text>
            </View>
            {/* Bottom info overlay */}
            <View style={st.featuredOverlayInfo}>
              <Text style={st.featuredOverlayTitle} numberOfLines={1}>
                Subasta #{item.id}
              </Text>
              <View style={st.featuredOverlayRow}>
                <View style={[st.categChipOverlay, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <MaterialIcons
                    name={CATEG_ICONS[item.categoria] as any}
                    size={11}
                    color="#FFF"
                  />
                  <Text style={st.categTextOverlay}>{CATEG_LABELS[item.categoria]}</Text>
                </View>
                <Text style={st.featuredOverlayDate}>
                  {formatDate(item.fecha)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  /* ── Small Card (Vertical list) ── */
  const renderSmall = ({ item, index }: { item: SubastaListado; index: number }) => {
    const catColors = CATEG_COLORS[item.categoria];
    return (
      <Pressable
        onPress={() => router.push(`/subasta/${item.id}` as any)}
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      >
        <View style={st.smallCard}>
          <Image
            source={{ uri: PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length] }}
            style={st.smallThumb}
          />
          <View style={st.smallInfo}>
            <Text style={st.smallTitle} numberOfLines={1}>Subasta #{item.id}</Text>
            <View style={st.smallMetaRow}>
              <View style={[st.categChip, { backgroundColor: catColors.bg, borderColor: catColors.border }]}>
                <MaterialIcons name={CATEG_ICONS[item.categoria] as any} size={10} color={catColors.text} />
                <Text style={[st.categText, { color: catColors.text }]}>{CATEG_LABELS[item.categoria]}</Text>
              </View>
              <View style={st.currencyChip}>
                <Text style={st.currencyText}>{item.moneda}</Text>
              </View>
            </View>
            <View style={st.smallDateRow}>
              <MaterialIcons name="event" size={12} color="#9CA3AF" />
              <Text style={st.smallDate}>{formatDate(item.fecha)}</Text>
              <MaterialIcons name="schedule" size={12} color="#9CA3AF" style={{ marginLeft: 8 }} />
              <Text style={st.smallDate}>{formatTime(item.hora)}</Text>
            </View>
          </View>
          <View style={st.smallArrow}>
            <MaterialIcons name="chevron-right" size={22} color="#C4B898" />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={st.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <FlatList
            data={proximasSubastas}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderSmall}
            contentContainerStyle={st.mainList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadSubastas(); }}
                tintColor="#8B6914"
              />
            }
            ListHeaderComponent={
              <>
                {/* ── Header ── */}
                <View style={st.header}>
                  <View style={st.headerLeft}>
                    <Text style={st.greeting}>
                      {isAuthenticated ? `Hola, ${user?.nombre || ""}` : "Bienvenido"}
                    </Text>
                    <Text style={st.subGreeting}>Descubrí las mejores subastas</Text>
                  </View>
                  {isAuthenticated ? (
                    <Pressable
                      style={({ pressed }) => [st.profileBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => router.push("/(tabs)/profile" as any)}
                    >
                      <LinearGradient
                        colors={["#8B6914", "#B8941C"]}
                        style={st.profileBtnGrad}
                      >
                        <MaterialIcons name="person" size={20} color="#FFF" />
                      </LinearGradient>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [st.loginHeaderBtn, pressed && { opacity: 0.85 }]}
                      onPress={() => router.push("/(auth)/welcome")}
                    >
                      <LinearGradient
                        colors={["#1A1A2E", "#2D2D44"]}
                        style={st.loginBtnGrad}
                      >
                        <Text style={st.loginHeaderText}>Ingresar</Text>
                      </LinearGradient>
                    </Pressable>
                  )}
                </View>

                {/* ── Featured / En Vivo ── */}
                {liveSubastas.length > 0 && (
                  <>
                    <View style={st.sectionHeader}>
                      <View style={st.sectionTitleRow}>
                        <LiveDot />
                        <Text style={st.sectionTitle}>En Vivo</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [st.seeAllBtn, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push("/(tabs)/live" as any)}
                      >
                        <Text style={st.seeAll}>Ver todas</Text>
                        <MaterialIcons name="arrow-forward" size={14} color="#8B6914" />
                      </Pressable>
                    </View>
                    <FlatList
                      data={liveSubastas}
                      keyExtractor={(i) => `live-${i.id}`}
                      renderItem={renderFeatured}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={st.featuredList}
                      snapToInterval={FEATURED_CARD_WIDTH + 14}
                      decelerationRate="fast"
                    />
                  </>
                )}

                {/* ── Section: Próximas ── */}
                <View style={st.sectionHeader}>
                  <View style={st.sectionTitleRow}>
                    <MaterialIcons name="event-note" size={20} color="#1A1A2E" />
                    <Text style={st.sectionTitle}>Próximas Subastas</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [st.seeAllBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => router.push("/(tabs)/subastas" as any)}
                  >
                    <Text style={st.seeAll}>Ver todas</Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#8B6914" />
                  </Pressable>
                </View>
              </>
            }
            ListEmptyComponent={
              !loading ? (
                <View style={st.empty}>
                  <View style={st.emptyIconWrap}>
                    <MaterialIcons name="event-busy" size={36} color="#C4B898" />
                  </View>
                  <Text style={st.emptyTitle}>Sin subastas próximas</Text>
                  <Text style={st.emptyText}>Volvé pronto para ver nuevas subastas</Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */
const SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.12)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
}) as any;

const SHADOW_LIGHT = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
}) as any;

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  mainList: { paddingBottom: 110 },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerLeft: { flex: 1, marginRight: 16 },
  greeting: { fontSize: 28, fontWeight: "800", color: "#1A1A2E", letterSpacing: -0.5 },
  subGreeting: { fontSize: 15, color: "#8B8B8B", marginTop: 4, letterSpacing: 0.1 },

  profileBtn: { width: 44, height: 44, borderRadius: 22 },
  profileBtnGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  loginHeaderBtn: { borderRadius: 14, overflow: "hidden" },
  loginBtnGrad: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
  },
  loginHeaderText: { color: "#FFF", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },

  /* ── Section Headers ── */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E", letterSpacing: -0.3 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAll: { fontSize: 14, color: "#8B6914", fontWeight: "600" },

  /* ── Featured Cards (Horizontal) ── */
  featuredList: { paddingHorizontal: 24, gap: 14 },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFF",
    ...SHADOW,
  },
  featuredImgWrap: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },
  featuredImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  featuredGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  liveBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220,38,38,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  featuredOverlayInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredOverlayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredOverlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categChipOverlay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  categTextOverlay: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
  },
  featuredOverlayDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },

  /* ── Small Cards (Vertical) ── */
  smallCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 12,
    gap: 14,
    ...SHADOW_LIGHT,
  },
  smallThumb: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: "#F0EBE3",
  },
  smallInfo: { flex: 1, gap: 4 },
  smallTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", letterSpacing: -0.2 },
  smallMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  categChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  categText: { fontSize: 11, fontWeight: "600" },
  currencyChip: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  currencyText: { fontSize: 10, fontWeight: "700", color: "#15803D" },
  smallDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  smallDate: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  smallArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Empty State ── */
  empty: { alignItems: "center", marginTop: 48, gap: 12, paddingHorizontal: 40 },
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
