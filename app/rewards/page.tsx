"use client";

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { Gift, Copy, CheckCircle2, Flame, Zap, Star, Trophy, ExternalLink } from "lucide-react";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { ProgressBar } from "@/components/rewards/ProgressBar";
import { RewardCard } from "@/components/rewards/RewardCard";
import { useUserPoints } from "@/hooks/useUserPoints";
import { LEVEL_THRESHOLDS, type Level } from "@/types/reward";

const ALL_LEVELS: Level[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite"];

/* Contract ABI — only mint function */
const MINT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "level",       type: "uint8"   },
      { name: "totalVolume", type: "uint256" },
      { name: "swapCount",   type: "uint256" },
      { name: "signature",   type: "bytes"   },
    ],
    outputs: [],
  },
  {
    name: "hasMinted",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint8"   },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const LEVEL_INDEX: Record<Level, number> = {
  Bronze: 0, Silver: 1, Gold: 2, Platinum: 3, Diamond: 4, Elite: 5,
};

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "") as `0x${string}`;

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient }   = useWalletClient();
  const publicClient             = usePublicClient();
  const { data: userPoints }     = useUserPoints();

  const [copied,       setCopied]       = useState(false);
  const [mintingLevel, setMintingLevel] = useState<Level | null>(null);
  const [mintedLevels, setMintedLevels] = useState<Set<Level>>(new Set());
  const [lastTxHash,   setLastTxHash]   = useState<string | null>(null);

  const xp           = userPoints?.total_xp ?? 0;
  const level        = userPoints?.level ?? "Bronze";
  const progress     = userPoints?.level_progress ?? 0;
  const xpToNext     = userPoints?.xp_to_next ?? 1000;
  const referralCode = userPoints?.referral_code ?? "NXS000000";
  const referralLink = `https://baseora.app?ref=${referralCode}`;

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  const handleMint = async (nftLevel: Level) => {
    if (!isConnected || !address) { toast.error("Connect wallet to mint"); return; }
    if (!walletClient || !publicClient) return;

    setMintingLevel(nftLevel);
    try {
      const totalVolumeCents = Math.floor((userPoints?.total_volume_usd ?? 0) * 1e6);
      const swapCount        = userPoints?.swap_count ?? 0;

      // 1. Get signature from backend
      const sigRes = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          level:  nftLevel,
          totalVolume: totalVolumeCents,
          swapCount,
        }),
      });
      const { signature, demo, message } = await sigRes.json();

      if (demo) {
        // Demo mode — no contract deployed yet
        toast.info(`Demo mint: ${nftLevel} NFT. ${message || "Deploy contract to enable real minting."}`);
        setMintedLevels(prev => new Set([...prev, nftLevel]));
        return;
      }

      if (!CONTRACT_ADDRESS) {
        toast.error("NFT contract not deployed yet. Set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS in .env");
        return;
      }

      // 2. Send tx
      toast.loading(`Minting ${nftLevel} NFT...`, { id: "mint-tx" });
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi:     MINT_ABI,
        functionName: "mint",
        args: [
          LEVEL_INDEX[nftLevel],
          BigInt(totalVolumeCents),
          BigInt(swapCount),
          signature as `0x${string}`,
        ],
      });

      setLastTxHash(txHash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === "success") {
        toast.success(`🎉 ${nftLevel} Swapper NFT minted!`, { id: "mint-tx", duration: 6000 });
        setMintedLevels(prev => new Set([...prev, nftLevel]));
      } else {
        toast.error("Mint failed", { id: "mint-tx" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg.includes("User rejected") ? "Mint cancelled" : `Mint failed: ${msg.slice(0, 60)}`,
                  { id: "mint-tx" });
    } finally {
      setMintingLevel(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="glass-card p-10">
          <Gift className="w-10 h-10 text-base-blue mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Connect to view rewards</h2>
          <p className="text-text-secondary text-sm mb-6">
            Track your XP, level up, and mint exclusive NFTs.
          </p>
          <ConnectButton size="lg" className="mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Rewards</h1>
        <p className="text-text-secondary text-sm">Earn XP by trading. Level up. Mint NFTs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left sidebar ── */}
        <div className="space-y-3">
          <ProgressBar level={level} xp={xp} progress={progress} xpToNext={xpToNext} />

          <div className="glass-card p-3 grid grid-cols-2 gap-2">
            {[
              { label: "Streak",    value: `${userPoints?.streak_days ?? 0}d`, icon: <Flame  className="w-3.5 h-3.5 text-warning" /> },
              { label: "Swaps",     value: userPoints?.swap_count ?? 0,         icon: <Zap    className="w-3.5 h-3.5 text-base-blue" /> },
              { label: "Volume",    value: `$${(userPoints?.total_volume_usd ?? 0).toLocaleString()}`, icon: <Trophy className="w-3.5 h-3.5 text-success" /> },
              { label: "Referrals", value: userPoints?.referral_count ?? 0,     icon: <Gift   className="w-3.5 h-3.5 text-purple-400" /> },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary">
                {stat.icon}
                <div>
                  <div className="text-xs font-bold text-text-primary">{stat.value}</div>
                  <div className="text-xs text-text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-3.5 h-3.5 text-base-blue" />
              <span className="text-sm font-semibold">Referral Program</span>
            </div>
            <p className="text-xs text-text-muted mb-2">+1000 XP per friend who swaps</p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary border border-border">
              <span className="font-mono text-xs text-text-secondary flex-1 truncate">{referralLink}</span>
              <button onClick={copyReferral} className="flex-shrink-0 p-1 rounded-md hover:bg-bg-secondary">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: NFT Grid ── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" />
              <h2 className="font-bold text-sm text-text-primary uppercase tracking-wide">Mint Level NFTs</h2>
            </div>
            <span className="text-xs text-text-muted">Unlock by reaching XP thresholds</span>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-base-blue/8 border border-base-blue/20 mb-3 text-xs text-text-secondary">
            <span className="flex-shrink-0">🎖️</span>
            <span>Each level unlocks an exclusive on-chain NFT on Base. Mint for ~$0.05 in gas.</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ALL_LEVELS.map(nftLevel => (
              <RewardCard
                key={nftLevel}
                level={nftLevel}
                unlocked={xp >= LEVEL_THRESHOLDS[nftLevel]}
                minted={mintedLevels.has(nftLevel)}
                onMint={() => handleMint(nftLevel)}
                isLoading={mintingLevel === nftLevel}
              />
            ))}
          </div>

          {lastTxHash && (
            <a
              href={`https://basescan.org/tx/${lastTxHash}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 text-xs text-success hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View last mint on BaseScan
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
