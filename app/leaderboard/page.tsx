"use client";

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Trophy, Zap, Info, Gift, Copy, CheckCircle2,
  Flame, Star, ExternalLink, Lock, Sparkles,
} from "lucide-react";
import { LeaderboardTable }  from "@/components/leaderboard/LeaderboardTable";
import { LevelBadge }        from "@/components/leaderboard/RankBadge";
import { ProgressBar }       from "@/components/rewards/ProgressBar";
import { ConnectButton }     from "@/components/ui/ConnectButton";
import { useLeaderboard }    from "@/hooks/useLeaderboard";
import { useUserPoints }     from "@/hooks/useUserPoints";
import { formatXP }          from "@/lib/points";
import { shortenAddress }    from "@/lib/utils";
import { LEVEL_THRESHOLDS, LEVEL_COLORS, XP_REWARDS, type Level } from "@/types/reward";
import { getLevelEmoji }     from "@/lib/points";

const ALL_LEVELS: Level[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite"];

const XP_SOURCES = [
  { icon: "🔄", label: "Each Swap",    desc: "Per $100 traded",      xp: XP_REWARDS.PER_100_USD, color: "#0052FF" },
  { icon: "📅", label: "Daily Swap",   desc: "Swap once/day",        xp: XP_REWARDS.DAILY_SWAP,  color: "#00C2FF" },
  { icon: "🔥", label: "7-Day Streak", desc: "7 consecutive days",   xp: XP_REWARDS.WEEK_STREAK, color: "#FF6B35" },
  { icon: "⚡", label: "First Swap",   desc: "One-time bonus",       xp: XP_REWARDS.FIRST_SWAP,  color: "#FFB547" },
  { icon: "👥", label: "Referral",     desc: "Per friend who swaps", xp: XP_REWARDS.REFERRAL,    color: "#9B59B6" },
  { icon: "🤖", label: "AI Agent",     desc: "Per conversation",     xp: XP_REWARDS.AGENT_QUERY, color: "#00C896" },
];

const MINT_ABI = [{
  name: "mint", type: "function", stateMutability: "nonpayable",
  inputs: [
    { name: "level", type: "uint8" }, { name: "totalVolume", type: "uint256" },
    { name: "swapCount", type: "uint256" }, { name: "signature", type: "bytes" },
  ],
  outputs: [],
}] as const;

const LEVEL_INDEX: Record<Level, number> = {
  Bronze: 0, Silver: 1, Gold: 2, Platinum: 3, Diamond: 4, Elite: 5,
};
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "") as `0x${string}`;

