import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { articleService, userService } from "../../src/services";
import {
  Articulo,
  Categoria,
  MedioPago,
  Multa,
  Notificacion,
  PagoPendientePerfil,
  UsuarioMetricas,
} from "../../src/types";

const CATEG_LABELS: Record<Categoria, string> = {
  comun: "Común",
  especial: "Especial",
  plata: "Plata",
  oro: "Oro",
  platino: "Platino",
};

const CATEG_COLORS: Record<
  Categoria,
  { bg: string; text: string; border: string }
> = {
  comun: { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
  especial: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  plata: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  oro: { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
  platino: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
};

const CATEG_ICONS: Record<Categoria, string> = {
  comun: "local-offer",
  especial: "star",
  plata: "workspace-premium",
  oro: "emoji-events",
  platino: "diamond",
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
];

type ProfileTab = "subastas" | "perfil" | "pagos" | "stats";

const getConsignacionKey = (item: Articulo, idx: number) => {
  if (item.id != null) return `articulo-${item.id}-${idx}`;
  return `articulo-sin-id-${idx}`;
};

/* ── Pulsating Live Dot ─────────────────────────────────── */
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);
  return (
    <View
      style={{
        width: 10,
        height: 10,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: "rgba(239,68,68,0.3)",
          transform: [{ scale: pulse }],
        }}
      />
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#EF4444",
        }}
      />
    </View>
  );
}

function formatFecha(fecha?: string): string {
  if (!fecha) return "";
  try {
    const d = new Date(fecha);
    return (
      d.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " hs"
    );
  } catch {
    return fecha;
  }
}

