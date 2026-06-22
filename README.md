# Household Finance

Mobile-first personal finance PWA for shared household budgeting. It uses Next.js, TypeScript, Tailwind CSS, Supabase Auth, Supabase Postgres, RLS policies, and a small service worker for installable app behavior.

## Features

- Email/password authentication with Supabase
- Household workspace creation and spouse invitations
- Shared and personal visibility controls for accounts, budgets, transactions, and recurring items
- Dashboard with household cash flow, recent activity, and budget progress
- Transaction create, view, edit, delete, filtering, and audit metadata
- CSV transaction import for free bank-export workflows
- Categories, monthly budgets, accounts, and basic spending reports
- Household feed with transactions, goal contributions, achievements, and notes
- Financial notes attached to transactions, accounts, goals, or the household
- Monthly finance meeting screen for reviewing income, expenses, savings, goals, and big purchases together
- Wealth dashboard with assets, liabilities, net worth snapshots, milestones, and a simple FIRE calculator
- Finance Inbox with smart notifications, unread dashboard badge, morning brief, budget pace warnings, goal milestones, recurring bill reminders, household activity, achievements, weekly summaries, and notification controls
- iPhone-focused PWA metadata, safe-area layout, bottom tab navigation, and light/dark mode

## Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The app also accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` for older Supabase projects, but `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the current recommended name.

4. In Supabase Auth settings, add these redirect URLs:

```bash
http://localhost:3000/callback
https://your-production-domain.com/callback
```

5. Install and run:

```bash
npm install
npm run dev
```

## PWA Notes

- The app is optimized for iPhone Safari and Add to Home Screen usage.
- `public/manifest.json` defines standalone display, portrait orientation, theme colors, and placeholder icons.
- `public/sw.js` caches the app shell and recent GET requests in production.
- For App Store-grade polish, replace the SVG placeholders with real PNG icons at 180, 192, and 512 pixels.

## CSV Import

Use **Activity → Import** to upload bank-exported CSV files. The importer recognizes common headers:

- `Date`
- `Description`, `Name`, `Merchant`, `Memo`, or `Payee`
- `Amount`, or separate `Debit` / `Credit`
- `Type`
- `Category`
- `Account`

Negative amounts import as expenses. Positive amounts import as income. If category or account names match existing app records, they are linked automatically.

## Supabase Model

The schema includes:

- `profiles`
- `households`
- `household_members`
- `accounts`
- `transactions`
- `categories`
- `budgets`
- `recurring_items`
- `invitations`
- `goals`
- `goal_contributions`
- `financial_notes`
- `net_worth_snapshots`
- `notification_preferences`

RLS policies limit household data to members. Personal records are visible only to the owner, while shared records are visible to all household members.

## Existing Project Migrations

If your Supabase project already existed before the feed and wealth features, run this additional SQL file in the Supabase SQL editor:

```bash
supabase/2026-06-22-feed-wealth-notes.sql
```

## Current MVP Scope

Recurring items are tracked and can generate due-soon alerts, but they do not automatically create transactions yet. The Finance Inbox is an in-app notification center; native push notifications can be added later.
