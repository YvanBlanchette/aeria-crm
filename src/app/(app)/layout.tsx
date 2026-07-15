import { requireUser, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

async function logout() {
  "use server";
  await destroySession();
  redirect("/signin");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={user} signOutAction={logout}>
      {children}
    </AppShell>
  );
}
