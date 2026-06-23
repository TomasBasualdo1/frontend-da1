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
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../../src/services";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!token.trim()) e.token = "Ingresá el código del email";
    if (!password.trim()) e.password = "Requerido";
    else if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (!confirmPassword.trim()) e.confirm = "Requerido";
    else if (password !== confirmPassword) e.confirm = "No coinciden";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.resetPassword({
        token: token.trim(),
        newPassword: password,
      });
      Alert.alert(
        "Contraseña actualizada",
        "Ya podés iniciar sesión con tu nueva contraseña.",
        [{ text: "Ir al Login", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400 || status === 404) {
        Alert.alert("Error", "Código inválido o expirado.");
      } else if (status === 422) {
        Alert.alert("Error", "Revisá el código y la nueva contraseña.");
      } else {
        Alert.alert("Error", "No se pudo conectar.");
      }
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
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
            <Pressable testID="reset-back-btn" style={s.back} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
            </Pressable>

            <View style={s.icon}>
              <MaterialIcons name="vpn-key" size={36} color="#8B6914" />
            </View>
            <Text style={s.title}>Restablecer Contraseña</Text>
            <Text style={s.sub}>
              Ingresá el código del email y creá una nueva contraseña
            </Text>

            <View style={s.form}>
              <View style={s.group}>
                <Text style={s.label}>Código *</Text>
                <TextInput
                  testID="reset-code-input"
                  style={[s.input, errors.token && s.inputErr]}
                  placeholder="Código de 6 dígitos"
                  placeholderTextColor="#9CA3AF"
                  value={token}
                  onChangeText={(value) => {
                    setToken(value);
                    if (errors.token) setErrors((prev) => ({ ...prev, token: "" }));
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {errors.token ? <Text style={s.err}>{errors.token}</Text> : null}
              </View>

              <View style={s.group}>
                <Text style={s.label}>Nueva contraseña *</Text>
                <View style={[s.inputRow, errors.password && s.inputErr]}>
                  <TextInput
                    testID="reset-password-input"
                    style={s.inputInner}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPwd}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                  />
                  <Pressable testID="reset-toggle-password-btn" onPress={() => setShowPwd(!showPwd)}>
                    <MaterialIcons
                      name={showPwd ? "visibility-off" : "visibility"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
                {errors.password ? <Text style={s.err}>{errors.password}</Text> : null}
              </View>

              <View style={s.group}>
                <Text style={s.label}>Confirmar contraseña *</Text>
                <TextInput
                  testID="reset-confirm-input"
                  style={[s.input, errors.confirm && s.inputErr]}
                  placeholder="Repetí tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPwd}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: "" }));
                  }}
                />
                {errors.confirm ? <Text style={s.err}>{errors.confirm}</Text> : null}
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

              <Pressable
                testID="reset-submit-btn"
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
                  <Text style={s.btnText}>Actualizar contraseña</Text>
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
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFCF7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EBE3",
    marginTop: 8,
    marginBottom: 32,
  },
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
    lineHeight: 22,
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
});
