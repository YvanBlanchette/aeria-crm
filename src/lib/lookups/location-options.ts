import worldCountries from "@/lib/data/world-countries.json";
import languagesData from "@/lib/data/languages.json";
import canadianProvincesData from "@/lib/data/canadian-provinces.json";
import usStatesData from "@/lib/data/us-states.json";

export const NATIONALITIES = [
  "",
  ...worldCountries.countries
    .map((country) => country.name)
    .filter((name): name is string => !!name)
    .sort((a, b) => a.localeCompare(b)),
];

export const CANADIAN_PROVINCES = [
  "",
  ...Object.values(canadianProvincesData)
    .map((province) => province)
    .filter((name): name is string => !!name)
    .sort((a, b) => a.localeCompare(b)),
];

export const US_STATES = [
  "",
  ...usStatesData.states
    .map((state) => state.name)
    .filter((name): name is string => !!name)
    .sort((a, b) => a.localeCompare(b)),
];

export const DEFAULT_LANGUAGES = [
  "",
  ...languagesData.languages
    .map((language) => language.name)
    .filter((name): name is string => !!name)
    .sort((a, b) => a.localeCompare(b)),
];
