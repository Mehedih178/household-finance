import { AppShell } from "@/components/app-shell";
import { requireHousehold } from "@/lib/data";

export default async function ProfilePage() {
  const { user } = await requireHousehold();

  return (
    <AppShell title="Profile">
      <section className="ios-card p-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-app-tint text-3xl font-bold text-white">
          {(user.email ?? "U").slice(0, 1).toUpperCase()}
        </div>
        <h2 className="mt-4 text-2xl font-bold text-app-text">{user.user_metadata.full_name ?? "Profile"}</h2>
        <p className="mt-1 text-app-muted">{user.email}</p>
      </section>
    </AppShell>
  );
}
