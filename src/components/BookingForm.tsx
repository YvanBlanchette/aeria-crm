"use client";

import { useEffect, useMemo, useState } from "react";
import { BOOKING_STATUS_LABELS } from "@/lib/format";

type Option = { id: string; label: string };
type ItineraryOption = {
  id: string;
  label: string;
  nights: number;
  departurePort: string;
  arrivalPort?: string | null;
  shipName?: string | null;
  cruiseLineName?: string | null;
};

type SegmentType =
  | "CRUISE"
  | "FLIGHT"
  | "HOTEL"
  | "TRANSFER"
  | "ACTIVITY"
  | "INSURANCE"
  | "FEE"
  | "OTHER";

type SegmentDraft = {
  type: SegmentType;
  title: string;
  supplierName: string;
  startAt: string;
  endAt: string;
  confirmationNumber: string;
  includedInPackage: boolean;
  optionalForClient: boolean;
  clientVisible: boolean;
  currency: string;
  baseAmount: string;
  taxesAmount: string;
  feesAmount: string;
  totalAmount: string;
  internalNotes: string;
  clientNotes: string;
  details: Record<string, string>;
};

type PaymentDraft = {
  amount: string;
  currency: string;
  paidAt: string;
  method: "" | "CARD" | "BANK_TRANSFER" | "CASH" | "CHECK" | "OTHER";
  status: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "VOIDED";
  type: "DEPOSIT" | "INTERIM" | "FINAL" | "REFUND" | "ADJUSTMENT";
  isFinalPayment: boolean;
  finalDueDate: string;
  externalReference: string;
  notes: string;
};

type PaymentScheduleDraft = {
  label: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "VOIDED";
  notes: string;
};

type BookingLike = {
  clientId?: string;
  itineraryId?: string | null;
  status?: string;
  reference?: string;
  packageType?: string | null;
  destinationMain?: string | null;
  supplierMain?: string | null;
  currency?: string;
  internalFileNumber?: string | null;
  globalDepartureDate?: Date | string | null;
  globalReturnDate?: Date | string | null;
  sailingDate?: Date | string;
  returnDate?: Date | string | null;
  totalPrice?: unknown;
  totalNet?: unknown;
  totalCommission?: unknown;
  serviceFees?: unknown;
  deposit?: unknown;
  commission?: unknown;
  balanceDueDate?: Date | string | null;
  clientNotes?: string | null;
  internalNotes?: string | null;
  notes?: string | null;
  payments?: Array<{
    amount?: unknown;
    currency?: string | null;
    paidAt?: Date | string | null;
    method?: "CARD" | "BANK_TRANSFER" | "CASH" | "CHECK" | "OTHER" | null;
    status?: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "VOIDED";
    type?: "DEPOSIT" | "INTERIM" | "FINAL" | "REFUND" | "ADJUSTMENT";
    isFinalPayment?: boolean;
    finalDueDate?: Date | string | null;
    externalReference?: string | null;
    notes?: string | null;
  }>;
  paymentSchedules?: Array<{
    label?: string | null;
    amount?: unknown;
    currency?: string | null;
    dueDate?: Date | string;
    status?: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "VOIDED";
    notes?: string | null;
  }>;
  segments?: Array<{
    type: SegmentType;
    title?: string | null;
    supplierName?: string | null;
    startAt?: Date | string | null;
    endAt?: Date | string | null;
    confirmationNumber?: string | null;
    includedInPackage?: boolean;
    optionalForClient?: boolean;
    clientVisible?: boolean;
    currency?: string | null;
    baseAmount?: unknown;
    taxesAmount?: unknown;
    feesAmount?: unknown;
    totalAmount?: unknown;
    internalNotes?: string | null;
    clientNotes?: string | null;
    cruiseDetails?: {
      cruiseLine?: string | null;
      shipName?: string | null;
      cabinCategory?: string | null;
      cruiseBookingNumber?: string | null;
    } | null;
    flightDetails?: {
      airlineName?: string | null;
      pnr?: string | null;
      cabinClass?: string | null;
    } | null;
    hotelDetails?: {
      hotelName?: string | null;
      street?: string | null;
      city?: string | null;
      province?: string | null;
      country?: string | null;
      zipCode?: string | null;
      roomType?: string | null;
    } | null;
    transferDetails?: {
      transferType?: string | null;
      pickupLocation?: string | null;
      dropoffLocation?: string | null;
    } | null;
    activityDetails?: {
      activityName?: string | null;
      duration?: string | null;
    } | null;
    insuranceDetails?: {
      provider?: string | null;
      policyNumber?: string | null;
      coverageType?: string | null;
    } | null;
  }>;
};

