import { redirect } from "next/navigation";
import AccountTabs from "./AccountTabs";
import { pageHeading } from "../../components/homeSurfaces";
import { getCurrentUser } from "../../lib/users.server";

export default async function AccountAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#DCE0E7] pb-6">
        <div>
          <p className="text-sm font-medium text-neutral-600">My account</p>
          <h1 className={`mt-1 ${pageHeading}`}>{user.name}</h1>
          <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
        </div>
        <AccountTabs />
      </div>
      {children}
    </div>
  );
}
