import { raisedSurface } from "../../components/homeSurfaces";

/** Shaped like the page it stands in for: breadcrumb, a raised image panel, then the buy column. */
export default function ProductLoading() {
  return (
    // min-h-screen, as the page itself has: a shorter skeleton painted the footer
    // on screen, and the real page then pushed it off - a 0.21 layout shift.
    <div className="mx-auto min-h-screen max-w-7xl animate-pulse px-6 py-8" aria-busy="true" aria-label="Loading product">
      <div className="mb-8 h-4 w-64 rounded bg-[#DCE0E7]" />
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className={`${raisedSurface} aspect-square lg:col-span-5`} />
        <div className="space-y-4 pt-2 lg:col-span-7 lg:pt-8">
          <div className="h-10 w-3/4 rounded bg-[#DCE0E7]" />
          <div className="h-8 w-32 rounded bg-[#DCE0E7]" />
          <div className="h-20 w-full rounded bg-[#DCE0E7]" />
          <div className="h-12 w-48 rounded-full bg-[#DCE0E7]" />
        </div>
      </div>
    </div>
  );
}
