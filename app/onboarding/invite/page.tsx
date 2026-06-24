import Link from "next/link";
import { createInvitation, deleteInvitation } from "@/app/actions";
import { BackButton } from "@/components/back-button";
import { CopyButton } from "@/components/copy-button";
import { ShareInviteButton } from "@/components/share-invite-button";
import { requireHousehold } from "@/lib/data";

export default async function InvitePage({
  searchParams
}: {
  searchParams?: { created?: string; deleted?: string; error?: string };
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
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-app-tint">Household setup</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-app-text">Add your wife</h1>
        <p className="mt-3 text-lg leading-7 text-app-muted">
          Create one secure link. She opens it, signs up or signs in, then taps Accept. No manual setup.
        </p>
      </div>

      {searchParams?.error ? (
        <div className="mt-6 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams?.created ? (
        <div className="mt-6 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          Invite created. Share the newest link below.
        </div>
      ) : null}

      {searchParams?.deleted ? (
        <div className="mt-6 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          Invite link deleted.
        </div>
      ) : null}

      <section className="ios-card mt-8 p-4">
        <h2 className="text-lg font-bold text-app-text">How it works</h2>
        <div className="mt-4 grid gap-3">
          {[
            ["1", "Enter her email"],
            ["2", "Share the link by text"],
            ["3", "She creates or signs into that same email"],
            ["4", "She taps Accept and joins your household"]
          ].map(([step, label]) => (
            <div key={step} className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-app-tint/10 text-sm font-bold text-app-tint">{step}</span>
              <p className="text-sm font-medium text-app-text">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <form action={createInvitation} className="ios-card mt-5 grid gap-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Create invite</h2>
          <p className="mt-1 text-sm text-app-muted">Use the exact email she will sign in with.</p>
        </div>
        <input className="ios-input" name="email" type="email" placeholder="wife@example.com" required />
        <button className="ios-button" type="submit">Create share link</button>
      </form>

      <div className="mt-6 grid gap-3">
        {invites?.map((invite) => {
          const inviteUrl = `${siteUrl}/invite/${invite.token}`;
          const isExpired = new Date(invite.expires_at).getTime() < Date.now();
          const statusLabel = invite.status === "accepted"
            ? "Accepted"
            : isExpired
              ? "Expired"
              : invite.status === "revoked"
                ? "Deleted"
                : "Waiting";
          const statusClass = invite.status === "accepted"
            ? "bg-app-success/15 text-app-success"
            : isExpired || invite.status === "revoked"
              ? "bg-app-danger/10 text-app-danger"
              : "bg-app-tint/10 text-app-tint";

          return (
            <div key={invite.id} className="ios-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-app-text">{invite.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>{statusLabel}</span>
                    <span className="text-sm text-app-muted">
                      {invite.status === "accepted" && invite.accepted_at
                        ? `Accepted ${new Date(invite.accepted_at).toLocaleDateString()}`
                        : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {invite.status === "pending" && !isExpired ? (
                    <>
                      <ShareInviteButton url={inviteUrl} email={invite.email} />
                      <CopyButton value={inviteUrl} />
                    </>
                  ) : null}
                </div>
              </div>
              {invite.status === "pending" && !isExpired ? (
                <p className="mt-3 break-all rounded-2xl bg-app-bg p-3 text-sm text-app-muted">
                  {inviteUrl}
                </p>
              ) : null}
              {invite.status === "pending" && !isExpired ? (
                <p className="mt-3 rounded-2xl bg-app-tint/10 p-3 text-sm text-app-tint">
                  Send this link to her. She must use {invite.email}.
                </p>
              ) : null}
              {invite.status === "accepted" ? (
                <p className="mt-3 rounded-2xl bg-app-success/10 p-3 text-sm text-app-success">
                  This invite has already been accepted. She should now see this household after signing in.
                </p>
              ) : null}
              {invite.status === "pending" ? (
                <form action={deleteInvitation} className="mt-3">
                  <input type="hidden" name="invite_id" value={invite.id} />
                  <button className="ios-secondary-button min-h-10 w-full text-sm text-app-danger" type="submit">
                    Delete invite link
                  </button>
                </form>
              ) : null}
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
