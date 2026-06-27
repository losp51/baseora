"use client";

import { motion } from "framer-motion";
import { LEVEL_COLORS, type Level } from "@/types/reward";
import { getLevelEmoji, formatXP } from "@/lib/points";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  level: Level;
  xp: number;
  progress: number;
  xpToNext: number;
  className?: string;
}

export function ProgressBar({ level, xp, progress, xpToNext, className }: ProgressBarProps) {
  const color = LEVEL_COLORS[level];
  const emoji = getLevelEmoji(level);

  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <span
              className="font-bold text-lg"
              style={{ color }}
            >
              {level.toUpperCase()}
            </span>
            <p className="text-xs text-text-muted">Current Level</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-lg font-mono gradient-text">
            {formatXP(xp)} XP
          </span>
          {xpToNext > 0 && (
            <p className="text-xs text-text-muted">
              {formatXP(xpToNext)} to next
            </p>
          )}
        </div>
      </div>

      <div className="relative h-3 bg-bg-tertiary rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>

      {xpToNext > 0 && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-text-muted">{progress}%</span>
          <span className="text-xs text-text-muted">
            Next: {level === "Elite" ? "MAX" : getNextLevelName(level)}
          </span>
        </div>
      )}
    </div>
  );
}

function getNextLevelName(level: Level): string {
  const levels: Level[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite"];
  const idx = levels.indexOf(level);
  return idx < levels.length - 1 ? levels[idx + 1] : "MAX";
}
