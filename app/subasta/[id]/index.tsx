import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Image, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import { auctionService } from "../../../src/services";
import { SubastaDetalle, SubastaDetallePublica, ItemCatalogo, Categoria } from "../../../src/types";

const CATEG_COLORS: Record<Categoria, string> = { comun: "#6B7280", especial: "#2563EB", plata: "#94A3B8", oro: "#D97706", platino: "#7C3AED" };

export default function SubastaDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [subasta, setSubasta] = useState<SubastaDetalle | SubastaDetallePublica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = isAuthenticated ? await auctionService.getDetalle(Number(id)) : await auctionService.getPublicaDetalle(Number(id));
        setSubasta(data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [id, isAuthenticated]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#8B6914" /></View>;
  if (!subasta) return <View style={s.center}><Text style={s.err}>Subasta no encontrada</Text></View>;

  const color = CATEG_COLORS[subasta.categoria] || "#6B7280";

  return (
    <View style={s.container}><SafeAreaView style={{ flex: 1 }}>
      <View style={s.header}>
        <Pressable style={s.back} onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color="#1A1A2E" /></Pressable>
        <Text style={s.headerTitle}>Subasta #{id}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Info card */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <View style={[s.badge, { backgroundColor: color + "18" }]}><Text style={[s.badgeText, { color }]}>{subasta.categoria.toUpperCase()}</Text></View>
            <Text style={[s.estado, { color: subasta.estado === "abierta" ? "#059669" : "#DC2626" }]}>● {subasta.estado === "abierta" ? "Abierta" : "Cerrada"}</Text>
          </View>
          <View style={s.detailRow}><MaterialIcons name="event" size={18} color="#9CA3AF" /><Text style={s.detailText}>{subasta.fecha} · {subasta.hora}</Text></View>
          <View style={s.detailRow}><MaterialIcons name="place" size={18} color="#9CA3AF" /><Text style={s.detailText}>{subasta.ubicacion || "Sin ubicación"}</Text></View>
          <View style={s.detailRow}><MaterialIcons name="attach-money" size={18} color="#9CA3AF" /><Text style={s.detailMoney}>{subasta.moneda}</Text></View>
        </View>

        {/* Catálogo */}
        <Text style={s.secTitle}>Catálogo ({subasta.catalogo?.length || 0} piezas)</Text>
        {subasta.catalogo?.map((item: any) => (
          <View key={item.id} style={s.itemCard}>
            {item.fotos?.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
                {item.fotos.map((uri: string, i: number) => <Image key={i} source={{ uri }} style={s.photo} />)}
              </ScrollView>
            )}
            <Text style={s.itemDesc}>{item.descripcion}</Text>
            <View style={s.itemPrices}>
              {item.precioBase != null && <View><Text style={s.priceLabel}>Base</Text><Text style={s.priceVal}>${item.precioBase.toLocaleString()}</Text></View>}
              <View><Text style={s.priceLabel}>Mejor oferta</Text><Text style={s.priceOffer}>${item.mejorOfertaActual?.toLocaleString() || "—"}</Text></View>
            </View>
            <View style={[s.itemStatus, { backgroundColor: item.subastado === "si" ? "#FEF2F2" : "#ECFDF5" }]}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: item.subastado === "si" ? "#DC2626" : "#059669" }}>{item.subastado === "si" ? "Vendido" : "Disponible"}</Text>
            </View>
          </View>
        ))}

        {subasta.estado === "abierta" && isAuthenticated && (
          <Pressable style={s.joinBtn} onPress={() => router.push("/(tabs)/live")}>
            <MaterialIcons name="live-tv" size={20} color="#FFF" /><Text style={s.joinText}>Ir a subasta en vivo</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView></View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8F0" },
  err: { fontSize: 16, color: "#DC2626" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFCF7", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  infoCard: { backgroundColor: "#FFFCF7", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "#F0EBE3", marginBottom: 24, gap: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  estado: { fontSize: 13, fontWeight: "600" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { fontSize: 14, color: "#6B7280" },
  detailMoney: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  secTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 14 },
  itemCard: { backgroundColor: "#FFFCF7", borderRadius: 16, borderWidth: 1, borderColor: "#F0EBE3", padding: 16, marginBottom: 14 },
  photoScroll: { marginBottom: 12 },
  photo: { width: 120, height: 90, borderRadius: 10, marginRight: 8, backgroundColor: "#F0EBE3" },
  itemDesc: { fontSize: 16, fontWeight: "600", color: "#1A1A2E", marginBottom: 10 },
  itemPrices: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  priceLabel: { fontSize: 12, color: "#9CA3AF" },
  priceVal: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  priceOffer: { fontSize: 16, fontWeight: "700", color: "#059669" },
  itemStatus: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  joinBtn: { flexDirection: "row", backgroundColor: "#8B6914", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", gap: 10, marginTop: 8, elevation: 4 },
  joinText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});
