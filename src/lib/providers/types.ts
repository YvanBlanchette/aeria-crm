/**
 * Couche d'abstraction "fournisseur de croisières".
 *
 * Objectif : le CRM ne dépend jamais directement d'une API externe.
 * Chaque fournisseur (Traveltek FusionAPI, Widgety, Cruise API, GDS...)
 * implémente cette interface, et le reste de l'application consomme
 * uniquement ces types normalisés.
 *
 * Pour ajouter un vrai fournisseur plus tard :
 *   1. Créer src/lib/providers/traveltek.ts (par ex.) qui implémente CruiseProvider
 *   2. L'enregistrer dans src/lib/providers/index.ts
 *   3. Les résultats s'importent dans la table Itinerary avec source=API,
 *      externalId et providerName renseignés — aucun autre changement requis.
 */

export interface ProviderSailingSearch {
  destination?: string;
  departurePort?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minNights?: number;
  maxNights?: number;
  cruiseLine?: string;
}

export interface ProviderPortCall {
  dayNumber: number;
  port: string;
  country?: string;
  arrival?: string; // "08:00"
  departure?: string; // "18:00"
  isSeaDay: boolean;
}

export interface ProviderItinerary {
  externalId: string;
  providerName: string;
  name: string;
  cruiseLine?: string;
  ship?: string;
  nights: number;
  departurePort: string;
  arrivalPort?: string;
  description?: string;
  days: ProviderPortCall[];
}

export interface ProviderSailing {
  itinerary: ProviderItinerary;
  sailingDate: Date;
  pricesFrom?: { cabinType: string; price: number; currency: string }[];
}

export interface CruiseProvider {
  /** Nom lisible du fournisseur (affiché dans l'UI et stocké en base). */
  readonly name: string;

  /** Recherche de départs disponibles selon des critères. */
  searchSailings(query: ProviderSailingSearch): Promise<ProviderSailing[]>;

  /** Détail complet d'un itinéraire par son identifiant externe. */
  getItinerary(externalId: string): Promise<ProviderItinerary | null>;
}
