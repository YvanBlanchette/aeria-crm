"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { BookingStatus, CabinType, PaymentMethod, PaymentStatus, PaymentType, SegmentType } from "@prisma/client";

const str = (fd: FormData, k: string) => {
	const v = String(fd.get(k) ?? "").trim();
	return v === "" ? null : v;
};
const num = (fd: FormData, k: string) => {
	const v = str(fd, k);
	return v ? Number(v) : null;
};
const date = (fd: FormData, k: string) => {
	const v = str(fd, k);
	return v ? new Date(v) : null;
};

type SegmentInput = {
	type: SegmentType;
	title?: string;
	supplierName?: string;
	startAt?: string;
	endAt?: string;
	confirmationNumber?: string;
	includedInPackage?: boolean;
	optionalForClient?: boolean;
	clientVisible?: boolean;
	currency?: string;
	baseAmount?: string;
	taxesAmount?: string;
	feesAmount?: string;
	totalAmount?: string;
	internalNotes?: string;
	clientNotes?: string;
	details?: Record<string, string>;
};

type PaymentInput = {
	amount?: string;
	currency?: string;
	paidAt?: string;
	method?: PaymentMethod | "";
	status?: PaymentStatus;
	type?: PaymentType;
	isFinalPayment?: boolean;
	finalDueDate?: string;
	externalReference?: string;
	notes?: string;
};

type PaymentScheduleInput = {
	label?: string;
	amount?: string;
	currency?: string;
	dueDate?: string;
	status?: PaymentStatus;
	notes?: string;
};

function parseSegments(fd: FormData): SegmentInput[] {
	const raw = str(fd, "segmentsJson");
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		const allowed = new Set<SegmentType>(["CRUISE", "FLIGHT", "HOTEL", "TRANSFER", "ACTIVITY", "INSURANCE", "FEE", "OTHER"]);
		return parsed.filter((s) => s && allowed.has(s.type as SegmentType));
	} catch {
		return [];
	}
}

function parsePayments(fd: FormData): PaymentInput[] {
	const raw = str(fd, "paymentsJson");
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed;
	} catch {
		return [];
	}
}

function parsePaymentSchedules(fd: FormData): PaymentScheduleInput[] {
	const raw = str(fd, "paymentSchedulesJson");
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed;
	} catch {
		return [];
	}
}

function toAmount(value?: string) {
	if (!value) return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

async function createSegments(tx: any, bookingId: string, segments: SegmentInput[], defaultCurrency: string) {
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];
		const created = await tx.bookingSegment.create({
			data: {
				bookingId,
				type: segment.type,
				title: segment.title || null,
				sortOrder: i,
				supplierName: segment.supplierName || null,
				startAt: segment.startAt ? new Date(segment.startAt) : null,
				endAt: segment.endAt ? new Date(segment.endAt) : null,
				confirmationNumber: segment.confirmationNumber || null,
				includedInPackage: segment.includedInPackage ?? true,
				optionalForClient: segment.optionalForClient ?? false,
				clientVisible: segment.clientVisible ?? true,
				currency: segment.currency || defaultCurrency,
				baseAmount: toAmount(segment.baseAmount),
				taxesAmount: toAmount(segment.taxesAmount),
				feesAmount: toAmount(segment.feesAmount),
				totalAmount: toAmount(segment.totalAmount),
				internalNotes: segment.internalNotes || null,
				clientNotes: segment.clientNotes || null,
				extra: segment.details ?? undefined,
			},
		});

		const d = segment.details ?? {};
		if (segment.type === "CRUISE") {
			await tx.cruiseSegment.create({
				data: {
					segmentId: created.id,
					cruiseLine: d.cruiseLine || null,
					shipName: d.shipName || null,
					cabinCategory: d.cabinCategory || null,
					cruiseBookingNumber: d.cruiseBookingNumber || null,
				},
			});
		}

		if (segment.type === "FLIGHT") {
			await tx.flightSegment.create({
				data: {
					segmentId: created.id,
					airlineName: d.airlineName || null,
					pnr: d.pnr || null,
					cabinClass: d.cabinClass || null,
				},
			});
		}

		if (segment.type === "HOTEL") {
			await tx.hotelSegment.create({
				data: {
					segmentId: created.id,
					hotelName: d.hotelName || null,
					city: d.city || null,
					roomType: d.roomType || null,
				},
			});
		}

		if (segment.type === "TRANSFER") {
			await tx.transferSegment.create({
				data: {
					segmentId: created.id,
					transferType: d.transferType || null,
					pickupLocation: d.pickupLocation || null,
					dropoffLocation: d.dropoffLocation || null,
				},
			});
		}

		if (segment.type === "ACTIVITY") {
			await tx.activitySegment.create({
				data: {
					segmentId: created.id,
					activityName: d.activityName || null,
					duration: d.duration || null,
				},
			});
		}

		if (segment.type === "INSURANCE") {
			await tx.insuranceSegment.create({
				data: {
					segmentId: created.id,
					provider: d.provider || null,
					policyNumber: d.policyNumber || null,
					coverageType: d.coverageType || null,
				},
			});
		}
	}
}

