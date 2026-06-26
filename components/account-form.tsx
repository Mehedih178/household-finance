"use client";

import { useMemo, useState } from "react";
import { createAccount } from "@/app/actions";
import { Field, ToggleRow } from "@/components/form-fields";

const typeOptions = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit card" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
  { value: "crypto", label: "Crypto" },
  { value: "loan", label: "Loan" }
] as const;

const liabilityTypes = new Set(["credit", "loan"]);

export function AccountForm() {
  const [type, setType] = useState<(typeof typeOptions)[number]["value"]>("checking");
  const isLiability = liabilityTypes.has(type);

  const copy = useMemo(() => {
    if (type === "credit") {
      return {
        label: "Current amount owed",
        hint: "Enter the card balance you currently owe. Use a positive number."
      };
    }

    if (type === "loan") {
      return {
        label: "Current amount owed",
        hint: "Enter the remaining loan balance. Use a positive number."
      };
    }

    return {
      label: "Current balance",
      hint: "Enter the amount currently in this account."
    };
  }, [type]);

  return (
    <form action={createAccount} className="ios-card mt-5 grid gap-4 p-4">
      <Field label="Account name">
        <input className="ios-input" name="name" placeholder="Joint Checking" required />
      </Field>
      <Field label="Type">
        <select className="ios-input" name="type" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </Field>
      <Field label={copy.label}>
        <div className="grid gap-2">
          <input className="ios-input" name="balance" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" />
          <p className="px-1 text-xs text-app-muted">{copy.hint}</p>
        </div>
      </Field>
      {isLiability ? (
        <div className="rounded-2xl bg-app-bg p-3 text-sm text-app-muted">
          Credit cards and loans count as debt. They reduce net worth instead of increasing available cash.
        </div>
      ) : null}
      <ToggleRow name="is_shared" label="Shared account" description="Visible in household totals." />
      <button className="ios-button" type="submit">Add account</button>
    </form>
  );
}
