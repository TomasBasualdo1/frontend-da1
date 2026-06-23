import { adminService } from '../services/adminService';
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

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getPendingUsers() ───────────────────────────────────────────────────────

  describe('getPendingUsers()', () => {
    it('normaliza los usuarios pendientes (snake_case → camelCase)', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            nombre: 'Pedro',
            apellido: 'Lopez',
            documento: '99887766',
            email: 'pedro@test.com',
            foto_frente: 'http://storage/frente.jpg',
            foto_dorso: 'http://storage/dorso.jpg',
            estado_registro: 'pendiente',
            bloqueado: false,
          },
        ],
      });

      const result = await adminService.getPendingUsers();

      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Pedro');
      expect(result[0].fotoFrente).toBe('http://storage/frente.jpg');
      expect(result[0].fotoDorso).toBe('http://storage/dorso.jpg');
      expect(result[0].estadoRegistro).toBe('pendiente');
    });

    it('devuelve array vacío si el backend no devuelve un array', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const result = await adminService.getPendingUsers();

      expect(result).toEqual([]);
    });
  });

  // ─── verifyUser() ────────────────────────────────────────────────────────────

  describe('verifyUser()', () => {
    it('aprueba un usuario con categoría inicial "comun"', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await adminService.verifyUser(5, { admitido: true, categoria: 'comun' });

      expect(mockApi.post).toHaveBeenCalledWith('/admin/usuarios/5/verificar', {
        admitido: true,
        categoria: 'comun',
      });
    });

    it('rechaza un usuario con motivo de rechazo', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await adminService.verifyUser(5, {
        admitido: false,
        motivoRechazo: 'Documentación inválida',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/admin/usuarios/5/verificar', {
        admitido: false,
        motivoRechazo: 'Documentación inválida',
      });
    });

    it('aprueba con categoría "platino" correctamente', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await adminService.verifyUser(7, { admitido: true, categoria: 'platino' });

      expect(mockApi.post).toHaveBeenCalledWith('/admin/usuarios/7/verificar', {
        admitido: true,
        categoria: 'platino',
      });
    });
  });

  // ─── getAllUsers() ────────────────────────────────────────────────────────────

  describe('getAllUsers()', () => {
    it('normaliza la lista completa de usuarios', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          { id: 10, nombre: 'Maria', apellido: 'Gomez', categoria: 'oro', bloqueado: false },
          { id: 11, nombre: 'Carlos', apellido: 'Ruiz', categoria: 'plata', bloqueado: true },
        ],
      });

      const result = await adminService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].categoria).toBe('oro');
      expect(result[1].bloqueado).toBe(true);
    });

    it('devuelve array vacío si el backend no devuelve un array', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const result = await adminService.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  // ─── updateUserCategory() ────────────────────────────────────────────────────

  describe('updateUserCategory()', () => {
    it('llama a PATCH con la categoría correcta', async () => {
      mockApi.patch.mockResolvedValueOnce({ data: {} });

      await adminService.updateUserCategory(7, 'platino');

      expect(mockApi.patch).toHaveBeenCalledWith('/admin/usuarios/7/categoria', {
        categoria: 'platino',
      });
    });

    it('funciona con todas las categorías válidas', async () => {
      const categorias = ['comun', 'especial', 'plata', 'oro', 'platino'] as const;

      for (const cat of categorias) {
        mockApi.patch.mockResolvedValueOnce({ data: {} });
        await adminService.updateUserCategory(1, cat);
        expect(mockApi.patch).toHaveBeenLastCalledWith('/admin/usuarios/1/categoria', {
          categoria: cat,
        });
      }
    });
  });

  // ─── getPendingArticles() ────────────────────────────────────────────────────

  describe('getPendingArticles()', () => {
    it('normaliza los artículos pendientes (snake_case → camelCase)', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            descripcion: 'Cuadro antiguo',
            precio_base_propuesto: 50000,
            comision_propuesta: 10,
            estado: 'pendiente',
            duenio_id: 42,
            duenio_nombre: 'Laura Martínez',
          },
        ],
      });

      const result = await adminService.getPendingArticles();

      expect(result).toHaveLength(1);
      expect(result[0].precioBasePropuesto).toBe(50000);
      expect(result[0].comisionPropuesta).toBe(10);
      expect(result[0].duenioId).toBe(42);
      expect(result[0].duenioNombre).toBe('Laura Martínez');
    });

    it('devuelve array vacío si el backend no devuelve un array', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });

      const result = await adminService.getPendingArticles();

      expect(result).toEqual([]);
    });
  });

  // ─── evaluateArticle() ───────────────────────────────────────────────────────

  describe('evaluateArticle()', () => {
    it('aprueba un artículo con precio base y comisión', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await adminService.evaluateArticle(3, {
        estado: 'aprobado',
        precioBasePropuesto: 80000,
        comisionPropuesta: 10,
      });

      expect(mockApi.post).toHaveBeenCalledWith('/admin/articulos/3/evaluar', {
        estado: 'aprobado',
        precioBasePropuesto: 80000,
        comisionPropuesta: 10,
      });
    });

    it('rechaza un artículo con motivo', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await adminService.evaluateArticle(4, {
        estado: 'rechazado',
        motivoRechazo: 'No cumple condiciones mínimas',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/admin/articulos/4/evaluar', {
        estado: 'rechazado',
        motivoRechazo: 'No cumple condiciones mínimas',
      });
    });
  });
});
