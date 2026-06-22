import Link from "next/link";

export default function CheckEmailPage({
  searchParams
}: {
  searchParams?: { email?: string; next?: string };
}) {
  const email = searchParams?.email ?? "your email";
  const next = searchParams?.next?.startsWith("/") ? searchParams.next : "/dashboard";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-end bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <section className="ios-card p-6">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] bg-app-tint text-2xl font-bold text-white">
          @
        </div>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-app-tint">Verify email</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-app-text">Check your inbox</h1>
        <p className="mt-3 leading-7 text-app-muted">
          We sent a verification link to <span className="font-semibold text-app-text">{email}</span>.
          Open that email and tap the verification link before continuing.
        </p>
        <div className="mt-5 rounded-2xl bg-app-bg p-4 text-sm text-app-muted">
          Keep this page open. After verifying, return here and sign in. If you were accepting an invite, the app will bring you back to that invite.
        </div>
        <Link href={`/auth?next=${encodeURIComponent(next)}`} className="ios-button mt-6 w-full">
          I verified, sign in
        </Link>
      </section>
    </main>
  );
}
