import { articleService } from '../services/articleService';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    defaults: { baseURL: 'http://localhost:8000' },
  },
}));

// Fijamos Platform.OS = 'ios' para que publicar() use el path nativo
// y no intente hacer fetch() de las URIs de las fotos
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('articleService', () => {
  let appendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reemplazamos FormData global para poder inspeccionar cada append()
    appendMock = jest.fn();
    (global as any).FormData = jest.fn(() => ({ append: appendMock }));
  });

  // ─── publicar ─────────────────────────────────────────────────────────────

  describe('publicar()', () => {
    const baseInput = {
      descripcion: 'Óleo sobre tela',
      esPropietario: true,
      declaraOrigenLicito: true,
      fotos: ['file://foto1.jpg', 'file://foto2.jpg'],
    };

    const articuloConId = { id: 99, descripcion: 'Óleo sobre tela', estado: 'pendiente' };

    it('llama a POST /articulos con header Content-Type multipart/form-data', async () => {
      mockApi.post.mockResolvedValueOnce({ data: articuloConId });

      await articleService.publicar(baseInput);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/articulos',
        expect.any(Object),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
    });

    it('agrega descripcion, esPropietario y declaraOrigenLicito al FormData', async () => {
      mockApi.post.mockResolvedValueOnce({ data: articuloConId });

      await articleService.publicar(baseInput);

      expect(appendMock).toHaveBeenCalledWith('descripcion', 'Óleo sobre tela');
      expect(appendMock).toHaveBeenCalledWith('esPropietario', 'true');
      expect(appendMock).toHaveBeenCalledWith('declaraOrigenLicito', 'true');
    });

    it('agrega campos opcionales cuando se proveen (historia, artista, fechaCreacion)', async () => {
      mockApi.post.mockResolvedValueOnce({ data: articuloConId });

      await articleService.publicar({
        ...baseInput,
        historia: 'Obra de 1920',
        artista: 'Berni',
        fechaCreacion: '1920-01-01',
      });

      expect(appendMock).toHaveBeenCalledWith('historia', 'Obra de 1920');
      expect(appendMock).toHaveBeenCalledWith('artista', 'Berni');
      expect(appendMock).toHaveBeenCalledWith('fechaCreacion', '1920-01-01');
    });

    it('NO agrega campos opcionales cuando no se proveen', async () => {
      mockApi.post.mockResolvedValueOnce({ data: articuloConId });

      await articleService.publicar(baseInput);

      const keys = appendMock.mock.calls.map(([key]) => key);
      expect(keys).not.toContain('historia');
      expect(keys).not.toContain('artista');
      expect(keys).not.toContain('fechaCreacion');
    });

    it('agrega cada foto como objeto nativo { uri, name, type } con nombre foto_N.jpg', async () => {
      mockApi.post.mockResolvedValueOnce({ data: articuloConId });

      await articleService.publicar({
        ...baseInput,
        fotos: ['file://a.jpg', 'file://b.jpg'],
      });

      expect(appendMock).toHaveBeenCalledWith(
        'fotos',
        expect.objectContaining({ uri: 'file://a.jpg', name: 'foto_0.jpg', type: 'image/jpeg' }),
      );
      expect(appendMock).toHaveBeenCalledWith(
        'fotos',
        expect.objectContaining({ uri: 'file://b.jpg', name: 'foto_1.jpg', type: 'image/jpeg' }),
      );
    });

    it('agrega documentacionOrigen como objeto nativo { uri, name, type } con nombre doc_N.pdf', async () => {
      mockApi.post.mockResolvedValueOnce({ data: articuloConId });

      await articleService.publicar({
        ...baseInput,
        documentacionOrigen: ['file://cert.pdf', 'file://factura.pdf'],
      });

      expect(appendMock).toHaveBeenCalledWith(
        'documentacionOrigen',
        expect.objectContaining({ uri: 'file://cert.pdf', name: 'doc_0.pdf', type: 'application/pdf' }),
      );
      expect(appendMock).toHaveBeenCalledWith(
        'documentacionOrigen',
        expect.objectContaining({ uri: 'file://factura.pdf', name: 'doc_1.pdf', type: 'application/pdf' }),
      );
    });

    it('NO agrega documentacionOrigen cuando no se provee', async () => {
      mockApi.post.mockResolvedValueOnce({ data: articuloConId });

      await articleService.publicar(baseInput);

      const keys = appendMock.mock.calls.map(([key]) => key);
      expect(keys).not.toContain('documentacionOrigen');
    });

    it('devuelve el artículo normalizado (snake_case → camelCase)', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          id: 42,
          descripcion: 'Óleo',
          precio_base_propuesto: 5000,
          estado_evaluacion: 'pendiente',
          tasacion_aceptada: null,
        },
      });

      const result = await articleService.publicar(baseInput);

      expect(result.id).toBe(42);
      expect(result.precioBasePropuesto).toBe(5000);
      expect(result.estado).toBe('pendiente');
      expect(result.tasacionAceptada).toBeNull();
    });

    it('lanza error si la respuesta no incluye id (artículo no creado)', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { descripcion: 'Sin id' } });

      await expect(articleService.publicar(baseInput)).rejects.toThrow(
        'La API no devolvió el artículo creado.',
      );
    });
  });

  // ─── getMisPublicaciones ──────────────────────────────────────────────────

  describe('getMisPublicaciones()', () => {
    it('normaliza el array mapeando aliases snake_case', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [{
          id: 1,
          descripcioncatalogo: 'Pintura flamenca',
          precio_base_propuesto: 3000,
          comision_propuesta: 10,
          motivo_rechazo: null,
          fecha_envio: '2026-06-01',
          imagenes: ['url1', 'url2'],
          subasta_id: 5,
          subasta_fecha: '2026-07-01',
          subasta_hora: '18:00:00',
          subasta_estado: 'abierta',
        }],
      });

      const result = await articleService.getMisPublicaciones();

      expect(result).toHaveLength(1);
      expect(result[0].descripcion).toBe('Pintura flamenca');
      expect(result[0].precioBasePropuesto).toBe(3000);
      expect(result[0].comisionPropuesta).toBe(10);
      expect(result[0].motivoRechazo).toBeNull();
      expect(result[0].fechaEnvio).toBe('2026-06-01');
      expect(result[0].fotos).toEqual(['url1', 'url2']);
      expect(result[0].subastaId).toBe(5);
      expect(result[0].subastaFecha).toBe('2026-07-01');
      expect(result[0].subastaEstado).toBe('abierta');
    });

    it('devuelve [] cuando el backend responde con null', async () => {
      mockApi.get.mockResolvedValueOnce({ data: null });
      expect(await articleService.getMisPublicaciones()).toEqual([]);
    });

    it('devuelve [] cuando el backend responde con objeto (no array)', async () => {
      mockApi.get.mockResolvedValueOnce({ data: {} });
      expect(await articleService.getMisPublicaciones()).toEqual([]);
    });
  });

  // ─── getDetalle ───────────────────────────────────────────────────────────

  describe('getDetalle()', () => {
    it('normaliza todos los aliases del artículo', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          identificador: 77,
          descripcioncompleta: 'Escultura de bronce',
          fecha_creacion: '1650-01-01',
          tasacion_aceptada: true,
          subasta_id: 12,
          subasta_fecha: '2026-08-15',
          subasta_hora: '19:00:00',
          subasta_estado: 'abierta',
        },
      });

      const result = await articleService.getDetalle(77);

      expect(result.id).toBe(77);
      expect(result.descripcion).toBe('Escultura de bronce');
      expect(result.fechaCreacion).toBe('1650-01-01');
      expect(result.tasacionAceptada).toBe(true);
      expect(result.subastaId).toBe(12);
      expect(result.subastaHora).toBe('19:00:00');
      expect(result.subastaEstado).toBe('abierta');
    });
  });

  // ─── aceptarTasacion ──────────────────────────────────────────────────────

  describe('aceptarTasacion()', () => {
    it('llama a POST /articulos/:id/aceptar-tasacion con acepta: true', async () => {
      mockApi.post.mockResolvedValueOnce({ data: null });

      await articleService.aceptarTasacion(10, true);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/articulos/10/aceptar-tasacion',
        { acepta: true },
      );
    });

    it('llama con acepta: false cuando el usuario rechaza la tasación', async () => {
      mockApi.post.mockResolvedValueOnce({ data: null });

      await articleService.aceptarTasacion(10, false);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/articulos/10/aceptar-tasacion',
        { acepta: false },
      );
    });
  });

  // ─── aumentarSeguro ───────────────────────────────────────────────────────

  describe('aumentarSeguro()', () => {
    it('llama a POST /articulos/:id/seguro/aumentar con el nuevo monto', async () => {
      mockApi.post.mockResolvedValueOnce({ data: null });

      await articleService.aumentarSeguro(10, 150000);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/articulos/10/seguro/aumentar',
        { montoNuevo: 150000 },
      );
    });
  });
});
