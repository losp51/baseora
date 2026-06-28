"use client";

import { LEVEL_COLORS, type Level } from "@/types/reward";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  className?: string;
}

const RANK_EMOJIS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function RankBadge({ rank, className }: RankBadgeProps) {
  if (rank <= 3) {
    return (
      <span className={cn("text-base leading-none", className)}>
        {RANK_EMOJIS[rank]}
      </span>
    );
  }
  return (
    <span className={cn("text-sm font-bold text-text-muted font-mono", className)}>
      {rank}
    </span>
  );
}

interface LevelBadgeProps {
  level: Level;
  className?: string;
  showEmoji?: boolean;
}

export function LevelBadge({ level, className, showEmoji = false }: LevelBadgeProps) {
  const color = LEVEL_COLORS[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0",
        className
      )}
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}12`,
      }}
    >
      {showEmoji && <LevelEmoji level={level} />}
      {level}
    </span>
  );
}

function LevelEmoji({ level }: { level: Level }) {
  const emojis: Record<Level, string> = {
    Bronze: "🥉", Silver: "🥈", Gold: "🥇",
    Platinum: "💎", Diamond: "💠", Elite: "👑",
  };
  return <span>{emojis[level]}</span>;
}