function MiniNFTCard({ level, unlocked, minted, isLoading, onMint }: {
  level: Level; unlocked: boolean; minted: boolean; isLoading: boolean; onMint: () => void;
}) {
  const color = LEVEL_COLORS[level];
  const emoji = getLevelEmoji(level);
  return (
    <div className="rounded-xl border p-2 flex flex-col items-center gap-1 transition-all"
         style={{ borderColor: unlocked ? `${color}40` : "var(--border)", background: unlocked ? `${color}08` : undefined, opacity: unlocked ? 1 : 0.45 }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg relative"
           style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        {emoji}
        {!unlocked && <div className="absolute inset-0 rounded-xl bg-bg-primary/50 flex items-center justify-center"><Lock className="w-3 h-3 text-text-muted" /></div>}
        {minted && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success flex items-center justify-center"><span className="text-white text-xs leading-none">✓</span></div>}
      </div>
      <span className="text-xs font-semibold text-text-primary">{level}</span>
      {unlocked && !minted
        ? <button onClick={onMint} disabled={isLoading}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-0.5 min-h-[32px]"
                  style={{ background: `linear-gradient(135deg,${color},${color}99)` }}>
            <Sparkles className="w-2.5 h-2.5" />{isLoading ? "…" : "Mint"}
          </button>
        : minted
        ? <span className="text-xs text-success">✓ Minted</span>
        : <span className="text-xs text-text-muted font-mono">{LEVEL_THRESHOLDS[level].toLocaleString()}</span>
      }
    </div>
  );
}

export default function LeaderboardPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient }   = useWalletClient();
  const publicClient             = usePublicClient();
  const { leaderboard, userEntry, isLoading } = useLeaderboard();
  const { data: userPoints }     = useUserPoints();

  const [copied,       setCopied]       = useState(false);
  const [mintingLevel, setMintingLevel] = useState<Level | null>(null);
  const [mintedLevels, setMintedLevels] = useState<Set<Level>>(new Set());
  const [lastTxHash,   setLastTxHash]   = useState<string | null>(null);

  const xp       = userPoints?.total_xp ?? 0;
  const level    = userPoints?.level    ?? "Bronze";
  const progress = userPoints?.level_progress ?? 0;
  const xpToNext = userPoints?.xp_to_next     ?? 1000;
  const refLink  = `https://baseora.app?ref=${userPoints?.referral_code ?? "NXS000000"}`;

  const copyRef = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const handleMint = async (nftLevel: Level) => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast.error("Connect wallet to mint"); return;
    }
    setMintingLevel(nftLevel);
    try {
      const vol   = Math.floor((userPoints?.total_volume_usd ?? 0) * 1e6);
      const swaps = userPoints?.swap_count ?? 0;
      const sigRes = await fetch("/api/mint", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, level: nftLevel, totalVolume: vol, swapCount: swaps }),
      });
      const { signature, demo, message } = await sigRes.json();
      if (demo) { toast.info(`Demo: ${message || "Deploy contract for real minting."}`); setMintedLevels(p => new Set([...p, nftLevel])); return; }
      if (!CONTRACT_ADDRESS) { toast.error("NFT contract not deployed"); return; }
      toast.loading(`Minting ${nftLevel}…`, { id: "mint" });
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS, abi: MINT_ABI, functionName: "mint",
        args: [LEVEL_INDEX[nftLevel], BigInt(vol), BigInt(swaps), signature as `0x${string}`],
      });
      setLastTxHash(tx);
      const r = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (r.status === "success") { toast.success(`🎉 ${nftLevel} NFT minted!`, { id: "mint" }); setMintedLevels(p => new Set([...p, nftLevel])); }
      else toast.error("Mint failed", { id: "mint" });
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "";
      toast.error(m.includes("rejected") ? "Cancelled" : "Mint failed", { id: "mint" });
    } finally { setMintingLevel(null); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-base-blue/30 bg-base-blue/10 mb-3">
          <Trophy className="w-3.5 h-3.5 text-base-blue" />
          <span className="text-xs font-medium text-base-blue">Global Rankings</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Leaderboard</h1>
        <p className="text-text-secondary text-sm">Top traders on Base, ranked by XP</p>
      </motion.div>

      {/* ── Top section: table left, panel right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-start mb-6">

        {/* Table */}
        <div className="min-w-0">
          <LeaderboardTable data={leaderboard} currentWallet={address} isLoading={isLoading} />
          {address && userEntry && (
            <div className="sticky bottom-4 mt-3 z-10">
              <div className="glass-card px-3 py-2 flex items-center gap-2.5 backdrop-blur-xl"
                   style={{ borderColor: "rgba(0,82,255,0.35)" }}>
                <span className="text-xs font-bold text-base-blue font-mono w-7 text-center">#{userEntry.rank}</span>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="font-mono text-xs text-text-primary truncate">{shortenAddress(address)}</span>
                  <span className="text-base-blue text-xs">(You)</span>
                  <LevelBadge level={userEntry.level as Level} />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Zap className="w-3 h-3 text-base-blue" />
                  <span className="text-xs font-bold gradient-text font-mono">{formatXP(userEntry.total_xp)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* XP / connect */}
          {isConnected
            ? <ProgressBar level={level} xp={xp} progress={progress} xpToNext={xpToNext} />
            : <div className="glass-card p-4 text-center">
                <Trophy className="w-7 h-7 text-base-blue mx-auto mb-2" />
                <p className="text-xs text-text-muted mb-3">Connect to see your XP & mint NFTs</p>
                <ConnectButton size="sm" />
              </div>
          }

          {/* Stats */}
          {isConnected && (
            <div className="glass-card p-3 grid grid-cols-2 gap-2">
              {[
                { label: "Streak", value: `${userPoints?.streak_days ?? 0}d`, icon: <Flame className="w-3 h-3 text-warning" /> },
                { label: "Swaps",  value: userPoints?.swap_count ?? 0,         icon: <Zap   className="w-3 h-3 text-base-blue" /> },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-bg-tertiary">
                  {s.icon}
                  <div><div className="text-xs font-bold text-text-primary">{s.value}</div><div className="text-xs text-text-muted">{s.label}</div></div>
                </div>
              ))}
            </div>
          )}

          {/* NFT mint */}
          <div className="glass-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs font-bold text-text-primary">Level NFTs</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_LEVELS.map(n => (
                <MiniNFTCard key={n} level={n}
                  unlocked={isConnected && xp >= LEVEL_THRESHOLDS[n]}
                  minted={mintedLevels.has(n)}
                  isLoading={mintingLevel === n}
                  onMint={() => handleMint(n)} />
              ))}
            </div>
            {lastTxHash && (
              <a href={`https://basescan.org/tx/${lastTxHash}`} target="_blank" rel="noopener noreferrer"
                 className="mt-2 flex items-center justify-center gap-1 text-xs text-success hover:underline">
                <ExternalLink className="w-3 h-3" /> BaseScan
              </a>
            )}
          </div>

          {/* Referral */}
          {isConnected && (
            <div className="glass-card p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Gift className="w-3.5 h-3.5 text-base-blue" />
                <span className="text-xs font-semibold">Referral</span>
                <span className="ml-auto text-xs text-success font-mono">+1000 XP</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-bg-tertiary border border-border">
                <span className="font-mono text-xs text-text-secondary flex-1 truncate">{refLink}</span>
                <button onClick={copyRef} className="flex-shrink-0 p-0.5 rounded hover:bg-bg-secondary">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── How to Earn XP — full width ── */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-base-blue" />
          <h2 className="font-bold text-sm text-text-primary">How to Earn XP</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {XP_SOURCES.map(s => (
            <div key={s.label}
                 className="glass-card p-3 flex flex-col items-center text-center gap-2"
                 style={{ borderColor: `${s.color}20` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                   style={{ background: `${s.color}15`, border: `1px solid ${s.color}20` }}>
                {s.icon}
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary leading-tight">{s.label}</div>
                <div className="text-xs text-text-muted mt-0.5 leading-tight">{s.desc}</div>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full mt-auto"
                    style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}20` }}>
                +{s.xp}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
