import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auctionService, userService } from "../../src/services";
import { MedioPago, Pago } from "../../src/types";

const COSTO_ENVIO_SUBASTA = 500;

type ModoEntrega = "envio" | "retiro";

function getErrorMessage(error: any): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return "No se pudo completar la operacion.";
}

function formatMoney(moneda: string | undefined, value: number): string {
  const prefix = moneda === "USD" ? "USD" : "$";
  return `${prefix} ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDeadline(value?: string): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function medioLabel(medio: MedioPago): string {
  const type =
    medio.tipo === "tarjeta_credito"
      ? "Tarjeta"
      : medio.tipo === "cuenta_bancaria"
        ? "Cuenta"
        : medio.tipo === "cheque_certificado"
          ? "Cheque certificado"
          : "Medio de pago";
  return medio.ultimos_digitos ? `${type} ...${medio.ultimos_digitos}` : type;
}

export default function PagoSubastaScreen() {
  const router = useRouter();
  const { subastaId } = useLocalSearchParams<{ subastaId: string }>();
  const parsedSubastaId = Number(subastaId);
  const [pago, setPago] = useState<Pago | null>(null);
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [selectedMedioId, setSelectedMedioId] = useState<number | null>(null);
  const [modoEntrega, setModoEntrega] = useState<ModoEntrega>("envio");
  const [direccionEnvio, setDireccionEnvio] = useState("");
  const [aceptaPerderSeguro, setAceptaPerderSeguro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costoEnvio = modoEntrega === "envio" ? COSTO_ENVIO_SUBASTA : 0;
  const subtotal = (pago?.totalPujado || 0) + (pago?.comision || 0);
  const totalFinal = subtotal + costoEnvio;

  const loadData = async () => {
    if (!Number.isFinite(parsedSubastaId)) {
      setError("Subasta invalida.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [pagoData, mediosData] = await Promise.all([
        auctionService.getPago(parsedSubastaId),
        userService.getMediosPago(),
      ]);
      setPago(pagoData);
      setMedios(mediosData);
    } catch (err) {
      setPago(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subastaId]);

  const mediosEvaluados = useMemo(
    () =>
      medios.map((medio) => {
        const motivos: string[] = [];
        const limite = Number(medio.limiteReservado || 0);
        if (medio.id == null) motivos.push("Sin identificador");
        if (medio.estadoVerificacion !== "validado") motivos.push("No validado");
        if (pago?.moneda && medio.moneda !== pago.moneda) {
          motivos.push(`Moneda ${medio.moneda || "-"}`);
        }
        if (limite > 0 && limite < totalFinal) motivos.push("Fondos insuficientes");
        return { medio, motivos };
      }),
    [medios, pago?.moneda, totalFinal],
  );

  useEffect(() => {
    const seleccionado = mediosEvaluados.find(
      (item) => item.medio.id === selectedMedioId,
    );
    if (seleccionado && seleccionado.motivos.length === 0) return;

    const primeroValido = mediosEvaluados.find((item) => item.motivos.length === 0);
    setSelectedMedioId(primeroValido?.medio.id ?? null);
  }, [mediosEvaluados, selectedMedioId]);

  const selectedMedio = mediosEvaluados.find(
    (item) => item.medio.id === selectedMedioId,
  );
  const envioSinDireccion =
    modoEntrega === "envio" && direccionEnvio.trim().length === 0;
  const retiroSinConfirmar = modoEntrega === "retiro" && !aceptaPerderSeguro;
  const canSubmit =
    !!pago &&
    pago.estado === "pendiente" &&
    !!selectedMedio &&
    selectedMedio.motivos.length === 0 &&
    !envioSinDireccion &&
    !retiroSinConfirmar &&
    !submitting;

  const handleSubmit = async () => {
    if (!pago || selectedMedioId == null) return;
    if (envioSinDireccion) {
      Alert.alert("Direccion requerida", "Ingresa una direccion de envio.");
      return;
    }
    if (retiroSinConfirmar) {
      Alert.alert("Confirmacion requerida", "Acepta la perdida de seguro.");
      return;
    }

    setSubmitting(true);
    try {
      await auctionService.confirmarPago(parsedSubastaId, {
        medioPagoId: selectedMedioId,
        modoEntrega,
        direccionEnvio:
          modoEntrega === "envio" ? direccionEnvio.trim() : undefined,
        aceptaPerderSeguro: modoEntrega === "retiro" ? true : false,
      });
      Alert.alert("Pago confirmado", "La deuda de subasta quedo pagada.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color="#8B6914" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.iconButton}>
            <MaterialIcons name="arrow-back" size={22} color="#1A1A2E" />
          </Pressable>
          <Text style={s.headerTitle}>Pago de Subasta #{subastaId}</Text>
          <View style={s.iconButtonSpacer} />
        </View>

        {error || !pago ? (
          <View style={s.center}>
            <MaterialIcons name="receipt-long" size={48} color="#C4B898" />
            <Text style={s.emptyTitle}>Sin deuda pendiente</Text>
            <Text style={s.emptyText}>{error || "No hay pagos para esta subasta."}</Text>
            <Pressable onPress={loadData} style={s.secondaryButton}>
              <MaterialIcons name="refresh" size={18} color="#1A1A2E" />
              <Text style={s.secondaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.content}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={s.summaryCard}>
              <View style={s.summaryHeader}>
                <View style={s.summaryIcon}>
                  <MaterialIcons name="receipt-long" size={22} color="#8B6914" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Resumen</Text>
                  <Text style={s.cardMeta}>
                    Vence {formatDeadline(pago.fechaLimitePago)}
                  </Text>
                </View>
                <View style={s.statusBadge}>
                  <Text style={s.statusText}>{pago.estado}</Text>
                </View>
              </View>

              <AmountRow
                label="Total pujado"
                value={formatMoney(pago.moneda, pago.totalPujado)}
              />
              <AmountRow
                label="Comision"
                value={formatMoney(pago.moneda, pago.comision)}
              />
              <AmountRow
                label="Envio"
                value={formatMoney(pago.moneda, costoEnvio)}
              />
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total final</Text>
                <Text style={s.totalValue}>{formatMoney(pago.moneda, totalFinal)}</Text>
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Medio de pago</Text>
              <View style={s.methodList}>
                {mediosEvaluados.length === 0 ? (
                  <View style={s.emptyInline}>
                    <MaterialIcons name="payment" size={26} color="#C4B898" />
                    <Text style={s.emptyText}>No tenes medios registrados.</Text>
                  </View>
                ) : (
                  mediosEvaluados.map(({ medio, motivos }) => {
                    const disabled = motivos.length > 0;
                    const selected = medio.id === selectedMedioId;
                    return (
                      <Pressable
                        key={medio.id ?? `${medio.tipo}-${medio.ultimos_digitos}`}
                        disabled={disabled || medio.id == null}
                        onPress={() => setSelectedMedioId(medio.id ?? null)}
                        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                      >
                        <View
                          style={[
                            s.methodCard,
                            selected && s.methodSelected,
                            disabled && s.methodDisabled,
                          ]}
                        >
                          <MaterialIcons
                            name={
                              selected
                                ? "radio-button-checked"
                                : "radio-button-unchecked"
                            }
                            size={20}
                            color={selected ? "#8B6914" : "#9CA3AF"}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={s.methodTitle}>{medioLabel(medio)}</Text>
                            <Text style={s.methodMeta}>
                              {medio.moneda || "-"} - Limite{" "}
                              {formatMoney(medio.moneda, Number(medio.limiteReservado || 0))}
                            </Text>
                          </View>
                          <Text
                            style={[
                              s.methodStatus,
                              disabled ? s.methodStatusError : s.methodStatusOk,
                            ]}
                          >
                            {disabled ? motivos.join(" - ") : "Compatible"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Entrega</Text>
              <View style={s.deliveryRow}>
                <DeliveryButton
                  active={modoEntrega === "envio"}
                  icon="local-shipping"
                  label="Envio"
                  onPress={() => setModoEntrega("envio")}
                />
                <DeliveryButton
                  active={modoEntrega === "retiro"}
                  icon="storefront"
                  label="Retiro"
                  onPress={() => setModoEntrega("retiro")}
                />
              </View>

              {modoEntrega === "envio" ? (
                <View style={s.inputBlock}>
                  <Text style={s.inputLabel}>Direccion de envio</Text>
                  <TextInput
                    value={direccionEnvio}
                    onChangeText={setDireccionEnvio}
                    placeholder="Calle, numero, ciudad"
                    placeholderTextColor="#9CA3AF"
                    style={s.input}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => setAceptaPerderSeguro((value) => !value)}
                  style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                >
                  <View style={s.insuranceWarning}>
                    <MaterialIcons
                      name={
                        aceptaPerderSeguro
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={22}
                      color={aceptaPerderSeguro ? "#8B6914" : "#B45309"}
                    />
                    <Text style={s.insuranceText}>
                      Confirmo que retiro personalmente y pierdo la cobertura del seguro.
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            <Pressable
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [pressed && canSubmit && { opacity: 0.9 }]}
            >
              <View style={[s.primaryButton, !canSubmit && s.primaryDisabled]}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name="lock" size={18} color="#FFF" />
                    <Text style={s.primaryButtonText}>Confirmar pago</Text>
                  </>
                )}
              </View>
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.amountRow}>
      <Text style={s.amountLabel}>{label}</Text>
      <Text style={s.amountValue}>{value}</Text>
    </View>
  );
}

function DeliveryButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
      <View style={[s.deliveryButton, active && s.deliveryButtonActive]}>
        <MaterialIcons
          name={icon as any}
          size={20}
          color={active ? "#FFF" : "#8B6914"}
        />
        <Text style={[s.deliveryText, active && s.deliveryTextActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(26,26,46,0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
}) as any;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8F0" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    ...SHADOW,
  },
  iconButtonSpacer: { width: 42, height: 42 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 18,
    gap: 10,
    ...SHADOW,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#FEF3E2",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A2E" },
  cardMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
    textTransform: "uppercase",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EDE4",
  },
  amountLabel: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  amountValue: { fontSize: 14, color: "#1A1A2E", fontWeight: "800" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  totalLabel: { fontSize: 15, color: "#1A1A2E", fontWeight: "800" },
  totalValue: { fontSize: 20, color: "#8B6914", fontWeight: "900" },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 16,
    gap: 12,
    ...SHADOW,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A2E" },
  methodList: { gap: 10 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFF",
  },
  methodSelected: { borderColor: "#8B6914", backgroundColor: "#FFF8F0" },
  methodDisabled: { opacity: 0.58 },
  methodTitle: { fontSize: 14, fontWeight: "800", color: "#1A1A2E" },
  methodMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  methodStatus: {
    maxWidth: 120,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
  },
  methodStatusOk: { color: "#047857" },
  methodStatusError: { color: "#B45309" },
  deliveryRow: { flexDirection: "row", gap: 10 },
  deliveryButton: {
    minWidth: 116,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF8F0",
  },
  deliveryButtonActive: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },
  deliveryText: { fontSize: 14, fontWeight: "800", color: "#8B6914" },
  deliveryTextActive: { color: "#FFF" },
  inputBlock: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF8F0",
    color: "#1A1A2E",
    fontSize: 14,
    fontWeight: "600",
  },
  insuranceWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 12,
  },
  insuranceText: {
    flex: 1,
    color: "#92400E",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  primaryButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: "#8B6914",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...SHADOW,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryButtonText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF",
  },
  secondaryButtonText: { color: "#1A1A2E", fontSize: 14, fontWeight: "800" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyInline: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 18,
  },
});
