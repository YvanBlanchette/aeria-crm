export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtMoney(v: unknown) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUOTED: "Devis envoyé",
  NEGOTIATION: "Négociation",
  WON: "Gagné",
  LOST: "Perdu",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  OPTION: "Option",
  CONFIRMED: "Confirmée",
  PAID: "Payée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

export const CABIN_LABELS: Record<string, string> = {
  INTERIOR: "Intérieure",
  OCEANVIEW: "Vue mer",
  BALCONY: "Balcon",
  SUITE: "Suite",
};
