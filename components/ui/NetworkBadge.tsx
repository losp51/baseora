"use client";

import { cn } from "@/lib/utils";

interface NetworkBadgeProps {
  className?: string;
}

// Non-interactive status indicator — shows current network
export function NetworkBadge({ className }: NetworkBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-base-blue/30 bg-base-blue/10",
        className
      )}
      title="Connected to Base Mainnet"
    >
      <div className="w-2 h-2 rounded-full bg-base-blue" />
      <span className="text-xs font-semibold text-base-blue">Base</span>
    </div>
  );
}
