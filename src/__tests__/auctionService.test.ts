import { auctionService } from '../services/auctionService';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    defaults: { baseURL: 'http://localhost:8000' },
  },
}));

// storage se importa en auctionService para el SSE; lo mockeamos para aislar
jest.mock('../utils/storage', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('auctionService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── getPublicas ──────────────────────────────────────────────────────────

  describe('getPublicas()', () => {
    it('normaliza el array y convierte id de string a número', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [{
          id: '10', fecha: '2026-07-01', hora: '18:00:00',
          estado: 'abierta', categoria: 'oro', ubicacion: 'CABA', moneda: 'ARS',
        }],
      });

      const result = await auctionService.getPublicas();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(10);
      expect(result[0].categoria).toBe('oro');
      expect(result[0].moneda).toBe('ARS');
    });

    it('devuelve [] cuando el backend responde con null', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });
      expect(await auctionService.getPublicas()).toEqual([]);
    });

    it('devuelve [] cuando el backend responde con un objeto (no array)', async () => {
      mockApi.get.mockResolvedValueOnce({ data: {} });
      expect(await auctionService.getPublicas()).toEqual([]);
    });

    // normalizeCategoria — rama inválida
    it('normaliza categoria inválida a "comun"', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [{ id: 1, estado: 'abierta', categoria: 'vip', moneda: 'ARS' }],
      });

      const [subasta] = await auctionService.getPublicas();
      expect(subasta.categoria).toBe('comun');
    });

    // normalizeMoneda — rama inválida
    it('normaliza moneda inválida a "USD"', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [{ id: 1, estado: 'abierta', categoria: 'comun', moneda: 'EUR' }],
      });

      const [subasta] = await auctionService.getPublicas();
      expect(subasta.moneda).toBe('USD');
    });

    // estado desconocido → "abierta" (default del ternario)
    it('normaliza estado desconocido a "abierta"', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [{ id: 1, estado: 'en_curso', categoria: 'comun', moneda: 'ARS' }],
      });

      const [subasta] = await auctionService.getPublicas();
      expect(subasta.estado).toBe('abierta');
    });
  });

  // ─── getPublicaDetalle ────────────────────────────────────────────────────

  describe('getPublicaDetalle()', () => {
    it('NO incluye campos privados (precioBase, limiteMinimo, limiteMaximo) en el catálogo', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: 5, fecha: '2026-07-01', hora: '18:00:00',
          estado: 'abierta', categoria: 'comun', ubicacion: '', moneda: 'ARS',
          catalogo: [{
            id: 1, descripcion: 'Cuadro Berni',
            precioBase: 5000, limiteMinimo: 500, limiteMaximo: 100000,
            mejorOfertaActual: 0, subastado: 'no', fotos: [],
          }],
        },
      });

      const result = await auctionService.getPublicaDetalle(5);

      expect(result.catalogo[0]).not.toHaveProperty('precioBase');
      expect(result.catalogo[0]).not.toHaveProperty('limiteMinimo');
      expect(result.catalogo[0]).not.toHaveProperty('limiteMaximo');
    });

    it('devuelve catálogo vacío cuando la respuesta no trae catalogo', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { id: 5, estado: 'abierta', categoria: 'comun', moneda: 'ARS' },
      });

      const result = await auctionService.getPublicaDetalle(5);
      expect(result.catalogo).toEqual([]);
    });
  });

  // ─── getDetalle ───────────────────────────────────────────────────────────

  describe('getDetalle()', () => {
    it('SÍ incluye campos privados y los convierte de string a número', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: 7, fecha: '2026-07-01', hora: '18:00:00',
          estado: 'abierta', categoria: 'plata', ubicacion: '', moneda: 'USD',
          catalogo: [{
            id: 2, descripcion: 'Escultura',
            precioBase: '1500', limiteMinimo: '100', limiteMaximo: '50000',
            subastado: false, fotos: [],
          }],
        },
      });

      const result = await auctionService.getDetalle(7);
      const item = result.catalogo[0];

      expect(item.precioBase).toBe(1500);
      expect(item.limiteMinimo).toBe(100);
      expect(item.limiteMaximo).toBe(50000);
    });

    // normalizeNumber — rama string vacío → undefined → no se incluye en el objeto
    it('no incluye precioBase cuando el backend lo envía vacío', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: 7, estado: 'abierta', categoria: 'comun', moneda: 'ARS',
          catalogo: [{ id: 2, descripcion: 'Item', precioBase: '', subastado: 'no', fotos: [] }],
        },
      });

      const result = await auctionService.getDetalle(7);
      expect(result.catalogo[0].precioBase).toBeUndefined();
    });

    // normalizeSubastado — boolean → "si" / "no"
    it('normaliza subastado: true → "si", false → "no"', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: 7, estado: 'abierta', categoria: 'comun', moneda: 'ARS',
          catalogo: [
            { id: 1, descripcion: 'A', subastado: true,  fotos: [] },
            { id: 2, descripcion: 'B', subastado: false, fotos: [] },
          ],
        },
      });

      const result = await auctionService.getDetalle(7);
      expect(result.catalogo[0].subastado).toBe('si');
      expect(result.catalogo[1].subastado).toBe('no');
    });

    // normalizeFotos — filtra nulls del array
    it('normaliza fotos: filtra nulls y preserva strings válidos', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: 7, estado: 'abierta', categoria: 'comun', moneda: 'ARS',
          catalogo: [{
            id: 1, descripcion: 'A', subastado: 'no',
            fotos: ['url1', null, 'url2', null],
          }],
        },
      });

      const result = await auctionService.getDetalle(7);
      expect(result.catalogo[0].fotos).toEqual(['url1', 'url2']);
    });

    // normalizeFotos — string suelto (no array) → array de un elemento
    it('normaliza fotos: string suelto → array de un elemento', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: 7, estado: 'abierta', categoria: 'comun', moneda: 'ARS',
          catalogo: [{ id: 1, descripcion: 'A', subastado: 'no', fotos: 'url-unica' }],
        },
      });

      const result = await auctionService.getDetalle(7);
      expect(result.catalogo[0].fotos).toEqual(['url-unica']);
    });
  });

  // ─── pujar ────────────────────────────────────────────────────────────────

  describe('pujar()', () => {
    it('llama al endpoint correcto con el importe', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          pujaId: 1, mejorOfertaActual: 1500,
          limiteMinimo: 100, limiteMaximo: 50000,
          moneda: 'ARS', esGanadoraParcial: true,
        },
      });

      await auctionService.pujar(10, 2, { importe: 1500 });

      expect(mockApi.post).toHaveBeenCalledWith(
        '/subastas/10/items/2/pujar',
        { importe: 1500 },
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('agrega el header Idempotency-Key cuando se provee', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await auctionService.pujar(10, 2, { importe: 500 }, 'clave-unica-123');

      const [, , options] = (mockApi.post as jest.Mock).mock.calls[0];
      expect(options.headers['Idempotency-Key']).toBe('clave-unica-123');
    });

    it('NO incluye Idempotency-Key cuando no se provee', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await auctionService.pujar(10, 2, { importe: 500 });

      const [, , options] = (mockApi.post as jest.Mock).mock.calls[0];
      expect(options.headers['Idempotency-Key']).toBeUndefined();
    });

    it('propaga el error GARANTIA_INSUFICIENTE con todos sus campos intactos', async () => {
      const garantiaError = {
        response: {
          status: 422,
          data: {
            codigo: 'GARANTIA_INSUFICIENTE',
            garantiaDisponible: 1000,
            exposicionActual: 800,
            importeRequerido: 500,
            moneda: 'ARS',
          },
        },
      };
      mockApi.post.mockRejectedValueOnce(garantiaError);

      await expect(
        auctionService.pujar(10, 2, { importe: 500 }),
      ).rejects.toEqual(garantiaError);
    });
  });

  // ─── confirmarPago ────────────────────────────────────────────────────────

  describe('confirmarPago()', () => {
    it('llama a POST /subastas/:id/pagos con el body correcto', async () => {
      mockApi.post.mockResolvedValueOnce({ data: null });

      const pagoData = { medioPagoId: 3, modoEntrega: 'retiro' as const };
      await auctionService.confirmarPago(10, pagoData);

      expect(mockApi.post).toHaveBeenCalledWith('/subastas/10/pagos', pagoData);
    });

    it('llama a POST /subastas/:id/pagos incluyendo direccionEnvio cuando el modo es envío', async () => {
      mockApi.post.mockResolvedValueOnce({ data: null });

      const pagoData = {
        medioPagoId: 3,
        modoEntrega: 'envio' as const,
        direccionEnvio: 'Av. Corrientes 1234',
      };
      await auctionService.confirmarPago(10, pagoData);

      expect(mockApi.post).toHaveBeenCalledWith('/subastas/10/pagos', pagoData);
    });
  });

  // ─── join / leave ─────────────────────────────────────────────────────────

  describe('join() / leave()', () => {
    it('join llama a POST /subastas/:id/join', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { token: 'sesion-tok' } });

      await auctionService.join(5);

      expect(mockApi.post).toHaveBeenCalledWith('/subastas/5/join');
    });

    it('leave llama a DELETE /subastas/:id/join', async () => {
      mockApi.delete.mockResolvedValueOnce({ data: null });

      await auctionService.leave(5);

      expect(mockApi.delete).toHaveBeenCalledWith('/subastas/5/join');
    });
  });
});
