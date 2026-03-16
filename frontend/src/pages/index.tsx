import Link from "next/link";

export default function Home() {
  return (
    <div
      className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50"
      style={{ background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)" }}
    >
      <header className="sticky top-0 z-20 border-b border-slate-700/60 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 shrink-0 rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)" }}
            />
            <span className="text-sm font-bold tracking-widest text-emerald-400 uppercase">
              AIPay Shield
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <a href="#features" className="text-slate-300 hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-slate-300 hover:text-emerald-400 transition-colors">
              How it works
            </a>
            <a href="#for-teams" className="text-slate-300 hover:text-emerald-400 transition-colors">
              For fintech teams
            </a>
            <Link
              href="/login"
              className="rounded-full border-2 border-slate-600 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition-all"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
        <section className="grid gap-12 lg:grid-cols-[1.2fr,1fr] lg:gap-16 items-center">
          <div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/50 px-4 py-1.5 text-xs font-medium"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7" }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time AI fraud shield for payments
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              AI-Powered Smart Payment{" "}
              <span className="block mt-1" style={{ color: "#34d399" }}>
                and Fraud Detection Platform
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              Orchestrate multi-currency payments, score fraud in under 100 ms, and
              monitor live revenue and risk from a single, enterprise-grade dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 24px rgba(16, 185, 129, 0.45)" }}
              >
                Open Analytics Dashboard
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border-2 border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition-all hover:border-emerald-500 hover:text-emerald-300"
              >
                Sign in as Admin / Merchant
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 text-sm">
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                <div className="font-bold text-white">10k+ tx/min</div>
                <div className="mt-1 text-slate-400">Horizontally scalable payments core</div>
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                <div className="font-bold text-white">&lt;100 ms</div>
                <div className="mt-1 text-slate-400">Fraud scoring latency target</div>
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                <div className="font-bold text-white">Multi-cloud ready</div>
                <div className="mt-1 text-slate-400">AWS / GCP / Azure compatible</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
            />
            <div
              className="relative rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-2xl backdrop-blur"
              style={{ boxShadow: "0 0 60px -12px rgba(16, 185, 129, 0.25), 0 25px 50px -12px rgba(0,0,0,0.5)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Live risk snapshot</span>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                  style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399" }}
                >
                  Live
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                  <div className="text-xs text-slate-400">Revenue (24h)</div>
                  <div className="text-lg font-bold text-white">$248,920</div>
                  <div className="text-[10px] text-emerald-400 mt-1">+12.4% vs avg</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                  <div className="text-xs text-slate-400">Fraud rate</div>
                  <div className="text-lg font-bold text-white">0.21%</div>
                  <div className="text-[10px] text-emerald-400 mt-1">ML protected</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                  <div className="text-xs text-slate-400">Currencies</div>
                  <div className="text-base font-bold text-white">USD · EUR · INR</div>
                  <div className="text-[10px] text-slate-500 mt-1">+ more</div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/90 p-3">
                <div className="mb-2 flex justify-between text-[11px] text-slate-400">
                  <span>Recent transactions</span>
                  <span>Fraud score</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2">
                    <span className="text-slate-200">₹12,400 · IN → US</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-300">0.08</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2">
                    <span className="text-slate-200">$980 · Card · UK</span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-medium text-amber-300">0.52</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2">
                    <span className="text-slate-200">€420 · Wallet · EU</span>
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-medium text-rose-300">0.89</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 transition-all hover:border-emerald-500/50 hover:shadow-glow"
          >
            <h3 className="mb-2 text-lg font-semibold text-white">Smart payment core</h3>
            <p className="text-sm text-slate-400">
              Multi-currency, multi-method gateway with idempotent APIs and event-driven architecture.
            </p>
          </div>
          <div
            className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 transition-all hover:border-emerald-500/50 hover:shadow-glow"
          >
            <h3 className="mb-2 text-lg font-semibold text-white">AI fraud detection</h3>
            <p className="text-sm text-slate-400">
              Isolation Forest / XGBoost-style models scoring every transaction in real time.
            </p>
          </div>
          <div
            className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 transition-all hover:border-emerald-500/50 hover:shadow-glow"
          >
            <h3 className="mb-2 text-lg font-semibold text-white">Live risk analytics</h3>
            <p className="text-sm text-slate-400">
              Streaming metrics, fraud alerts and revenue trends with WebSocket updates.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
