"use client";

import { useMemo, useState } from "react";

export type FilterableColumn<T> = {
  id: string;
  header: string;
  getValue: (row: T) => string | number | boolean | null | undefined;
  renderCell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  cellClassName?: string;
};

type SortDirection = "asc" | "desc";

function toSearchable(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compareValues(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a ?? "").localeCompare(String(b ?? ""), "fr", { numeric: true, sensitivity: "base" });
}

export function FilterableTable<T>({
  rows,
  columns,
  getRowKey,
  emptyMessage,
  globalSearchPlaceholder = "Rechercher...",
}: {
  rows: T[];
  columns: FilterableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  globalSearchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);

  const displayedRows = useMemo(() => {
    const normalizedQuery = toSearchable(query.trim());

    const searchableColumns = columns.filter((c) => c.searchable !== false);
    const filtered = normalizedQuery
      ? rows.filter((row) =>
          searchableColumns.some((col) => toSearchable(col.getValue(row)).includes(normalizedQuery))
        )
      : rows;

    if (!sort) return filtered;

    const sortColumn = columns.find((c) => c.id === sort.columnId);
    if (!sortColumn) return filtered;

    const sorted = [...filtered].sort((a, b) => {
      const cmp = compareValues(sortColumn.getValue(a), sortColumn.getValue(b));
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, columns, query, sort]);

  const toggleSort = (columnId: string, sortable: boolean | undefined) => {
    if (sortable === false) return;

    setSort((prev) => {
      if (!prev || prev.columnId !== columnId) return { columnId, direction: "asc" };
      if (prev.direction === "asc") return { columnId, direction: "desc" };
      return null;
    });
  };

  const sortIndicator = (columnId: string) => {
    if (!sort || sort.columnId !== columnId) return "";
    return sort.direction === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">{displayedRows.length} resultat(s)</p>
        <div className="flex items-center gap-2">
          <input
            className="input w-64 py-1.5 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={globalSearchPlaceholder}
          />
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-ocean"
            onClick={() => {
              setQuery("");
              setSort(null);
            }}
          >
            Reinitialiser
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto flex flex-col max-h-[80vh]">
          <table className="w-full flex-shrink-0">
            <thead className="bg-navy border-b border-navy-700 sticky top-0 z-10">
              <tr>
                {columns.map((col) => {
                  return (
                    <th key={col.id} className="table-th">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 ${col.sortable === false ? "cursor-default" : "hover:text-ocean"}`}
                        onClick={() => toggleSort(col.id, col.sortable)}
                      >
                        {col.header}
                        <span className="text-[10px] text-slate-400">{sortIndicator(col.id)}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td className="table-td text-slate-500" colSpan={columns.length}>
                      Aucun resultat pour cette recherche.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, index) => (
                    <tr key={getRowKey(row)} className="hover:bg-slate-50">
                      {columns.map((col) => (
                        <td key={col.id} className={`table-td ${col.cellClassName ?? ""} ${index % 2 === 0 ? "bg-slate-100" : ""}`}>
                          {col.renderCell ? col.renderCell(row) : String(col.getValue(row) ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
