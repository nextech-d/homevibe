import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import type { OptionTypeItem } from "../lib/options";
import { storefrontSelectClass } from "./StorefrontPanel";

/**
 * The product's options: pick a type, tick its values. Only the ticked value
 * ids are saved - a type shows here while it has a tick, or after it is picked
 * until the form is left. The System data links open a new tab, so unsaved
 * edits here aren't lost.
 */
export default function ProductOptionsField({
  types,
  value,
  onChange,
}: {
  types: OptionTypeItem[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const selected = new Set(value);
  const [shownIds, setShownIds] = useState<number[]>(() =>
    types.filter((type) => type.values.some((v) => selected.has(v.id))).map((type) => type.id)
  );
  const shown = types.filter((type) => shownIds.includes(type.id));
  const available = types.filter((type) => !shownIds.includes(type.id));

  function toggle(id: number) {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function removeType(type: OptionTypeItem) {
    const ids = new Set(type.values.map((v) => v.id));
    onChange(value.filter((id) => !ids.has(id)));
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

      <div className="flex flex-wrap items-center gap-3">
        {available.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) setShownIds((rows) => [...rows, id]);
            }}
            aria-label="Add an option type"
            className={`${storefrontSelectClass} max-w-xs`}
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
    </div>
  );
}
