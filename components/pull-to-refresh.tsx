"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const triggerDistance = 82;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startY = useRef(0);
  const pulling = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = event.touches[0].clientY;
    pulling.current = true;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!pulling.current || window.scrollY > 0) return;

    const pullDistance = event.touches[0].clientY - startY.current;
    if (pullDistance <= 0) {
      setDistance(0);
      return;
    }

    setDistance(Math.min(Math.round(pullDistance * 0.55), 104));
  }

  function handleTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;

    if (distance >= triggerDistance) {
      setRefreshing(true);
      setDistance(triggerDistance);
      router.refresh();
      window.setTimeout(() => {
        setRefreshing(false);
        setDistance(0);
      }, 800);
      return;
    }

    setDistance(0);
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 flex justify-center transition-opacity"
        style={{ opacity: distance > 8 || refreshing ? 1 : 0 }}
        aria-hidden={!refreshing}
      >
        <div
          className="mt-3 flex h-10 items-center gap-2 rounded-full border border-app-line/70 bg-app-card/95 px-4 text-sm font-semibold text-app-text shadow-ios backdrop-blur-xl transition-transform"
          style={{ transform: `translateY(${Math.max(0, distance - 48)}px)` }}
        >
          <span className={refreshing ? "animate-spin" : ""}>↻</span>
          <span>{refreshing ? "Refreshing" : distance >= triggerDistance ? "Release to refresh" : "Pull to refresh"}</span>
        </div>
      </div>
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: distance > 0 && !refreshing ? `translateY(${Math.min(distance, 42)}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
