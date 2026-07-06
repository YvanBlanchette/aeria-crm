import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	// --- Utilisateur admin ---
	const passwordHash = await bcrypt.hash("admin1234", 10);
	const admin = await prisma.user.upsert({
		where: { email: "yvanblanchette@aeriavoyages.com" },
		update: {},
		create: {
			email: "yvanblanchette@aeriavoyages.com",
			name: "Yvan Blanchette",
			passwordHash,
			role: "ADMIN",
		},
	});

	// --- Compagnies et navires ---
	const lines: Record<string, string[]> = {
		"MSC Croisières": ["MSC World Europa", "MSC Seascape", "MSC Grandiosa"],
		"Royal Caribbean": ["Icon of the Seas", "Wonder of the Seas", "Symphony of the Seas"],
		"Norwegian Cruise Line": ["Norwegian Prima", "Norwegian Viva"],
		"Celebrity Cruises": ["Celebrity Beyond", "Celebrity Apex"],
		"Costa Croisières": ["Costa Smeralda", "Costa Toscana"],
	};

	for (const [lineName, ships] of Object.entries(lines)) {
		const line = await prisma.cruiseLine.upsert({
			where: { name: lineName },
			update: {},
			create: { name: lineName },
		});
		for (const shipName of ships) {
			const exists = await prisma.ship.findFirst({
				where: { name: shipName, cruiseLineId: line.id },
			});
			if (!exists) {
				await prisma.ship.create({
					data: { name: shipName, cruiseLineId: line.id },
				});
			}
		}
	}

	// --- Itinéraire exemple : Méditerranée 7 nuits ---
	const ship = await prisma.ship.findFirst({ where: { name: "MSC World Europa" } });
	const existingItin = await prisma.itinerary.findFirst({
		where: { name: "Méditerranée occidentale — 7 nuits" },
	});
	if (!existingItin && ship) {
		await prisma.itinerary.create({
			data: {
				name: "Méditerranée occidentale — 7 nuits",
				nights: 7,
				departurePort: "Barcelone",
				arrivalPort: "Barcelone",
				shipId: ship.id,
				description: "Boucle classique en Méditerranée occidentale : Espagne, France, Italie.",
				days: {
					create: [
						{ dayNumber: 1, port: "Barcelone", country: "Espagne", departure: "18:00" },
						{ dayNumber: 2, port: "Journée en mer", isSeaDay: true },
						{ dayNumber: 3, port: "Naples", country: "Italie", arrival: "08:00", departure: "18:00", notes: "Excursion Pompéi ou côte amalfitaine" },
						{ dayNumber: 4, port: "Civitavecchia (Rome)", country: "Italie", arrival: "07:00", departure: "19:00" },
						{ dayNumber: 5, port: "Gênes", country: "Italie", arrival: "08:00", departure: "17:00" },
						{ dayNumber: 6, port: "Marseille", country: "France", arrival: "09:00", departure: "18:00" },
						{ dayNumber: 7, port: "Journée en mer", isSeaDay: true },
						{ dayNumber: 8, port: "Barcelone", country: "Espagne", arrival: "07:00" },
					],
				},
			},
		});
	}

	// --- Client + lead exemples ---
	const existingClient = await prisma.client.findFirst({
		where: { email: "marie.tremblay@example.com" },
	});
	if (!existingClient) {
		const client = await prisma.client.create({
			data: {
				firstName: "Marie",
				lastName: "Tremblay",
				email: "marie.tremblay@example.com",
				phone: "+1 514 555 0182",
				nationality: "Canadienne",
				preferences: "Cabine balcon, MSC ou Celebrity, sans gluten",
			},
		});
		await prisma.lead.create({
			data: {
				title: "Croisière anniversaire de mariage — Méditerranée",
				status: "QUOTED",
				source: "Référence client",
				destination: "Méditerranée",
				travelPeriod: "Septembre 2026",
				budget: 6500,
				clientId: client.id,
				userId: admin.id,
				activities: {
					create: [
						{
							type: "CALL",
							content: "Premier appel : couple, 25e anniversaire, préfère balcon ou suite.",
							userId: admin.id,
						},
					],
				},
			},
		});
	}

	console.log("Seed terminé. Connexion : yvanblanchette@aeriavoyages.com / admin1234");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
