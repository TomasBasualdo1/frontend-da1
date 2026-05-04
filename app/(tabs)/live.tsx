import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { auctionService } from "../../src/services";
import { SubastaListado, SubastaDetalle, ItemCatalogo, Puja } from "../../src/types";

export default function LiveScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [subastas, setSubastas] = useState<SubastaListado[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<SubastaDetalle | null>(null);
  const [currentItem, setCurrentItem] = useState<ItemCatalogo | null>(null);
  const [pujaInput, setPujaInput] = useState("");
  const [sending, setSending] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    auctionService.getSubastas().then((d) => setSubastas(d.filter((s) => s.estado === "abierta"))).catch(() => {});
  }, [isAuthenticated]);

  const joinSubasta = async (id: number) => {
    try {
      await auctionService.join(id);
      setJoined(true);
      setSelectedId(id);
      const d = await auctionService.getDetalle(id);
      setDetalle(d);
      if (d.catalogo.length > 0) setCurrentItem(d.catalogo.find((i) => i.subastado === "no") || d.catalogo[0]);
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 403) Alert.alert("Acceso denegado", "No cumplís los requisitos para esta subasta.");
      else if (s === 409) Alert.alert("Error", "Ya estás conectado a otra subasta.");
      else Alert.alert("Error", "No se pudo conectar a la subasta.");
    }
  };

  const handlePujar = async () => {
    if (!currentItem || !selectedId) return;
    const importe = parseFloat(pujaInput);
    if (isNaN(importe) || importe <= 0) { Alert.alert("Error", "Ingresá un monto válido."); return; }
    setSending(true);
    try {
      const res = await auctionService.pujar(selectedId, currentItem.id, { importe }, `${Date.now()}`);
      setCurrentItem((prev) => prev ? { ...prev, mejorOfertaActual: res.mejorOfertaActual, limiteMinimo: res.limiteMinimo, limiteMaximo: res.limiteMaximo } : null);
      setPujaInput("");
      if (res.esGanadoraParcial) Alert.alert("¡Puja líder!", "Tu oferta es la más alta por ahora.");
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 400) Alert.alert("Puja inválida", "El monto está fuera de los límites.");
      else if (s === 403) Alert.alert("No autorizado", "No cumplís los requisitos.");
      else if (s === 409) Alert.alert("Conflicto", "Otra puja en proceso. Reintentá.");
      else Alert.alert("Error", "No se pudo enviar la puja.");
    } finally { setSending(false); }
  };

  if (!isAuthenticated) {
    return (
      <View style={st.container}><SafeAreaView style={st.center}>
        <MaterialIcons name="live-tv" size={56} color="#E5DDD0" />
        <Text style={st.emptyTitle}>Subastas en Vivo</Text>
        <Text style={st.emptyText}>Iniciá sesión para participar en subastas en tiempo real</Text>
        <Pressable style={st.loginBtn} onPress={() => router.push("/(auth)/welcome")}><Text style={st.loginBtnText}>Iniciar Sesión</Text></Pressable>
      </SafeAreaView></View>
    );
  }

  if (!joined) {
    return (
      <View style={st.container}><SafeAreaView style={{ flex: 1 }}>
        <View style={st.header}><Text style={st.title}>En Vivo</Text><Text style={st.sub}>Seleccioná una subasta para unirte</Text></View>
        <FlatList data={subastas} keyExtractor={(i) => String(i.id)} contentContainerStyle={st.list}
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [st.liveCard, pressed && { opacity: 0.9 }]} onPress={() => joinSubasta(item.id)}>
              <View style={st.liveDot} /><View style={{ flex: 1 }}>
                <Text style={st.liveTitle}>Subasta #{item.id}</Text>
                <Text style={st.liveInfo}>{item.fecha} · {item.hora} · {item.moneda}</Text>
              </View><MaterialIcons name="play-circle-outline" size={32} color="#8B6914" />
            </Pressable>
          )}
          ListEmptyComponent={<View style={st.center}><MaterialIcons name="event-busy" size={48} color="#E5DDD0" /><Text style={st.emptyText}>No hay subastas en vivo</Text></View>} />
      </SafeAreaView></View>
    );
  }

  return (
    <View style={st.container}><SafeAreaView style={{ flex: 1 }}>
      {/* Header de subasta activa */}
      <View style={st.liveHeader}>
        <View style={st.liveIndicator}><View style={st.livePulse} /><Text style={st.liveLabel}>EN VIVO</Text></View>
        <Pressable onPress={async () => { if (selectedId) await auctionService.leave(selectedId).catch(() => {}); setJoined(false); setDetalle(null); setSelectedId(null); }}>
          <MaterialIcons name="close" size={24} color="#DC2626" />
        </Pressable>
      </View>

      {/* Item actual */}
      {currentItem && (
        <View style={st.itemCard}>
          <Text style={st.itemDesc}>{currentItem.descripcion}</Text>
          <View style={st.priceRow}>
            <View><Text style={st.priceLabel}>Oferta actual</Text><Text style={st.priceValue}>${currentItem.mejorOfertaActual?.toLocaleString() || "—"}</Text></View>
            <View><Text style={st.priceLabel}>Base</Text><Text style={st.priceBase}>${currentItem.precioBase?.toLocaleString() || "—"}</Text></View>
          </View>
          {currentItem.limiteMinimo != null && (
            <View style={st.limitsRow}>
              <Text style={st.limitText}>Mín: ${currentItem.limiteMinimo.toLocaleString()}</Text>
              <Text style={st.limitText}>Máx: ${currentItem.limiteMaximo?.toLocaleString()}</Text>
            </View>
          )}
        </View>
      )}

      {/* Catálogo */}
      <Text style={st.secTitle}>Catálogo</Text>
      <FlatList data={detalle?.catalogo || []} keyExtractor={(i) => String(i.id)} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={[st.miniCard, currentItem?.id === item.id && st.miniCardActive]} onPress={() => setCurrentItem(item)}>
            <Text style={[st.miniText, currentItem?.id === item.id && { color: "#FFF" }]} numberOfLines={2}>{item.descripcion}</Text>
            <Text style={[st.miniPrice, currentItem?.id === item.id && { color: "#FFF" }]}>{item.subastado === "si" ? "Vendido" : `$${item.mejorOfertaActual?.toLocaleString() || "—"}`}</Text>
          </Pressable>
        )} />

      {/* Input de puja */}
      <View style={st.pujaBar}>
        <TextInput style={st.pujaInput} placeholder="Tu oferta..." placeholderTextColor="#9CA3AF" keyboardType="numeric" value={pujaInput} onChangeText={setPujaInput} />
        <Pressable style={({ pressed }) => [st.pujaBtn, pressed && { opacity: 0.85 }, sending && { opacity: 0.6 }]} onPress={handlePujar} disabled={sending}>
          {sending ? <ActivityIndicator color="#FFF" size="small" /> : <MaterialIcons name="gavel" size={24} color="#FFF" />}
        </Pressable>
      </View>
    </SafeAreaView></View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 40 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", color: "#1A1A2E" },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  loginBtn: { backgroundColor: "#8B6914", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  loginBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  liveCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFCF7", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#F0EBE3", gap: 14 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#059669" },
  liveTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  liveInfo: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  liveHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  livePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#DC2626" },
  liveLabel: { fontSize: 14, fontWeight: "800", color: "#DC2626", letterSpacing: 1 },
  itemCard: { marginHorizontal: 24, backgroundColor: "#FFFCF7", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "#F0EBE3", marginBottom: 16 },
  itemDesc: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  priceValue: { fontSize: 26, fontWeight: "800", color: "#059669", marginTop: 2 },
  priceBase: { fontSize: 18, fontWeight: "600", color: "#6B7280", marginTop: 2 },
  limitsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3EDE4" },
  limitText: { fontSize: 12, color: "#8B6914", fontWeight: "600" },
  secTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", paddingHorizontal: 24, marginBottom: 10 },
  miniCard: { width: 140, backgroundColor: "#FFFCF7", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5DDD0" },
  miniCardActive: { backgroundColor: "#8B6914", borderColor: "#8B6914" },
  miniText: { fontSize: 13, color: "#1A1A2E", fontWeight: "600" },
  miniPrice: { fontSize: 12, color: "#059669", fontWeight: "700", marginTop: 6 },
  pujaBar: { flexDirection: "row", paddingHorizontal: 24, paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: "#F0EBE3", backgroundColor: "#FFFCF7" },
  pujaInput: { flex: 1, backgroundColor: "#FFF8F0", borderWidth: 1.5, borderColor: "#E5DDD0", borderRadius: 14, height: 52, paddingHorizontal: 16, fontSize: 16, color: "#1A1A2E" },
  pujaBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#8B6914", justifyContent: "center", alignItems: "center" },
});
