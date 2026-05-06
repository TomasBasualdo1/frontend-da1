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

export const userService = {
  /** Obtener perfil autenticado */
  async getProfile(): Promise<Usuario> {
    const response = await api.get<Usuario>('/usuarios/me');
    return response.data;
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
    const response = await api.get<MedioPago[]>('/usuarios/me/medios-pago');
    return response.data;
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
    const response = await api.get<Multa[]>('/usuarios/me/multas');
    return response.data;
  },

  /** Pagar multa */
  async pagarMulta(data: MultaPagoRequest): Promise<void> {
    await api.post('/usuarios/me/multas/pagar', data);
  },

  /** Listar notificaciones */
  async getNotificaciones(): Promise<Notificacion[]> {
    const response = await api.get<Notificacion[]>('/usuarios/me/notificaciones');
    return response.data;
  },

  /** Marcar notificación como leída */
  async marcarNotificacionLeida(id: number): Promise<void> {
    await api.post(`/usuarios/me/notificaciones/${id}/leer`);
  },
};
