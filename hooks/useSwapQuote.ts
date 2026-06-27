"use client";

import { useState, useEffect, useCallback } from "react";
import type { SwapQuote } from "@/types/swap";
import { getBestRouteDisplay } from "@/lib/0x";

interface UseSwapQuoteParams {
  sellToken?: string;
  buyToken?: string;
  sellAmount?: string;
  takerAddress?: string;
  slippageBps?: number;
  enabled?: boolean;
}

interface UseSwapQuoteResult {
  quote: SwapQuote | null;
  isLoading: boolean;
  error: string | null;
  routes: string[];
  refetch: () => void;
}

export function useSwapQuote({
  sellToken,
  buyToken,
  sellAmount,
  takerAddress,
  slippageBps = 50,
  enabled = true,
}: UseSwapQuoteParams): UseSwapQuoteResult {
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!sellToken || !buyToken || !sellAmount || !enabled) return;

    const amount = BigInt(sellAmount || "0");
    if (amount === BigInt(0)) {
      setQuote(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        slippageBps: slippageBps.toString(),
        chainId: "8453",
      });

      if (takerAddress) params.set("taker", takerAddress);

      const endpoint = takerAddress ? "/api/quote" : "/api/price";
      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.reason || "Failed to fetch quote");
      }

      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [sellToken, buyToken, sellAmount, takerAddress, slippageBps, enabled]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const routes = quote?.sources ? getBestRouteDisplay(quote.sources) : [];

  return { quote, isLoading, error, routes, refetch: fetchQuote };
}
