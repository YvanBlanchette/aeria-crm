"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import { getSessionUserId, requireUser } from "@/lib/auth";
import { decryptPassportNumber, encryptPassportNumber } from "@/lib/passport";

function parseClientForm(formData: FormData) {
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const bool = (k: string) => formData.get(k) === "on";
  const date = (k: string) => {
    const v = str(k);
    return v ? new Date(v) : null;
  };
  return {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    middleName: str("middleName"),
    email: str("email"),
    secondaryEmail: str("secondaryEmail"),
    phone: str("phone"),
    secondaryPhone: str("secondaryPhone"),
    preferredLanguage: str("preferredLanguage"),
    preferredContactMethod: str("preferredContactMethod"),
    emailOptIn: bool("emailOptIn"),
    smsOptIn: bool("smsOptIn"),
    dateOfBirth: date("dateOfBirth"),
    nationality: str("nationality"),
    passportNumber: encryptPassportNumber(str("passportNumber")),
    passportExpiry: date("passportExpiry"),
    passportIssueCountry: str("passportIssueCountry"),
    passportIssueDate: date("passportIssueDate"),
    passportPlaceOfBirth: str("passportPlaceOfBirth"),
    knownTravelerNumber: str("knownTravelerNumber"),
    tsaPrecheckNumber: str("tsaPrecheckNumber"),
    redressNumber: str("redressNumber"),
    cruiseLoyaltyPrograms: str("cruiseLoyaltyPrograms"),
    airlineLoyaltyPrograms: str("airlineLoyaltyPrograms"),
    hotelLoyaltyPrograms: str("hotelLoyaltyPrograms"),
    emergencyContactName: str("emergencyContactName"),
    emergencyContactRelation: str("emergencyContactRelation"),
    emergencyContactPhone: str("emergencyContactPhone"),
    emergencyContactEmail: str("emergencyContactEmail"),
    street: str("street"),
    city: str("city"),
    province: str("province"),
    country: str("country"),
    zipCode: str("zipCode"),
    billingCompany: str("billingCompany"),
    billingTaxNumber: str("billingTaxNumber"),
    billingStreet: str("billingStreet"),
    billingCity: str("billingCity"),
    billingProvince: str("billingProvince"),
    billingCountry: str("billingCountry"),
    billingZipCode: str("billingZipCode"),
    preferences: str("preferences"),
    roomPreferences: str("roomPreferences"),
    dietaryRestrictions: str("dietaryRestrictions"),
    accessibilityNeeds: str("accessibilityNeeds"),
    specialOccasions: str("specialOccasions"),
    travelInsuranceProvider: str("travelInsuranceProvider"),
    travelInsurancePolicyNumber: str("travelInsurancePolicyNumber"),
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
  await prisma.client.update({ where: { id }, data: { archivedAt: new Date() } });
  revalidatePath("/clients");
  redirect("/clients?archived=1");
}

export async function restoreClient(id: string) {
  await requireUser();
  await prisma.client.update({ where: { id }, data: { archivedAt: null } });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}?restored=1`);
}

function parseDate(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function splitContactName(fullName: string) {
  const clean = fullName.trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "", lastName: "" };
  const parts = clean.split(" ");
  const firstName = parts.shift() ?? "";
  const lastName = parts.join(" ").trim() || "—";
  return { firstName, lastName };
}

function normalize(v: string | null) {
  return v?.trim() || null;
}

export async function importClientsCsv(formData: FormData) {
  await requireUser();

  const file = formData.get("csvFile");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/clients?importError=file");
  }

  const clientOnly = formData.get("clientOnly") === "on";
  const activeOnly = formData.get("activeOnly") === "on";
  const previewOnly = formData.get("previewOnly") === "1";

  const raw = Buffer.from(await file.arrayBuffer()).toString("utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const contactName = normalize(row["Contact principal"]);
    const email = normalize(row["Courriel principal"])?.toLowerCase();
    const phone = normalize(row["Téléphone"]);
    const categories = normalize(row["Catégories"]);
    const entreprise = normalize(row["Entreprise"]);
    const actif = normalize(row["Actif"]);
    const passport = normalize(row["Numéro de Passeport"]);
    const birthDate = parseDate(normalize(row["Date de naissance"]));

    if (!contactName) {
      skipped++;
      continue;
    }

    if (clientOnly) {
      const cat = (categories ?? "").toLowerCase();
      const looksLikeClient =
        cat.includes("client") || (entreprise ?? "").toLowerCase().includes("particulier");
      if (!looksLikeClient) {
        skipped++;
        continue;
      }
    }

    if (activeOnly && (actif ?? "").toLowerCase() !== "oui") {
      skipped++;
      continue;
    }

    const { firstName, lastName } = splitContactName(contactName);
    if (!firstName) {
      skipped++;
      continue;
    }

    const existingByEmail = email
      ? await prisma.client.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true },
        })
      : null;

    const existingByIdentity = !existingByEmail
      ? await prisma.client.findFirst({
          where: {
            firstName: { equals: firstName, mode: "insensitive" },
            lastName: { equals: lastName, mode: "insensitive" },
            ...(phone ? { phone } : {}),
          },
          select: { id: true },
        })
      : null;

    const existing = existingByEmail ?? existingByIdentity;

    const importNotes = [
      categories ? `Catégories source: ${categories}` : null,
      entreprise ? `Entreprise source: ${entreprise}` : null,
      normalize(row["#"]) ? `ID source: ${normalize(row["#"] as string)}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    if (!existing) {
      if (!previewOnly) {
        await prisma.client.create({
          data: {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth: birthDate,
            passportNumber: encryptPassportNumber(passport),
            notes: importNotes || null,
          },
        });
      }
      created++;
      continue;
    }

    const current = await prisma.client.findUnique({ where: { id: existing.id } });
    if (!current) {
      skipped++;
      continue;
    }

    if (!previewOnly) {
      await prisma.client.update({
        where: { id: existing.id },
        data: {
          email: current.email ?? email,
          phone: current.phone ?? phone,
          dateOfBirth: current.dateOfBirth ?? birthDate,
          passportNumber: current.passportNumber ?? encryptPassportNumber(passport),
          notes: current.notes ?? (importNotes || null),
          archivedAt: null,
        },
      });
    }
    updated++;
  }

  if (previewOnly) {
    redirect(`/clients?preview=1&imported=${created}&updated=${updated}&skipped=${skipped}`);
  }

  revalidatePath("/clients");
  redirect(`/clients?imported=${created}&updated=${updated}&skipped=${skipped}`);
}

export async function revealClientPassport(clientId: string, formData: FormData) {
  await requireUser();

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Mot de passe requis.", passportNumber: null as string | null };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "Session expirée.", passportNumber: null as string | null };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return { error: "Utilisateur introuvable.", passportNumber: null as string | null };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Mot de passe incorrect.", passportNumber: null as string | null };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { passportNumber: true },
  });

  if (!client?.passportNumber) {
    return { error: "Passeport non renseigné.", passportNumber: null as string | null };
  }

  return {
    error: null,
    passportNumber: decryptPassportNumber(client.passportNumber),
  };
}
