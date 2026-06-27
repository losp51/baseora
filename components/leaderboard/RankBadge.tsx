"use client";

import { LEVEL_COLORS, type Level } from "@/types/reward";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  className?: string;
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  if (rank === 1) return <span className={cn("text-xl", className)}>🥇</span>;
  if (rank === 2) return <span className={cn("text-xl", className)}>🥈</span>;
  if (rank === 3) return <span className={cn("text-xl", className)}>🥉</span>;
  return (
    <span className={cn("text-sm font-bold text-text-muted font-mono", className)}>
      #{rank}
    </span>
  );
}

interface LevelBadgeProps {
  level: Level;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const color = LEVEL_COLORS[level];
  const emojis: Record<Level, string> = {
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
    Platinum: "💎",
    Diamond: "💠",
    Elite: "👑",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
        className
      )}
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}10`,
      }}
    >
      {emojis[level]} {level}
    </span>
  );
}
