import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ConsoleShell, type ConsoleProfile } from "@/components/ConsoleShell";

type Metrics = {
  totalRevenue: number;
  fraudRate: number;
  txPerMinute: { timestamp: number; count: number }[];
};

type Profile = { id: string; email: string; full_name: string; role: string; merchant_id?: string } | null;

type TxPreview = {
  transaction_id: string;
  status: string;
  converted_amount: string;
  converted_currency: string;
  fraud_risk_level?: string | null;
  created_at: string;
};

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
  const [recentTx, setRecentTx] = useState<TxPreview[]>([]);
  const apiUrl = typeof window !== "undefined" ? "/api/backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080");
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (typeof window !== "undefined" && !token) {
      window.location.href = "/login";
      return;
    }
    if (!token || !apiUrl) return;
    axios
      .get(`${apiUrl}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setProfile(r.data))
      .catch(() => setProfile(null));
  }, [token, apiUrl]);

  useEffect(() => {
    if (!profile || !token || !apiUrl) return;
    const params: Record<string, string | number> = { limit: 5 };
    let endpoint = "/payments/user-transactions";
    if (profile.merchant_id) {
      endpoint = "/payments/merchant-transactions";
      params.merchant_id = profile.merchant_id;
    } else {
      params.user_id = profile.id;
    }
    axios
      .get(`${apiUrl}${endpoint}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRecentTx(res.data as TxPreview[]))
      .catch(() => setRecentTx([]));
  }, [profile, token, apiUrl]);

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

  const onLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  };

  if (!metrics) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-slate-100"
        style={{ backgroundColor: "#020617" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Connecting to analytics engine...</p>
        </div>
      </div>
    );
  }

  return (
    <ConsoleShell profile={profile as ConsoleProfile} active="dashboard" onLogout={onLogout}>
      <div className="space-y-6">
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

        <section className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
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
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg flex flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-200">
                Recent transactions
              </p>
              <Link
                href="/transactions"
                className="text-xs text-emerald-400 hover:underline whitespace-nowrap"
              >
                View all
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-xs text-slate-500">
                No recent transactions yet. Create a test payment to see it here.
              </p>
            ) : (
              <div className="space-y-2 text-xs text-slate-300">
                {recentTx.map((tx) => {
                  const created = new Date(tx.created_at);
                  const amount = Number(tx.converted_amount ?? 0);
                  const status =
                    tx.status === "captured"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : tx.status === "blocked"
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-amber-500/20 text-amber-300";
                  return (
                    <div
                      key={tx.transaction_id}
                      className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2.5 border border-slate-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-100">
                            {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                            {tx.converted_currency}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status}`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {created.toLocaleDateString()} ·{" "}
                          {created.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      {tx.fraud_risk_level && (
                        <span className="ml-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                          {tx.fraud_risk_level} risk
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </ConsoleShell>
  );
}
