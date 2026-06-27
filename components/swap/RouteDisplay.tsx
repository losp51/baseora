"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DexQuote } from "@/hooks/useSwapQuote";

/* ── Per-DEX brand config ── */
const DEX_CONFIG: Record<string, { color: string; bg: string; border: string; logo: string }> = {
  Uniswap_V3:     { color: "#FF007A", bg: "rgba(255,0,122,0.08)",   border: "rgba(255,0,122,0.25)",  logo: "🦄" },
  Aerodrome:      { color: "#0052FF", bg: "rgba(0,82,255,0.08)",    border: "rgba(0,82,255,0.25)",   logo: "✈️" },
  SushiSwap:      { color: "#FA52A0", bg: "rgba(250,82,160,0.08)",  border: "rgba(250,82,160,0.25)", logo: "🍣" },
  PancakeSwap_V3: { color: "#1FC7D4", bg: "rgba(31,199,212,0.08)",  border: "rgba(31,199,212,0.25)", logo: "🥞" },
  BaseSwap:       { color: "#3374FF", bg: "rgba(51,116,255,0.08)",  border: "rgba(51,116,255,0.25)", logo: "🔵" },
  Curve:          { color: "#FFD700", bg: "rgba(255,215,0,0.08)",   border: "rgba(255,215,0,0.25)",  logo: "〽️" },
  Balancer:       { color: "#1E1E1E", bg: "rgba(100,200,255,0.08)", border: "rgba(100,200,255,0.25)",logo: "⚖️" },
};

function getDexConfig(dex: string) {
  return DEX_CONFIG[dex] ?? {
    color: "#8B8FA8",
    bg:    "rgba(139,143,168,0.08)",
    border:"rgba(139,143,168,0.25)",
    logo:  "🔄",
  };
}

interface RouteDisplayProps {
  dexQuotes: DexQuote[];
  selectedDex: string | null;
  onSelect: (dex: string | null) => void;
  buySymbol: string;
  isLoading?: boolean;
}

export function RouteDisplay({
  dexQuotes,
  selectedDex,
  onSelect,
  buySymbol,
  isLoading,
}: RouteDisplayProps) {
  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-secondary/50 p-3 space-y-2">
        <div className="shimmer h-3 w-24 rounded mb-3" />
        {[1, 2, 3].map(i => (
          <div key={i} className="shimmer h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!dexQuotes || dexQuotes.length === 0) return null;

  const bestDex   = dexQuotes[0]; // sorted best first
  const isDefault = selectedDex === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-bg-secondary/50 p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          DEX Prices
        </span>
        {selectedDex && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-base-blue hover:underline"
          >
            Use best route
          </button>
        )}
      </div>

      {/* DEX list */}
      <div className="space-y-1.5">
        {dexQuotes.map(dq => {
          const cfg       = getDexConfig(dq.dex);
          const isSelected = selectedDex === dq.dex || (isDefault && dq.isBest);
          const isBest    = dq.isBest;

          return (
            <button
              key={dq.dex}
              onClick={() => onSelect(selectedDex === dq.dex ? null : dq.dex)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                isSelected
                  ? "border-opacity-60 shadow-sm"
                  : "border-transparent hover:border-opacity-30"
              )}
              style={{
                background:   isSelected ? cfg.bg    : "transparent",
                borderColor:  isSelected ? cfg.border : "var(--border)",
              }}
            >
              {/* Logo */}
              <span className="text-base flex-shrink-0 w-6 text-center">{cfg.logo}</span>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? cfg.color : "var(--text-primary)" }}
                  >
                    {dq.label}
                  </span>
                  {isBest && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
                                     text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}>
                      <Star className="w-2.5 h-2.5" />
                      Best
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-muted">
                  {(dq.proportion * 100).toFixed(0)}% liquidity share
                </div>
              </div>

              {/* Buy amount */}
              <div className="text-right flex-shrink-0">
                <div
                  className="text-sm font-bold font-mono"
                  style={{ color: isBest ? cfg.color : "var(--text-primary)" }}
                >
                  {dq.buyAmount}
                </div>
                <div className="text-xs text-text-muted">{buySymbol}</div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <CheckCircle2
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: cfg.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-text-muted mt-2 text-center">
        {isDefault
          ? "Using aggregated best route"
          : `Using ${dexQuotes.find(d => d.dex === selectedDex)?.label ?? ""} only`}
      </p>
    </motion.div>
  );
}
