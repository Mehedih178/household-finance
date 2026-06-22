"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function BackButton({
  href,
  label = "Back"
}: {
  href?: string;
  label?: string;
}) {
  const router = useRouter();

  if (href) {
    return (
      <Link
        href={href}
        className="-ml-2 inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-sm font-semibold text-app-tint"
      >
        <ChevronLeft size={20} />
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="-ml-2 inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-sm font-semibold text-app-tint"
    >
      <ChevronLeft size={20} />
      {label}
    </button>
  );
}
