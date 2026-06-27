"use client";

import { useState } from "react";
import { ArrowUpDown, Loader2, CheckCircle2, ExternalLink, Zap, FlaskConical } from "lucide-react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { TokenSelector }    from "./TokenSelector";
import { RouteDisplay }     from "./RouteDisplay";
import { SlippageSettings } from "./SlippageSettings";
import { PriceImpact }      from "./PriceImpact";
import { ConnectButton }    from "@/components/ui/ConnectButton";
import { useSwapQuote }     from "@/hooks/useSwapQuote";
import { useTokenBalance }  from "@/hooks/useTokenBalance";
import { useUserPoints }    from "@/hooks/useUserPoints";
import { BASE_TOKENS } from "@/lib/tokens";import { calculatePriceImpact }           from "@/lib/0x";
import { calculateSwapXP }               from "@/lib/points";
import { formatUSD }                      from "@/lib/utils";
import type { Token } from "@/types/token";

interface SwapCardProps {
  onTokensChange?: (sell: Token, buy: Token) => void;
}

export function SwapCard({ onTokensChange }: SwapCardProps) {
  const { address, isConnected } = useAccount();
  const publicClient             = usePublicClient();
  const { data: walletClient }   = useWalletClient();
  const { awardXP }              = useUserPoints();

  const [sellToken,  setSellTokenState]  = useState<Token>(BASE_TOKENS.ETH);
  const [buyToken,   setBuyTokenState]   = useState<Token>(BASE_TOKENS.USDC);
  const [sellAmount, setSellAmount] = useState("");
  const [slippage,   setSlippage]   = useState(0.5);
  const [deadline,   setDeadline]   = useState(20);
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const setSellToken = (t: Token) => { setSellTokenState(t); onTokensChange?.(t, buyToken); };
  const setBuyToken  = (t: Token) => { setBuyTokenState(t);  onTokensChange?.(sellToken, t); };

  /* ── sell amount in raw units ── */
  const sellAmountRaw =
    sellAmount && sellToken
      ? (() => {
          try { return parseUnits(sellAmount, sellToken.decimals).toString(); }
          catch { return "0"; }
        })()
      : "0";

  const { quote, isLoading: quoteLoading, error: quoteError, dexQuotes, selectedDex, setSelectedDex, effectiveBuyAmount } = useSwapQuote({
    sellToken:    sellToken?.address,
    buyToken:     buyToken?.address,
    sellAmount:   sellAmountRaw,
    takerAddress: address,
    slippageBps:  Math.round(slippage * 100),
    enabled:      !!sellAmount && parseFloat(sellAmount) > 0,
    buyDecimals:  buyToken?.decimals ?? 18,
  });

  const isMock = !!(quote as unknown as Record<string, unknown>)?.__isMock;

  /* ── balances ── */
  const { balanceRaw: sellBalanceRaw, formatted: sellBalanceFormatted } =
    useTokenBalance(sellToken?.address, address);

  /* ── derived values ── */
  const buyAmount = effectiveBuyAmount;

  /* USD estimates from CoinGecko-derived rates */
  const sellRate    = parseFloat(quote?.sellTokenToEthRate || "0");
  const buyRate     = parseFloat(quote?.buyTokenToEthRate  || "0");
  const sellUSD     = sellRate > 0 ? parseFloat(sellAmount || "0") * sellRate : 0;
  const buyUSD      = buyRate  > 0 && buyAmount ? parseFloat(buyAmount) * buyRate  : 0;

  const priceImpact = sellUSD > 0 && buyUSD > 0
    ? calculatePriceImpact(sellUSD, buyUSD)
    : 0;

  const exchangeRate = buyAmount && parseFloat(sellAmount) > 0
    ? parseFloat(buyAmount) / parseFloat(sellAmount)
    : 0;

  /* ── handlers ── */
  const handleSwapTokens = () => {
    const prev = sellToken;
    setSellTokenState(buyToken);
    setBuyTokenState(prev);
    setSellAmount(buyAmount || "");
    onTokensChange?.(buyToken, prev);
  };

  const handleMaxClick = () => {
    if (!sellBalanceRaw || !sellToken) return;
    setSellAmount(parseFloat(formatUnits(sellBalanceRaw, sellToken.decimals)).toFixed(6));
  };

  const handleSwap = async () => {
    if (isMock) {
      toast.error("Add your 0x API key in .env.local to execute real swaps.");
      return;
    }
    if (!quote || !address || !walletClient || !publicClient) return;
    if (priceImpact > 10) { toast.error("Price impact too high (>10%)."); return; }

    setIsSwapping(true);
    try {
      const txData = (quote as unknown as Record<string, unknown>).transaction as Record<string,string> | undefined || {
        to:    quote.to,
        data:  quote.data,
        gas:   quote.gas,
        value: quote.value,
      };

      const txHash = await walletClient.sendTransaction({
        to:    txData.to   as `0x${string}`,
        data:  txData.data as `0x${string}`,
        value: txData.value ? BigInt(txData.value) : BigInt(0),
        gas:   txData.gas   ? BigInt(txData.gas)   : undefined,
      });

      setLastTxHash(txHash);
      toast.loading("Swap pending...", { id: "swap-tx" });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === "success") {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <div>
              <div className="font-semibold">Swap successful!</div>
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank"
                 rel="noopener noreferrer"
                 className="text-xs text-base-blue flex items-center gap-1">
                View on BaseScan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>,
          { id: "swap-tx", duration: 5000 }
        );
        const xpEarned = calculateSwapXP(sellUSD, false);
        if (xpEarned > 0) {
          await awardXP(xpEarned, "swap");
          toast.success(`+${xpEarned} XP earned!`, { icon: "🔵", duration: 3000 });
        }
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 },
                   colors: ["#0052FF","#00C2FF","#00C896"] });
        setSellAmount("");
      } else {
        toast.error("Swap failed.", { id: "swap-tx" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg.includes("User rejected") ? "Transaction rejected" : "Swap failed",
                  { id: "swap-tx" });
    } finally {
      setIsSwapping(false);
    }
  };

  /* ── guards ── */
  const hasInsufficient =
    sellBalanceRaw !== undefined &&
    sellAmount && parseFloat(sellAmount) > 0 &&
    (() => { try { return parseUnits(sellAmount, sellToken?.decimals ?? 18) > sellBalanceRaw; }
             catch { return false; } })();

  const canSwap =
    isConnected && sellAmount && parseFloat(sellAmount) > 0 &&
    buyAmount && !quoteLoading && !hasInsufficient &&
    !isSwapping && priceImpact <= 10;

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="glass-card p-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-base-blue" />
          <h1 className="font-semibold text-text-primary">Swap</h1>
          {isMock && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full
                             bg-warning/15 border border-warning/30 text-warning text-xs font-medium">
              <FlaskConical className="w-2.5 h-2.5" /> Demo
            </span>
          )}
        </div>
        <SlippageSettings slippage={slippage} onChange={setSlippage}
                          deadline={deadline} onDeadlineChange={setDeadline} />
      </div>

      {/* ── You Pay ── */}
      <div className="rounded-xl border border-border bg-bg-tertiary p-3 mb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted font-medium">You Pay</span>
          {isConnected && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-mono">
                {sellBalanceFormatted} {sellToken?.symbol}
              </span>
              <button onClick={handleMaxClick}
                      className="text-xs text-base-blue hover:text-base-blue-light font-semibold px-2 py-1 rounded-lg min-h-[32px]">
                MAX
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number" placeholder="0" min="0"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold text-text-primary
                       placeholder:text-text-muted outline-none min-w-0"
          />
          <TokenSelector value={sellToken} onChange={setSellToken} excludeToken={buyToken} />
        </div>
        {sellUSD > 0 && (
          <div className="mt-1 text-xs text-text-muted">≈ {formatUSD(sellUSD)}</div>
        )}
      </div>

      {/* Swap arrow */}
      <div className="flex justify-center -my-1 z-10 relative">
        <button onClick={handleSwapTokens}
                className="w-10 h-10 rounded-xl border-2 border-bg-primary bg-bg-secondary
                           hover:bg-bg-tertiary hover:border-base-blue/50
                           flex items-center justify-center transition-all group">
          <ArrowUpDown className="w-4 h-4 text-text-muted group-hover:text-base-blue transition-colors" />
        </button>
      </div>

      {/* ── You Receive ── */}
      <div className="rounded-xl border border-border bg-bg-tertiary p-3 mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted font-medium">You Receive</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {quoteLoading
              ? <div className="shimmer h-8 w-32 rounded" />
              : <span className="text-2xl font-semibold text-text-primary">{buyAmount || "0"}</span>
            }
          </div>
          <TokenSelector value={buyToken} onChange={setBuyToken} excludeToken={sellToken} />
        </div>
        {buyUSD > 0 && (
          <div className="mt-1 text-xs text-text-muted">≈ {formatUSD(buyUSD)}</div>
        )}
      </div>

      {/* ── DEX quotes + details ── */}
      <div
        className="mt-2 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: (dexQuotes.length > 0 || quoteLoading) && sellAmount && parseFloat(sellAmount) > 0
            ? "400px" : "0px",
          opacity: (dexQuotes.length > 0 || quoteLoading) && sellAmount && parseFloat(sellAmount) > 0
            ? 1 : 0,
        }}
      >
        <div className="space-y-2 pb-1">
            <RouteDisplay
              dexQuotes={dexQuotes}
              selectedDex={selectedDex}
              onSelect={setSelectedDex}
              buySymbol={buyToken?.symbol ?? ""}
              isLoading={quoteLoading}
            />

            {exchangeRate > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg
                              bg-bg-secondary/50 text-xs text-text-muted">
                <span>Exchange Rate</span>
                <span className="font-mono">
                  1 {sellToken?.symbol} ≈ {exchangeRate.toFixed(4)} {buyToken?.symbol}
                </span>
              </div>
            )}

            {priceImpact > 0 && <PriceImpact impact={priceImpact} />}

            {isMock && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                              bg-warning/8 border border-warning/20 text-xs text-warning">
                <FlaskConical className="w-3 h-3 flex-shrink-0" />
                Demo prices via CoinGecko. Add 0x API key for live quotes & execution.
              </div>
            )}
          </div>
      </div>

      {/* Error */}
      {quoteError && sellAmount && parseFloat(sellAmount) > 0 && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-xs text-error">
          {quoteError}
        </div>
      )}

      {/* ── CTA ── */}
      <div className="mt-3">
        {!isConnected ? (
          <ConnectButton size="lg" />
        ) : hasInsufficient ? (
          <button disabled className="btn-primary w-full py-3.5 text-sm opacity-40 cursor-not-allowed">
            Insufficient {sellToken?.symbol} Balance
          </button>
        ) : priceImpact > 10 ? (
          <button disabled className="btn-primary w-full py-3.5 text-sm opacity-80 cursor-not-allowed"
                  style={{ background: "rgba(255,77,106,0.7)" }}>
            Price Impact Too High
          </button>
        ) : isMock && canSwap ? (
          <button onClick={handleSwap}
                  className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2
                             opacity-80 cursor-pointer">
            <FlaskConical className="w-4 h-4" />
            Demo — Add API Key to Swap
          </button>
        ) : (
          <button onClick={handleSwap} disabled={!canSwap}
                  className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
            {isSwapping ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Swapping...</>
            ) : !sellAmount || parseFloat(sellAmount) === 0 ? (
              "Enter an amount"
            ) : quoteLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Fetching best price...</>
            ) : (
              <><Zap className="w-4 h-4" /> Swap</>
            )}
          </button>
        )}
      </div>

      {/* Last tx link */}
      {lastTxHash && (
        <div className="mt-2 text-center">
          <a href={`https://basescan.org/tx/${lastTxHash}`} target="_blank"
             rel="noopener noreferrer"
             className="text-xs text-base-blue hover:underline flex items-center justify-center gap-1">
            Last tx <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
