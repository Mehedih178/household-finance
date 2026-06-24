import { createHousehold } from "@/app/actions";

export default function CreateHouseholdPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[calc(28px+env(safe-area-inset-top))]">
      <div className="pt-12">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-app-tint">Welcome</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-app-text">Understand your household finances.</h1>
        <p className="mt-3 text-lg leading-7 text-app-muted">
          Create one private space for budgets, spending, goals, and shared decisions.
        </p>
      </div>

      {searchParams?.error ? (
        <div className="mt-6 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <section className="ios-card mt-8 p-4">
        <h2 className="text-lg font-bold text-app-text">Setup takes under a minute</h2>
        <div className="mt-4 grid gap-3">
          {[
            "Create your household",
            "Invite your wife",
            "Add accounts, budgets, and transactions"
          ].map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-app-tint/10 text-sm font-bold text-app-tint">{index + 1}</span>
              <p className="text-sm font-medium text-app-text">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <form action={createHousehold} className="ios-card mt-5 grid gap-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Name your household</h2>
          <p className="mt-1 text-sm text-app-muted">You can change this later.</p>
        </div>
        <input className="ios-input" name="name" placeholder="The Hassan Household" required />
        <button className="ios-button" type="submit">Continue</button>
      </form>
    </main>
  );
}
