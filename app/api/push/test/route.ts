import { NextResponse } from "next/server";
import { requireHousehold } from "@/lib/data";
import { configureWebPush, toWebPushSubscription } from "@/lib/push";

export async function POST() {
  const { supabase, householdId, user } = await requireHousehold();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("household_id", householdId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ error: "No push subscription found for this device." }, { status: 404 });
  }

  const push = configureWebPush();
  const payload = JSON.stringify({
    title: "Household Finance",
    body: "Push notifications are working on this device.",
    tag: "push-test",
    url: "/notifications"
  });

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      push.sendNotification(toWebPushSubscription(subscription), payload)
    )
  );

  return NextResponse.json({
    ok: true,
    sent: results.filter((result) => result.status === "fulfilled").length
  });
}
