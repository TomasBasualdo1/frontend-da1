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
  Image,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { adminService } from "../../src/services";

const SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.12)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
});

export default function AdminArticlesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal / Detail States
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [evalType, setEvalType] = useState<"aprobado" | "rechazado" | null>(null);

  // Form Fields
  const [precioBase, setPrecioBase] = useState("");
  const [comision, setComision] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Full Screen Image Viewer State
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingArticles();
      setArticles(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar los artículos consignados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEvaluate = async () => {
    if (!selectedArticle?.id || !evalType) return;
    setSubmitting(true);
    try {
      if (evalType === "aprobado") {
        const pb = parseFloat(precioBase);
        const com = parseFloat(comision);
        if (isNaN(pb) || pb <= 0.01) {
          Alert.alert("Error", "El precio base debe ser mayor a 0.01.");
          setSubmitting(false);
          return;
        }
        if (isNaN(com) || com <= 0.01) {
          Alert.alert("Error", "La comisión debe ser mayor a 0.01%.");
          setSubmitting(false);
          return;
        }
        await adminService.evaluateArticle(selectedArticle.id, {
          estado: "aprobado",
          precioBasePropuesto: pb,
          comisionPropuesta: com,
        });
        Alert.alert("Éxito", "Artículo tasado y aprobado.");
      } else {
        if (!motivoRechazo.trim()) {
          Alert.alert("Error", "Debe escribir el motivo del rechazo.");
          setSubmitting(false);
          return;
        }
        await adminService.evaluateArticle(selectedArticle.id, {
          estado: "rechazado",
          motivoRechazo: motivoRechazo,
        });
        Alert.alert("Éxito", "Artículo rechazado.");
      }
      setShowEvaluateModal(false);
      setShowDetailModal(false);
      setSelectedArticle(null);
      setPrecioBase("");
      setComision("");
      setMotivoRechazo("");
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo registrar la evaluación.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Text style={s.headerTitle}>Inspección de Artículos</Text>
        <Pressable onPress={loadData} style={s.refreshBtn}>
          <MaterialIcons name="refresh" size={20} color="#8B6914" />
        </Pressable>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#8B6914" />
          <Text style={s.loadingText}>Buscando consignaciones pendientes...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.listContainer}>
          {articles.length === 0 ? (
            <View style={s.emptyContainer}>
              <MaterialIcons name="inventory" size={48} color="#9CA3AF" />
              <Text style={s.emptyText}>No hay artículos pendientes de evaluación.</Text>
            </View>
          ) : (
            articles.map((art) => (
              <Pressable
                key={art.id}
                onPress={() => {
                  setSelectedArticle(art);
                  setShowDetailModal(true);
                }}
                style={s.cardWrapper}
              >
                <View style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.artTitle} numberOfLines={1}>
                      {art.descripcion}
                    </Text>
                    <View style={[s.badgeState, art.estado === "en_inspeccion" && s.badgeStateInspeccion]}>
                      <Text style={[s.badgeStateText, art.estado === "en_inspeccion" && s.badgeStateTextInspeccion]}>
                        {art.estado === "en_inspeccion" ? "En Inspección" : "Pendiente"}
                      </Text>
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Postulado por:</Text>
                      <Text style={s.infoVal}>{art.duenio_nombre || `Dueño ID: ${art.duenioId}`}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Fecha de Envío:</Text>
                      <Text style={s.infoVal}>{formatDate(art.fechaEnvio)}</Text>
                    </View>
                    {art.artista && (
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Artista/Autor:</Text>
                        <Text style={s.infoVal}>{art.artista}</Text>
                      </View>
                    )}
                  </View>

                  <View style={s.cardFooter}>
                    <Text style={s.actionText}>Auditar & Tasar</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={18} color="#8B6914" />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {/* Article Detail Modal */}
      <Modal visible={showDetailModal && !!selectedArticle} animationType="slide">
        <View style={[s.modalSafe, { paddingTop: insets.top }]}>
          <View style={s.modalHeader}>
            <Pressable
              onPress={() => {
                setShowDetailModal(false);
                setSelectedArticle(null);
              }}
              style={s.backBtn}
            >
              <View style={s.backBtnInner}>
                <MaterialIcons name="close" size={18} color="#8B6914" />
                <Text style={s.backText}>Cerrar</Text>
              </View>
            </Pressable>
            <Text style={s.headerTitle}>Auditoría de Artículo</Text>
            <View style={{ width: 60 }} />
          </View>

          {selectedArticle && (
            <ScrollView style={s.modalScrollView} contentContainerStyle={s.modalScrollContainer}>
              <View style={s.detailSection}>
                <Text style={s.detailHeaderTitle}>{selectedArticle.descripcion}</Text>
                <Text style={s.detailDate}>Enviado el {formatDate(selectedArticle.fechaEnvio)}</Text>
              </View>

              <View style={s.detailSection}>
                <Text style={s.detailSecTitle}>Ficha Técnica</Text>
                <View style={s.detailGrid}>
                  <View style={s.detailGridRow}>
                    <Text style={s.detailGridLabel}>Artista / Creador:</Text>
                    <Text style={s.detailGridVal}>{selectedArticle.artista || "Anónimo / Desconocido"}</Text>
                  </View>
                  <View style={s.detailGridRow}>
                    <Text style={s.detailGridLabel}>Año / Época:</Text>
                    <Text style={s.detailGridVal}>{selectedArticle.fechaCreacion || "No especificado"}</Text>
                  </View>
                  <View style={s.detailGridRow}>
                    <Text style={s.detailGridLabel}>Valor Est. Usuario:</Text>
                    <Text style={s.detailGridVal}>
                      {selectedArticle.precioSugeridoUsuario != null
                        ? `${selectedArticle.moneda || "USD"} ${Number(selectedArticle.precioSugeridoUsuario).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "No declarado"}
                    </Text>
                  </View>
                  <View style={s.detailGridRow}>
                    <Text style={s.detailGridLabel}>Postulado por:</Text>
                    <Text style={s.detailGridVal}>{selectedArticle.duenio_nombre || `Vendedor #${selectedArticle.duenioId}`}</Text>
                  </View>
                  <View style={s.detailGridRow}>
                    <Text style={s.detailGridLabel}>Ubicación Actual:</Text>
                    <Text style={s.detailGridVal}>{selectedArticle.ubicacion || "Depósito CABA"}</Text>
                  </View>
                </View>
              </View>

              <View style={s.detailSection}>
                <Text style={s.detailSecTitle}>Historia & Procedencia</Text>
                <Text style={s.detailText}>
                  {selectedArticle.historia || "El dueño no proveyó datos adicionales sobre la procedencia del objeto."}
                </Text>
              </View>

              {/* Photos Gallery */}
              <View style={s.detailSection}>
                <Text style={s.detailSecTitle}>Fotos Adjuntas ({selectedArticle.fotos?.length || 0})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.galleryContainer}>
                  {selectedArticle.fotos?.map((photo: string, idx: number) => (
                    <Pressable key={idx} onPress={() => setViewerImage(photo)}>
                      <Image source={{ uri: photo }} style={s.galleryThumb} resizeMode="cover" />
                    </Pressable>
                  ))}
                  {(!selectedArticle.fotos || selectedArticle.fotos.length === 0) && (
                    <Text style={s.noPhotosText}>No se adjuntaron fotos en la postulación.</Text>
                  )}
                </ScrollView>
              </View>

              {/* Evaluation Forms trigger */}
              <View style={s.auditActions}>
                <Pressable
                  style={s.actionBtnWrapper}
                  onPress={() => {
                    setEvalType("rechazado");
                    setMotivoRechazo("");
                    setShowEvaluateModal(true);
                  }}
                >
                  <View style={[s.btn, s.btnReject, { paddingVertical: 14 }]}>
                    <MaterialIcons name="close" size={20} color="#DC2626" />
                    <Text style={s.btnRejectText}>Rechazar Postulación</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={s.actionBtnWrapper}
                  onPress={() => {
                    setEvalType("aprobado");
                    setPrecioBase("");
                    setComision("");
                    setShowEvaluateModal(true);
                  }}
                >
                  <View style={[s.btn, s.btnApprove, { paddingVertical: 14 }]}>
                    <MaterialIcons name="gavel" size={20} color="#FFFFFF" />
                    <Text style={s.btnApproveText}>Aprobar & Tasar</Text>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Appraisal / Evaluation Modal */}
      <Modal visible={showEvaluateModal && !!selectedArticle} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              {evalType === "aprobado" ? "Tasación y Aprobación" : "Rechazo de Consignación"}
            </Text>
            <Text style={s.modalUser} numberOfLines={1}>
              Artículo: {selectedArticle?.descripcion}
            </Text>

            {evalType === "aprobado" ? (
              <View style={{ gap: 16, marginBottom: 20 }}>
                <View style={s.formGroup}>
                  <Text style={s.formLabel}>Precio Base Propuesto (USD):</Text>
                  <TextInput
                    placeholder="Ej. 1500"
                    keyboardType="numeric"
                    value={precioBase}
                    onChangeText={setPrecioBase}
                    style={s.input}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={s.formGroup}>
                  <Text style={s.formLabel}>Porcentaje de Comisión (%):</Text>
                  <TextInput
                    placeholder="Ej. 10"
                    keyboardType="numeric"
                    value={comision}
                    onChangeText={setComision}
                    style={s.input}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            ) : (
              <View style={[s.formGroup, { marginBottom: 20 }]}>
                <Text style={s.formLabel}>Motivo del Rechazo:</Text>
                <TextInput
                  placeholder="Escriba los motivos por los cuales no se acepta el artículo..."
                  value={motivoRechazo}
                  onChangeText={setMotivoRechazo}
                  style={s.reasonInput}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            {/* Modal Buttons */}
            <View style={s.modalActions}>
              <Pressable
                style={s.modalBtnWrapper}
                onPress={() => setShowEvaluateModal(false)}
                disabled={submitting}
              >
                <View style={[s.modalBtn, s.modalBtnCancel]}>
                  <Text style={s.modalBtnCancelText}>Cancelar</Text>
                </View>
              </Pressable>

              <Pressable
                style={s.modalBtnWrapper}
                onPress={handleEvaluate}
                disabled={submitting}
              >
                <View style={[s.modalBtn, s.modalBtnSubmit]}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={s.modalBtnSubmitText}>Finalizar</Text>
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Viewer Modal */}
      <Modal visible={!!viewerImage} transparent animationType="fade">
        <View style={s.viewerOverlay}>
          <Pressable onPress={() => setViewerImage(null)} style={s.viewerClose}>
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={s.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
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
  refreshBtn: {
    padding: 4,
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
  cardWrapper: {
    width: "100%",
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
  artTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    flex: 1,
    marginRight: 8,
  },
  badgeState: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeStateInspeccion: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  badgeStateText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  badgeStateTextInspeccion: {
    color: "#D97706",
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE3",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B6914",
    textTransform: "uppercase",
  },
  modalSafe: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
    backgroundColor: "#FFFFFF",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContainer: {
    padding: 24,
    gap: 20,
    flexGrow: 1,
  },
  detailSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 20,
    ...SHADOW,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailSecTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
    borderLeftWidth: 3,
    borderLeftColor: "#8B6914",
    paddingLeft: 8,
    marginBottom: 12,
  },
  detailGrid: {
    gap: 8,
  },
  detailGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailGridLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  detailGridVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  galleryContainer: {
    flexDirection: "row",
    gap: 12,
  },
  galleryThumb: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5DDD0",
  },
  noPhotosText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  auditActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnReject: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  btnRejectText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  btnApprove: {
    backgroundColor: "#1A1A2E",
  },
  btnApproveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    ...SHADOW,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 6,
  },
  modalUser: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  formGroup: {
    width: "100%",
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: "#1A1A2E",
    backgroundColor: "#FFF8F0",
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1A1A2E",
    textAlignVertical: "top",
    backgroundColor: "#FFF8F0",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtnWrapper: {
    flex: 1,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  modalBtnSubmit: {
    backgroundColor: "#1A1A2E",
  },
  modalBtnSubmitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
});
