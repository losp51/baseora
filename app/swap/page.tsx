"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Target, Layers } from "lucide-react";
import { SwapCard }       from "@/components/swap/SwapCard";
import { LimitOrderCard } from "@/components/swap/LimitOrderCard";
import { MultiSwapCard }  from "@/components/swap/MultiSwapCard";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "swap",    label: "Swap",        icon: Zap,    desc: "Best price across DEXs" },
  { id: "limit",   label: "Limit Order", icon: Target, desc: "Auto-execute at target price" },
  { id: "multi",   label: "Multi-Swap",  icon: Layers, desc: "Swap multiple pairs at once" },
] as const;

type TabId = typeof TABS[number]["id"];

/* card width per tab — multi-swap needs more room */
const CARD_WIDTH: Record<TabId, string> = {
  swap:  "440px",
  limit: "440px",
  multi: "540px",
};

export default function SwapPage() {
  const [activeTab, setActiveTab] = useState<TabId>("swap");
  const maxW = CARD_WIDTH[activeTab];

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-8 px-4"
      style={{ position: "relative", zIndex: 1 }}
    >
      {/* Background glow overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0,82,255,0.13) 0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(0,194,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 35% 35% at 15% 70%, rgba(0,82,255,0.07) 0%, transparent 55%)
          `,
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-1.5">
          Best prices, <span className="gradient-text">always.</span>
        </h1>
        <p className="text-text-secondary text-sm">
          Aggregating Uniswap V3, Aerodrome, SushiSwap and more on Base.
        </p>
      </div>

      {/* Wrapper — everything shares the same max-width */}
      <motion.div
        animate={{ maxWidth: maxW }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full"
      >
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-2xl border border-border bg-bg-secondary mb-2">
          {TABS.map(tab => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl",
                  "text-sm font-medium transition-all",
                  isActive
                    ? "text-white"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-base"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <Icon className={cn("w-3.5 h-3.5 relative z-10 flex-shrink-0", isActive ? "text-white" : "")} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <p className="text-text-muted text-xs mb-3 text-center">
          {TABS.find(t => t.id === activeTab)?.desc}
        </p>

        {/* Card content — fills the wrapper width */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "swap"  && <SwapCard />}
          {activeTab === "limit" && <LimitOrderCard />}
          {activeTab === "multi" && <MultiSwapCard />}
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 flex items-center gap-8 text-center">
        {[
          { label: "DEX Sources", value: "10+" },
          { label: "Chain",       value: "Base" },
          { label: "Aggregator",  value: "0x v2" },
        ].map(stat => (
          <div key={stat.label}>
            <div className="text-base font-bold gradient-text">{stat.value}</div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
