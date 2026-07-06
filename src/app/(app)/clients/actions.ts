"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function parseClientForm(formData: FormData) {
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const date = (k: string) => {
    const v = str(k);
    return v ? new Date(v) : null;
  };
  return {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    email: str("email"),
    phone: str("phone"),
    dateOfBirth: date("dateOfBirth"),
    nationality: str("nationality"),
    passportNumber: str("passportNumber"),
    passportExpiry: date("passportExpiry"),
    address: str("address"),
    preferences: str("preferences"),
    notes: str("notes"),
  };
}

export async function createClient(formData: FormData) {
  await requireUser();
  const data = parseClientForm(formData);
  if (!data.firstName || !data.lastName) redirect("/clients/new?error=1");
  const client = await prisma.client.create({ data });
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  await requireUser();
  const data = parseClientForm(formData);
  await prisma.client.update({ where: { id }, data });
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  await requireUser();
  const bookings = await prisma.booking.count({ where: { clientId: id } });
  if (bookings > 0) redirect(`/clients/${id}?error=has-bookings`);
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}
