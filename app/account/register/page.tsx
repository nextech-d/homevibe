"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fieldInput, fieldLabel, pageHeading, primaryButton, raisedSurface, textLink } from "../../components/homeSurfaces";
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
      <div className={`${raisedSurface} w-full p-6 sm:p-8`}>
        <h1 className={pageHeading}>Create account</h1>
        <p className="mt-2 text-base text-neutral-600">Track orders and save delivery addresses.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error === REGISTER_FAILED_MESSAGE ? (
            // The server's deliberately vague answer for a taken email: it
            // doesn't confirm an account exists, so the way forward is offered
            // rather than stated.
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {error}{" "}
              <Link href="/account/login" className="underline hover:text-red-950">
                Sign in
              </Link>
            </p>
          ) : (
            error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {error}
              </p>
            )
          )}
          <div>
            <label htmlFor="register-name" className={fieldLabel}>Full name</label>
            <input
              id="register-name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={fieldInput}
            />
          </div>
          <div>
            <label htmlFor="register-email" className={fieldLabel}>Email</label>
            <input
              id="register-email"
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
            <label htmlFor="register-phone" className={fieldLabel}>Phone (optional)</label>
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className={fieldInput}
            />
          </div>
          <div>
            <label htmlFor="register-password" className={fieldLabel}>Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              className={fieldInput}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`${primaryButton} h-12 w-full`}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/account/login" className={`inline-flex min-h-11 items-center ${textLink}`}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
