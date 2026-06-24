import Link from "next/link";
import { acceptInvitation } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AcceptInvitePage({
  params,
  searchParams
}: {
  params: { token: string };
  searchParams?: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: invite } = await supabase
    .from("invitations")
    .select("email, status, expires_at, households(name)")
    .eq("token", params.token)
    .maybeSingle();
  const household = Array.isArray(invite?.households)
    ? invite?.households[0]
    : invite?.households;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-end bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <section className="ios-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-app-tint">Shared household</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-app-text">
          Join {household?.name ?? "this household"}
        </h1>
        <p className="mt-3 text-app-muted">
          This links your account to the same private finance workspace.
        </p>

        <div className="mt-5 grid gap-2 rounded-2xl bg-app-bg p-4 text-sm text-app-muted">
          <p><span className="font-semibold text-app-text">Invited email:</span> {invite?.email ?? "Hidden until sign in"}</p>
          <p><span className="font-semibold text-app-text">Status:</span> {invite?.status ?? "Open invite"}</p>
          {invite?.expires_at ? <p><span className="font-semibold text-app-text">Expires:</span> {new Date(invite.expires_at).toLocaleDateString()}</p> : null}
        </div>

        {searchParams?.error ? (
          <div className="mt-5 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
            {searchParams.error}
          </div>
        ) : null}

        {user ? (
          <div className="mt-6 grid gap-3">
            {invite?.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase() ? (
              <div className="rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
                You are signed in as {user.email}. This invite is for {invite.email}. Use the invited email to join.
              </div>
            ) : null}
            <form action={acceptInvitation}>
              <input type="hidden" name="token" value={params.token} />
              <button className="ios-button w-full" type="submit">Accept and open household</button>
            </form>
            <Link href={`/auth/reset?next=${encodeURIComponent(`/invite/${params.token}`)}`} className="ios-secondary-button w-full">
              Use a different account
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-app-bg p-4 text-sm leading-6 text-app-muted">
              New here? Tap below, create your account, verify your email, then this invite will be waiting for you.
            </div>
            <Link href={`/auth?next=${encodeURIComponent(`/invite/${params.token}`)}`} className="ios-button w-full">
              Create account or sign in
            </Link>
            <Link href={`/auth/reset?next=${encodeURIComponent(`/invite/${params.token}`)}`} className="text-center text-sm font-semibold text-app-tint">
              Start over on this device
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
