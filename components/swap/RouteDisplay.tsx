"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RouteDisplayProps {
  routes: string[];
  savingsUSD?: number;
  isLoading?: boolean;
}

const DEX_COLORS: Record<string, string> = {
  "Uniswap_V3": "bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/30",
  "Aerodrome": "bg-base-blue/10 text-base-blue border-base-blue/30",
  "SushiSwap": "bg-[#0E0F23]/60 text-[#FA52A0] border-[#FA52A0]/30",
  "PancakeSwap_V3": "bg-[#1FC7D4]/10 text-[#1FC7D4] border-[#1FC7D4]/30",
  "BaseSwap": "bg-[#3374FF]/10 text-[#3374FF] border-[#3374FF]/30",
  default: "bg-bg-tertiary text-text-secondary border-border",
};

export function RouteDisplay({ routes, savingsUSD, isLoading }: RouteDisplayProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-secondary/50 p-3">
        <div className="flex items-center gap-2">
          <div className="shimmer h-4 w-4 rounded" />
          <div className="shimmer h-4 w-32 rounded" />
          <div className="shimmer h-4 w-20 rounded ml-auto" />
        </div>
      </div>
    );
  }

  if (!routes || routes.length === 0) return null;

  const displayed = routes.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-bg-secondary/50 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
          Best Route
        </span>
        {savingsUSD && savingsUSD > 0 && (
          <div className="flex items-center gap-1 text-xs text-success font-medium">
            <TrendingUp className="w-3 h-3" />
            Save ${savingsUSD.toFixed(2)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {displayed.map((route, i) => {
          const colorClass = DEX_COLORS[route] || DEX_COLORS.default;
          return (
            <div key={`${route}-${i}`} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold border",
                  colorClass
                )}
              >
                {route.replace("_V3", " V3").replace("_V2", " V2")}
              </span>
              {i < displayed.length - 1 && (
                <ArrowRight className="w-3 h-3 text-text-muted flex-shrink-0" />
              )}
            </div>
          );
        })}
        {routes.length > 4 && (
          <span className="text-xs text-text-muted">+{routes.length - 4} more</span>
        )}
      </div>
    </motion.div>
  );
}
