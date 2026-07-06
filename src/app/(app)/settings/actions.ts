"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function addCruiseLine(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.cruiseLine.upsert({ where: { name }, update: {}, create: { name } });
  revalidatePath("/settings");
}

export async function addShip(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const cruiseLineId = String(formData.get("cruiseLineId") ?? "");
  if (!name || !cruiseLineId) return;
  await prisma.ship.create({ data: { name, cruiseLineId } });
  revalidatePath("/settings");
}

export async function deleteShip(id: string) {
  await requireUser();
  await prisma.ship.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function createUser(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "AGENT") as Role;
  if (!email || !name || password.length < 8) return;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return;
  await prisma.user.create({
    data: { email, name, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/settings");
}
