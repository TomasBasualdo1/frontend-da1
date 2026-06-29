import api from './api';
import { Articulo, ArticuloInput } from '../types';
import { Platform } from 'react-native';

const normalizeArticulo = (data: any): Articulo => ({
  id: data?.id ?? data?.identificador,
  descripcion: data?.descripcion ?? data?.descripcioncompleta ?? data?.descripcioncatalogo,
  precioSugeridoUsuario: data?.precioSugeridoUsuario ?? data?.precio_sugerido_usuario,
  moneda: data?.moneda,
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
  subastaId: data?.subastaId ?? data?.subasta_id,
  subastaFecha: data?.subastaFecha ?? data?.subasta_fecha,
  subastaHora: data?.subastaHora ?? data?.subasta_hora,
  subastaEstado: data?.subastaEstado ?? data?.subasta_estado,
});

const dedupeArticulosById = (items: Articulo[]): Articulo[] => {
  const seen = new Set<number>();
  const result: Articulo[] = [];

  for (const item of items) {
    if (item.id == null) {
      result.push(item);
      continue;
    }
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
};

export const articleService = {
  /** Publicar un artículo para subasta (multipart) */
  async publicar(data: ArticuloInput): Promise<Articulo> {
    const formData = new FormData();
    formData.append('descripcion', data.descripcion);
    if (data.historia) formData.append('historia', data.historia);
    if (data.artista) formData.append('artista', data.artista);
    if (data.fechaCreacion) formData.append('fechaCreacion', data.fechaCreacion);
    if (data.precioSugeridoUsuario != null) formData.append('precioSugeridoUsuario', String(data.precioSugeridoUsuario));
    if (data.moneda) formData.append('moneda', data.moneda);
    formData.append('esPropietario', String(data.esPropietario));
    formData.append('declaraOrigenLicito', String(data.declaraOrigenLicito));

    for (const [i, uri] of data.fotos.entries()) {
      const name = `foto_${i}.jpg`;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('fotos', blob, name);
      } else {
        formData.append('fotos', {
          uri,
          name,
          type: 'image/jpeg',
        } as unknown as Blob);
      }
    }

    if (data.documentacionOrigen) {
      for (const [i, uri] of data.documentacionOrigen.entries()) {
        const name = `doc_${i}.pdf`;
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          formData.append('documentacionOrigen', blob, name);
        } else {
          formData.append('documentacionOrigen', {
            uri,
            name,
            type: 'application/pdf',
          } as unknown as Blob);
        }
      }
    }

    const response = await api.post('/articulos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const articulo = normalizeArticulo(response.data);
    if (!articulo.id) {
      throw new Error('La API no devolvió el artículo creado.');
    }
    return articulo;
  },

  /** Listar artículos publicados por el usuario */
  async getMisPublicaciones(): Promise<Articulo[]> {
    const response = await api.get('/articulos/mis-publicaciones');
    const items = Array.isArray(response.data) ? response.data : [];
    return dedupeArticulosById(items.map(normalizeArticulo));
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
