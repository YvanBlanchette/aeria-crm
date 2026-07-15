import { requireUser, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarShell from "@/components/SidebarShell";

async function logout() {
  "use server";
  await destroySession();
  redirect("/signin");
}

const sidebar = async () => {
  const user = await requireUser();

  return (
    <SidebarShell
      user={user}
      signOutAction={logout}
      collapsed={false}
      onToggleCollapsed={() => {}}
    />
  );
};
export default sidebar;
