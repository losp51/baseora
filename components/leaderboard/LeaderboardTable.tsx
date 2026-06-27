"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";
import { RankBadge, LevelBadge } from "./RankBadge";
import { shortenAddress } from "@/lib/utils";
import { formatXP } from "@/lib/points";
import type { LeaderboardEntry } from "@/types/reward";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentWallet?: string;
  isLoading?: boolean;
}

export function LeaderboardTable({ data, currentWallet, isLoading }: LeaderboardTableProps) {
  const [page, setPage] = useState(1);

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card px-3 py-2 flex items-center gap-3">
            <div className="shimmer w-5 h-3 rounded flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <div className="shimmer h-3 w-28 rounded" />
              <div className="shimmer h-4 w-14 rounded-full" />
            </div>
            <div className="shimmer w-10 h-3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty state ── */
  if (data.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-text-muted text-sm">No data yet — be the first to swap!</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const visible    = data.slice(0, page * PAGE_SIZE);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-3 px-3 pb-2 text-xs text-text-muted font-medium uppercase tracking-wide">
        <span className="w-6 flex-shrink-0 text-center">#</span>
        <span className="flex-1">Trader</span>
        <span className="flex-shrink-0">XP</span>
      </div>

      <div className="space-y-0.5">
        {visible.map((entry, i) => {
          const isMe = entry.wallet_address.toLowerCase() === currentWallet?.toLowerCase();
          return (
            <div
              key={entry.wallet_address}
              className={cn(
                "glass-card px-3 py-1.5 flex items-center gap-2.5 transition-all",
                isMe && "border-base-blue/40 bg-base-blue/5"
              )}
            >
              {/* Rank */}
              <div className="w-5 flex-shrink-0 flex items-center justify-center">
                <RankBadge rank={entry.rank} />
              </div>

              {/* Wallet + level */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="font-semibold font-mono text-sm text-text-primary truncate">
                  {entry.ens_name || shortenAddress(entry.wallet_address)}
                </span>
                {isMe && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-base-blue/20 text-base-blue font-medium flex-shrink-0">
                    You
                  </span>
                )}
                <LevelBadge level={entry.level as import("@/types/reward").Level} />
                <a
                  href={`https://basescan.org/address/${entry.wallet_address}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0 ml-auto p-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* XP */}
              <div className="text-right flex-shrink-0 min-w-[48px]">
                <span className="text-sm font-bold gradient-text font-mono">
                  {formatXP(entry.total_xp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {page < totalPages && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                     text-xs text-text-muted hover:text-text-primary border border-border
                     hover:border-border-hover transition-all"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show more ({data.length - page * PAGE_SIZE} remaining)
        </button>
      )}
    </div>
  );
}
