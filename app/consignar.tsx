import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { articleService } from "../src/services";

export default function ConsignarScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    descripcion: "",
    historia: "",
    artista: "",
    fechaCreacion: "",
  });
  const [fotos, setFotos] = useState<string[]>([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos", "Se necesita acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10 - fotos.length,
    });
    
    if (!result.canceled && result.assets) {
      setFotos((prev) => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.descripcion.trim() || fotos.length < 6) {
      Alert.alert("Error", "La descripción y al menos 6 fotos son requeridas.");
      return;
    }

    setLoading(true);
    try {
      await articleService.publicar({
        ...form,
        fotos,
        esPropietario: true,
        declaraOrigenLicito: true,
      });
      Alert.alert("¡Enviado!", "Tu artículo fue enviado para tasación.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar el artículo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <Pressable style={s.back} onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color="#1A1A2E" /></Pressable>
          <Text style={s.headerTitle}>Consignar Artículo</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.desc}>Completá los datos de tu artículo para enviarlo a evaluación por nuestros expertos.</Text>

          <View style={s.form}>
            <View style={s.group}>
              <Text style={s.label}>Descripción *</Text>
              <TextInput style={s.input} placeholder="Ej: Reloj antiguo de oro" value={form.descripcion} onChangeText={t => setForm({...form, descripcion: t})} />
            </View>

            <View style={s.group}>
              <Text style={s.label}>Historia / Detalles</Text>
              <TextInput style={[s.input, { height: 100, paddingTop: 12 }]} multiline textAlignVertical="top" placeholder="Contanos la historia del objeto..." value={form.historia} onChangeText={t => setForm({...form, historia: t})} />
            </View>

            <View style={s.group}>
              <Text style={s.label}>Artista / Fabricante</Text>
              <TextInput style={s.input} placeholder="Opcional" value={form.artista} onChangeText={t => setForm({...form, artista: t})} />
            </View>

            <View style={s.group}>
              <Text style={s.label}>Año de creación</Text>
              <TextInput style={s.input} placeholder="Ej: 1920" value={form.fechaCreacion} onChangeText={t => setForm({...form, fechaCreacion: t})} />
            </View>

            <View style={s.group}>
              <Text style={s.label}>Fotos ({fotos.length}/6 mín) *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
                <Pressable style={s.addPhoto} onPress={pickImage}>
                  <MaterialIcons name="add-a-photo" size={28} color="#8B6914" />
                </Pressable>
                {fotos.map((uri, i) => (
                  <View key={i} style={s.photoWrapper}>
                    <Image source={{ uri }} style={s.photo} />
                    <Pressable style={s.removePhoto} onPress={() => removeFoto(i)}>
                      <MaterialIcons name="close" size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={s.terms}>
              <MaterialIcons name="info" size={20} color="#8B6914" />
              <Text style={s.termsText}>Al enviar, declarás bajo juramento que sos el propietario legítimo del bien y que el mismo tiene un origen lícito.</Text>
            </View>

            <Pressable style={({ pressed }) => [s.btn, pressed && s.pressed, loading && s.dis]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Enviar para evaluación</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFCF7", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 },
  desc: { fontSize: 15, color: "#6B7280", marginBottom: 24, lineHeight: 22 },
  form: { gap: 16 },
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", marginLeft: 2 },
  input: { backgroundColor: "#FFFCF7", borderWidth: 1.5, borderColor: "#E5DDD0", borderRadius: 14, height: 52, paddingHorizontal: 16, fontSize: 15, color: "#1A1A2E" },
  photoScroll: { flexDirection: "row" },
  addPhoto: { width: 100, height: 100, borderRadius: 12, backgroundColor: "rgba(139,105,20,0.08)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(139,105,20,0.2)", borderStyle: "dashed", marginRight: 12 },
  photoWrapper: { marginRight: 12, position: "relative" },
  photo: { width: 100, height: 100, borderRadius: 12 },
  removePhoto: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, width: 20, height: 20, justifyContent: "center", alignItems: "center" },
  terms: { flexDirection: "row", backgroundColor: "#FEF3C7", padding: 14, borderRadius: 12, gap: 10, marginTop: 8 },
  termsText: { flex: 1, fontSize: 12, color: "#D97706", lineHeight: 18 },
  btn: { backgroundColor: "#8B6914", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 12, elevation: 4 },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  dis: { opacity: 0.7 },
});
