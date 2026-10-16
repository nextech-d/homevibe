import Link from "next/link";
import StatusPanel from "./components/StatusPanel";
import { primaryButton, secondaryButton } from "./components/homeSurfaces";

/**
 * Every unknown URL, and every notFound() without a nearer not-found file
 * (brand, guides, blog). Before this Next's unstyled default answered them.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <StatusPanel
        title="Page not found"
        actions={
          <>
            <Link href="/" className={primaryButton}>
              Return home
            </Link>
            <Link href="/track-order" className={secondaryButton}>
              Track an order
            </Link>
          </>
        }
      >
        The page you were looking for doesn&apos;t exist or has moved.
      </StatusPanel>
    </div>
  );
}
