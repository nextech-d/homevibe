"use client";

import { useEffect, useState } from "react";
import {
  fieldCheckbox,
  fieldInput,
  fieldLabel,
  focusRing,
  panelHeading,
  primaryButton,
  raisedSurface,
} from "../../../components/homeSurfaces";

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


  return (
    <div className="space-y-8">
      <div>
        <h2 className={`${panelHeading} text-xl`}>Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No addresses saved yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {addresses.map((addr) => (
              <li key={addr.id} className={`${raisedSurface} flex items-start justify-between gap-4 p-4 text-sm sm:p-5`}>
                <div>
                  <p className="font-semibold text-neutral-950">
                    {addr.label}
                    {addr.isDefault && (
                      <span className="ml-2 rounded-full bg-[#F6F7F9] px-2 py-0.5 text-xs font-semibold text-neutral-800 ring-1 ring-[#DCE0E7]">Default</span>
                    )}
                  </p>
                  <p className="mt-1 text-neutral-700">{addr.addressLine}, {addr.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className={`-my-2 -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 ${focusRing}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className={`${raisedSurface} space-y-5 p-6`}>
        <h3 className={panelHeading}>Add address</h3>
        {message && (
          <p role="status" className="text-sm font-medium text-emerald-800">
            {message}
          </p>
        )}
        <div>
          <label htmlFor="address-label" className={fieldLabel}>Label</label>
          <input id="address-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Home)" className={fieldInput} />
        </div>
        <div>
          <label htmlFor="address-line" className={fieldLabel}>Street address</label>
          <input id="address-line" autoComplete="street-address" required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Street address" className={fieldInput} />
        </div>
        <div>
          <label htmlFor="address-city" className={fieldLabel}>City</label>
          <input id="address-city" autoComplete="address-level2" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={fieldInput} />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-700">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className={fieldCheckbox} />
          Set as default
        </label>
        <button
          type="submit"
          disabled={loading}
          className={primaryButton}
        >
          {loading ? "Saving..." : "Save address"}
        </button>
      </form>
    </div>
  );
}
