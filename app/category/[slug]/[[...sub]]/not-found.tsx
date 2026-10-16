import Link from "next/link";
import StatusPanel from "../../../components/StatusPanel";
import { primaryButton } from "../../../components/homeSurfaces";

export default function CategoryNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <StatusPanel
        title="Category not found"
        actions={
          <Link href="/" className={primaryButton}>
            Return home
          </Link>
        }
      >
        This collection doesn&apos;t exist.
      </StatusPanel>
    </div>
  );
}
