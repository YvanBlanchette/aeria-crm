"use client";

import Link from "next/link";
import { FilterableTable, type FilterableColumn } from "@/components/FilterableTable";

type ClientRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passportNumber: string;
  passportExpiringSoon: boolean;
  bookingsCount: number;
  updatedAtLabel: string;
};

const COLUMNS: FilterableColumn<ClientRow>[] = [
  {
    id: "name",
    header: "Nom",
    getValue: (row) => `${row.firstName} ${row.lastName}`,
    renderCell: (row) => (
      <Link href={`/clients/${row.id}`} className="font-medium text-navy hover:text-ocean">
        {row.firstName} {row.lastName}
      </Link>
    ),
  },
  {
    id: "email",
    header: "Courriel",
    getValue: (row) => row.email,
    cellClassName: "text-slate-600",
  },
  {
    id: "phone",
    header: "Telephone",
    getValue: (row) => row.phone,
    cellClassName: "text-slate-600",
  },
  {
    id: "passport",
    header: "Passeport",
    getValue: (row) => row.passportNumber,
    renderCell: (row) =>
      row.passportNumber ? (
        <span className="text-slate-600">
          {row.passportNumber}
          {row.passportExpiringSoon && (
            <span className="badge bg-amber-100 text-amber-800 ml-2">Expire bientot</span>
          )}
        </span>
      ) : (
        <span className="text-slate-600">-</span>
      ),
  },
  {
    id: "bookingsCount",
    header: "Croisieres",
    getValue: (row) => row.bookingsCount,
    filterType: "select",
    filterOptions: ["0", "1", "2", "3", "4", "5"],
  },
  {
    id: "updatedAtLabel",
    header: "Mis a jour",
    getValue: (row) => row.updatedAtLabel,
    cellClassName: "text-slate-500",
  },
];

export function ClientsTable({ rows }: { rows: ClientRow[] }) {
  return (
    <FilterableTable
      rows={rows}
      columns={COLUMNS}
      getRowKey={(row) => row.id}
      emptyMessage="Aucun client. Ajoutez votre premier client pour commencer."
    />
  );
}
