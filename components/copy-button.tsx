"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy"
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={copyValue}
      className="ios-secondary-button min-h-10 rounded-xl px-3 text-sm"
    >
      <Icon size={16} className="mr-2" />
      {copied ? "Copied" : label}
    </button>
  );
}
