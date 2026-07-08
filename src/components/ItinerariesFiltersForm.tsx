"use client";

import Link from "next/link";
import { useRef } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type ItinerariesFiltersFormProps = {
  line: string;
  shipId: string;
  departure: string;
  destination: string;
  nightsPreset: string;
  createdPreset: string;
  sortBy: string;
  sortDir: string;
  resultCount: number;
  cruiseLines: string[];
  ships: SelectOption[];
  departurePorts: string[];
  destinationCountries: string[];
  destinationPorts: string[];
  nightSelectOptions: SelectOption[];
  createdSelectOptions: SelectOption[];
};

export function ItinerariesFiltersForm({
  line,
  shipId,
  departure,
  destination,
  nightsPreset,
  createdPreset,
  sortBy,
  sortDir,
  resultCount,
  cruiseLines,
  ships,
  departurePorts,
  destinationCountries,
  destinationPorts,
  nightSelectOptions,
  createdSelectOptions,
}: ItinerariesFiltersFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const submitFilters = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} method="get" className="card p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {/* ITINERARIES FILTERS */}
      <input type="hidden" name="sortBy" value={sortBy} />
      <input type="hidden" name="sortDir" value={sortDir} />

      <label>
        <span className="label">Compagnie</span>
        <select name="line" className="input" defaultValue={line} onChange={submitFilters}>
          <option value="">Toutes les compagnies</option>
          {cruiseLines.map((lineName) => (
            <option key={lineName} value={lineName}>
              {lineName}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="label">Navire</span>
        <select name="ship" className="input" defaultValue={shipId} onChange={submitFilters}>
          <option value="">Tous les navires</option>
          {ships.map((ship) => (
            <option key={ship.value} value={ship.value}>
              {ship.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="label">Port de depart</span>
        <select
          name="departure"
          className="input"
          defaultValue={departure}
          onChange={submitFilters}
        >
          <option value="">Tous les ports</option>
          {departurePorts.map((departurePort) => (
            <option key={departurePort} value={departurePort}>
              {departurePort}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="label">Destination / port</span>
        <select
          name="destination"
          className="input"
          defaultValue={destination}
          onChange={submitFilters}
        >
          <option value="">Toutes les destinations</option>
          {destinationCountries.length > 0 && (
            <optgroup label="Pays">
              {destinationCountries.map((country) => (
                <option key={`country-${country}`} value={country}>
                  {country}
                </option>
              ))}
            </optgroup>
          )}
          {destinationPorts.length > 0 && (
            <optgroup label="Ports">
              {destinationPorts.map((port) => (
                <option key={`port-${port}`} value={port}>
                  {port}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      <label>
        <span className="label">Nombre de nuits</span>
        <select
          name="nights"
          className="input"
          defaultValue={nightsPreset}
          onChange={submitFilters}
        >
          {nightSelectOptions.map((preset) => (
            <option key={preset.value || "all"} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="label">Periode d'ajout</span>
        <select
          name="created"
          className="input"
          defaultValue={createdPreset}
          onChange={submitFilters}
        >
          {createdSelectOptions.map((preset) => (
            <option key={preset.value || "all"} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <div className="md:col-span-2 xl:col-span-2 flex items-end gap-2">
        {/* FILTER ACTIONS */}
        <Link href="/itineraries" className="btn-secondary">
          Reinitialiser
        </Link>
        <p className="text-sm text-slate-500">{resultCount} resultat(s)</p>
      </div>
    </form>
  );
}
