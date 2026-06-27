import type { SwapQuote, SwapParams } from "@/types/swap";

const BASE_0X_URL = "https://api.0x.org";

export async function getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  const searchParams = new URLSearchParams({
    chainId: "8453",
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    slippageBps: (params.slippageBps ?? 50).toString(),
  });

  if (params.takerAddress) {
    searchParams.set("taker", params.takerAddress);
  }

  const res = await fetch(
    `/api/quote?${searchParams.toString()}`
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ reason: "Unknown error" }));
    throw new Error(error.reason || `Quote failed: ${res.status}`);
  }

  return res.json();
}

export async function getSwapPrice(
  params: Omit<SwapParams, "takerAddress">
): Promise<SwapQuote> {
  const searchParams = new URLSearchParams({
    chainId: "8453",
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    slippageBps: (params.slippageBps ?? 50).toString(),
  });

  const res = await fetch(`/api/price?${searchParams.toString()}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ reason: "Unknown error" }));
    throw new Error(error.reason || `Price failed: ${res.status}`);
  }

  return res.json();
}

export function calculatePriceImpact(
  sellAmountUSD: number,
  buyAmountUSD: number
): number {
  if (!sellAmountUSD || !buyAmountUSD) return 0;
  return ((sellAmountUSD - buyAmountUSD) / sellAmountUSD) * 100;
}

export function formatGasEstimate(gas: string, gasPrice: string): string {
  const gasCostWei = BigInt(gas) * BigInt(gasPrice);
  const gasCostETH = Number(gasCostWei) / 1e18;
  return gasCostETH.toFixed(6);
}

export function getBestRouteDisplay(sources: { name: string; proportion: string }[]): string[] {
  return sources
    .filter((s) => parseFloat(s.proportion) > 0)
    .sort((a, b) => parseFloat(b.proportion) - parseFloat(a.proportion))
    .map((s) => s.name);
}
