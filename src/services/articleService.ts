import api from './api';
import { Articulo, ArticuloInput } from '../types';

const normalizeArticulo = (data: any): Articulo => ({
  id: data?.id ?? data?.identificador,
  descripcion: data?.descripcion ?? data?.descripcioncompleta ?? data?.descripcioncatalogo,
  precioBasePropuesto: data?.precioBasePropuesto ?? data?.precio_base_propuesto,
  comisionPropuesta: data?.comisionPropuesta ?? data?.comision_propuesta,
  tasacionAceptada: data?.tasacionAceptada ?? data?.tasacion_aceptada,
  historia: data?.historia,
  artista: data?.artista,
  fechaCreacion: data?.fechaCreacion ?? data?.fecha_creacion ?? data?.fecha,
  estado: data?.estado ?? data?.estado_evaluacion,
  motivoRechazo: data?.motivoRechazo ?? data?.motivo_rechazo,
  fechaEnvio: data?.fechaEnvio ?? data?.fecha_envio,
  fotos: data?.fotos ?? data?.imagenes,
  ubicacion: data?.ubicacion,
  seguro: data?.seguro,
});

export const articleService = {
  /** Publicar un artículo para subasta (multipart) */
  async publicar(data: ArticuloInput): Promise<void> {
    const formData = new FormData();
    formData.append('descripcion', data.descripcion);
    if (data.historia) formData.append('historia', data.historia);
    if (data.artista) formData.append('artista', data.artista);
    if (data.fechaCreacion) formData.append('fechaCreacion', data.fechaCreacion);
    formData.append('esPropietario', String(data.esPropietario));
    formData.append('declaraOrigenLicito', String(data.declaraOrigenLicito));

    data.fotos.forEach((uri, i) => {
      formData.append('fotos', {
        uri,
        name: `foto_${i}.jpg`,
        type: 'image/jpeg',
      } as unknown as Blob);
    });

    if (data.documentacionOrigen) {
      data.documentacionOrigen.forEach((uri, i) => {
        formData.append('documentacionOrigen', {
          uri,
          name: `doc_${i}.pdf`,
          type: 'application/pdf',
        } as unknown as Blob);
      });
    }

    await api.post('/articulos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Listar artículos publicados por el usuario */
  async getMisPublicaciones(): Promise<Articulo[]> {
    const response = await api.get('/articulos/mis-publicaciones');
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeArticulo);
  },

  /** Ver detalle de un artículo */
  async getDetalle(id: number): Promise<Articulo> {
    const response = await api.get(`/articulos/${id}`);
    return normalizeArticulo(response.data);
  },

  /** Aceptar o rechazar tasación */
  async aceptarTasacion(id: number, acepta: boolean): Promise<void> {
    await api.post(`/articulos/${id}/aceptar-tasacion`, { acepta });
  },

  /** Solicitar aumento de cobertura del seguro */
  async aumentarSeguro(id: number, montoNuevo: number): Promise<void> {
    await api.post(`/articulos/${id}/seguro/aumentar`, { montoNuevo });
  },
};
