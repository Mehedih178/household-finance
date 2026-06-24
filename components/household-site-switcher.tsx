import { switchHousehold } from "@/app/actions";

type Membership = {
  household_id: string;
  role: "owner" | "member";
  households: { id: string; name: string } | { id: string; name: string }[] | null;
};

function householdName(membership: Membership) {
  const household = Array.isArray(membership.households)
    ? membership.households[0]
    : membership.households;

  return household?.name ?? "Household";
}

export function HouseholdSiteSwitcher({
  activeHouseholdId,
  className = "",
  memberships
}: {
  activeHouseholdId: string;
  className?: string;
  memberships: Membership[];
}) {
  if (memberships.length <= 1) return null;

  return (
    <form action={switchHousehold} className={`ios-card grid gap-3 p-4 ${className}`}>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-app-muted">Site</p>
        <p className="mt-1 text-sm text-app-muted">Switch between households you belong to.</p>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select className="ios-input" name="household_id" defaultValue={activeHouseholdId} aria-label="Active household">
          {memberships.map((membership) => (
            <option key={membership.household_id} value={membership.household_id}>
              {householdName(membership)} · {membership.role}
            </option>
          ))}
        </select>
        <button className="ios-secondary-button px-4" type="submit">
          Open
        </button>
      </div>
    </form>
  );
}
