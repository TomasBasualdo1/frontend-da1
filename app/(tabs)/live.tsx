import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { auctionService } from "../../src/services";
import {
  SubastaListado,
  SubastaDetalle,
  ItemCatalogo,
  Puja,
  StreamEvent,
  PujaStreamData,
  GarantiaInsuficienteErrorDetail,
} from "../../src/types";
import { isAuctionLive } from "../../src/utils/auctionSchedule";

const QUICK_BIDS = [
  { label: "+1%", pct: 0.01 },
  { label: "+5%", pct: 0.05 },
  { label: "+10%", pct: 0.10 },
  { label: "+20%", pct: 0.20 },
];

const CATEG_LABELS: Record<string, string> = {
  comun: "Común",
  especial: "Especial",
  plata: "Plata",
  oro: "Oro",
  platino: "Platino",
};

const CATEG_COLORS: Record<string, string> = {
  comun: "#6B7280",
  especial: "#2563EB",
  plata: "#94A3B8",
  oro: "#D97706",
  platino: "#7C3AED",
};

const CATEG_PESO: Record<string, number> = {
  comun: 1,
  especial: 2,
  plata: 3,
  oro: 4,
  platino: 5,
};

function formatMoney(moneda: string | undefined, value: number): string {
  const prefix = moneda === "USD" ? "USD" : "$";
  return `${prefix} ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isGarantiaInsuficienteDetail(
  detail: unknown,
): detail is GarantiaInsuficienteErrorDetail {
  return (
    typeof detail === "object" &&
    detail !== null &&
    (detail as { codigo?: string }).codigo === "GARANTIA_INSUFICIENTE"
  );
}

function getBidErrorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (isGarantiaInsuficienteDetail(detail)) {
    const moneda = detail.moneda || "USD";
    return [
      detail.mensaje || "La puja supera tu garantia disponible.",
      `Disponible: ${formatMoney(moneda, detail.garantiaDisponible)}.`,
      `Requerido: ${formatMoney(moneda, detail.importeRequerido)}.`,
      `Exposicion actual: ${formatMoney(moneda, detail.exposicionActual)}.`,
    ].join("\n");
  }
  return "No cumplís los requisitos.";
}

export default function LiveScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [subastas, setSubastas] = useState<SubastaListado[]>([]);
  
  const userCategory = (user?.categoria || "comun").toLowerCase();
  const userWeight = CATEG_PESO[userCategory] || 1;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<SubastaDetalle | null>(null);
  const [currentItem, setCurrentItem] = useState<ItemCatalogo | null>(null);
  const [customBid, setCustomBid] = useState("");
  const [sending, setSending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [historial, setHistorial] = useState<Puja[]>([]);
  const [itemEndTime, setItemEndTime] = useState<Date | null>(null);
  const timer = (() => {
    if (!itemEndTime) return "00:00";
    const diff = Math.max(0, Math.floor((itemEndTime.getTime() - Date.now()) / 1000));
    const m = Math.floor(diff / 60).toString().padStart(2, "0");
    const s = (diff % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  })();
  const [streamStatus, setStreamStatus] = useState<"idle" | "connecting" | "connected" | "fallback">("idle");
  const inFlightBidKey = useRef<string | null>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!joined || !detalle?.fecha || !detalle?.hora || !detalle?.duracionItemMinutos) return;
    if (itemEndTime) return;
    const [year, month, day] = detalle.fecha.split("T")[0].split("-").map(Number);
    const [hours = 0, minutes = 0, seconds = 0] = detalle.hora.split(".")[0].split(":").map(Number);
    const auctionStart = new Date(year, month - 1, day, hours, minutes, seconds);
    setItemEndTime(new Date(auctionStart.getTime() + detalle.duracionItemMinutos * 60 * 1000));
  }, [joined, detalle]);

  useEffect(() => {
    if (!itemEndTime) return;
    const interval = setInterval(() => {
      setItemEndTime((prev) => prev ? new Date(prev.getTime()) : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [itemEndTime]);

  useEffect(() => {
    if (!isAuthenticated) return;
    auctionService.getSubastas()
      .then((d) => setSubastas(d.filter((s) => isAuctionLive(s))))
      .catch(() => {});
  }, [isAuthenticated]);

  const applyLivePuja = useCallback((event: StreamEvent) => {
    if (event.type !== "puja") return;
    const data = event.data as Partial<PujaStreamData>;
    if (!data || typeof data.itemId !== "number" || typeof data.pujaId !== "number") return;

    const pujaId = data.pujaId;
    const itemId = data.itemId;

    const importe = Number(data.importe ?? data.mejorOfertaActual ?? 0);
    const mejorOfertaActual = Number(data.mejorOfertaActual ?? importe);
    const limiteMinimo = Number(data.limiteMinimo ?? 0);
    const limiteMaximo = Number(data.limiteMaximo ?? 0);
    if (!importe || !mejorOfertaActual) return;

    setDetalle((prev) => prev ? {
      ...prev,
      catalogo: prev.catalogo.map((item) => item.id === itemId ? {
        ...item,
        mejorOfertaActual,
        limiteMinimo,
        limiteMaximo,
      } : item),
    } : prev);

    setCurrentItem((prev) => prev && prev.id === itemId ? {
      ...prev,
      mejorOfertaActual,
      limiteMinimo,
      limiteMaximo,
    } : prev);

    setHistorial((prev) => {
      const withoutDuplicate = prev.filter((p) => p.id !== pujaId);
      const updatedPrev = data.esGanadoraParcial
        ? withoutDuplicate.map((p) => p.itemId === itemId ? { ...p, esGanadoraParcial: false } : p)
        : withoutDuplicate;

      return [{
        id: pujaId,
        usuarioId: Number(data.usuarioId ?? 0),
        itemId: itemId,
        importe,
        moneda: data.moneda || "USD",
        fechaHora: event.fechaHora,
        esGanadoraParcial: Boolean(data.esGanadoraParcial),
      }, ...updatedPrev];
    });
  }, []);

  const joinSubasta = async (id: number) => {
    try {
      await auctionService.join(id);
      setStreamStatus("connecting");
      setJoined(true);
      setSelectedId(id);
      const d = await auctionService.getDetalle(id);
      setDetalle(d);
      const firstAvailable = d.catalogo.find((i) => i.subastado === "no") || d.catalogo[0];
      setCurrentItem(firstAvailable);
      // Load bid history
      auctionService.getHistorial(id).then(setHistorial).catch(() => {});
    } catch (e: any) {
      const s = e?.response?.status;
      const detail = e?.response?.data?.detail;
      const errorMsg = typeof detail === "string" ? detail : "No cumplís los requisitos para esta subasta.";
      if (s === 403) Alert.alert("Acceso denegado", errorMsg);
      else if (s === 409) Alert.alert("Error", "Ya estás conectado a otra subasta.");
      else Alert.alert("Error", "No se pudo conectar a la subasta.");
    }
  };

  const handleLeave = async () => {
    streamCleanupRef.current?.();
    streamCleanupRef.current = null;
    setStreamStatus("idle");
    if (selectedId) await auctionService.leave(selectedId).catch(() => {});
    setJoined(false);
    setDetalle(null);
    setSelectedId(null);
    setCurrentItem(null);
    setHistorial([]);
    setItemEndTime(null);
  };

  useEffect(() => {
    if (!joined || !selectedId) return;

    setStreamStatus("connecting");
    const stop = auctionService.subscribeToStream(selectedId, {
      onOpen: () => setStreamStatus("connected"),
      onError: () => {
        setStreamStatus("fallback");
        auctionService.getHistorial(selectedId).then(setHistorial).catch(() => {});
      },
      onEvent: (event) => {
        if (event.type === "puja") {
          applyLivePuja(event);
          return;
        }
        if (event.type === "item") {
          const data = event.data as { fechaFinItem?: string };
          if (data?.fechaFinItem) {
            setItemEndTime(new Date(data.fechaFinItem));
          }
          return;
        }
        if (event.type === "cierre") {
          Alert.alert("Subasta finalizada", "La subasta cerró.");
          setJoined(false);
          setDetalle(null);
          setSelectedId(null);
          setCurrentItem(null);
          setHistorial([]);
          setStreamStatus("idle");
        }
      },
    });
    streamCleanupRef.current = stop;

    return () => {
      stop();
      if (streamCleanupRef.current === stop) streamCleanupRef.current = null;
    };
  }, [joined, selectedId, applyLivePuja]);

  useEffect(() => {
    if (!joined || !selectedId || streamStatus !== "fallback") return;

    const refreshLiveSnapshot = () => {
      auctionService.getHistorial(selectedId).then(setHistorial).catch(() => {});
      auctionService.getDetalle(selectedId)
        .then((freshDetail) => {
          setDetalle(freshDetail);
          setCurrentItem((prev) => {
            if (!prev) {
              return freshDetail.catalogo.find((i) => i.subastado === "no") || freshDetail.catalogo[0] || null;
            }
            return freshDetail.catalogo.find((i) => i.id === prev.id) || prev;
          });
        })
        .catch(() => {});
    };

    refreshLiveSnapshot();
    const interval = setInterval(refreshLiveSnapshot, 8000);
    return () => clearInterval(interval);
  }, [joined, selectedId, streamStatus]);

  const handlePujar = async (importe: number) => {
    if (!currentItem || !selectedId || importe <= 0 || sending || inFlightBidKey.current) return;
    const idempotencyKey = [
      "bid",
      selectedId,
      currentItem.id,
      Date.now(),
      Math.random().toString(36).slice(2),
    ].join("-");
    inFlightBidKey.current = idempotencyKey;
    setSending(true);
    try {
      const res = await auctionService.pujar(selectedId, currentItem.id, { importe }, idempotencyKey);
      setCurrentItem((prev) => prev ? {
        ...prev,
        mejorOfertaActual: res.mejorOfertaActual,
        limiteMinimo: res.limiteMinimo,
        limiteMaximo: res.limiteMaximo,
      } : null);
      setCustomBid("");
      // Add to local historial
      setHistorial((prev) => {
        const withoutDuplicate = prev.filter((p) => p.id !== res.pujaId);
        const updatedPrev = res.esGanadoraParcial
          ? withoutDuplicate.map((p) => p.itemId === currentItem.id ? { ...p, esGanadoraParcial: false } : p)
          : withoutDuplicate;
        return [{
          id: res.pujaId, usuarioId: 0, itemId: currentItem.id,
          importe, moneda: res.moneda, fechaHora: new Date().toISOString(),
          esGanadoraParcial: res.esGanadoraParcial,
        }, ...updatedPrev];
      });
      if (res.esGanadoraParcial) Alert.alert("¡Puja líder!", "Tu oferta es la más alta por ahora.");
    } catch (e: any) {
      const s = e?.response?.status;
      const detail = e?.response?.data?.detail;
      const errorMsg = getBidErrorMessage(detail);
      if (s === 400 && isGarantiaInsuficienteDetail(detail)) {
        Alert.alert("Garantía insuficiente", errorMsg);
      } else if (s === 400) Alert.alert("Puja inválida", errorMsg);
      else if (s === 403) Alert.alert("No autorizado", errorMsg);
      else if (s === 409) Alert.alert("Conflicto", "Otra puja en proceso. Reintentá.");
      else Alert.alert("Error", "No se pudo enviar la puja.");
    } finally {
      inFlightBidKey.current = null;
      setSending(false);
    }
  };

  const handleQuickBid = (pct: number) => {
    if (!currentItem) return;
    const base = currentItem.precioBase || 0;
    const amount = Math.round((currentItem.mejorOfertaActual || base) + base * pct);
    handlePujar(amount);
  };

  const handleCustomBid = () => {
    const cleaned = customBid.replace(/,/g, ".");
    const amount = parseFloat(cleaned);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Ingresá un monto válido.");
      return;
    }
    handlePujar(amount);
  };

  // ---- Unauthenticated ----
  if (!isAuthenticated) {
    return (
      <View style={st.container}>
        <SafeAreaView style={st.center}>
          <MaterialIcons name="live-tv" size={56} color="#E5DDD0" />
          <Text style={st.emptyTitle}>Subastas en Vivo</Text>
          <Text style={st.emptyText}>Iniciá sesión para participar en subastas en tiempo real</Text>
          <Pressable style={st.loginBtn} onPress={() => router.push("/(auth)/welcome")}>
            <Text style={st.loginBtnText}>Iniciar Sesión</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // ---- Lobby: pick a live auction ----
  if (!joined) {
    return (
      <View style={st.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={st.lobbyHeader}>
            <Text style={st.lobbyTitle}>En Vivo</Text>
            <Text style={st.lobbySub}>Seleccioná una subasta para unirte</Text>
          </View>
          <FlatList
            data={subastas}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={st.lobbyList}
            renderItem={({ item }) => {
              const subastaCategory = (item.categoria || "comun").toLowerCase();
              const subastaWeight = CATEG_PESO[subastaCategory] || 1;
              const isLocked = userWeight < subastaWeight;

              return (
                <Pressable
                  style={({ pressed }) => [st.lobbyPressable, pressed && { opacity: 0.7 }]}
                  onPress={() => {
                    if (isLocked) {
                      Alert.alert(
                        "Categoría Insuficiente",
                        `Esta subasta requiere nivel ${CATEG_LABELS[subastaCategory] || subastaCategory}.\nTu nivel actual es ${CATEG_LABELS[userCategory] || userCategory}.`
                      );
                    } else {
                      joinSubasta(item.id);
                    }
                  }}
                >
                  <View style={st.lobbyRow}>
                    <View style={[st.lobbyDot, { backgroundColor: isLocked ? "#9CA3AF" : "#059669" }]} />
                    
                    <View style={st.lobbyTextContainer}>
                      <View style={st.lobbyTitleRow}>
                        <Text style={[st.lobbyCardTitle, isLocked && { color: "#6B7280" }]}>
                          Subasta #{item.id}
                        </Text>
                        <View style={[st.categBadge, { backgroundColor: CATEG_COLORS[subastaCategory] + "15" }]}>
                          <Text style={[st.categBadgeText, { color: CATEG_COLORS[subastaCategory] }]}>
                            {CATEG_LABELS[subastaCategory] || item.categoria}
                          </Text>
                        </View>
                      </View>
                      <Text style={st.lobbyCardSub}>{item.fecha} · {item.hora} · {item.moneda}</Text>
                    </View>

                    <View style={st.lobbyIconContainer}>
                      {isLocked ? (
                        <MaterialIcons name="lock-outline" size={24} color="#9CA3AF" />
                      ) : (
                        <MaterialIcons name="play-circle-outline" size={32} color="#1A1A2E" />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={st.center}>
                <MaterialIcons name="event-busy" size={48} color="#E5DDD0" />
                <Text style={st.emptyText}>No hay subastas en vivo actualmente</Text>
              </View>
            }
          />
        </SafeAreaView>
      </View>
    );
  }

  // ---- Active live auction ----
  const basePrice = currentItem?.precioBase || 0;
  const currentOffer = currentItem?.mejorOfertaActual;
  const streamTitle = streamStatus === "connected"
    ? "Actualizaciones en vivo"
    : streamStatus === "fallback"
      ? "Reconectando actualizaciones"
      : "Conectando actualizaciones";
  const streamSubtext = streamStatus === "fallback"
    ? "Respaldo automático de historial activo"
    : streamStatus === "connected"
      ? "Pujas sincronizadas con la sala"
      : "Preparando conexión con la sala";

  return (
    <View style={st.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Live Header */}
          <View style={st.liveHeader}>
          <Pressable onPress={handleLeave}>
            <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
          </Pressable>
          <View style={st.liveIndicator}>
            <View style={st.liveDot} />
            <Text style={st.liveLabel}>EN VIVO</Text>
          </View>
          <View style={st.timerBadge}>
            <MaterialIcons name="timer" size={16} color="#1A1A2E" />
            <Text style={st.timerText}>{timer}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          {/* Streaming placeholder */}
          <View style={st.streamBox}>
            <View style={st.streamPlaceholder}>
              <View style={st.streamStatusPill}>
                <View style={[
                  st.streamStatusDot,
                  streamStatus === "connected" && { backgroundColor: "#10B981" },
                  streamStatus === "fallback" && { backgroundColor: "#F59E0B" },
                ]} />
                <Text style={st.streamStatusText}>
                  {streamStatus === "connected" ? "SSE" : streamStatus === "fallback" ? "Fallback" : "SSE"}
                </Text>
              </View>
              <MaterialIcons
                name={streamStatus === "fallback" ? "sync" : "podcasts"}
                size={40}
                color={streamStatus === "connected" ? "#10B981" : "#9CA3AF"}
              />
              <Text style={st.streamText}>{streamTitle}</Text>
              <Text style={st.streamSubtext}>{streamSubtext}</Text>
            </View>
          </View>

          {/* Item info */}
          {currentItem && (
            <View style={st.itemSection}>
              <View style={st.itemHeaderRow}>
                <Text style={st.itemCode}>ART-{new Date().getFullYear()}-{String(currentItem.id).padStart(3, "0")}</Text>
                <View style={[st.itemCateg, { backgroundColor: "#F0EBE3" }]}>
                  <Text style={st.itemCategText}>{detalle?.categoria ? detalle.categoria.charAt(0).toUpperCase() + detalle.categoria.slice(1) : ""}</Text>
                </View>
              </View>

              <Text style={st.itemTitle}>{currentItem.descripcion}</Text>

              <View style={st.pricesRow}>
                <View>
                  <Text style={st.priceLabel}>Precio Base</Text>
                  <Text style={st.priceBase}>${basePrice.toLocaleString()} {detalle?.moneda}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={st.priceLabel}>Oferta Actual</Text>
                  <Text style={st.priceOffer}>${currentOffer?.toLocaleString() || "—"}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Bid buttons */}
          <View style={st.quickSection}>
            <Text style={st.quickTitle}>Pujo Rápido (1% - 20% del precio base)</Text>
            <View style={st.quickGrid}>
              {QUICK_BIDS.map((qb) => {
                const amount = Math.round((currentOffer || basePrice) + basePrice * qb.pct);
                return (
                  <Pressable
                    key={qb.label}
                    style={({ pressed }) => [st.quickBtn, pressed && st.quickBtnPressed]}
                    onPress={() => handleQuickBid(qb.pct)}
                    disabled={sending}
                  >
                    <Text style={st.quickBtnLabel}>{qb.label}</Text>
                    <Text style={st.quickBtnAmount}>${amount.toLocaleString()}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom bid */}
            <View style={st.customBidBtn}>
              <TextInput
                style={st.customBidInput}
                placeholder="Pujar Monto Personalizado"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={customBid}
                onChangeText={setCustomBid}
                onSubmitEditing={handleCustomBid}
              />
              {sending ? (
                <ActivityIndicator size="small" color="#8B6914" />
              ) : (
                <Pressable onPress={handleCustomBid} style={st.customBidSend}>
                  <MaterialIcons name="send" size={20} color="#8B6914" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Real-time feed */}
          <View style={st.feedSection}>
            <View style={st.feedHeader}>
              <Text style={st.feedTitle}>Pujas en Tiempo Real</Text>
              <View style={st.feedCount}>
                <MaterialIcons name="trending-up" size={14} color="#6B7280" />
                <Text style={st.feedCountText}>
                  {historial.filter((p) => p.itemId === currentItem?.id).length} pujas
                </Text>
              </View>
            </View>

            {historial.filter((p) => p.itemId === currentItem?.id).length === 0 ? (
              <Text style={st.feedEmpty}>Aún no hay pujas para este ítem</Text>
            ) : (
              historial
                .filter((p) => p.itemId === currentItem?.id)
                .slice(0, 10)
                .map((puja, i) => (
                <View key={puja.id ? `puja-${puja.id}-${i}` : `idx-${i}`} style={[st.feedItem, i === 0 && st.feedItemTop]}>
                  <View style={st.feedUser}>
                    <Text style={st.feedUserName}>
                      {(puja.usuarioId === 0 || (user && puja.usuarioId === user.id)) ? "Vos" : `Usuario ${puja.usuarioId}`}
                    </Text>
                    {puja.esGanadoraParcial && (
                      <View style={st.winningBadge}>
                        <Text style={st.winningText}>Ganando</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[st.feedAmount, i === 0 && { color: "#059669", fontWeight: "800" }]}>
                    ${puja.importe.toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  loginBtn: { backgroundColor: "#1A1A2E", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  loginBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  // Lobby
  lobbyHeader: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  lobbyTitle: { fontSize: 24, fontWeight: "800", color: "#1A1A2E" },
  lobbySub: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  lobbyList: { paddingHorizontal: 24, gap: 16 },
  lobbyPressable: {
    paddingVertical: 8,
  },
  lobbyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lobbyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lobbyTextContainer: {
    flex: 1,
    gap: 4,
  },
  lobbyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lobbyCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  categBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  lobbyCardSub: {
    fontSize: 13,
    color: "#6B7280",
  },
  lobbyIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },

  // Live header
  liveHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#DC2626" },
  liveLabel: { fontSize: 14, fontWeight: "800", color: "#1A1A2E", letterSpacing: 1 },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0EBE3", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  timerText: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },

  // Stream
  streamBox: { marginHorizontal: 20, marginBottom: 20 },
  streamPlaceholder: { height: 180, backgroundColor: "#1A1A2E", borderRadius: 16, justifyContent: "center", alignItems: "center", gap: 6 },
  streamStatusPill: { position: "absolute", top: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  streamStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#9CA3AF" },
  streamStatusText: { fontSize: 11, color: "#E5E7EB", fontWeight: "700" },
  streamText: { fontSize: 15, fontWeight: "600", color: "#9CA3AF" },
  streamSubtext: { fontSize: 12, color: "#6B7280" },

  // Item
  itemSection: { paddingHorizontal: 20, marginBottom: 20 },
  itemHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  itemCode: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  itemCateg: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  itemCategText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  itemTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginBottom: 14 },
  pricesRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  priceBase: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 2 },
  priceOffer: { fontSize: 22, fontWeight: "800", color: "#059669", marginTop: 2 },

  // Quick bids
  quickSection: { paddingHorizontal: 20, marginBottom: 20 },
  quickTitle: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 12 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    width: "48%", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5DDD0",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  quickBtnPressed: { backgroundColor: "#F5F1EC", transform: [{ scale: 0.97 }] },
  quickBtnLabel: { fontSize: 13, fontWeight: "700", color: "#8B6914" },
  quickBtnAmount: { fontSize: 16, fontWeight: "800", color: "#1A1A2E", marginTop: 2 },

  customBidBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFF",
    borderWidth: 1, borderColor: "#E5DDD0", borderRadius: 14,
    paddingLeft: 16, paddingRight: 4, height: 52, marginTop: 12,
  },
  customBidInput: { flex: 1, height: "100%", fontSize: 15, color: "#1A1A2E" },
  customBidSend: { padding: 12, justifyContent: "center", alignItems: "center" },

  // Feed
  feedSection: { paddingHorizontal: 20 },
  feedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  feedTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  feedCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  feedCountText: { fontSize: 13, color: "#6B7280" },
  feedEmpty: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingVertical: 20 },
  feedItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0EBE3", marginBottom: 8 },
  feedItemTop: { backgroundColor: "#F0FDF4", marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 10 },
  feedUser: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedUserName: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  winningBadge: { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  winningText: { fontSize: 10, fontWeight: "700", color: "#059669" },
  feedAmount: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
});
