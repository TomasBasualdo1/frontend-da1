import {
  getAuctionScheduleStatus,
  getAuctionScheduleLabel,
  isAuctionLive,
  isAuctionScheduled,
  type AuctionScheduleStatus,
} from '../auctionSchedule';

// Helper: construye un objeto de subasta con solo los campos que necesita la función
const subasta = (
  estado: 'abierta' | 'cerrada',
  fecha = '',
  hora = '',
) => ({ estado, fecha, hora });

// Helper: construye una fecha local sin depender de Date.now() (tests deterministas)
const fecha = (year: number, month: number, day: number, hour: number, min = 0) =>
  new Date(year, month - 1, day, hour, min, 0);

// ─── getAuctionScheduleStatus ──────────────────────────────────────────────

describe('getAuctionScheduleStatus', () => {
  test('retorna "closed" cuando el estado es "cerrada"', () => {
    const s = subasta('cerrada', '2026-06-23', '10:00:00');
    expect(getAuctionScheduleStatus(s)).toBe('closed');
  });

  test('retorna "open" cuando falta fecha', () => {
    const s = subasta('abierta', '', '10:00:00');
    expect(getAuctionScheduleStatus(s)).toBe('open');
  });

  test('retorna "open" cuando falta hora', () => {
    const s = subasta('abierta', '2026-06-23', '');
    expect(getAuctionScheduleStatus(s)).toBe('open');
  });

  test('retorna "live" cuando la subasta es hoy y la hora ya pasó', () => {
    const now = fecha(2026, 6, 23, 15, 0);   // 15:00 de hoy
    const s = subasta('abierta', '2026-06-23', '10:00:00'); // empezó a las 10:00
    expect(getAuctionScheduleStatus(s, now)).toBe('live');
  });

  test('retorna "live" exactamente en el momento de inicio (borde)', () => {
    const now = fecha(2026, 6, 23, 10, 0);   // exactamente las 10:00
    const s = subasta('abierta', '2026-06-23', '10:00:00');
    expect(getAuctionScheduleStatus(s, now)).toBe('live');
  });

  test('retorna "scheduled" cuando la subasta es hoy pero la hora todavía no llegó', () => {
    const now = fecha(2026, 6, 23, 9, 59);   // 09:59, la subasta es a las 10:00
    const s = subasta('abierta', '2026-06-23', '10:00:00');
    expect(getAuctionScheduleStatus(s, now)).toBe('scheduled');
  });

  test('retorna "scheduled" cuando la fecha es en el futuro', () => {
    const now = fecha(2026, 6, 23, 12, 0);
    const s = subasta('abierta', '2026-06-30', '10:00:00');
    expect(getAuctionScheduleStatus(s, now)).toBe('scheduled');
  });

  test('retorna "open" cuando la fecha ya pasó (día anterior)', () => {
    const now = fecha(2026, 6, 23, 12, 0);
    const s = subasta('abierta', '2026-06-22', '10:00:00');
    expect(getAuctionScheduleStatus(s, now)).toBe('open');
  });

  test('acepta fecha con formato ISO completo (con T)', () => {
    const now = fecha(2026, 6, 23, 15, 0);
    const s = subasta('abierta', '2026-06-23T00:00:00', '10:00:00');
    expect(getAuctionScheduleStatus(s, now)).toBe('live');
  });
});

// ─── getAuctionScheduleLabel ───────────────────────────────────────────────

describe('getAuctionScheduleLabel', () => {
  const casos: [AuctionScheduleStatus, string][] = [
    ['live',      'EN VIVO'],
    ['scheduled', 'PROGRAMADA'],
    ['open',      'ABIERTA'],
    ['closed',    'FINALIZADA'],
  ];

  test.each(casos)('"%s" → "%s"', (status, label) => {
    expect(getAuctionScheduleLabel(status)).toBe(label);
  });
});

// ─── isAuctionLive / isAuctionScheduled ───────────────────────────────────

describe('isAuctionLive', () => {
  test('retorna true cuando la subasta está en vivo', () => {
    const now = fecha(2026, 6, 23, 15, 0);
    expect(isAuctionLive(subasta('abierta', '2026-06-23', '10:00:00'), now)).toBe(true);
  });

  test('retorna false cuando no está en vivo', () => {
    const now = fecha(2026, 6, 23, 9, 0);
    expect(isAuctionLive(subasta('abierta', '2026-06-23', '10:00:00'), now)).toBe(false);
  });
});

describe('isAuctionScheduled', () => {
  test('retorna true cuando la subasta es futura', () => {
    const now = fecha(2026, 6, 23, 9, 0);
    expect(isAuctionScheduled(subasta('abierta', '2026-06-23', '10:00:00'), now)).toBe(true);
  });

  test('retorna false cuando no es futura', () => {
    const now = fecha(2026, 6, 23, 15, 0);
    expect(isAuctionScheduled(subasta('abierta', '2026-06-23', '10:00:00'), now)).toBe(false);
  });
});
