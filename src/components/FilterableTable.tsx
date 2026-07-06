"use client";

import { useMemo, useState } from "react";

export type FilterType = "text" | "select" | "none";

export type FilterableColumn<T> = {
  id: string;
  header: string;
  getValue: (row: T) => string | number | boolean | null | undefined;
  renderCell?: (row: T) => React.ReactNode;
  filterType?: FilterType;
  filterOptions?: string[];
  cellClassName?: string;
};

export function FilterableTable<T>({
  rows,
  columns,
  getRowKey,
  emptyMessage,
}: {
  rows: T[];
  columns: FilterableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
}) {
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(columns.map((c) => [c.id, ""]))
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      for (const col of columns) {
        const filterType = col.filterType ?? "text";
        if (filterType === "none") continue;

        const rawFilter = filters[col.id] ?? "";
        const filter = rawFilter.trim().toLowerCase();
        if (!filter) continue;

        const value = String(col.getValue(row) ?? "").toLowerCase();

        if (filterType === "select") {
          if (value !== filter) return false;
          continue;
        }

        if (!value.includes(filter)) return false;
      }
      return true;
    });
  }, [rows, columns, filters]);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">{filteredRows.length} resultat(s)</p>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-ocean"
          onClick={() => setFilters(Object.fromEntries(columns.map((c) => [c.id, ""])))}
        >
          Reinitialiser les filtres
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {columns.map((col) => (
                  <th key={col.id} className="table-th">{col.header}</th>
                ))}
              </tr>
              <tr>
                {columns.map((col) => {
                  const filterType = col.filterType ?? "text";
                  if (filterType === "none") {
                    return <th key={col.id} className="px-4 py-2" />;
                  }

                  if (filterType === "select") {
                    return (
                      <th key={col.id} className="px-4 py-2">
                        <select
                          className="input py-1.5 text-xs"
                          value={filters[col.id] ?? ""}
                          onChange={(e) => setFilters((prev) => ({ ...prev, [col.id]: e.target.value }))}
                        >
                          <option value="">Tous</option>
                          {(col.filterOptions ?? []).map((option) => (
                            <option key={option} value={option.toLowerCase()}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </th>
                    );
                  }

                  return (
                    <th key={col.id} className="px-4 py-2">
                      <input
                        className="input py-1.5 text-xs"
                        value={filters[col.id] ?? ""}
                        onChange={(e) => setFilters((prev) => ({ ...prev, [col.id]: e.target.value }))}
                        placeholder="Filtrer..."
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td className="table-td text-slate-500" colSpan={columns.length}>
                    Aucun resultat avec ces filtres.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={getRowKey(row)} className="hover:bg-slate-50">
                    {columns.map((col) => (
                      <td key={col.id} className={`table-td ${col.cellClassName ?? ""}`}>
                        {col.renderCell ? col.renderCell(row) : String(col.getValue(row) ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
