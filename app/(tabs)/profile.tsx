import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { userService } from "../../src/services";
import { MedioPago, UsuarioMetricas, Multa, Notificacion, Categoria } from "../../src/types";

const CATEG_COLORS: Record<Categoria, string> = { comun: "#6B7280", especial: "#2563EB", plata: "#94A3B8", oro: "#D97706", platino: "#7C3AED" };

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [metricas, setMetricas] = useState<UsuarioMetricas | null>(null);
  const [multas, setMultas] = useState<Multa[]>([]);
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [tab, setTab] = useState<"perfil" | "pagos" | "stats" | "notifs">("perfil");

  useEffect(() => {
    if (!isAuthenticated) return;
    userService.getMediosPago().then(setMedios).catch(() => {});
    userService.getMetricas().then(setMetricas).catch(() => {});
    userService.getMultas().then(setMultas).catch(() => {});
    userService.getNotificaciones().then(setNotifs).catch(() => {});
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={s.container}><SafeAreaView style={s.center}>
        <MaterialIcons name="person-outline" size={56} color="#E5DDD0" />
        <Text style={s.emptyTitle}>Mi Perfil</Text>
        <Text style={s.emptyText}>Iniciá sesión para ver tu perfil</Text>
        <Pressable style={s.loginBtn} onPress={() => router.push("/(auth)/welcome")}><Text style={s.loginBtnText}>Iniciar Sesión</Text></Pressable>
      </SafeAreaView></View>
    );
  }

  const categColor = user?.categoria ? CATEG_COLORS[user.categoria] : "#6B7280";

  return (
    <View style={s.container}><SafeAreaView style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Avatar & Info */}
        <View style={s.profileCard}>
          <View style={s.avatar}>{user?.foto ? <Image source={{ uri: user.foto }} style={s.avatarImg} /> : <MaterialIcons name="person" size={40} color="#8B6914" />}</View>
          <Text style={s.name}>{user?.nombre} {user?.apellido}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={s.badges}>
            <View style={[s.categBadge, { backgroundColor: categColor + "18" }]}><Text style={[s.categText, { color: categColor }]}>{user?.categoria?.toUpperCase()}</Text></View>
            <View style={[s.statusBadge, { backgroundColor: user?.estadoRegistro === "aprobado" ? "#ECFDF5" : "#FEF3C7" }]}>
              <Text style={[s.statusText, { color: user?.estadoRegistro === "aprobado" ? "#059669" : "#D97706" }]}>{user?.estadoRegistro === "aprobado" ? "Aprobado" : "Pendiente"}</Text>
            </View>
          </View>
          {user?.multaActiva && <View style={s.multaAlert}><MaterialIcons name="warning" size={16} color="#DC2626" /><Text style={s.multaText}>Multa activa pendiente de pago</Text></View>}
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {(["perfil", "pagos", "stats", "notifs"] as const).map((t) => (
            <Pressable key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === "perfil" ? "Perfil" : t === "pagos" ? "Pagos" : t === "stats" ? "Métricas" : `Notif (${notifs.filter(n => !n.leida).length})`}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {tab === "perfil" && (
          <View style={s.section}>
            <InfoRow icon="badge" label="Documento" value={user?.documento || ""} />
            <InfoRow icon="place" label="Dirección" value={user?.direccion || ""} />
            <InfoRow icon="public" label="País" value={String(user?.numeroPais || "")} />
            <Pressable style={s.editBtn} onPress={() => router.push("/profile" as any)}><MaterialIcons name="edit" size={18} color="#8B6914" /><Text style={s.editBtnText}>Editar perfil</Text></Pressable>
            <Pressable style={s.articlesBtn} onPress={() => router.push("/consignar")}><MaterialIcons name="inventory" size={18} color="#6B7280" /><Text style={s.articlesBtnText}>Consignar nuevo artículo</Text></Pressable>
          </View>
        )}

        {tab === "pagos" && (
          <View style={s.section}>
            <Text style={s.secTitle}>Medios de Pago</Text>
            {medios.length === 0 ? <Text style={s.emptyText}>No tenés medios de pago registrados</Text> :
              medios.map((m) => (
                <View key={m.id} style={s.payCard}>
                  <MaterialIcons name={m.tipo === "tarjeta_credito" ? "credit-card" : m.tipo === "cuenta_bancaria" ? "account-balance" : "description"} size={24} color="#8B6914" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.payType}>{m.tipo === "tarjeta_credito" ? "Tarjeta" : m.tipo === "cuenta_bancaria" ? "Cuenta Bancaria" : "Cheque"} ···{m.ultimos_digitos}</Text>
                    <Text style={s.payInfo}>{m.moneda} · {m.estadoVerificacion}</Text>
                  </View>
                  <View style={[s.verif, { backgroundColor: m.estadoVerificacion === "validado" ? "#ECFDF5" : "#FEF3C7" }]}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: m.estadoVerificacion === "validado" ? "#059669" : "#D97706" }}>{m.estadoVerificacion === "validado" ? "✓" : "⏳"}</Text>
                  </View>
                </View>
              ))}
            {multas.length > 0 && <>
              <Text style={[s.secTitle, { marginTop: 20 }]}>Multas</Text>
              {multas.map((m) => (
                <View key={m.id} style={s.multaCard}><View style={{ flex: 1 }}><Text style={s.multaAmount}>${m.importe.toLocaleString()}</Text><Text style={s.multaMotivo}>{m.motivo}</Text></View>
                <View style={[s.multaEstado, { backgroundColor: m.estado === "pendiente" ? "#FEF2F2" : "#ECFDF5" }]}><Text style={{ fontSize: 12, color: m.estado === "pendiente" ? "#DC2626" : "#059669", fontWeight: "600" }}>{m.estado}</Text></View></View>
              ))}
            </>}
          </View>
        )}

        {tab === "stats" && metricas && (
          <View style={s.section}>
            <Text style={s.secTitle}>Métricas de Participación</Text>
            <View style={s.statsGrid}>
              <StatBox label="Subastas" value={String(metricas.totalSubastasParticipadas)} icon="gavel" />
              <StatBox label="Ganadas" value={String(metricas.totalSubastasGanadas)} icon="emoji-events" />
              <StatBox label="Éxito" value={`${metricas.porcentajeExito.toFixed(1)}%`} icon="trending-up" />
              <StatBox label="Pujas" value={String(metricas.totalPujasRealizadas)} icon="touch-app" />
            </View>
            <View style={s.statDetail}><Text style={s.statLabel}>Total Ofertado</Text><Text style={s.statValue}>${metricas.montoTotalOfertado.toLocaleString()}</Text></View>
            <View style={s.statDetail}><Text style={s.statLabel}>Total Pagado</Text><Text style={s.statValue}>${metricas.montoTotalPagado.toLocaleString()}</Text></View>
          </View>
        )}

        {tab === "notifs" && (
          <View style={s.section}>
            {notifs.length === 0 ? <Text style={s.emptyText}>Sin notificaciones</Text> :
              notifs.map((n) => (
                <Pressable key={n.id} style={[s.notifCard, !n.leida && s.notifUnread]} onPress={() => userService.marcarNotificacionLeida(n.id).then(() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, leida: true } : x)))}>
                  <MaterialIcons name={n.tipo === "pago" ? "payment" : n.tipo === "subasta" ? "gavel" : "info"} size={20} color={!n.leida ? "#8B6914" : "#9CA3AF"} />
                  <View style={{ flex: 1 }}><Text style={s.notifMsg} numberOfLines={2}>{n.mensaje}</Text><Text style={s.notifDate}>{new Date(n.fechaHora).toLocaleString()}</Text></View>
                  {!n.leida && <View style={s.unreadDot} />}
                </Pressable>
              ))}
          </View>
        )}

        {/* Logout */}
        <Pressable style={s.logoutBtn} onPress={() => Alert.alert("Cerrar sesión", "¿Estás seguro?", [{ text: "Cancelar" }, { text: "Salir", style: "destructive", onPress: () => { logout(); router.replace("/(auth)/welcome"); } }])}>
          <MaterialIcons name="logout" size={20} color="#DC2626" /><Text style={s.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView></View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}><MaterialIcons name={icon as any} size={18} color="#9CA3AF" /><View><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View></View>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.statBox}><MaterialIcons name={icon as any} size={22} color="#8B6914" /><Text style={s.statBoxValue}>{value}</Text><Text style={s.statBoxLabel}>{label}</Text></View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 40 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  loginBtn: { backgroundColor: "#8B6914", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  loginBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  profileCard: { backgroundColor: "#FFFCF7", borderRadius: 22, padding: 24, borderWidth: 1, borderColor: "#F0EBE3", alignItems: "center", marginTop: 16 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(139,105,20,0.08)", justifyContent: "center", alignItems: "center", marginBottom: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(139,105,20,0.12)" },
  avatarImg: { width: 80, height: 80, borderRadius: 24 },
  name: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  email: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  badges: { flexDirection: "row", gap: 8, marginTop: 12 },
  categBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categText: { fontSize: 12, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "700" },
  multaAlert: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, backgroundColor: "#FEF2F2", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  multaText: { fontSize: 13, color: "#DC2626", fontWeight: "600" },
  tabs: { flexDirection: "row", marginTop: 20, gap: 6 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: "#FFFCF7", borderWidth: 1, borderColor: "#E5DDD0" },
  tabActive: { backgroundColor: "#8B6914", borderColor: "#8B6914" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#FFF" },
  section: { marginTop: 16, backgroundColor: "#FFFCF7", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#F0EBE3" },
  secTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3EDE4" },
  infoLabel: { fontSize: 12, color: "#9CA3AF" },
  infoValue: { fontSize: 15, color: "#1A1A2E", fontWeight: "600" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, marginTop: 8 },
  editBtnText: { fontSize: 15, color: "#8B6914", fontWeight: "700" },
  articlesBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  articlesBtnText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  payCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3EDE4" },
  payType: { fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  payInfo: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  verif: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  multaCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3EDE4" },
  multaAmount: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
  multaMotivo: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  multaEstado: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statBox: { width: "47%", backgroundColor: "#FFF8F0", borderRadius: 14, padding: 16, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#F0EBE3" },
  statBoxValue: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  statBoxLabel: { fontSize: 12, color: "#9CA3AF" },
  statDetail: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F3EDE4" },
  statLabel: { fontSize: 14, color: "#6B7280" },
  statValue: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  notifCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3EDE4" },
  notifUnread: { backgroundColor: "rgba(139,105,20,0.04)" },
  notifMsg: { fontSize: 14, color: "#1A1A2E" },
  notifDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#8B6914" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, marginTop: 20, backgroundColor: "#FEF2F2", borderRadius: 14 },
  logoutText: { fontSize: 15, color: "#DC2626", fontWeight: "700" },
});
