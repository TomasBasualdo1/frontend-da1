// Enumeraciones del sistema
export type Categoria = 'comun' | 'especial' | 'plata' | 'oro' | 'platino';
export type Moneda = 'ARS' | 'USD';

// Notificación del sistema
export interface Notificacion {
  id?: number;
  tipo?: 'pago' | 'subasta' | 'sistema';
  mensaje?: string;
  fechaHora?: string;
  leida?: boolean;
}

// Evento de streaming (SSE)
export interface PujaStreamData {
  itemId: number;
  usuarioId: number;
  importe: number;
  mejorOfertaActual: number;
  limiteMinimo: number;
  limiteMaximo: number;
  pujaId: number;
  moneda: Moneda;
  esGanadoraParcial: boolean;
}

export interface CierreStreamData {
  message: string;
  itemsCerrados: number;
}

export interface StreamEvent {
  type: 'puja' | 'item' | 'cierre';
  fechaHora: string;
  data: PujaStreamData | CierreStreamData | unknown;
}

// Seguro de artículo
export interface Seguro {
  poliza: string;
  compania: string;
  montoAsegurado: number;
}
