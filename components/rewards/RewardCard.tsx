"use client";

import { motion } from "framer-motion";
import { LEVEL_COLORS, type Level } from "@/types/reward";
import { getLevelEmoji } from "@/lib/points";
import { cn } from "@/lib/utils";
import { Sparkles, Lock } from "lucide-react";

interface RewardCardProps {
  level: Level;
  unlocked: boolean;
  minted: boolean;
  onMint: () => void;
  isLoading?: boolean;
}

export function RewardCard({ level, unlocked, minted, onMint, isLoading }: RewardCardProps) {
  const color = LEVEL_COLORS[level];
  const emoji = getLevelEmoji(level);

  return (
    <motion.div
      whileHover={unlocked && !minted ? { scale: 1.02 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all",
        unlocked && !minted
          ? "border-opacity-50 cursor-pointer"
          : minted
          ? "border-opacity-30"
          : "border-border opacity-60"
      )}
      style={{
        borderColor: unlocked ? `${color}50` : undefined,
        background: unlocked
          ? `linear-gradient(135deg, ${color}08 0%, transparent 60%)`
          : undefined,
        boxShadow: unlocked && !minted ? `0 0 20px ${color}15` : undefined,
      }}
    >
      {/* NFT Preview */}
      <div
        className="relative w-full aspect-square rounded-xl mb-3 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #0A0B0D 0%, ${color}20 100%)`,
          border: `1px solid ${color}30`,
        }}
      >
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${color}20 0%, transparent 60%)`,
          }}
        />
        <div className="relative z-10 text-center">
          <div className="text-5xl mb-2">{emoji}</div>
          <div
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color }}
          >
            {level}
          </div>
        </div>

        {/* Animated border */}
        {unlocked && !minted && (
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(45deg, transparent 40%, ${color}30 50%, transparent 60%)`,
              animation: "shimmer 2s infinite linear",
              backgroundSize: "200% 100%",
            }}
          />
        )}

        {/* Lock overlay */}
        {!unlocked && (
          <div className="absolute inset-0 bg-bg-primary/60 rounded-xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-text-muted" />
          </div>
        )}

        {/* Minted badge */}
        {minted && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 border border-success/30">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs font-semibold text-success">Minted</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-bold text-sm text-text-primary">
          {level} Swapper NFT
        </h3>
        <p className="text-xs text-text-muted">
          {unlocked ? "On-chain NFT • Dynamic SVG" : "Keep swapping to unlock"}
        </p>
      </div>

      {/* Mint button */}
      {unlocked && !minted && (
        <button
          onClick={onMint}
          disabled={isLoading}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoading ? "Minting..." : "Mint NFT"}
          <span className="text-white/60 ml-1">~$0.05</span>
        </button>
      )}

      {minted && (
        <div className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-success border border-success/20 bg-success/5">
          <Sparkles className="w-3.5 h-3.5" />
          Minted ✓
        </div>
      )}
    </motion.div>
  );
}
