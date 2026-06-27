"use client";

import { useAccount } from "wagmi";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useUserPoints } from "@/hooks/useUserPoints";
import { LevelBadge } from "@/components/leaderboard/RankBadge";
import { formatXP, formatVolume } from "@/lib/points";
import { shortenAddress, formatUSD } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "month", label: "This Month" },
  { value: "week", label: "This Week" },
  { value: "today", label: "Today" },
];

const SORT_OPTIONS = [
  { value: "xp", label: "XP" },
  { value: "volume", label: "Volume" },
  { value: "swaps", label: "Swaps" },
];

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { leaderboard, userEntry, isLoading, period, sortBy, setPeriod, setSortBy } =
    useLeaderboard();
  const { data: userPoints } = useUserPoints();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Background */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,82,255,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-base-blue/30 bg-base-blue/10 mb-4">
          <Trophy className="w-4 h-4 text-base-blue" />
          <span className="text-sm font-medium text-base-blue">Global Rankings</span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Leaderboard
        </h1>
        <p className="text-text-secondary text-sm">
          Top traders by XP, volume and swap count on Base
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1.5 p-1 rounded-xl border border-border bg-bg-secondary">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                period === p.value
                  ? "bg-base-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl border border-border bg-bg-secondary ml-auto">
          <span className="px-2 py-1.5 text-xs text-text-muted self-center">Sort:</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                sortBy === s.value
                  ? "bg-base-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <LeaderboardTable
        data={leaderboard}
        currentWallet={address}
        isLoading={isLoading}
      />

      {/* Your position (sticky) */}
      {address && userEntry && (
        <div className="sticky bottom-4 mt-4">
          <div className="glass-card border-base-blue/30 p-4 flex items-center gap-4 backdrop-blur-xl">
            <div className="w-8 flex items-center justify-center">
              <span className="text-sm font-bold text-base-blue font-mono">
                #{userEntry.rank}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-semibold font-mono text-sm">
                {shortenAddress(address)} <span className="text-base-blue text-xs">(You)</span>
              </div>
              <LevelBadge level={userEntry.level as import("@/types/reward").Level} />
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold font-mono">
                {formatUSD(userEntry.total_volume_usd, 0)}
              </div>
              <div className="text-xs text-text-muted">Volume</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold gradient-text font-mono">
                {formatXP(userEntry.total_xp)}
              </div>
              <div className="text-xs text-text-muted">XP</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
