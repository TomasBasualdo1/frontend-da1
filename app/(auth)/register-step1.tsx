import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { authService } from "../../src/services";

export default function RegisterStep1Screen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    email: "",
    telefono: "",
    direccion: "",
    numeroPais: "1",
  });
  const [fotoFrente, setFotoFrente] = useState<string | null>(null);
  const [fotoDorso, setFotoDorso] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const pickImage = async (side: "frente" | "dorso") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos", "Se necesita acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 2],
    });
    if (!result.canceled && result.assets[0]) {
      if (side === "frente") setFotoFrente(result.assets[0].uri);
      else setFotoDorso(result.assets[0].uri);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellido.trim()) e.apellido = "Requerido";
    if (!form.documento.trim()) e.documento = "Requerido";
    if (!form.email.trim()) e.email = "Requerido";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    if (!form.direccion.trim()) e.direccion = "Requerido";
    if (!fotoFrente) e.fotoFrente = "Foto del frente requerida";
    if (!fotoDorso) e.fotoDorso = "Foto del dorso requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.registroPaso1({
        ...form,
        numeroPais: parseInt(form.numeroPais, 10),
        fotoFrente: fotoFrente!,
        fotoDorso: fotoDorso!,
      });
      Alert.alert(
        "¡Solicitud enviada!",
        "Te enviamos un email con el código para completar tu registro. Revisá tu bandeja de entrada.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error: any) {
      const status = error?.response?.status;
      console.error("[registro/paso1] status:", status, "| detail:", JSON.stringify(error?.response?.data));
      if (status === 409) {
        Alert.alert("Error", "El documento o email ya se encuentran registrados.");
      } else if (status === 400) {
        Alert.alert("Error", "Datos inválidos. Revisá los campos.");
      } else if (status === 422) {
        Alert.alert("Error", `Datos inválidos (422): ${JSON.stringify(error?.response?.data?.detail)}`);
      } else if (status === 500) {
        Alert.alert("Error", `Error interno del servidor (500). Revisá los logs del backend.`);
      } else {
        Alert.alert("Error", `No se pudo conectar (${status ?? "sin respuesta"}). Revisá que el backend esté corriendo en ${process.env.EXPO_PUBLIC_API_URL}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
              </Pressable>
              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>Paso 1 de 2</Text>
              </View>
            </View>

            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Ingresá tus datos personales y fotos de tu documento
            </Text>

            {/* Datos personales */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos Personales</Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput
                    style={[styles.input, errors.nombre && styles.inputError]}
                    placeholder="Juan"
                    placeholderTextColor="#9CA3AF"
                    value={form.nombre}
                    onChangeText={(v) => updateField("nombre", v)}
                  />
                  {errors.nombre ? <Text style={styles.errorText}>{errors.nombre}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Apellido *</Text>
                  <TextInput
                    style={[styles.input, errors.apellido && styles.inputError]}
                    placeholder="Pérez"
                    placeholderTextColor="#9CA3AF"
                    value={form.apellido}
                    onChangeText={(v) => updateField("apellido", v)}
                  />
                  {errors.apellido ? <Text style={styles.errorText}>{errors.apellido}</Text> : null}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Documento *</Text>
                <TextInput
                  style={[styles.input, errors.documento && styles.inputError]}
                  placeholder="35123456"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={form.documento}
                  onChangeText={(v) => updateField("documento", v)}
                />
                {errors.documento ? <Text style={styles.errorText}>{errors.documento}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="juan@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(v) => updateField("email", v)}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+54 11 5555-5555"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={form.telefono}
                  onChangeText={(v) => updateField("telefono", v)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dirección *</Text>
                <TextInput
                  style={[styles.input, errors.direccion && styles.inputError]}
                  placeholder="Av. Corrientes 1234, CABA"
                  placeholderTextColor="#9CA3AF"
                  value={form.direccion}
                  onChangeText={(v) => updateField("direccion", v)}
                />
                {errors.direccion ? <Text style={styles.errorText}>{errors.direccion}</Text> : null}
              </View>
            </View>

            {/* Fotos del documento */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fotos del Documento</Text>
              <Text style={styles.sectionSubtitle}>
                Subí una foto del frente y dorso de tu DNI
              </Text>

              <View style={styles.photosRow}>
                <Pressable
                  style={[
                    styles.photoCard,
                    errors.fotoFrente && styles.photoCardError,
                  ]}
                  onPress={() => pickImage("frente")}
                >
                  {fotoFrente ? (
                    <Image source={{ uri: fotoFrente }} style={styles.photoImage} />
                  ) : (
                    <>
                      <MaterialIcons name="add-a-photo" size={28} color="#8B6914" />
                      <Text style={styles.photoLabel}>Frente</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[
                    styles.photoCard,
                    errors.fotoDorso && styles.photoCardError,
                  ]}
                  onPress={() => pickImage("dorso")}
                >
                  {fotoDorso ? (
                    <Image source={{ uri: fotoDorso }} style={styles.photoImage} />
                  ) : (
                    <>
                      <MaterialIcons name="add-a-photo" size={28} color="#8B6914" />
                      <Text style={styles.photoLabel}>Dorso</Text>
                    </>
                  )}
                </Pressable>
              </View>
              {(errors.fotoFrente || errors.fotoDorso) && (
                <Text style={styles.errorText}>Ambas fotos son requeridas</Text>
              )}
            </View>

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialIcons name="send" size={20} color="#8B6914" />
                  <Text style={styles.submitButtonText}>Enviar Registro</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
              <Pressable onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.footerLink}>Iniciá sesión</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 28, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
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
  },
  stepBadge: {
    backgroundColor: "rgba(139, 105, 20, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 105, 20, 0.15)",
  },
  stepText: { fontSize: 13, fontWeight: "600", color: "#8B6914" },
  title: { fontSize: 28, fontWeight: "800", color: "#1A1A2E", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#6B7280", marginTop: 6, marginBottom: 28, lineHeight: 22 },
  section: {
    marginBottom: 28,
    backgroundColor: "#FFFCF7",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0EBE3",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#9CA3AF", marginBottom: 16 },
  row: { flexDirection: "row", gap: 12 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", marginBottom: 6, marginLeft: 2 },
  input: {
    backgroundColor: "#FFF8F0",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A2E",
  },
  inputError: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  errorText: { fontSize: 12, color: "#DC2626", marginTop: 4, marginLeft: 2 },
  photosRow: { flexDirection: "row", gap: 16 },
  photoCard: {
    flex: 1,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E5DDD0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
    overflow: "hidden",
  },
  photoCardError: { borderColor: "#DC2626" },
  photoImage: { width: "100%", height: "100%", resizeMode: "cover" },
  photoLabel: { fontSize: 13, color: "#8B6914", fontWeight: "600", marginTop: 6 },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#8B6914",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#8B6914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonText: { color: "#8B6914", fontSize: 17, fontWeight: "700" },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.7 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 15, color: "#6B7280" },
  footerLink: { fontSize: 15, color: "#8B6914", fontWeight: "700" },
});
