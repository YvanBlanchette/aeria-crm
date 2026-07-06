import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

function esc(v: unknown) {
	const s = (v ?? "").toString();
	if (s.includes('"') || s.includes(",") || s.includes("\n")) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

function fmtDateTime(d: Date) {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function GET() {
	const userId = await getSessionUserId();
	if (!userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" } });

	const headers = [
		"#",
		"Entreprise",
		"Contact principal",
		"Courriel principal",
		"Téléphone",
		"Actif",
		"Catégories",
		"Créé le",
		"Date de naissance",
		"Numéro de Passeport",
	];

	const lines = [headers.join(",")];

	for (let i = 0; i < clients.length; i++) {
		const c = clients[i];
		const contact = `${c.firstName} ${c.lastName}`.trim();
		lines.push(
			[
				String(i + 1),
				"Particulier - Afficher le Profil",
				contact,
				c.email ?? "",
				c.phone ?? "",
				c.archivedAt ? "Non" : "Oui",
				"Client",
				fmtDateTime(c.createdAt),
				c.dateOfBirth ? c.dateOfBirth.toISOString().slice(0, 10) : "",
				c.passportNumber ?? "",
			]
				.map(esc)
				.join(","),
		);
	}

	const today = new Date().toISOString().slice(0, 10);
	return new Response(`\uFEFF${lines.join("\n")}`, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="clients-export-${today}.csv"`,
		},
	});
}
