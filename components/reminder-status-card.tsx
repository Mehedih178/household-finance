"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ReminderStatusCard({
  frequency
}: {
  frequency: "instant" | "daily" | "weekly";
}) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (!available) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => undefined)
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(Boolean(subscription)))
      .catch(() => setSubscribed(false));
  }, []);

  const scheduleLabel = frequency === "weekly" ? "Weekly on Sunday at 9:00 AM" : "Daily at 9:00 AM";

  return (
    <section className="ios-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-app-muted">Reminders</p>
          <p className="mt-2 text-lg font-bold tracking-tight text-app-text">
            {!supported ? "This device cannot receive web push." : subscribed ? "Daily finance reminders are on." : "Turn on daily reminders."}
          </p>
          <p className="mt-1 text-sm text-app-muted">
            {!supported
              ? "Use the installed iPhone Home Screen app to enable reminders."
              : subscribed
                ? scheduleLabel
                : "Enable push once so the app can remind you to check in."}
          </p>
        </div>
        <Link href="/settings#reminders" className="ios-secondary-button min-h-11 px-4 text-sm">
          {subscribed ? "Manage" : "Turn on"}
        </Link>
      </div>
    </section>
  );
}