function formatAmount(value?: number): string {
  return `$ ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMoney(moneda: string | undefined, value?: number | null): string {
  const prefix = moneda === "USD" ? "USD" : "$";
  return `${prefix} ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSubastaDate(fecha?: string | null, hora?: string | null): string {
  const cleanHora = hora ? hora.substring(0, 5) : "";
  if (!fecha) return cleanHora ? `${cleanHora} hs` : "Fecha no disponible";
  try {
    const parsed = new Date(`${fecha}T${cleanHora || "00:00"}:00`);
    const dateLabel = parsed.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return cleanHora ? `${dateLabel} · ${cleanHora} hs` : dateLabel;
  } catch {
    return cleanHora ? `${fecha} · ${cleanHora} hs` : fecha;
  }
}

function formatMedioLimit(medio: MedioPago): string {
  const prefix = medio.moneda === "USD" ? "USD" : "$";
  return `${prefix} ${Number(medio.limiteReservado || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function medioPagoLabel(medio: MedioPago): string {
  const type =
    medio.tipo === "tarjeta_credito"
      ? "Tarjeta"
      : medio.tipo === "cuenta_bancaria"
        ? "Cuenta"
        : medio.tipo === "cheque_certificado"
          ? "Cheque certificado"
          : "Medio de pago";
  return medio.ultimos_digitos ? `${type} ...${medio.ultimos_digitos}` : type;
}

function getMultaPagoErrorMessage(error: unknown): string {
  const apiError = error as { response?: { status?: number } };
  switch (apiError?.response?.status) {
    case 400:
      return "El medio seleccionado es inválido o no tiene fondos suficientes para cubrir la multa.";
    case 403:
      return "No podés usar ese medio de pago: puede ser ajeno, no autorizado o no estar validado.";
    case 404:
      return "La multa no existe o ya no está disponible.";
    case 409:
      return "La multa ya fue pagada o dejó de estar pendiente.";
    default:
      return "No se pudo completar el pago. Revisá la conexión e intentá nuevamente.";
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout, refreshUser } = useAuth();
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [refreshing, setRefreshing] = useState(false);
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
      ],
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
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendientePerfil[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [misConsignaciones, setMisConsignaciones] = useState<Articulo[]>([]);
  const [tab, setTab] = useState<ProfileTab>("perfil");
  const [searchMis, setSearchMis] = useState("");
  const [selectedMedioByMultaId, setSelectedMedioByMultaId] = useState<
    Record<number, number | null>
  >({});
  const [payingMultaId, setPayingMultaId] = useState<number | null>(null);

  // Expandable consignment details and insurance increase states
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isEditingInsuranceId, setIsEditingInsuranceId] = useState<number | null>(null);
  const [newInsuranceAmount, setNewInsuranceAmount] = useState<string>("");
  const [updatingInsurance, setUpdatingInsurance] = useState<boolean>(false);

  // Payment form states
  const [showAddPago, setShowAddPago] = useState(false);
  const [newPagoTipo, setNewPagoTipo] = useState<
    "tarjeta_credito" | "cuenta_bancaria" | "cheque_certificado"
  >("tarjeta_credito");
  const [newPagoMoneda, setNewPagoMoneda] = useState<"ARS" | "USD">("ARS");
  const [newPagoDatos, setNewPagoDatos] = useState("");
  const [newPagoLimite, setNewPagoLimite] = useState("");
  const [newPagoPais, setNewPagoPais] = useState<"AR" | "US" | null>(null);
  const [showNewPaisPicker, setShowNewPaisPicker] = useState(false);
  const [addingPago, setAddingPago] = useState(false);

  const loadAllData = async () => {
    if (!isAuthenticated) {
      setRefreshing(false);
      return;
    }
    try {
      const [
        dataMedios,
        dataPagosPendientes,
        dataMultas,
        dataNotifs,
        dataMetricas,
        dataConsignaciones,
      ] =
        await Promise.all([
          userService.getMediosPago(),
          userService.getPagosPendientes(),
          userService.getMultas(),
          userService.getNotificaciones(),
          userService.getMetricas(),
          articleService.getMisPublicaciones(),
        ]);
      setMedios(dataMedios);
      setPagosPendientes(dataPagosPendientes);
      setMultas(dataMultas);
      setNotificaciones(dataNotifs);
      setMetricas(dataMetricas);
      setMisConsignaciones(dataConsignaciones);
    } catch (err) {
      console.error("Error loading profile data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isAuthenticated]);

  const handleAddMedioPago = async () => {
    if (!newPagoDatos.trim()) {
      Alert.alert("Error", "Los datos del medio de pago son obligatorios");
      return;
    }
    if (newPagoTipo === "tarjeta_credito" && newPagoDatos.length < 16) {
      Alert.alert("Error", "La tarjeta debe tener 16 dígitos");
      return;
    }
    const limiteNum = Number(newPagoLimite);
    if (!newPagoLimite || isNaN(limiteNum) || limiteNum <= 0) {
      Alert.alert("Error", "Ingrese un límite de compra válido mayor a 0");
      return;
    }
    if (newPagoTipo !== "cheque_certificado" && !newPagoPais) {
      Alert.alert("Error", "Debe seleccionar el país del banco");
      return;
    }

    setAddingPago(true);
    try {
      await userService.addMedioPago({
        tipo: newPagoTipo,
        moneda: newPagoMoneda,
        datos_encriptados: newPagoDatos,
        limiteReservado: limiteNum,
        paisBanco:
          newPagoTipo === "cheque_certificado" ? undefined : newPagoPais!,
      });
      Alert.alert("Éxito", "Medio de pago registrado correctamente");
      setShowAddPago(false);
      setNewPagoDatos("");
      setNewPagoLimite("");
      setNewPagoPais(null);
      loadAllData();
    } catch (err) {
      Alert.alert("Error", "No se pudo registrar el medio de pago");
    } finally {
      setAddingPago(false);
    }
  };

  const handleDeleteMedio = async (id: number) => {
    Alert.alert(
      "Eliminar medio de pago",
      "¿Seguro que querés eliminar este medio de pago?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.deleteMedioPago(id);
              loadAllData();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el medio de pago");
            }
          },
        },
      ],
    );
  };

  const multasEvaluadas = useMemo(
    () =>
      multas.map((multa) => {
        const importe = Number(multa.importe || 0);
        const mediosEvaluados = medios.map((medio) => {
          const motivos: string[] = [];
          const limite = Number(medio.limiteReservado || 0);

          if (medio.id == null) motivos.push("Sin identificador");
          if (medio.estadoVerificacion !== "validado") motivos.push("No validado");
          if (limite > 0 && limite < importe) motivos.push("Límite insuficiente");

          return { medio, motivos };
        });

        return { multa, mediosEvaluados };
      }),
    [medios, multas],
  );

  useEffect(() => {
    setSelectedMedioByMultaId((prev) => {
      const next: Record<number, number | null> = {};

      multasEvaluadas.forEach(({ multa, mediosEvaluados }) => {
        if (multa.estado !== "pendiente" || multa.id == null) return;

        const current = prev[multa.id];
        const currentValid = mediosEvaluados.some(
          (item) => item.medio.id === current && item.motivos.length === 0,
        );
        const firstValid =
          mediosEvaluados.find((item) => item.motivos.length === 0)?.medio.id ??
          null;

        next[multa.id] = currentValid ? current : firstValid;
      });

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const changed =
        prevKeys.length !== nextKeys.length ||
        nextKeys.some((key) => prev[Number(key)] !== next[Number(key)]);

      return changed ? next : prev;
    });
  }, [multasEvaluadas]);

  const handlePagarMulta = (multa: Multa) => {
    if (multa.id == null) {
      Alert.alert("Multa inválida", "Esta multa no tiene identificador para pagar.");
      return;
    }

    const evaluacion = multasEvaluadas.find((item) => item.multa.id === multa.id);
    const selectedMedioId = selectedMedioByMultaId[multa.id];
    const selectedMedio = evaluacion?.mediosEvaluados.find(
      (item) => item.medio.id === selectedMedioId,
    );

    if (!selectedMedio || selectedMedio.motivos.length > 0 || selectedMedioId == null) {
      Alert.alert(
        "Medio requerido",
        "Seleccioná un medio validado y compatible para pagar la multa.",
      );
      return;
    }

    Alert.alert(
      "Confirmar pago",
      `Vas a pagar ${formatAmount(multa.importe)} con ${medioPagoLabel(
        selectedMedio.medio,
      )}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Pagar",
          onPress: async () => {
            setPayingMultaId(multa.id!);
            try {
              await userService.pagarMulta({
                multaId: multa.id!,
                medioPagoId: selectedMedioId,
              });

              const [dataMultas, dataMedios] = await Promise.all([
                userService.getMultas(),
                userService.getMediosPago(),
              ]);
              setMultas(dataMultas);
              setMedios(dataMedios);
              await refreshUser();

              Alert.alert(
                "Multa pagada",
                "El pago se registró correctamente y actualizamos tu perfil.",
              );
            } catch (err) {
              Alert.alert("No se pudo pagar la multa", getMultaPagoErrorMessage(err));
            } finally {
              setPayingMultaId(null);
            }
          },
        },
      ],
    );
  };

  const handleNotificacionPress = async (id?: number) => {
    if (!id) return;
    try {
      await userService.marcarNotificacionLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
      );
    } catch {
      // Silencioso
    }
  };

  const misConsignacionesStats = useMemo(() => {
    const total = misConsignaciones.length;
    const pendientes = misConsignaciones.filter(
      (c) => c.estado === "pendiente" || c.estado === "en_inspeccion"
    ).length;
    const revisadas = misConsignaciones.filter(
      (c) => (c.estado === "aprobado" && !c.subastaId) || c.estado === "rechazado" || c.estado === "devuelto"
    ).length;
    const enSubasta = misConsignaciones.filter((c) => !!c.subastaId).length;
    return { total, pendientes, revisadas, enSubasta };
  }, [misConsignaciones]);

  const filteredMisConsignaciones = useMemo(() => {
    if (!searchMis.trim()) return misConsignaciones;
    const q = searchMis.toLowerCase();
    return misConsignaciones.filter(
      (c) =>
        c.descripcion?.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        (c.estado && c.estado.toLowerCase().includes(q))
    );
  }, [misConsignaciones, searchMis]);

  const handleAceptarTasacion = async (id: number, acepta: boolean) => {
    try {
      await articleService.aceptarTasacion(id, acepta);
      Alert.alert(
        "Éxito",
        acepta
          ? "Tasación aceptada correctamente. El artículo ahora es un producto subastable."
          : "Tasación rechazada. El artículo ha sido marcado como devuelto."
      );
      loadAllData();
    } catch (err) {
      console.error("Error al responder a la tasación:", err);
      Alert.alert("Error", "No se pudo procesar la respuesta a la tasación.");
    }
  };

  const STATE_LABELS: Record<string, string> = {
    pendiente: "Pendiente",
    en_inspeccion: "En Inspección",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
    devuelto: "Devuelto",
  };

  const handlePressConsignacion = (item: Articulo) => {
    if (item.id == null) return;
    setExpandedId((prev) => (prev === item.id ? null : item.id));
    setIsEditingInsuranceId(null);
    setNewInsuranceAmount("");
  };

  const handleAumentarSeguro = async (id: number, currentAmount: number) => {
    const val = parseFloat(newInsuranceAmount);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Error", "Debe ingresar un monto válido mayor a 0.");
      return;
    }
    if (val <= currentAmount) {
      Alert.alert(
        "Monto Insuficiente",
        `El nuevo monto asegurado ($${val.toLocaleString("es-AR")}) debe ser mayor al monto asegurado actual ($${currentAmount.toLocaleString("es-AR")}).`
      );
      return;
    }

    setUpdatingInsurance(true);
    try {
      await articleService.aumentarSeguro(id, val);
      Alert.alert(
        "Éxito",
        "Se ha solicitado el aumento de seguro correctamente. Te contactaremos pronto para la póliza."
      );
      setIsEditingInsuranceId(null);
      setNewInsuranceAmount("");
      loadAllData();
    } catch (err) {
      console.error("Error al aumentar el seguro:", err);
      Alert.alert("Error", "No se pudo solicitar el aumento de cobertura. Intentá nuevamente.");
    } finally {
      setUpdatingInsurance(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={s.container}>
        <SafeAreaView style={s.center}>
          <View style={s.emptyIconContainer}>
            <MaterialIcons name="person-outline" size={48} color="#C4B898" />
          </View>
          <Text style={s.emptyTitle}>Mi Perfil</Text>
          <Text style={s.emptyText}>
            Iniciá sesión para ver tu perfil y gestionar tus subastas
          </Text>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            onPress={() => router.push("/(auth)/welcome")}
          >
            <View style={s.loginBtn}>
              <Text style={s.loginBtnText}>Iniciar Sesión</Text>
            </View>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={[s.profileHeader, { paddingHorizontal: 24 }]}>
            <Text style={s.headerTitle}>
              {tab === "subastas"
                ? "Mis Subastas"
                : tab === "pagos"
                  ? "Pagos y Multas"
                  : tab === "stats"
                    ? "Métricas"
                    : "Mi Perfil"}
            </Text>
          </View>

          {/* Navigation Tabs (Glassmorphism layout wrapper) */}
          <View style={[s.tabsWrapper, { paddingHorizontal: 24 }]}>
            <View style={s.tabs}>
              {(["perfil", "subastas", "pagos", "stats"] as ProfileTab[]).map(
                (t) => (
                  <Pressable
                    key={t}
                    style={({ pressed }) => [
                      pressed && { opacity: 0.8 },
                      { flex: 1 },
                    ]}
                    onPress={() => setTab(t)}
                  >
                    <View style={[s.tabBtn, tab === t && s.tabActive]}>
                      <MaterialIcons
                        name={
                          t === "subastas"
                            ? "gavel"
                            : t === "perfil"
                              ? "person"
                              : t === "pagos"
                                ? "payment"
                                : "bar-chart"
                        }
                        size={13}
                        color={tab === t ? "#8B6914" : "#9CA3AF"}
                      />
                      <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                        {t === "subastas"
                          ? "Subastas"
                          : t === "perfil"
                            ? "Perfil"
                            : t === "pagos"
                              ? "Pagos"
                              : "Métricas"}
                      </Text>
                    </View>
                  </Pressable>
                ),
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.scroll, { paddingHorizontal: 24 }]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            alwaysBounceVertical={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadAllData();
                }}
                tintColor="#8B6914"
              />
            }
          >
            {/* ===== TAB: Mis Subastas ===== */}
            {tab === "subastas" && (
              <View style={s.tabContent}>
                {/* Search Row */}
                <View style={s.searchBar}>
                  <MaterialIcons name="search" size={20} color="#8B6914" />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Buscar mis consignaciones..."
                    placeholderTextColor="#9CA3AF"
                    value={searchMis}
                    onChangeText={setSearchMis}
                  />
                  {searchMis.length > 0 && (
                    <Pressable onPress={() => setSearchMis("")}>
                      <MaterialIcons name="close" size={18} color="#9CA3AF" />
                    </Pressable>
                  )}
                </View>

                {/* Stats Card */}
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statNum}>{misConsignacionesStats.pendientes}</Text>
                    <Text style={s.statLbl}>Pendientes</Text>
                  </View>
                  <View style={s.statDiv} />
                  <View style={s.statItem}>
                    <Text style={s.statNum}>{misConsignacionesStats.revisadas}</Text>
                    <Text style={s.statLbl}>Revisadas</Text>
                  </View>
                  <View style={s.statDiv} />
                  <View style={s.statItem}>
                    <Text style={[s.statNum, { color: "#8B6914" }]}>
                      {misConsignacionesStats.enSubasta}
                    </Text>
                    <Text style={s.statLbl}>En Subasta</Text>
                  </View>
                </View>

                {/* Consignaciones list */}
                {filteredMisConsignaciones.length === 0 ? (
                  <View style={s.emptySection}>
                    <View style={s.emptyIconWrap}>
                      <MaterialIcons name="inbox" size={36} color="#C4B898" />
                    </View>
                    <Text style={s.emptyText}>
                      {searchMis
                        ? "No se encontraron consignaciones"
                        : "No tienes ninguna consignación registrada"}
                    </Text>
                  </View>
                ) : (
                  filteredMisConsignaciones.map((item, idx) => {
                    const titlePart = item.descripcion?.split(" - ")[0] || item.descripcion || `Artículo #${item.id}`;
                    
                    // State chip styling
                    const STATE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
                      pendiente: { bg: "#FFFDF5", text: "#D97706", border: "#FDE68A", label: "Pendiente" },
                      en_inspeccion: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", label: "En Inspección" },
                      aprobado: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", label: item.subastaId ? "En Subasta" : "Listo para Subastar" },
                      rechazado: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5", label: "Rechazado" },
                      devuelto: { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB", label: "Devuelto" },
                    };
                    const stateConf = STATE_COLORS[item.estado || "pendiente"];

                    // Show buttons for valuation acceptance if approved and not yet decided
                    const showValuationActions = item.estado === "aprobado" && (item.tasacionAceptada === null || item.tasacionAceptada === undefined);
                    const isExpanded = item.id != null && expandedId === item.id;

                    return (
                      <View key={getConsignacionKey(item, idx)} style={{ gap: 8 }}>
                        <Pressable
                          onPress={() => handlePressConsignacion(item)}
                          style={({ pressed }) => [pressed && { opacity: 0.95 }]}
                        >
                          <View style={s.misCardContainer}>
                            <View style={s.misCardHeader}>
                              <Image
                                source={{
                                  uri: item.fotos && item.fotos.length > 0
                                    ? item.fotos[0]
                                    : PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length],
                                }}
                                style={s.misThumb}
                              />
                              <View style={s.misInfo}>
                                <Text style={s.misTitle} numberOfLines={1}>
                                  {titlePart}
                                </Text>

                                <View style={s.cardMetaRow}>
                                  <View
                                    style={[
                                      s.categChip,
                                      {
                                        backgroundColor: stateConf.bg,
                                        borderColor: stateConf.border,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        s.categText,
                                        { color: stateConf.text },
                                      ]}
                                    >
                                      {stateConf.label}
                                    </Text>
                                  </View>

                                  {item.subastaId && (
                                    <View style={s.liveTagBadge}>
                                      <Text style={s.liveTagText}>SUBASTA #{item.subastaId}</Text>
                                    </View>
                                  )}
                                </View>

                                {!isExpanded && item.precioBasePropuesto && (
                                  <View style={s.dateRow}>
                                    <MaterialIcons
                                      name="attach-money"
                                      size={13}
                                      color="#8B6914"
                                    />
                                    <Text style={[s.dateText, { color: "#8B6914", fontWeight: "700" }]}>
                                      Base: ${item.precioBasePropuesto}
                                      {item.comisionPropuesta ? ` | Com.: ${item.comisionPropuesta}%` : ""}
                                    </Text>
                                  </View>
                                )}

                                {!isExpanded && item.subastaFecha && (
                                  <View style={s.dateRow}>
                                    <MaterialIcons
                                      name="event"
                                      size={13}
                                      color="#9CA3AF"
                                    />
                                    <Text style={s.dateText}>
                                      {formatFecha(item.subastaFecha)}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <View style={s.cardArrow}>
                                <MaterialIcons
                                  name={isExpanded ? "keyboard-arrow-up" : "chevron-right"}
                                  size={22}
                                  color="#C4B898"
                                />
                              </View>
                            </View>

                            {/* Detalle Expandido */}
                            {isExpanded && (
                              <View style={s.misCardDetail}>
                                <View style={s.detailRow}>
                                  <Text style={s.detailLabel}>Descripción completa:</Text>
                                  <Text style={s.detailValue}>{item.descripcion}</Text>
                                </View>

                                {!!item.artista && (
                                  <View style={s.detailRow}>
                                    <Text style={s.detailLabel}>Artista / Creador:</Text>
                                    <Text style={s.detailValue}>{item.artista}</Text>
                                  </View>
                                )}

                                {!!item.fechaCreacion && (
                                  <View style={s.detailRow}>
                                    <Text style={s.detailLabel}>Fecha/Año de Creación:</Text>
                                    <Text style={s.detailValue}>{item.fechaCreacion}</Text>
                                  </View>
                                )}

                                {!!item.historia && (
                                  <View style={s.detailRow}>
                                    <Text style={s.detailLabel}>Historia / Procedencia:</Text>
                                    <Text style={s.detailValue}>{item.historia}</Text>
                                  </View>
                                )}

                                {item.estado === "rechazado" && !!item.motivoRechazo && (
                                  <View style={[s.detailRow, s.rejectionBox]}>
                                    <Text style={[s.detailLabel, { color: "#DC2626" }]}>Motivo de Rechazo:</Text>
                                    <Text style={[s.detailValue, { color: "#DC2626" }]}>{item.motivoRechazo}</Text>
                                  </View>
                                )}

                                {item.precioBasePropuesto && (
                                  <View style={s.detailRow}>
                                    <Text style={s.detailLabel}>Tasación propuesta:</Text>
                                    <Text style={s.detailValue}>
                                      Base: ${item.precioBasePropuesto.toLocaleString("es-AR")} | Comisión: {item.comisionPropuesta}%
                                    </Text>
                                  </View>
                                )}

                                {item.ubicacion && (
                                  <View style={s.detailRow}>
                                    <Text style={s.detailLabel}>Ubicación física:</Text>
                                    <Text style={s.detailValue}>{item.ubicacion}</Text>
                                  </View>
                                )}

                                {/* Sección de Seguro */}
                                {item.seguro && item.seguro.poliza ? (
                                  <View style={s.insuranceBox}>
                                    <Text style={s.detailSectionTitle}>🛡️ Seguro de Cobertura</Text>
                                    <View style={s.detailRow}>
                                      <Text style={s.detailLabel}>Compañía:</Text>
                                      <Text style={s.detailValue}>{item.seguro.compania}</Text>
                                    </View>
                                    <View style={s.detailRow}>
                                      <Text style={s.detailLabel}>Póliza:</Text>
                                      <Text style={s.detailValue}>{item.seguro.poliza}</Text>
                                    </View>
                                    <View style={s.detailRow}>
                                      <Text style={s.detailLabel}>Monto Asegurado:</Text>
                                      <Text style={[s.detailValue, { fontWeight: "700", color: "#8B6914" }]}>
                                        ${item.seguro.montoAsegurado.toLocaleString("es-AR")}
                                      </Text>
                                    </View>

                                    {/* Solicitar Aumento de Seguro */}
                                    <View style={{ marginTop: 8 }}>
                                      {isEditingInsuranceId === item.id ? (
                                        <View style={s.insuranceForm}>
                                          <Text style={s.formSublabel}>
                                            Nuevo monto asegurado (mín. ${(item.seguro.montoAsegurado + 1).toLocaleString("es-AR")}):
                                          </Text>
                                          <View style={s.insuranceInputContainer}>
                                            <Text style={s.currencyPrefix}>$</Text>
                                            <TextInput
                                              style={s.insuranceInput}
                                              value={newInsuranceAmount}
                                              onChangeText={setNewInsuranceAmount}
                                              placeholder="Ej: 15000"
                                              keyboardType="numeric"
                                              placeholderTextColor="#9CA3AF"
                                            />
                                          </View>
                                          {updatingInsurance ? (
                                            <ActivityIndicator size="small" color="#8B6914" style={{ marginTop: 8 }} />
                                          ) : (
                                            <View style={s.formActions}>
                                              <Pressable
                                                onPress={() => handleAumentarSeguro(item.id!, item.seguro!.montoAsegurado)}
                                                style={{ flex: 1 }}
                                              >
                                                <View style={s.confirmBtn}>
                                                  <Text style={s.confirmBtnText}>Confirmar</Text>
                                                </View>
                                              </Pressable>
                                              <Pressable
                                                onPress={() => {
                                                  setIsEditingInsuranceId(null);
                                                  setNewInsuranceAmount("");
                                                }}
                                                style={{ flex: 1 }}
                                              >
                                                <View style={s.cancelBtn}>
                                                  <Text style={s.cancelBtnText}>Cancelar</Text>
                                                </View>
                                              </Pressable>
                                            </View>
                                          )}
                                        </View>
                                      ) : (
                                        <Pressable
                                          onPress={() => {
                                            setIsEditingInsuranceId(item.id!);
                                            setNewInsuranceAmount(String(item.seguro!.montoAsegurado + 1000));
                                          }}
                                        >
                                          <View style={s.aumentarSeguroBtn}>
                                            <Text style={s.aumentarSeguroText}>Solicitar Aumento de Cobertura</Text>
                                          </View>
                                        </Pressable>
                                      )}
                                    </View>
                                  </View>
                                ) : null}

                                {/* Sección de Subasta programada */}
                                {item.subastaId && (
                                  <View style={s.subastaLinkBox}>
                                    <Text style={s.detailSectionTitle}>📅 Programación de Subasta</Text>
                                    <View style={s.detailRow}>
                                      <Text style={s.detailLabel}>Subasta Asociada:</Text>
                                      <Text style={s.detailValue}>Subasta #{item.subastaId}</Text>
                                    </View>
                                    {item.subastaFecha && (
                                      <View style={s.detailRow}>
                                        <Text style={s.detailLabel}>Fecha y Hora:</Text>
                                        <Text style={s.detailValue}>
                                          {item.subastaFecha} {item.subastaHora ? `a las ${item.subastaHora.substring(0, 5)} hs` : ""}
                                        </Text>
                                      </View>
                                    )}
                                    <Pressable
                                      onPress={() => router.push(`/subasta/${item.subastaId}` as any)}
                                      style={{ marginTop: 8 }}
                                    >
                                      <View style={s.irSubastaBtn}>
                                        <Text style={s.irSubastaBtnText}>Ir a la Subasta</Text>
                                        <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
                                      </View>
                                    </Pressable>
                                  </View>
                                )}

                                {/* Valuation Decision Buttons inline */}
                                {showValuationActions && (
                                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                                    <Pressable
                                      style={{ flex: 1 }}
                                      onPress={() => handleAceptarTasacion(item.id!, true)}
                                    >
                                      <View style={s.acceptValuationBtn}>
                                        <Text style={s.acceptValuationText}>✓ Aceptar Tasación</Text>
                                      </View>
                                    </Pressable>
                                    <Pressable
                                      style={{ flex: 1 }}
                                      onPress={() => handleAceptarTasacion(item.id!, false)}
                                    >
                                      <View style={s.rejectValuationBtn}>
                                        <Text style={s.rejectValuationText}>✕ Rechazar</Text>
                                      </View>
                                    </Pressable>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </Pressable>
                      </View>
                    );
                  })
                )}

                {/* Agregar Artículo Button */}
                <Pressable
                  onPress={() => router.push("/consignar")}
                  style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                >
                  <View style={s.addArticleBtn}>
                    <MaterialIcons
                      name="add-circle-outline"
                      size={18}
                      color="#FFF"
                    />
                    <Text style={s.addArticleBtnText}>
                      Consignar / Agregar Artículo
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}

            {/* ===== TAB: Perfil ===== */}
            {tab === "perfil" && (
              <View style={s.tabContent}>
                {isEditing ? (
                  // EDITING MODE
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>
                      Editar Información Personal
                    </Text>

                    <View style={s.avatarEditRow}>
                      <Pressable
                        style={s.avatarContainerEdit}
                        onPress={pickAvatar}
                      >
                        {editFoto ? (
                          <Image
                            source={{ uri: editFoto }}
                            style={s.avatarImgEdit}
                          />
                        ) : !isAvatarDeleted && user?.foto ? (
                          <Image
                            source={{ uri: user.foto }}
                            style={s.avatarImgEdit}
                          />
                        ) : (
                          <MaterialIcons
                            name="person"
                            size={40}
                            color="#8B6914"
                          />
                        )}
                        <View style={s.avatarOverlay}>
                          <MaterialIcons
                            name="camera-alt"
                            size={16}
                            color="#FFF"
                          />
                        </View>
                      </Pressable>
                      <View style={s.avatarEditButtons}>
                        <Pressable
                          onPress={pickAvatar}
                          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                        >
                          <View style={s.changePhotoBtn}>
                            <Text style={s.changePhotoText}>Subir Foto</Text>
                          </View>
                        </Pressable>
                        {((user?.foto && !isAvatarDeleted) || editFoto) && (
                          <Pressable
                            onPress={handleDeleteAvatar}
                            style={({ pressed }) => [
                              pressed && { opacity: 0.8 },
                            ]}
                          >
                            <View style={s.deletePhotoBtn}>
                              <MaterialIcons
                                name="delete"
                                size={14}
                                color="#DC2626"
                              />
                              <Text style={s.deletePhotoText}>
                                Eliminar foto
                              </Text>
                            </View>
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
                          onChangeText={(text) =>
                            setEditForm((prev) => ({ ...prev, nombre: text }))
                          }
                          placeholder="Nombre"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>

                      <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>Apellido</Text>
                        <TextInput
                          style={s.textInput}
                          value={editForm.apellido}
                          onChangeText={(text) =>
                            setEditForm((prev) => ({ ...prev, apellido: text }))
                          }
                          placeholder="Apellido"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>

                      <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>Dirección</Text>
                        <TextInput
                          style={s.textInput}
                          value={editForm.direccion}
                          onChangeText={(text) =>
                            setEditForm((prev) => ({
                              ...prev,
                              direccion: text,
                            }))
                          }
                          placeholder="Dirección"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>

                      <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>Teléfono</Text>
                        <TextInput
                          style={s.textInput}
                          value={editForm.telefono}
                          onChangeText={(text) =>
                            setEditForm((prev) => ({ ...prev, telefono: text }))
                          }
                          placeholder="Teléfono"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    <View style={s.editActionRow}>
                      <Pressable
                        style={({ pressed }) => [
                          s.saveBtn,
                          pressed && { opacity: 0.9 },
                          saving && s.saveBtnDisabled,
                        ]}
                        onPress={saveProfile}
                        disabled={saving}
                      >
                        <View style={s.saveBtnInner}>
                          {saving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={s.saveBtnText}>Guardar</Text>
                          )}
                        </View>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          s.cancelBtnEdit,
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => setIsEditing(false)}
                        disabled={saving}
                      >
                        <View style={s.cancelBtnInner}>
                          <Text style={s.cancelBtnEditText}>Cancelar</Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  // VIEW MODE
                  <View>
                    {/* User profile card */}
                    <View style={s.section}>
                      <View style={s.avatarRow}>
                        <View style={s.avatar}>
                          {user?.foto ? (
                            <Image
                              source={{ uri: user.foto }}
                              style={s.avatarImg}
                            />
                          ) : (
                            <MaterialIcons
                              name="person"
                              size={36}
                              color="#8B6914"
                            />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.userName}>
                            {user?.nombre} {user?.apellido}
                          </Text>
                          <Text style={s.userEmail}>{user?.email}</Text>

                          <View style={s.badgesRow}>
                            {user?.categoria && (
                              <View
                                style={[
                                  s.badge,
                                  {
                                    backgroundColor:
                                      CATEG_COLORS[user.categoria].bg,
                                    borderColor:
                                      CATEG_COLORS[user.categoria].border,
                                  },
                                ]}
                              >
                                <MaterialIcons
                                  name={CATEG_ICONS[user.categoria] as any}
                                  size={10}
                                  color={CATEG_COLORS[user.categoria].text}
                                />
                                <Text
                                  style={[
                                    s.badgeText,
                                    {
                                      color: CATEG_COLORS[user.categoria].text,
                                    },
                                  ]}
                                >
                                  {user.categoria.toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View
                              style={[
                                s.badge,
                                {
                                  backgroundColor:
                                    user?.estadoRegistro === "aprobado"
                                      ? "#E8F5E9"
                                      : "#FFF3E0",
                                  borderColor:
                                    user?.estadoRegistro === "aprobado"
                                      ? "#C8E6C9"
                                      : "#FFE0B2",
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color:
                                    user?.estadoRegistro === "aprobado"
                                      ? "#2E7D32"
                                      : "#E65100",
                                }}
                              >
                                {user?.estadoRegistro === "aprobado"
                                  ? "✓ Aprobado"
                                  : "⏳ Pendiente"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {user?.multaActiva && (
                        <View style={s.multaAlert}>
                          <MaterialIcons
                            name="warning"
                            size={16}
                            color="#DC2626"
                          />
                          <Text style={s.multaAlertText}>
                            Tenés una multa activa pendiente de pago.
                          </Text>
                        </View>
                      )}

                      <View style={s.infoList}>
                        <InfoRow
                          icon="badge"
                          label="Documento de Identidad"
                          value={user?.documento || ""}
                        />
                        <InfoRow
                          icon="place"
                          label="Dirección de Envío"
                          value={user?.direccion || "No registrada"}
                        />
                        <InfoRow
                          icon="phone"
                          label="Número de Teléfono"
                          value={user?.telefono || "—"}
                        />
                      </View>

                      <Pressable
                        onPress={startEditing}
                        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                      >
                        <View style={s.editProfileBtn}>
                          <MaterialIcons
                            name="edit"
                            size={16}
                            color="#1A1A2E"
                          />
                          <Text style={s.editProfileText}>Editar Perfil</Text>
                        </View>
                      </Pressable>
                    </View>

                    {/* Admin Access Panel (If user is Administrator ID 12) */}
                    {user?.id === 12 && (
                      <Pressable
                        style={{ width: "100%", marginBottom: 16 }}
                        onPress={() => router.push("/admin")}
                      >
                        <View style={s.adminBtn}>
                          <MaterialIcons
                            name="admin-panel-settings"
                            size={22}
                            color="#8B6914"
                          />
                          <Text style={s.adminText}>
                            Panel de Administración
                          </Text>
                        </View>
                      </Pressable>
                    )}

                    {/* Notifications section */}
                    <Text style={[s.secTitle, { marginTop: 16 }]}>
                      Notificaciones del Sistema
                    </Text>

                    <View style={s.section}>
                      {notificaciones.length === 0 ? (
                        <View
                          style={{ alignItems: "center", paddingVertical: 16 }}
                        >
                          <MaterialIcons
                            name="notifications-none"
                            size={32}
                            color="#C4B898"
                          />
                          <Text style={[s.emptyText, { marginTop: 8 }]}>
                            No tenés notificaciones pendientes
                          </Text>
                        </View>
                      ) : (
                        notificaciones.map((n, idx) => (
                          <Pressable
                            key={n.id ?? `notif-${idx}`}
                            onPress={() => handleNotificacionPress(n.id)}
                            style={({ pressed }) => [
                              pressed && { opacity: 0.8 },
                            ]}
                          >
                            <View
                              style={[
                                s.notificationCard,
                                n.leida && s.notificationCardRead,
                              ]}
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
                                  color="#8B6914"
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={s.notificationText}
                                  numberOfLines={2}
                                >
                                  {n.mensaje || "Notificación del sistema"}
                                </Text>
                                <Text style={s.notificationMeta}>
                                  {formatFecha(n.fechaHora)}
                                </Text>
                              </View>
                              {!n.leida && <View style={s.unreadDot} />}
                            </View>
                          </Pressable>
                        ))
                      )}
                    </View>

                    {/* Cerrar Sesión (Logout) */}
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "Cerrar sesión",
                          "¿Estás seguro que querés salir?",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Salir",
                              style: "destructive",
                              onPress: () => {
                                logout();
                                router.replace("/(auth)/welcome");
                              },
                            },
                          ],
                        )
                      }
                      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                    >
                      <View style={s.logoutBtn}>
                        <MaterialIcons
                          name="logout"
                          size={16}
                          color="#DC2626"
                        />
                        <Text style={s.logoutText}>Cerrar Sesión</Text>
                      </View>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* ===== TAB: Pagos ===== */}
            {tab === "pagos" && (
              <View style={s.tabContent}>
                {/* Header section with add trigger */}
                <View style={s.paymentsHeaderRow}>
                  <Text style={s.secTitle}>Medios de Pago</Text>

                  <Pressable
                    onPress={() => setShowAddPago(!showAddPago)}
                    style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                  >
                    <View
                      style={[
                        s.addPagoToggle,
                        showAddPago && s.addPagoToggleActive,
                      ]}
                    >
                      <MaterialIcons
                        name={showAddPago ? "close" : "add"}
                        size={16}
                        color={showAddPago ? "#FFF" : "#8B6914"}
                      />
                      <Text
                        style={[
                          s.addPagoToggleText,
                          showAddPago && { color: "#FFF" },
                        ]}
                      >
                        {showAddPago ? "Cancelar" : "Agregar"}
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {/* Form to add Payment Method */}
                {showAddPago && (
                  <View style={s.addPagoForm}>
                    <Text style={s.addPagoFormTitle}>Nuevo Medio de Pago</Text>

                    {/* Method type Selection */}
                    <View style={s.formGroup}>
                      <Text style={s.formLabel}>
                        Tipo de cuenta o crédito *
                      </Text>
                      <View style={s.formButtonRow}>
                        {(
                          [
                            "tarjeta_credito",
                            "cuenta_bancaria",
                            "cheque_certificado",
                          ] as const
                        ).map((t) => (
                          <Pressable
                            key={t}
                            onPress={() => {
                              setNewPagoTipo(t);
                              setNewPagoDatos("");
                            }}
                            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                          >
                            <View
                              style={[
                                s.formRadioBtn,
                                newPagoTipo === t && s.formRadioBtnActive,
                              ]}
                            >
                              <Text
                                style={[
                                  s.formRadioText,
                                  newPagoTipo === t && s.formRadioTextActive,
                                ]}
                              >
                                {t === "tarjeta_credito"
                                  ? "Tarjeta"
                                  : t === "cuenta_bancaria"
                                    ? "Cuenta"
                                    : "Cheque"}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* Currency Selection */}
                    <View style={s.formGroup}>
                      <Text style={s.formLabel}>Moneda *</Text>
                      <View style={s.formButtonRow}>
                        {(["ARS", "USD"] as const).map((m) => (
                          <Pressable
                            key={m}
                            onPress={() => setNewPagoMoneda(m)}
                            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                          >
                            <View
                              style={[
                                s.formRadioBtn,
                                newPagoMoneda === m && s.formRadioBtnActive,
                              ]}
                            >
                              <Text
                                style={[
                                  s.formRadioText,
                                  newPagoMoneda === m && s.formRadioTextActive,
                                ]}
                              >
                                {m}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* Account details input */}
                    <View style={s.formGroup}>
                      <Text style={s.formLabel}>Datos / Identificación *</Text>
                      <TextInput
                        style={s.formInput}
                        placeholder={
                          newPagoTipo === "tarjeta_credito"
                            ? "Número de Tarjeta (16 dígitos sin espacios)"
                            : newPagoTipo === "cuenta_bancaria"
                              ? "CBU / Alias de la Cuenta Bancaria"
                              : "Número / Código del Cheque Certificado"
                        }
                        placeholderTextColor="#9CA3AF"
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
                        maxLength={newPagoTipo === "tarjeta_credito" ? 16 : 500}
                        keyboardType={
                          newPagoTipo === "tarjeta_credito"
                            ? "numeric"
                            : "default"
                        }
                      />
                    </View>

                    {/* Limit and Country row */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={s.formLabel}>Límite de Compra ($) *</Text>
                        <TextInput
                          style={s.formInput}
                          placeholder="Ej: 150000"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          value={newPagoLimite}
                          onChangeText={setNewPagoLimite}
                        />
                      </View>

                      {newPagoTipo !== "cheque_certificado" && (
                        <View
                          style={{
                            flex: 1,
                            gap: 4,
                            position: "relative",
                            zIndex: 100,
                          }}
                        >
                          <Text style={s.formLabel}>País del Banco *</Text>
                          <Pressable
                            onPress={() =>
                              setShowNewPaisPicker(!showNewPaisPicker)
                            }
                            style={({ pressed }) => [
                              pressed && { opacity: 0.85 },
                            ]}
                          >
                            <View style={s.selectTrigger}>
                              <Text
                                style={[
                                  s.selectTriggerText,
                                  newPagoPais && {
                                    color: "#1A1A2E",
                                    fontWeight: "700",
                                  },
                                ]}
                              >
                                {newPagoPais
                                  ? newPagoPais === "AR"
                                    ? "AR (Nacional)"
                                    : "US (Extranjero)"
                                  : "Seleccionar"}
                              </Text>
                              <MaterialIcons
                                name={
                                  showNewPaisPicker
                                    ? "keyboard-arrow-up"
                                    : "keyboard-arrow-down"
                                }
                                size={18}
                                color="#8B6914"
                              />
                            </View>
                          </Pressable>
                          {showNewPaisPicker && (
                            <View style={s.dropdownList}>
                              {(["AR", "US"] as const).map((p) => (
                                <Pressable
                                  key={p}
                                  onPress={() => {
                                    setNewPagoPais(p);
                                    setShowNewPaisPicker(false);
                                  }}
                                  style={({ pressed }) => [
                                    pressed && { opacity: 0.8 },
                                  ]}
                                >
                                  <View
                                    style={[
                                      s.dropdownItem,
                                      { height: 44 },
                                      newPagoPais === p && s.dropdownItemActive,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        s.dropdownItemText,
                                        { fontSize: 14 },
                                        newPagoPais === p && {
                                          fontWeight: "700",
                                        },
                                      ]}
                                    >
                                      {p === "AR"
                                        ? "AR (Nacional)"
                                        : "US (Extranjero)"}
                                    </Text>
                                    {newPagoPais === p && (
                                      <MaterialIcons
                                        name="check"
                                        size={14}
                                        color="#8B6914"
                                      />
                                    )}
                                  </View>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Submit Add method */}
                    <Pressable
                      onPress={handleAddMedioPago}
                      disabled={addingPago}
                      style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                    >
                      <View style={s.registerPayBtn}>
                        {addingPago ? (
                          <ActivityIndicator color="#FFF" />
                        ) : (
                          <>
                            <MaterialIcons name="save" size={18} color="#FFF" />
                            <Text style={s.registerPayBtnText}>
                              Registrar Medio de Pago
                            </Text>
                          </>
                        )}
                      </View>
                    </Pressable>
                  </View>
                )}

                {/* List of current payment methods */}
                <View style={s.section}>
                  {medios.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 12 }}>
                      <MaterialIcons name="payment" size={32} color="#C4B898" />
                      <Text style={[s.emptyText, { marginTop: 6 }]}>
                        No tenés medios de pago registrados
                      </Text>
                    </View>
                  ) : (
                    medios.map((m) => (
                      <View
                        key={m.id ?? `${m.tipo}-${m.ultimos_digitos}`}
                        style={s.payCard}
                      >
                        <View style={s.payCardIconContainer}>
                          <MaterialIcons
                            name={
                              m.tipo === "tarjeta_credito"
                                ? "credit-card"
                                : m.tipo === "cheque_certificado"
                                  ? "receipt"
                                  : "account-balance"
                            }
                            size={20}
                            color="#8B6914"
                          />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={s.payType}>
                            {m.tipo === "tarjeta_credito"
                              ? "Tarjeta"
                              : m.tipo === "cuenta_bancaria"
                                ? "Cuenta"
                                : m.tipo === "cheque_certificado"
                                  ? "Cheque Certificado"
                                  : "Medio de pago"}
                            {m.ultimos_digitos
                              ? ` (··· ${m.ultimos_digitos})`
                              : ""}
                          </Text>
                          <Text style={s.payInfo}>
                            Límite: {m.moneda}{" "}
                            {m.limiteReservado?.toLocaleString("es-AR") || "0"}
                          </Text>
                        </View>

                        <View
                          style={[
                            s.verifBadge,
                            {
                              backgroundColor:
                                m.estadoVerificacion === "validado"
                                  ? "#E8F5E9"
                                  : "#FFF3E0",
                              borderColor:
                                m.estadoVerificacion === "validado"
                                  ? "#C8E6C9"
                                  : "#FFE0B2",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color:
                                m.estadoVerificacion === "validado"
                                  ? "#2E7D32"
                                  : "#E65100",
                            }}
                          >
                            {m.estadoVerificacion === "validado"
                              ? "✓ Validado"
                              : "⏳ Pendiente"}
                          </Text>
                        </View>

                        {m.id != null && (
                          <Pressable
                            onPress={() => handleDeleteMedio(m.id!)}
                            style={({ pressed }) => [
                              pressed && { opacity: 0.7 },
                            ]}
                          >
                            <View style={s.deletePayBtn}>
                              <MaterialIcons
                                name="delete-outline"
                                size={18}
                                color="#DC2626"
                              />
                            </View>
                          </Pressable>
                        )}
                      </View>
                    ))
                  )}
                </View>

                <Text style={s.secTitle}>Artículos ganados</Text>
                {pagosPendientes.length === 0 ? (
                  <View style={s.section}>
                    <View style={{ alignItems: "center", paddingVertical: 16 }}>
                      <MaterialIcons name="inventory-2" size={32} color="#C4B898" />
                      <Text style={[s.emptyText, { marginTop: 8 }]}>
                        No tenés pagos pendientes de subastas finalizadas.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={s.pendingPaymentsList}>
                    {pagosPendientes.map((pago) => (
                      <View key={pago.id ?? pago.subastaId} style={s.pendingPaymentCard}>
                        <View style={s.pendingPaymentHeader}>
                          <View style={s.payCardIconContainer}>
                            <MaterialIcons name="emoji-events" size={20} color="#8B6914" />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={s.payType}>Subasta #{pago.subastaId}</Text>
                            <Text style={s.payInfo}>
                              {formatSubastaDate(pago.subastaFecha, pago.subastaHora)}
                            </Text>
                            {!!pago.subastaUbicacion && (
                              <Text style={s.payInfo} numberOfLines={1}>
                                {pago.subastaUbicacion}
                              </Text>
                            )}
                          </View>
                          <View style={[s.verifBadge, s.pendingPaymentBadge]}>
                            <Text style={s.pendingPaymentBadgeText}>Pendiente</Text>
                          </View>
                        </View>

                        <View style={s.wonItemsList}>
                          {pago.items.length === 0 ? (
                            <Text style={s.payInfo}>
                              Compra ganada registrada para esta subasta.
                            </Text>
                          ) : (
                            pago.items.map((item, idx) => (
                              <View
                                key={`${pago.id}-${item.itemId ?? item.productoId ?? idx}`}
                                style={s.wonItemRow}
                              >
                                <View style={{ flex: 1 }}>
                                  <Text style={s.wonItemTitle} numberOfLines={2}>
                                    {item.descripcion || `Artículo #${item.itemId ?? item.productoId}`}
                                  </Text>
                                  <Text style={s.wonItemMeta}>
                                    Ítem #{item.itemId ?? "-"} · Puja{" "}
                                    {formatMoney(pago.moneda, item.importe)}
                                  </Text>
                                </View>
                                <Text style={s.wonItemCommission}>
                                  Com. {formatMoney(pago.moneda, item.comision)}
                                </Text>
                              </View>
                            ))
                          )}
                        </View>

                        <View style={s.pendingTotalsBox}>
                          <View style={s.pendingTotalRow}>
                            <Text style={s.pendingTotalLabel}>Total pujado</Text>
                            <Text style={s.pendingTotalValue}>
                              {formatMoney(pago.moneda, pago.totalPujado)}
                            </Text>
                          </View>
                          <View style={s.pendingTotalRow}>
                            <Text style={s.pendingTotalLabel}>Comisión</Text>
                            <Text style={s.pendingTotalValue}>
                              {formatMoney(pago.moneda, pago.comision)}
                            </Text>
                          </View>
                          <View style={s.pendingTotalRow}>
                            <Text style={s.pendingTotalLabel}>Envío</Text>
                            <Text style={s.pendingTotalValue}>
                              {pago.costoEnvio > 0
                                ? formatMoney(pago.moneda, pago.costoEnvio)
                                : "Se define al pagar"}
                            </Text>
                          </View>
                          <View style={s.pendingTotalRow}>
                            <Text style={s.pendingGrandTotalLabel}>Total actual</Text>
                            <Text style={s.pendingGrandTotalValue}>
                              {formatMoney(pago.moneda, pago.totalFinal)}
                            </Text>
                          </View>
                          <Text style={s.pendingDeadline}>
                            Vence {formatFecha(pago.fechaLimitePago) || "sin fecha"}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => router.push(`/pagos/${pago.subastaId}` as any)}
                          style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                        >
                          <View style={s.payAuctionButton}>
                            <MaterialIcons name="paid" size={18} color="#FFF" />
                            <Text style={s.payAuctionButtonText}>Pagar compra</Text>
                          </View>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {/* Multas section */}
                {multas.length > 0 && (
                  <>
                    <Text style={s.secTitle}>Multas</Text>
                    {user?.multaActiva && (
                      <View style={s.multaPagoNotice}>
                        <MaterialIcons name="warning" size={18} color="#B45309" />
                        <Text style={s.multaPagoNoticeText}>
                          Tenés una multa pendiente. Hasta pagarla no podés participar en otra subasta.
                        </Text>
                      </View>
                    )}
                    <View style={s.fineList}>
                      {multasEvaluadas.map(({ multa, mediosEvaluados }) => {
                        const isPendiente = multa.estado === "pendiente";
                        const hasValidMedio = medios.some(
                          (medio) => medio.estadoVerificacion === "validado",
                        );
                        const selectedMedioId =
                          multa.id != null
                            ? selectedMedioByMultaId[multa.id] ?? null
                            : null;
                        const selectedMedio = mediosEvaluados.find(
                          (item) => item.medio.id === selectedMedioId,
                        );
                        const canPay =
                          isPendiente &&
                          multa.id != null &&
                          !!selectedMedio &&
                          selectedMedio.motivos.length === 0 &&
                          payingMultaId !== multa.id;

                        return (
                          <View
                            key={multa.id ?? `${multa.importe}-${multa.estado}`}
                            style={s.fineCard}
                          >
                            <View style={s.fineHeader}>
                              <View style={s.payCardIconContainer}>
                                <MaterialIcons
                                  name={isPendiente ? "gavel" : "check-circle"}
                                  size={20}
                                  color={isPendiente ? "#DC2626" : "#059669"}
                                />
                              </View>
                              <View style={{ flex: 1, gap: 2 }}>
                                <Text
                                  style={[
                                    s.payType,
                                    isPendiente && { color: "#DC2626" },
                                  ]}
                                >
                                  {formatAmount(multa.importe)}
                                </Text>
                                <Text style={s.payInfo}>
                                  {multa.motivo || "Sin detalle de la multa"}
                                </Text>
                                <Text style={s.payInfo}>
                                  Vence {formatFecha(multa.fechaLimite) || "sin fecha"}
                                </Text>
                              </View>
                              <View
                                style={[
                                  s.verifBadge,
                                  isPendiente ? s.fineBadgePending : s.fineBadgePaid,
                                ]}
                              >
                                <Text
                                  style={[
                                    s.fineBadgeText,
                                    isPendiente
                                      ? s.fineBadgeTextPending
                                      : s.fineBadgeTextPaid,
                                  ]}
                                >
                                  {multa.estado || "pendiente"}
                                </Text>
                              </View>
                            </View>

                            {isPendiente && multa.id != null && (
                              <View style={s.finePaymentBlock}>
                                <Text style={s.fineSubTitle}>Medio para pagar</Text>

                                {mediosEvaluados.length === 0 ? (
                                  <View style={s.fineMessage}>
                                    <MaterialIcons
                                      name="payment"
                                      size={18}
                                      color="#B45309"
                                    />
                                    <Text style={s.fineMessageText}>
                                      No tenés medios de pago registrados.
                                    </Text>
                                  </View>
                                ) : !hasValidMedio ? (
                                  <View style={s.fineMessage}>
                                    <MaterialIcons
                                      name="verified-user"
                                      size={18}
                                      color="#B45309"
                                    />
                                    <Text style={s.fineMessageText}>
                                      No tenés medios validados para pagar multas.
                                    </Text>
                                  </View>
                                ) : null}

                                <View style={s.fineMethods}>
                                  {mediosEvaluados.map(({ medio, motivos }) => {
                                    const disabled =
                                      motivos.length > 0 || payingMultaId === multa.id;
                                    const selected = medio.id === selectedMedioId;

                                    return (
                                      <Pressable
                                        key={
                                          medio.id ??
                                          `${multa.id}-${medio.tipo}-${medio.ultimos_digitos}`
                                        }
                                        disabled={disabled || medio.id == null}
                                        onPress={() =>
                                          setSelectedMedioByMultaId((prev) => ({
                                            ...prev,
                                            [multa.id!]: medio.id ?? null,
                                          }))
                                        }
                                        style={({ pressed }) => [
                                          pressed && { opacity: 0.9 },
                                        ]}
                                      >
                                        <View
                                          style={[
                                            s.fineMethodCard,
                                            selected && s.fineMethodSelected,
                                            disabled && s.fineMethodDisabled,
                                          ]}
                                        >
                                          <MaterialIcons
                                            name={
                                              selected
                                                ? "radio-button-checked"
                                                : "radio-button-unchecked"
                                            }
                                            size={20}
                                            color={selected ? "#8B6914" : "#9CA3AF"}
                                          />
                                          <View style={{ flex: 1, gap: 2 }}>
                                            <Text style={s.fineMethodTitle}>
                                              {medioPagoLabel(medio)}
                                            </Text>
                                            <Text style={s.fineMethodMeta}>
                                              {medio.moneda || "-"} · Límite{" "}
                                              {formatMedioLimit(medio)}
                                            </Text>
                                          </View>
                                          <Text
                                            style={[
                                              s.fineMethodStatus,
                                              motivos.length > 0
                                                ? s.fineMethodStatusError
                                                : s.fineMethodStatusOk,
                                            ]}
                                          >
                                            {motivos.length > 0
                                              ? motivos.join(" · ")
                                              : "Compatible"}
                                          </Text>
                                        </View>
                                      </Pressable>
                                    );
                                  })}
                                </View>

                                <Pressable
                                  onPress={() => handlePagarMulta(multa)}
                                  disabled={!canPay}
                                  style={({ pressed }) => [
                                    pressed && canPay && { opacity: 0.9 },
                                  ]}
                                >
                                  <View
                                    style={[
                                      s.payFineButton,
                                      !canPay && s.payFineButtonDisabled,
                                    ]}
                                  >
                                    {payingMultaId === multa.id ? (
                                      <ActivityIndicator color="#FFF" />
                                    ) : (
                                      <>
                                        <MaterialIcons
                                          name="paid"
                                          size={18}
                                          color="#FFF"
                                        />
                                        <Text style={s.payFineButtonText}>Pagar</Text>
                                      </>
                                    )}
                                  </View>
                                </Pressable>
                              </View>
                            )}

                            {isPendiente && multa.id == null && (
                              <View style={s.fineMessage}>
                                <MaterialIcons name="error" size={18} color="#B45309" />
                                <Text style={s.fineMessageText}>
                                  Esta multa no se puede pagar desde la app porque no tiene identificador.
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* ===== TAB: Métricas ===== */}
            {tab === "stats" && metricas && (
              <View style={s.tabContent}>
                <Text style={s.secTitle}>Métricas de Participación</Text>

                <View style={s.metricsGrid}>
                  <MetricBox
                    label="Subastas"
                    value={String(metricas.totalSubastasParticipadas)}
                    icon="gavel"
                  />
                  <MetricBox
                    label="Ganadas"
                    value={String(metricas.totalSubastasGanadas)}
                    icon="emoji-events"
                  />
                  <MetricBox
                    label="Éxito"
                    value={`${metricas.porcentajeExito.toFixed(0)}%`}
                    icon="trending-up"
                  />
                  <MetricBox
                    label="Pujas"
                    value={String(metricas.totalPujasRealizadas)}
                    icon="touch-app"
                  />
                </View>

                <View style={s.section}>
                  <View style={s.metricRow}>
                    <View style={s.metricRowLeft}>
                      <MaterialIcons name="toll" size={16} color="#8B6914" />
                      <Text style={s.metricLabel}>Monto Total Ofertado</Text>
                    </View>
                    <Text style={s.metricVal}>
                      ${metricas.montoTotalOfertado.toLocaleString("es-AR")}
                    </Text>
                  </View>

                  <View
                    style={[
                      s.metricRow,
                      { borderBottomWidth: 0, paddingBottom: 0 },
                    ]}
                  >
                    <View style={s.metricRowLeft}>
                      <MaterialIcons name="payment" size={16} color="#8B6914" />
                      <Text style={s.metricLabel}>Monto Total Pagado</Text>
                    </View>
                    <Text style={[s.metricVal, { color: "#059669" }]}>
                      ${metricas.montoTotalPagado.toLocaleString("es-AR")}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoRowIconWrap}>
        <MaterialIcons name={icon as any} size={16} color="#8B6914" />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function MetricBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={s.metricBox}>
      <View style={s.metricBoxIconWrap}>
        <MaterialIcons name={icon as any} size={18} color="#8B6914" />
      </View>
      <Text style={s.metricBoxVal}>{value}</Text>
      <Text style={s.metricBoxLabel}>{label}</Text>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */
const SHADOW_LIGHT = Platform.select({
  ios: {
    shadowColor: "rgba(139,105,20,0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
}) as any;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "#FEF3E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  scroll: { paddingHorizontal: 24, paddingBottom: 115 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  loginBtn: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
    ...SHADOW_LIGHT,
  },
  loginBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  profileHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },

  /* ── Navigation Tabs ── */
  tabsWrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 3,
    backgroundColor: "#FEF3E2",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E5DDD0",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#FFF",
    ...SHADOW_LIGHT,
  },
  tabText: { fontSize: 11, fontWeight: "500", color: "#9CA3AF" },
  tabTextActive: { color: "#8B6914", fontWeight: "700" },

  tabContent: { gap: 16 },

  /* ── Search Bar ── */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    ...SHADOW_LIGHT,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A2E", fontWeight: "500" },

  /* ── Stats Card ── */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    ...SHADOW_LIGHT,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLiveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statNum: { fontSize: 18, fontWeight: "800", color: "#1A1A2E" },
  statLbl: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  statDiv: { width: 1, height: 20, backgroundColor: "#F0EBE3" },

  /* ── Mis Subastas Cards ── */
  misCardContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    padding: 14,
    flexDirection: "column",
    ...SHADOW_LIGHT,
  },
  misCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  misCardDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE3",
    gap: 10,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8B6914",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "column",
    gap: 2,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
    lineHeight: 18,
  },
  rejectionBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  insuranceBox: {
    backgroundColor: "#FFFDF9",
    borderColor: "#E5DDD0",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  insuranceForm: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E5DDD0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  formSublabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  insuranceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#E5DDD0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: "#FFF8F0",
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8B6914",
    marginRight: 6,
  },
  insuranceInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "600",
    padding: 0,
  },
  formActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  confirmBtn: {
    backgroundColor: "#8B6914",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  cancelBtn: {
    borderColor: "#E5DDD0",
    borderWidth: 1,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  cancelBtnText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },
  aumentarSeguroBtn: {
    borderColor: "#8B6914",
    borderWidth: 1.5,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 4,
  },
  aumentarSeguroText: {
    color: "#8B6914",
    fontSize: 12,
    fontWeight: "800",
  },
  subastaLinkBox: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  irSubastaBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 10,
    height: 36,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  irSubastaBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  acceptValuationBtn: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptValuationText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "800",
  },
  rejectValuationBtn: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FEB2B2",
    borderWidth: 1,
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectValuationText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
  },
  misThumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: "#F0EBE3",
  },
  misInfo: { flex: 1, gap: 4 },
  misTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    letterSpacing: -0.2,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  categChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  categText: { fontSize: 10, fontWeight: "700" },
  liveTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220,38,38,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveTagText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  closedTagBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  closedTagText: { fontSize: 8, fontWeight: "700", color: "#6B7280" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  dateText: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Buttons ── */
  addArticleBtn: {
    flexDirection: "row",
    backgroundColor: "#8B6914",
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    ...SHADOW_LIGHT,
  },
  addArticleBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },

  emptySection: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FEF3E2",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Perfil View ── */
  section: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    padding: 20,
    ...SHADOW_LIGHT,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FEF3E2",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 36 },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.3,
  },
  userEmail: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  badgesRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  badgeText: { fontSize: 9, fontWeight: "800" },

  multaAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 16,
  },
  multaAlertText: { fontSize: 13, color: "#DC2626", fontWeight: "700" },

  infoList: { gap: 0 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EDE4",
  },
  infoRowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3E2",
  },
  infoLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "700",
    marginTop: 2,
  },

  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    marginTop: 18,
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5DDD0",
  },
  editProfileText: { fontSize: 14, color: "#1A1A2E", fontWeight: "700" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    marginTop: 24,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: { fontSize: 14, color: "#DC2626", fontWeight: "800" },

  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    marginTop: 24,
    backgroundColor: "#FFF",
    borderColor: "#1A1A2E",
    borderWidth: 1.5,
    borderRadius: 16,
    ...SHADOW_LIGHT,
  },
  adminText: { fontSize: 14, color: "#1A1A2E", fontWeight: "800" },

  /* ── Payments View ── */
  paymentsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  addPagoToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3E2",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addPagoToggleActive: {
    backgroundColor: "#B45309",
    borderColor: "#B45309",
  },
  addPagoToggleText: { fontSize: 12, fontWeight: "700", color: "#8B6914" },

  payCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EDE4",
  },
  payCardIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3E2",
  },
  payType: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  payInfo: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  verifBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  pendingPaymentsList: { gap: 12 },
  pendingPaymentCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    padding: 16,
    gap: 14,
    ...SHADOW_LIGHT,
  },
  pendingPaymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pendingPaymentBadge: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  pendingPaymentBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },
  wonItemsList: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3EDE4",
    paddingTop: 12,
  },
  wonItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  wonItemTitle: {
    fontSize: 13,
    color: "#1A1A2E",
    fontWeight: "800",
    lineHeight: 18,
  },
  wonItemMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "600",
  },
  wonItemCommission: {
    maxWidth: 116,
    textAlign: "right",
    fontSize: 11,
    color: "#8B6914",
    fontWeight: "800",
    lineHeight: 16,
  },
  pendingTotalsBox: {
    gap: 8,
    backgroundColor: "#FFF8F0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3EDE4",
    padding: 12,
  },
  pendingTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  pendingTotalLabel: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  pendingTotalValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 12,
    color: "#1A1A2E",
    fontWeight: "800",
  },
  pendingGrandTotalLabel: {
    flex: 1,
    fontSize: 13,
    color: "#1A1A2E",
    fontWeight: "900",
  },
  pendingGrandTotalValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 15,
    color: "#8B6914",
    fontWeight: "900",
  },
  pendingDeadline: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 2,
  },
  payAuctionButton: {
    flexDirection: "row",
    backgroundColor: "#1A1A2E",
    minHeight: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  payAuctionButtonText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  deletePayBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  multaPagoNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    padding: 14,
  },
  multaPagoNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#92400E",
    fontWeight: "700",
  },
  fineList: { gap: 12 },
  fineCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    padding: 16,
    gap: 14,
    ...SHADOW_LIGHT,
  },
  fineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fineBadgePending: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  fineBadgePaid: {
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
  },
  fineBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  fineBadgeTextPending: { color: "#DC2626" },
  fineBadgeTextPaid: { color: "#059669" },
  finePaymentBlock: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3EDE4",
    paddingTop: 14,
  },
  fineSubTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  fineMessage: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 10,
  },
  fineMessageText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
    fontWeight: "600",
  },
  fineMethods: { gap: 8 },
  fineMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FFF",
  },
  fineMethodSelected: {
    borderColor: "#8B6914",
    backgroundColor: "#FFFBEB",
  },
  fineMethodDisabled: { opacity: 0.55 },
  fineMethodTitle: {
    fontSize: 13,
    color: "#1A1A2E",
    fontWeight: "800",
  },
  fineMethodMeta: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  fineMethodStatus: {
    maxWidth: 118,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  fineMethodStatusOk: { color: "#059669" },
  fineMethodStatusError: { color: "#DC2626" },
  payFineButton: {
    flexDirection: "row",
    backgroundColor: "#1A1A2E",
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  payFineButtonDisabled: { opacity: 0.45 },
  payFineButtonText: { color: "#FFF", fontSize: 14, fontWeight: "800" },

  /* ── Add Payment Form ── */
  addPagoForm: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 24,
    padding: 20,
    gap: 14,
    marginBottom: 16,
    ...SHADOW_LIGHT,
  },
  addPagoFormTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.2,
  },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  formButtonRow: { flexDirection: "row", gap: 8 },
  formRadioBtn: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5DDD0",
    justifyContent: "center",
    alignItems: "center",
  },
  formRadioBtnActive: {
    borderColor: "#8B6914",
    backgroundColor: "#FEF3E2",
  },
  formRadioText: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  formRadioTextActive: { color: "#8B6914", fontWeight: "800" },
  formInput: {
    backgroundColor: "#FFF8F0",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#1A1A2E",
  },
  selectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8F0",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
  },
  selectTriggerText: { fontSize: 14, color: "#9CA3AF" },
  dropdownList: {
    position: "absolute",
    top: 66,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    padding: 6,
    zIndex: 999,
    gap: 4,
    ...SHADOW_LIGHT,
  },
  dropdownItem: {
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    justifyContent: "space-between",
  },
  dropdownItemActive: { backgroundColor: "#FEF3E2" },
  dropdownItemText: { fontSize: 14, color: "#1A1A2E" },
  registerPayBtn: {
    flexDirection: "row",
    backgroundColor: "#1A1A2E",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  registerPayBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  /* ── Notificaciones Tab ── */
  secTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EDE4",
  },
  notificationCardRead: { opacity: 0.5 },
  notificationIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3E2",
  },
  notificationText: {
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "700",
    lineHeight: 20,
  },
  notificationMeta: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
  },

  /* ── Métricas ── */
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0EBE3",
    padding: 16,
    alignItems: "center",
    gap: 4,
    ...SHADOW_LIGHT,
  },
  metricBoxIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3E2",
    marginBottom: 4,
  },
  metricBoxVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },
  metricBoxLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EDE4",
  },
  metricRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricLabel: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  metricVal: { fontSize: 16, fontWeight: "800", color: "#1A1A2E" },

  /* ── Edit Profile ── */
  avatarEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatarContainerEdit: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "#E5DDD0",
  },
  avatarImgEdit: { width: "100%", height: "100%", borderRadius: 40 },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditButtons: { flex: 1, gap: 8 },
  changePhotoBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1A1A2E",
  },
  changePhotoText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  deletePhotoBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  deletePhotoText: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
  editForm: { gap: 12, marginBottom: 20 },
  inputGroup: { marginBottom: 12 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E5DDD0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "500",
  },
  editActionRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  saveBtn: { flex: 1 },
  saveBtnInner: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#8B6914",
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  cancelBtnEdit: { flex: 1 },
  cancelBtnInner: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    borderColor: "#E5DDD0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  cancelBtnEditText: { color: "#6B7280", fontSize: 15, fontWeight: "700" },
});
