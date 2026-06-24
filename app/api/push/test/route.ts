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

  let push;
  try {
    push = configureWebPush();
  } catch (pushError) {
    return NextResponse.json(
      { error: pushError instanceof Error ? pushError.message : "Push is not configured." },
      { status: 400 }
    );
  }
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
  const sent = results.filter((result) => result.status === "fulfilled").length;
  const failures = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));

  if (sent === 0) {
    return NextResponse.json({
      error: failures[0] ?? "Push provider rejected the test notification.",
      failures
    }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    failures,
    sent
  });
}
