import { Moneda } from './common';

export type TipoMedioPago = 'tarjeta_credito' | 'cuenta_bancaria' | 'cheque_certificado';
export type EstadoVerificacion = 'pendiente' | 'validado' | 'rechazado';

export interface MedioPago {
  id?: number;
  tipo?: TipoMedioPago;
  ultimos_digitos?: string;
  estadoVerificacion?: EstadoVerificacion;
  moneda?: Moneda;
  limiteReservado?: number;
  paisBanco?: string;
  esCuentaReceptora?: boolean;
}

export interface MedioPagoInput {
  tipo: TipoMedioPago;
  datos_encriptados: string;
  moneda: Moneda;
  limiteReservado?: number;
  paisBanco?: string;
  esCuentaReceptora?: boolean;
}

export interface MedioPagoUpdate {
  limiteReservado?: number;
  esCuentaReceptora?: boolean;
}

export interface Multa {
  id?: number;
  importe?: number;
  estado?: 'pendiente' | 'pagada';
  fechaLimite?: string;
  motivo?: string;
}

export interface MultaPagoRequest {
  multaId: number;
  medioPagoId: number;
}
