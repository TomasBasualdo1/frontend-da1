import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { adminService } from "../../src/services";

const SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.12)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
});

export default function AdminPaymentsScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingPayments();
      setPayments(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar los medios de pago pendientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (id: number, status: "validado" | "rechazado") => {
    setActioningId(id);
    try {
      await adminService.verifyPaymentMethod(id, { estadoVerificacion: status });
      Alert.alert(
        "Éxito",
        `Medio de pago ${status === "validado" ? "aprobado" : "rechazado"} correctamente.`
      );
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo realizar la verificación.");
    } finally {
      setActioningId(null);
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "tarjeta_credito":
        return "Tarjeta de Crédito";
      case "cuenta_bancaria":
        return "Cuenta Bancaria";
      case "cheque_certificado":
        return "Cheque Certificado";
      default:
        return type;
    }
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "tarjeta_credito":
        return "credit-card";
      case "cuenta_bancaria":
        return "account-balance";
      case "cheque_certificado":
        return "payment";
      default:
        return "payment";
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} testID="admin-payments-back-btn">
          <View style={s.backBtnInner}>
            <MaterialIcons name="arrow-back-ios" size={16} color="#8B6914" />
            <Text style={s.backText}>Volver</Text>
          </View>
        </Pressable>
        <Text style={s.headerTitle}>Verificación de Pagos</Text>
        <Pressable onPress={loadData} style={s.refreshBtn} testID="admin-payments-refresh-btn">
          <MaterialIcons name="refresh" size={20} color="#8B6914" />
        </Pressable>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#8B6914" />
          <Text style={s.loadingText}>Buscando credenciales pendientes...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.listContainer}>
          {payments.length === 0 ? (
            <View style={s.emptyContainer}>
              <MaterialIcons name="credit-card-off" size={48} color="#9CA3AF" />
              <Text style={s.emptyText}>No hay medios de pago pendientes de verificar.</Text>
            </View>
          ) : (
            payments.map((p) => (
              <View key={p.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.typeLabelContainer}>
                    <MaterialIcons name={getPaymentIcon(p.tipo)} size={20} color="#8B6914" />
                    <Text style={s.typeLabel}>{getPaymentTypeLabel(p.tipo)}</Text>
                  </View>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>Pendiente</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Usuario solicitante:</Text>
                    <Text style={s.infoVal}>{p.clienteNombre || `ID Cliente: ${p.clienteId}`}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Últimos dígitos / Ref:</Text>
                    <Text style={s.infoVal}>**** {p.ultimos_digitos || p.ultimosDigitos}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Moneda admitida:</Text>
                    <Text style={s.infoVal}>{p.moneda}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Límite de Respaldo:</Text>
                    <Text style={s.infoVal}>${(p.limiteReservado || p.limite_reservado || 0).toLocaleString()}</Text>
                  </View>
                  {p.paisBanco && (
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>País del Banco:</Text>
                      <Text style={s.infoVal}>{p.paisBanco}</Text>
                    </View>
                  )}
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Cuenta Receptora (Cobros):</Text>
                    <Text style={s.infoVal}>{(p.esCuentaReceptora || p.es_cuenta_receptora) ? "Sí" : "No"}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={s.cardActions}>
                  <Pressable
                    style={s.actionBtnWrapper}
                    onPress={() =>
                      Alert.alert(
                        "Rechazar Medio de Pago",
                        "¿Estás seguro de que querés rechazar esta credencial?",
                        [
                          { text: "Cancelar" },
                          { text: "Confirmar", style: "destructive", onPress: () => handleVerify(p.id, "rechazado") },
                        ]
                      )
                    }
                    disabled={actioningId === p.id}
                    testID="admin-payments-rechazar-btn"
                  >
                    <View style={[s.btn, s.btnReject]}>
                      <MaterialIcons name="close" size={16} color="#DC2626" />
                      <Text style={s.btnRejectText}>Rechazar</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={s.actionBtnWrapper}
                    onPress={() =>
                      Alert.alert(
                        "Validar Medio de Pago",
                        "¿Confirmás que las garantías de este medio de pago son válidas?",
                        [
                          { text: "Cancelar" },
                          { text: "Validar", onPress: () => handleVerify(p.id, "validado") },
                        ]
                      )
                    }
                    disabled={actioningId === p.id}
                    testID="admin-payments-validar-btn"
                  >
                    <View style={[s.btn, s.btnApprove]}>
                      {actioningId === p.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          <Text style={s.btnApproveText}>Validar</Text>
                        </>
                      )}
                    </View>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 80,
  },
  backBtnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    color: "#8B6914",
    fontWeight: "600",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  refreshBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  listContainer: {
    padding: 24,
    gap: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 20,
    ...SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE3",
    paddingBottom: 12,
    marginBottom: 12,
  },
  typeLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  badge: {
    backgroundColor: "#FDF6EC",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE3",
  },
  actionBtnWrapper: {
    flex: 1,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnReject: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  btnRejectText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  btnApprove: {
    backgroundColor: "#1A1A2E",
  },
  btnApproveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
