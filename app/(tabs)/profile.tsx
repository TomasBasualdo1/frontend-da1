import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Image, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../src/context/AuthContext";
import { userService, auctionService } from "../../src/services";
import { MedioPago, UsuarioMetricas, Multa, Notificacion, Categoria, SubastaListado } from "../../src/types";

const CATEG_COLORS: Record<Categoria, string> = { comun: "#6B7280", especial: "#2563EB", plata: "#94A3B8", oro: "#D97706", platino: "#7C3AED" };

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1599643478518-a784e5dc3f25?w=200&h=150&fit=crop",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=150&fit=crop",
];

type ProfileTab = "subastas" | "perfil" | "pagos" | "stats";


export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout, refreshUser } = useAuth();
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    direccion: "",
    telefono: "",
  });
  const [editFoto, setEditFoto] = useState<string | null>(null);
  const [isAvatarDeleted, setIsAvatarDeleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setEditForm({
      nombre: user?.nombre || "",
      apellido: user?.apellido || "",
      direccion: user?.direccion || "",
      telefono: user?.telefono || "",
    });
    setEditFoto(null);
    setIsAvatarDeleted(false);
    setIsEditing(true);
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos", "Se necesita acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setEditFoto(result.assets[0].uri);
      setIsAvatarDeleted(false);
    }
  };

  const handleDeleteAvatar = () => {
    Alert.alert(
      "Eliminar foto de perfil",
      "¿Estás seguro de que querés eliminar tu foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setEditFoto(null);
            setIsAvatarDeleted(true);
          },
        },
      ]
    );
  };

  const saveProfile = async () => {
    if (!editForm.nombre.trim() || !editForm.apellido.trim()) {
      Alert.alert("Error", "Nombre y Apellido son obligatorios");
      return;
    }
    setSaving(true);
    try {
      if (isAvatarDeleted && user?.foto) {
        await userService.deleteAvatar();
      }

      const updateData: any = {
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        direccion: editForm.direccion,
        telefono: editForm.telefono,
      };

      if (editFoto) {
        updateData.foto = editFoto;
      }

      await userService.updateProfile(updateData);
      await refreshUser();
      setIsEditing(false);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };
  const [metricas, setMetricas] = useState<UsuarioMetricas | null>(null);
  const [multas, setMultas] = useState<Multa[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [misSubastas, setMisSubastas] = useState<SubastaListado[]>([]);
  const [tab, setTab] = useState<ProfileTab>("subastas");
  const [searchMis, setSearchMis] = useState("");

  // Payment form states
  const [showAddPago, setShowAddPago] = useState(false);
  const [newPagoTipo, setNewPagoTipo] = useState<"tarjeta_credito" | "cuenta_bancaria" | "cheque_certificado">("tarjeta_credito");
  const [newPagoMoneda, setNewPagoMoneda] = useState<"ARS" | "USD">("ARS");
  const [newPagoDatos, setNewPagoDatos] = useState("");
  const [newPagoLimite, setNewPagoLimite] = useState("");
  const [newPagoPais, setNewPagoPais] = useState<"AR" | "US" | null>(null);
  const [showNewPaisPicker, setShowNewPaisPicker] = useState(false);
  const [newPagoReceptora, setNewPagoReceptora] = useState(false);
  const [addingPago, setAddingPago] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    userService.getMediosPago().then(setMedios).catch(() => {});
    userService.getMetricas().then(setMetricas).catch(() => {});
    userService.getMultas().then(setMultas).catch(() => {});
    userService.getNotificaciones().then(setNotificaciones).catch(() => {});
    auctionService.getSubastas().then(setMisSubastas).catch(() => {});
  }, [isAuthenticated]);

  const handleAddMedioPago = async () => {
    if (!newPagoDatos.trim()) {
      Alert.alert("Error", "Por favor ingresá los datos del medio de pago.");
      return;
    }
    if (newPagoTipo === "tarjeta_credito") {
      const cleanCard = newPagoDatos.replace(/\D/g, "");
      if (cleanCard.length !== 16) {
        Alert.alert("Error", "El número de tarjeta debe tener exactamente 16 dígitos.");
        return;
      }
    }
    if (newPagoTipo !== "cheque_certificado" && !newPagoPais) {
      Alert.alert("Error", "Por favor seleccioná el país del banco.");
      return;
    }
    setAddingPago(true);
    try {
      await userService.addMedioPago({
        tipo: newPagoTipo,
        datos_encriptados: newPagoDatos.trim(),
        moneda: newPagoMoneda,
        limiteReservado: newPagoLimite ? parseFloat(newPagoLimite) : undefined,
        paisBanco: newPagoPais || undefined,
        esCuentaReceptora: newPagoReceptora,
      });
      Alert.alert("Éxito", "Medio de pago registrado correctamente.");
      setShowAddPago(false);
      setNewPagoDatos("");
      setNewPagoLimite("");
      setNewPagoPais(null);
      setNewPagoReceptora(false);
      const freshMedios = await userService.getMediosPago();
      setMedios(freshMedios);
    } catch {
      Alert.alert("Error", "No se pudo registrar el medio de pago.");
    } finally {
      setAddingPago(false);
    }
  };

  const handleDeleteMedio = (id: number) => {
    Alert.alert("Eliminar", "¿Seguro que querés eliminar este medio de pago?", [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await userService.deleteMedioPago(id);
            setMedios((prev) => prev.filter((m) => m.id !== id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar el medio de pago.");
          }
        },
      },
    ]);
  };

  const formatFecha = (value?: string) => (value ? new Date(value).toLocaleString() : "—");

  const handleNotificacionPress = async (id?: number) => {
    if (!id) return;
    try {
      await userService.marcarNotificacionLeida(id);
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    } catch {
      // Silencioso
    }
  };

  const misSubastasStats = useMemo(() => {
    const total = misSubastas.length;
    const enVivo = misSubastas.filter(s => s.estado === "abierta").length;
    const proximas = misSubastas.filter(s => s.estado === "cerrada").length;
    return { total, enVivo, proximas };
  }, [misSubastas]);

  if (!isAuthenticated) {
    return (
      <View style={s.container}><SafeAreaView style={s.center}>
        <MaterialIcons name="person-outline" size={56} color="#E5DDD0" />
        <Text style={s.emptyTitle}>Mi Perfil</Text>
        <Text style={s.emptyText}>Iniciá sesión para ver tu perfil</Text>
        <Pressable style={s.loginBtn} onPress={() => router.push("/(auth)/welcome")}><Text style={s.loginBtnText}>Iniciar Sesión</Text></Pressable>
      </SafeAreaView></View>
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Header */}
          <View style={s.profileHeader}>
            <Text style={s.headerTitle}>
              {tab === "subastas"
                ? "Mis Subastas"
                : tab === "pagos"
                ? "Pagos"
                : tab === "stats"
                ? "Métricas"
                : "Mi Perfil"}
            </Text>
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            {(["subastas", "perfil", "pagos", "stats"] as ProfileTab[]).map((t) => (
              <Pressable key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                <MaterialIcons
                  name={t === "subastas" ? "gavel" : t === "perfil" ? "person" : t === "pagos" ? "payment" : "bar-chart"}
                  size={18}
                  color={tab === t ? "#1A1A2E" : "#9CA3AF"}
                />
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === "subastas" ? "Subastas" : t === "perfil" ? "Perfil" : t === "pagos" ? "Pagos" : "Métricas"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ===== TAB: Mis Subastas ===== */}
          {tab === "subastas" && (
            <View>
              {/* Search */}
              <View style={s.searchBar}>
                <MaterialIcons name="search" size={20} color="#9CA3AF" />
                <TextInput style={s.searchInput} placeholder="Buscar subastas.." placeholderTextColor="#9CA3AF" value={searchMis} onChangeText={setSearchMis} />
              </View>

              {/* Stats */}
              <View style={s.statsRow}>
                <View style={s.statItem}><Text style={s.statNum}>{misSubastasStats.total}</Text><Text style={s.statLbl}>Total</Text></View>
                <View style={s.statDiv} />
                <View style={s.statItem}><Text style={[s.statNum, { color: "#DC2626" }]}>{misSubastasStats.enVivo}</Text><Text style={s.statLbl}>En Vivo</Text></View>
                <View style={s.statDiv} />
                <View style={s.statItem}><Text style={s.statNum}>{misSubastasStats.proximas}</Text><Text style={s.statLbl}>Próximas</Text></View>
              </View>

              {/* Cards */}
              {misSubastas.length === 0 ? (
                <View style={s.emptySection}>
                  <MaterialIcons name="inbox" size={48} color="#E5DDD0" />
                  <Text style={s.emptyText}>No estás inscripto en ninguna subasta</Text>
                </View>
              ) : (
                misSubastas.map((item, idx) => (
                  <Pressable key={item.id} style={s.misCard} onPress={() => router.push(`/subasta/${item.id}` as any)}>
                    <Image source={{ uri: PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length] }} style={s.misThumb} />
                    <View style={s.misInfo}>
                      <Text style={s.misTitle} numberOfLines={2}>Subasta #{item.id}</Text>
                      <View style={[s.misCateg, { backgroundColor: CATEG_COLORS[item.categoria] + "15" }]}>
                        <Text style={[s.misCategText, { color: CATEG_COLORS[item.categoria] }]}>{item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}</Text>
                      </View>
                      <Text style={s.misPrice}>Precio Base</Text>
                      <Text style={s.misPriceVal}>${item.moneda}</Text>
                    </View>
                  </Pressable>
                ))
              )}

              {/* Agregar Artículo button */}
              <Pressable style={s.addArticleBtn} onPress={() => router.push("/consignar")}>
                <Text style={s.addArticleBtnText}>Agregar Artículo</Text>
              </Pressable>
            </View>
          )}

          {/* ===== TAB: Perfil ===== */}
          {tab === "perfil" && (
            <View style={s.section}>
              {isEditing ? (
                // EDITING MODE
                <View>
                  <View style={s.avatarEditRow}>
                    <Pressable style={s.avatarContainerEdit} onPress={pickAvatar}>
                      {editFoto ? (
                        <Image source={{ uri: editFoto }} style={s.avatarImgEdit} />
                      ) : !isAvatarDeleted && user?.foto ? (
                        <Image source={{ uri: user.foto }} style={s.avatarImgEdit} />
                      ) : (
                        <MaterialIcons name="person" size={40} color="#1A1A2E" />
                      )}
                      <View style={s.avatarOverlay}>
                        <MaterialIcons name="camera-alt" size={16} color="#FFF" />
                      </View>
                    </Pressable>
                    <View style={s.avatarEditButtons}>
                      <Pressable style={s.changePhotoBtn} onPress={pickAvatar}>
                        <Text style={s.changePhotoText}>Cambiar foto</Text>
                      </Pressable>
                      {((user?.foto && !isAvatarDeleted) || editFoto) && (
                        <Pressable style={s.deletePhotoBtn} onPress={handleDeleteAvatar}>
                          <MaterialIcons name="delete" size={16} color="#DC2626" />
                          <Text style={s.deletePhotoText}>Eliminar foto</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <View style={s.editForm}>
                    <View style={s.inputGroup}>
                      <Text style={s.inputLabel}>Nombre</Text>
                      <TextInput
                        style={s.textInput}
                        value={editForm.nombre}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, nombre: text }))}
                        placeholder="Nombre"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={s.inputGroup}>
                      <Text style={s.inputLabel}>Apellido</Text>
                      <TextInput
                        style={s.textInput}
                        value={editForm.apellido}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, apellido: text }))}
                        placeholder="Apellido"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={s.inputGroup}>
                      <Text style={s.inputLabel}>Dirección</Text>
                      <TextInput
                        style={s.textInput}
                        value={editForm.direccion}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, direccion: text }))}
                        placeholder="Dirección"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={s.inputGroup}>
                      <Text style={s.inputLabel}>Teléfono</Text>
                      <TextInput
                        style={s.textInput}
                        value={editForm.telefono}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, telefono: text }))}
                        placeholder="Teléfono"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View style={s.editActionRow}>
                    <Pressable 
                      style={[s.saveBtn, saving && s.saveBtnDisabled]} 
                      onPress={saveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={s.saveBtnText}>Guardar</Text>
                      )}
                    </Pressable>
                    <Pressable 
                      style={s.cancelBtn} 
                      onPress={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      <Text style={s.cancelBtnText}>Cancelar</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                // VIEW MODE
                <View>
                  <View style={s.avatarRow}>
                    <View style={s.avatar}>
                      {user?.foto ? <Image source={{ uri: user.foto }} style={s.avatarImg} /> : <MaterialIcons name="person" size={36} color="#1A1A2E" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.userName}>{user?.nombre} {user?.apellido}</Text>
                      <Text style={s.userEmail}>{user?.email}</Text>
                      <View style={s.badgesRow}>
                        {user?.categoria && (
                          <View style={[s.badge, { backgroundColor: CATEG_COLORS[user.categoria] + "15" }]}>
                            <Text style={[s.badgeText, { color: CATEG_COLORS[user.categoria] }]}>{user.categoria.toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={[s.badge, { backgroundColor: user?.estadoRegistro === "aprobado" ? "#ECFDF5" : "#FEF3C7" }]}>
                          <Text style={{ fontSize: 11, fontWeight: "600", color: user?.estadoRegistro === "aprobado" ? "#059669" : "#D97706" }}>{user?.estadoRegistro === "aprobado" ? "Aprobado" : "Pendiente"}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {user?.multaActiva && (
                    <View style={s.multaAlert}><MaterialIcons name="warning" size={16} color="#DC2626" /><Text style={s.multaAlertText}>Multa activa pendiente de pago</Text></View>
                  )}

                  <View style={s.infoList}>
                    <InfoRow icon="badge" label="Documento" value={user?.documento || ""} />
                    <InfoRow icon="place" label="Dirección" value={user?.direccion || ""} />
                    <InfoRow icon="phone" label="Teléfono" value={user?.telefono || "—"} />
                  </View>

                  <Pressable style={s.editProfileBtn} onPress={startEditing}>
                    <MaterialIcons name="edit" size={18} color="#1A1A2E" />
                    <Text style={s.editProfileText}>Editar Perfil</Text>
                  </Pressable>

                  <Text style={[s.secTitle, { marginTop: 24 }]}>Notificaciones</Text>
                  {notificaciones.length === 0 ? (
                    <Text style={s.emptyText}>No hay notificaciones</Text>
                  ) : (
                    notificaciones.map((n, idx) => (
                      <Pressable
                        key={n.id ?? `notif-${idx}`}
                        style={[s.notificationCard, n.leida && s.notificationCardRead]}
                        onPress={() => handleNotificacionPress(n.id)}
                      >
                        <View style={s.notificationIcon}>
                          <MaterialIcons
                            name={
                              n.tipo === "pago"
                                ? "payment"
                                : n.tipo === "subasta"
                                ? "gavel"
                                : "info"
                            }
                            size={18}
                            color="#1A1A2E"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.notificationText} numberOfLines={2}>
                            {n.mensaje || "Notificación del sistema"}
                          </Text>
                          <Text style={s.notificationMeta}>{formatFecha(n.fechaHora)}</Text>
                        </View>
                        {!n.leida && <View style={s.unreadDot} />}
                      </Pressable>
                    ))
                  )}

                  <Pressable style={s.logoutBtn} onPress={() => Alert.alert("Cerrar sesión", "¿Estás seguro?", [{ text: "Cancelar" }, { text: "Salir", style: "destructive", onPress: () => { logout(); router.replace("/(auth)/welcome"); } }])}>
                    <MaterialIcons name="logout" size={18} color="#DC2626" /><Text style={s.logoutText}>Cerrar sesión</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* ===== TAB: Pagos ===== */}
          {tab === "pagos" && (
            <View style={s.section}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={[s.secTitle, { marginTop: 0 }]}>Medios de Pago</Text>
                <Pressable
                  style={{ backgroundColor: "#1A1A2E", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  onPress={() => setShowAddPago(!showAddPago)}
                >
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>
                    {showAddPago ? "Cancelar" : "Agregar"}
                  </Text>
                </Pressable>
              </View>

              {showAddPago && (
                <View style={{ gap: 12, backgroundColor: "#F5F1EC", padding: 14, borderRadius: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A2E" }}>Nuevo Medio de Pago</Text>
                  
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#1A1A2E" }}>Tipo *</Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {(["tarjeta_credito", "cuenta_bancaria", "cheque_certificado"] as const).map((t) => (
                        <Pressable
                          key={t}
                          style={[{ flex: 1, height: 36, borderRadius: 8, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5DDD0", justifyContent: "center", alignItems: "center" }, newPagoTipo === t && { borderColor: "#1A1A2E", backgroundColor: "#E5DDD0" }]}
                          onPress={() => {
                            setNewPagoTipo(t);
                            setNewPagoDatos("");
                          }}
                        >
                          <Text style={[{ fontSize: 11, color: "#6B7280" }, newPagoTipo === t && { color: "#1A1A2E", fontWeight: "700" }]}>
                            {t === "tarjeta_credito" ? "Tarjeta" : t === "cuenta_bancaria" ? "Cuenta" : "Cheque"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#1A1A2E" }}>Moneda *</Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {(["ARS", "USD"] as const).map((m) => (
                        <Pressable
                          key={m}
                          style={[{ flex: 1, height: 36, borderRadius: 8, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5DDD0", justifyContent: "center", alignItems: "center" }, newPagoMoneda === m && { borderColor: "#1A1A2E", backgroundColor: "#E5DDD0" }]}
                          onPress={() => setNewPagoMoneda(m)}
                        >
                          <Text style={[{ fontSize: 11, color: "#6B7280" }, newPagoMoneda === m && { color: "#1A1A2E", fontWeight: "700" }]}>
                            {m}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#1A1A2E" }}>Datos *</Text>
                    <TextInput
                      style={{ backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5DDD0", borderRadius: 8, height: 40, paddingHorizontal: 12, fontSize: 14 }}
                      placeholder={
                        newPagoTipo === "tarjeta_credito"
                          ? "Número de Tarjeta (16 dígitos)"
                          : newPagoTipo === "cuenta_bancaria"
                          ? "CBU / Alias / Nro Cuenta"
                          : "Código/Número del Cheque"
                      }
                      value={newPagoDatos}
                      onChangeText={(val) => {
                        if (newPagoTipo === "tarjeta_credito") {
                          const cleanVal = val.replace(/\D/g, "");
                          if (cleanVal.length <= 16) {
                            setNewPagoDatos(cleanVal);
                          }
                        } else {
                          setNewPagoDatos(val);
                        }
                      }}
                      maxLength={newPagoTipo === "tarjeta_credito" ? 16 : 1000}
                      keyboardType={newPagoTipo === "tarjeta_credito" ? "numeric" : "default"}
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#1A1A2E" }}>Límite ($)</Text>
                      <TextInput
                        style={{ backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5DDD0", borderRadius: 8, height: 40, paddingHorizontal: 12, fontSize: 14 }}
                        placeholder="Ej: 50000"
                        keyboardType="numeric"
                        value={newPagoLimite}
                        onChangeText={setNewPagoLimite}
                      />
                    </View>

                    {newPagoTipo !== "cheque_certificado" && (
                      <View style={{ flex: 1, gap: 4, position: 'relative', zIndex: 100 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#1A1A2E" }}>País del Banco *</Text>
                        <Pressable
                          style={[{ height: 36, borderRadius: 8, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5DDD0", justifyContent: "center", alignItems: "center" }]}
                          onPress={() => setShowNewPaisPicker(!showNewPaisPicker)}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: 8 }}>
                            <Text style={{ fontSize: 11, color: newPagoPais ? "#1A1A2E" : "#9CA3AF", fontWeight: newPagoPais ? "700" : "400" }}>
                              {newPagoPais ? (newPagoPais === "AR" ? "AR (Nacional)" : "US (Extranjero)") : "Seleccionar"}
                            </Text>
                            <MaterialIcons name={showNewPaisPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={14} color="#9CA3AF" />
                          </View>
                        </Pressable>
                        {showNewPaisPicker && (
                          <View style={{
                            position: 'absolute',
                            top: 58,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(60, 60, 60, 0.98)',
                            borderRadius: 12,
                            padding: 6,
                            zIndex: 999,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            elevation: 5,
                            gap: 2,
                          }}>
                            {(["AR", "US"] as const).map((p) => (
                              <Pressable
                                key={p}
                                style={{
                                  height: 34,
                                  borderRadius: 8,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingHorizontal: 10,
                                  backgroundColor: newPagoPais === p ? 'rgba(255,255,255,0.1)' : 'transparent',
                                }}
                                onPress={() => {
                                  setNewPagoPais(p);
                                  setShowNewPaisPicker(false);
                                }}
                              >
                                <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '600', flex: 1 }}>
                                  {p === "AR" ? "AR (Nacional)" : "US (Extranjero)"}
                                </Text>
                                {newPagoPais === p && (
                                  <MaterialIcons name="check" size={14} color="#FFF" />
                                )}
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  <Pressable
                    style={[{ backgroundColor: "#1A1A2E", height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 6 }, addingPago && { opacity: 0.7 }]}
                    onPress={handleAddMedioPago}
                    disabled={addingPago}
                  >
                    {addingPago ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>Registrar Medio de Pago</Text>}
                  </Pressable>
                </View>
              )}

              {medios.length === 0 ? <Text style={s.emptyText}>No tenés medios de pago</Text> :
                medios.map((m) => (
                  <View key={m.id ?? `${m.tipo}-${m.ultimos_digitos}`} style={s.payCard}>
                    <MaterialIcons
                      name={
                        m.tipo === "tarjeta_credito"
                          ? "credit-card"
                          : m.tipo === "cheque_certificado"
                          ? "receipt"
                          : "account-balance"
                      }
                      size={22}
                      color="#1A1A2E"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.payType}>
                        {m.tipo === "tarjeta_credito"
                          ? "Tarjeta"
                          : m.tipo === "cuenta_bancaria"
                          ? "Cuenta"
                          : m.tipo === "cheque_certificado"
                          ? "Cheque"
                          : "Medio de pago"}
                        {m.ultimos_digitos ? ` ···${m.ultimos_digitos}` : ""}
                      </Text>
                      <Text style={s.payInfo}>{m.moneda || ""}</Text>
                    </View>
                    <View style={[s.verifBadge, { backgroundColor: m.estadoVerificacion === "validado" ? "#ECFDF5" : "#FEF3C7" }]}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: m.estadoVerificacion === "validado" ? "#059669" : "#D97706" }}>
                        {m.estadoVerificacion === "validado" ? "✓" : "⏳"}
                      </Text>
                    </View>
                    {m.id != null && (
                      <Pressable style={{ marginLeft: 8 }} onPress={() => handleDeleteMedio(m.id!)}>
                        <MaterialIcons name="delete" size={18} color="#DC2626" />
                      </Pressable>
                    )}
                  </View>
                ))}
              {multas.length > 0 && <>
                <Text style={[s.secTitle, { marginTop: 20 }]}>Multas</Text>
                {multas.map((m) => (
                  <View key={m.id ?? `${m.importe}-${m.estado}`} style={s.payCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>
                        {m.importe != null ? `$${m.importe.toLocaleString()}` : "—"}
                      </Text>
                      <Text style={s.payInfo}>{m.motivo || "Sin detalle"}</Text>
                    </View>
                    <View style={[s.verifBadge, { backgroundColor: m.estado === "pendiente" ? "#FEF2F2" : "#ECFDF5" }]}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: m.estado === "pendiente" ? "#DC2626" : "#059669" }}>{m.estado || "pendiente"}</Text>
                    </View>
                  </View>
                ))}
              </>}
            </View>
          )}

          {/* ===== TAB: Métricas ===== */}
          {tab === "stats" && metricas && (
            <View style={s.section}>
              <Text style={s.secTitle}>Métricas de Participación</Text>
              <View style={s.metricsGrid}>
                <MetricBox label="Subastas" value={String(metricas.totalSubastasParticipadas)} icon="gavel" />
                <MetricBox label="Ganadas" value={String(metricas.totalSubastasGanadas)} icon="emoji-events" />
                <MetricBox label="Éxito" value={`${metricas.porcentajeExito.toFixed(0)}%`} icon="trending-up" />
                <MetricBox label="Pujas" value={String(metricas.totalPujasRealizadas)} icon="touch-app" />
              </View>
              <View style={s.metricRow}><Text style={s.metricLabel}>Total Ofertado</Text><Text style={s.metricVal}>${metricas.montoTotalOfertado.toLocaleString()}</Text></View>
              <View style={s.metricRow}><Text style={s.metricLabel}>Total Pagado</Text><Text style={s.metricVal}>${metricas.montoTotalPagado.toLocaleString()}</Text></View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}><MaterialIcons name={icon as any} size={18} color="#9CA3AF" /><View style={{ flex: 1 }}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View></View>
  );
}

function MetricBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.metricBox}><MaterialIcons name={icon as any} size={20} color="#1A1A2E" /><Text style={s.metricBoxVal}>{value}</Text><Text style={s.metricBoxLabel}>{label}</Text></View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 40 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  loginBtn: { backgroundColor: "#1A1A2E", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  loginBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  profileHeader: { alignItems: "center", paddingVertical: 14 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },

  tabs: { flexDirection: "row", gap: 4, marginBottom: 16 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#F0EBE3" },
  tabActive: { borderColor: "#1A1A2E", backgroundColor: "#F5F1EC" },
  tabText: { fontSize: 11, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#1A1A2E" },

  // Mis Subastas
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F1EC", borderRadius: 12, paddingHorizontal: 14, height: 44, gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, color: "#1A1A2E" },

  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16, paddingVertical: 14, backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#F0EBE3" },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  statLbl: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  statDiv: { width: 1, height: 30, backgroundColor: "#F0EBE3" },

  misCard: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#F0EBE3", padding: 12, gap: 14, marginBottom: 12 },
  misThumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: "#F0EBE3" },
  misInfo: { flex: 1, justifyContent: "center" },
  misTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  misCateg: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  misCategText: { fontSize: 11, fontWeight: "700" },
  misPrice: { fontSize: 11, color: "#9CA3AF" },
  misPriceVal: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },

  addArticleBtn: { backgroundColor: "#1A1A2E", height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 8 },
  addArticleBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  emptySection: { alignItems: "center", paddingVertical: 40, gap: 12 },

  // Perfil
  section: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#F0EBE3", padding: 18, marginBottom: 16 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#F5F1EC", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImg: { width: 64, height: 64, borderRadius: 20 },
  userName: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  userEmail: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  badgesRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  multaAlert: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", padding: 12, borderRadius: 10, marginBottom: 14 },
  multaAlertText: { fontSize: 13, color: "#DC2626", fontWeight: "600" },

  infoList: { gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3EDE4" },
  infoLabel: { fontSize: 12, color: "#9CA3AF" },
  infoValue: { fontSize: 14, color: "#1A1A2E", fontWeight: "600" },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginTop: 16, backgroundColor: "#FEF2F2", borderRadius: 12 },
  logoutText: { fontSize: 14, color: "#DC2626", fontWeight: "700" },

  // Pagos
  secTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 12 },
  payCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3EDE4" },
  payType: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  payInfo: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  verifBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  // Notificaciones
  notificationCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3EDE4" },
  notificationCardRead: { opacity: 0.7 },
  notificationIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#F5F1EC", justifyContent: "center", alignItems: "center" },
  notificationText: { fontSize: 14, color: "#1A1A2E", fontWeight: "600" },
  notificationMeta: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#DC2626" },

  // Métricas
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  metricBox: { width: "47%", backgroundColor: "#F5F1EC", borderRadius: 12, padding: 14, alignItems: "center", gap: 4 },
  metricBoxVal: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  metricBoxLabel: { fontSize: 11, color: "#9CA3AF" },
  metricRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F3EDE4" },
  metricLabel: { fontSize: 14, color: "#6B7280" },
  metricVal: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },

  // Edit Profile styles
  editProfileBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginTop: 16, backgroundColor: "#F5F1EC", borderRadius: 12, borderWidth: 1, borderColor: "#F0EBE3" },
  editProfileText: { fontSize: 14, color: "#1A1A2E", fontWeight: "700" },
  avatarEditRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatarContainerEdit: { width: 80, height: 80, borderRadius: 24, backgroundColor: "#F5F1EC", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" },
  avatarImgEdit: { width: 80, height: 80, borderRadius: 24 },
  avatarOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", height: 24, justifyContent: "center", alignItems: "center" },
  avatarEditButtons: { flex: 1, gap: 8 },
  changePhotoBtn: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#1A1A2E" },
  changePhotoText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  deletePhotoBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#DC2626" },
  deletePhotoText: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
  editForm: { gap: 12, marginBottom: 20 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", marginBottom: 4 },
  textInput: { backgroundColor: "#FFF8F0", borderWidth: 1.5, borderColor: "#E5DDD0", borderRadius: 12, height: 48, paddingHorizontal: 16, fontSize: 15, color: "#1A1A2E" },
  editActionRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  saveBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: "#1A1A2E", justifyContent: "center", alignItems: "center" },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5DDD0", justifyContent: "center", alignItems: "center", backgroundColor: "#FFF" },
  cancelBtnText: { color: "#6B7280", fontSize: 15, fontWeight: "700" },
});
