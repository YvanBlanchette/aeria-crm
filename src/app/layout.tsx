import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÆRIA CRM | CRM pour Agences de voyages",
  description: "CRM pour agents de voyages spécialisés croisières",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
