"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";

type UserInfo = { id: number; email: string; name: string };

export default function AccountLink() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) setUser(d.user);
      })
      .catch(() => undefined);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return null;
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
      >
        <User className="h-3.5 w-3.5" />
        Account
      </Link>
      <button
        type="button"
        onClick={logout}
        aria-label="Sign out"
        className="rounded-full border border-neutral-300 p-2 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
