import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, X } from "lucide-react";
import type { OptionTypeItem } from "../lib/options";
import { storefrontSelectClass } from "./StorefrontPanel";

/**
 * The product's options: pick a type, tick its values. Only the ticked value
 * ids are saved - a type shows here while it has a tick, or after it is picked
 * until the form is left. The System data links open a new tab, so unsaved
 * edits here aren't lost.
 *
 * Its own Save appears once anything here is touched and is enabled while the
 * ticks differ from `savedValue`. What saving means is the form's: stored at
 * once on an existing product, kept for the create on a new one.
 */
export default function ProductOptionsField({
  types,
  value,
  onChange,
  savedValue,
  onSave,
  savedNote,
}: {
  types: OptionTypeItem[];
  value: number[];
  onChange: (ids: number[]) => void;
  /** The ticks as last saved (or, on a new product, confirmed). */
  savedValue: number[];
  /** Throws to report a failure; the selection is kept either way. */
  onSave: (ids: number[]) => Promise<void>;
  /** Appended to the confirmation, e.g. "stored when the product is created". */
  savedNote?: string;
}) {
  const selected = new Set(value);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = !sameIds(value, savedValue);

  function change(ids: number[]) {
    setTouched(true);
    setNotice(null);
    onChange(ids);
  }

  async function save() {
    const ids = value;
    setSaving(true);
    setNotice(null);
    try {
      await onSave(ids);
      const text = describeSave(types, new Set(savedValue), new Set(ids));
      setNotice({ ok: true, text: savedNote ? `${text} — ${savedNote}.` : `${text}.` });
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "Failed to save options." });
    } finally {
      setSaving(false);
    }
  }
  const [shownIds, setShownIds] = useState<number[]>(() =>
    types.filter((type) => type.values.some((v) => selected.has(v.id))).map((type) => type.id)
  );
  const shown = types.filter((type) => shownIds.includes(type.id));
  const available = types.filter((type) => !shownIds.includes(type.id));

  function toggle(id: number) {
    change(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function removeType(type: OptionTypeItem) {
    const ids = new Set(type.values.map((v) => v.id));
    change(value.filter((id) => !ids.has(id)));
    setShownIds((rows) => rows.filter((id) => id !== type.id));
  }

  if (types.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No option types yet. Add them under{" "}
        <Link to="/system-data" target="_blank" className="text-[#00e599] hover:underline">
          System data
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {shown.map((type) => (
        <div key={type.id} className="rounded-lg border border-[#262626] bg-[#0d0d0d] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-neutral-200">{type.name}</p>
            <button
              type="button"
              onClick={() => removeType(type)}
              aria-label={`Remove ${type.name}`}
              title={`Remove ${type.name} from this product`}
              className="rounded p-1 text-neutral-500 hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {type.values.length === 0 ? (
            <p className="text-[11px] text-neutral-500">
              {type.name} has no values yet. Add them under System data.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {type.values.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                    selected.has(option.id)
                      ? "border-[#00e599]/50 bg-[#00e599]/10 text-white"
                      : "border-[#333] text-neutral-400 hover:bg-[#1a1a1a]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(option.id)}
                    onChange={() => toggle(option.id)}
                    className="rounded border-[#333]"
                  />
                  {option.value}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="space-y-2">
        {available.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const id = Number(e.target.value);
              if (!id) return;
              setShownIds((rows) => [...rows, id]);
              setTouched(true);
              setNotice(null);
            }}
            aria-label="Add an option type"
            className={storefrontSelectClass}
          >
            <option value="">Add an option type…</option>
            {available.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        )}
        <Link to="/system-data" target="_blank" className="text-[11px] text-neutral-500 hover:text-[#00e599]">
          Manage types and values (new tab)
        </Link>
      </div>

      {(touched || dirty) && (
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#00e599] py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save options"}
        </button>
      )}

      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={`rounded-lg border px-3 py-2 text-xs ${
            notice.ok
              ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400"
              : "border-red-900/50 bg-red-950/30 text-red-400"
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}

function sameIds(a: number[], b: number[]): boolean {
  const set = new Set(a);
  return set.size === new Set(b).size && b.every((id) => set.has(id));
}

/** "Size", "Size and Color", "Size, Color and Capacity". */
function joinNames(names: string[]): string {
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/**
 * Names what changed, by type: "Size added" (it had no ticks before), "Color
 * removed" (it has none now), "Size and Color saved" (ticks changed).
 */
function describeSave(types: OptionTypeItem[], before: Set<number>, after: Set<number>): string {
  const groups: Record<"added" | "saved" | "removed", string[]> = { added: [], saved: [], removed: [] };
  for (const type of types) {
    const was = type.values.filter((v) => before.has(v.id)).map((v) => v.id);
    const now = type.values.filter((v) => after.has(v.id)).map((v) => v.id);
    if (sameIds(was, now)) continue;
    groups[was.length === 0 ? "added" : now.length === 0 ? "removed" : "saved"].push(type.name);
  }
  const parts = (["added", "saved", "removed"] as const)
    .filter((verb) => groups[verb].length > 0)
    .map((verb) => `${joinNames(groups[verb])} ${verb}`);
  return parts.length > 0 ? parts.join(", ") : "Options saved";
}
