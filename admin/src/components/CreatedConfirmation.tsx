import { Link } from "react-router-dom";
import { CheckCircle2, Pencil, Plus, List } from "lucide-react";

export type SummaryRow = {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  sentenceCase?: boolean;
};

type Props = {
  entityType: string;
  name: string;
  listPath: string;
  editPath: string;
  createAnotherPath?: string;
  onCreateAnother?: () => void;
  preview?: React.ReactNode;
  rows: SummaryRow[];
};

export function SummaryField({ label, value, mono, sentenceCase }: SummaryRow) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid gap-1 border-b border-[#262626] py-3 last:border-0 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt
        className={
          sentenceCase
            ? "text-xs font-medium text-neutral-500"
            : "text-[10px] font-bold uppercase tracking-wider text-neutral-500"
        }
      >
        {label}
      </dt>
      <dd className={`text-sm text-neutral-200 ${mono ? "font-mono text-xs text-neutral-400" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export default function CreatedConfirmation({
  entityType,
  name,
  listPath,
  editPath,
  createAnotherPath,
  onCreateAnother,
  preview,
  rows,
}: Props) {
  const visibleRows = rows.filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== ""
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00e599]/15">
            <CheckCircle2 className="h-6 w-6 text-[#00e599]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{entityType} created</h1>
            <p className="mt-1 text-sm text-neutral-400">
              <span className="text-white">{name}</span> was saved successfully.
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-[#262626] bg-[#111111]">
          {preview && (
            <div className="border-b border-[#262626] bg-[#0a0a0a] px-6 py-5">{preview}</div>
          )}
          <dl className="px-6 py-2">
            {visibleRows.map((row) => (
              <SummaryField key={row.label} {...row} />
            ))}
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={editPath}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00e599] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-[#00cc88]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit {entityType.toLowerCase()}
          </Link>
          <Link
            to={listPath}
            className="inline-flex items-center gap-2 rounded-lg border border-[#333] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            <List className="h-3.5 w-3.5" />
            Back to list
          </Link>
          {(createAnotherPath || onCreateAnother) &&
            (onCreateAnother ? (
              <button
                type="button"
                onClick={onCreateAnother}
                className="inline-flex items-center gap-2 rounded-lg border border-[#00e599]/30 bg-[#00e599]/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#00e599] hover:bg-[#00e599]/15"
              >
                <Plus className="h-3.5 w-3.5" />
                Create another
              </button>
            ) : (
              <Link
                to={createAnotherPath!}
                className="inline-flex items-center gap-2 rounded-lg border border-[#00e599]/30 bg-[#00e599]/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#00e599] hover:bg-[#00e599]/15"
              >
                <Plus className="h-3.5 w-3.5" />
                Create another
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
