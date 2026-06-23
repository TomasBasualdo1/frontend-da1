import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { authService } from "../../src/services";

export default function RegisterStep2Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment method fields
  const [paymentTipo, setPaymentTipo] = useState<
    "tarjeta_credito" | "cuenta_bancaria" | "cheque_certificado"
  >("tarjeta_credito");
  const [paymentMoneda, setPaymentMoneda] = useState<"ARS" | "USD">("ARS");
  const [paymentDatos, setPaymentDatos] = useState("");
  const [paymentLimite, setPaymentLimite] = useState("");
  const [paymentPais, setPaymentPais] = useState<"AR" | "US" | null>(null);
  const [showPaisPicker, setShowPaisPicker] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!token.trim()) e.token = "Ingresá el código del email";
    if (!password.trim()) e.password = "Requerido";
    else if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (password !== confirmPassword) e.confirm = "No coinciden";

    // Payment validation
    if (!paymentDatos.trim()) {
      e.paymentDatos = "Requerido";
    } else if (paymentTipo === "tarjeta_credito") {
      const cleanCard = paymentDatos.replace(/\D/g, "");
      if (cleanCard.length !== 16) {
        e.paymentDatos = "Debe tener exactamente 16 dígitos";
      }
    }

    if (paymentTipo !== "cheque_certificado" && !paymentPais) {
      e.paymentPais = "Requerido";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.registroPaso2({
        token: token.trim(),
        password,
        paymentTipo,
        paymentDatos: paymentDatos.trim(),
        paymentMoneda,
        paymentLimite: paymentLimite ? parseFloat(paymentLimite) : undefined,
        paymentPais: paymentPais || undefined,
      });
      Alert.alert(
        "¡Registro completo!",
        "Tu cuenta y primer medio de pago han sido registrados. Ya podés iniciar sesión.",
        [
          {
            text: "Ir al Login",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (error: any) {
      const s = error?.response?.status;
      if (s === 400) Alert.alert("Error", "Código inválido o expirado.");
      else if (s === 404)
        Alert.alert("Error", "Registro previo no encontrado.");
      else Alert.alert("Error", "No se pudo conectar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={s.headerRow}>
              <Pressable testID="reg2-back-btn" style={s.back} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
              </Pressable>
              <View style={s.badge}>
                <Text style={s.badgeText}>Paso 2 de 2</Text>
              </View>
            </View>
            <View style={s.icon}>
              <MaterialIcons name="vpn-key" size={36} color="#8B6914" />
            </View>
            <Text style={s.title}>Definir Contraseña</Text>
            <Text style={s.sub}>
              Ingresá el código del email y creá tu contraseña
            </Text>

            <View style={s.form}>
              <View style={s.group}>
                <Text style={s.label}>Código *</Text>
                <TextInput
                  testID="reg2-token-input"
                  style={[s.input, errors.token && s.inputErr]}
                  placeholder="Código de 6 dígitos"
                  placeholderTextColor="#9CA3AF"
                  value={token}
                  onChangeText={setToken}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {errors.token ? (
                  <Text style={s.err}>{errors.token}</Text>
                ) : null}
              </View>
              <View style={s.group}>
                <Text style={s.label}>Contraseña *</Text>
                <View style={[s.inputRow, errors.password && s.inputErr]}>
                  <TextInput
                    testID="reg2-password-input"
                    style={s.inputInner}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPwd}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable testID="reg2-toggle-password-btn" onPress={() => setShowPwd(!showPwd)}>
                    <MaterialIcons
                      name={showPwd ? "visibility-off" : "visibility"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
                {errors.password ? (
                  <Text style={s.err}>{errors.password}</Text>
                ) : null}
              </View>
              <View style={s.group}>
                <Text style={s.label}>Confirmar *</Text>
                <TextInput
                  testID="reg2-confirm-input"
                  style={[s.input, errors.confirm && s.inputErr]}
                  placeholder="Repetí tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPwd}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {errors.confirm ? (
                  <Text style={s.err}>{errors.confirm}</Text>
                ) : null}
              </View>
              <View style={s.bars}>
                {[
                  password.length >= 8,
                  password.length >= 12,
                  /[A-Z]/.test(password) && /[0-9]/.test(password),
                ].map((ok, i) => (
                  <View
                    key={i}
                    style={[
                      s.bar,
                      { backgroundColor: ok ? "#059669" : "#E5DDD0" },
                    ]}
                  />
                ))}
              </View>

              {/* MEDIO DE PAGO FORM */}
              <Text style={s.secTitle}>Medio de Pago Inicial</Text>
              <Text style={s.secSub}>
                Se requiere registrar al menos un medio de pago para completar
                la activación
              </Text>

              <View style={s.group}>
                <Text style={s.label}>Tipo de Medio de Pago *</Text>
                <View style={s.pickerRow}>
                  {(
                    [
                      "tarjeta_credito",
                      "cuenta_bancaria",
                      "cheque_certificado",
                    ] as const
                  ).map((t) => (
                    <Pressable
                      testID={t === "tarjeta_credito" ? "reg2-payment-tarjeta" : t === "cuenta_bancaria" ? "reg2-payment-cuenta" : "reg2-payment-cheque"}
                      key={t}
                      style={[
                        s.pickerOpt,
                        paymentTipo === t && s.pickerOptActive,
                      ]}
                      onPress={() => {
                        setPaymentTipo(t);
                        setPaymentDatos("");
                      }}
                    >
                      <Text
                        style={[
                          s.pickerText,
                          paymentTipo === t && s.pickerTextActive,
                        ]}
                      >
                        {t === "tarjeta_credito"
                          ? "Tarjeta"
                          : t === "cuenta_bancaria"
                            ? "Cuenta"
                            : "Cheque"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={s.group}>
                <Text style={s.label}>Moneda *</Text>
                <View style={s.pickerRow}>
                  {(["ARS", "USD"] as const).map((m) => (
                    <Pressable
                      testID={m === "ARS" ? "reg2-currency-ars" : "reg2-currency-usd"}
                      key={m}
                      style={[
                        s.pickerOpt,
                        paymentMoneda === m && s.pickerOptActive,
                      ]}
                      onPress={() => setPaymentMoneda(m)}
                    >
                      <Text
                        style={[
                          s.pickerText,
                          paymentMoneda === m && s.pickerTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={s.group}>
                <Text style={s.label}>Datos del Medio de Pago *</Text>
                <TextInput
                  testID="reg2-payment-datos-input"
                  style={[s.input, errors.paymentDatos && s.inputErr]}
                  placeholder={
                    paymentTipo === "tarjeta_credito"
                      ? "Número de Tarjeta (16 dígitos)"
                      : paymentTipo === "cuenta_bancaria"
                        ? "CBU / Alias / Nro Cuenta"
                        : "Código/Número del Cheque"
                  }
                  placeholderTextColor="#9CA3AF"
                  value={paymentDatos}
                  onChangeText={(val) => {
                    if (paymentTipo === "tarjeta_credito") {
                      const cleanVal = val.replace(/\D/g, "");
                      if (cleanVal.length <= 16) {
                        setPaymentDatos(cleanVal);
                      }
                    } else {
                      setPaymentDatos(val);
                    }
                  }}
                  maxLength={paymentTipo === "tarjeta_credito" ? 16 : 1000}
                  keyboardType={paymentTipo === "tarjeta_credito" ? "numeric" : "default"}
                />
                {errors.paymentDatos ? (
                  <Text style={s.err}>{errors.paymentDatos}</Text>
                ) : null}
              </View>

              <View style={s.rowFields}>
                <View style={[s.group, { flex: 1 }]}>
                  <Text style={s.label}>Límite / Fondos ($)</Text>
                  <TextInput
                    testID="reg2-payment-limite-input"
                    style={[s.input, errors.paymentLimite && s.inputErr]}
                    placeholder="Ej: 50000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={paymentLimite}
                    onChangeText={setPaymentLimite}
                  />
                  {errors.paymentLimite ? (
                    <Text style={s.err}>{errors.paymentLimite}</Text>
                  ) : null}
                </View>

                {paymentTipo !== "cheque_certificado" && (
                  <View style={[s.group, { flex: 1, position: 'relative', zIndex: 100 }]}>
                    <Text style={s.label}>País del Banco *</Text>
                    <Pressable
                      style={[s.pickerOpt, errors.paymentPais && s.inputErr]}
                      onPress={() => setShowPaisPicker(!showPaisPicker)}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: paymentPais ? "#1A1A2E" : "#9CA3AF" }}>
                          {paymentPais === "AR" ? "Nacional (AR)" : paymentPais === "US" ? "Extranjero (US)" : "Seleccionar"}
                        </Text>
                        <MaterialIcons name={showPaisPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={18} color="#9CA3AF" />
                      </View>
                    </Pressable>
                    {showPaisPicker && (
                      <View style={{
                        position: 'absolute',
                        top: 68,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(60, 60, 60, 0.98)',
                        borderRadius: 12,
                        padding: 6,
                        zIndex: 999,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 5,
                        gap: 2,
                      }}>
                        {(["AR", "US"] as const).map((p) => (
                          <Pressable
                            key={p}
                            style={{
                              height: 38,
                              borderRadius: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 12,
                              backgroundColor: paymentPais === p ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}
                            onPress={() => {
                              setPaymentPais(p);
                              setShowPaisPicker(false);
                            }}
                          >
                            <Text style={{ fontSize: 13, color: '#FFF', fontWeight: '600', flex: 1 }}>
                              {p === "AR" ? "Nacional (AR)" : "Extranjero (US)"}
                            </Text>
                            {paymentPais === p && (
                              <MaterialIcons name="check" size={16} color="#FFF" />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {errors.paymentPais ? (
                      <Text style={s.err}>{errors.paymentPais}</Text>
                    ) : null}
                  </View>
                )}
              </View>

              <Pressable
                testID="reg2-submit-btn"
                style={({ pressed }) => [
                  s.btn,
                  pressed && s.pressed,
                  loading && s.dis,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color="#8B6914"
                    />
                    <Text
                      style={{
                        color: "#8B6914",
                        fontSize: 17,
                        fontWeight: "700",
                      }}
                    >
                      Completar Registro
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  scroll: { paddingHorizontal: 28, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFCF7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EBE3",
  },
  badge: {
    backgroundColor: "rgba(139,105,20,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139,105,20,0.15)",
  },
  badgeText: { fontSize: 13, fontWeight: "600", color: "#8B6914" },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(139,105,20,0.08)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139,105,20,0.12)",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  form: { gap: 18 },
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", marginLeft: 2 },
  input: {
    backgroundColor: "#FFFCF7",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A2E",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF7",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  inputInner: { flex: 1, fontSize: 15, color: "#1A1A2E" },
  inputErr: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  err: { fontSize: 12, color: "#DC2626", marginLeft: 2 },
  bars: { flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  btn: {
    flexDirection: "row",
    backgroundColor: "#8B6914",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    elevation: 4,
  },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  dis: { opacity: 0.7 },

  secTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE3",
    paddingTop: 16,
  },
  secSub: { fontSize: 13, color: "#6B7280", marginBottom: 12 },
  pickerRow: { flexDirection: "row", gap: 8 },
  pickerOpt: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFCF7",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerOptActive: {
    borderColor: "#8B6914",
    backgroundColor: "rgba(139,105,20,0.08)",
  },
  pickerText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  pickerTextActive: { color: "#8B6914" },
  rowFields: { flexDirection: "row", gap: 12 },
});
