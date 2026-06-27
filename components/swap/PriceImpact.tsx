"use client";

import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceImpactProps {
  impact: number;
  className?: string;
}

export function PriceImpact({ impact, className }: PriceImpactProps) {
  if (!impact || impact <= 0) return null;

  const isWarning = impact > 2;
  const isDanger = impact > 5;
  const isBlocked = impact > 10;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
        isBlocked
          ? "bg-error/10 border border-error/30"
          : isDanger
          ? "bg-error/10 border border-error/20"
          : isWarning
          ? "bg-warning/10 border border-warning/20"
          : "bg-bg-secondary border border-border",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {isWarning ? (
          <AlertTriangle
            className={cn(
              "w-3.5 h-3.5",
              isDanger ? "text-error" : "text-warning"
            )}
          />
        ) : (
          <Info className="w-3.5 h-3.5 text-text-muted" />
        )}
        <span
          className={cn(
            "font-medium",
            isDanger
              ? "text-error"
              : isWarning
              ? "text-warning"
              : "text-text-secondary"
          )}
        >
          Price Impact
        </span>
      </div>
      <span
        className={cn(
          "font-semibold font-mono",
          isDanger
            ? "text-error"
            : isWarning
            ? "text-warning"
            : "text-text-primary"
        )}
      >
        -{impact.toFixed(2)}%
      </span>
    </div>
  );
}
