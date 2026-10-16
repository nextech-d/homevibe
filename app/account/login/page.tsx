"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fieldInput, fieldLabel, pageHeading, primaryButton, raisedSurface, textLink } from "../../components/homeSurfaces";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/account");
        router.refresh();
        return;
      }

      setError(data.message || "Login failed.");
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-6 py-16">
      <div className={`${raisedSurface} w-full p-6 sm:p-8`}>
        <h1 className={pageHeading}>Sign in</h1>
        <p className="mt-2 text-base text-neutral-600">Access your orders and saved addresses.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="login-email" className={fieldLabel}>Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={fieldInput}
            />
          </div>
          <div>
            <label htmlFor="login-password" className={fieldLabel}>Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={fieldInput}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`${primaryButton} h-12 w-full`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          No account?{" "}
          <Link href="/account/register" className={`inline-flex min-h-11 items-center ${textLink}`}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
