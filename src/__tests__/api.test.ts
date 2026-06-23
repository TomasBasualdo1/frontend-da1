import api from '../services/api';
import * as storage from '../utils/storage';

jest.mock('../utils/storage', () => ({
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

// Acceso directo a los handlers registrados en api.ts
// Axios v1 guarda cada interceptor como { fulfilled, rejected } en un array interno
function getRequestFulfilled() {
  const handlers = (api.interceptors.request as any).handlers;
  return handlers.find(Boolean).fulfilled as (config: any) => Promise<any>;
}

function getResponseFulfilled() {
  const handlers = (api.interceptors.response as any).handlers;
  return handlers.find(Boolean).fulfilled as (response: any) => any;
}

function getResponseRejected() {
  const handlers = (api.interceptors.response as any).handlers;
  return handlers.find(Boolean).rejected as (error: any) => Promise<any>;
}

describe('API — Interceptores de Axios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.deleteItemAsync.mockResolvedValue(undefined);
  });

  // ─── Interceptor de request ───────────────────────────────────────────────

  describe('interceptor de request', () => {
    it('agrega Authorization: Bearer cuando hay token en storage', async () => {
      mockStorage.getItemAsync.mockResolvedValueOnce('abc123');

      const config = { headers: {} as Record<string, string> };
      const result = await getRequestFulfilled()(config);

      expect(mockStorage.getItemAsync).toHaveBeenCalledWith('access_token');
      expect(result.headers.Authorization).toBe('Bearer abc123');
    });

    it('no agrega Authorization cuando no hay token (usuario no autenticado)', async () => {
      mockStorage.getItemAsync.mockResolvedValueOnce(null);

      const config = { headers: {} as Record<string, string> };
      const result = await getRequestFulfilled()(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('preserva los headers existentes al agregar el token', async () => {
      mockStorage.getItemAsync.mockResolvedValueOnce('mi-token');

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' } as Record<string, string>,
      };
      const result = await getRequestFulfilled()(config);

      expect(result.headers['Content-Type']).toBe('multipart/form-data');
      expect(result.headers.Authorization).toBe('Bearer mi-token');
    });

    it('propaga el error si storage falla (el request queda cancelado)', async () => {
      mockStorage.getItemAsync.mockRejectedValueOnce(new Error('SecureStore no disponible'));

      const config = { headers: {} as Record<string, string> };

      await expect(getRequestFulfilled()(config)).rejects.toThrow('SecureStore no disponible');
    });
  });

  // ─── Interceptor de response ──────────────────────────────────────────────

  describe('interceptor de response', () => {
    it('pasa la respuesta exitosa sin modificarla', () => {
      const response = { data: { id: 1, nombre: 'Juan' }, status: 200 };
      const result = getResponseFulfilled()(response);
      expect(result).toEqual(response);
    });

    it('borra el token de storage cuando recibe 401', async () => {
      const error = { response: { status: 401 } };

      await expect(getResponseRejected()(error)).rejects.toEqual(error);

      expect(mockStorage.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(mockStorage.deleteItemAsync).toHaveBeenCalledTimes(1);
    });

    it('rechaza el error 401 para que los callers puedan manejarlo', async () => {
      const error = { response: { status: 401, data: { detail: 'Token expirado' } } };

      await expect(getResponseRejected()(error)).rejects.toEqual(error);
    });

    it('NO borra el token cuando recibe 403 (prohibido, no expirado)', async () => {
      const error = { response: { status: 403 } };

      await expect(getResponseRejected()(error)).rejects.toEqual(error);
      expect(mockStorage.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('NO borra el token cuando recibe 500 (error de servidor)', async () => {
      const error = { response: { status: 500 } };

      await expect(getResponseRejected()(error)).rejects.toEqual(error);
      expect(mockStorage.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('NO borra el token en errores de red (sin campo response)', async () => {
      const error = { message: 'Network Error', request: {} };

      await expect(getResponseRejected()(error)).rejects.toEqual(error);
      expect(mockStorage.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
