import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p role="status" className="text-sm font-medium text-neutral-600">
            Searching…
          </p>
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
