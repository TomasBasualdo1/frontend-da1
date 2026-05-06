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
