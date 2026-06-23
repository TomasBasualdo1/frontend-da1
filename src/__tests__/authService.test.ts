import { authService } from '../services/authService';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── login() ────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('devuelve el token cuando las credenciales son correctas', async () => {
      const tokenResponse = { access_token: 'eyJtoken123', token_type: 'bearer' };
      mockApi.post.mockResolvedValueOnce({ data: tokenResponse });

      const result = await authService.login({ documento: '12345678', password: 'password123' });

      expect(result).toEqual(tokenResponse);
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        documento: '12345678',
        password: 'password123',
      });
    });

    it('propaga el error 401 cuando la contraseña es incorrecta', async () => {
      const error = { response: { status: 401, data: { detail: 'Invalid credentials' } } };
      mockApi.post.mockRejectedValueOnce(error);

      await expect(
        authService.login({ documento: '12345678', password: 'wrongpass' })
      ).rejects.toEqual(error);
    });

    it('propaga el error 403 cuando el usuario no está aprobado', async () => {
      const error = {
        response: { status: 403, data: { detail: 'User registration not approved' } },
      };
      mockApi.post.mockRejectedValueOnce(error);

      await expect(
        authService.login({ documento: '12345678', password: 'password123' })
      ).rejects.toEqual(error);
    });

    it('propaga el error 403 cuando el usuario está bloqueado', async () => {
      const error = {
        response: { status: 403, data: { detail: 'User is blocked' } },
      };
      mockApi.post.mockRejectedValueOnce(error);

      await expect(
        authService.login({ documento: '12345678', password: 'password123' })
      ).rejects.toEqual(error);
    });
  });

  // ─── logout() ────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('llama al endpoint POST /auth/logout', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { message: 'Successfully logged out' } });

      await authService.logout();

      expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  // ─── getPaises() ─────────────────────────────────────────────────────────────

  describe('getPaises()', () => {
    it('devuelve el array de países cuando el backend responde correctamente', async () => {
      const paises = [
        { numero: 1, nombre: 'Argentina', capital: 'Buenos Aires' },
        { numero: 2, nombre: 'Uruguay', capital: 'Montevideo' },
      ];
      mockApi.get.mockResolvedValueOnce({ data: paises });

      const result = await authService.getPaises();

      expect(result).toEqual(paises);
      expect(mockApi.get).toHaveBeenCalledWith('/paises');
    });

    it('devuelve array vacío si el backend devuelve null', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const result = await authService.getPaises();

      expect(result).toEqual([]);
    });

    it('devuelve array vacío si el backend devuelve un objeto (no array)', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { error: 'unexpected' } });

      const result = await authService.getPaises();

      expect(result).toEqual([]);
    });
  });
});
