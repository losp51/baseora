import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-primary mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-base flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold gradient-text">Baseora</span>
            <span className="text-text-muted text-sm">DEX Aggregator on Base</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-text-secondary">
            <Link href="/swap" className="py-2 px-1 hover:text-text-primary transition-colors">Swap</Link>
            <Link href="/agent" className="py-2 px-1 hover:text-text-primary transition-colors">AI Agent</Link>
            <Link href="/leaderboard" className="py-2 px-1 hover:text-text-primary transition-colors">Leaderboard</Link>
            <a href="https://basescan.org" target="_blank" rel="noopener noreferrer"
               className="py-2 px-1 hover:text-text-primary transition-colors">Explorer</a>
          </div>

          <p className="text-text-muted text-xs">
            Built on{" "}
            <a
              href="https://base.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-blue hover:underline"
            >
              Base
            </a>
            {" "}· Chain ID: 8453
          </p>
        </div>
      </div>
    </footer>
  );
}
