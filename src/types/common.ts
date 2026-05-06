// Enumeraciones del sistema
export type Categoria = 'comun' | 'especial' | 'plata' | 'oro' | 'platino';
export type Moneda = 'ARS' | 'USD';

// Notificación del sistema
export interface Notificacion {
  id: number;
  tipo: 'pago' | 'subasta' | 'sistema';
  mensaje: string;
  fechaHora: string;
  leida: boolean;
}

// Evento de streaming (SSE)
export interface StreamEvent {
  type: 'puja' | 'item';
  fechaHora: string;
  data: unknown;
}

// Seguro de artículo
export interface Seguro {
  poliza: string;
  compania: string;
  montoAsegurado: number;
}
