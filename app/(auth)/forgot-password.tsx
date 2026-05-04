import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../../src/services";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Ingresá un email válido.");
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (error: any) {
      if (error?.response?.status === 404) Alert.alert("Error", "No existe cuenta con ese email.");
      else Alert.alert("Error", "No se pudo conectar.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={s.container}>
        <SafeAreaView style={s.center}>
          <View style={s.icon}><MaterialIcons name="mark-email-read" size={48} color="#059669" /></View>
          <Text style={s.title}>¡Email enviado!</Text>
          <Text style={s.sub}>Revisá tu casilla de correo para recuperar tu contraseña.</Text>
          <Pressable style={s.btn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.btnText}>Volver al Login</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 28 }}>
        <Pressable style={s.back} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <View style={s.icon}><MaterialIcons name="email" size={36} color="#8B6914" /></View>
        <Text style={s.title}>Recuperar Contraseña</Text>
        <Text style={s.sub}>Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña</Text>
        <View style={s.group}>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} placeholder="tu@email.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>
        <Pressable style={({ pressed }) => [s.btn, pressed && s.pressed, loading && s.dis]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Enviar enlace</Text>}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFCF7", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3", marginTop: 8, marginBottom: 32 },
  icon: { width: 72, height: 72, borderRadius: 22, backgroundColor: "rgba(139,105,20,0.08)", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 20, borderWidth: 1, borderColor: "rgba(139,105,20,0.12)" },
  title: { fontSize: 28, fontWeight: "800", color: "#1A1A2E", textAlign: "center" },
  sub: { fontSize: 15, color: "#6B7280", textAlign: "center", marginTop: 8, marginBottom: 32, lineHeight: 22 },
  group: { gap: 6, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", marginLeft: 2 },
  input: { backgroundColor: "#FFFCF7", borderWidth: 1.5, borderColor: "#E5DDD0", borderRadius: 14, height: 52, paddingHorizontal: 16, fontSize: 15, color: "#1A1A2E" },
  btn: { flexDirection: "row", backgroundColor: "#8B6914", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", gap: 8, elevation: 4 },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  dis: { opacity: 0.7 },
});
