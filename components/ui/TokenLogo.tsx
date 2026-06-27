"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  symbol?: string;
  logoURI?: string;
  size?: number;
  className?: string;
}

export function TokenLogo({ symbol, logoURI, size = 32, className }: TokenLogoProps) {
  const [imgError, setImgError] = useState(false);

  const initials = symbol?.slice(0, 2).toUpperCase() || "??";

  const colorMap: Record<string, string> = {
    ETH: "from-[#627EEA] to-[#4966D9]",
    USDC: "from-[#2775CA] to-[#1A5FA3]",
    USDT: "from-[#26A17B] to-[#1A8063]",
    WETH: "from-[#627EEA] to-[#4966D9]",
    BRETT: "from-[#4F46E5] to-[#3730A3]",
    DEGEN: "from-[#A855F7] to-[#7C3AED]",
    AERO: "from-[#0052FF] to-[#0039CC]",
    DEFAULT: "from-bg-tertiary to-bg-secondary",
  };

  const gradient = colorMap[symbol?.toUpperCase() || ""] || colorMap.DEFAULT;

  if (logoURI && !imgError) {
    return (
      <img
        src={logoURI}
        alt={symbol || "token"}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        `bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center flex-shrink-0`,
        className
      )}
      style={{ width: size, height: size }}
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
