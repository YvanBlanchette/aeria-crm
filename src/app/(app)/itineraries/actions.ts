"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};

export async function createItinerary(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const nights = Number(formData.get("nights"));
  const departurePort = String(formData.get("departurePort") ?? "").trim();
  if (!name || !nights || !departurePort) redirect("/itineraries/new?error=1");

  const itinerary = await prisma.itinerary.create({
    data: {
      name,
      nights,
      departurePort,
      arrivalPort: str(formData, "arrivalPort"),
      description: str(formData, "description"),
      shipId: str(formData, "shipId"),
      // Jour 1 : embarquement au port de départ
      days: { create: [{ dayNumber: 1, port: departurePort }] },
    },
  });
  revalidatePath("/itineraries");
  redirect(`/itineraries/${itinerary.id}`);
}

export async function addDay(itineraryId: string, formData: FormData) {
  await requireUser();
  const isSeaDay = formData.get("isSeaDay") === "on";
  const port = isSeaDay ? "Journée en mer" : String(formData.get("port") ?? "").trim();
  if (!port) return;
  const last = await prisma.itineraryDay.findFirst({
    where: { itineraryId },
    orderBy: { dayNumber: "desc" },
  });
  await prisma.itineraryDay.create({
    data: {
      itineraryId,
      dayNumber: (last?.dayNumber ?? 0) + 1,
      port,
      country: str(formData, "country"),
      arrival: str(formData, "arrival"),
      departure: str(formData, "departure"),
      notes: str(formData, "notes"),
      isSeaDay,
    },
  });
  revalidatePath(`/itineraries/${itineraryId}`);
}

export async function removeDay(itineraryId: string, dayId: string) {
  await requireUser();
  await prisma.itineraryDay.delete({ where: { id: dayId } });
  // Renuméroter les jours restants
  const days = await prisma.itineraryDay.findMany({
    where: { itineraryId },
    orderBy: { dayNumber: "asc" },
  });
  for (let i = 0; i < days.length; i++) {
    if (days[i].dayNumber !== i + 1) {
      await prisma.itineraryDay.update({ where: { id: days[i].id }, data: { dayNumber: i + 1 } });
    }
  }
  revalidatePath(`/itineraries/${itineraryId}`);
}

export async function deleteItinerary(id: string) {
  await requireUser();
  const bookings = await prisma.booking.count({ where: { itineraryId: id } });
  if (bookings > 0) redirect(`/itineraries/${id}?error=has-bookings`);
  await prisma.itinerary.delete({ where: { id } });
  revalidatePath("/itineraries");
  redirect("/itineraries");
}
