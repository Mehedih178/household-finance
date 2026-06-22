"use client";

import { Check, Share } from "lucide-react";
import { useState } from "react";

export function ShareInviteButton({
  url,
  email
}: {
  url: string;
  email: string;
}) {
  const [shared, setShared] = useState(false);

  async function shareInvite() {
    const text = `Join our household finance tracker: ${url}`;

    if (navigator.share) {
      await navigator.share({
        title: "Household Finance invite",
        text,
        url
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setShared(true);
    window.setTimeout(() => setShared(false), 1800);
  }

  const Icon = shared ? Check : Share;

  return (
    <button
      type="button"
      onClick={shareInvite}
      className="ios-button min-h-10 rounded-xl px-3 text-sm"
      aria-label={`Share invite for ${email}`}
    >
      <Icon size={16} className="mr-2" />
      {shared ? "Copied" : "Share"}
    </button>
  );
}
