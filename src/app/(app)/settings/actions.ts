"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { Prisma, Role } from "@prisma/client";
import { redirect } from "next/navigation";

async function logSettingsEvent(input: {
  actorUserId: string;
  action: string;
  summary: string;
  target?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.settingsAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      summary: input.summary,
      target: input.target,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

const toNullable = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

const toBoundedInt = (v: FormDataEntryValue | null, fallback: number, min: number, max: number) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

function redirectToSettings(
  formData: FormData,
  params: Record<string, string | number | boolean | undefined>,
  fallbackTab: string,
  fallbackSubtab?: string,
) {
  const tab = String(formData.get("returnTab") ?? fallbackTab);
  const subtab = String(formData.get("returnSubtab") ?? fallbackSubtab ?? "");
  const searchParams = new URLSearchParams();
  searchParams.set("tab", tab);
  if (subtab) searchParams.set("subtab", subtab);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.set(key, String(value));
  }

  redirect(`/settings?${searchParams.toString()}`);
}

export async function addCruiseLine(formData: FormData) {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirectToSettings(formData, { data: "invalid" }, "data", "cruise-lines");
  }
  await prisma.cruiseLine.upsert({ where: { name }, update: {}, create: { name } });
  await logSettingsEvent({
    actorUserId: me.id,
    action: "cruise_line_added",
    summary: `Compagnie ajoutée: ${name}`,
    target: "cruiseLine",
  });
  revalidatePath("/settings");
  redirectToSettings(formData, { data: "updated" }, "data", "cruise-lines");
}

export async function addShip(formData: FormData) {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const cruiseLineId = String(formData.get("cruiseLineId") ?? "");
  if (!name || !cruiseLineId) {
    redirectToSettings(formData, { data: "invalid" }, "data", "ships");
  }
  await prisma.ship.create({ data: { name, cruiseLineId } });
  await logSettingsEvent({
    actorUserId: me.id,
    action: "ship_added",
    summary: `Navire ajouté: ${name}`,
    target: "ship",
  });
  revalidatePath("/settings");
  redirectToSettings(formData, { data: "updated" }, "data", "ships");
}

export async function deleteShip(id: string, formData: FormData) {
  const me = await requireUser();
  const ship = await prisma.ship.findUnique({ where: { id }, select: { name: true } });
  if (!ship) {
    redirectToSettings(formData, { data: "invalid" }, "data", "ships");
  }
  await prisma.ship.delete({ where: { id } });
  await logSettingsEvent({
    actorUserId: me.id,
    action: "ship_deleted",
    summary: `Navire supprimé: ${ship?.name ?? id}`,
    target: "ship",
  });
  revalidatePath("/settings");
  redirectToSettings(formData, { data: "updated" }, "data", "ships");
}

export async function createUser(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return;
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "AGENT") as Role;
  if (!email || !name || password.length < 8) {
    redirectToSettings(formData, { team: "invalid" }, "team");
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    redirectToSettings(formData, { team: "invalid" }, "team");
  }
  await prisma.user.create({
    data: { email, name, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  await logSettingsEvent({
    actorUserId: me.id,
    action: "team_user_created",
    summary: `Utilisateur créé: ${email}`,
    target: "user",
    metadata: { role },
  });
  revalidatePath("/settings");
  redirectToSettings(formData, { team: "created" }, "team");
}

export async function saveAgencySettings(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return;

  const agencyName = String(formData.get("agencyName") ?? "").trim();
  if (!agencyName) {
    redirectToSettings(formData, { saved: "invalid" }, "agency");
  }

  const data = {
    agencyName,
    legalName: toNullable(formData.get("legalName")),
    contactEmail: toNullable(formData.get("contactEmail")),
    contactPhone: toNullable(formData.get("contactPhone")),
    website: toNullable(formData.get("website")),
    street: toNullable(formData.get("street")),
    city: toNullable(formData.get("city")),
    province: toNullable(formData.get("province")),
    country: toNullable(formData.get("country")),
    zipCode: toNullable(formData.get("zipCode")),
    timezone: String(formData.get("timezone") ?? "America/Toronto"),
    defaultCurrency: String(formData.get("defaultCurrency") ?? "CAD"),
    defaultLanguage: String(formData.get("defaultLanguage") ?? "fr"),
    bookingPrefix:
      String(formData.get("bookingPrefix") ?? "CR")
        .trim()
        .toUpperCase() || "CR",
    defaultDepositPct: toBoundedInt(formData.get("defaultDepositPct"), 25, 0, 100),
    balanceDueDays: toBoundedInt(formData.get("balanceDueDays"), 45, 0, 365),
    passportAlertDays: toBoundedInt(formData.get("passportAlertDays"), 180, 1, 3650),
    defaultClientView: String(formData.get("defaultClientView") ?? "active"),
    autoArchiveLostLeads: formData.get("autoArchiveLostLeads") === "on",
  };

  await prisma.agencySettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...data,
    },
    update: data,
  });

  await logSettingsEvent({
    actorUserId: me.id,
    action: "agency_settings_updated",
    summary: "Mise à jour des paramètres agence",
    target: "agencySettings",
    metadata: {
      bookingPrefix: data.bookingPrefix,
      defaultDepositPct: data.defaultDepositPct,
      balanceDueDays: data.balanceDueDays,
      passportAlertDays: data.passportAlertDays,
      defaultClientView: data.defaultClientView,
    },
  });

  revalidatePath("/settings");
  redirectToSettings(formData, { saved: 1 }, "agency");
}

export async function updateMyPassword(formData: FormData) {
  const me = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8 || newPassword !== confirmPassword) {
    redirectToSettings(formData, { pwd: "invalid" }, "profile");
  }

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  const passwordHash = user?.passwordHash;
  if (!passwordHash) {
    redirectToSettings(formData, { pwd: "wrong" }, "profile");
    return;
  }

  const ok = await bcrypt.compare(currentPassword, passwordHash);
  if (!ok) redirectToSettings(formData, { pwd: "wrong" }, "profile");

  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  await logSettingsEvent({
    actorUserId: me.id,
    action: "my_password_updated",
    summary: "Mise à jour du mot de passe personnel",
    target: "user",
  });

  revalidatePath("/settings");
  redirectToSettings(formData, { pwd: "updated" }, "profile");
}

export async function resetUserPassword(userId: string, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return;

  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (newPassword.length < 8) {
    redirectToSettings(formData, { teamPwd: "invalid" }, "team");
  }
  if (newPassword !== confirmPassword) {
    redirectToSettings(formData, { teamPwd: "mismatch" }, "team");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const targetUserEmail = targetUser?.email;
  if (!targetUserEmail) {
    redirectToSettings(formData, { teamPwd: "invalid" }, "team");
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  await logSettingsEvent({
    actorUserId: me.id,
    action: "team_password_reset",
    summary: `Réinitialisation du mot de passe: ${targetUserEmail}`,
    target: "user",
  });

  revalidatePath("/settings");
  redirectToSettings(formData, { teamPwd: "updated" }, "team");
}
