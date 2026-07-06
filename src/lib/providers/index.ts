import type { CruiseProvider } from "./types";
import { manualProvider } from "./manual";

/**
 * Registre des fournisseurs actifs.
 * Ajoutez ici vos fournisseurs API au fur et à mesure :
 *   import { traveltekProvider } from "./traveltek";
 *   export const providers = [manualProvider, traveltekProvider];
 */
export const providers: CruiseProvider[] = [manualProvider];

export function getProvider(name: string): CruiseProvider | undefined {
  return providers.find((p) => p.name === name);
}
