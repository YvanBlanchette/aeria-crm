import Link from "next/link";
import { requireUser, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/logo";
import { HiOutlineSquares2X2, HiOutlineUsers } from "react-icons/hi2";
import { FaShip } from "react-icons/fa6";
import { MdOutlineRoute } from "react-icons/md";
import { FiSettings } from "react-icons/fi";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: HiOutlineSquares2X2 },
  { href: "/clients", label: "Clients", icon: HiOutlineUsers },
  { href: "/bookings", label: "Réservations", icon: FaShip },
  { href: "/itineraries", label: "Itinéraires", icon: MdOutlineRoute },
  { href: "/settings", label: "Paramètres", icon: FiSettings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-navy text-white flex flex-col">
        <div className="px-5 py-5 border-b border-navy-700">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="nav-link">
                <span className="w-5 text-center" aria-hidden>
                  <Icon className="h-4 w-4 inline-block" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-navy-700">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate mb-3">{user.email}</p>
          <form action={logout}>
            <button className="text-xs text-slate-300 hover:text-white underline underline-offset-2">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  );
}
