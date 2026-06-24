import Link from "next/link";
import { signIn, signUp } from "@/app/actions";

export default function AuthPage({
  searchParams
}: {
  searchParams?: { error?: string; message?: string; next?: string };
}) {
  const next = searchParams?.next?.startsWith("/") ? searchParams.next : "/dashboard";
  const isInviteFlow = next.startsWith("/invite/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-end bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <section className="mb-8">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-app-tint text-3xl font-bold text-white shadow-ios">
          $
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-app-text">Household Finance</h1>
        <p className="mt-3 text-lg leading-7 text-app-muted">
          Shared budgeting for your household, with private entries when you need them.
        </p>
      </section>

      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams?.message ? (
        <div className="mb-4 rounded-2xl border border-app-tint/30 bg-app-tint/10 p-4 text-sm text-app-tint">
          {searchParams.message}
        </div>
      ) : null}

      <section className="ios-card overflow-hidden">
        {isInviteFlow ? (
          <div className="border-b border-app-line bg-app-tint/10 p-5 text-sm leading-6 text-app-muted">
            You are joining a household. Use the exact email address the invite was sent to, then come back to the invite after verifying.
          </div>
        ) : null}

        <details className="group border-b border-app-line" open={!isInviteFlow}>
          <summary className="cursor-pointer list-none p-5 text-lg font-bold text-app-text">
            Sign in
          </summary>
          <form action={signIn} className="grid gap-3 px-5 pb-5">
            <p className="text-sm leading-6 text-app-muted">
              Use this after your email is verified. If you came from an invite, you will return to it after signing in.
            </p>
            <input type="hidden" name="next" value={next} />
            <input className="ios-input" name="email" type="email" placeholder="Email" required />
            <input className="ios-input" name="password" type="password" placeholder="Password" required />
            <button className="ios-button" type="submit">Continue</button>
          </form>
        </details>

        <details className="group" open={isInviteFlow}>
          <summary className="cursor-pointer list-none p-5 text-lg font-bold text-app-text">
            Create account
          </summary>
          <form action={signUp} className="grid gap-3 px-5 pb-5">
            <p className="text-sm leading-6 text-app-muted">
              After creating an account, check your email and tap the verification link. Keep the check-email screen open until you verify.
            </p>
            <input type="hidden" name="next" value={next} />
            <input className="ios-input" name="full_name" placeholder="Full name" required />
            <input className="ios-input" name="email" type="email" placeholder="Email" required />
            <input className="ios-input" name="password" type="password" placeholder="Password" minLength={8} required />
            <button className="ios-button" type="submit">Create account</button>
          </form>
        </details>
      </section>

      <Link href={`/auth/reset?next=${encodeURIComponent(next)}`} className="mt-4 text-center text-sm font-semibold text-app-tint">
        Start over on this device
      </Link>
    </main>
  );
}
