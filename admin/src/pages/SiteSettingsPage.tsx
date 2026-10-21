import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  RefreshCw,
  Save,
  Globe,
  Mail,
  Share2,
  MapPin,
  Phone,
  MessageCircle,
  Facebook,
  Instagram,
  Rocket,
} from "lucide-react";
import { api } from "../lib/api";
import { cardOuter } from "../lib/cardSurfaces";

type SiteSettings = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  region: string;
  city: string;
  streetAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
};

const inputClass =
  "w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#00e599]/40 focus:outline-none focus:ring-1 focus:ring-[#00e599]/20";
const labelClass =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function SettingsSection({
  title,
  description,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Globe;
  accent: "green" | "sky" | "violet";
  children: ReactNode;
}) {
  const accentStyles = {
    green: {
      bar: "from-[#00e599]/80 to-[#00e599]/10",
      icon: "bg-[#00e599]/10 text-[#00e599]",
      ring: "ring-[#00e599]/10",
    },
    sky: {
      bar: "from-sky-400/80 to-sky-400/10",
      icon: "bg-sky-500/10 text-sky-400",
      ring: "ring-sky-500/10",
    },
    violet: {
      bar: "from-violet-400/80 to-violet-400/10",
      icon: "bg-violet-500/10 text-violet-400",
      ring: "ring-violet-500/10",
    },
  }[accent];

  return (
    <section className={`relative overflow-hidden rounded-xl p-5 ${cardOuter}`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentStyles.bar}`} />
      <div className="mb-5 flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${accentStyles.icon} ${accentStyles.ring}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-3.5">
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[10px] text-neutral-600">{hint}</p>}
    </div>
  );
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ settings: SiteSettings }>("/admin/storefront/settings");
      setSettings(data.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function buildAndUpdate() {
    setPublishing(true);
    setError("");
    setPublishMessage("");
    try {
      const data = await api<{
        publish: { revalidated: boolean; deployed: boolean; message: string };
      }>("/admin/storefront/publish", { method: "POST" });
      setPublishMessage(data.publish.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update storefront");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const data = await api<{ settings: SiteSettings }>("/admin/storefront/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(data.settings);
      setSaved(true);
      await buildAndUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Site settings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Contact details and social links shown on the storefront footer and checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-6 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          Settings saved
          {publishMessage ? ` — storefront updated (${publishMessage})` : "."}
        </div>
      )}

      {publishMessage && !saved && (
        <div className="mb-6 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          Storefront updated — {publishMessage}
        </div>
      )}

      {loading || !settings ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl border border-[#262626] bg-[#111111]" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
            <SettingsSection
              title="General"
              description="Brand identity and service area shown in the header and footer."
              icon={Globe}
              accent="green"
            >
              <Field label="Site name">
                <input
                  value={settings.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Tagline">
                <input
                  value={settings.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="City" hint="Used in FAQ and delivery copy.">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
                  <input
                    value={settings.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field
                label="Street address"
                hint="Without the city. Used in the privacy policy and search results."
              >
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
                  <input
                    value={settings.streetAddress}
                    onChange={(e) => updateField("streetAddress", e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Region">
                <input
                  value={settings.region}
                  onChange={(e) => updateField("region", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </SettingsSection>

            <SettingsSection
              title="Contact"
              description="How customers reach you — footer, checkout, and order emails."
              icon={Mail}
              accent="sky"
            >
              <Field label="Email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Phone">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
                  <input
                    value={settings.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field label="WhatsApp" hint="Digits only, e.g. 254700000000">
                <div className="relative">
                  <MessageCircle className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-600" />
                  <input
                    value={settings.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="254700000000"
                  />
                </div>
              </Field>
            </SettingsSection>

            <SettingsSection
              title="Social"
              description="Footer buttons linking to your social profiles."
              icon={Share2}
              accent="violet"
            >
              <Field label="Facebook">
                <div className="relative">
                  <Facebook className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-400/70" />
                  <input
                    value={settings.facebookUrl}
                    onChange={(e) => updateField("facebookUrl", e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="https://facebook.com/…"
                  />
                </div>
              </Field>
              <Field label="Instagram">
                <div className="relative">
                  <Instagram className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pink-400/70" />
                  <input
                    value={settings.instagramUrl}
                    onChange={(e) => updateField("instagramUrl", e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="https://instagram.com/…"
                  />
                </div>
              </Field>
              <Field label="TikTok">
                <div className="relative">
                  <TikTokIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-300" />
                  <input
                    value={settings.tiktokUrl}
                    onChange={(e) => updateField("tiktokUrl", e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="https://tiktok.com/@…"
                  />
                </div>
              </Field>
            </SettingsSection>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#262626] bg-[#111111] px-5 py-4">
            <p className="text-xs text-neutral-500">
              Preview: <span className="text-neutral-300">{settings.name}</span>
              <span className="mx-2 text-neutral-700">·</span>
              {settings.email}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={buildAndUpdate}
                disabled={publishing || saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
              >
                <Rocket className={`h-3.5 w-3.5 ${publishing ? "animate-pulse" : ""}`} />
                {publishing ? "Updating…" : "Build & update"}
              </button>
              <button
                type="submit"
                disabled={saving || publishing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e599] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