async function createPaymentsAndSchedules(tx: any, bookingId: string, payments: PaymentInput[], schedules: PaymentScheduleInput[], defaultCurrency: string) {
	for (const p of payments) {
		const amount = toAmount(p.amount);
		if (amount === null) continue;

		await tx.bookingPayment.create({
			data: {
				bookingId,
				amount,
				currency: p.currency || defaultCurrency,
				paidAt: p.paidAt ? new Date(p.paidAt) : null,
				method: p.method || null,
				status: p.status ?? "PENDING",
				type: p.type ?? "INTERIM",
				isFinalPayment: p.isFinalPayment ?? false,
				finalDueDate: p.finalDueDate ? new Date(p.finalDueDate) : null,
				externalReference: p.externalReference || null,
				notes: p.notes || null,
			},
		});
	}

	for (const s of schedules) {
		const amount = toAmount(s.amount);
		if (amount === null || !s.dueDate) continue;

		await tx.bookingPaymentSchedule.create({
			data: {
				bookingId,
				label: s.label || null,
				amount,
				currency: s.currency || defaultCurrency,
				dueDate: new Date(s.dueDate),
				status: s.status ?? "PENDING",
				notes: s.notes || null,
			},
		});
	}
}

async function nextReference() {
	const settings = await prisma.agencySettings.findUnique({
		where: { id: "default" },
		select: { bookingPrefix: true },
	});
	const prefix = settings?.bookingPrefix?.trim().toUpperCase() || "CR";
	const year = new Date().getFullYear();
	const count = await prisma.booking.count();
	return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createBooking(formData: FormData) {
	const user = await requireUser();
	const settings = await prisma.agencySettings.findUnique({
		where: { id: "default" },
		select: { defaultDepositPct: true, balanceDueDays: true },
	});
	const clientId = str(formData, "clientId");
	const globalDepartureDate = date(formData, "globalDepartureDate");
	const globalReturnDate = date(formData, "globalReturnDate");
	const segments = parseSegments(formData);
	const payments = parsePayments(formData);
	const paymentSchedules = parsePaymentSchedules(formData);
	if (!clientId || !globalDepartureDate) redirect("/bookings/new?error=1");

	let totalPrice = num(formData, "totalPrice");
	if (totalPrice === null) {
		totalPrice = segments.reduce((sum, s) => {
			const t = toAmount(s.totalAmount);
			if (t !== null) return sum + t;
			const base = toAmount(s.baseAmount) ?? 0;
			const taxes = toAmount(s.taxesAmount) ?? 0;
			const fees = toAmount(s.feesAmount) ?? 0;
			return sum + base + taxes + fees;
		}, 0);
	}

	const itineraryId = str(formData, "itineraryId");
	const sailingDate = globalDepartureDate;
	const returnDate = globalReturnDate;

	let deposit = num(formData, "deposit");
	if (deposit === null && totalPrice !== null) {
		const pct = settings?.defaultDepositPct ?? 25;
		deposit = Math.round(totalPrice * (pct / 100) * 100) / 100;
	}

	let balanceDueDate = date(formData, "balanceDueDate");
	if (!balanceDueDate && globalDepartureDate) {
		const days = settings?.balanceDueDays ?? 45;
		balanceDueDate = new Date(globalDepartureDate);
		balanceDueDate.setDate(balanceDueDate.getDate() - days);
	}

	const defaultCurrency = str(formData, "currency") ?? "CAD";

	const booking = await prisma.booking.create({
		data: {
			reference: await nextReference(),
			clientId: clientId!,
			packageType: str(formData, "packageType"),
			destinationMain: str(formData, "destinationMain"),
			supplierMain: str(formData, "supplierMain"),
			currency: defaultCurrency,
			internalFileNumber: str(formData, "internalFileNumber"),
			clientNotes: str(formData, "clientNotes"),
			internalNotes: str(formData, "internalNotes"),
			globalDepartureDate,
			globalReturnDate,
			serviceFees: num(formData, "serviceFees"),
			totalNet: num(formData, "totalNet"),
			totalCommission: num(formData, "totalCommission"),
			itineraryId,
			sailingDate: sailingDate!,
			returnDate,
			cabinType: (str(formData, "cabinType") ?? "INTERIOR") as CabinType,
			cabinNumber: str(formData, "cabinNumber"),
			passengers: num(formData, "passengers") ?? 2,
			totalPrice: totalPrice!,
			deposit,
			commission: num(formData, "commission"),
			balanceDueDate,
			status: (str(formData, "status") ?? "OPTION") as BookingStatus,
			notes: str(formData, "internalNotes"),
			userId: user.id,
		},
	});

	await createSegments(prisma, booking.id, segments, defaultCurrency);
	await createPaymentsAndSchedules(prisma, booking.id, payments, paymentSchedules, defaultCurrency);
	revalidatePath("/bookings");
	redirect(`/bookings/${booking.id}`);
}

export async function updateBooking(id: string, formData: FormData) {
	await requireUser();
	const segments = parseSegments(formData);
	const payments = parsePayments(formData);
	const paymentSchedules = parsePaymentSchedules(formData);
	const globalDepartureDate = date(formData, "globalDepartureDate");
	const globalReturnDate = date(formData, "globalReturnDate");
	const defaultCurrency = str(formData, "currency") ?? "CAD";

	await prisma.$transaction(async (tx) => {
		await tx.booking.update({
			where: { id },
			data: {
				status: (str(formData, "status") ?? "OPTION") as BookingStatus,
				packageType: str(formData, "packageType"),
				destinationMain: str(formData, "destinationMain"),
				supplierMain: str(formData, "supplierMain"),
				currency: defaultCurrency,
				internalFileNumber: str(formData, "internalFileNumber"),
				clientNotes: str(formData, "clientNotes"),
				internalNotes: str(formData, "internalNotes"),
				globalDepartureDate,
				globalReturnDate,
				sailingDate: globalDepartureDate ?? undefined,
				returnDate: globalReturnDate,
				totalPrice: num(formData, "totalPrice") ?? undefined,
				totalNet: num(formData, "totalNet"),
				totalCommission: num(formData, "totalCommission"),
				serviceFees: num(formData, "serviceFees"),
				deposit: num(formData, "deposit"),
				commission: num(formData, "commission"),
				balanceDueDate: date(formData, "balanceDueDate"),
				notes: str(formData, "internalNotes"),
				itineraryId: str(formData, "itineraryId"),
				cabinType: (str(formData, "cabinType") ?? "INTERIOR") as CabinType,
				cabinNumber: str(formData, "cabinNumber"),
				passengers: num(formData, "passengers") ?? 2,
			},
		});

		await tx.bookingSegment.deleteMany({ where: { bookingId: id } });
		await tx.bookingPaymentSchedule.deleteMany({ where: { bookingId: id } });
		await tx.bookingPayment.deleteMany({ where: { bookingId: id } });
		await createSegments(tx, id, segments, defaultCurrency);
		await createPaymentsAndSchedules(tx, id, payments, paymentSchedules, defaultCurrency);
	});
	revalidatePath("/bookings");
	revalidatePath(`/bookings/${id}`);
	redirect(`/bookings/${id}`);
}

export async function deleteBooking(id: string) {
	await requireUser();
	await prisma.booking.delete({ where: { id } });
	revalidatePath("/bookings");
	redirect("/bookings");
}
