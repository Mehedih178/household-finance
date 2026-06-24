import { NextResponse } from "next/server";
import { requireHousehold } from "@/lib/data";

type SubscriptionBody = {
  subscription?: {
    endpoint?: string;
    keys?: {
      auth?: string;
      p256dh?: string;
    };
  };
  userAgent?: string;
};

export async function POST(request: Request) {
  const { supabase, householdId, user } = await requireHousehold();
  const body = (await request.json()) as SubscriptionBody;
  const subscription = body.subscription;

  if (!subscription?.endpoint || !subscription.keys?.auth || !subscription.keys.p256dh) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      household_id: householdId,
      user_id: user.id,
      endpoint: subscription.endpoint,
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
      user_agent: body.userAgent ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, householdId, user } = await requireHousehold();
  const body = (await request.json()) as { all?: boolean; endpoint?: string };

  if (!body.endpoint && !body.all) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  let query = supabase
    .from("push_subscriptions")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", user.id);

  if (!body.all && body.endpoint) {
    query = query.eq("endpoint", body.endpoint);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
