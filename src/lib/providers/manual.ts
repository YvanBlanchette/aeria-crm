import { prisma } from "@/lib/db";
import type {
  CruiseProvider,
  ProviderItinerary,
  ProviderSailing,
  ProviderSailingSearch,
} from "./types";

/**
 * Fournisseur "manuel" : expose les itinéraires créés dans le builder
 * à travers la même interface que les futurs fournisseurs API.
 * Il sert aussi de modèle d'implémentation.
 */
export const manualProvider: CruiseProvider = {
  name: "Catalogue interne",

  async searchSailings(query: ProviderSailingSearch): Promise<ProviderSailing[]> {
    const itineraries = await prisma.itinerary.findMany({
      where: {
        source: "MANUAL",
        ...(query.departurePort
          ? { departurePort: { contains: query.departurePort, mode: "insensitive" } }
          : {}),
        ...(query.minNights ? { nights: { gte: query.minNights } } : {}),
        ...(query.maxNights ? { nights: { lte: query.maxNights } } : {}),
      },
      include: { days: { orderBy: { dayNumber: "asc" } }, ship: { include: { cruiseLine: true } } },
      take: 50,
    });
    return itineraries.map((it) => ({
      sailingDate: new Date(), // Les itinéraires manuels n'ont pas de date fixe
      itinerary: toProviderItinerary(it),
    }));
  },

  async getItinerary(externalId: string): Promise<ProviderItinerary | null> {
    const it = await prisma.itinerary.findUnique({
      where: { id: externalId },
      include: { days: { orderBy: { dayNumber: "asc" } }, ship: { include: { cruiseLine: true } } },
    });
    return it ? toProviderItinerary(it) : null;
  },
};

function toProviderItinerary(it: any): ProviderItinerary {
  return {
    externalId: it.id,
    providerName: "Catalogue interne",
    name: it.name,
    ship: it.ship?.name,
    cruiseLine: it.ship?.cruiseLine?.name,
    nights: it.nights,
    departurePort: it.departurePort,
    arrivalPort: it.arrivalPort ?? undefined,
    description: it.description ?? undefined,
    days: it.days.map((d: any) => ({
      dayNumber: d.dayNumber,
      port: d.port,
      country: d.country ?? undefined,
      arrival: d.arrival ?? undefined,
      departure: d.departure ?? undefined,
      isSeaDay: d.isSeaDay,
    })),
  };
}
