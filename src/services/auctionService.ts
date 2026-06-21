import api from "./api";
import { getItemAsync } from "../utils/storage";
import {
  SubastaListado,
  SubastaDetalle,
  SubastaDetallePublica,
  SesionSubasta,
  Puja,
  PujaRequest,
  PujaResponse,
  Pago,
  PagoRequest,
  SubastaCreate,
  SubastaCreated,
  CatalogoItemInput,
  CatalogoItemCreated,
  StreamEvent,
} from "../types";

type StreamHandlers = {
  onEvent: (event: StreamEvent) => void;
  onOpen?: () => void;
  onError?: (status?: number) => void;
};

const STREAM_RECONNECT_MS = 3000;

function buildApiUrl(path: string): string {
  const baseUrl = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function parseSseEvent(rawEvent: string): StreamEvent | null {
  const data = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) return null;

  try {
    return JSON.parse(data) as StreamEvent;
  } catch {
    return null;
  }
}

function openAuctionStream(subastaId: number, handlers: StreamHandlers): () => void {
  let closed = false;
  let xhr: XMLHttpRequest | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let token: string | null = null;

  const closeCurrent = () => {
    if (xhr) {
      xhr.abort();
      xhr = null;
    }
  };

  const scheduleReconnect = (status?: number) => {
    if (closed) return;
    handlers.onError?.(status);
    if (status === 401 || status === 403) return;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, STREAM_RECONNECT_MS);
  };

  const connect = () => {
    if (closed) return;
    closeCurrent();

    const request = new XMLHttpRequest();
    xhr = request;
    let cursor = 0;
    let buffer = "";

    request.open("GET", buildApiUrl(`/subastas/${subastaId}/stream`), true);
    request.setRequestHeader("Accept", "text/event-stream");
    if (token) request.setRequestHeader("Authorization", `Bearer ${token}`);

    request.onreadystatechange = () => {
      if (closed || request !== xhr) return;
      if (request.readyState === 2 && request.status >= 200 && request.status < 300) {
        handlers.onOpen?.();
      }
      if (request.readyState === 4) {
        const status = request.status || undefined;
        scheduleReconnect(status);
      }
    };

    request.onprogress = () => {
      if (closed || request !== xhr) return;
      const chunk = request.responseText.slice(cursor);
      cursor = request.responseText.length;
      buffer = `${buffer}${chunk}`.replace(/\r\n/g, "\n");

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex >= 0) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const event = parseSseEvent(rawEvent);
        if (event) handlers.onEvent(event);
        separatorIndex = buffer.indexOf("\n\n");
      }
    };

    request.onerror = () => {
      if (closed || request !== xhr) return;
      scheduleReconnect(request.status || undefined);
    };

    request.send();
  };

  getItemAsync("access_token")
    .then((storedToken) => {
      token = storedToken;
      connect();
    })
    .catch(() => scheduleReconnect());

  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    closeCurrent();
  };
}

export const auctionService = {
  /** Listar subastas públicas (sin auth) */
  async getPublicas(): Promise<SubastaListado[]> {
    const response = await api.get("/subastas/publicas");
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Detalle público de una subasta */
  async getPublicaDetalle(id: number): Promise<SubastaDetallePublica> {
    const response = await api.get<SubastaDetallePublica>(
      `/subastas/publicas/${id}`,
    );
    return response.data;
  },

  /** Listar subastas para usuarios autenticados */
  async getSubastas(): Promise<SubastaListado[]> {
    const response = await api.get("/subastas");
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Detalle de subasta con catálogo (autenticado) */
  async getDetalle(id: number): Promise<SubastaDetalle> {
    const response = await api.get<SubastaDetalle>(`/subastas/${id}`);
    return response.data;
  },

  /** Crear subasta desde administracion */
  async createSubasta(data: SubastaCreate): Promise<SubastaCreated> {
    const response = await api.post<SubastaCreated>("/admin/subastas", data);
    return response.data;
  },

  /** Agregar item al catalogo de una subasta */
  async addCatalogItem(
    subastaId: number,
    data: CatalogoItemInput,
  ): Promise<CatalogoItemCreated> {
    const response = await api.post<CatalogoItemCreated>(
      `/admin/subastas/${subastaId}/catalogo/items`,
      data,
    );
    return response.data;
  },

  /** Unirse a una subasta */
  async join(id: number): Promise<SesionSubasta> {
    const response = await api.post<SesionSubasta>(`/subastas/${id}/join`);
    return response.data;
  },

  /** Salir de una subasta */
  async leave(id: number): Promise<void> {
    await api.delete(`/subastas/${id}/join`);
  },

  /** Historial de pujas de una subasta */
  async getHistorial(id: number): Promise<Puja[]> {
    const response = await api.get<Puja[]>(`/subastas/${id}/historial`);
    return response.data;
  },

  /** Suscribirse al stream SSE de una subasta */
  subscribeToStream(id: number, handlers: StreamHandlers): () => void {
    return openAuctionStream(id, handlers);
  },

  /** Realizar una puja */
  async pujar(
    subastaId: number,
    itemId: number,
    data: PujaRequest,
    idempotencyKey?: string,
  ): Promise<PujaResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const response = await api.post<PujaResponse>(
      `/subastas/${subastaId}/items/${itemId}/pujar`,
      data,
      { headers },
    );
    return response.data;
  },

  /** Obtener resumen de pago */
  async getPago(subastaId: number): Promise<Pago> {
    const response = await api.get<Pago>(`/subastas/${subastaId}/pagos`);
    return response.data;
  },

  /** Confirmar pago */
  async confirmarPago(subastaId: number, data: PagoRequest): Promise<void> {
    await api.post(`/subastas/${subastaId}/pagos`, data);
  },

  /** Cerrar subasta (admin) */
  async close(id: number): Promise<any> {
    const response = await api.post(`/subastas/${id}/cerrar`);
    return response.data;
  },
};
