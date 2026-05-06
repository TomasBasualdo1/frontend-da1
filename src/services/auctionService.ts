import api from "./api";
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
} from "../types";

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
};
