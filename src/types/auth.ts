// --- Registro ---
export interface RegistroPaso1 {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion: string;
  numeroPais: number;
  fotoFrente: string; // URI local del archivo
  fotoDorso: string;  // URI local del archivo
}

export interface RegistroPaso2 {
  token: string;
  password: string;
}

// --- Login ---
export interface LoginRequest {
  documento: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// --- Verificación y Recupero ---
export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
