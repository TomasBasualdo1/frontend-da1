import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auctionService } from "../../src/services";
import { Categoria, Moneda, SubastaListado } from "../../src/types";

const SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.12)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
});

const CATEGORIES: Categoria[] = ["comun", "especial", "plata", "oro", "platino"];

const CATEG_COLORS: Record<Categoria, string> = {
  comun: "#6B7280",
  especial: "#2563EB",
  plata: "#94A3B8",
  oro: "#D97706",
  platino: "#7C3AED",
};

export default function AdminAuctionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "catalog">("list");
  const [auctions, setAuctions] = useState<SubastaListado[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create Form States
  const [fecha, setFecha] = useState(() => {
    // Default to 11 days in the future to satisfy CURRENT_DATE + 10 days constraint
    const d = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  });
  const [hora, setHora] = useState("18:00:00");
  const [categoria, setCategoria] = useState<Categoria>("comun");
  const [moneda, setMoneda] = useState<Moneda>("USD");
  const [subastadorId, setSubastadorId] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [capacidad, setCapacidad] = useState("100");
  const [tieneDeposito, setTieneDeposito] = useState(false);
  const [seguridadPropia, setSeguridadPropia] = useState(false);

  // Catalog Form States
  const [subastaIdInput, setSubastaIdInput] = useState("");
  const [articuloIdInput, setArticuloIdInput] = useState("");
  const [precioBaseInput, setPrecioBaseInput] = useState("");
  const [comisionInput, setComisionInput] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await auctionService.getSubastas();
      // Sort by id descending
      setAuctions(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar las subastas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      loadData();
    }
  }, [activeTab]);

  const handleCreateAuction = async () => {
    if (!fecha || !hora) {
      Alert.alert("Error", "Fecha y Hora son obligatorias.");
      return;
    }

    // Verify date is > 10 days from today
    const dateObj = new Date(fecha);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 10);
    if (dateObj <= minDate) {
      Alert.alert("Error", "La fecha de la subasta debe ser posterior a 10 días desde hoy.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        fecha,
        hora,
        categoria,
        moneda,
        tieneDeposito,
        seguridadPropia,
      };

      if (subastadorId.trim()) payload.subastadorId = parseInt(subastadorId);
      if (ubicacion.trim()) payload.ubicacion = ubicacion;
      if (capacidad.trim()) payload.capacidadAsistentes = parseInt(capacidad);

      await auctionService.createSubasta(payload);
      Alert.alert("Éxito", "Subasta creada exitosamente con su catálogo.");
      setActiveTab("list");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear la subasta. Verifique los datos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCatalogItem = async () => {
    const subId = parseInt(subastaIdInput);
    const artId = parseInt(articuloIdInput);
    const pb = parseFloat(precioBaseInput);
    const com = parseFloat(comisionInput);

    if (isNaN(subId) || isNaN(artId) || isNaN(pb) || isNaN(com)) {
      Alert.alert("Error", "Todos los campos son obligatorios y deben ser válidos.");
      return;
    }

    setSubmitting(true);
    try {
      await auctionService.addCatalogItem(subId, {
        articuloId: artId,
        precioBase: pb,
        comision: com,
      });
      Alert.alert("Éxito", "Artículo agregado al catálogo de la subasta.");
      setArticuloIdInput("");
      setPrecioBaseInput("");
      setComisionInput("");
      setActiveTab("list");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "No se pudo agregar el artículo. Verifique los IDs y que el artículo esté tasado y aprobado.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAuction = async (id: number) => {
    Alert.alert(
      "Cerrar Subasta",
      "¿Estás seguro de que querés dar por finalizada esta subasta y proceder al cierre de pujas, ventas y pagos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Cierre",
          onPress: async () => {
            setLoading(true);
            try {
              const res = await auctionService.close(id);
              Alert.alert(
                "Éxito",
                `Subasta cerrada. Se procesaron ${res.itemsCerrados} ítems y se generaron ${res.pagosGenerados} órdenes de pago.`
              );
              loadData();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo cerrar la subasta.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <View style={s.backBtnInner}>
            <MaterialIcons name="arrow-back-ios" size={16} color="#8B6914" />
            <Text style={s.backText}>Volver</Text>
          </View>
        </Pressable>
        <Text style={s.headerTitle}>Gestión de Subastas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabContainer}>
        <Pressable onPress={() => setActiveTab("list")} style={s.tabWrapper}>
          <View style={[s.tab, activeTab === "list" && s.activeTab]}>
            <Text style={[s.tabText, activeTab === "list" && s.activeTabText]}>Ver Subastas</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setActiveTab("create")} style={s.tabWrapper}>
          <View style={[s.tab, activeTab === "create" && s.activeTab]}>
            <Text style={[s.tabText, activeTab === "create" && s.activeTabText]}>Crear Evento</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setActiveTab("catalog")} style={s.tabWrapper}>
          <View style={[s.tab, activeTab === "catalog" && s.activeTab]}>
            <Text style={[s.tabText, activeTab === "catalog" && s.activeTabText]}>Catalogar</Text>
          </View>
        </Pressable>
      </View>

      {/* Tab Contents */}
      {activeTab === "list" && (
        <>
          {loading ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator size="large" color="#8B6914" />
              <Text style={s.loadingText}>Cargando subastas...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={s.listContainer}>
              {auctions.length === 0 ? (
                <View style={s.emptyContainer}>
                  <MaterialIcons name="event-busy" size={48} color="#9CA3AF" />
                  <Text style={s.emptyText}>No hay subastas registradas.</Text>
                </View>
              ) : (
                auctions.map((auc) => (
                  <View key={auc.id} style={s.card}>
                    <View style={s.cardHeader}>
                      <View style={s.aucTitleContainer}>
                        <Text style={s.aucId}>Subasta #{auc.id}</Text>
                        <Text style={s.aucLocation}>{auc.ubicacion || "Virtual / Sin Ubicación"}</Text>
                      </View>
                      <View style={[s.badgeState, auc.estado === "cerrada" && s.badgeStateCerrada]}>
                        <Text style={[s.badgeStateText, auc.estado === "cerrada" && s.badgeStateTextCerrada]}>
                          {auc.estado?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={s.cardBody}>
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Fecha y Hora:</Text>
                        <Text style={s.infoVal}>{auc.fecha} a las {auc.hora?.substring(0, 5)} hs</Text>
                      </View>
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Categoría Requerida:</Text>
                        <View style={[s.badgeCateg, { backgroundColor: CATEG_COLORS[auc.categoria || "comun"] }]}>
                          <Text style={s.badgeCategText}>{auc.categoria?.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    {auc.estado === "abierta" && (
                      <View style={s.cardActions}>
                        <Pressable
                          style={s.actionBtnWrapper}
                          onPress={() => {
                            setSubastaIdInput(auc.id.toString());
                            setActiveTab("catalog");
                          }}
                        >
                          <View style={s.btnSecondary}>
                            <MaterialIcons name="add" size={16} color="#8B6914" />
                            <Text style={s.btnSecondaryText}>Catalogar Item</Text>
                          </View>
                        </Pressable>

                        <Pressable
                          style={s.actionBtnWrapper}
                          onPress={() => handleCloseAuction(auc.id)}
                        >
                          <View style={s.btnPrimary}>
                            <MaterialIcons name="gavel" size={16} color="#FFFFFF" />
                            <Text style={s.btnPrimaryText}>Cerrar Subasta</Text>
                          </View>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {activeTab === "create" && (
        <ScrollView contentContainerStyle={s.formContainer}>
          <Text style={s.formTitle}>Registrar Nueva Subasta</Text>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Fecha de Evento (YYYY-MM-DD) *:</Text>
            <TextInput
              placeholder="Ej. 2026-07-15"
              value={fecha}
              onChangeText={setFecha}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={s.inputHelp}>Debe ser posterior a 10 días a partir de hoy.</Text>
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Hora de Inicio (HH:MM:SS) *:</Text>
            <TextInput
              placeholder="Ej. 18:00:00"
              value={hora}
              onChangeText={setHora}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Categoría Requerida para Participar:</Text>
            <View style={s.pickerRow}>
              {CATEGORIES.map((cat) => (
                <Pressable key={cat} onPress={() => setCategoria(cat)} style={{ flex: 1 }}>
                  <View style={[s.pickerBox, categoria === cat && s.pickerBoxActive]}>
                    <Text style={[s.pickerBoxText, categoria === cat && s.pickerBoxTextActive]}>
                      {cat.substring(0, 3).toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Moneda de Operación:</Text>
            <View style={s.pickerRow}>
              {(["ARS", "USD"] as Moneda[]).map((mon) => (
                <Pressable key={mon} onPress={() => setMoneda(mon)} style={{ flex: 1 }}>
                  <View style={[s.pickerBox, moneda === mon && s.pickerBoxActive]}>
                    <Text style={[s.pickerBoxText, moneda === mon && s.pickerBoxTextActive]}>{mon}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>ID del Subastador (Martillero) - Opcional:</Text>
            <TextInput
              placeholder="Ej. 900002"
              keyboardType="numeric"
              value={subastadorId}
              onChangeText={setSubastadorId}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Ubicación física / Salón - Opcional:</Text>
            <TextInput
              placeholder="Ej. Salón Golden, CABA"
              value={ubicacion}
              onChangeText={setUbicacion}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Capacidad de Asistentes:</Text>
            <TextInput
              placeholder="Ej. 150"
              keyboardType="numeric"
              value={capacidad}
              onChangeText={setCapacidad}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchLabel}>¿Se realiza en un depósito propio?</Text>
            <Switch value={tieneDeposito} onValueChange={setTieneDeposito} trackColor={{ true: "#B8941C" }} />
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchLabel}>¿Cuenta con seguridad corporativa propia?</Text>
            <Switch value={seguridadPropia} onValueChange={setSeguridadPropia} trackColor={{ true: "#B8941C" }} />
          </View>

          <Pressable style={s.submitBtnWrapper} onPress={handleCreateAuction} disabled={submitting}>
            <View style={s.btnSubmit}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.btnSubmitText}>Crear Subasta</Text>
              )}
            </View>
          </Pressable>
        </ScrollView>
      )}

      {activeTab === "catalog" && (
        <ScrollView contentContainerStyle={s.formContainer}>
          <Text style={s.formTitle}>Catalogar Artículo Aprobado</Text>
          <Text style={s.formIntro}>
            Asocie un artículo aprobado por tasación al catálogo de una subasta activa. Esto creará el producto físico y el ítem de catálogo correspondientes.
          </Text>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>ID de la Subasta *:</Text>
            <TextInput
              placeholder="Ej. 1"
              keyboardType="numeric"
              value={subastaIdInput}
              onChangeText={setSubastaIdInput}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>ID del Artículo Aprobado *:</Text>
            <TextInput
              placeholder="Ej. 5"
              keyboardType="numeric"
              value={articuloIdInput}
              onChangeText={setArticuloIdInput}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={s.inputHelp}>El artículo debe estar aprobado y con tasación aceptada.</Text>
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Precio Base Definitivo (USD) *:</Text>
            <TextInput
              placeholder="Ej. 1200"
              keyboardType="numeric"
              value={precioBaseInput}
              onChangeText={setPrecioBaseInput}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Comisión Definitiva (USD) *:</Text>
            <TextInput
              placeholder="Ej. 120"
              keyboardType="numeric"
              value={comisionInput}
              onChangeText={setComisionInput}
              style={s.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable style={s.submitBtnWrapper} onPress={handleCatalogItem} disabled={submitting}>
            <View style={s.btnSubmit}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.btnSubmitText}>Agregar al Catálogo</Text>
              )}
            </View>
          </Pressable>
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#8B6914",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#8B6914",
    fontWeight: "700",
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
  aucTitleContainer: {
    flex: 1,
  },
  aucId: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  aucLocation: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  badgeState: {
    backgroundColor: "#D1FAE5",
    borderColor: "#34D399",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeStateCerrada: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  badgeStateText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  badgeStateTextCerrada: {
    color: "#374151",
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  badgeCateg: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCategText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE3",
  },
  actionBtnWrapper: {
    flex: 1,
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "#E5DDD0",
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B6914",
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1A1A2E",
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  formContainer: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  formIntro: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: "#1A1A2E",
    backgroundColor: "#FFFFFF",
  },
  inputHelp: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  pickerBox: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    backgroundColor: "#FFFFFF",
  },
  pickerBoxActive: {
    borderColor: "#B8941C",
    backgroundColor: "#FDF6EC",
  },
  pickerBoxText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  pickerBoxTextActive: {
    color: "#8B6914",
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: "#1A1A2E",
    flex: 1,
    marginRight: 16,
  },
  submitBtnWrapper: {
    marginTop: 16,
  },
  btnSubmit: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
