import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ConsoleShell, type ConsoleProfile } from "@/components/ConsoleShell";

type Tx = {
  transaction_id: string;
  status: string;
  transaction_reference?: string | null;
  original_amount: string;
  original_currency: string;
  converted_amount: string;
  converted_currency: string;
  payment_method: string;
  fraud_score?: string | null;
  fraud_risk_level?: string | null;
  fraud_decision?: string | null;
  merchant_name?: string | null;
  created_at: string;
  completed_at?: string | null;
};

export default function TransactionsPage() {
  const [profile, setProfile] = useState<ConsoleProfile>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "captured" | "blocked" | "pending">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all");

  const apiUrl =
    typeof window !== "undefined"
      ? "/api/backend"
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (typeof window !== "undefined" && !token) {
      window.location.href = "/login";
      return;
    }
    if (!token || !apiUrl) return;
    setLoadingProfile(true);
    axios
      .get(`${apiUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [token, apiUrl]);

  useEffect(() => {
    if (!profile || !token || !apiUrl) return;
    setLoadingTx(true);
    setError(null);

    const params: Record<string, string | number> = { limit: 50 };
    let endpoint = "/payments/user-transactions";
    if (profile.merchant_id) {
      endpoint = "/payments/merchant-transactions";
      params.merchant_id = profile.merchant_id;
    } else {
      params.user_id = (profile as any).id;
    }

    axios
      .get(`${apiUrl}${endpoint}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTransactions(res.data as Tx[]))
      .catch((err) => {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : "Failed to load transactions.";
        setError(msg || "Failed to load transactions.");
      })
      .finally(() => setLoadingTx(false));
  }, [profile, token, apiUrl]);

  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      const risk = (t.fraud_risk_level || "").toLowerCase();
      if (riskFilter === "high" && risk !== "high") return false;
      if (riskFilter === "medium" && risk !== "medium") return false;
      if (riskFilter === "low" && risk && risk !== "low") return false;
      return true;
    });
  }, [transactions, statusFilter, riskFilter]);

  const onLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  };

  if (loadingProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-slate-100"
        style={{ backgroundColor: "#020617" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <ConsoleShell profile={profile} active="transactions" onLogout={onLogout}>
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">Transaction history</h1>
          <p className="text-xs text-slate-400">
            View captured, blocked, and pending payments for this account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <select
            className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="captured">Captured</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>
          <select
            className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
          >
            <option value="all">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 sm:p-4 shadow-lg">
        {loadingTx ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-400">
            Loading transactions…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-slate-400">
            <p>No transactions yet for this account.</p>
            <p className="text-xs text-slate-500">
              Use the dashboard to create a test payment, then return here to see it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="whitespace-nowrap px-2 py-2 text-left">Time</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left">Amount</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left">Merchant</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left">Method</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left">Status</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left">Fraud</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left">Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => {
                  const created = new Date(tx.created_at);
                  const amount = Number(tx.converted_amount ?? tx.original_amount);
                  const currency = tx.converted_currency || tx.original_currency;
                  const risk = (tx.fraud_risk_level || "").toLowerCase();
                  const statusChip =
                    tx.status === "captured"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                      : tx.status === "blocked"
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/30";
                  const riskChip =
                    risk === "high"
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      : risk === "medium"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

                  return (
                    <tr
                      key={tx.transaction_id}
                      className="border-b border-slate-800/80 last:border-0 hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-2 py-2 align-top text-slate-300">
                        <div>{created.toLocaleDateString()}</div>
                        <div className="text-[11px] text-slate-500">
                          {created.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 align-top">
                        <div className="font-medium text-slate-100">
                          {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                        </div>
                        {tx.original_currency !== currency && (
                          <div className="text-[11px] text-slate-500">
                            {Number(tx.original_amount).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {tx.original_currency} → {currency}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 align-top text-slate-300">
                        {tx.merchant_name || "Demo Merchant"}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 align-top text-slate-300">
                        {tx.payment_method}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 align-top">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${statusChip}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 align-top">
                        {tx.fraud_score != null ? (
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${riskChip}`}>
                            {(Number(tx.fraud_score) * 100).toFixed(0)}% · {tx.fraud_risk_level ?? "n/a"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Not scored</span>
                        )}
                      </td>
                      <td className="max-w-xs px-2 py-2 align-top">
                        <div className="truncate text-[11px] text-slate-400" title={tx.transaction_reference || ""}>
                          {tx.transaction_reference || "—"}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {tx.transaction_id.slice(0, 12)}…
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ConsoleShell>
  );
}

