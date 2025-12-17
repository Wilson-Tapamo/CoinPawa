import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani"
});

export const metadata: Metadata = {
  title: "CoinPawa - Crypto Casino",
  description: "Premium Crypto Casino and Betting Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, rajdhani.variable, "bg-background text-text-primary antialiased")}>
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:ml-64 relative pb-20 md:pb-0">
            {/* Header (Sticky) */}
            <Header />

            {/* Page Content */}
            <main className="flex-1 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>

          {/* Mobile Bottom Nav */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
