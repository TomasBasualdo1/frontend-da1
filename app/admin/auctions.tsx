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

  Platform,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auctionService, adminService } from "../../src/services";
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

const CATEG_LABELS: Record<Categoria, string> = {
  comun: "COM",
  especial: "ESP",
  plata: "PLA",
  oro: "ORO",
  platino: "PLO",
};

interface DropdownItem {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  label: string;
  selectedValue: string | number;
  selectedLabel: string;
  items: DropdownItem[];
  onSelect: (value: any) => void;
  placeholder?: string;
}

function CustomDropdown({
  label,
  selectedValue,
  selectedLabel,
  items,
  onSelect,
  placeholder = "Seleccionar...",
}: CustomDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={s.dropdownContainer}>
      <Text style={s.formLabel}>{label}</Text>
      <Pressable onPress={() => setModalVisible(true)}>
        <View style={s.dropdownSelectBox}>
          <Text style={[s.dropdownText, !selectedValue && s.dropdownPlaceholderText]}>
            {selectedLabel || placeholder}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#8B6914" />
        </View>
      </Pressable>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalHeaderTitle}>{label}</Text>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery("");
                }}
              >
                <MaterialIcons name="close" size={20} color="#8B6914" />
              </Pressable>
            </View>

            {items.length > 5 && (
              <TextInput
                placeholder="Buscar..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={s.searchInput}
                placeholderTextColor="#9CA3AF"
              />
            )}

            <ScrollView 
              style={{ marginTop: 4 }} 
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {filteredItems.length === 0 ? (
                <Text style={s.emptyDropdownText}>No se encontraron resultados.</Text>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = item.value === selectedValue;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => {
                        onSelect(item.value);
                        setModalVisible(false);
                        setSearchQuery("");
                      }}
                    >
                      <View style={[s.dropdownOption, isSelected && s.dropdownOptionActive]}>
                        <Text style={[s.dropdownOptionText, isSelected && s.dropdownOptionTextActive]}>
                          {item.label}
                        </Text>
                        {isSelected && <MaterialIcons name="check" size={16} color="#8B6914" />}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function AdminAuctionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "catalog">("list");
  const [auctions, setAuctions] = useState<SubastaListado[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Dropdown Options State
  const [subastadores, setSubastadores] = useState<any[]>([]);
  const [approvedArticles, setApprovedArticles] = useState<any[]>([]);

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

  const loadInitialOptions = async () => {
    try {
      const subList = await adminService.getSubastadores();
      setSubastadores(subList);
      const artList = await adminService.getApprovedNonCatalogedArticles();
      setApprovedArticles(artList);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
    }
  };

  useEffect(() => {
    loadInitialOptions();
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "list") {
      loadData();
    } else if (activeTab === "catalog" || activeTab === "create") {
      loadInitialOptions();
    }
  }, [activeTab]);

  const handleSelectArticle = (artId: number) => {
    setArticuloIdInput(artId.toString());
    const selectedArt = approvedArticles.find((a) => a.id === artId);
    if (selectedArt) {
      if (selectedArt.precioBasePropuesto) {
        setPrecioBaseInput(selectedArt.precioBasePropuesto.toString());
      }
      if (selectedArt.comisionPropuesta) {
        setComisionInput(selectedArt.comisionPropuesta.toString());
      }
    }
  };

  // Dropdown Label/Item Selectors
  const subastadoresDropdownItems = subastadores.map((s) => ({
    value: s.id,
    label: `${s.nombre} (Matrícula: ${s.matricula || "N/A"}, Región: ${s.region || "N/A"})`,
  }));

  const subastasDropdownItems = auctions
    .filter((a) => a.estado !== "cerrada")
    .map((a) => ({
      value: a.id,
      label: `Subasta #${a.id} - ${a.fecha} (${a.ubicacion || "Virtual"})`,
    }));

  const articlesDropdownItems = approvedArticles.map((a) => ({
    value: a.id,
    label: `Artículo #${a.id} - ${a.descripcion}`,
  }));

  const selectedSubastadorObj = subastadores.find((s) => s.id === parseInt(subastadorId));
  const selectedSubastadorLabel = selectedSubastadorObj 
    ? selectedSubastadorObj.nombre 
    : "";

  const selectedSubastaObj = auctions.find((a) => a.id === parseInt(subastaIdInput));
  const selectedSubastaLabel = selectedSubastaObj 
    ? `Subasta #${selectedSubastaObj.id} (${selectedSubastaObj.fecha})` 
    : "";

  const selectedArticleObj = approvedArticles.find((a) => a.id === parseInt(articuloIdInput));
  const selectedArticleLabel = selectedArticleObj 
    ? `Artículo #${selectedArticleObj.id} - ${selectedArticleObj.descripcion}` 
    : "";

  const handleCreateAuction = async () => {
    if (!fecha || !hora) {
      Alert.alert("Error", "Fecha y Hora son obligatorias.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        fecha,
        hora,
        categoria,
        moneda,

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
            <Text style={[s.tabText, activeTab === "create" && s.activeTabText]}>Crear Subasta</Text>
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
            <Text style={s.formLabel}>Fecha de Evento *:</Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={fecha}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFecha(e.target.value)}
                style={{
                  borderWidth: 1,
                  borderColor: "#E5DDD0",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: "#1A1A2E",
                  backgroundColor: "#FFFFFF",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <>
                <Pressable onPress={() => setShowDatePicker(true)}>
                  <View style={s.pickerTriggerBox}>
                    <Text style={s.pickerTriggerText}>{fecha || "Seleccionar Fecha"}</Text>
                    <MaterialIcons name="calendar-today" size={20} color="#8B6914" />
                  </View>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={(() => {
                      if (!fecha) return new Date();
                      const [y, m, d] = fecha.split("-").map(Number);
                      return new Date(y, m - 1, d);
                    })()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setFecha(selectedDate.toISOString().split("T")[0]);
                      }
                    }}
                  />
                )}
              </>
            )}
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Hora de Inicio *:</Text>
            {Platform.OS === "web" ? (
              <input
                type="time"
                step="1"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                style={{
                  borderWidth: 1,
                  borderColor: "#E5DDD0",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: "#1A1A2E",
                  backgroundColor: "#FFFFFF",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <>
                <Pressable onPress={() => setShowTimePicker(true)}>
                  <View style={s.pickerTriggerBox}>
                    <Text style={s.pickerTriggerText}>
                      {hora?.substring(0, 5) || "Seleccionar Hora"} hs
                    </Text>
                    <MaterialIcons name="access-time" size={20} color="#8B6914" />
                  </View>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={(() => {
                      const today = new Date();
                      const [h, min, sec] = (hora || "18:00:00").split(":").map(Number);
                      today.setHours(h, min, sec || 0);
                      return today;
                    })()}
                    mode="time"
                    display="default"
                    is24Hour={true}
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) {
                        const timeStr = selectedTime.toTimeString().split(" ")[0]; // HH:MM:SS
                        setHora(timeStr);
                      }
                    }}
                  />
                )}
              </>
            )}
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Categoría Requerida para Participar:</Text>
            <View style={s.pickerRow}>
              {CATEGORIES.map((cat) => (
                <Pressable key={cat} onPress={() => setCategoria(cat)} style={{ flex: 1 }}>
                  <View style={[s.pickerBox, categoria === cat && s.pickerBoxActive]}>
                    <Text style={[s.pickerBoxText, categoria === cat && s.pickerBoxTextActive]}>
                      {CATEG_LABELS[cat]}
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
            <CustomDropdown
              label="Subastador (Martillero) - Opcional:"
              selectedValue={subastadorId ? parseInt(subastadorId) : ""}
              selectedLabel={selectedSubastadorLabel}
              items={subastadoresDropdownItems}
              onSelect={(val) => setSubastadorId(val ? val.toString() : "")}
              placeholder="Seleccione un martillero..."
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
            <CustomDropdown
              label="Subasta Destino *"
              selectedValue={subastaIdInput ? parseInt(subastaIdInput) : ""}
              selectedLabel={selectedSubastaLabel}
              items={subastasDropdownItems}
              onSelect={(val) => setSubastaIdInput(val ? val.toString() : "")}
              placeholder="Seleccione la subasta..."
            />
          </View>

          <View style={s.formGroup}>
            <CustomDropdown
              label="Artículo Aprobado *"
              selectedValue={articuloIdInput ? parseInt(articuloIdInput) : ""}
              selectedLabel={selectedArticleLabel}
              items={articlesDropdownItems}
              onSelect={handleSelectArticle}
              placeholder="Seleccione el artículo..."
            />
            <Text style={s.inputHelp}>El artículo debe estar aprobado y con tasación aceptada.</Text>
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Precio Base Definitivo{selectedSubastaObj ? ` (${selectedSubastaObj.moneda})` : ""} *:</Text>
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
            <Text style={s.formLabel}>Comisión Definitiva{selectedSubastaObj ? ` (${selectedSubastaObj.moneda})` : ""} *:</Text>
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
  dropdownContainer: {
    gap: 6,
  },
  dropdownSelectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  dropdownText: {
    fontSize: 14,
    color: "#1A1A2E",
  },
  dropdownPlaceholderText: {
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    maxHeight: "75%",
    padding: 20,
    ...SHADOW,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE3",
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: "#1A1A2E",
    backgroundColor: "#FFF8F0",
    marginBottom: 12,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 14,
    marginBottom: 8,
  },
  dropdownOptionActive: {
    borderColor: "#B8941C",
    backgroundColor: "#FDF6EC",
  },
  dropdownOptionText: {
    fontSize: 13,
    color: "#1A1A2E",
    fontWeight: "500",
  },
  dropdownOptionTextActive: {
    color: "#8B6914",
    fontWeight: "700",
  },
  emptyDropdownText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
  },
  pickerTriggerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  pickerTriggerText: {
    fontSize: 14,
    color: "#1A1A2E",
  },
});
