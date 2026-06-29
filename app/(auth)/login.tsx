import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import type { AxiosError } from "axios";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";

type LoginFormErrors = { documento?: string; password?: string };
type BackendErrorData = { detail?: string | unknown[] };

const getLoginErrorMessage = (error: unknown) => {
  const axiosError =
    typeof error === "object" && error !== null
      ? (error as AxiosError<BackendErrorData>)
      : undefined;
  const status = axiosError?.response?.status;

  if (status === 401) {
    return "Documento o contraseña incorrectos.";
  }

  if (status === 403) {
    return "Tu cuenta no está disponible para iniciar sesión.";
  }

  if (status === 400 || status === 422) {
    return "No pudimos iniciar sesión. Verificá tus datos e intentá nuevamente.";
  }

  if (!axiosError?.response) {
    return "No pudimos conectar con el servidor. Intentá nuevamente en unos minutos.";
  }

  return "No pudimos iniciar sesión. Verificá tus datos e intentá nuevamente.";
};

export default function LoginScreen() {
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const validate = () => {
    const newErrors: LoginFormErrors = {};
    if (!documento.trim()) newErrors.documento = "Ingrese su documento";
    if (!password.trim()) newErrors.password = "Ingrese su contraseña";
    else if (password.length < 8) newErrors.password = "Mínimo 8 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setFormError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ documento: documento.trim(), password });
      router.replace("/(tabs)");
    } catch (error: unknown) {
      setFormError(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Header */}
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
            </Pressable>

            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="lock-open" size={32} color="#8B6914" />
              </View>
              <Text style={styles.title}>Bienvenido</Text>
              <Text style={styles.subtitle}>
                Ingresá con tu documento y contraseña
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Documento</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.documento && styles.inputError,
                  ]}
                >
                  <MaterialIcons
                    name="badge"
                    size={20}
                    color={errors.documento ? "#DC2626" : "#9CA3AF"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 35123456"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={documento}
                    onChangeText={(t) => {
                      setDocumento(t);
                      if (formError) setFormError("");
                      if (errors.documento) setErrors((e) => ({ ...e, documento: undefined }));
                    }}
                    autoCapitalize="none"
                  />
                </View>
                {errors.documento && (
                  <Text style={styles.errorText}>{errors.documento}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputError,
                  ]}
                >
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color={errors.password ? "#DC2626" : "#9CA3AF"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Tu contraseña"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (formError) setFormError("");
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <Pressable
                style={styles.forgotLink}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
              </Pressable>

              {formError ? (
                <View style={styles.formErrorContainer}>
                  <MaterialIcons name="error-outline" size={18} color="#DC2626" />
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1A1A2E" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialIcons name="arrow-forward" size={20} color="#1A1A2E" />
                    <Text style={styles.loginButtonText}>Ingresar</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tenés cuenta? </Text>
              <Pressable onPress={() => router.push("/(auth)/register-step1")}>
                <Text style={styles.footerLink}>Registrate</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Recibiste un código? </Text>
              <Pressable onPress={() => router.push("/(auth)/register-step2")}>
                <Text style={styles.footerLink}>Completar registro</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFCF7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EBE3",
    marginTop: 8,
  },
  header: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(139, 105, 20, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 105, 20, 0.12)",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF7",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A2E",
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginLeft: 4,
    marginTop: 2,
  },
  formErrorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formErrorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#B91C1C",
    fontWeight: "600",
  },
  forgotLink: {
    alignSelf: "flex-end",
  },
  forgotLinkText: {
    fontSize: 14,
    color: "#8B6914",
    fontWeight: "600",
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: "#8B6914",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#8B6914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: {
    color: "#1A1A2E",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: "#6B7280",
  },
  footerLink: {
    fontSize: 15,
    color: "#8B6914",
    fontWeight: "700",
  },
});
