import { acceptInvitation } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export async function PendingInvites({ className = "" }: { className?: string }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: invites } = await supabase
    .from("invitations")
    .select("token, email, role, expires_at, households(name)")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const matchingInvites = (invites ?? []).filter((invite) => invite.email.toLowerCase() === user.email?.toLowerCase());

  if (matchingInvites.length === 0) return null;

  return (
    <section className={`ios-card p-4 ${className}`}>
      <h2 className="text-lg font-bold text-app-text">Invites waiting</h2>
      <p className="mt-1 text-sm text-app-muted">Accept an invite anytime to add another household to your site list.</p>
      <div className="mt-4 grid gap-3">
        {matchingInvites.map((invite) => {
          const household = Array.isArray(invite.households)
            ? invite.households[0]
            : invite.households;

          return (
            <form key={invite.token} action={acceptInvitation} className="rounded-2xl bg-app-bg p-3">
              <input type="hidden" name="token" value={invite.token} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-app-text">{household?.name ?? "Household"}</p>
                  <p className="mt-1 text-sm capitalize text-app-muted">
                    Join as {invite.role ?? "member"} · expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button className="ios-button min-h-10 px-4 text-sm" type="submit">
                  Accept
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </section>
  );
}
