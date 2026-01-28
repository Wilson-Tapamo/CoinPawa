"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Gamepad2,
  ArrowDownToLine,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Utilisateurs",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
  },
  {
    label: "Jeux",
    href: "/admin/games",
    icon: Gamepad2,
  },
  {
    label: "Retraits",
    href: "/admin/withdrawals",
    icon: ArrowDownToLine,
    badgeKey: "pendingWithdrawals", // Clé pour le badge dynamique
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ username: string; email: string | null } | null>(null);
  const [badges, setBadges] = useState<Record<string, number>>({});

  // Charger les infos admin et les badges
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          setAdminInfo(data.admin);
          setBadges(data.badges || {});
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    fetchAdminData();
    // Rafraîchir les badges toutes les 30 secondes
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return;

    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch (error) {
      alert('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#1A1D26] border-r border-white/5 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b border-white/5">
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎰</span>
              CoinPawa Admin
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                    
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-xl p-3 text-sm font-bold leading-6 transition-all relative",
                            isActive
                              ? "bg-primary text-background shadow-glow-gold"
                              : "text-text-secondary hover:text-white hover:bg-white/5"
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {item.label}
                          {badge !== undefined && badge > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-rose text-[10px] font-bold text-white">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Admin Info */}
              <li className="mt-auto">
                <div className="p-3 rounded-xl bg-background-secondary border border-white/5">
                  {adminInfo ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-violet to-indigo-600 flex items-center justify-center text-white font-bold">
                          {adminInfo.username.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{adminInfo.username}</p>
                          <p className="text-xs text-text-tertiary truncate">
                            {adminInfo.email || 'Administrateur'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-white/5 rounded"></div>
                      <div className="h-8 bg-white/5 rounded"></div>
                    </div>
                  )}
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#1A1D26] border-r border-white/5 lg:hidden">
            <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6 pb-4">
              <div className="flex h-16 items-center justify-between border-b border-white/5">
                <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🎰</span>
                  CoinPawa Admin
                </h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-text-secondary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                        
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "group flex gap-x-3 rounded-xl p-3 text-sm font-bold leading-6 transition-all",
                                isActive
                                  ? "bg-primary text-background shadow-glow-gold"
                                  : "text-text-secondary hover:text-white hover:bg-white/5"
                              )}
                            >
                              <Icon className="h-5 w-5 shrink-0" />
                              {item.label}
                              {badge !== undefined && badge > 0 && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-rose text-[10px] font-bold text-white">
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>

                  <li className="mt-auto">
                    <div className="p-3 rounded-xl bg-background-secondary border border-white/5">
                      {adminInfo && (
                        <>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-violet to-indigo-600 flex items-center justify-center text-white font-bold">
                              {adminInfo.username.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{adminInfo.username}</p>
                              <p className="text-xs text-text-tertiary truncate">{adminInfo.email || 'Administrateur'}</p>
                            </div>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-[#1A1D26]/80 backdrop-blur px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-text-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 h-5 w-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Rechercher utilisateurs, transactions..."
                className="block w-full bg-background-secondary border border-white/10 rounded-xl py-2 pl-10 pr-3 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <button className="relative p-2 text-text-secondary hover:text-white transition-colors">
            <Bell className="h-6 w-6" />
            {badges.pendingWithdrawals > 0 && (
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent-rose ring-2 ring-[#1A1D26]" />
            )}
          </button>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
