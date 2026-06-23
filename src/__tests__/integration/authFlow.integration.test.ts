/**
 * Tests de INTEGRACIÓN — capa de servicio + interceptores Axios + storage
 *
 * Qué corre SIN mocks (módulos reales):
 *   - api.ts           (con sus interceptores request/response)
 *   - storage.ts       (lógica de selección web vs nativo)
 *   - authService.ts   (login, logout)
 *   - auctionService.ts (getSubastas)
 *   - articleService.ts (getMisPublicaciones)
 *
 * Qué sí está mockeado:
 *   - La red (axios-mock-adapter reemplaza el adaptador HTTP de Axios)
 *   - expo-secure-store (reemplazado por un Map en memoria)
 *   - react-native/Platform (fijado en 'ios' para que storage use SecureStore)
 */

import MockAdapter from 'axios-mock-adapter';
import api from '../../services/api';
import { authService } from '../../services/authService';
import { auctionService } from '../../services/auctionService';
import { articleService } from '../../services/articleService';
import { setItemAsync, deleteItemAsync, getItemAsync } from '../../utils/storage';

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

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

// ── Mock de red (HTTP) ───────────────────────────────────────────────────────
const httpMock = new MockAdapter(api);

describe('Integración: flujo de token y autenticación', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    httpMock.reset();
  });

  afterAll(() => httpMock.restore());

  // ── Inyección del token ────────────────────────────────────────────────────

  describe('inyección del token Bearer', () => {
    it('con token en storage, el request lleva Authorization: Bearer', async () => {
      store['access_token'] = 'tok-abc';
      httpMock.onGet('/subastas').reply(200, []);

      await auctionService.getSubastas();

      const req = httpMock.history.get.find((r) => r.url === '/subastas');
      expect(req?.headers?.Authorization).toBe('Bearer tok-abc');
    });

    it('sin token en storage, el request NO lleva Authorization', async () => {
      httpMock.onGet('/subastas').reply(200, []);

      await auctionService.getSubastas();

      const req = httpMock.history.get.find((r) => r.url === '/subastas');
      expect(req?.headers?.Authorization).toBeUndefined();
    });

    it('el token se inyecta en cualquier servicio, no solo en subastas', async () => {
      store['access_token'] = 'tok-xyz';
      httpMock.onGet('/articulos/mis-publicaciones').reply(200, []);

      await articleService.getMisPublicaciones();

      const req = httpMock.history.get.find((r) =>
        r.url === '/articulos/mis-publicaciones',
      );
      expect(req?.headers?.Authorization).toBe('Bearer tok-xyz');
    });
  });

  // ── Manejo del 401 ────────────────────────────────────────────────────────

  describe('respuesta 401 — limpieza automática del token', () => {
    it('una respuesta 401 borra el token del storage', async () => {
      store['access_token'] = 'token-viejo';
      httpMock.onGet('/subastas').reply(401);

      await expect(auctionService.getSubastas()).rejects.toBeDefined();

      expect(store['access_token']).toBeUndefined();
    });

    it('después de un 401, el request siguiente ya no lleva token', async () => {
      store['access_token'] = 'token-viejo';

      httpMock.onGet('/subastas').replyOnce(401);
      httpMock.onGet('/subastas').reply(200, []);

      // Primera llamada → 401 → borra token
      await expect(auctionService.getSubastas()).rejects.toBeDefined();

      // Segunda llamada → sin token en storage → sin Authorization
      await auctionService.getSubastas();

      const reqs = httpMock.history.get.filter((r) => r.url === '/subastas');
      expect(reqs).toHaveLength(2);
      expect(reqs[1].headers?.Authorization).toBeUndefined();
    });

    it('errores 500 no borran el token', async () => {
      store['access_token'] = 'token-valido';
      httpMock.onGet('/subastas').reply(500);

      await expect(auctionService.getSubastas()).rejects.toBeDefined();

      expect(store['access_token']).toBe('token-valido');
    });
  });

  // ── Flujo completo ─────────────────────────────────────────────────────────

  describe('flujo completo: almacenar token → usar API → expirar', () => {
    it('simula el ciclo: token guardado → request autenticado → 401 → token limpiado', async () => {
      // 1. Simula lo que hace AuthContext después del login: guarda el token
      await setItemAsync('access_token', 'tok-completo');
      expect(store['access_token']).toBe('tok-completo');

      // 2. Primer request: va con token
      httpMock.onGet('/subastas').replyOnce(200, []);
      await auctionService.getSubastas();
      const reqAutenticado = httpMock.history.get[0];
      expect(reqAutenticado.headers?.Authorization).toBe('Bearer tok-completo');

      // 3. Token expira → server devuelve 401
      httpMock.onGet('/subastas').replyOnce(401);
      await expect(auctionService.getSubastas()).rejects.toBeDefined();

      // 4. Token fue borrado por el interceptor
      const tokenDespues = await getItemAsync('access_token');
      expect(tokenDespues).toBeNull();
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('llama al endpoint de logout en el servidor', async () => {
      store['access_token'] = 'tok-abc';
      httpMock.onPost('/auth/logout').reply(200);

      await authService.logout();

      expect(httpMock.history.post.some((r) => r.url === '/auth/logout')).toBe(true);
    });

    it('el request de logout lleva el token como Authorization', async () => {
      store['access_token'] = 'tok-logout';
      httpMock.onPost('/auth/logout').reply(200);

      await authService.logout();

      const req = httpMock.history.post.find((r) => r.url === '/auth/logout');
      expect(req?.headers?.Authorization).toBe('Bearer tok-logout');
    });
  });
});
