import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import { auctionService } from "../../../src/services";
import {
  Categoria,
  SubastaDetalle,
  SubastaDetallePublica,
} from "../../../src/types";
import {
  getAuctionScheduleLabel,
  getAuctionScheduleStatus,
} from "../../../src/utils/auctionSchedule";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEG_LABELS: Record<Categoria, string> = {
  comun: "Común",
  especial: "Especial",
  plata: "Plata",
  oro: "Oro",
  platino: "Platino",
};

const CATEG_COLORS: Record<
  Categoria,
  { bg: string; text: string; border: string }
> = {
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

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
];

/* ── Pulsating Live Dot ─────────────────────────────────── */
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);
  return (
    <View
      style={{
        width: 12,
        height: 12,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
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
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: "#EF4444",
        }}
      />
    </View>
  );
}

function formatDate(fecha: string): string {
  try {
    const [year, month, day] = fecha.split("T")[0].split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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

export default function SubastaDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [subasta, setSubasta] = useState<
    SubastaDetalle | SubastaDetallePublica | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("Subasta no encontrada");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setErrorMessage("Subasta no encontrada");
      try {
        const data = isAuthenticated
          ? await auctionService.getDetalle(Number(id))
          : await auctionService.getPublicaDetalle(Number(id));
        setSubasta(data);
      } catch (error: any) {
        setSubasta(null);
        const status = error?.response?.status;
        const detail = error?.response?.data?.detail;
        if (status === 403) {
          setErrorMessage(
            typeof detail === "string"
              ? detail
              : "No tenes categoria suficiente para ver el detalle completo de esta subasta.",
          );
        } else if (status === 404) {
          setErrorMessage("Subasta no encontrada o no disponible.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color="#8B6914" />
      </View>
    );
  }

  if (!subasta) {
    return (
      <View style={st.center}>
        <MaterialIcons name="lock-outline" size={48} color="#DC2626" />
        <Text style={st.err}>{errorMessage}</Text>
        <Pressable onPress={() => router.back()} style={st.backBtnSimple}>
          <Text style={st.backBtnSimpleText}>Volver al Inicio</Text>
        </Pressable>
      </View>
    );
  }

  const catColors = CATEG_COLORS[subasta.categoria];
  const coverImg = COVER_IMAGES[Number(id) % COVER_IMAGES.length];
  const scheduleStatus = getAuctionScheduleStatus(subasta);
  const isLive = scheduleStatus === "live";
  const isClosed = scheduleStatus === "closed";

  return (
    <View style={st.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Fixed Premium Header (Overlay) ── */}
      <SafeAreaView style={st.headerSafeArea} edges={["top"]}>
        <View style={st.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <View style={st.backBtnCircle}>
              <MaterialIcons name="arrow-back" size={22} color="#1A1A2E" />
            </View>
          </Pressable>
          <Text style={st.headerTitle}>Detalles de Subasta</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scrollContainer}
      >
        {/* ── Cover Hero Image ── */}
        <View style={st.heroWrap}>
          <Image source={{ uri: coverImg }} style={st.heroImg} />
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
            style={st.heroGradient}
          />
          <View style={st.heroInfoOverlay}>
            <Text style={st.heroSubTitle}>Catálogo Exclusivo</Text>
            <Text style={st.heroTitle}>Subasta #{id}</Text>
          </View>
        </View>

        {/* ── Main Details Card ── */}
        <View style={st.cardWrapper}>
          <View style={st.infoCard}>
            <View style={st.cardHeaderRow}>
              {/* Category */}
              <View
                style={[
                  st.categChip,
                  {
                    backgroundColor: catColors.bg,
                    borderColor: catColors.border,
                  },
                ]}
              >
                <MaterialIcons
                  name={CATEG_ICONS[subasta.categoria] as any}
                  size={11}
                  color={catColors.text}
                />
                <Text style={[st.categText, { color: catColors.text }]}>
                  {CATEG_LABELS[subasta.categoria]}
                </Text>
              </View>

              {/* Status */}
              {isLive ? (
                <View style={st.liveStatusBadge}>
                  <LiveDot />
                  <Text style={st.liveStatusText}>EN VIVO</Text>
                </View>
              ) : !isClosed ? (
                <View style={st.scheduledStatusBadge}>
                  <Text style={st.scheduledStatusText}>
                    {getAuctionScheduleLabel(scheduleStatus)}
                  </Text>
                </View>
              ) : (
                <View style={st.closedStatusBadge}>
                  <Text style={st.closedStatusText}>Finalizada</Text>
                </View>
              )}
            </View>

            <View style={st.divider} />

            {/* Info rows */}
            <View style={st.detailsList}>
              <View style={st.detailItem}>
                <View style={st.iconContainer}>
                  <MaterialIcons name="event" size={18} color="#8B6914" />
                </View>
                <View>
                  <Text style={st.detailLabel}>Fecha y Hora</Text>
                  <Text style={st.detailValue}>
                    {formatDate(subasta.fecha)} a las {formatTime(subasta.hora)}
                  </Text>
                </View>
              </View>

              <View style={st.detailItem}>
                <View style={st.iconContainer}>
                  <MaterialIcons name="place" size={18} color="#8B6914" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.detailLabel}>Ubicación</Text>
                  <Text style={st.detailValue} numberOfLines={1}>
                    {subasta.ubicacion || "Virtual / En Línea"}
                  </Text>
                </View>
              </View>

              <View style={st.detailItem}>
                <View style={st.iconContainer}>
                  <MaterialIcons
                    name="monetization-on"
                    size={18}
                    color="#8B6914"
                  />
                </View>
                <View>
                  <Text style={st.detailLabel}>Moneda de Ofertas</Text>
                  <View style={st.currencyRow}>
                    <Text style={st.detailValue}>Valores expresados en </Text>
                    <View style={st.currencyChip}>
                      <Text style={st.currencyText}>{subasta.moneda}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Catalog Section ── */}
        <View style={st.catalogSection}>
          <Text style={st.sectionTitle}>
            Catálogo de Piezas{" "}
            <Text style={st.sectionTitleCount}>
              ({subasta.catalogo?.length || 0})
            </Text>
          </Text>

          {subasta.catalogo?.map((item: any, index: number) => {
            const hasPhotos = item.fotos && item.fotos.length > 0;
            const itemImg = hasPhotos
              ? item.fotos[0]
              : COVER_IMAGES[index % COVER_IMAGES.length];
            return (
              <View key={item.id} style={st.itemCard}>
                {/* Product Photo Slider or Single Photo */}
                <View style={st.itemPhotoWrap}>
                  <Image source={{ uri: itemImg }} style={st.itemPhoto} />
                  {/* Status Badge on Photo */}
                  <View
                    style={[
                      st.itemStatusTag,
                      {
                        backgroundColor:
                          item.subastado === "si"
                            ? "rgba(239,68,68,0.9)"
                            : "rgba(16,185,129,0.9)",
                      },
                    ]}
                  >
                    <Text style={st.itemStatusTagText}>
                      {item.subastado === "si" ? "VENDIDO" : "DISPONIBLE"}
                    </Text>
                  </View>
                </View>

                {/* Info Container */}
                <View style={st.itemContent}>
                  <Text style={st.itemDescription} numberOfLines={2}>
                    {item.descripcion}
                  </Text>

                  <View style={st.itemPriceGrid}>
                    {item.precioBase != null && (
                      <View style={st.priceCol}>
                        <Text style={st.priceLabel}>PRECIO BASE</Text>
                        <Text style={st.priceVal}>
                          {subasta.moneda === "USD" ? "USD" : "$"}{" "}
                          {item.precioBase.toLocaleString("es-AR")}
                        </Text>
                      </View>
                    )}

                    <View style={st.priceCol}>
                      <Text style={[st.priceLabel, { color: "#8B6914" }]}>
                        MEJOR OFERTA
                      </Text>
                      <Text style={[st.priceVal, st.priceOfferVal]}>
                        {item.mejorOfertaActual != null
                          ? `${subasta.moneda === "USD" ? "USD" : "$"} ${item.mejorOfertaActual.toLocaleString("es-AR")}`
                          : "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Fixed Sticky Join Live Button at the Bottom ── */}
      {isLive && isAuthenticated && (
        <SafeAreaView style={st.stickyBottomArea} edges={["bottom"]}>
          <Pressable
            onPress={() => router.push("/(tabs)/live")}
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          >
            <View style={st.joinBtn}>
              <MaterialIcons name="live-tv" size={20} color="#FFF" />
              <Text style={st.joinBtnText}>Ingresar a la Sala en Vivo</Text>
              <LiveDot />
            </View>
          </Pressable>
        </SafeAreaView>
      )}

      {!isLive && !isClosed && isAuthenticated && (
        <SafeAreaView style={st.stickyBottomArea} edges={["bottom"]}>
          <View style={st.scheduledBtn}>
            <MaterialIcons name="event" size={20} color="#8B6914" />
            <Text style={st.scheduledBtnText}>
              Disponible el {formatDate(subasta.fecha)} a las {formatTime(subasta.hora)}
            </Text>
          </View>
        </SafeAreaView>
      )}

      {isClosed && isAuthenticated && subasta.tieneDeuda && (
        <SafeAreaView style={st.stickyBottomArea} edges={["bottom"]}>
          <Pressable
            onPress={() => router.push(`/pagos/${subasta.id}` as any)}
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          >
            <View style={st.payBtn}>
              <MaterialIcons name="receipt-long" size={20} color="#FFF" />
              <Text style={st.joinBtnText}>Ver deuda y pagar</Text>
            </View>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */
const SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.12)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
}) as any;

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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
    padding: 24,
  },
  err: {
    fontSize: 16,
    color: "#1A1A2E",
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 20,
  },
  backBtnSimple: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#8B6914",
  },
  backBtnSimpleText: { color: "#FFF", fontWeight: "700" },

  /* ── Header ── */
  headerSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    ...SHADOW_LIGHT,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* ── Scroll Area ── */
  scrollContainer: { paddingBottom: 120 },

  /* ── Hero section ── */
  heroWrap: {
    width: "100%",
    height: 240,
    position: "relative",
  },
  heroImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroInfoOverlay: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
  },
  heroSubTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B8941C",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
  },

  /* ── Details Card ── */
  cardWrapper: {
    paddingHorizontal: 24,
    marginTop: -24,
    zIndex: 5,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    ...SHADOW,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  categText: { fontSize: 11, fontWeight: "700" },

  liveStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    gap: 6,
  },
  liveStatusText: { fontSize: 10, fontWeight: "800", color: "#EF4444" },

  scheduledStatusBadge: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  scheduledStatusText: { fontSize: 10, fontWeight: "800", color: "#B45309" },

  closedStatusBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  closedStatusText: { fontSize: 10, fontWeight: "700", color: "#6B7280" },

  divider: {
    height: 1,
    backgroundColor: "#F3EDE4",
    marginVertical: 16,
  },

  detailsList: { gap: 14 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3E2",
  },
  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "700",
    marginTop: 2,
  },

  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  currencyChip: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  currencyText: { fontSize: 11, fontWeight: "800", color: "#2563EB" },

  /* ── Catalog Section ── */
  catalogSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  sectionTitleCount: {
    fontWeight: "400",
    color: "#8B6914",
  },

  itemCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    ...SHADOW_LIGHT,
  },
  itemPhotoWrap: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  itemPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  itemPhotoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  itemStatusTag: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  itemStatusTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },

  itemContent: {
    padding: 16,
    gap: 12,
  },
  itemDescription: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    lineHeight: 22,
  },

  itemPriceGrid: {
    flexDirection: "row",
    backgroundColor: "#FFF8F0",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FEF3E2",
    justifyContent: "space-between",
  },
  priceCol: { flex: 1 },
  priceLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  priceOfferVal: {
    color: "#059669",
  },

  /* ── Sticky Bottom Button ── */
  stickyBottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 8 : 16,
    backgroundColor: "transparent",
  },
  joinBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    backgroundColor: "#9c7616",
    ...SHADOW,
  },
  joinBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  scheduledBtn: {
    minHeight: 56,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    ...SHADOW,
  },
  scheduledBtnText: {
    flex: 1,
    color: "#92400E",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  payBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    backgroundColor: "#1A1A2E",
    ...SHADOW,
  },
});
