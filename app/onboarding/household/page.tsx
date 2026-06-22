import { createHousehold } from "@/app/actions";

export default function CreateHouseholdPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-app-bg px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[calc(28px+env(safe-area-inset-top))]">
      <div className="pt-12">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-app-tint">Step 1</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-app-text">Create your household</h1>
        <p className="mt-3 text-lg leading-7 text-app-muted">
          This shared workspace keeps budgets, accounts, and transactions connected for both of you.
        </p>
      </div>

      {searchParams?.error ? (
        <div className="mt-6 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <form action={createHousehold} className="mt-10 grid gap-4">
        <input className="ios-input" name="name" placeholder="The Hassan Household" required />
        <button className="ios-button" type="submit">Create household</button>
      </form>
    </main>
  );
}
