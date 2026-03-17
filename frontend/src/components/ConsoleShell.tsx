import Link from "next/link";
import type { ReactNode } from "react";

export type ConsoleProfile = {
  email: string;
  role: string;
  merchant_id?: string;
} | null;

type ConsoleShellProps = {
  profile: ConsoleProfile;
  active: "dashboard" | "transactions";
  onLogout: () => void;
  children: ReactNode;
};

const navItems = [
  { href: "/admin/dashboard", label: "Overview", key: "dashboard" as const },
  { href: "/transactions", label: "Transactions", key: "transactions" as const },
];

export function ConsoleShell({ profile, active, onLogout, children }: ConsoleShellProps) {
  return (
    <div className="min-h-screen text-slate-50" style={{ backgroundColor: "#020617" }}>
      <header className="sticky top-0 z-20 border-b border-slate-700/60 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl shadow-md"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#34d399" }}>
                AIPay Shield
              </p>
              <p className="text-[11px] text-slate-400">Risk & revenue console</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            {profile && (
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
                {profile.email} <span className="text-emerald-400">({profile.role})</span>
              </span>
            )}

            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const isActive = active === item.key;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-emerald-300"
            >
              Logout
            </button>

            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399" }}
            >
              Live data
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
