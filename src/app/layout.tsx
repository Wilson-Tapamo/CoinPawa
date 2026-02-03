// src/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* Sidebar globale (masquée conditionnellement via son propre code) */}
        <Sidebar />
        
        {/* Wrapper qui gère Header + padding conditionnels */}
        <LayoutWrapper header={<Header />}>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
