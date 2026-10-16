import Link from "next/link";
import StatusPanel from "../../components/StatusPanel";
import { primaryButton } from "../../components/homeSurfaces";

/** Keeps the branded "not found" page the client component used to render. */
export default function ProductNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <StatusPanel
        title="Product not found"
        actions={
          <Link href="/" className={primaryButton}>
            Return to home
          </Link>
        }
      />
    </div>
  );
}
