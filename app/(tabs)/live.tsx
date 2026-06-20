import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { auctionService } from "../../src/services";
import { SubastaListado, SubastaDetalle, ItemCatalogo, Puja } from "../../src/types";

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
  const [timer, setTimer] = useState("31:59");

  useEffect(() => {
    if (!isAuthenticated) return;
    auctionService.getSubastas()
      .then((d) => setSubastas(d.filter((s) => s.estado === "abierta")))
      .catch(() => {});
  }, [isAuthenticated]);

  const joinSubasta = async (id: number) => {
    try {
      await auctionService.join(id);
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
    if (selectedId) await auctionService.leave(selectedId).catch(() => {});
    setJoined(false);
    setDetalle(null);
    setSelectedId(null);
    setCurrentItem(null);
    setHistorial([]);
  };

  const handlePujar = async (importe: number) => {
    if (!currentItem || !selectedId || importe <= 0) return;
    setSending(true);
    try {
      const res = await auctionService.pujar(selectedId, currentItem.id, { importe }, `${Date.now()}`);
      setCurrentItem((prev) => prev ? {
        ...prev,
        mejorOfertaActual: res.mejorOfertaActual,
        limiteMinimo: res.limiteMinimo,
        limiteMaximo: res.limiteMaximo,
      } : null);
      setCustomBid("");
      // Add to local historial
      setHistorial((prev) => {
        const updatedPrev = res.esGanadoraParcial
          ? prev.map((p) => ({ ...p, esGanadoraParcial: false }))
          : prev;
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
      const errorMsg = typeof detail === "string" ? detail : "No cumplís los requisitos.";
      if (s === 400) Alert.alert("Puja inválida", "El monto está fuera de los límites permitidos.");
      else if (s === 403) Alert.alert("No autorizado", errorMsg);
      else if (s === 409) Alert.alert("Conflicto", "Otra puja en proceso. Reintentá.");
      else Alert.alert("Error", "No se pudo enviar la puja.");
    } finally { setSending(false); }
  };

  const handleQuickBid = (pct: number) => {
    if (!currentItem) return;
    const base = currentItem.precioBase || 0;
    const amount = Math.round((currentItem.mejorOfertaActual || base) + base * pct);
    handlePujar(amount);
  };

  const handleCustomBid = () => {
    const amount = parseFloat(customBid);
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

  return (
    <View style={st.container}>
      <SafeAreaView style={{ flex: 1 }}>
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Streaming placeholder */}
          <View style={st.streamBox}>
            <View style={st.streamPlaceholder}>
              <MaterialIcons name="videocam" size={40} color="#9CA3AF" />
              <Text style={st.streamText}>Streaming de Subasta en Vivo</Text>
              <Text style={st.streamSubtext}>Integración con servicio externo</Text>
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
            <Pressable
              style={({ pressed }) => [st.customBidBtn, pressed && { opacity: 0.9 }]}
              onPress={() => {
                if (customBid) handleCustomBid();
              }}
            >
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
            </Pressable>
          </View>

          {/* Real-time feed */}
          <View style={st.feedSection}>
            <View style={st.feedHeader}>
              <Text style={st.feedTitle}>Pujas en Tiempo Real</Text>
              <View style={st.feedCount}>
                <MaterialIcons name="trending-up" size={14} color="#6B7280" />
                <Text style={st.feedCountText}>{historial.length} pujas</Text>
              </View>
            </View>

            {historial.length === 0 ? (
              <Text style={st.feedEmpty}>Aún no hay pujas para este ítem</Text>
            ) : (
              historial.slice(0, 10).map((puja, i) => (
                <View key={puja.id || i} style={[st.feedItem, i === 0 && st.feedItemTop]}>
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
    paddingHorizontal: 16, height: 52, marginTop: 12,
  },
  customBidInput: { flex: 1, fontSize: 15, color: "#1A1A2E" },
  customBidSend: { padding: 4 },

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
