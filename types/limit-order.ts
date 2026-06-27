import type { Token } from "./token";

export type LimitOrderStatus =
  | "pending"    // waiting for price
  | "filled"     // executed successfully
  | "cancelled"  // user cancelled
  | "expired";   // deadline passed

export interface LimitOrder {
  id: string;
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;       // human-readable
  targetPrice: string;      // target price: 1 sellToken = X buyToken
  currentPrice: string;     // current market price
  slippageBps: number;
  status: LimitOrderStatus;
  createdAt: number;        // unix ms
  expiresAt: number;        // unix ms
  txHash?: string;
}

export interface MultiSwapPair {
  id: string;
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  quote?: {
    buyAmount: string;
    exchangeRate: number;
    sellUSD: number;
    buyUSD: number;
    routes: string[];
  };
  status: "idle" | "loading" | "ready" | "swapping" | "done" | "error";
  error?: string;
  txHash?: string;
}
