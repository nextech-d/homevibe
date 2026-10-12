"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REGISTER_FAILED_MESSAGE } from "../../../shared/customer-auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/account");
        router.refresh();
        return;
      }

      setError(data.message || "Registration failed.");
    } catch {
      setError("Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-6 py-16">
      <div className="w-full rounded-3xl border border-neutral-200/60 bg-white p-8 shadow-sm">
        <h1 className="text-sm font-black uppercase tracking-wider text-neutral-900">Create account</h1>
        <p className="mt-2 text-xs text-neutral-500">Track orders and save delivery addresses.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error === REGISTER_FAILED_MESSAGE ? (
            // The server's deliberately vague answer for a taken email: it
            // doesn't confirm an account exists, so the way forward is offered
            // rather than stated.
            <p className="text-xs font-semibold text-red-600">
              {error}{" "}
              <Link href="/account/login" className="underline hover:text-red-700">
                Sign in
              </Link>
            </p>
          ) : (
            error && <p className="text-xs font-semibold text-red-600">{error}</p>
          )}
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-neutral-900 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-black disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <Link href="/account/login" className="font-semibold text-neutral-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
