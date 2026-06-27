"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Gift, Copy, CheckCircle2, Trophy, Flame, Zap } from "lucide-react";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { ProgressBar } from "@/components/rewards/ProgressBar";
import { RewardCard } from "@/components/rewards/RewardCard";
import { useUserPoints } from "@/hooks/useUserPoints";
import {
  LEVEL_THRESHOLDS,
  getLevelFromXP,
  type Level,
} from "@/types/reward";
import { XP_REWARDS } from "@/types/reward";

const ALL_LEVELS: Level[] = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Elite",
];

const QUESTS = [
  {
    id: "first_swap",
    label: "First Swap",
    description: "Complete your first swap on Nexus",
    xp: XP_REWARDS.FIRST_SWAP,
    icon: "🔄",
  },
  {
    id: "week_streak",
    label: "7-Day Streak",
    description: "Swap every day for 7 consecutive days",
    xp: XP_REWARDS.WEEK_STREAK,
    icon: "🔥",
  },
  {
    id: "volume_10k",
    label: "$10K Volume",
    description: "Trade $10,000 total volume",
    xp: 200,
    icon: "📊",
  },
  {
    id: "referral",
    label: "First Referral",
    description: "Invite a friend who completes a swap",
    xp: XP_REWARDS.REFERRAL,
    icon: "👥",
  },
  {
    id: "multi_swap",
    label: "Multi-Swap",
    description: "Use the multi-swap feature",
    xp: XP_REWARDS.MULTI_SWAP,
    icon: "⚡",
  },
  {
    id: "agent",
    label: "Ask AI Agent",
    description: "Ask the AI agent a question",
    xp: XP_REWARDS.AGENT_QUERY,
    icon: "🤖",
  },
];

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const { data: userPoints } = useUserPoints();
  const [copied, setCopied] = useState(false);
  const [mintingLevel, setMintingLevel] = useState<Level | null>(null);

  const xp = userPoints?.total_xp ?? 0;
  const level = userPoints?.level ?? "Bronze";
  const progress = userPoints?.level_progress ?? 0;
  const xpToNext = userPoints?.xp_to_next ?? 1000;
  const referralCode = userPoints?.referral_code ?? "NXS000000";
  const referralLink = `https://nexus.app?ref=${referralCode}`;

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  const handleMint = async (nftLevel: Level) => {
    if (!isConnected) {
      toast.error("Connect wallet to mint");
      return;
    }
    setMintingLevel(nftLevel);
    // Simulate mint — in production, call smart contract
    await new Promise((r) => setTimeout(r, 2000));
    toast.success(`${nftLevel} Swapper NFT minted! 🎉`);
    setMintingLevel(null);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-center">
        <div className="glass-card p-12">
          <Gift className="w-12 h-12 text-base-blue mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Connect to view rewards</h2>
          <p className="text-text-secondary text-sm mb-6">
            Connect your wallet to see your XP, levels and claimable NFTs.
          </p>
          <ConnectButton size="lg" className="mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Background */}
      <div
        className="fixed top-1/3 right-1/4 w-[500px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,82,255,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-base-blue/30 bg-base-blue/10 mb-4">
          <Gift className="w-4 h-4 text-base-blue" />
          <span className="text-sm font-medium text-base-blue">Rewards & NFTs</span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Your Rewards
        </h1>
        <p className="text-text-secondary text-sm">
          Earn XP by swapping. Level up. Mint exclusive NFTs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Level progress */}
          <ProgressBar
            level={level}
            xp={xp}
            progress={progress}
            xpToNext={xpToNext}
          />

          {/* Stats */}
          <div className="glass-card p-4 grid grid-cols-2 gap-3">
            {[
              { label: "Streak", value: `${userPoints?.streak_days ?? 0}d`, icon: <Flame className="w-4 h-4 text-warning" /> },
              { label: "Swaps", value: userPoints?.swap_count ?? 0, icon: <Zap className="w-4 h-4 text-base-blue" /> },
              { label: "Volume", value: `$${(userPoints?.total_volume_usd ?? 0).toLocaleString()}`, icon: <Trophy className="w-4 h-4 text-success" /> },
              { label: "Referrals", value: userPoints?.referral_count ?? 0, icon: <Gift className="w-4 h-4 text-purple-400" /> },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 p-2 rounded-xl bg-bg-tertiary">
                {stat.icon}
                <div>
                  <div className="text-sm font-bold text-text-primary">{stat.value}</div>
                  <div className="text-xs text-text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Referral */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-base-blue" />
              Referral Program
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Earn +1000 XP when a friend swaps using your link
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-bg-tertiary border border-border">
              <span className="font-mono text-xs text-text-secondary flex-1 truncate">
                {referralLink}
              </span>
              <button
                onClick={copyReferral}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-bg-secondary transition-all"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-text-muted" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* NFTs */}
          <div>
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <span>🎖️</span> Level NFTs
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_LEVELS.map((nftLevel) => {
                const unlocked = xp >= LEVEL_THRESHOLDS[nftLevel];
                return (
                  <RewardCard
                    key={nftLevel}
                    level={nftLevel}
                    unlocked={unlocked}
                    minted={false}
                    onMint={() => handleMint(nftLevel)}
                    isLoading={mintingLevel === nftLevel}
                  />
                );
              })}
            </div>
          </div>

          {/* Quests */}
          <div>
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <span>⚔️</span> Quests
            </h2>
            <div className="space-y-2">
              {QUESTS.map((quest) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <span className="text-2xl">{quest.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-text-primary">
                      {quest.label}
                    </div>
                    <div className="text-xs text-text-muted">
                      {quest.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold gradient-text font-mono">
                      +{quest.xp} XP
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
