"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  symbol?: string;
  logoURI?: string;
  size?: number;
  className?: string;
}

// Static color map — safe from Tailwind JIT purge (inline styles)
const TOKEN_COLORS: Record<string, [string, string]> = {
  ETH:   ["#627EEA", "#4966D9"],
  WETH:  ["#627EEA", "#4966D9"],
  USDC:  ["#2775CA", "#1A5FA3"],
  USDT:  ["#26A17B", "#1A8063"],
  DAI:   ["#F5AC37", "#DC8E00"],
  BRETT: ["#4F46E5", "#3730A3"],
  DEGEN: ["#A855F7", "#7C3AED"],
  AERO:  ["#0052FF", "#0039CC"],
  cbETH: ["#0052FF", "#2775CA"],
};

export function TokenLogo({ symbol, logoURI, size = 32, className }: TokenLogoProps) {
  const [imgError, setImgError] = useState(false);

  const initials = symbol?.slice(0, 2).toUpperCase() || "??";
  const colors = TOKEN_COLORS[symbol?.toUpperCase() || ""] ?? ["#252830", "#1A1D24"];

  if (logoURI && !imgError) {
    return (
      <img
        src={logoURI}
        alt={symbol || "token"}
        width={size}
        height={size}
        className={cn("rounded-full object-cover flex-shrink-0", className)}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn("rounded-full flex items-center justify-center flex-shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
    >
      <span
        style={{ fontSize: size * 0.35 }}
        className="font-bold text-white select-none"
      >
        {initials}
      </span>
    </div>
  );
}
