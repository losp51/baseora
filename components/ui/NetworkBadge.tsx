"use client";

import { cn } from "@/lib/utils";

interface NetworkBadgeProps {
  className?: string;
}

export function NetworkBadge({ className }: NetworkBadgeProps) {
  return (
    <a
      href="https://basescan.org"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-base-blue/30 bg-base-blue/10 hover:bg-base-blue/20 transition-all cursor-pointer",
        className
      )}
    >
      <div className="w-2 h-2 rounded-full bg-base-blue animate-pulse" />
      <span className="text-xs font-semibold text-base-blue">Base</span>
    </a>
  );
}
