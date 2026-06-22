import Link from "next/link";
import { createInvitation } from "@/app/actions";
import { BackButton } from "@/components/back-button";
import { CopyButton } from "@/components/copy-button";
import { ShareInviteButton } from "@/components/share-invite-button";
import { requireHousehold } from "@/lib/data";

export default async function InvitePage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: invites } = await supabase
    .from("invitations")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[calc(28px+env(safe-area-inset-top))]">
      <BackButton href="/settings" />
      <div className="pt-12">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-app-tint">Step 2</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-app-text">Invite your spouse</h1>
        <p className="mt-3 text-lg leading-7 text-app-muted">
          Create an invitation record now. You can send the token link manually while email delivery is configured.
        </p>
      </div>

      {searchParams?.error ? (
        <div className="mt-6 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <form action={createInvitation} className="mt-10 grid gap-4">
        <input className="ios-input" name="email" type="email" placeholder="spouse@example.com" required />
        <button className="ios-button" type="submit">Create invite</button>
      </form>

      <div className="mt-6 grid gap-3">
        {invites?.map((invite) => {
          const inviteUrl = `${siteUrl}/invite/${invite.token}`;

          return (
            <div key={invite.id} className="ios-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-app-text">{invite.email}</p>
                  <p className="mt-1 text-sm capitalize text-app-muted">{invite.status}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ShareInviteButton url={inviteUrl} email={invite.email} />
                  <CopyButton value={inviteUrl} />
                </div>
              </div>
              <p className="mt-3 break-all rounded-2xl bg-app-bg p-3 text-sm text-app-muted">
                {inviteUrl}
              </p>
            </div>
          );
        })}
      </div>

      <Link href="/dashboard" className="ios-secondary-button mt-6 w-full">
        Go to dashboard
      </Link>
    </main>
  );
}
