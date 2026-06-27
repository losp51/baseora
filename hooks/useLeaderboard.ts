"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/types/reward";
import { useAccount } from "wagmi";

interface UseLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  isLoading: boolean;
}

export function useLeaderboard(): UseLeaderboardResult {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ period: "all", sortBy: "xp" });
        if (address) params.set("wallet", address);
        const res = await fetch(`/api/leaderboard?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard ?? []);
          setUserEntry(data.userEntry ?? null);
        }
      } catch {
        /* silently fail */
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

  return { leaderboard, userEntry, isLoading };
}
