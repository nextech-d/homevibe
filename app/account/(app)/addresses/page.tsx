"use client";

import { useEffect, useState } from "react";

type Address = {
  id: number;
  label: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/account/addresses");
    const data = await res.json();
    if (data.success) setAddresses(data.addresses);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, addressLine, city, isDefault }),
    });
    const data = await res.json();

    if (data.success) {
      setAddressLine("");
      setCity("");
      setMessage("Address saved.");
      await load();
    } else {
      setMessage(data.message || "Failed to save address.");
    }

    setLoading(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/account/addresses?id=${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    await load();
  }

  const inputClass =
    "w-full rounded-xl border border-neutral-300 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="mt-3 text-xs text-neutral-500">No addresses saved yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {addresses.map((addr) => (
              <li key={addr.id} className="flex items-start justify-between rounded-2xl border border-neutral-200/60 bg-white p-4 text-xs">
                <div>
                  <p className="font-semibold text-neutral-900">
                    {addr.label}
                    {addr.isDefault && (
                      <span className="ml-2 text-[10px] uppercase text-emerald-600">Default</span>
                    )}
                  </p>
                  <p className="mt-1 text-neutral-600">{addr.addressLine}, {addr.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className="rounded-3xl border border-neutral-200/60 bg-white p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">Add address</h3>
        {message && <p className="text-xs text-emerald-700">{message}</p>}
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Home)" className={inputClass} />
        <input required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Street address" className={inputClass} />
        <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputClass} />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Set as default
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-neutral-900 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-black disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save address"}
        </button>
      </form>
    </div>
  );
}
