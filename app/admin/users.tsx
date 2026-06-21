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
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { adminService } from "../../src/services";
import { Usuario, Categoria } from "../../src/types";

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

export default function AdminUsersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [pendingUsers, setPendingUsers] = useState<Usuario[]>([]);
  const [allUsers, setAllUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "category" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Categoria>("comun");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Full Screen Image Viewer State
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "pending") {
        const data = await adminService.getPendingUsers();
        setPendingUsers(data);
      } else {
        const data = await adminService.getAllUsers();
        setAllUsers(data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar los datos de los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleVerify = async () => {
    if (!selectedUser?.id) return;
    setSubmitting(true);
    try {
      if (actionType === "approve") {
        await adminService.verifyUser(selectedUser.id, {
          admitido: true,
          categoria: selectedCategory,
        });
        Alert.alert("Éxito", "Usuario aprobado y activado.");
      } else if (actionType === "reject") {
        if (!rejectionReason.trim()) {
          Alert.alert("Error", "Debe ingresar un motivo de rechazo.");
          setSubmitting(false);
          return;
        }
        await adminService.verifyUser(selectedUser.id, {
          admitido: false,
          motivoRechazo: rejectionReason,
        });
        Alert.alert("Éxito", "Usuario rechazado.");
      }
      setSelectedUser(null);
      setActionType(null);
      setRejectionReason("");
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo completar la operación.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedUser?.id) return;
    setSubmitting(true);
    try {
      await adminService.updateUserCategory(selectedUser.id, selectedCategory);
      Alert.alert("Éxito", "Categoría del usuario actualizada.");
      setSelectedUser(null);
      setActionType(null);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar la categoría.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAllUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.nombre || ""} ${u.apellido || ""}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (u.documento || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

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
        <Text style={s.headerTitle}>Gestión de Usuarios</Text>
        <Pressable onPress={loadData} style={s.refreshBtn}>
          <MaterialIcons name="refresh" size={20} color="#8B6914" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={s.tabContainer}>
        <Pressable onPress={() => setActiveTab("pending")} style={s.tabWrapper}>
          <View style={[s.tab, activeTab === "pending" && s.activeTab]}>
            <Text style={[s.tabText, activeTab === "pending" && s.activeTabText]}>
              Pendientes ({pendingUsers.length})
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setActiveTab("all")} style={s.tabWrapper}>
          <View style={[s.tab, activeTab === "all" && s.activeTab]}>
            <Text style={[s.tabText, activeTab === "all" && s.activeTabText]}>
              Todos los Usuarios
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Search for All Users */}
      {activeTab === "all" && (
        <View style={s.searchContainer}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" style={s.searchIcon} />
          <TextInput
            placeholder="Buscar por nombre, documento o email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#8B6914" />
          <Text style={s.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.listContainer}>
          {activeTab === "pending" ? (
            pendingUsers.length === 0 ? (
              <View style={s.emptyContainer}>
                <MaterialIcons name="done-all" size={48} color="#9CA3AF" />
                <Text style={s.emptyText}>No hay solicitudes pendientes de registro.</Text>
              </View>
            ) : (
              pendingUsers.map((u) => (
                <View key={u.id} style={s.userCard}>
                  <View style={s.cardHeader}>
                    <Text style={s.userName}>
                      {u.nombre} {u.apellido}
                    </Text>
                    <View style={s.badgePend}>
                      <Text style={s.badgePendText}>Pendiente</Text>
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Documento:</Text>
                      <Text style={s.infoVal}>{u.documento}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Email:</Text>
                      <Text style={s.infoVal}>{u.email}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Teléfono:</Text>
                      <Text style={s.infoVal}>{u.telefono || "No especificado"}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Dirección:</Text>
                      <Text style={s.infoVal}>{u.direccion}</Text>
                    </View>

                    {/* DNI Photos */}
                    <Text style={s.sectionTitle}>Documento de Identidad (Auditoría):</Text>
                    <View style={s.dniContainer}>
                      <View style={s.imageCard}>
                        <Text style={s.imageLabel}>Frente</Text>
                        {u.fotoFrente ? (
                          <Pressable onPress={() => setViewerImage(u.fotoFrente || null)}>
                            <Image source={{ uri: u.fotoFrente }} style={s.dniThumb} resizeMode="cover" />
                          </Pressable>
                        ) : (
                          <View style={s.noDniImage}>
                            <MaterialIcons name="image-not-supported" size={24} color="#9CA3AF" />
                          </View>
                        )}
                      </View>
                      <View style={s.imageCard}>
                        <Text style={s.imageLabel}>Dorso</Text>
                        {u.fotoDorso ? (
                          <Pressable onPress={() => setViewerImage(u.fotoDorso || null)}>
                            <Image source={{ uri: u.fotoDorso }} style={s.dniThumb} resizeMode="cover" />
                          </Pressable>
                        ) : (
                          <View style={s.noDniImage}>
                            <MaterialIcons name="image-not-supported" size={24} color="#9CA3AF" />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={s.cardActions}>
                    <Pressable
                      style={s.actionBtnWrapper}
                      onPress={() => {
                        setSelectedUser(u);
                        setActionType("reject");
                      }}
                    >
                      <View style={[s.btn, s.btnReject]}>
                        <MaterialIcons name="close" size={16} color="#DC2626" />
                        <Text style={s.btnRejectText}>Rechazar</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={s.actionBtnWrapper}
                      onPress={() => {
                        setSelectedUser(u);
                        setActionType("approve");
                        setSelectedCategory("comun");
                      }}
                    >
                      <View style={[s.btn, s.btnApprove]}>
                        <MaterialIcons name="check" size={16} color="#FFFFFF" />
                        <Text style={s.btnApproveText}>Aprobar...</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              ))
            )
          ) : filteredAllUsers.length === 0 ? (
            <View style={s.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color="#9CA3AF" />
              <Text style={s.emptyText}>No se encontraron usuarios.</Text>
            </View>
          ) : (
            filteredAllUsers.map((u) => (
              <View key={u.id} style={s.userCard}>
                <View style={s.cardHeader}>
                  <Text style={s.userName}>
                    {u.nombre} {u.apellido}
                  </Text>
                  <View style={[s.badgeCateg, { backgroundColor: CATEG_COLORS[u.categoria || "comun"] }]}>
                    <Text style={s.badgeCategText}>{u.categoria?.toUpperCase() || "COMUN"}</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Documento:</Text>
                    <Text style={s.infoVal}>{u.documento}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Email:</Text>
                    <Text style={s.infoVal}>{u.email}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Bloqueado:</Text>
                    <Text style={[s.infoVal, u.bloqueado ? { color: "#DC2626" } : { color: "#16A34A" }]}>
                      {u.bloqueado ? "Sí" : "No"}
                    </Text>
                  </View>
                </View>

                <View style={s.cardActions}>
                  <Pressable
                    style={s.actionBtnWrapper}
                    onPress={() => {
                      setSelectedUser(u);
                      setActionType("category");
                      setSelectedCategory(u.categoria || "comun");
                    }}
                  >
                    <View style={[s.btn, s.btnCategory]}>
                      <MaterialIcons name="edit" size={16} color="#8B6914" />
                      <Text style={s.btnCategoryText}>Modificar Categoría</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Action Modal (Approve, Reject, or Category Change) */}
      <Modal visible={!!selectedUser && !!actionType} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              {actionType === "approve" && "Aprobar Solicitud"}
              {actionType === "reject" && "Rechazar Solicitud"}
              {actionType === "category" && "Cambiar Categoría"}
            </Text>

            <Text style={s.modalUser}>
              Usuario: {selectedUser?.nombre} {selectedUser?.apellido}
            </Text>

            {/* Category Selector (For Approve & Category Change) */}
            {(actionType === "approve" || actionType === "category") && (
              <View style={s.formGroup}>
                <Text style={s.formLabel}>Seleccione la Categoría:</Text>
                <View style={s.categoryList}>
                  {CATEGORIES.map((cat) => (
                    <Pressable key={cat} onPress={() => setSelectedCategory(cat)} style={{ width: "100%", marginBottom: 8 }}>
                      <View style={[s.categoryOption, selectedCategory === cat && s.selectedCategoryOption]}>
                        <MaterialIcons
                          name={selectedCategory === cat ? "radio-button-checked" : "radio-button-unchecked"}
                          size={18}
                          color={selectedCategory === cat ? "#8B6914" : "#6B7280"}
                        />
                        <Text style={[s.categoryOptionText, selectedCategory === cat && s.selectedCategoryOptionText]}>
                          {cat.toUpperCase()}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Rejection Reason (For Reject) */}
            {actionType === "reject" && (
              <View style={s.formGroup}>
                <Text style={s.formLabel}>Motivo del Rechazo:</Text>
                <TextInput
                  placeholder="Escriba el motivo detallado de rechazo..."
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  style={s.reasonInput}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            {/* Modal Actions */}
            <View style={s.modalActions}>
              <Pressable
                style={s.modalBtnWrapper}
                onPress={() => {
                  setSelectedUser(null);
                  setActionType(null);
                  setRejectionReason("");
                }}
                disabled={submitting}
              >
                <View style={[s.modalBtn, s.modalBtnCancel]}>
                  <Text style={s.modalBtnCancelText}>Cancelar</Text>
                </View>
              </Pressable>

              <Pressable
                style={s.modalBtnWrapper}
                onPress={actionType === "category" ? handleUpdateCategory : handleVerify}
                disabled={submitting}
              >
                <View style={[s.modalBtn, s.modalBtnSubmit]}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={s.modalBtnSubmitText}>Confirmar</Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: "#1A1A2E",
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
  userCard: {
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
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    flex: 1,
  },
  badgePend: {
    backgroundColor: "#FDF6EC",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgePendText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  badgeCateg: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCategText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B6914",
    marginTop: 14,
    marginBottom: 8,
  },
  dniContainer: {
    flexDirection: "row",
    gap: 12,
  },
  imageCard: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 8,
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  dniThumb: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  noDniImage: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE3",
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
  btnCategory: {
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "#E5DDD0",
  },
  btnCategoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B6914",
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
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  categoryList: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    backgroundColor: "#FFF8F0",
  },
  selectedCategoryOption: {
    borderColor: "#B8941C",
    backgroundColor: "#FDF6EC",
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  selectedCategoryOptionText: {
    color: "#8B6914",
    fontWeight: "700",
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
