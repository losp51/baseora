"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/types/reward";
import { useAccount } from "wagmi";

interface UseLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  isLoading: boolean;
  period: string;
  sortBy: string;
  setPeriod: (p: string) => void;
  setSortBy: (s: string) => void;
}

export function useLeaderboard(): UseLeaderboardResult {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [sortBy, setSortBy] = useState("xp");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ period, sortBy });
        if (address) params.set("wallet", address);
        const res = await fetch(`/api/leaderboard?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard);
          setUserEntry(data.userEntry);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, period, sortBy]);

  return { leaderboard, userEntry, isLoading, period, sortBy, setPeriod, setSortBy };
}
