import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use same-origin API route so the browser doesn't call backend directly (avoids CORS / reachability issues)
  const authApi = typeof window !== "undefined" ? "/api/auth/login" : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/login`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post(
        authApi,
        { email, password },
        { timeout: 15000 }
      );
      localStorage.setItem("access_token", res.data.accessToken);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string }; status?: number }; code?: string };
      let message: string;
      if (!axErr.response) {
        message = "Cannot reach the server. Start the backend (API Gateway + Auth + Postgres) and run: npm run seed (see DEMO_CREDENTIALS.md).";
      } else if (axErr.response.status === 401) {
        message = axErr.response.data?.message || "Invalid email or password.";
      } else {
        message = axErr.response.data?.message || "Login failed.";
      }
      setError(message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)" }}
    >
      <div className="relative w-full max-w-md">
        <div
          className="pointer-events-none absolute -top-24 -left-10 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
        />
        <div
          className="relative rounded-2xl border border-slate-700 bg-slate-900/95 px-8 py-8 shadow-2xl backdrop-blur"
          style={{ boxShadow: "0 0 60px -12px rgba(16, 185, 129, 0.2), 0 25px 50px -12px rgba(0,0,0,0.5)" }}
        >
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "#34d399" }}>
              AIPay Shield
            </p>
            <h1 className="text-2xl font-bold text-white mb-1">Sign in to dashboard</h1>
            <p className="text-sm text-slate-400">
              Use your admin, merchant or analyst credentials to access live payments and fraud analytics.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Email address
              <input
                type="email"
                className="mt-2 w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Password
              <input
                type="password"
                className="mt-2 w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && (
              <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="mt-2 w-full rounded-full py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:opacity-95"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 24px rgba(16, 185, 129, 0.4)" }}
            >
              Sign in
            </button>
          </form>
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Demo login (password for all: Demo@123)</p>
            <p>admin@demo.com · merchant@demo.com · analyst@demo.com · user@demo.com</p>
            <p className="mt-2 text-slate-500">Backend must be running and demo users seeded (npm run seed).</p>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            <Link href="/" className="text-emerald-400 hover:underline">Back to home</Link>
            {" · "}
            <Link href="/register" className="text-emerald-400 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
