"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_CONFIG: Array<{
  match: (pathname: string) => boolean;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}> = [
  {
    match: (pathname) => pathname === "/dashboard",
    title: "Tableau de bord",
    subtitle: "Vue d'ensemble de l'activité commerciale et des réservations",
  },
  {
    match: (pathname) => pathname.startsWith("/clients"),
    title: "Clients",
    subtitle: "Gestion centralisée des contacts et de leurs profils voyage",
    actionHref: "/clients/new",
    actionLabel: "+ Nouveau client",
  },
  {
    match: (pathname) => pathname === "/bookings",
    title: "Réservations",
    subtitle: "Suivez et structurez des dossiers voyage complets",
    actionHref: "/bookings/new",
    actionLabel: "+ Nouvelle réservation",
  },
  {
    match: (pathname) => pathname === "/leads",
    title: "Pipeline des prospects",
    subtitle: "Suivi des opportunités par étape commerciale",
    actionHref: "/leads/new",
    actionLabel: "+ Nouveau prospect",
  },
  {
    match: (pathname) => pathname.startsWith("/itineraries"),
    title: "Itinéraires",
    subtitle: "Construction et maintenance de vos parcours croisière",
    actionHref: "/itineraries/new",
    actionLabel: "+ Nouvel itinéraire",
  },
  {
    match: (pathname) => pathname.startsWith("/settings"),
    title: "Paramètres",
    subtitle: "Préférences agence, équipe et automatisations",
  },
  {
    match: (pathname) => pathname.startsWith("/forfaits"),
    title: "Forfaits",
    subtitle: "Outils de montage et chiffrage de forfaits",
    actionHref: "/forfaits/new",
    actionLabel: "+ Nouveau forfait",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const current: {
    title: string;
    subtitle?: string;
    actionHref?: string;
    actionLabel?: string;
  } = PAGE_CONFIG.find((item) => item.match(pathname)) ?? {
    title: "ÆRIA CRM",
    subtitle: "Gestion commerciale et opérations voyage",
  };

  return (
    <header className="sticky top-0 z-30 shadow-lg bg-white/90 backdrop-blur">
      <div className="px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">{current.title}</h1>
          {current.subtitle && <p className="text-sm text-slate-500 mt-1">{current.subtitle}</p>}
        </div>
        {current.actionHref && current.actionLabel && (
          <Link href={current.actionHref} className="btn-primary">
            {current.actionLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