function d(v?: Date | string | null) {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

function n(v: unknown) {
  return v === null || v === undefined ? "" : String(v);
}

function emptySegment(type: SegmentType, currency: string): SegmentDraft {
  return {
    type,
    title: "",
    supplierName: "",
    startAt: "",
    endAt: "",
    confirmationNumber: "",
    includedInPackage: true,
    optionalForClient: false,
    clientVisible: true,
    currency,
    baseAmount: "",
    taxesAmount: "",
    feesAmount: "",
    totalAmount: "",
    internalNotes: "",
    clientNotes: "",
    details: {},
  };
}

function toSegmentDraft(
  segment: NonNullable<BookingLike["segments"]>[number],
  fallbackCurrency: string,
): SegmentDraft {
  const details: Record<string, string> = {};
  if (segment.type === "CRUISE" && segment.cruiseDetails) {
    details.cruiseLine = segment.cruiseDetails.cruiseLine ?? "";
    details.shipName = segment.cruiseDetails.shipName ?? "";
    details.cabinCategory = segment.cruiseDetails.cabinCategory ?? "";
    details.cruiseBookingNumber = segment.cruiseDetails.cruiseBookingNumber ?? "";
  }
  if (segment.type === "FLIGHT" && segment.flightDetails) {
    details.airlineName = segment.flightDetails.airlineName ?? "";
    details.pnr = segment.flightDetails.pnr ?? "";
    details.cabinClass = segment.flightDetails.cabinClass ?? "";
  }
  if (segment.type === "HOTEL" && segment.hotelDetails) {
    details.hotelName = segment.hotelDetails.hotelName ?? "";
    details.street = segment.hotelDetails.street ?? "";
    details.city = segment.hotelDetails.city ?? "";
    details.province = segment.hotelDetails.province ?? "";
    details.country = segment.hotelDetails.country ?? "";
    details.zipCode = segment.hotelDetails.zipCode ?? "";
    details.roomType = segment.hotelDetails.roomType ?? "";
  }
  if (segment.type === "TRANSFER" && segment.transferDetails) {
    details.transferType = segment.transferDetails.transferType ?? "";
    details.pickupLocation = segment.transferDetails.pickupLocation ?? "";
    details.dropoffLocation = segment.transferDetails.dropoffLocation ?? "";
  }
  if (segment.type === "ACTIVITY" && segment.activityDetails) {
    details.activityName = segment.activityDetails.activityName ?? "";
    details.duration = segment.activityDetails.duration ?? "";
  }
  if (segment.type === "INSURANCE" && segment.insuranceDetails) {
    details.provider = segment.insuranceDetails.provider ?? "";
    details.policyNumber = segment.insuranceDetails.policyNumber ?? "";
    details.coverageType = segment.insuranceDetails.coverageType ?? "";
  }

  return {
    type: segment.type,
    title: segment.title ?? "",
    supplierName: segment.supplierName ?? "",
    startAt: d(segment.startAt),
    endAt: d(segment.endAt),
    confirmationNumber: segment.confirmationNumber ?? "",
    includedInPackage: segment.includedInPackage ?? true,
    optionalForClient: segment.optionalForClient ?? false,
    clientVisible: segment.clientVisible ?? true,
    currency: segment.currency ?? fallbackCurrency,
    baseAmount: n(segment.baseAmount),
    taxesAmount: n(segment.taxesAmount),
    feesAmount: n(segment.feesAmount),
    totalAmount: n(segment.totalAmount),
    internalNotes: segment.internalNotes ?? "",
    clientNotes: segment.clientNotes ?? "",
    details,
  };
}

function emptyPayment(currency: string): PaymentDraft {
  return {
    amount: "",
    currency,
    paidAt: "",
    method: "",
    status: "PENDING",
    type: "INTERIM",
    isFinalPayment: false,
    finalDueDate: "",
    externalReference: "",
    notes: "",
  };
}

function toPaymentDraft(
  payment: NonNullable<BookingLike["payments"]>[number],
  fallbackCurrency: string,
): PaymentDraft {
  return {
    amount: n(payment.amount),
    currency: payment.currency ?? fallbackCurrency,
    paidAt: d(payment.paidAt),
    method: payment.method ?? "",
    status: payment.status ?? "PENDING",
    type: payment.type ?? "INTERIM",
    isFinalPayment: payment.isFinalPayment ?? false,
    finalDueDate: d(payment.finalDueDate),
    externalReference: payment.externalReference ?? "",
    notes: payment.notes ?? "",
  };
}

function emptySchedule(currency: string): PaymentScheduleDraft {
  return {
    label: "",
    amount: "",
    currency,
    dueDate: "",
    status: "PENDING",
    notes: "",
  };
}

function toScheduleDraft(
  schedule: NonNullable<BookingLike["paymentSchedules"]>[number],
  fallbackCurrency: string,
): PaymentScheduleDraft {
  return {
    label: schedule.label ?? "",
    amount: n(schedule.amount),
    currency: schedule.currency ?? fallbackCurrency,
    dueDate: d(schedule.dueDate),
    status: schedule.status ?? "PENDING",
    notes: schedule.notes ?? "",
  };
}

const SEGMENT_LABELS: Record<SegmentType, string> = {
  CRUISE: "Croisière",
  FLIGHT: "Vol",
  HOTEL: "Hôtel",
  TRANSFER: "Transfert",
  ACTIVITY: "Excursion/Activité",
  INSURANCE: "Assurance",
  FEE: "Frais",
  OTHER: "Autre",
};

export function BookingForm({
  clients,
  itineraries,
  booking,
  action,
  submitLabel,
  defaultClientId,
  defaultItineraryId,
  lockClient,
}: {
  clients: Option[];
  itineraries?: ItineraryOption[];
  booking?: BookingLike;
  action: (fd: FormData) => void;
  submitLabel: string;
  defaultClientId?: string;
  defaultItineraryId?: string;
  lockClient?: boolean;
}) {
  const initialCurrency = booking?.currency ?? "CAD";
  const initialSegments = useMemo(
    () =>
      booking?.segments?.length
        ? booking.segments.map((s) => toSegmentDraft(s, initialCurrency))
        : [emptySegment("CRUISE", initialCurrency)],
    [booking?.segments, initialCurrency],
  );

  const [segments, setSegments] = useState<SegmentDraft[]>(initialSegments);
  const [currency, setCurrency] = useState(initialCurrency);
  const [selectedItineraryId, setSelectedItineraryId] = useState(
    booking?.itineraryId ?? defaultItineraryId ?? "",
  );
  const [packageType, setPackageType] = useState(booking?.packageType ?? "");
  const [destinationMain, setDestinationMain] = useState(booking?.destinationMain ?? "");
  const [supplierMain, setSupplierMain] = useState(booking?.supplierMain ?? "");
  const [globalDepartureDate, setGlobalDepartureDate] = useState(
    d(booking?.globalDepartureDate ?? booking?.sailingDate),
  );
  const [globalReturnDate, setGlobalReturnDate] = useState(
    d(booking?.globalReturnDate ?? booking?.returnDate),
  );

  const selectedItinerary = useMemo(
    () => itineraries?.find((item) => item.id === selectedItineraryId),
    [itineraries, selectedItineraryId],
  );

  const initialPayments = useMemo(
    () =>
      booking?.payments?.length
        ? booking.payments.map((p) => toPaymentDraft(p, initialCurrency))
        : [],
    [booking?.payments, initialCurrency],
  );

  const initialSchedules = useMemo(
    () =>
      booking?.paymentSchedules?.length
        ? booking.paymentSchedules.map((s) => toScheduleDraft(s, initialCurrency))
        : [],
    [booking?.paymentSchedules, initialCurrency],
  );

  const [payments, setPayments] = useState<PaymentDraft[]>(initialPayments);
  const [schedules, setSchedules] = useState<PaymentScheduleDraft[]>(initialSchedules);

  useEffect(() => {
    if (!selectedItinerary || !globalDepartureDate || globalReturnDate) return;
    const departure = new Date(`${globalDepartureDate}T00:00:00`);
    departure.setDate(departure.getDate() + selectedItinerary.nights);
    setGlobalReturnDate(departure.toISOString().slice(0, 10));
  }, [selectedItinerary, globalDepartureDate, globalReturnDate]);

  useEffect(() => {
    if (!selectedItinerary) return;

    const suggestedDestination =
      selectedItinerary.arrivalPort &&
      selectedItinerary.arrivalPort !== selectedItinerary.departurePort
        ? selectedItinerary.arrivalPort
        : selectedItinerary.departurePort;

    setPackageType((prev) => prev || "Croisière");
    setDestinationMain((prev) => prev || suggestedDestination);
    setSupplierMain(
      (prev) => prev || selectedItinerary.cruiseLineName || selectedItinerary.shipName || "",
    );

    setSegments((prev) => {
      const cruiseIndex = prev.findIndex((segment) => segment.type === "CRUISE");
      if (cruiseIndex < 0) return prev;

      const cruise = prev[cruiseIndex];
      const hasData = Boolean(
        cruise.title ||
        cruise.supplierName ||
        cruise.startAt ||
        cruise.endAt ||
        cruise.details.cruiseLine ||
        cruise.details.shipName ||
        cruise.details.cabinCategory ||
        cruise.details.cruiseBookingNumber,
      );
      if (hasData) return prev;

      const next = [...prev];
      next[cruiseIndex] = {
        ...cruise,
        title: selectedItinerary.label,
        supplierName: selectedItinerary.cruiseLineName ?? cruise.supplierName,
        startAt: globalDepartureDate || cruise.startAt,
        endAt: globalReturnDate || cruise.endAt,
        details: {
          ...cruise.details,
          cruiseLine: selectedItinerary.cruiseLineName ?? "",
          shipName: selectedItinerary.shipName ?? "",
        },
      };
      return next;
    });
  }, [selectedItinerary, globalDepartureDate, globalReturnDate]);

  const segmentsJson = useMemo(() => JSON.stringify(segments), [segments]);
  const paymentsJson = useMemo(() => JSON.stringify(payments), [payments]);
  const schedulesJson = useMemo(() => JSON.stringify(schedules), [schedules]);

  const addSegment = (type: SegmentType) => {
    setSegments((prev) => [...prev, emptySegment(type, currency)]);
  };

  const removeSegment = (index: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSegment = (index: number, patch: Partial<SegmentDraft>) => {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const updateSegmentDetail = (index: number, key: string, value: string) => {
    setSegments((prev) =>
      prev.map((s, i) => (i === index ? { ...s, details: { ...s.details, [key]: value } } : s)),
    );
  };

  const addPayment = () => {
    setPayments((prev) => [...prev, emptyPayment(currency)]);
  };

  const removePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, patch: Partial<PaymentDraft>) => {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const addSchedule = () => {
    setSchedules((prev) => [...prev, emptySchedule(currency)]);
  };

  const removeSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, patch: Partial<PaymentScheduleDraft>) => {
    setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  return (
    <form action={action} className="card p-6 space-y-6">
      {/* DOSSIER CORE */}
      <section className="space-y-4">
        <h2 className="font-semibold text-navy">Dossier principal</h2>
        {!lockClient && (
          <div>
            <label className="label" htmlFor="clientId">
              Client *
            </label>
            <select
              id="clientId"
              name="clientId"
              required
              defaultValue={booking?.clientId ?? defaultClientId ?? ""}
              className="input"
            >
              <option value="" disabled>
                Choisir un client…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="status">
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue={booking?.status ?? "OPTION"}
              className="input"
            >
              {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="packageType">
              Type de forfait
            </label>
            <input
              id="packageType"
              name="packageType"
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              className="input"
              placeholder="Croisière + Vol + Hôtel"
            />
          </div>
          <div>
            <label className="label" htmlFor="currency">
              Devise
            </label>
            <input
              id="currency"
              name="currency"
              defaultValue={currency}
              className="input"
              onChange={(e) => setCurrency(e.target.value || "CAD")}
            />
          </div>
          <div>
            <label className="label" htmlFor="destinationMain">
              Destination principale
            </label>
            <input
              id="destinationMain"
              name="destinationMain"
              value={destinationMain}
              onChange={(e) => setDestinationMain(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="supplierMain">
              Fournisseur principal
            </label>
            <input
              id="supplierMain"
              name="supplierMain"
              value={supplierMain}
              onChange={(e) => setSupplierMain(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="internalFileNumber">
              Numéro dossier interne
            </label>
            <input
              id="internalFileNumber"
              name="internalFileNumber"
              defaultValue={booking?.internalFileNumber ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="globalDepartureDate">
              Date de départ globale *
            </label>
            <input
              id="globalDepartureDate"
              name="globalDepartureDate"
              type="date"
              required
              value={globalDepartureDate}
              onChange={(e) => setGlobalDepartureDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="globalReturnDate">
              Date de retour globale
            </label>
            <input
              id="globalReturnDate"
              name="globalReturnDate"
              type="date"
              value={globalReturnDate}
              onChange={(e) => setGlobalReturnDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="balanceDueDate">
              Échéance solde final
            </label>
            <input
              id="balanceDueDate"
              name="balanceDueDate"
              type="date"
              defaultValue={d(booking?.balanceDueDate)}
              className="input"
            />
          </div>
        </div>

        {itineraries && itineraries.length > 0 && (
          <div className="space-y-2">
            <label className="label" htmlFor="itineraryId">
              Itinéraire de croisière lié
            </label>
            <select
              id="itineraryId"
              name="itineraryId"
              className="input"
              value={selectedItineraryId}
              onChange={(e) => setSelectedItineraryId(e.target.value)}
            >
              <option value="">— Aucun itinéraire lié —</option>
              {itineraries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {selectedItinerary && (
              <p className="text-xs text-slate-500">
                {selectedItinerary.nights} nuits · {selectedItinerary.departurePort}
                {selectedItinerary.arrivalPort &&
                selectedItinerary.arrivalPort !== selectedItinerary.departurePort
                  ? ` → ${selectedItinerary.arrivalPort}`
                  : " (boucle)"}
                {selectedItinerary.shipName
                  ? ` · ${selectedItinerary.cruiseLineName ? `${selectedItinerary.cruiseLineName}, ` : ""}${selectedItinerary.shipName}`
                  : ""}
              </p>
            )}
          </div>
        )}
      </section>

      {/* FINANCE */}
      <section className="space-y-4">
        <h2 className="font-semibold text-navy">Finances globales</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="label" htmlFor="totalPrice">
              Prix total brut
            </label>
            <input
              id="totalPrice"
              name="totalPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={n(booking?.totalPrice)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="deposit">
              Dépôt
            </label>
            <input
              id="deposit"
              name="deposit"
              type="number"
              min="0"
              step="0.01"
              defaultValue={n(booking?.deposit)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="totalNet">
              Total net
            </label>
            <input
              id="totalNet"
              name="totalNet"
              type="number"
              min="0"
              step="0.01"
              defaultValue={n(booking?.totalNet)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="totalCommission">
              Total commission
            </label>
            <input
              id="totalCommission"
              name="totalCommission"
              type="number"
              min="0"
              step="0.01"
              defaultValue={n(booking?.totalCommission ?? booking?.commission)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="serviceFees">
              Frais de dossier
            </label>
            <input
              id="serviceFees"
              name="serviceFees"
              type="number"
              min="0"
              step="0.01"
              defaultValue={n(booking?.serviceFees)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="commission">
              Commission legacy
            </label>
            <input
              id="commission"
              name="commission"
              type="number"
              min="0"
              step="0.01"
              defaultValue={n(booking?.commission)}
              className="input"
            />
          </div>
        </div>
      </section>

      {/* SEGMENTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-semibold text-navy">Segments du forfait</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => addSegment("CRUISE")}
            >
              + Croisière
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => addSegment("FLIGHT")}
            >
              + Vol
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => addSegment("HOTEL")}
            >
              + Hôtel
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => addSegment("TRANSFER")}
            >
              + Transfert
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => addSegment("ACTIVITY")}
            >
              + Activité
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => addSegment("INSURANCE")}
            >
              + Assurance
            </button>
          </div>
        </div>

        {segments.map((segment, index) => (
          <div
            key={`${segment.type}-${index}`}
            className="rounded-lg border border-slate-200 bg-slate-50/40 p-4 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-navy">
                Segment {index + 1} · {SEGMENT_LABELS[segment.type]}
              </h3>
              <button
                type="button"
                className="btn-danger text-xs"
                onClick={() => removeSegment(index)}
              >
                Retirer segment
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={segment.type}
                  onChange={(e) =>
                    updateSegment(index, { type: e.target.value as SegmentType, details: {} })
                  }
                >
                  {Object.entries(SEGMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Titre</label>
                <input
                  className="input"
                  value={segment.title}
                  onChange={(e) => updateSegment(index, { title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Fournisseur</label>
                <input
                  className="input"
                  value={segment.supplierName}
                  onChange={(e) => updateSegment(index, { supplierName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Début</label>
                <input
                  type="date"
                  className="input"
                  value={segment.startAt}
                  onChange={(e) => updateSegment(index, { startAt: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Fin</label>
                <input
                  type="date"
                  className="input"
                  value={segment.endAt}
                  onChange={(e) => updateSegment(index, { endAt: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Confirmation</label>
                <input
                  className="input"
                  value={segment.confirmationNumber}
                  onChange={(e) => updateSegment(index, { confirmationNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Devise</label>
                <input
                  className="input"
                  value={segment.currency}
                  onChange={(e) => updateSegment(index, { currency: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Montant de base</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={segment.baseAmount}
                  onChange={(e) => updateSegment(index, { baseAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Taxes</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={segment.taxesAmount}
                  onChange={(e) => updateSegment(index, { taxesAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Frais</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={segment.feesAmount}
                  onChange={(e) => updateSegment(index, { feesAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Total segment</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={segment.totalAmount}
                  onChange={(e) => updateSegment(index, { totalAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {segment.type === "CRUISE" && (
                <>
                  <div>
                    <label className="label">Compagnie croisière</label>
                    <input
                      className="input"
                      value={segment.details.cruiseLine ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "cruiseLine", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Navire</label>
                    <input
                      className="input"
                      value={segment.details.shipName ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "shipName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Catégorie cabine</label>
                    <input
                      className="input"
                      value={segment.details.cabinCategory ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "cabinCategory", e.target.value)}
                    />
                  </div>
                </>
              )}

              {segment.type === "FLIGHT" && (
                <>
                  <div>
                    <label className="label">Compagnie aérienne</label>
                    <input
                      className="input"
                      value={segment.details.airlineName ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "airlineName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">PNR</label>
                    <input
                      className="input"
                      value={segment.details.pnr ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "pnr", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Classe</label>
                    <input
                      className="input"
                      value={segment.details.cabinClass ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "cabinClass", e.target.value)}
                    />
                  </div>
                </>
              )}

              {segment.type === "HOTEL" && (
                <>
                  <div>
                    <label className="label">Hôtel</label>
                    <input
                      className="input"
                      value={segment.details.hotelName ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "hotelName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Rue</label>
                    <input
                      className="input"
                      value={segment.details.street ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "street", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Ville</label>
                    <input
                      className="input"
                      value={segment.details.city ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Province</label>
                    <input
                      className="input"
                      value={segment.details.province ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "province", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Pays</label>
                    <input
                      className="input"
                      value={segment.details.country ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "country", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Code postal</label>
                    <input
                      className="input"
                      value={segment.details.zipCode ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "zipCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Type chambre</label>
                    <input
                      className="input"
                      value={segment.details.roomType ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "roomType", e.target.value)}
                    />
                  </div>
                </>
              )}

              {segment.type === "TRANSFER" && (
                <>
                  <div>
                    <label className="label">Type transfert</label>
                    <input
                      className="input"
                      value={segment.details.transferType ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "transferType", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Lieu prise en charge</label>
                    <input
                      className="input"
                      value={segment.details.pickupLocation ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "pickupLocation", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Lieu dépôt</label>
                    <input
                      className="input"
                      value={segment.details.dropoffLocation ?? ""}
                      onChange={(e) =>
                        updateSegmentDetail(index, "dropoffLocation", e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {segment.type === "ACTIVITY" && (
                <>
                  <div>
                    <label className="label">Activité</label>
                    <input
                      className="input"
                      value={segment.details.activityName ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "activityName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Durée</label>
                    <input
                      className="input"
                      value={segment.details.duration ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "duration", e.target.value)}
                    />
                  </div>
                </>
              )}

              {segment.type === "INSURANCE" && (
                <>
                  <div>
                    <label className="label">Fournisseur assurance</label>
                    <input
                      className="input"
                      value={segment.details.provider ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "provider", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Police</label>
                    <input
                      className="input"
                      value={segment.details.policyNumber ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "policyNumber", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Type couverture</label>
                    <input
                      className="input"
                      value={segment.details.coverageType ?? ""}
                      onChange={(e) => updateSegmentDetail(index, "coverageType", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Notes client</label>
                <textarea
                  className="input"
                  rows={2}
                  value={segment.clientNotes}
                  onChange={(e) => updateSegment(index, { clientNotes: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Notes internes</label>
                <textarea
                  className="input"
                  rows={2}
                  value={segment.internalNotes}
                  onChange={(e) => updateSegment(index, { internalNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap text-sm text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={segment.includedInPackage}
                  onChange={(e) => updateSegment(index, { includedInPackage: e.target.checked })}
                />
                Inclus au forfait
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={segment.optionalForClient}
                  onChange={(e) => updateSegment(index, { optionalForClient: e.target.checked })}
                />
                Optionnel client
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={segment.clientVisible}
                  onChange={(e) => updateSegment(index, { clientVisible: e.target.checked })}
                />
                Visible client
              </label>
            </div>
          </div>
        ))}
      </section>

      {/* PAYMENTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-navy">Paiements</h2>
          <button type="button" className="btn-secondary text-xs" onClick={addPayment}>
            + Ajouter paiement
          </button>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun paiement saisi.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div
                key={`payment-${index}`}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-navy">Paiement {index + 1}</h3>
                  <button
                    type="button"
                    className="btn-danger text-xs"
                    onClick={() => removePayment(index)}
                  >
                    Retirer
                  </button>
                </div>
                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="label">Montant</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={payment.amount}
                      onChange={(e) => updatePayment(index, { amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Devise</label>
                    <input
                      className="input"
                      value={payment.currency}
                      onChange={(e) => updatePayment(index, { currency: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Date paiement</label>
                    <input
                      type="date"
                      className="input"
                      value={payment.paidAt}
                      onChange={(e) => updatePayment(index, { paidAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Méthode</label>
                    <select
                      className="input"
                      value={payment.method}
                      onChange={(e) =>
                        updatePayment(index, { method: e.target.value as PaymentDraft["method"] })
                      }
                    >
                      <option value="">-</option>
                      <option value="CARD">Carte</option>
                      <option value="BANK_TRANSFER">Virement</option>
                      <option value="CASH">Comptant</option>
                      <option value="CHECK">Chèque</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Statut</label>
                    <select
                      className="input"
                      value={payment.status}
                      onChange={(e) =>
                        updatePayment(index, { status: e.target.value as PaymentDraft["status"] })
                      }
                    >
                      <option value="PENDING">En attente</option>
                      <option value="AUTHORIZED">Autorisé</option>
                      <option value="PAID">Payé</option>
                      <option value="FAILED">Échoué</option>
                      <option value="REFUNDED">Remboursé</option>
                      <option value="VOIDED">Annulé</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select
                      className="input"
                      value={payment.type}
                      onChange={(e) =>
                        updatePayment(index, { type: e.target.value as PaymentDraft["type"] })
                      }
                    >
                      <option value="DEPOSIT">Dépôt</option>
                      <option value="INTERIM">Intermédiaire</option>
                      <option value="FINAL">Final</option>
                      <option value="REFUND">Remboursement</option>
                      <option value="ADJUSTMENT">Ajustement</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Échéance finale</label>
                    <input
                      type="date"
                      className="input"
                      value={payment.finalDueDate}
                      onChange={(e) => updatePayment(index, { finalDueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Référence externe</label>
                    <input
                      className="input"
                      value={payment.externalReference}
                      onChange={(e) => updatePayment(index, { externalReference: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap text-sm text-slate-600">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={payment.isFinalPayment}
                      onChange={(e) => updatePayment(index, { isFinalPayment: e.target.checked })}
                    />
                    Paiement final
                  </label>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={payment.notes}
                    onChange={(e) => updatePayment(index, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SCHEDULES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-navy">Échéances de paiement</h2>
          <button type="button" className="btn-secondary text-xs" onClick={addSchedule}>
            + Ajouter échéance
          </button>
        </div>
        {schedules.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune échéance définie.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule, index) => (
              <div
                key={`schedule-${index}`}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-navy">Échéance {index + 1}</h3>
                  <button
                    type="button"
                    className="btn-danger text-xs"
                    onClick={() => removeSchedule(index)}
                  >
                    Retirer
                  </button>
                </div>
                <div className="grid sm:grid-cols-5 gap-3">
                  <div>
                    <label className="label">Libellé</label>
                    <input
                      className="input"
                      value={schedule.label}
                      onChange={(e) => updateSchedule(index, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Montant</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={schedule.amount}
                      onChange={(e) => updateSchedule(index, { amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Devise</label>
                    <input
                      className="input"
                      value={schedule.currency}
                      onChange={(e) => updateSchedule(index, { currency: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Date d'échéance</label>
                    <input
                      type="date"
                      className="input"
                      value={schedule.dueDate}
                      onChange={(e) => updateSchedule(index, { dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Statut</label>
                    <select
                      className="input"
                      value={schedule.status}
                      onChange={(e) =>
                        updateSchedule(index, {
                          status: e.target.value as PaymentScheduleDraft["status"],
                        })
                      }
                    >
                      <option value="PENDING">En attente</option>
                      <option value="AUTHORIZED">Autorisé</option>
                      <option value="PAID">Payé</option>
                      <option value="FAILED">Échoué</option>
                      <option value="REFUNDED">Remboursé</option>
                      <option value="VOIDED">Annulé</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={schedule.notes}
                    onChange={(e) => updateSchedule(index, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* NOTES */}
      <section className="space-y-4">
        <h2 className="font-semibold text-navy">Notes</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="clientNotes">
              Notes visibles client
            </label>
            <textarea
              id="clientNotes"
              name="clientNotes"
              rows={3}
              defaultValue={booking?.clientNotes ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="internalNotes">
              Notes internes
            </label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              rows={3}
              defaultValue={booking?.internalNotes ?? booking?.notes ?? ""}
              className="input"
            />
          </div>
        </div>
      </section>

      <input type="hidden" name="segmentsJson" value={segmentsJson} />
      <input type="hidden" name="paymentsJson" value={paymentsJson} />
      <input type="hidden" name="paymentSchedulesJson" value={schedulesJson} />
      <button className="btn-primary">{submitLabel}</button>
    </form>
  );
}
