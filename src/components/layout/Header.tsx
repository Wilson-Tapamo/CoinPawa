import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderActions } from "./HeaderAction";
import { HeaderSearch } from "./HeaderSearch";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export async function Header() {
    const userId = await verifySession();
    let balance = 0;
    let username = "";
    let email = "";
    let isLoggedIn = false;

    if (userId) {
        isLoggedIn = true;

        try {
            const wallet = await prisma.wallet.findUnique({
                where: { userId },
                include: { user: true }
            });

            if (wallet) {
                balance = Number(wallet.balanceSats);
                username = wallet.user.username;
                email = wallet.user.email || "";
            }
        } catch (error) {
            console.error("⚠️ Erreur Header BDD", error);
        }
    }

    return (
        <header className="sticky top-0 z-30 w-full h-20 flex items-center px-4 md:px-8 border-b border-white/5 bg-background/80 backdrop-blur-md transition-all">
            {/* Logo Mobile */}
            <div className="md:hidden flex items-center mr-4 gap-3">
                <button className="p-2 -ml-2 text-text-secondary hover:text-white transition-colors">
                    <Menu className="w-6 h-6" />
                </button>
                <Link href="/" className="relative w-8 h-8">
                    <Image
                        src="/logo.png"
                        alt="CoinPawa"
                        fill
                        className="object-contain"
                    />
                </Link>
            </div>

            {/* Barre de recherche */}
            <HeaderSearch />

            <div className="ml-auto">
                <HeaderActions
                    isLoggedIn={isLoggedIn}
                    initialBalance={balance}
                    username={username}
                    email={email}
                />
            </div>
        </header>
    );
}