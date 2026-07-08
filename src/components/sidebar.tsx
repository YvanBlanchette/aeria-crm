import Link from "next/link";
import { requireUser, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/logo";
import { NAV } from "@/lib/data/navigation";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

const sidebar = async () => {
  const user = await requireUser();

  return (
    <aside className="w-72 shrink-0 bg-navy text-white flex flex-col shadow-lg">
      <div className="px-5 py-5 border-b border-navy-700">
        <Logo />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link text-lg font-base flex items-center gap-2"
            >
              <span className="w-6 text-center" aria-hidden>
                <Icon className="h-5 w-5 inline-block" />
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
  );
};
export default sidebar;
