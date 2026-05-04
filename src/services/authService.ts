import api from './api';
import {
  LoginRequest,
  TokenResponse,
  RegistroPaso1,
  RegistroPaso2,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';

export const authService = {
  /** Registro paso 1: datos personales + fotos DNI (multipart) */
  async registroPaso1(data: RegistroPaso1): Promise<void> {
    const formData = new FormData();
    formData.append('documento', data.documento);
    formData.append('nombre', data.nombre);
    formData.append('apellido', data.apellido);
    formData.append('email', data.email);
    formData.append('direccion', data.direccion);
    formData.append('numeroPais', String(data.numeroPais));
    if (data.telefono) formData.append('telefono', data.telefono);

    // Fotos del documento
    formData.append('fotoFrente', {
      uri: data.fotoFrente,
      name: 'frente.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    formData.append('fotoDorso', {
      uri: data.fotoDorso,
      name: 'dorso.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    await api.post('/auth/registro/paso1', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Registro paso 2: definir contraseña con token del email */
  async registroPaso2(data: RegistroPaso2): Promise<void> {
    await api.post('/auth/registro/paso2', data);
  },

  /** Login con documento y contraseña */
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  /** Solicitar recupero de contraseña */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await api.post('/auth/forgot-password', data);
  },

  /** Confirmar reset de contraseña */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/reset-password', data);
  },
};
