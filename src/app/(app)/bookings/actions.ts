"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { BookingStatus, CabinType } from "@prisma/client";

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

async function nextReference() {
  const year = new Date().getFullYear();
  const count = await prisma.booking.count();
  return `CR-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createBooking(formData: FormData) {
  const user = await requireUser();
  const clientId = str(formData, "clientId");
  const sailingDate = date(formData, "sailingDate");
  const totalPrice = num(formData, "totalPrice");
  if (!clientId || !sailingDate || totalPrice === null) redirect("/bookings/new?error=1");

  const itineraryId = str(formData, "itineraryId");
  let returnDate = date(formData, "returnDate");
  if (!returnDate && itineraryId) {
    const it = await prisma.itinerary.findUnique({ where: { id: itineraryId } });
    if (it) {
      returnDate = new Date(sailingDate!);
      returnDate.setDate(returnDate.getDate() + it.nights);
    }
  }

  const booking = await prisma.booking.create({
    data: {
      reference: await nextReference(),
      clientId: clientId!,
      itineraryId,
      sailingDate: sailingDate!,
      returnDate,
      cabinType: (str(formData, "cabinType") ?? "INTERIOR") as CabinType,
      cabinNumber: str(formData, "cabinNumber"),
      passengers: num(formData, "passengers") ?? 2,
      totalPrice: totalPrice!,
      deposit: num(formData, "deposit"),
      commission: num(formData, "commission"),
      balanceDueDate: date(formData, "balanceDueDate"),
      status: (str(formData, "status") ?? "OPTION") as BookingStatus,
      notes: str(formData, "notes"),
      userId: user.id,
    },
  });
  revalidatePath("/bookings");
  redirect(`/bookings/${booking.id}`);
}

export async function updateBooking(id: string, formData: FormData) {
  await requireUser();
  await prisma.booking.update({
    where: { id },
    data: {
      sailingDate: date(formData, "sailingDate") ?? undefined,
      returnDate: date(formData, "returnDate"),
      itineraryId: str(formData, "itineraryId"),
      cabinType: (str(formData, "cabinType") ?? "INTERIOR") as CabinType,
      cabinNumber: str(formData, "cabinNumber"),
      passengers: num(formData, "passengers") ?? 2,
      totalPrice: num(formData, "totalPrice") ?? undefined,
      deposit: num(formData, "deposit"),
      commission: num(formData, "commission"),
      balanceDueDate: date(formData, "balanceDueDate"),
      status: (str(formData, "status") ?? "OPTION") as BookingStatus,
      notes: str(formData, "notes"),
    },
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
