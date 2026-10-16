import type { ReactNode } from "react";
import { pageHeading, raisedSurface } from "./homeSurfaces";

/**
 * A centred white panel for a page that has nothing else to show: not found,
 * an error, an empty search. The site-wide 404, the category and product 404s
 * and the error page all use it so they read as one site.
 */
export default function StatusPanel({
  title,
  children,
  actions,
  headingLevel = "h1",
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    <div className={`${raisedSurface} mx-auto max-w-lg px-6 py-12 text-center sm:px-10`}>
      <Heading className={pageHeading}>{title}</Heading>
      {children && <div className="mx-auto mt-3 max-w-md text-base leading-relaxed text-neutral-600">{children}</div>}
      {actions && <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div>}
    </div>
  );
}
