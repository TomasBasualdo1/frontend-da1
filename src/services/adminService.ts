import api from './api';
import { Usuario, Categoria, Articulo, MedioPago } from '../types';

export interface UsuarioVerificacionInput {
  admitido: boolean;
  categoria?: Categoria;
  motivoRechazo?: string;
}

export interface ArticuloEvaluacionInput {
  estado: 'aprobado' | 'rechazado';
  motivoRechazo?: string;
  precioBasePropuesto?: number;
  comisionPropuesta?: number;
}

export interface MedioPagoVerificacionInput {
  estadoVerificacion: 'validado' | 'rechazado';
}

const normalizeUsuario = (data: any): Usuario => ({
  id: data?.id ?? data?.identificador,
  documento: data?.documento,
  nombre: data?.nombre,
  apellido: data?.apellido,
  email: data?.email,
  direccion: data?.direccion,
  telefono: data?.telefono ?? data?.telefono_contacto ?? data?.telefonoContacto,
  foto: data?.foto ?? data?.foto_url ?? data?.fotoUrl,
  fotoFrente: data?.fotoFrente ?? data?.foto_frente,
  fotoDorso: data?.fotoDorso ?? data?.foto_dorso,
  numeroPais: data?.numeroPais ?? data?.numeropais ?? data?.numero_pais,
  admitido: data?.admitido,
  estadoRegistro: data?.estadoRegistro ?? data?.estado_registro ?? data?.estadoregistro,
  categoria: data?.categoria,
  validatedPaymentDiversity: data?.validatedPaymentDiversity ?? data?.validatedpaymentdiversity ?? 0,
  multaActiva: data?.multaActiva ?? data?.multa_activa ?? data?.multaactiva,
  bloqueado: data?.bloqueado,
});

const normalizeArticulo = (data: any): Articulo => ({
  id: data?.id ?? data?.identificador,
  duenioId: data?.duenioId ?? data?.duenio_id,
  duenioNombre: data?.duenioNombre ?? data?.duenio_nombre,
  descripcion: data?.descripcion ?? data?.descripcioncompleta ?? data?.descripcioncatalogo,
  precioSugeridoUsuario: data?.precioSugeridoUsuario ?? data?.precio_sugerido_usuario,
  moneda: data?.moneda,
  precioBasePropuesto: data?.precioBasePropuesto ?? data?.precio_base_propuesto,
  comisionPropuesta: data?.comisionPropuesta ?? data?.comision_propuesta,
  tasacionAceptada: data?.tasacionAceptada ?? data?.tasacion_objeto,
  historia: data?.historia,
  artista: data?.artista,
  fechaCreacion: data?.fechaCreacion ?? data?.fecha_creacion,
  estado: data?.estado ?? data?.estado_evaluacion,
  motivoRechazo: data?.motivoRechazo ?? data?.motivo_rechazo,
  fechaEnvio: data?.fechaEnvio ?? data?.fecha_envio,
  fotos: data?.fotos ?? data?.imagenes,
  ubicacion: data?.ubicacion,
  seguro: data?.seguro,
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

export const adminService = {
  /** Listar usuarios con registro pendiente */
  async getPendingUsers(): Promise<Usuario[]> {
    const response = await api.get('/admin/usuarios/pendientes');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeUsuario);
  },

  /** Aprobar/rechazar un usuario */
  async verifyUser(id: number, data: UsuarioVerificacionInput): Promise<void> {
    await api.post(`/admin/usuarios/${id}/verificar`, data);
  },

  /** Listar todos los usuarios */
  async getAllUsers(): Promise<Usuario[]> {
    const response = await api.get('/admin/usuarios');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeUsuario);
  },

  /** Cambiar categoría de un usuario */
  async updateUserCategory(id: number, categoria: Categoria): Promise<void> {
    await api.patch(`/admin/usuarios/${id}/categoria`, { categoria });
  },

  /** Recalcular categoría de un usuario automáticamente */
  async recalculateUserCategory(id: number): Promise<{
    categoriaAnterior: string;
    categoriaNueva: string;
    motivo: string;
    upgraded: boolean;
  }> {
    const response = await api.post(`/admin/usuarios/${id}/recalcular-categoria`);
    return response.data;
  },

  /** Listar artículos consignados pendientes de evaluar */
  async getPendingArticles(): Promise<Articulo[]> {
    const response = await api.get('/admin/articulos/pendientes');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeArticulo);
  },

  /** Evaluar un artículo consignado */
  async evaluateArticle(id: number, data: ArticuloEvaluacionInput): Promise<void> {
    await api.post(`/admin/articulos/${id}/evaluar`, data);
  },

  /** Listar medios de pago pendientes de verificación */
  async getPendingPayments(): Promise<any[]> {
    const response = await api.get('/admin/medios-pago/pendientes');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map((item: any) => ({
      ...normalizeMedioPago(item),
      clienteNombre: item.clienteNombre,
    }));
  },

  /** Verificar medio de pago */
  async verifyPaymentMethod(id: number, data: MedioPagoVerificacionInput): Promise<void> {
    await api.post(`/admin/medios-pago/${id}/verificar`, data);
  },

  /** Listar subastadores disponibles */
  async getSubastadores(): Promise<any[]> {
    const response = await api.get('/admin/subastadores');
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Listar artículos aprobados y no catalogados */
  async getApprovedNonCatalogedArticles(): Promise<any[]> {
    const response = await api.get('/admin/articulos/aprobados-no-catalogados');
    return Array.isArray(response.data) ? response.data : [];
  },
};
