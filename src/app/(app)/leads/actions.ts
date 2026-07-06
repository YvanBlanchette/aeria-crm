"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { LeadStatus, ActivityType } from "@prisma/client";

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/leads/new?error=1");
  const budget = str(formData, "budget");
  const lead = await prisma.lead.create({
    data: {
      title,
      source: str(formData, "source"),
      destination: str(formData, "destination"),
      travelPeriod: str(formData, "travelPeriod"),
      budget: budget ? Number(budget) : null,
      contactName: str(formData, "contactName"),
      contactEmail: str(formData, "contactEmail"),
      contactPhone: str(formData, "contactPhone"),
      notes: str(formData, "notes"),
      clientId: str(formData, "clientId"),
      userId: user.id,
    },
  });
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatus(id: string, formData: FormData) {
  await requireUser();
  const status = String(formData.get("status")) as LeadStatus;
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function addActivity(leadId: string, formData: FormData) {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  const type = String(formData.get("type") ?? "NOTE") as ActivityType;
  await prisma.activity.create({ data: { leadId, content, type, userId: user.id } });
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLead(id: string) {
  await requireUser();
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/leads");
  redirect("/leads");
}

/** Convertit un prospect gagné : crée le client s'il n'existe pas et marque WON. */
export async function convertLead(id: string) {
  await requireUser();
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) redirect("/leads");
  let clientId = lead.clientId;
  if (!clientId && lead.contactName) {
    const [firstName, ...rest] = lead.contactName.split(" ");
    const client = await prisma.client.create({
      data: {
        firstName: firstName || lead.contactName,
        lastName: rest.join(" ") || "—",
        email: lead.contactEmail,
        phone: lead.contactPhone,
      },
    });
    clientId = client.id;
  }
  await prisma.lead.update({ where: { id }, data: { status: "WON", clientId } });
  revalidatePath("/leads");
  redirect(clientId ? `/bookings/new?clientId=${clientId}` : `/leads/${id}`);
}
