
import Container from "@/components/Container";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/sidebar";


export default async function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto flex flex-col justify-between">
        <Navbar />
        <Container>
          {children}
        </Container>
      </main>
    </div>
  );
}
