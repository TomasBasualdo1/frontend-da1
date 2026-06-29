import api from './api';
import {
  Usuario,
  UsuarioUpdate,
  UsuarioMetricas,
  MedioPago,
  MedioPagoInput,
  MedioPagoUpdate,
  Multa,
  MultaPagoRequest,
  Notificacion,
  PagoPendientePerfil,
} from '../types';

const normalizeUsuario = (data: any): Usuario => ({
  id: data?.id ?? data?.identificador,
  documento: data?.documento,
  nombre: data?.nombre,
  apellido: data?.apellido,
  email: data?.email,
  direccion: data?.direccion,
  telefono: data?.telefono ?? data?.telefono_contacto ?? data?.telefonoContacto,
  foto: data?.foto ?? data?.foto_url ?? data?.fotoUrl,
  numeroPais: data?.numeroPais ?? data?.numeropais ?? data?.numero_pais,
  admitido: data?.admitido,
  estadoRegistro: data?.estadoRegistro ?? data?.estado_registro ?? data?.estadoregistro,
  categoria: data?.categoria,
  validatedPaymentDiversity: data?.validatedPaymentDiversity ?? data?.validatedpaymentdiversity ?? 0,
  multaActiva: data?.multaActiva ?? data?.multa_activa ?? data?.multaactiva,
  bloqueado: data?.bloqueado,
});

const normalizeMedioPago = (data: any): MedioPago => ({
  id: data?.id ?? data?.identificador,
  tipo: data?.tipo,
  ultimos_digitos: data?.ultimos_digitos ?? data?.ultimosDigitos,
  estadoVerificacion: data?.estadoVerificacion ?? data?.estado_verificacion,
  moneda: data?.moneda,
  limiteReservado: data?.limiteReservado ?? data?.limite_reservado,
  paisBanco: data?.paisBanco ?? data?.pais_banco,
  esCuentaReceptora: data?.esCuentaReceptora ?? data?.es_cuenta_receptora,
});

const normalizeMulta = (data: any): Multa => ({
  id: data?.id ?? data?.identificador,
  importe: data?.importe,
  estado: data?.estado,
  fechaLimite: data?.fechaLimite ?? data?.fecha_limite,
  motivo: data?.motivo,
});

const normalizeNotificacion = (data: any): Notificacion => ({
  id: data?.id ?? data?.identificador,
  tipo: data?.tipo,
  mensaje: data?.mensaje,
  fechaHora: data?.fechaHora ?? data?.fecha_hora,
  leida: data?.leida,
});

const normalizeNumber = (value: any): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePagoPendiente = (data: any): PagoPendientePerfil => ({
  id: Number(data?.id ?? data?.identificador ?? 0),
  subastaId: Number(data?.subastaId ?? data?.subasta_id ?? 0),
  usuarioId: Number(data?.usuarioId ?? data?.cliente_id ?? data?.usuario_id ?? 0),
  subastaFecha: data?.subastaFecha ?? data?.subasta_fecha ?? null,
  subastaHora: data?.subastaHora ?? data?.subasta_hora ?? null,
  subastaUbicacion: data?.subastaUbicacion ?? data?.subasta_ubicacion ?? null,
  totalPujado: normalizeNumber(data?.totalPujado ?? data?.total_pujado),
  comision: normalizeNumber(data?.comision),
  costoEnvio: normalizeNumber(data?.costoEnvio ?? data?.costo_envio),
  totalFinal: normalizeNumber(data?.totalFinal ?? data?.total_final),
  moneda: data?.moneda === 'ARS' ? 'ARS' : 'USD',
  modoEntrega: data?.modoEntrega ?? data?.modo_entrega ?? null,
  estado: data?.estado === 'pagado' || data?.estado === 'vencido' ? data.estado : 'pendiente',
  fechaLimitePago: data?.fechaLimitePago ?? data?.fecha_limite_pago ?? '',
  items: Array.isArray(data?.items)
    ? data.items.map((item: any) => ({
        itemId: item?.itemId ?? item?.item_id ?? null,
        productoId: item?.productoId ?? item?.producto_id ?? null,
        descripcion: item?.descripcion ?? null,
        importe: item?.importe == null ? null : normalizeNumber(item.importe),
        comision: item?.comision == null ? null : normalizeNumber(item.comision),
      }))
    : [],
});

export const userService = {
  /** Obtener perfil autenticado */
  async getProfile(): Promise<Usuario> {
    const response = await api.get('/usuarios/me');
    return normalizeUsuario(response.data);
  },

  /** Actualizar perfil */
  async updateProfile(data: UsuarioUpdate): Promise<void> {
    const formData = new FormData();
    if (data.nombre) formData.append('nombre', data.nombre);
    if (data.apellido) formData.append('apellido', data.apellido);
    if (data.direccion) formData.append('direccion', data.direccion);
    if (data.telefono) formData.append('telefono', data.telefono);
    if (data.foto) {
      formData.append('foto', {
        uri: data.foto,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
    }
    await api.patch('/usuarios/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Eliminar foto de perfil */
  async deleteAvatar(): Promise<void> {
    await api.delete('/usuarios/me/foto');
  },

  /** Listar medios de pago */
  async getMediosPago(): Promise<MedioPago[]> {
    const response = await api.get('/usuarios/me/medios-pago');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeMedioPago);
  },

  /** Agregar medio de pago */
  async addMedioPago(data: MedioPagoInput): Promise<void> {
    await api.post('/usuarios/me/medios-pago', data);
  },

  /** Actualizar medio de pago */
  async updateMedioPago(id: number, data: MedioPagoUpdate): Promise<void> {
    await api.patch(`/usuarios/me/medios-pago/${id}`, data);
  },

  /** Eliminar medio de pago */
  async deleteMedioPago(id: number): Promise<void> {
    await api.delete(`/usuarios/me/medios-pago/${id}`);
  },

  /** Obtener métricas del usuario */
  async getMetricas(): Promise<UsuarioMetricas> {
    const response = await api.get<UsuarioMetricas>('/usuarios/me/metricas');
    return response.data;
  },

  /** Listar pagos pendientes de subastas ganadas */
  async getPagosPendientes(): Promise<PagoPendientePerfil[]> {
    const response = await api.get('/usuarios/me/pagos-pendientes');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizePagoPendiente);
  },

  /** Listar multas activas */
  async getMultas(): Promise<Multa[]> {
    const response = await api.get('/usuarios/me/multas');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeMulta);
  },

  /** Pagar multa */
  async pagarMulta(data: MultaPagoRequest): Promise<void> {
    await api.post('/usuarios/me/multas/pagar', data);
  },

  /** Listar notificaciones */
  async getNotificaciones(): Promise<Notificacion[]> {
    const response = await api.get('/usuarios/me/notificaciones');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeNotificacion);
  },

  /** Marcar notificación como leída */
  async marcarNotificacionLeida(id: number): Promise<void> {
    await api.post(`/usuarios/me/notificaciones/${id}/leer`);
  },
};
