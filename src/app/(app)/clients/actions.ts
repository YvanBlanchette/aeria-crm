"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parse } from "csv-parse/sync";
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
			const looksLikeClient = cat.includes("client") || (entreprise ?? "").toLowerCase().includes("particulier");
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
						passportNumber: passport,
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
					passportNumber: current.passportNumber ?? passport,
					notes: current.notes ?? (importNotes || null),
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
