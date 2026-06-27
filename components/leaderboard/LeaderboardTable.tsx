"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { RankBadge, LevelBadge } from "./RankBadge";
import { shortenAddress, formatUSD } from "@/lib/utils";
import { formatXP } from "@/lib/points";
import type { LeaderboardEntry } from "@/types/reward";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentWallet?: string;
  isLoading?: boolean;
}

export function LeaderboardTable({ data, currentWallet, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <div className="shimmer w-8 h-8 rounded" />
            <div className="shimmer w-40 h-4 rounded flex-1" />
            <div className="shimmer w-20 h-4 rounded" />
            <div className="shimmer w-20 h-4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry, i) => {
        const isCurrentUser =
          entry.wallet_address.toLowerCase() ===
          currentWallet?.toLowerCase();

        return (
          <motion.div
            key={entry.wallet_address}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "glass-card p-4 flex items-center gap-4 transition-all",
              isCurrentUser && "border-base-blue/40 bg-base-blue/5"
            )}
          >
            {/* Rank */}
            <div className="w-8 flex items-center justify-center flex-shrink-0">
              <RankBadge rank={entry.rank} />
            </div>

            {/* Wallet */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold font-mono text-sm text-text-primary truncate">
                  {entry.ens_name || shortenAddress(entry.wallet_address)}
                </span>
                {isCurrentUser && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-base-blue/20 text-base-blue font-medium">
                    You
                  </span>
                )}
                <a
                  href={`https://basescan.org/address/${entry.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <LevelBadge level={entry.level as import("@/types/reward").Level} />
            </div>

            {/* Volume */}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold font-mono">
                {formatUSD(entry.total_volume_usd, 0)}
              </div>
              <div className="text-xs text-text-muted">Volume</div>
            </div>

            {/* Swaps */}
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold font-mono">
                {entry.swap_count.toLocaleString()}
              </div>
              <div className="text-xs text-text-muted">Swaps</div>
            </div>

            {/* XP */}
            <div className="text-right">
              <div className="text-sm font-bold gradient-text font-mono">
                {formatXP(entry.total_xp)}
              </div>
              <div className="text-xs text-text-muted">XP</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
