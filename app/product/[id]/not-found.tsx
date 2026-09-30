import Link from "next/link";

/** Keeps the branded "not found" page the client component used to render. */
export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Product Not Found</h1>
        <Link
          href="/"
          className="mt-4 inline-block text-emerald-600 hover:underline font-semibold"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
