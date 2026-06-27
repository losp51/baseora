"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Zap, Loader2, CheckCircle2,
  ExternalLink, ArrowRight, FlaskConical, Layers
} from "lucide-react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { TokenSelector } from "./TokenSelector";
import { TokenLogo }     from "@/components/ui/TokenLogo";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { BASE_TOKENS, formatTokenAmount } from "@/lib/tokens";
import { formatUSD } from "@/lib/utils";
import { calculateSwapXP } from "@/lib/points";
import { useUserPoints } from "@/hooks/useUserPoints";
import type { Token } from "@/types/token";
import type { MultiSwapPair } from "@/types/limit-order";

let pairIdCounter = 0;
const newId = () => `pair-${++pairIdCounter}`;

function createPair(sell: Token, buy: Token): MultiSwapPair {
  return {
    id: newId(),
    sellToken: sell,
    buyToken:  buy,
    sellAmount: "",
    status: "idle",
  };
}

/* fetch quote for one pair */
async function fetchPairQuote(
  pair: MultiSwapPair,
  takerAddress?: string
): Promise<Partial<MultiSwapPair>> {
  if (!pair.sellAmount || parseFloat(pair.sellAmount) <= 0) {
    return { quote: undefined, status: "idle" };
  }

  try {
    const sellAmountRaw = parseUnits(pair.sellAmount, pair.sellToken.decimals).toString();
    const params = new URLSearchParams({
      sellToken:  pair.sellToken.address,
      buyToken:   pair.buyToken.address,
      sellAmount: sellAmountRaw,
      chainId:    "8453",
      slippageBps:"50",
    });
    if (takerAddress) params.set("taker", takerAddress);

    const endpoint = takerAddress ? "/api/quote" : "/api/price";
    const res  = await fetch(`${endpoint}?${params}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.reason || "Quote failed");

    const buyAmount    = formatTokenAmount(data.buyAmount, pair.buyToken.decimals);
    const sellRate     = parseFloat(data.sellTokenToEthRate || "0");
    const buyRate      = parseFloat(data.buyTokenToEthRate  || "0");
    const sellUSD      = sellRate > 0 ? parseFloat(pair.sellAmount) * sellRate : 0;
    const buyUSD       = buyRate  > 0 ? parseFloat(buyAmount) * buyRate : 0;
    const exchangeRate = parseFloat(pair.sellAmount) > 0
      ? parseFloat(buyAmount) / parseFloat(pair.sellAmount)
      : 0;

    const sources: { name: string; proportion: string }[] = data.sources || [];
    const routes = sources
      .filter(s => parseFloat(s.proportion) > 0)
      .sort((a, b) => parseFloat(b.proportion) - parseFloat(a.proportion))
      .slice(0, 3)
      .map(s => s.name.replace("_V3", " V3").replace("_V2", " V2"));

    return {
      quote: { buyAmount, exchangeRate, sellUSD, buyUSD, routes },
      status: "ready",
      error: undefined,
    };
  } catch (err) {
    return {
      quote: undefined,
      status: "error",
      error: err instanceof Error ? err.message : "Quote failed",
    };
  }
}

/* ── Pair Row ── */
function PairRow({
  pair,
  index,
  onChange,
  onRemove,
  canRemove,
  takerAddress,
}: {
  pair: MultiSwapPair;
  index: number;
  onChange: (id: string, updates: Partial<MultiSwapPair>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  takerAddress?: string;
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleAmountChange = (val: string) => {
    onChange(pair.id, { sellAmount: val, status: "loading" });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const updates = await fetchPairQuote({ ...pair, sellAmount: val }, takerAddress);
      onChange(pair.id, updates);
    }, 600);
  };

  const handleSellTokenChange = (token: Token) => {
    onChange(pair.id, { sellToken: token, quote: undefined, status: "idle" });
  };

  const handleBuyTokenChange = (token: Token) => {
    onChange(pair.id, { buyToken: token, quote: undefined, status: "idle" });
  };

  const isMock = pair.status === "ready"; // simplification

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="rounded-xl border border-border bg-bg-tertiary p-3"
    >
      {/* Row header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Swap #{index + 1}
        </span>
        <div className="flex items-center gap-2">
          {pair.status === "loading" && <Loader2 className="w-3.5 h-3.5 text-base-blue animate-spin" />}
          {pair.status === "done"    && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
          {pair.status === "error"   && <span className="text-xs text-error">{pair.error}</span>}
          {canRemove && (
            <button
              onClick={() => onRemove(pair.id)}
              className="p-1 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sell / Buy row */}
      <div className="flex items-center gap-2">
        {/* Sell amount + token */}
        <div className="flex-1 flex items-center gap-2 bg-bg-secondary rounded-xl px-3 py-2">
          <input
            type="number" placeholder="0" min="0"
            value={pair.sellAmount}
            onChange={e => handleAmountChange(e.target.value)}
            className="w-20 bg-transparent text-base font-semibold text-text-primary
                       placeholder:text-text-muted outline-none min-w-0"
          />
          <TokenSelector
            value={pair.sellToken}
            onChange={handleSellTokenChange}
            excludeToken={pair.buyToken}
          />
        </div>

        <ArrowRight className="w-4 h-4 text-text-muted flex-shrink-0" />

        {/* Buy token + estimated amount */}
        <div className="flex-1 flex items-center gap-2 bg-bg-secondary rounded-xl px-3 py-2">
          <span className="flex-1 text-base font-semibold text-text-primary font-mono">
            {pair.quote?.buyAmount || "0"}
          </span>
          <TokenSelector
            value={pair.buyToken}
            onChange={handleBuyTokenChange}
            excludeToken={pair.sellToken}
          />
        </div>
      </div>

      {/* Quote info */}
      {pair.quote && pair.status === "ready" && (
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>
            ≈ {formatUSD(pair.quote.sellUSD)} → {formatUSD(pair.quote.buyUSD)}
          </span>
          {pair.quote.routes.length > 0 && (
            <span className="flex items-center gap-1">
              {pair.quote.routes.slice(0,2).map((r, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded-full bg-base-blue/10 text-base-blue text-xs">
                  {r}
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {/* tx hash */}
      {pair.txHash && (
        <a href={`https://basescan.org/tx/${pair.txHash}`} target="_blank"
           rel="noopener noreferrer"
           className="mt-1 text-xs text-success flex items-center gap-1 hover:underline">
          <CheckCircle2 className="w-3 h-3" /> Confirmed
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </motion.div>
  );
}

/* ── Main Component ── */
export function MultiSwapCard() {
  const { address, isConnected } = useAccount();
  const { data: walletClient }   = useWalletClient();
  const publicClient             = usePublicClient();
  const { awardXP }              = useUserPoints();

  const [pairs, setPairs] = useState<MultiSwapPair[]>([
    createPair(BASE_TOKENS.ETH,  BASE_TOKENS.USDC),
    createPair(BASE_TOKENS.WETH, BASE_TOKENS.USDT),
  ]);
  const [isSwapping, setIsSwapping] = useState(false);

  const updatePair = useCallback((id: string, updates: Partial<MultiSwapPair>) => {
    setPairs(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addPair = () => {
    if (pairs.length >= 8) {
      toast.info("Maximum 8 swap pairs allowed");
      return;
    }
    setPairs(prev => [...prev, createPair(BASE_TOKENS.ETH, BASE_TOKENS.USDC)]);
  };

  const removePair = (id: string) => {
    setPairs(prev => prev.filter(p => p.id !== id));
  };

  const readyPairs = pairs.filter(p => p.status === "ready" && p.sellAmount && parseFloat(p.sellAmount) > 0);
  const canSwap    = isConnected && readyPairs.length > 0 && !isSwapping;

  const handleMultiSwap = async () => {
    if (!address || !walletClient || !publicClient) return;
    setIsSwapping(true);

    let successCount = 0;
    let totalXP = 0;

    for (const pair of readyPairs) {
      updatePair(pair.id, { status: "swapping" });

      try {
        const sellAmountRaw = parseUnits(pair.sellAmount, pair.sellToken.decimals).toString();
        const params = new URLSearchParams({
          sellToken:  pair.sellToken.address,
          buyToken:   pair.buyToken.address,
          sellAmount: sellAmountRaw,
          taker:      address,
          chainId:    "8453",
          slippageBps:"50",
        });

        const res  = await fetch(`/api/quote?${params}`);
        const data = await res.json();

        if (!res.ok || data.__isMock) {
          toast.error(`Swap #${pairs.indexOf(pair) + 1}: ${data.reason || "Add 0x API key"}`);
          updatePair(pair.id, { status: "error", error: data.reason || "Demo mode" });
          continue;
        }

        const txData = data.transaction || {
          to: data.to, data: data.data,
          gas: data.gas, value: data.value,
        };

        toast.loading(`Swapping ${pair.sellAmount} ${pair.sellToken.symbol} → ${pair.buyToken.symbol}...`,
          { id: `multi-${pair.id}` });

        const txHash = await walletClient.sendTransaction({
          to:    txData.to    as `0x${string}`,
          data:  txData.data  as `0x${string}`,
          value: txData.value ? BigInt(txData.value) : BigInt(0),
          gas:   txData.gas   ? BigInt(txData.gas)   : undefined,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        if (receipt.status === "success") {
          updatePair(pair.id, { status: "done", txHash });
          toast.success(`✅ Swap ${pairs.indexOf(pair) + 1} done!`, { id: `multi-${pair.id}` });
          successCount++;
          const xp = calculateSwapXP(pair.quote?.sellUSD || 0, false);
          totalXP += xp + 25; // +25 XP bonus for multi-swap
        } else {
          updatePair(pair.id, { status: "error", error: "Transaction failed" });
          toast.error(`Swap ${pairs.indexOf(pair) + 1} failed`, { id: `multi-${pair.id}` });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown";
        if (msg.includes("User rejected")) {
          toast.info("Swap cancelled by user");
          updatePair(pair.id, { status: "ready" });
          break; // stop remaining swaps if user rejects
        }
        updatePair(pair.id, { status: "error", error: msg });
        toast.error(`Swap ${pairs.indexOf(pair) + 1} error`, { id: `multi-${pair.id}` });
      }
    }

    if (successCount > 0) {
      confetti({ particleCount: 80 * successCount, spread: 70, origin: { y: 0.6 },
                 colors: ["#0052FF","#00C2FF","#00C896"] });
      toast.success(`🎉 ${successCount}/${readyPairs.length} swaps completed!`);
      if (totalXP > 0) {
        await awardXP(totalXP, "multi_swap");
        toast.success(`+${totalXP} XP earned!`, { icon: "🔵" });
      }
    }

    setIsSwapping(false);
  };

  const totalSellUSD = pairs.reduce((sum, p) => sum + (p.quote?.sellUSD || 0), 0);
  const totalBuyUSD  = pairs.reduce((sum, p) => sum + (p.quote?.buyUSD  || 0), 0);

  if (!isConnected) {
    return (
      <div className="glass-card p-5 w-full text-center">
        <Layers className="w-10 h-10 text-base-blue mx-auto mb-3" />
        <p className="text-text-secondary text-sm mb-4">Connect wallet to use Multi-Swap</p>
        <ConnectButton size="lg" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-base-blue" />
          <h1 className="font-semibold text-text-primary">Multi-Swap</h1>
          <span className="px-1.5 py-0.5 rounded-full bg-base-blue/15 text-base-blue text-xs font-semibold">
            {pairs.length} pairs
          </span>
        </div>
        <button
          onClick={addPair}
          disabled={pairs.length >= 8}
          className="flex items-center gap-1 text-xs text-base-blue hover:text-base-blue-light
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Add Pair
        </button>
      </div>

      {/* Pairs */}
      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {pairs.map((pair, i) => (
            <PairRow
              key={pair.id}
              pair={pair}
              index={i}
              onChange={updatePair}
              onRemove={removePair}
              canRemove={pairs.length > 1}
              takerAddress={address}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      {totalSellUSD > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between px-3 py-2 rounded-lg
                     bg-bg-secondary/50 text-xs text-text-muted mb-3"
        >
          <span>Total value</span>
          <span className="font-mono">
            {formatUSD(totalSellUSD)} → {formatUSD(totalBuyUSD)}
          </span>
        </motion.div>
      )}

      {/* Info */}
      <div className="px-3 py-2 rounded-lg bg-base-blue/8 border border-base-blue/20 text-xs text-text-secondary mb-3">
        Each swap requires a separate wallet confirmation. Swaps execute sequentially.
        If you reject one, the remaining swaps will be cancelled.
      </div>

      {/* CTA */}
      <button
        onClick={handleMultiSwap}
        disabled={!canSwap}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
      >
        {isSwapping ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Executing swaps...</>
        ) : readyPairs.length === 0 ? (
          "Enter amounts to continue"
        ) : (
          <><Zap className="w-4 h-4" /> Execute {readyPairs.length} Swap{readyPairs.length > 1 ? "s" : ""}</>
        )}
      </button>
    </div>
  );
}
