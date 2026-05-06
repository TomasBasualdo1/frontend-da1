import { Categoria, Moneda } from './common';

export interface SubastaListado {
  id: number;
  fecha: string;
  hora: string;
  estado: 'abierta' | 'cerrada';
  categoria: Categoria;
  ubicacion: string;
  moneda: Moneda;
}

export interface ItemCatalogo {
  id: number;
  descripcion: string;
  precioBase?: number;
  mejorOfertaActual?: number;
  limiteMinimo?: number;
  limiteMaximo?: number;
  subastado: 'si' | 'no';
  fotos: string[];
}

export interface ItemCatalogoPublico {
  id: number;
  descripcion: string;
  mejorOfertaActual?: number;
  subastado: 'si' | 'no';
  fotos: string[];
}

export interface SubastaDetalle extends SubastaListado {
  catalogo: ItemCatalogo[];
}

export interface SubastaDetallePublica extends SubastaListado {
  catalogo: ItemCatalogoPublico[];
}

export interface PujaRequest {
  importe: number;
}

export interface PujaResponse {
  pujaId: number;
  mejorOfertaActual: number;
  limiteMinimo: number;
  limiteMaximo: number;
  moneda: Moneda;
  esGanadoraParcial: boolean;
}

export interface Puja {
  id: number;
  usuarioId: number;
  itemId: number;
  importe: number;
  moneda: Moneda;
  fechaHora: string;
  esGanadoraParcial: boolean;
}

export interface Pago {
  id: number;
  subastaId: number;
  usuarioId: number;
  totalPujado: number;
  comision: number;
  costoEnvio: number;
  totalFinal: number;
  moneda: Moneda;
  modoEntrega: 'envio' | 'retiro';
  estado: 'pendiente' | 'pagado' | 'vencido';
  fechaLimitePago: string;
}

export interface PagoRequest {
  medioPagoId: number;
  modoEntrega: 'envio' | 'retiro';
  direccionEnvio?: string;
  aceptaPerderSeguro?: boolean;
}

export interface SesionSubasta {
  id: number;
  subastaId: number;
  usuarioId: number;
  estado: 'activa' | 'finalizada';
  fechaHoraInicio: string;
}
