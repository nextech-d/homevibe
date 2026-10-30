import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { cardOuter } from "../lib/cardSurfaces";
import { productsLabel, type OptionTypeItem, type OptionValueItem } from "../lib/options";
import { StorefrontSection, accentAt, storefrontInputClass } from "../components/StorefrontPanel";

const smallButton =
  "rounded-lg border border-[#333] p-1.5 text-neutral-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30";

/** Swaps two neighbours; the new order is the list's order. */
function moved<T>(rows: T[], index: number, direction: -1 | 1): T[] | null {
  const target = index + direction;
  if (target < 0 || target >= rows.length) return null;
  const next = [...rows];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Asks before deleting. Something products use gets the count and what
 * deleting does to them, and is then deleted with force=1; something unused is
 * deleted plainly, so a product ticking it since this page loaded is refused
 * by the API rather than silently changed.
 */
function confirmDelete(label: string, productCount: number): "" | "?force=1" | null {
  if (productCount > 0) {
    return confirm(
      `${label} is used by ${productsLabel(productCount)}. Deleting it removes it from them. Delete anyway?`
    )
      ? "?force=1"
      : null;
  }
  return confirm(`Delete ${label}?`) ? "" : null;
}

export default function SystemDataPage() {
  const [types, setTypes] = useState<OptionTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newType, setNewType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ types: OptionTypeItem[] }>("/admin/options");
      setTypes(data.types);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load system data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Runs a change; on failure shows why and reloads, so the page never shows what wasn't saved. */
  async function run(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      await load();
    }
  }

  function updateType(id: number, patch: (type: OptionTypeItem) => OptionTypeItem) {
    setTypes((rows) => rows.map((type) => (type.id === id ? patch(type) : type)));
  }

  async function addType(e: React.FormEvent) {
    e.preventDefault();
    const name = newType.trim();
    if (!name) return;
    await run(async () => {
      const data = await api<{ id: number }>("/admin/options", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setTypes((rows) => [
        ...rows,
        { id: data.id, name, sortOrder: rows.length, values: [], productCount: 0 },
      ]);
      setNewType("");
    });
  }

  function moveType(index: number, direction: -1 | 1) {
    const next = moved(types, index, direction);
    if (!next) return;
    setTypes(next);
    run(() =>
      api("/admin/options/order", {
        method: "PUT",
        body: JSON.stringify({ ids: next.map((type) => type.id) }),
      })
    );
  }

  function deleteType(type: OptionTypeItem) {
    const force = confirmDelete(`"${type.name}" and its ${type.values.length} values`, type.productCount);
    if (force === null) return;
    run(async () => {
      await api(`/admin/options/${type.id}${force}`, { method: "DELETE" });
      setTypes((rows) => rows.filter((row) => row.id !== type.id));
    });
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">System data</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Option types and their values, ticked on products under Options. Descriptive only: no
            price or stock per option.
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

      <form onSubmit={addType} className="mb-6">
        <StorefrontSection
          title="Add option type"
          description="For example Capacity or Material. Type a name and press Enter."
          icon={Plus}
          accent="sky"
        >
          <div className="flex gap-2">
            <input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Capacity"
              className={storefrontInputClass}
            />
            <button
              type="submit"
              disabled={!newType.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#00e599] px-4 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </StorefrontSection>
      </form>

      {loading && types.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={`h-48 animate-pulse rounded-xl ${cardOuter}`} />
          ))}
        </div>
      ) : types.length === 0 ? (
        <StorefrontSection
          title="No option types"
          description="Add one above, such as Size or Color."
          icon={Database}
          accent="violet"
        >
          <span />
        </StorefrontSection>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {types.map((type, index) => (
            <OptionTypeCard
              key={type.id}
              type={type}
              index={index}
              isFirst={index === 0}
              isLast={index === types.length - 1}
              onMove={(direction) => moveType(index, direction)}
              onDelete={() => deleteType(type)}
              onChange={(patch) => updateType(type.id, patch)}
              run={run}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionTypeCard({
  type,
  index,
  isFirst,
  isLast,
  onMove,
  onDelete,
  onChange,
  run,
}: {
  type: OptionTypeItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onChange: (patch: (type: OptionTypeItem) => OptionTypeItem) => void;
  run: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(type.name);
  const [newValue, setNewValue] = useState("");
  const quickAdd = useRef<HTMLInputElement>(null);

  function rename() {
    const trimmed = name.trim();
    setRenaming(false);
    if (!trimmed || trimmed === type.name) {
      setName(type.name);
      return;
    }
    run(async () => {
      await api(`/admin/options/${type.id}`, { method: "PATCH", body: JSON.stringify({ name: trimmed }) });
      onChange((t) => ({ ...t, name: trimmed }));
    });
  }

  /**
   * Enter adds. Commas split, so "S, M, L" adds three at once; each is added
   * in turn so the order typed is the order kept. Focus stays in the box.
   */
  async function addValues(e: React.FormEvent) {
    e.preventDefault();
    const values = newValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (values.length === 0) return;
    setNewValue("");
    await run(async () => {
      for (const value of values) {
        const data = await api<{ id: number }>(`/admin/options/${type.id}/values`, {
          method: "POST",
          body: JSON.stringify({ value }),
        });
        onChange((t) => ({
          ...t,
          values: [...t.values, { id: data.id, value, sortOrder: t.values.length, productCount: 0 }],
        }));
      }
    });
    quickAdd.current?.focus();
  }

  function moveValue(valueIndex: number, direction: -1 | 1) {
    const next = moved(type.values, valueIndex, direction);
    if (!next) return;
    onChange((t) => ({ ...t, values: next }));
    run(() =>
      api(`/admin/options/${type.id}/values/order`, {
        method: "PUT",
        body: JSON.stringify({ ids: next.map((value) => value.id) }),
      })
    );
  }

  function renameValue(value: OptionValueItem, text: string) {
    run(async () => {
      await api(`/admin/options/values/${value.id}`, {
        method: "PATCH",
        body: JSON.stringify({ value: text }),
      });
      onChange((t) => ({
        ...t,
        values: t.values.map((v) => (v.id === value.id ? { ...v, value: text } : v)),
      }));
    });
  }

  function deleteValue(value: OptionValueItem) {
    const force = confirmDelete(`"${value.value}"`, value.productCount);
    if (force === null) return;
    run(async () => {
      await api(`/admin/options/values/${value.id}${force}`, { method: "DELETE" });
      onChange((t) => ({ ...t, values: t.values.filter((v) => v.id !== value.id) }));
    });
  }

  return (
    <StorefrontSection
      title={type.name}
      description={`${type.values.length} value${type.values.length === 1 ? "" : "s"}`}
      badge={type.productCount > 0 ? productsLabel(type.productCount) : undefined}
      icon={SlidersHorizontal}
      accent={accentAt(index)}
      actions={
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={isFirst} title="Move up" aria-label={`Move ${type.name} up`} className={smallButton}>
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={isLast} title="Move down" aria-label={`Move ${type.name} down`} className={smallButton}>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setRenaming(true)} title="Rename" aria-label={`Rename ${type.name}`} className={smallButton}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} title="Delete type" aria-label={`Delete ${type.name}`} className={`${smallButton} hover:text-red-400`}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      }
    >
      {renaming && (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              rename();
            } else if (e.key === "Escape") {
              setName(type.name);
              setRenaming(false);
            }
          }}
          aria-label="Option type name"
          className={storefrontInputClass}
        />
      )}

      {type.values.length === 0 ? (
        <p className="text-xs text-neutral-500">No values yet.</p>
      ) : (
        <ul className="divide-y divide-[#1f1f1f] rounded-lg border border-[#262626] bg-[#0d0d0d]">
          {type.values.map((value, valueIndex) => (
            <ValueRow
              key={value.id}
              value={value}
              isFirst={valueIndex === 0}
              isLast={valueIndex === type.values.length - 1}
              onMove={(direction) => moveValue(valueIndex, direction)}
              onRename={(text) => renameValue(value, text)}
              onDelete={() => deleteValue(value)}
            />
          ))}
        </ul>
      )}

      <form onSubmit={addValues}>
        <input
          ref={quickAdd}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Add a ${type.name.toLowerCase()} and press Enter`}
          aria-label={`Add ${type.name} value`}
          className={storefrontInputClass}
        />
      </form>
    </StorefrontSection>
  );
}

function ValueRow({
  value,
  isFirst,
  isLast,
  onMove,
  onRename,
  onDelete,
}: {
  value: OptionValueItem;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onRename: (text: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value.value);

  function save() {
    setEditing(false);
    const trimmed = text.trim();
    if (!trimmed || trimmed === value.value) {
      setText(value.value);
      return;
    }
    onRename(trimmed);
  }

  return (
    <li className="flex items-center gap-2 px-3 py-1.5">
      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              setText(value.value);
              setEditing(false);
            }
          }}
          aria-label="Value"
          className={`${storefrontInputClass} py-1`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Click to edit"
          className="min-w-0 flex-1 truncate text-left text-xs font-medium text-neutral-200 hover:text-white"
        >
          {value.value}
        </button>
      )}
      {value.productCount > 0 && (
        <span className="shrink-0 text-[10px] text-neutral-500">{productsLabel(value.productCount)}</span>
      )}
      <div className="flex shrink-0 gap-1">
        <button type="button" onClick={() => onMove(-1)} disabled={isFirst} title="Move up" aria-label={`Move ${value.value} up`} className={smallButton}>
          <ChevronUp className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={isLast} title="Move down" aria-label={`Move ${value.value} down`} className={smallButton}>
          <ChevronDown className="h-3 w-3" />
        </button>
        <button type="button" onClick={onDelete} title="Delete value" aria-label={`Delete ${value.value}`} className={`${smallButton} hover:text-red-400`}>
          <X className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}
