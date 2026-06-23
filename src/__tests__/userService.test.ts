import { userService } from '../services/userService';
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

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getProfile() ────────────────────────────────────────────────────────────

  describe('getProfile()', () => {
    it('normaliza correctamente los campos en snake_case del backend', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: 42,
          documento: '12345678',
          nombre: 'Juan',
          apellido: 'Perez',
          email: 'juan@test.com',
          direccion: 'Calle 123',
          admitido: true,
          estado_registro: 'aprobado',
          categoria: 'comun',
          bloqueado: false,
          multa_activa: false,
        },
      });

      const user = await userService.getProfile();

      expect(user.id).toBe(42);
      expect(user.nombre).toBe('Juan');
      expect(user.estadoRegistro).toBe('aprobado');
      expect(user.multaActiva).toBe(false);
      expect(user.bloqueado).toBe(false);
    });

    it('normaliza "identificador" como "id" cuando el backend usa ese nombre', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { identificador: 99, nombre: 'Ana', apellido: 'García' },
      });

      const user = await userService.getProfile();

      expect(user.id).toBe(99);
    });

    it('normaliza "telefono_contacto" → "telefono"', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { id: 1, telefono_contacto: '1122334455' },
      });

      const user = await userService.getProfile();

      expect(user.telefono).toBe('1122334455');
    });

    it('normaliza "numero_pais" → "numeroPais"', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { id: 1, numero_pais: 54 },
      });

      const user = await userService.getProfile();

      expect(user.numeroPais).toBe(54);
    });

    // BUG DOCUMENTADO: /usuarios/me aún no está implementado y devuelve null.
    // normalizeUsuario(null) no crashea, pero deja el objeto con todos los campos undefined.
    // El AuthContext guarda este objeto y user.id === undefined en toda la sesión.
    it('NO CRASHEA cuando el backend devuelve null — pero user queda sin datos (bug)', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const user = await userService.getProfile();

      expect(user).toBeDefined();
      expect(user.id).toBeUndefined();
      expect(user.nombre).toBeUndefined();
      expect(user.estadoRegistro).toBeUndefined();
    });
  });

  // ─── getMediosPago() ─────────────────────────────────────────────────────────

  describe('getMediosPago()', () => {
    it('mapea los medios de pago normalizando ultimosDigitos', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            tipo: 'tarjeta',
            ultimosDigitos: '4242',
            estadoVerificacion: 'validado',
            moneda: 'ARS',
          },
        ],
      });

      const result = await userService.getMediosPago();

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('tarjeta');
      expect(result[0].ultimos_digitos).toBe('4242');
      expect(result[0].estadoVerificacion).toBe('validado');
    });

    it('devuelve array vacío si el backend devuelve null (endpoint no implementado)', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const result = await userService.getMediosPago();

      expect(result).toEqual([]);
    });

    it('devuelve array vacío si el backend devuelve un objeto en lugar de array', async () => {
      mockApi.get.mockResolvedValueOnce({ data: {} });

      const result = await userService.getMediosPago();

      expect(result).toEqual([]);
    });
  });

  // ─── getMultas() ─────────────────────────────────────────────────────────────

  describe('getMultas()', () => {
    it('normaliza las multas correctamente', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          { id: 1, importe: 5000, estado: 'pendiente', fecha_limite: '2026-07-01', motivo: 'Incumplimiento' },
        ],
      });

      const result = await userService.getMultas();

      expect(result).toHaveLength(1);
      expect(result[0].importe).toBe(5000);
      expect(result[0].fechaLimite).toBe('2026-07-01');
    });

    it('devuelve array vacío si el backend devuelve null (endpoint no implementado)', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const result = await userService.getMultas();

      expect(result).toEqual([]);
    });
  });

  // ─── getNotificaciones() ─────────────────────────────────────────────────────

  describe('getNotificaciones()', () => {
    it('normaliza las notificaciones (snake_case → camelCase)', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            tipo: 'info',
            mensaje: 'Nueva subasta disponible',
            fecha_hora: '2026-06-23T10:00:00Z',
            leida: false,
          },
        ],
      });

      const result = await userService.getNotificaciones();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].tipo).toBe('info');
      expect(result[0].mensaje).toBe('Nueva subasta disponible');
      expect(result[0].fechaHora).toBe('2026-06-23T10:00:00Z');
      expect(result[0].leida).toBe(false);
    });

    it('devuelve array vacío si el backend devuelve null', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const result = await userService.getNotificaciones();

      expect(result).toEqual([]);
    });
  });

  // ─── marcarNotificacionLeida() ───────────────────────────────────────────────

  describe('marcarNotificacionLeida()', () => {
    it('llama a POST /usuarios/me/notificaciones/:id/leer', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await userService.marcarNotificacionLeida(5);

      expect(mockApi.post).toHaveBeenCalledWith('/usuarios/me/notificaciones/5/leer');
    });
  });

  // ─── addMedioPago() ──────────────────────────────────────────────────────────

  describe('addMedioPago()', () => {
    it('llama a POST /usuarios/me/medios-pago con el body correcto', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      const mockInput = {
        tipo: 'tarjeta' as const,
        moneda: 'ARS' as const,
        esCuentaReceptora: false,
        paisBanco: 'AR',
      };

      await userService.addMedioPago(mockInput);

      expect(mockApi.post).toHaveBeenCalledWith('/usuarios/me/medios-pago', mockInput);
    });
  });
});
