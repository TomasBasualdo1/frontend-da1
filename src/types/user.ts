import { Categoria } from './common';

export interface Usuario {
  id?: number;
  documento?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  direccion?: string;
  telefono?: string;
  foto?: string;
  numeroPais?: number;
  admitido?: 'si' | 'no';
  estadoRegistro?: 'pendiente' | 'aprobado' | 'rechazado';
  categoria?: Categoria;
  validatedPaymentDiversity?: number;
  multaActiva?: boolean;
  bloqueado?: boolean;
  fotoFrente?: string;
  fotoDorso?: string;
}

export interface UsuarioUpdate {
  nombre?: string;
  apellido?: string;
  direccion?: string;
  telefono?: string;
  foto?: string;
}

export interface UsuarioMetricas {
  totalSubastasParticipadas: number;
  totalSubastasGanadas: number;
  porcentajeExito: number;
  totalPujasRealizadas: number;
  montoTotalOfertado: number;
  montoTotalPagado: number;
  categoriasParticipadas: Categoria[];
  ultimaParticipacion: string;
}
