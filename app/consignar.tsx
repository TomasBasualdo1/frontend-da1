import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { articleService } from "../src/services";
import { Categoria } from "../src/types";

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: "comun", label: "Común" },
  { value: "especial", label: "Especial" },
  { value: "plata", label: "Plata" },
  { value: "oro", label: "Oro" },
  { value: "platino", label: "Platino" },
];

export default function ConsignarScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "">("");
  const [descripcion, setDescripcion] = useState("");
  const [historia, setHistoria] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [esPropietario, setEsPropietario] = useState(false);
  const [declaraOrigenLicito, setDeclaraOrigenLicito] = useState(false);

  const [showCategPicker, setShowCategPicker] = useState(false);

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
      setFotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!titulo.trim() || !categoria || !descripcion.trim()) {
        Alert.alert(
          "Campos requeridos",
          "Por favor completa el título, categoría y descripción.",
        );
        return;
      }
    } else if (step === 2) {
      if (!historia.trim() || !valorEstimado.trim()) {
        Alert.alert(
          "Campos requeridos",
          "Por favor completa la historia y el valor estimado.",
        );
        return;
      }
      if (!esPropietario || !declaraOrigenLicito) {
        Alert.alert(
          "Declaraciones obligatorias",
          "Debes confirmar que eres el propietario y declarar el origen lícito del artículo.",
        );
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (fotos.length < 6) {
      Alert.alert("Error", "Se requieren al menos 6 fotos.");
      return;
    }

    setLoading(true);
    try {
      await articleService.publicar({
        descripcion: `${titulo} - ${descripcion}`,
        historia,
        artista: "", // Optional, not in mockup
        fechaCreacion: "", // Optional, not in mockup
        fotos,
        esPropietario,
        declaraOrigenLicito,
      });
      // Move to success step
      setStep(4);
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar el artículo.");
    } finally {
      setLoading(false);
    }
  };

  // Render progress bar segments
  const ProgressBar = () => (
    <View style={st.progressContainer}>
      <Text style={st.stepText}>Paso {step} de 4</Text>
      <View style={st.barsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[st.barSegment, step >= i && st.barSegmentActive]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={st.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={st.header}>
          <Pressable
            style={st.backBtn}
            onPress={() => {
              if (step === 1 || step === 4) router.back();
              else handleBack();
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color="#1A1A2E" />
            <Text style={st.headerTitle}>Subastar Artículo</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)/profile")}>
            <Text style={st.misEnviosBtn}>Mis Envíos</Text>
          </Pressable>
        </View>

        {step < 4 && <ProgressBar />}

        <ScrollView contentContainerStyle={st.scroll}>
          {/* STEP 1 */}
          {step === 1 && (
            <View style={st.stepContent}>
              <Text style={st.sectionTitle}>Información Básica</Text>

              <View style={st.group}>
                <Text style={st.label}>Título del Artículo *</Text>
                <TextInput
                  style={st.input}
                  placeholder="Ej: Reloj de Bolsillo Patek Philippe 1895"
                  value={titulo}
                  onChangeText={setTitulo}
                />
              </View>

              <View style={st.group}>
                <Text style={st.label}>Categoría *</Text>
                <Pressable
                  style={st.input}
                  onPress={() => setShowCategPicker(!showCategPicker)}
                >
                  <Text style={{ color: categoria ? "#1A1A2E" : "#9CA3AF" }}>
                    {categoria
                      ? CATEGORIAS.find((c) => c.value === categoria)?.label
                      : "Seleccionar categoría"}
                  </Text>
                  <MaterialIcons
                    name={showCategPicker ? "arrow-drop-up" : "arrow-drop-down"}
                    size={24}
                    color="#6B7280"
                  />
                </Pressable>
                {showCategPicker && (
                  <View style={st.dropdown}>
                    {CATEGORIAS.map((c) => (
                      <Pressable
                        key={c.value}
                        style={st.dropdownItem}
                        onPress={() => {
                          setCategoria(c.value);
                          setShowCategPicker(false);
                        }}
                      >
                        <Text style={st.dropdownText}>{c.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={st.group}>
                <Text style={st.label}>Descripción Detallada *</Text>
                <TextInput
                  style={[st.input, { height: 120, paddingTop: 12 }]}
                  multiline
                  textAlignVertical="top"
                  placeholder="Describe el artículo en detalle: materiales, dimensiones, estado de conservación..."
                  value={descripcion}
                  onChangeText={setDescripcion}
                />
              </View>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={st.stepContent}>
              <Text style={st.sectionTitle}>Historia y Valoración</Text>

              <View style={st.group}>
                <Text style={st.label}>Historia y Procedencia *</Text>
                <TextInput
                  style={[st.input, { height: 120, paddingTop: 12 }]}
                  multiline
                  textAlignVertical="top"
                  placeholder="Describe la historia del objeto: origen, artista/fabricante, contexto histórico, cadena de custodia..."
                  value={historia}
                  onChangeText={setHistoria}
                />
              </View>

              <View style={st.group}>
                <Text style={st.label}>Valor Estimado (USD) *</Text>
                <View style={st.inputWithIcon}>
                  <Text style={st.inputIcon}>$</Text>
                  <TextInput
                    style={st.inputBorderles}
                    placeholder="0"
                    keyboardType="numeric"
                    value={valorEstimado}
                    onChangeText={setValorEstimado}
                  />
                </View>
                <Text style={st.helpText}>
                  Este valor es solo una estimación. Nuestros expertos
                  determinarán el precio base final.
                </Text>
              </View>

              <View style={st.declarationsContainer}>
                <Pressable
                  style={st.checkboxRow}
                  onPress={() => setEsPropietario(!esPropietario)}
                >
                  <View
                    style={[st.checkbox, esPropietario && st.checkboxActive]}
                  >
                    {esPropietario && (
                      <MaterialIcons name="check" size={16} color="#FFF" />
                    )}
                  </View>
                  <Text style={st.checkboxLabel}>
                    Confirmo que soy el propietario legal de este artículo.
                  </Text>
                </Pressable>

                <Pressable
                  style={st.checkboxRow}
                  onPress={() => setDeclaraOrigenLicito(!declaraOrigenLicito)}
                >
                  <View
                    style={[
                      st.checkbox,
                      declaraOrigenLicito && st.checkboxActive,
                    ]}
                  >
                    {declaraOrigenLicito && (
                      <MaterialIcons name="check" size={16} color="#FFF" />
                    )}
                  </View>
                  <Text style={st.checkboxLabel}>
                    Declaro bajo juramento que el artículo tiene un origen
                    lícito.
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <View style={st.stepContent}>
              <Text style={st.sectionTitle}>Imágenes del Artículo</Text>

              <View style={st.alertBanner}>
                <Text style={st.alertText}>
                  Debes cargar al menos 6 imágenes de alta calidad del artículo
                  desde diferentes ángulos.
                </Text>
              </View>

              <Pressable style={st.uploadBox} onPress={pickImage}>
                <MaterialIcons name="upload-file" size={32} color="#1A1A2E" />
                <Text style={st.uploadBoxText}>Cargar</Text>
              </Pressable>

              <Text style={st.photoCountText}>
                {fotos.length} de 10 imágenes cargadas (mínimo 6 requeridas)
              </Text>

              {fotos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={st.photoScroll}
                >
                  {fotos.map((uri, i) => (
                    <View key={i} style={st.photoWrapper}>
                      <Image source={{ uri }} style={st.photo} />
                      <Pressable
                        style={st.removePhoto}
                        onPress={() => removeFoto(i)}
                      >
                        <MaterialIcons name="close" size={14} color="#FFF" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <View style={st.successContainer}>
              <View style={st.successIconWrap}>
                <MaterialIcons
                  name="check-circle-outline"
                  size={48}
                  color="#059669"
                />
                <Text style={st.successText}>Artículo cargado con éxito</Text>
              </View>
              <Pressable
                style={st.btnPrimary}
                onPress={() => router.replace("/(tabs)/profile")}
              >
                <Text style={st.btnPrimaryText}>Volver a Mis Subastas</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions for Steps 1-3 */}
        {step < 4 && (
          <View style={st.footerActions}>
            {step > 1 && (
              <Pressable style={st.btnSecondary} onPress={handleBack}>
                <Text style={st.btnSecondaryText}>Atrás</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                st.btnPrimary,
                step === 1 && { flex: 1 },
                loading && { opacity: 0.7 },
              ]}
              onPress={step === 3 ? handleSubmit : handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={st.btnPrimaryText}>Continuar</Text>
              )}
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE3",
    backgroundColor: "#FFF",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  misEnviosBtn: { fontSize: 13, fontWeight: "600", color: "#6B7280" },

  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#FFF",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  barsRow: { flexDirection: "row", gap: 6 },
  barSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5DDD0",
  },
  barSegmentActive: { backgroundColor: "#1A1A2E" },

  scroll: { paddingHorizontal: 20, paddingVertical: 24, flexGrow: 1 },
  stepContent: { flex: 1 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 24,
  },

  group: { gap: 8, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", marginLeft: 2 },
  input: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A2E",
  },

  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    marginTop: -16,
    marginBottom: 16,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE3",
  },
  dropdownText: { fontSize: 15, color: "#1A1A2E" },

  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 16,
    color: "#1A1A2E",
    fontWeight: "600",
    marginRight: 8,
  },
  inputBorderles: { flex: 1, fontSize: 15, color: "#1A1A2E" },
  helpText: { fontSize: 11, color: "#9CA3AF", marginTop: 4, lineHeight: 16 },

  declarationsContainer: { marginTop: 10, gap: 16 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E5DDD0",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: { backgroundColor: "#1A1A2E", borderColor: "#1A1A2E" },
  checkboxLabel: { flex: 1, fontSize: 14, color: "#4B5563", lineHeight: 20 },

  // Step 3 specific
  alertBanner: {
    backgroundColor: "#FFB800",
    padding: 14,
    borderRadius: 8,
    marginBottom: 24,
  },
  alertText: {
    fontSize: 13,
    color: "#1A1A2E",
    fontWeight: "600",
    lineHeight: 18,
  },
  uploadBox: {
    height: 140,
    borderRadius: 12,
    backgroundColor: "#F5F1EC",
    borderWidth: 2,
    borderColor: "#E5DDD0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadBoxText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  photoCountText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },

  photoScroll: { flexDirection: "row" },
  photoWrapper: { marginRight: 12, position: "relative" },
  photo: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Step 4
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  successIconWrap: { alignItems: "center", gap: 16, marginBottom: 40 },
  successText: { fontSize: 18, fontWeight: "700", color: "#059669" },

  // Footer Actions
  footerActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0EBE3",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#F0EBE3",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnSecondaryText: { color: "#1A1A2E", fontSize: 16, fontWeight: "700" },
  btnPrimary: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPrimaryText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
