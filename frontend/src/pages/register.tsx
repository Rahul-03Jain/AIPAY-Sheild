import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const authApi = typeof window !== "undefined" ? "/api/auth/register" : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/register`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(
        authApi,
        { email, password, fullName, role }
      );
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string }; status?: number }; code?: string };
      let message: string;
      if (!axErr.response) {
        message = "Cannot reach the server. Start the backend (API Gateway + Auth + Postgres) and try again.";
      } else {
        message = axErr.response.data?.message ?? "Registration failed.";
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
            <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
            <p className="text-sm text-slate-400">
              Register as user, merchant, or analyst. Admin accounts require backend setup.
            </p>
          </div>
          {success ? (
            <p className="text-emerald-400 font-medium">Account created. Redirecting to login...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Full name
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Email
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Password
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Role
                <select
                  className="mt-2 w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="merchant">Merchant</option>
                  <option value="analyst">Analyst</option>
                </select>
              </label>
              {error && (
                <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full rounded-full py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
              >
                Sign up
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-xs text-slate-500">
            <Link href="/login" className="text-emerald-400 hover:underline">Sign in</Link>
            {" · "}
            <Link href="/" className="text-emerald-400 hover:underline">Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
