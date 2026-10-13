import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  // Set by sessionExpired() when a 12-hour token runs out mid-session.
  const [params] = useSearchParams();
  const expired = params.get("expired") === "1";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#111111] p-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00e599]">
          HomeVibe Admin
        </p>
        <h1 className="mt-2 text-lg font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-xs text-neutral-500">
          Manage products, orders, and catalog data.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {expired && !error && (
            <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
              Your session expired. Please sign in again.
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Admin password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00e599]/50 focus:outline-none focus:ring-1 focus:ring-[#00e599]/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#00e599] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
