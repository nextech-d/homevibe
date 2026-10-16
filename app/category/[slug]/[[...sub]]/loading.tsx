import { raisedSurface } from "../../../components/homeSurfaces";

/** Shaped like the page it stands in for: breadcrumb, heading, chips, then raised product cards. */
export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-6 py-8" aria-busy="true" aria-label="Loading products">
      <div className="mb-6 h-4 w-48 rounded bg-[#DCE0E7]" />
      <div className="mb-3 h-10 w-80 max-w-full rounded bg-[#DCE0E7]" />
      <div className="mb-6 h-4 w-96 max-w-full rounded bg-[#DCE0E7]" />
      <div className="mb-8 flex gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-11 w-24 rounded-full bg-[#DCE0E7]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className={`${raisedSurface} p-4`}>
            <div className="aspect-square rounded-xl bg-[#EDEFF3]" />
            <div className="mt-4 h-4 w-3/4 rounded bg-[#EDEFF3]" />
            <div className="mt-2 h-4 w-1/2 rounded bg-[#EDEFF3]" />
          </div>
        ))}
      </div>
    </div>
  );
}
