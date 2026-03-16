import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type Metrics = {
  totalRevenue: number;
  fraudRate: number;
  txPerMinute: { timestamp: number; count: number }[];
};

type Profile = { id: string; email: string; full_name: string; role: string; merchant_id?: string } | null;

function CreatePaymentForm({
  userId,
  merchantId,
  token,
  apiUrl,
  onResult
}: {
  userId: string;
  merchantId: string;
  token: string | null;
  apiUrl: string;
  onResult: (msg: string) => void;
}) {
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !apiUrl) return;
    setLoading(true);
    onResult("");
    try {
      const createRes = await axios.post(
        `${apiUrl}/payments/create-payment`,
        {
          user_id: userId,
          merchant_id: merchantId,
          amount: Number(amount),
          currency,
          target_currency: currency,
          payment_method: "card",
          transaction_reference: `TEST-${Date.now()}`
        },
        { headers }
      );
      const txnId = createRes.data.transaction_id;
      if (createRes.data.status === "blocked") {
        onResult(`Transaction blocked (fraud risk). ID: ${txnId}`);
        return;
      }
      await axios.post(
        `${apiUrl}/payments/confirm-payment`,
        { transaction_id: txnId },
        { headers }
      );
      onResult(`Payment captured. Transaction ID: ${txnId}`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Request failed";
      onResult(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-slate-400">
        Amount
        <input
          type="number"
          step="0.01"
          min="0.01"
          className="mt-1 block w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>
      <label className="text-xs text-slate-400">
        Currency
        <select
          className="mt-1 block w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="INR">INR</option>
          <option value="GBP">GBP</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Processing…" : "Create & confirm payment"}
      </button>
    </form>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const apiUrl = typeof window !== "undefined" ? "/api/backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080");
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (typeof window !== "undefined" && !token) {
      window.location.href = "/login";
      return;
    }
    if (token && apiUrl) {
      axios
        .get(`${apiUrl}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => setProfile(r.data))
        .catch(() => setProfile(null));
    }
  }, [token, apiUrl]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      setMetrics({
        totalRevenue: 123456.78,
        fraudRate: 0.0123,
        txPerMinute: []
      });
      return;
    }
    const ws = new WebSocket(`${wsUrl.replace(/\/$/, "")}/metrics-ws`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
    };
    ws.onerror = () => {
      setMetrics({
        totalRevenue: 123456.78,
        fraudRate: 0.0123,
        txPerMinute: []
      });
    };
    return () => ws.close();
  }, []);

  const lastMinute = metrics?.txPerMinute.at(-1)?.count ?? 0;

  const fakeSparkline = useMemo(() => {
    const base = metrics?.txPerMinute ?? [];
    if (!base.length) {
      return Array.from({ length: 12 }, (_, i) => 2 + ((i * 3) % 7));
    }
    return base.slice(-12).map((p) => p.count || 1);
  }, [metrics]);

  if (!metrics) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-slate-100"
        style={{ backgroundColor: "#020617" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
          />
          <p className="text-sm text-slate-400">Connecting to analytics engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-50" style={{ backgroundColor: "#020617" }}>
      <header className="sticky top-0 z-20 border-b border-slate-700/60 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg shadow-md"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#34d399" }}>
                AIPay Shield
              </p>
              <p className="text-[11px] text-slate-400">Risk &amp; revenue console</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            {profile && (
              <span className="text-slate-400">
                {profile.email} <span className="text-emerald-400">({profile.role})</span>
              </span>
            )}
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Overview
            </Link>
            <Link
              href="/login"
              onClick={() => localStorage.removeItem("access_token")}
              className="hover:text-emerald-400 transition-colors"
            >
              Logout
            </Link>
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399" }}
            >
              Live data
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-[11px] text-slate-400 mb-1">Total processed volume</p>
            <p className="text-2xl font-bold text-white">
              ${metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="mt-2 text-[10px] text-emerald-400">Past 24 hours · mock data</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-[11px] text-slate-400 mb-1">Fraud rate</p>
            <p className="text-2xl font-bold text-white">
              {(metrics.fraudRate * 100).toFixed(2)}%
            </p>
            <p className="mt-2 text-[10px] text-emerald-400">ML‑screened transactions</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-[11px] text-slate-400 mb-1">Transactions per minute</p>
            <p className="text-2xl font-bold text-white">{lastMinute}</p>
            <div className="mt-2 flex gap-1 items-end h-6">
              {fakeSparkline.map((v, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full flex-1 min-w-0"
                  style={{ height: `${6 + v * 4}px`, backgroundColor: "rgba(16, 185, 129, 0.6)" }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-[11px] text-slate-400 mb-1">Alert center</p>
            <p className="text-sm font-medium text-slate-200 mb-2">No critical alerts (demo)</p>
            <p className="text-[10px] text-slate-500">
              Fraud and risk alerts will appear here in real time when the notification service is wired.
            </p>
          </div>
        </section>

        {profile && (
          <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Create test payment</h2>
            {profile.merchant_id ? (
              <CreatePaymentForm
                userId={profile.id}
                merchantId={profile.merchant_id}
                token={token}
                apiUrl={apiUrl}
                onResult={setPaymentResult}
              />
            ) : (
              <p className="text-sm text-slate-400">
                Log in as <strong className="text-slate-200">merchant@demo.com</strong> (password: Demo@123) to create payments.
              </p>
            )}
            {paymentResult && (
              <p className="mt-2 text-sm text-emerald-400">{paymentResult}</p>
            )}
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-sm font-semibold text-slate-200">
                Transactions per minute (recent)
              </p>
              <p className="text-[11px] text-slate-500">
                Streaming via WebSocket · mock if disconnected
              </p>
            </div>
            <div className="mt-2 flex h-40 items-end gap-1">
              {fakeSparkline.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md min-w-0"
                  style={{
                    height: `${12 + v * 6}px`,
                    background: "linear-gradient(to top, rgba(16, 185, 129, 0.3), rgba(52, 211, 153, 0.8))",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg">
            <p className="mb-3 text-sm font-semibold text-slate-200">
              Latest fraud decisions (sample)
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2.5 border border-slate-700">
                <span>High‑velocity UPI pattern · IN</span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-medium text-rose-300">
                  BLOCK
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2.5 border border-slate-700">
                <span>Cross‑border card · EU → US</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-medium text-amber-300">
                  REVIEW
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2.5 border border-slate-700">
                <span>Wallet top‑up · trusted device</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-300">
                  APPROVE
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
