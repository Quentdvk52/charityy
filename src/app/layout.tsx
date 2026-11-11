import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Charityy : monde meilleure",
  description: "Réseau social vidéo solidaire et cagnottes vérifiées",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
