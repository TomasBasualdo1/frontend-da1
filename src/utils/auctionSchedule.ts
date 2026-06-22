import { SubastaListado } from "../types";

type AuctionScheduleFields = Pick<SubastaListado, "fecha" | "hora" | "estado">;

export type AuctionScheduleStatus = "live" | "scheduled" | "open" | "closed";

function parseAuctionDateTime(fecha?: string, hora?: string): Date | null {
  if (!fecha || !hora) return null;

  const [year, month, day] = fecha.split("T")[0].split("-").map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = hora
    .split(".")[0]
    .split(":")
    .map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function isSameLocalDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function getAuctionScheduleStatus(
  subasta: AuctionScheduleFields,
  now = new Date(),
): AuctionScheduleStatus {
  if (subasta.estado !== "abierta") return "closed";

  const scheduledAt = parseAuctionDateTime(subasta.fecha, subasta.hora);
  if (!scheduledAt) return "open";

  if (isSameLocalDate(scheduledAt, now) && scheduledAt.getTime() <= now.getTime()) {
    return "live";
  }

  return scheduledAt.getTime() > now.getTime() ? "scheduled" : "open";
}

export function isAuctionLive(subasta: AuctionScheduleFields, now = new Date()) {
  return getAuctionScheduleStatus(subasta, now) === "live";
}

export function isAuctionScheduled(subasta: AuctionScheduleFields, now = new Date()) {
  return getAuctionScheduleStatus(subasta, now) === "scheduled";
}

export function getAuctionScheduleLabel(status: AuctionScheduleStatus): string {
  switch (status) {
    case "live":
      return "EN VIVO";
    case "scheduled":
      return "PROGRAMADA";
    case "open":
      return "ABIERTA";
    case "closed":
      return "FINALIZADA";
  }
}
