import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "../actions";
import { ClientForm } from "@/components/ClientForm";

export default async function NewClientPage() {
  await requireUser();
  return (
    <div className="space-y-5">
      <div>
        <Link href="/clients" className="text-sm text-slate-500 hover:text-ocean">← Clients</Link>
        <h1 className="text-2xl font-bold text-navy mt-1">Nouveau client</h1>
      </div>
      <ClientForm action={createClient} submitLabel="Créer le client" />
    </div>
  );
}
