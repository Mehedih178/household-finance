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
    .select("email, status, households(name)")
    .eq("token", params.token)
    .maybeSingle();
  const household = Array.isArray(invite?.households)
    ? invite?.households[0]
    : invite?.households;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-end bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <section className="ios-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-app-tint">Household invite</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-app-text">
          Join {household?.name ?? "this household"}
        </h1>
        <p className="mt-3 text-app-muted">
          Accepting links your account to the same shared finance workspace.
        </p>

        {searchParams?.error ? (
          <div className="mt-5 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
            {searchParams.error}
          </div>
        ) : null}

        {user ? (
          <div className="mt-6 grid gap-3">
            <form action={acceptInvitation}>
              <input type="hidden" name="token" value={params.token} />
              <button className="ios-button w-full" type="submit">Accept invite</button>
            </form>
            <Link href={`/auth/reset?next=${encodeURIComponent(`/invite/${params.token}`)}`} className="ios-secondary-button w-full">
              Use a different account
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
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
