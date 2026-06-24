"use client";

import { useEffect, useState } from "react";

export function InstallPromptCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean(navigator.standalone));
    if (standalone || localStorage.getItem("install_prompt_dismissed") === "1") return;

    const visits = Number(localStorage.getItem("install_prompt_visits") ?? "0") + 1;
    localStorage.setItem("install_prompt_visits", String(visits));
    setVisible(visits >= 3);
  }, []);

  if (!visible) return null;

  return (
    <section className="ios-card mt-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-app-text">Add Household Finance to your Home Screen</p>
          <p className="mt-1 text-sm leading-6 text-app-muted">Open faster, get app-like navigation, and enable iPhone push notifications.</p>
        </div>
        <button
          className="text-sm font-semibold text-app-muted"
          type="button"
          onClick={() => {
            localStorage.setItem("install_prompt_dismissed", "1");
            setVisible(false);
          }}
        >
          Hide
        </button>
      </div>
      <p className="mt-3 rounded-2xl bg-app-bg p-3 text-sm text-app-muted">On iPhone: tap Share, then Add to Home Screen.</p>
    </section>
  );
}
