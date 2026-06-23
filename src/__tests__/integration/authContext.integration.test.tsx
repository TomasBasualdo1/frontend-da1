/**
 * Tests de INTEGRACIÓN — AuthContext + servicios + interceptores + storage
 *
 * Qué corre SIN mocks (módulos reales):
 *   - AuthContext.tsx  (useState, useEffect, login, logout, refreshUser)
 *   - authService.ts   (login, logout)
 *   - userService.ts   (getProfile)
 *   - api.ts           (interceptores request/response)
 *   - storage.ts       (set/get/delete token)
 *
 * Qué sí está mockeado:
 *   - La red (axios-mock-adapter)
 *   - expo-secure-store (Map en memoria)
 *
 * IMPORTANTE: renderHook en @testing-library/react-native v14 es async.
 * Siempre debe usarse con `await`. result.current se setea vía useEffect,
 * por lo que también se necesita waitFor para cualquier estado post-render.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import api from '../../services/api';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// ── SecureStore en memoria ───────────────────────────────────────────────────
const store: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  deleteItemAsync: jest.fn((key: string) => {
    delete store[key];
    return Promise.resolve();
  }),
}));

// ── Mock de red ──────────────────────────────────────────────────────────────
const httpMock = new MockAdapter(api);

// ── Datos de prueba ──────────────────────────────────────────────────────────
const usuarioMock = { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com' };
const tokenMock = 'tok-integracion';

// ── Wrapper para renderHook ──────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Integración: AuthContext', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    httpMock.reset();
  });

  afterAll(() => httpMock.restore());

  // ── Estado inicial ─────────────────────────────────────────────────────────

  describe('estado inicial (montaje del provider)', () => {
    it('sin token almacenado: isLoading pasa a false, no autenticado', async () => {
      const { result } = await renderHook(() => useAuth(), { wrapper });

      // resultado inicial (antes de que corra el useEffect de loadToken)
      await waitFor(() => expect(result.current).toBeDefined());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('con token almacenado: carga el perfil y marca autenticado', async () => {
      store['access_token'] = tokenMock;
      httpMock.onGet('/usuarios/me').reply(200, usuarioMock);

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current?.isAuthenticated).toBe(true));

      expect(result.current.token).toBe(tokenMock);
      expect(result.current.user?.nombre).toBe('Juan');
    });

    it('con token pero perfil devuelve 401: borra el token y queda no autenticado', async () => {
      store['access_token'] = 'token-expirado';
      httpMock.onGet('/usuarios/me').reply(401);

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current?.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);
      expect(store['access_token']).toBeUndefined();
    });

    it('con token pero perfil devuelve error de red: borra el token y queda no autenticado', async () => {
      store['access_token'] = 'token-valido';
      httpMock.onGet('/usuarios/me').networkError();

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current?.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);
      expect(store['access_token']).toBeUndefined();
    });
  });

  // ── Login ──────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('credenciales correctas: guarda el token, carga el perfil y marca autenticado', async () => {
      httpMock.onPost('/auth/login').reply(200, {
        access_token: 'nuevo-token',
        token_type: 'bearer',
      });
      httpMock.onGet('/usuarios/me').reply(200, usuarioMock);

      const { result } = await renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current?.isLoading).toBe(false));

      await act(async () => {
        await result.current.login({ documento: '12345678', password: 'pass123' });
      });

      expect(store['access_token']).toBe('nuevo-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('nuevo-token');
      expect(result.current.user?.nombre).toBe('Juan');
    });

    it('credenciales incorrectas (401): NO guarda token, sigue no autenticado', async () => {
      httpMock.onPost('/auth/login').reply(401);

      const { result } = await renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current?.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.login({ documento: 'bad', password: 'bad' });
        }),
      ).rejects.toBeDefined();

      expect(store['access_token']).toBeUndefined();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('borra el token del storage y desmarca autenticado', async () => {
      store['access_token'] = tokenMock;
      httpMock.onGet('/usuarios/me').reply(200, usuarioMock);
      httpMock.onPost('/auth/logout').reply(200);

      const { result } = await renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current?.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(store['access_token']).toBeUndefined();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('si el endpoint de logout falla (red), igual limpia el estado local', async () => {
      store['access_token'] = tokenMock;
      httpMock.onGet('/usuarios/me').reply(200, usuarioMock);
      httpMock.onPost('/auth/logout').networkError();

      const { result } = await renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current?.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(store['access_token']).toBeUndefined();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ── refreshUser ────────────────────────────────────────────────────────────

  describe('refreshUser()', () => {
    it('actualiza los datos del usuario sin cambiar el token', async () => {
      store['access_token'] = tokenMock;
      httpMock.onGet('/usuarios/me').replyOnce(200, usuarioMock);

      const { result } = await renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current?.isAuthenticated).toBe(true));

      const usuarioActualizado = { ...usuarioMock, nombre: 'Juan Actualizado' };
      httpMock.onGet('/usuarios/me').reply(200, usuarioActualizado);

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user?.nombre).toBe('Juan Actualizado');
      expect(result.current.token).toBe(tokenMock);
    });

    it('si refreshUser falla, mantiene el estado anterior sin errores', async () => {
      store['access_token'] = tokenMock;
      httpMock.onGet('/usuarios/me').replyOnce(200, usuarioMock);

      const { result } = await renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current?.isAuthenticated).toBe(true));

      httpMock.onGet('/usuarios/me').networkError();

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.nombre).toBe('Juan');
    });
  });
});
