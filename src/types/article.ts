import { Seguro } from './common';

export interface ArticuloInput {
  descripcion: string;
  historia?: string;
  artista?: string;
  fechaCreacion?: string;
  fotos: string[];              // URIs de las imágenes (mínimo 6)
  documentacionOrigen?: string[];
  esPropietario: boolean;
  declaraOrigenLicito: boolean;
}

export interface Articulo {
  id?: number;
  duenioId?: number;
  duenioNombre?: string;
  descripcion?: string;
  precioBasePropuesto?: number;
  comisionPropuesta?: number;
  tasacionAceptada?: boolean | null;
  historia?: string;
  artista?: string;
  fechaCreacion?: string;
  estado?: 'pendiente' | 'en_inspeccion' | 'aprobado' | 'rechazado' | 'devuelto';
  motivoRechazo?: string | null;
  fechaEnvio?: string;
  fotos?: string[];
  ubicacion?: string;
  seguro?: Seguro;
  subastaId?: number | null;
  subastaFecha?: string | null;
  subastaHora?: string | null;
  subastaEstado?: 'abierta' | 'cerrada' | 'proxima' | null;
}
