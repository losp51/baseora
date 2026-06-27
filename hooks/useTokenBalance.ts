"use client";

import { useBalance, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { BASE_NATIVE_TOKEN_ADDRESS } from "@/lib/tokens";

interface UseTokenBalanceResult {
  balance: string;
  balanceRaw: bigint;
  formatted: string;
  isLoading: boolean;
}

export function useTokenBalance(
  tokenAddress?: string,
  walletAddress?: `0x${string}`
): UseTokenBalanceResult {
  const isNative =
    !tokenAddress ||
    tokenAddress.toLowerCase() ===
      BASE_NATIVE_TOKEN_ADDRESS.toLowerCase();

  const { data: nativeBalance, isLoading: nativeLoading } = useBalance({
    address: walletAddress,
    query: { enabled: !!walletAddress && isNative },
  });

  const { data: tokenBalance, isLoading: tokenLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!walletAddress && !isNative && !!tokenAddress },
  });

  if (isNative) {
    const raw = nativeBalance?.value ?? BigInt(0);
    const formatted = nativeBalance
      ? Number(formatUnits(raw, 18)).toFixed(6)
      : "0";
    return {
      balance: formatted,
      balanceRaw: raw,
      formatted,
      isLoading: nativeLoading,
    };
  }

  const raw = (tokenBalance as bigint) ?? BigInt(0);
  const formatted = raw
    ? Number(formatUnits(raw, 18)).toFixed(6)
    : "0";

  return {
    balance: formatted,
    balanceRaw: raw,
    formatted,
    isLoading: tokenLoading,
  };
}
