import { signIn, signUp } from "@/app/actions";

export default function AuthPage({
  searchParams
}: {
  searchParams?: { error?: string; next?: string };
}) {
  const next = searchParams?.next?.startsWith("/") ? searchParams.next : "/dashboard";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-end bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <section className="mb-8">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-app-tint text-3xl font-bold text-white shadow-ios">
          $
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-app-text">Household Finance</h1>
        <p className="mt-3 text-lg leading-7 text-app-muted">
          Shared budgeting for two people, with private entries when you need them.
        </p>
      </section>

      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <section className="ios-card overflow-hidden">
        <details className="group border-b border-app-line" open>
          <summary className="cursor-pointer list-none p-5 text-lg font-bold text-app-text">
            Sign in
          </summary>
          <form action={signIn} className="grid gap-3 px-5 pb-5">
            <input type="hidden" name="next" value={next} />
            <input className="ios-input" name="email" type="email" placeholder="Email" required />
            <input className="ios-input" name="password" type="password" placeholder="Password" required />
            <button className="ios-button" type="submit">Continue</button>
          </form>
        </details>

        <details className="group">
          <summary className="cursor-pointer list-none p-5 text-lg font-bold text-app-text">
            Create account
          </summary>
          <form action={signUp} className="grid gap-3 px-5 pb-5">
            <input type="hidden" name="next" value={next} />
            <input className="ios-input" name="full_name" placeholder="Full name" required />
            <input className="ios-input" name="email" type="email" placeholder="Email" required />
            <input className="ios-input" name="password" type="password" placeholder="Password" minLength={8} required />
            <button className="ios-button" type="submit">Create account</button>
          </form>
        </details>
      </section>
    </main>
  );
}
