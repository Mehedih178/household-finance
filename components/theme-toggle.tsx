"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const Icon = dark ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-app-line bg-app-card px-4 font-semibold text-app-text"
      aria-label="Toggle color theme"
    >
      <span>{dark ? "Dark mode" : "Light mode"}</span>
      <Icon size={20} className="text-app-tint" />
    </button>
  );
}
